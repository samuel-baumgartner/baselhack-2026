import { z } from "zod";

export const DEMO_SOURCE_URL = "https://www.rheinfelderhof.ch/en/";
export const DEMO_SOURCE_NAME = "Hotel Rheinfelderhof";

export const DEMO_TENANT = "11111111-1111-4111-8111-111111111111";
export const DEMO_BUYER = "22222222-2222-4222-8222-222222222222";
export const DEMO_EMAIL = "presenter@presence.local";

export const claimSchema = z.object({
  field: z.string(),
  value: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string(),
});

export const profileSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().max(1200),
  address: z.string().max(300),
  amenities: z.array(z.string().max(100)).max(20),
  checkIn: z.string(),
  checkOut: z.string(),
  lateArrival: z.boolean().nullable(),
  dogsWelcome: z.boolean().nullable(),
  quietWorkspace: z.boolean().nullable(),
  workspaceUntil: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  claims: z.array(claimSchema).max(30),
});
export type BusinessProfile = z.infer<typeof profileSchema>;

export const requirementsSchema = z.object({
  arrival: z.iso.date().default("2030-11-12"),
  departure: z.iso.date().default("2030-11-13"),
  guests: z.number().int().min(1).max(8).default(1),
  budgetMinor: z.number().int().min(100).max(1000000),
  currency: z.literal("CHF"),
  dog: z.boolean(),
  lateArrival: z.boolean(),
  workspaceUntil: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  quietWorkspace: z.boolean(),
});
export type Requirements = z.infer<typeof requirementsSchema>;

export const offerSchema = z.object({
  roomMinor: z.number().int().nonnegative().max(1000000),
  dogMinor: z.number().int().nonnegative().max(100000),
  workspaceMinor: z.number().int().nonnegative().max(100000),
  currency: z.literal("CHF"),
  checkOut: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  workspaceUntil: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
    .nullable(),
  lateArrival: z.boolean(),
  dogAccepted: z.boolean(),
  quietWorkspace: z.boolean(),
  taxesIncluded: z.literal(true),
  cancellation: z.string().min(5).max(600),
});
export type OfferTerms = z.infer<typeof offerSchema>;
export const totalMinor = (terms: OfferTerms) =>
  terms.roomMinor + terms.dogMinor + terms.workspaceMinor;

export const actionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("onboard"), url: z.url().max(2048) }),
  z.object({ action: z.literal("publish"), profile: profileSchema }),
  z.object({
    action: z.literal("request"),
    prompt: z.string().min(5).max(4000),
  }),
  z.object({ action: z.literal("retry-email"), inquiryId: z.uuid() }),
  z.object({
    action: z.literal("reply"),
    inquiryId: z.uuid(),
    text: z.string().min(10).max(8000),
  }),
  z.object({
    action: z.literal("dashboard-reply"),
    inquiryId: z.uuid(),
    text: z.string().min(10).max(8000),
  }),
  z.object({
    action: z.literal("approve-offer"),
    inquiryId: z.uuid(),
    terms: offerSchema,
  }),
  z.object({
    action: z.literal("accept"),
    offerId: z.uuid(),
    idempotencyKey: z.uuid(),
  }),
  z.object({
    action: z.literal("subscribe"),
    categories: z.array(z.enum(["culture", "food", "wellness"])).min(1),
  }),
  z.object({ action: z.literal("unsubscribe") }),
  z.object({
    action: z.literal("event"),
    title: z.string().min(3).max(160),
    description: z.string().min(10).max(1500),
    category: z.enum(["culture", "food", "wellness"]),
  }),
  z.object({ action: z.literal("reset") }),
]);

export const DEFAULT_REQUEST =
  "I arrive in Basel after midnight with my dog on 12 November 2030. I need a quiet place to work until 14:00 after checkout the next day. Keep the room and all extras below CHF 220. Ask me before confirming.";
export const DEFAULT_REPLY =
  "Room: CHF 175\nDog accommodation: CHF 20\nQuiet workspace: CHF 10, available until 14:00 after checkout\nCheckout: 11:00\nLate arrival: yes, self check-in available\nDog accepted: yes\nAll taxes included.\nCancellation: Free cancellation until 18:00 the day before arrival.";

export const inquiryInputSchema = z.object({
  requirements: requirementsSchema,
  prompt: z.string().min(5).max(4000),
  idempotencyKey: z.string().min(8).max(100),
});
export const acceptanceInputSchema = z.object({
  idempotencyKey: z.string().min(8).max(100),
  approvalId: z.uuid(),
  totalMinor: z.number().int().nonnegative(),
});
