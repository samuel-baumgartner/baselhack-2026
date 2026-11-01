import { build } from "esbuild";
import { readFile, writeFile } from "node:fs/promises";
await build({
  entryPoints: ["components/widget-entry.tsx"],
  bundle: true,
  minify: true,
  format: "iife",
  platform: "browser",
  outfile: "public/widget-runtime.js",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
});
const css = await readFile("app/globals.css", "utf8");
await writeFile(
  "public/widget.css",
  "*{box-sizing:border-box}body{margin:0;padding:10px;background:white;color:#222;font:13px Arial}button,select,input{font:inherit;cursor:pointer}" +
    css.slice(css.indexOf(".retail{"), css.indexOf(".copy-button{")) +
    "@media(max-width:480px){.products{padding:0 15px 20px;gap:12px}.product-photo{height:140px}.product-photo>img{height:120px}.product-actions{flex-wrap:wrap;gap:10px}.merchant-wordmark{font-size:24px}}",
);
await build({ entryPoints: ["components/hotel-widget-entry.tsx"], bundle: true, minify: true, format: "iife", platform: "browser", outfile: "public/hotel-widget-runtime.js", jsx: "automatic", loader: { ".css": "empty" }, define: { "process.env.NODE_ENV": '"production"' } });
await writeFile("public/hotel-widget.css", await readFile("components/hotel.css", "utf8"));
