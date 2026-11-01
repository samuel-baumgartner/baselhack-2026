import assert from "node:assert/strict";
import test from "node:test";
import { openSession,runCommand } from "./store";
test("file storage serializes exact reservation retries, retrieves latest and isolates sessions",async()=>{
 let s=await openSession();const id=s.sessionId;
 s=await runCommand(id,{name:"get_booking_quote",roomId:"river-double",expectedRevision:s.revision});
 const cmd={name:"reserve_demo_stay",quoteId:s.quote!.id,operationId:"durable-retry-test",expectedRevision:s.revision,confirmed:true};
 const [a,b]=await Promise.all([runCommand(id,cmd),runCommand(id,cmd)]);
 assert.equal(a.reservation!.reference,b.reservation!.reference);
 const stored=await runCommand(id,{name:"get_stay_session"});assert.equal(stored.reservations.length,1);assert.equal(stored.latestReservation!.reference,a.reservation!.reference);
 const preferences=await runCommand(id,{name:"set_guest_preferences",expectedRevision:stored.revision,localTips:true});assert.equal(preferences.preferences.localTips,true);
 assert.equal((await runCommand(id,{name:"get_guest_preferences"})).preferences.localTips,true);
 const separate=await openSession();assert.notEqual(separate.sessionId,id);assert.equal(separate.preferences.localTips,false);assert.equal(separate.latestReservation,null);
 await assert.rejects(runCommand(separate.sessionId,{name:"get_reservation",reservationId:a.reservation!.reference}),/belongs to this stay session/);
});
