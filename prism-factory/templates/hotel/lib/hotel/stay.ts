import { createHash, randomBytes, randomUUID } from "node:crypto";
import { rooms, hotel, facts, disclosures } from "./catalog";
export type Filters = { checkIn: string; checkOut: string; adults: number; maxNightlyMinor: number; view: "any" | "city" | "river" };
export type Quote = { id: string; roomId: string; checkIn: string; checkOut: string; adults: number; nights: number; nightlyMinor: number; totalMinor: number; reviewedRevision: number };
export type Reservation = Quote & { reference: string; operationId: string; status: "synthetic-no-charge"; createdAt: string };
export type State = { id: string; revision: number; filters: Filters; selectedRoomId: string | null; quote: Quote | null; reservations: Reservation[]; preferences: { localTips: boolean; arrivalReminder: boolean } };
export type View = "rooms" | "detail" | "quote" | "receipt" | "updates" | "preferences";
export type Command = { name: string; expectedRevision?: number; patch?: Partial<Filters>; roomId?: string; quoteId?: string; operationId?: string; confirmed?: boolean; reservationId?: string; localTips?: boolean; arrivalReminder?: boolean };
export class DomainError extends Error { constructor(public code: string, message: string) { super(message); } }
function fail(code: string, message: string): never { throw new DomainError(code, message); }
function date(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return fail("INVALID_DATES", "Choose valid arrival and departure dates.");
  const time = Date.parse(`${value}T00:00:00Z`);
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10) !== value) return fail("INVALID_DATES", "Choose valid calendar dates.");
  return time;
}
export function nights(filters: Filters) { return Math.round((date(filters.checkOut)-date(filters.checkIn))/86400000); }
export function validateFilters(filters: Filters) {
  const length = nights(filters);
  if (filters.checkIn < new Date().toISOString().slice(0,10)) fail("INVALID_DATES", "Choose an arrival date today or later.");
  if (length < 1 || length > 14) fail("INVALID_DATES", "Choose a stay from 1 to 14 nights.");
  if (!Number.isInteger(filters.adults) || filters.adults < 1 || filters.adults > 3) fail("INVALID_GUESTS", "Choose 1 to 3 adults for this demo.");
  if (!Number.isInteger(filters.maxNightlyMinor) || filters.maxNightlyMinor < 0 || filters.maxNightlyMinor > 100000) fail("INVALID_BUDGET", "Choose a nightly budget from CHF 0 to CHF 1,000.");
  if (!["any","city","river"].includes(filters.view)) fail("INVALID_VIEW", "Choose city, river or any view.");
}
export function newState(): State {
  const arrival = new Date(); arrival.setUTCDate(arrival.getUTCDate()+14);
  const departure = new Date(arrival); departure.setUTCDate(departure.getUTCDate()+2);
  return { id: randomBytes(32).toString("hex"), revision: 0, filters: { checkIn: arrival.toISOString().slice(0,10), checkOut: departure.toISOString().slice(0,10), adults: 2, maxNightlyMinor: 35000, view: "any" }, selectedRoomId: null, quote: null, reservations: [], preferences: { localTips: false, arrivalReminder: false } };
}
export function matchingRooms(state: State) { return rooms.filter(room => room.adults >= state.filters.adults && room.demoNightlyMinor <= state.filters.maxNightlyMinor && (state.filters.view === "any" || state.filters.view === room.view)); }
function roomFor(id?: string) { return rooms.find(room => room.id === id) ?? fail("ROOM_NOT_FOUND", "Choose a room from this hotel's demo catalogue."); }
export function snapshot(state: State, view: View = "rooms", reservation?: Reservation) {
  const latest = state.reservations.at(-1) ?? null;
  return { sessionId: state.id, revision: state.revision, hotel, filters: state.filters, nights: nights(state.filters), rooms: matchingRooms(state), allRooms: rooms, selectedRoomId: state.selectedRoomId, quote: state.quote, reservation: reservation ?? latest, latestReservation: latest, reservations: state.reservations, preferences: state.preferences, view, facts, disclosures,
    updates: [ { id: "rhine", title: "A slower morning by the Rhine", text: "Explore the riverside promenade and the old-town streets. Ask the hotel for route and accessibility advice." }, { id: "arrival", title: "Before you arrive", text: "The hotel is at Rheingasse 12 in Kleinbasel. Confirm arrival arrangements and checkout time directly with the hotel." }, { id: "coffee", title: "Little comforts", text: "The official rooms page lists water, tea and a coffee machine on every floor, plus bicycles subject to availability." } ], push: { enabled: false, description: "Saved preferences and a pull feed only. No background messages are sent." } };
}
export type Snapshot = ReturnType<typeof snapshot>;
export function execute(state: State, command: Command): { state: State; changed: boolean; view: View; reservation?: Reservation } {
  const read = (view: View, reservation?: Reservation) => ({ state, changed: false, view, reservation });
  if (command.name === "reserve_demo_stay") {
    const previous = state.reservations.find(r => r.operationId === command.operationId);
    if (previous) {
      if (previous.id !== command.quoteId || command.confirmed !== true || previous.reviewedRevision !== command.expectedRevision) fail("IDEMPOTENCY_CONFLICT", "That operation ID belongs to another reviewed booking. Reload your reservation.");
      return read("receipt", previous);
    }
  }
  if (["update_stay_filters","get_booking_quote","reserve_demo_stay","set_guest_preferences"].includes(command.name) && command.expectedRevision !== state.revision) fail("STALE_REVISION", "Your stay changed. Reload and review the current state before trying again.");
  const next: State = structuredClone(state);
  const write = (view: View, reservation?: Reservation) => { next.revision++; return { state: next, changed: true, view, reservation }; };
  switch (command.name) {
    case "search_rooms": case "get_stay_session": return read("rooms");
    case "update_stay_filters": next.filters = { ...next.filters, ...command.patch }; validateFilters(next.filters); next.quote = null; next.selectedRoomId = null; return write("rooms");
    case "get_room": roomFor(command.roomId); return { ...read("detail"), state: { ...state, selectedRoomId: command.roomId! } };
    case "get_booking_quote": {
      const room = roomFor(command.roomId);
      if (!matchingRooms(state).some(r => r.id === room.id)) fail("ROOM_NOT_ELIGIBLE", "This room does not match the current guest count, view or budget.");
      const count = state.reservations.filter(r => r.roomId === room.id && r.checkIn < state.filters.checkOut && r.checkOut > state.filters.checkIn).length;
      if (count >= room.demoInventory) fail("DEMO_UNAVAILABLE", "This room's simulated inventory is used for these dates. Choose different dates or a room.");
      const quote: Quote = { id: createHash("sha256").update(JSON.stringify({ session:state.id, revision:state.revision+1, room:room.id, filters:state.filters })).digest("hex").slice(0,24), roomId:room.id, ...state.filters, nights:nights(state.filters), nightlyMinor:room.demoNightlyMinor, totalMinor:room.demoNightlyMinor*nights(state.filters), reviewedRevision:state.revision+1 };
      next.selectedRoomId = room.id; next.quote = quote; return write("quote");
    }
    case "reserve_demo_stay": {
      const quote = state.quote;
      if (!quote || quote.id !== command.quoteId || quote.reviewedRevision !== state.revision) fail("QUOTE_REQUIRED", "Review a current booking quote first.");
      if (command.confirmed !== true) fail("CONFIRMATION_REQUIRED", "Explicit confirmation is required for a synthetic reservation.");
      if (!command.operationId || command.operationId.length < 8 || command.operationId.length > 100) fail("INVALID_OPERATION", "Use a stable operation ID for a retry-safe demo reservation.");
      const reservation: Reservation = { ...quote, reference:`DEMO-STAY-${randomUUID()}`, operationId:command.operationId, status:"synthetic-no-charge", createdAt:new Date().toISOString() };
      next.reservations.push(reservation); next.quote = null; return write("receipt", reservation);
    }
    case "get_reservation": {
      const reservation = command.reservationId ? state.reservations.find(r=>r.reference===command.reservationId) : state.reservations.at(-1);
      if (!reservation) fail("RESERVATION_NOT_FOUND", "No matching demo reservation belongs to this stay session.");
      return read("receipt", reservation);
    }
    case "get_guest_updates": return read("updates");
    case "get_guest_preferences": return read("preferences");
    case "set_guest_preferences":
      if (command.localTips !== undefined) next.preferences.localTips = command.localTips;
      if (command.arrivalReminder !== undefined) next.preferences.arrivalReminder = command.arrivalReminder;
      return write("updates");
    default: return fail("UNKNOWN_TOOL", "This hotel capability is not available.");
  }
}
