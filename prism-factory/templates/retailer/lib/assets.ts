export const assetOrigin = process.env.NEXT_PUBLIC_APP_ORIGIN ?? "http://localhost:3000";
export const assetUrl = (path: string) => new URL(path, `${assetOrigin}/`).href;
