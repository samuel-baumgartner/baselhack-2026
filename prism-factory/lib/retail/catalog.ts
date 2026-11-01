import manifest from "../../data/galaxus-products.json";
export const merchant = {
  id: "galaxus",
  name: "Galaxus",
  logo: "https://prism.mvps.ch/merchants/galaxus/logo.svg",
  snapshot: manifest.capturedOn,
};
export const products = manifest.products.map((p) => ({
  ...p,
  id: p.productId,
  image: `https://prism.mvps.ch/merchants/galaxus/${p.referenceImagePath.split("/").pop()}`,
  sourcePriceMinor: p.priceMinor,
  currentDemoPriceMinor: p.priceMinor,
  sourceCapturedAt: p.capturedAt,
  demoStock: 5,
  noiseCancelling:
    p.noiseCancellation === "ANC" || p.noiseCancellation === "DNC",
}));
// DNC is included in the broader noise-cancelling category, retaining its source label.
// This does not assert equivalent ANC performance or a tested technology comparison.
export type Product = (typeof products)[number];
export type Filters = {
  maxPriceMinor: number;
  formFactor: "any" | "in-ear" | "open-ear";
  wireless: boolean;
  noiseCancelling: boolean;
  sort: "price_asc" | "price_desc";
};
export const defaultFilters: Filters = {
  maxPriceMinor: 25000,
  formFactor: "in-ear",
  wireless: true,
  noiseCancelling: true,
  sort: "price_asc",
};
export function filterProducts(
  filters: Filters,
  catalog: Product[] = products,
) {
  return catalog
    .filter(
      (p) =>
        p.currentDemoPriceMinor <= filters.maxPriceMinor &&
        (filters.formFactor === "any" || p.formFactor === filters.formFactor) &&
        (!filters.wireless || p.wireless) &&
        (!filters.noiseCancelling || p.noiseCancelling),
    )
    .sort(
      (a, b) =>
        (a.currentDemoPriceMinor - b.currentDemoPriceMinor) *
        (filters.sort === "price_asc" ? 1 : -1),
    );
}
export const editions = [
  {
    id: "commute",
    type: "Guide",
    title: "A quieter commute, without overspending",
    summary:
      "Start with fit, then choose isolation. In-ear noise-cancelling models can help with steady train noise; fit and awareness still matter. Compare the two snapshot options below CHF 100 before paying for a premium model.",
    productIds: ["43103281", "61065156"],
  },
  {
    id: "battery",
    type: "Guide",
    title: "What does a battery-life label actually tell you?",
    summary:
      "The listed figures are 9.5 hours for Nothing Ear (a) and 6 hours for Galaxy Buds3 FE. Their test modes are unverified. These numbers alone cannot establish which lasts longer with noise cancellation enabled.",
    productIds: ["43103281", "61065156"],
  },
  {
    id: "watch",
    type: "News + Trends",
    title: "Keep a shortlist, then revisit the facts",
    summary:
      "Follow audio and watch a product to save your interest. Refresh this feed to see the latest demo edition. Prices here remain the frozen 31 October snapshot unless explicitly marked as simulated.",
    productIds: ["61065156"],
  },
];
