// Public files must resolve independently of an embedding host's document/base URL.
export const assetOrigin = "https://galaxus.prism.mvps.ch";
export function assetUrl(path: string) {
  return new URL(path, `${assetOrigin}/`).href;
}
