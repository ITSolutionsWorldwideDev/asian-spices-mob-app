import fs from "fs";
import path from "path";

function walk(dir, acc = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".json") || p.endsWith(".ts")) acc.push(p);
  }
  return acc;
}

const urls = new Set();
for (const file of walk("data")) {
  const text = fs.readFileSync(file, "utf8");
  const re = /https?:\/\/[^"'\s\\]+/g;
  let m;
  while ((m = re.exec(text))) {
    const url = m[0].replace(/\\$/g, "");
    if (/unsplash|pravatar|\.(jpg|jpeg|png|webp)/i.test(url)) urls.add(url);
  }
}

const results = [];
for (const url of [...urls].sort()) {
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    results.push({ url, status: res.status, ok: res.ok });
  } catch (e) {
    results.push({ url, status: "ERR", ok: false, error: String(e) });
  }
}

const broken = results.filter((r) => !r.ok);
console.log(`Checked ${results.length} URLs, broken: ${broken.length}`);
for (const item of broken) {
  console.log(item.status, item.url);
}
