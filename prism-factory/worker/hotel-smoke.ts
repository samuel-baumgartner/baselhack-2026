import assert from "node:assert/strict";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import type { FlowId } from "../lib/contracts";
import type { Snapshot } from "../lib/hotel/stay";
export async function smokeHotelApp(origin:string,flows:FlowId[], endpoint = "/mcp") {
 const client=new Client({name:"prism-hotel-source-verifier",version:"1.0"});
 try {
  await client.connect(new StreamableHTTPClientTransport(new URL(endpoint,origin)));
  const names=["search_rooms","get_stay_session","update_stay_filters","get_room",...(flows.includes("purchase")?["get_booking_quote","reserve_demo_stay","get_reservation"]:[]),...(flows.includes("updates")?["get_guest_updates","get_guest_preferences","set_guest_preferences"]:[])];
  assert.deepEqual((await client.listTools()).tools.map(t=>t.name).sort(),names.sort());
  const invoke=async(name:string,args:Record<string,unknown>={})=>{
   const result=await client.callTool({name,arguments:args});
   const data=result.structuredContent as {ok:boolean,state:Snapshot,error?:unknown};
   assert.equal(data.ok,true,JSON.stringify(data.error));return data.state;
  };
  let state=await invoke("search_rooms");const sessionId=state.sessionId;
  state=await invoke("update_stay_filters",{sessionId,expectedRevision:state.revision,patch:{maxNightlyMinor:25000,adults:2}});
  assert.deepEqual(state.rooms.map(r=>r.id),["city-double"]);
  const stale=await client.callTool({name:"update_stay_filters",arguments:{sessionId,expectedRevision:0,patch:{adults:1}}});
  assert.equal(stale.isError,true);assert.equal((stale.structuredContent as {error:{code:string}}).error.code,"STALE_REVISION");
  const invalid=await client.callTool({name:"update_stay_filters",arguments:{sessionId,expectedRevision:state.revision,patch:{checkIn:"2030-02-30"}}});
  assert.equal(invalid.isError,true);assert.equal((invalid.structuredContent as {error:{code:string}}).error.code,"INVALID_DATES");
  for(const image of [state.hotel.logo,...state.allRooms.map(r=>r.image)]) {
   const response=await fetch(new URL(new URL(image).pathname,origin));assert.equal(response.status,200);assert.match(response.headers.get("content-type")??"",/^image\//);assert.ok((await response.arrayBuffer()).byteLength>1000);
  }
  state=await invoke("update_stay_filters",{sessionId,expectedRevision:state.revision,patch:{view:"river",maxNightlyMinor:30000}});
  assert.deepEqual(state.rooms.map(r=>r.id),["river-double"]);
  let latestOrderId:string|undefined;
  if(flows.includes("purchase")) {
   state=await invoke("get_booking_quote",{sessionId,expectedRevision:state.revision,roomId:"river-double"});
   assert.equal(state.quote!.totalMinor,state.nights*27000);
   const request={sessionId,expectedRevision:state.revision,quoteId:state.quote!.id,operationId:"factory-hotel-acceptance",confirmed:true};
   state=await invoke("reserve_demo_stay",request);latestOrderId=state.reservation!.reference;
   assert.equal(state.reservation!.status,"synthetic-no-charge");assert.equal((await invoke("reserve_demo_stay",request)).reservation!.reference,latestOrderId);
   state=await invoke("get_stay_session",{sessionId});assert.equal(state.latestReservation!.reference,latestOrderId);
   assert.equal((await invoke("get_reservation",{sessionId})).reservation!.reference,latestOrderId);
  }
  if(flows.includes("updates")) {
   state=await invoke("set_guest_preferences",{sessionId,expectedRevision:state.revision,localTips:true,arrivalReminder:true});
   assert.equal((await invoke("get_guest_preferences",{sessionId})).preferences.localTips,true);
   const updates=await invoke("get_guest_updates",{sessionId});assert.ok(updates.updates.length>=3);assert.equal(updates.push.enabled,false);
  }
  const resources=await client.listResources();const resource=await client.readResource({uri:resources.resources[0].uri});const html=resource.contents.find(c=>"text"in c)?.text;assert.ok(html);
  assert.match(html,/id="root"/);
  for(const match of html.matchAll(/(?:href|src)="([^\"]+\.(?:js|css))"/g)) {const response=await fetch(new URL(new URL(match[1]).pathname,origin));assert.equal(response.status,200);await response.arrayBuffer();}
  const separate=await invoke("search_rooms");assert.notEqual(separate.sessionId,sessionId);assert.equal(separate.latestReservation,null);assert.equal(separate.preferences.localTips,false);
  return {sessionId,latestOrderId};
 } finally {await client.close();}
}
