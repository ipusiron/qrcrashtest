const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
const script = fs.readFileSync(path.join(root, "script.js"), "utf8");

test("第三者QR生成APIへサンプル内容を送信しない", () => {
  assert.doesNotMatch(html + script, /api\.qrserver\.com/i);
  assert.match(script, /createSampleDataUrl/);
  assert.match(script, /qrcode\(0, "M"\)/);
});

test("公開ページはCSPとreferrer制御を持ち、実行コードをローカル配信する", () => {
  assert.match(html, /Content-Security-Policy/);
  assert.match(html, /name="referrer"/);
  const externalScripts = [...html.matchAll(/<script\b[^>]*src="https:[^"]+"[^>]*>/g)].map((match) => match[0]);
  assert.equal(externalScripts.length, 0);
  assert.match(html, /script-src 'self'/);
  for (const source of ["vendor/jsQR.js", "vendor/qrcode.min.js", "qr-core.js", "experiment-core.js", "i18n.js", "script.js"]) {
    assert.match(html, new RegExp(`src="${source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`));
    assert.ok(fs.existsSync(path.join(root, source)), `${source} must exist`);
  }
});

test("日英切り替えと実験条件のUIを読み込む", () => {
  assert.match(html, /id="languageToggle"/);
  assert.match(html, /id="experimentSeed"/);
  assert.match(html, /id="blurSlider"/);
  assert.match(html, /id="contrastSlider"/);
  assert.match(html, /id="rotationSlider"/);
  assert.ok(html.indexOf('src="i18n.js"') < html.indexOf('src="script.js"'));
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

test("画像劣化の表示値はlive領域でなく、要約はchangeで更新する", () => {
  for (const id of ["blurValue", "contrastValue", "rotationValue"]) {
    assert.match(html, new RegExp(`<output id="${id}" aria-live="off">`));
  }
  for (const id of ["blurSlider", "contrastSlider", "rotationSlider"]) {
    assert.match(html, new RegExp(`id="${id}"[^>]*aria-valuetext="`));
  }
  assert.match(script, /control\.addEventListener\("change", updateExperimentSummary\)/);
  const inputHandler = script.match(/control\.addEventListener\("input", \(\) => \{([\s\S]*?)\n  \}\);/);
  assert.ok(inputHandler);
  assert.doesNotMatch(inputHandler[1], /updateExperimentSummary/);
});

test("押せない「同じ条件でもう一度」に理由の注記を結ぶ", () => {
  const I18n = require("../i18n.js");
  assert.match(html, /id="repeatExperimentButton"[^>]*disabled[^>]*aria-describedby="repeatExperimentNote"/);
  const note = html.match(/<p id="repeatExperimentNote"[^>]*>([^<]+)<\/p>/);
  assert.ok(note);
  assert.ok(I18n.translations[note[1]], "注記に英訳がある");
  assert.match(script, /removeAttribute\("aria-describedby"\)/);
});
