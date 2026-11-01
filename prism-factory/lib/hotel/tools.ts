import { z } from "zod";
const sessionId = z.string().regex(/^[a-f0-9]{64}$/).describe("Reuse the opaque stay session returned by search_rooms. Never invent or replace the user's existing session.");
const expectedRevision = z.number().int().nonnegative();
const scope = { sessionId };
const write = { sessionId, expectedRevision };
export const definitions = {
  search_rooms: { description: "Discover Krafft Basel room categories and open a synthetic stay session. Reuse sessionId if one exists. Dates, occupancy, rates and inventory in this app are demo data, not a real availability feed.", schema: z.object({sessionId:sessionId.optional()}), write:true },
  get_stay_session: { description: "Reload canonical dates, guests, nightly budget, room results, saved interests and latestReservation. Inspect latestReservation even after the quote has cleared.", schema:z.object(scope),write:false },
  update_stay_filters: { description: "Patch dates, adults, view and adjustable maxNightlyMinor in CHF cents in the existing session. Preserve requirements not explicitly changed. A lower budget is not a hotel discount.", schema:z.object({...write,patch:z.object({checkIn:z.string().optional(),checkOut:z.string().optional(),adults:z.number().int().min(1).max(3).optional(),maxNightlyMinor:z.number().int().min(0).max(100000).optional(),view:z.enum(['any','city','river']).optional()}).strict()}),write:true },
  get_room: { description:"Show one researched room category and its source. Capacities and rates are demonstration values.",schema:z.object({...scope,roomId:z.string()}),write:false },
  get_booking_quote: { description:"Review an exact synthetic stay quote before reserving. Returns nights, nightly price, total, quote ID and reviewed revision. This creates a reviewed quote, not a booking.",schema:z.object({...write,roomId:z.string()}),write:true },
  reserve_demo_stay: { description:"Create a SYNTHETIC, NO-CHARGE reservation only after explicit user confirmation of the reviewed quote. Reuse operationId, quoteId and expectedRevision unchanged on an uncertain retry. No real room is booked and no hotel contact is made.",schema:z.object({...write,quoteId:z.string(),operationId:z.string().min(8).max(100),confirmed:z.literal(true)}),write:true },
  get_reservation: { description:"Retrieve a session-owned synthetic reservation by reference, or omit reservationId for latest. Never infer there is no reservation merely because the quote is empty.",schema:z.object({...scope,reservationId:z.string().optional()}),write:false },
  get_guest_updates: { description:"Read original demo local tips, arrival guidance and saved interests. Pull feed only; no messages, room-service orders or background notifications are sent.",schema:z.object(scope),write:false },
  get_guest_preferences: { description:"Read saved local-tips and arrival-reminder interests for the current stay. A saved interest is not a scheduled notification.",schema:z.object(scope),write:false },
  set_guest_preferences: { description:"Save localTips and arrivalReminder interests to this synthetic stay session. Does not contact the guest or hotel.",schema:z.object({...write,localTips:z.boolean().optional(),arrivalReminder:z.boolean().optional()}),write:true },
} as const;
