const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("第三者QR生成APIへサンプル内容を送信しない", () => {
  assert.doesNotMatch(html + script, /api\.qrserver\.com/i);
  assert.match(script, /assets\/samples\/qr1\.png/);
  assert.match(script, /assets\/samples\/qr2\.png/);
});

test("公開ページにCSP、referrer制御、外部スクリプトのSRIがある", () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /name="referrer"/);
  const externalScripts = [...html.matchAll(/<script\b[^>]*src="https:[^"]+"[^>]*>/g)].map((match) => match[0]);
  assert.ok(externalScripts.length > 0);
  for (const tag of externalScripts) {
    assert.match(tag, /integrity="sha384-/);
    assert.match(tag, /crossorigin="anonymous"/);
  }
});

test("別タブで開くリンクにnoopenerとnoreferrerがある", () => {
  const links = [...html.matchAll(/<a\b[^>]*target="_blank"[^>]*>/g)].map((match) => match[0]);
  assert.ok(links.length > 0);
  for (const tag of links) {
    assert.match(tag, /rel="[^"]*noopener[^"]*"/);
    assert.match(tag, /rel="[^"]*noreferrer[^"]*"/);
  }
});

test("3タブにARIAの関連付けがある", () => {
  assert.equal((html.match(/role="tab"/g) || []).length, 3);
  assert.equal((html.match(/role="tabpanel"/g) || []).length, 3);
  assert.equal((html.match(/aria-controls="tab-/g) || []).length, 3);
});
