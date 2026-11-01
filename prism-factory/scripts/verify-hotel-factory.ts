import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {smokeHotelApp} from '../worker/hotel-smoke';
import {treeHash} from '../worker/source-build';
import {platforms} from '../lib/platform-targets';
import type {Job} from '../lib/contracts';
const origin='http://127.0.0.1:3040';
const checks:string[]=[];
function pass(s:string){checks.push(s);console.log('PASS',s)}
const response=await fetch(`${origin}/api/jobs`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify({url:'https://www.krafftbasel.ch/en/'})});
let job=await response.json() as Job;assert.equal(response.status,200,JSON.stringify(job));
const cookie=response.headers.get('set-cookie')!.split(';')[0];
async function wait(stage:string){let prev='';const limit=Date.now()+900000;while(Date.now()<limit){job=await(await fetch(`${origin}/api/jobs/${job.id}`)).json();if(job.stage!==prev){console.log(job.id,job.stage);prev=job.stage}if(job.stage==='failed')throw Error(job.error);if(job.stage===stage)return;await new Promise(r=>setTimeout(r,1000))}throw Error('Deadline exceeded')}
await wait('selection');assert.equal(job.profile!.industry,'hotel');assert.ok(job.profile!.name.includes('Krafft'));pass('Official hotel URL classified and hotel flows recommended');
const selection=await fetch(`${origin}/api/jobs/${job.id}/selection`,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin,Cookie:cookie},body:JSON.stringify({selected:['discover','purchase','updates']})});assert.equal(selection.status,200,await selection.text());
await wait('ready');assert.ok(job.generatedApp);assert.ok(job.threadId!==job.reviewThreadId);assert.ok(job.checks?.every(c=>c.passed));pass('Planner, separate review, source generation, isolated build and real MCP acceptance complete');
const app=job.generatedApp!;assert.equal(await treeHash(app.directory),app.sourceHash);const source=await readFile(`${app.directory}/components/merchant-experience.tsx`,'utf8');assert.match(source,/HotelView/);assert.doesNotMatch(source,/RetailView|headphones/i);pass('Generated TSX uses hotel template and recorded hash matches actual built source');
await smokeHotelApp(`http://127.0.0.1:${app.port}`,job.selected);pass('Independent generated app: room filters, official images, synthetic reservation, replay, latest receipt, saved preferences and isolation');
await smokeHotelApp(origin,job.selected,`/apps/${job.id}/mcp`);pass('Neon public runtime: same full hotel MCP acceptance plus stale/date errors');
for(const target of platforms){const res=await fetch(`${origin}/api/jobs/${job.id}/integrations/${target.id}`);if(target.capability==='preview'){assert.equal(res.status,404);continue}assert.equal(res.status,200);const text=await res.text();assert.ok(text.includes(`/apps/${job.id}/mcp`));if(['cursor','vscode'].includes(target.id))JSON.parse(text);assert.match(res.headers.get('content-disposition')??'',/attachment/)}pass('Eight real connection artifacts and explicit unsupported Grok rejection');
await mkdir('docs/verification',{recursive:true});await writeFile('docs/verification/hotel-factory.json',JSON.stringify({jobId:job.id,checks,generatedApp:app,accountHostsVerified:false},null,2));console.log('COMPLETE',app.previewUrl,`/company/${job.id}`);
