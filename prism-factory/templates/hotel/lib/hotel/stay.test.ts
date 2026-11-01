import assert from "node:assert/strict";
import test from "node:test";
import { newState, execute, snapshot, DomainError } from "./stay";
function stay() { const s=newState();s.filters.checkIn="2030-06-10";s.filters.checkOut="2030-06-12";return s; }
test("calendar, past dates, guest counts and length are validated",()=>{
 for(const patch of [{checkIn:"2030-02-30"},{checkOut:"2030-06-10"},{checkOut:"2030-07-10"},{checkIn:"2000-01-01",checkOut:"2000-01-02"},{adults:0}]) assert.throws(()=>execute(stay(),{name:"update_stay_filters",expectedRevision:0,patch}),DomainError);
});
test("budget, guests and view select actual hotel categories",()=>{
 let s=execute(stay(),{name:"update_stay_filters",expectedRevision:0,patch:{maxNightlyMinor:25000}}).state;
 assert.deepEqual(snapshot(s).rooms.map(r=>r.id),["city-double"]);
 s=execute(s,{name:"update_stay_filters",expectedRevision:s.revision,patch:{maxNightlyMinor:30000,view:"river"}}).state;
 assert.deepEqual(snapshot(s).rooms.map(r=>r.id),["river-double"]);
});
test("reviewed quote arithmetic, explicit confirmation, exact retry and latest receipt",()=>{
 let s=execute(stay(),{name:"get_booking_quote",roomId:"river-double",expectedRevision:0}).state;
 assert.equal(s.quote!.totalMinor,54000);
 const cmd={name:"reserve_demo_stay",quoteId:s.quote!.id,operationId:"test-reservation-1",expectedRevision:s.revision,confirmed:true};
 assert.throws(()=>execute(s,{...cmd,confirmed:false}),/Explicit confirmation/);
 const placed=execute(s,cmd);s=placed.state;
 assert.equal(s.quote,null);assert.equal(s.reservations.length,1);
 assert.equal(execute(s,cmd).reservation!.reference,placed.reservation!.reference);
 assert.equal(snapshot(execute(s,{name:"get_stay_session"}).state).latestReservation!.reference,placed.reservation!.reference);
 assert.throws(()=>execute(s,{...cmd,quoteId:"wrong"}),/another reviewed booking/);
 assert.throws(()=>execute(stay(),{name:"get_reservation",reservationId:placed.reservation!.reference}),/belongs to this stay session/);
});
test("stale mutation is rejected and changing filters invalidates review",()=>{
 let s=execute(stay(),{name:"get_booking_quote",roomId:"city-double",expectedRevision:0}).state;
 assert.throws(()=>execute(s,{name:"update_stay_filters",expectedRevision:0,patch:{adults:1}}),/stay changed/);
 s=execute(s,{name:"update_stay_filters",expectedRevision:s.revision,patch:{adults:1}}).state;
 assert.equal(s.quote,null);
 assert.throws(()=>execute(s,{name:"reserve_demo_stay",expectedRevision:s.revision,quoteId:"old",operationId:"invalid-quote",confirmed:true}),/quote first/);
});
test("sequential reservations use bounded simulated inventory and preserve first receipt",()=>{
 let s=stay();let first="";
 for(let i=0;i<2;i++) {s=execute(s,{name:"get_booking_quote",roomId:"city-double",expectedRevision:s.revision}).state;const result=execute(s,{name:"reserve_demo_stay",quoteId:s.quote!.id,expectedRevision:s.revision,operationId:`sequential-${i}`,confirmed:true});s=result.state;first||=result.reservation!.reference;}
 assert.equal(s.reservations.length,2);assert.throws(()=>execute(s,{name:"get_booking_quote",roomId:"city-double",expectedRevision:s.revision}),/simulated inventory/);
 assert.equal(execute(s,{name:"get_reservation",reservationId:first}).reservation!.reference,first);
});
