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
