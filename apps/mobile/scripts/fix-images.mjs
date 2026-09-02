import fs from "fs";
import path from "path";

const replacements = {
  "photo-1596040033229-a0b2c4c4a6b5": "photo-1596040033229-a9821ebd058d",
  "photo-1615485290381-44100f2792e4": "photo-1596040033229-a9821ebd058d",
  "photo-1618375580360-0a2a581a7e3e": "photo-1512621776951-a57141f2eefd",
  "photo-1608797178973-15e9373674a1": "photo-1508747703725-719777637510",
  "photo-1517668808822-9ebb02b2a0e7": "photo-1556911220-bff31c812dba",
  "photo-1571875257720-256c39da42af": "photo-1556228578-0d85b1a4d571",
  "photo-1584308664954-6d8c0fe03b30": "photo-1471864190281-a93a3070b6de",
  "photo-1515823064-d6e0c046046a": "photo-1512621776951-a57141f2eefd",
  "photo-1555041469-a586c12ea9bc": "photo-1467003909585-2f8a72700288",
  "photo-1599909533067-7f76f8e2b03a": "photo-1509440159596-0249088772ff",
  "photo-1601050690117-94f5f6fa0b94": "photo-1583663848850-46af132dc08e",
  "photo-1615485290459-4af5f391ca3f": "photo-1596040033229-a9821ebd058d",
  "photo-1615485737651-7f5f94589f5c": "photo-1512621776951-a57141f2eefd",
  "photo-1618375580919-d0f7b3f2af31": "photo-1508747703725-719777637510",
  "photo-1620916566998-2b8e8e4c8f0b": "photo-1608248543803-ba4f8c70ae0b",
};

const files = [
  ...fs.readdirSync("data").map((f) => path.join("data", f)),
  "data/conversations.ts",
].filter((f) => /\.(json|ts)$/.test(f) && fs.existsSync(f));

let total = 0;
for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  let changed = 0;
  for (const [from, to] of Object.entries(replacements)) {
    const before = content;
    content = content.replaceAll(from, to);
    if (content !== before) changed += 1;
  }
  if (content !== fs.readFileSync(file, "utf8")) {
    fs.writeFileSync(file, content);
    total += 1;
    console.log(`Updated ${file} (${changed} patterns)`);
  }
}

console.log(`Done. Updated ${total} files.`);
