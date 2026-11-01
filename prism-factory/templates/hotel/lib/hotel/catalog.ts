import manifest from "../../data/krafft-hotel.json";
import { config } from "../config";
import { assetUrl } from "../assets";
export const hotel = { id: config.appId, name: config.company.name, logo: assetUrl("/merchants/krafft/logo.png"), website: manifest.website, address: manifest.address };
export const rooms = manifest.rooms.map(room => ({ ...room, image: assetUrl(`/merchants/krafft/${room.image}`) }));
export type Room = (typeof rooms)[number];
export const facts = manifest.verifiedFacts;
export const disclosures = manifest.limitations;
