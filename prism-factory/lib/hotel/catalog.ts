import manifest from "../../data/krafft-hotel.json";
export const hotel = { id: "krafft", name: "Krafft Basel", logo: "https://prism.mvps.ch/merchants/krafft/logo.png", website: manifest.website, address: manifest.address };
export const rooms = manifest.rooms.map(room => ({ ...room, image: `https://prism.mvps.ch/merchants/krafft/${room.image}` }));
export type Room = (typeof rooms)[number];
export const facts = manifest.verifiedFacts;
export const disclosures = manifest.limitations;
