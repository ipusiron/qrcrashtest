const test = require("node:test");
const assert = require("node:assert/strict");
const QRCore = require("../qr-core.js");

const EXPECTED_AXES = [
  [], [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38],
  [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58],
  [6, 34, 62], [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74],
  [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
  [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102],
  [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114],
  [6, 34, 62, 90, 118], [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126],
  [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134],
  [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142],
  [6, 34, 62, 90, 118, 146], [6, 30, 54, 78, 102, 126, 150],
  [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158],
  [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166],
  [6, 30, 58, 86, 114, 142, 170]
];

test("Version 1〜40のアラインメント軸座標が規格表と一致する", () => {
  for (let version = 1; version <= 40; version += 1) {
    assert.deepEqual(QRCore.getAlignmentPatternAxes(version), EXPECTED_AXES[version]);
  }
});

test("Version 1にはアラインメントパターンがない", () => {
  assert.deepEqual(QRCore.getAlignmentPatternPositions(1), []);
});

test("Version 40は49個からファインダー重複3個を除いた46個を返す", () => {
  const positions = QRCore.getAlignmentPatternPositions(40);
  assert.equal(positions.length, 46);
  assert.ok(positions.some(([row, col]) => row === 170 && col === 170));
});

test("範囲外または整数でないVersionを黙って代替しない", () => {
  for (const version of [0, 41, 2.5, NaN, "7"]) {
    assert.throws(() => QRCore.getAlignmentPatternPositions(version), RangeError);
  }
});

test("回転したFinder座標でもユークリッド距離から同じモジュール寸法を求める", () => {
  const angle = Math.PI / 6;
  const finderDistance = 100;
  const location = {
    topLeftFinderPattern: { x: 50, y: 60 },
    topRightFinderPattern: {
      x: 50 + Math.cos(angle) * finderDistance,
      y: 60 + Math.sin(angle) * finderDistance
    },
    bottomLeftFinderPattern: {
      x: 50 - Math.sin(angle) * finderDistance,
      y: 60 + Math.cos(angle) * finderDistance
    }
  };
  const metrics = QRCore.calculateQRModuleMetrics(location, 2);
  assert.ok(Math.abs(metrics.horizontalDistance - finderDistance) < 1e-10);
  assert.ok(Math.abs(metrics.verticalDistance - finderDistance) < 1e-10);
  assert.ok(Math.abs(metrics.moduleSize - (finderDistance / 18)) < 1e-10);
});

test("アラインメント中心を回転したQRの2軸に沿って写像する", () => {
  const metrics = QRCore.calculateQRModuleMetrics({
    topLeftFinderPattern: { x: 10, y: 10 },
    topRightFinderPattern: { x: 10, y: 28 },
    bottomLeftFinderPattern: { x: -8, y: 10 }
  }, 2);
  const point = QRCore.mapModulePoint(metrics, 18, 18);
  assert.ok(point.x < 10);
  assert.ok(point.y > 10);
});

test("縦横のFinder間隔が異なる画像は軸ごとの寸法で写像する", () => {
  const metrics = QRCore.calculateQRModuleMetrics({
    topLeftFinderPattern: { x: 10, y: 10 },
    topRightFinderPattern: { x: 28, y: 10 },
    bottomLeftFinderPattern: { x: 10, y: 46 }
  }, 2);
  assert.equal(metrics.moduleSizeX, 1);
  assert.equal(metrics.moduleSizeY, 2);
  assert.deepEqual(QRCore.mapModulePoint(metrics, 18, 18), { x: 24.5, y: 39 });
});
