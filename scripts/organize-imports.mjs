import ts from "typescript";
import fs from "node:fs";
const files = ts.sys
  .readDirectory("src", [".ts", ".tsx"])
  .map((f) => ts.sys.resolvePath(f));
const options = ts.parseJsonConfigFileContent(
  ts.readConfigFile("tsconfig.json", ts.sys.readFile).config,
  ts.sys,
  ".",
).options;
const host = {
  getScriptFileNames: () => files,
  getScriptVersion: () => "0",
  getScriptSnapshot: (f) =>
    ts.sys.fileExists(f)
      ? ts.ScriptSnapshot.fromString(ts.sys.readFile(f))
      : undefined,
  getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
  getCompilationSettings: () => options,
  getDefaultLibFileName: ts.getDefaultLibFilePath,
  fileExists: ts.sys.fileExists,
  readFile: ts.sys.readFile,
  readDirectory: ts.sys.readDirectory,
};
const service = ts.createLanguageService(host);
for (const file of files) {
  for (const edit of service.organizeImports(
    { type: "file", fileName: file },
    {},
    {},
  )) {
    let text = fs.readFileSync(edit.fileName, "utf8");
    for (const c of [...edit.textChanges].sort(
      (a, b) => b.span.start - a.span.start,
    ))
      text =
        text.slice(0, c.span.start) +
        c.newText +
        text.slice(c.span.start + c.span.length);
    fs.writeFileSync(edit.fileName, text);
  }
}
