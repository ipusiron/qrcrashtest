const test = require("node:test");
const assert = require("node:assert/strict");
const ExperimentCore = require("../experiment-core.js");

test("同じシードは同じ乱数列を生成する", () => {
  const first = ExperimentCore.createSeededRandom("finder-2026");
  const second = ExperimentCore.createSeededRandom("finder-2026");
  assert.deepEqual(Array.from({ length: 12 }, first), Array.from({ length: 12 }, second));
});

test("異なるシードは異なる乱数列を生成する", () => {
  const first = ExperimentCore.createSeededRandom("seed-a");
  const second = ExperimentCore.createSeededRandom("seed-b");
  assert.notDeepEqual(Array.from({ length: 4 }, first), Array.from({ length: 4 }, second));
});

test("空のシードと長いシードを正規化する", () => {
  assert.equal(ExperimentCore.normalizeSeed("   "), "day102");
  assert.equal(ExperimentCore.normalizeSeed("x".repeat(100)).length, 64);
});

test("画像劣化設定を安全な範囲へ制限する", () => {
  assert.deepEqual(ExperimentCore.normalizeEffects({ blur: 99, contrast: -2, rotation: "x" }), {
    blur: 8,
    contrast: 20,
    rotation: 0
  });
  assert.equal(ExperimentCore.hasEffects({}), false);
  assert.equal(ExperimentCore.hasEffects({ rotation: 1 }), true);
});

test("live領域へは前と同じ文なら書かない", () => {
  const element = { textContent: "なし", writes: 0 };
  const tracked = new Proxy(element, {
    set(target, key, value) {
      if (key === "textContent") target.writes += 1;
      target[key] = value;
      return true;
    }
  });
  assert.equal(ExperimentCore.setTextIfChanged(tracked, "なし"), false);
  assert.equal(element.writes, 0);
  assert.equal(ExperimentCore.setTextIfChanged(tracked, "ぼかし 2px"), true);
  assert.equal(ExperimentCore.setTextIfChanged(tracked, "ぼかし 2px"), false);
  assert.equal(element.writes, 1);
  assert.equal(element.textContent, "ぼかし 2px");
  assert.equal(ExperimentCore.setTextIfChanged(tracked, 100), true);
  assert.equal(element.textContent, "100");
  assert.equal(ExperimentCore.setTextIfChanged(null, "x"), false);
});

test("スライダーのaria-valuetextに単位を付ける", () => {
  assert.equal(ExperimentCore.formatEffectValue("blur", 3), "3px");
  assert.equal(ExperimentCore.formatEffectValue("contrast", 100), "100%");
  assert.equal(ExperimentCore.formatEffectValue("rotation", -5), "-5°");
});

test("同じ条件でもう一度はプリセット適用後だけ押せる", () => {
  assert.equal(ExperimentCore.canRepeatPreset(null), false);
  assert.equal(ExperimentCore.canRepeatPreset(""), false);
  assert.equal(ExperimentCore.canRepeatPreset(undefined), false);
  assert.equal(ExperimentCore.canRepeatPreset("finder-attack"), true);
});
