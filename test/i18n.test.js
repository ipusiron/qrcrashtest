const test = require("node:test");
const assert = require("node:assert/strict");
const I18n = require("../i18n.js");

test("主要UI用語に英訳がある", () => {
  for (const key of ["クラッシュテスト", "解析", "座学", "攻撃シナリオプリセット", "実験条件", "表示結果は、この画像をjsQRで1回読み取った結果です。他のカメラ、照明、印刷条件、デコーダーで同じ結果になることや、一般的な耐性を保証しません。"]) {
    assert.ok(I18n.translations[key], key);
  }
});
