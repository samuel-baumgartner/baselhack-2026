import urllib.request,urllib.error,http.cookiejar,json,time,os,subprocess
base='https://prism.mvps.ch';jar=http.cookiejar.CookieJar();opener=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar));checks=[]
def call(path,body=None):
 req=urllib.request.Request(base+path,data=json.dumps(body).encode() if body is not None else None,headers={'Content-Type':'application/json'})
 return json.load(opener.open(req))
def wait(id,terminal):
 end=time.time()+200
 while time.time()<end:
  j=call('/api/jobs/'+id)
  if j['stage'] in terminal:return j
  time.sleep(2)
 raise Exception('Stage timed out')
j=call('/api/jobs',{'url':'https://www.galaxus.ch'});id=j['id'];j=wait(id,['selection','failed']);assert j['stage']=='selection',j.get('error')
call('/api/jobs/'+id+'/selection',{'selected':['discover']});j=wait(id,['building','ready','failed']);
if j['stage']=='building':
 subprocess.run(['systemctl','--user','restart','prism-factory-worker.service'],check=True)
 j=wait(id,['failed']);checks.append({'name':'Worker interruption preserves job and fails explicitly','passed':True})
 call('/api/jobs/'+id+'/action',{'action':'retry'})
 j=wait(id,['ready','failed'])
 assert sum(e['title']=='A thoughtful second look' for e in j['events'])==1
 checks.append({'name':'Retry reuses existing review instead of reviewing twice','passed':True})
assert j['stage']=='ready',j.get('error');checks.append({'name':'Fresh discovery-only production build completes','passed':True,'id':id})
s=call('/api/retail/'+id,{'name':'search_products'})['state']
try:call('/api/retail/'+id,{'name':'get_cart','sessionId':s['sessionId']});raise Exception('Disabled flow unexpectedly allowed')
except urllib.error.HTTPError as e:assert e.code==400
checks.append({'name':'Deselected purchasing rejected server-side','passed':True})
# A private HTTPS URL is rejected by the worker without making a private request.
f=call('/api/jobs',{'url':'https://127.0.0.1'});failed=wait(f['id'],['failed']);assert 'Private' in failed.get('error','');checks.append({'name':'Private-address analysis fails explicitly','passed':True})
# Stop during analysis/selection, then resume the saved job in the creator browser.
c=call('/api/jobs',{'url':'https://www.galaxus.ch'});call('/api/jobs/'+c['id']+'/action',{'action':'cancel'});assert call('/api/jobs/'+c['id'])['stage']=='cancelled';checks.append({'name':'Creator can cancel build','passed':True})
call('/api/jobs/'+c['id']+'/action',{'action':'retry'});assert wait(c['id'],['selection','failed'])['stage']=='selection';checks.append({'name':'Cancelled investigation can retry','passed':True})
open('docs/verification/lifecycle-checks.json','w').write(json.dumps(checks,indent=2));print(json.dumps(checks,indent=2))
