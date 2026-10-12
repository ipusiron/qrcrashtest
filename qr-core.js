(function initQRCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.QRCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createQRCore() {
  "use strict";

  // ISO/IEC 18004のVersion別アラインメントパターン中心座標。
  const ALIGNMENT_PATTERN_AXES = Object.freeze([
    Object.freeze([]),
    Object.freeze([]),
    Object.freeze([6, 18]),
    Object.freeze([6, 22]),
    Object.freeze([6, 26]),
    Object.freeze([6, 30]),
    Object.freeze([6, 34]),
    Object.freeze([6, 22, 38]),
    Object.freeze([6, 24, 42]),
    Object.freeze([6, 26, 46]),
    Object.freeze([6, 28, 50]),
    Object.freeze([6, 30, 54]),
    Object.freeze([6, 32, 58]),
    Object.freeze([6, 34, 62]),
    Object.freeze([6, 26, 46, 66]),
    Object.freeze([6, 26, 48, 70]),
    Object.freeze([6, 26, 50, 74]),
    Object.freeze([6, 30, 54, 78]),
    Object.freeze([6, 30, 56, 82]),
    Object.freeze([6, 30, 58, 86]),
    Object.freeze([6, 34, 62, 90]),
    Object.freeze([6, 28, 50, 72, 94]),
    Object.freeze([6, 26, 50, 74, 98]),
    Object.freeze([6, 30, 54, 78, 102]),
    Object.freeze([6, 28, 54, 80, 106]),
    Object.freeze([6, 32, 58, 84, 110]),
    Object.freeze([6, 30, 58, 86, 114]),
    Object.freeze([6, 34, 62, 90, 118]),
    Object.freeze([6, 26, 50, 74, 98, 122]),
    Object.freeze([6, 30, 54, 78, 102, 126]),
    Object.freeze([6, 26, 52, 78, 104, 130]),
    Object.freeze([6, 30, 56, 82, 108, 134]),
    Object.freeze([6, 34, 60, 86, 112, 138]),
    Object.freeze([6, 30, 58, 86, 114, 142]),
    Object.freeze([6, 34, 62, 90, 118, 146]),
    Object.freeze([6, 30, 54, 78, 102, 126, 150]),
    Object.freeze([6, 24, 50, 76, 102, 128, 154]),
    Object.freeze([6, 28, 54, 80, 106, 132, 158]),
    Object.freeze([6, 32, 58, 84, 110, 136, 162]),
    Object.freeze([6, 26, 54, 82, 110, 138, 166]),
    Object.freeze([6, 30, 58, 86, 114, 142, 170])
  ]);

  function assertVersion(version) {
    if (!Number.isInteger(version) || version < 1 || version > 40) {
      throw new RangeError("QR version must be an integer from 1 to 40.");
    }
  }

  function distance(first, second) {
    return Math.hypot(second.x - first.x, second.y - first.y);
  }

  function getAlignmentPatternAxes(version) {
    assertVersion(version);
    return [...ALIGNMENT_PATTERN_AXES[version]];
  }

  function getAlignmentPatternPositions(version) {
    assertVersion(version);
    if (version === 1) return [];

    const axes = ALIGNMENT_PATTERN_AXES[version];
    const moduleCount = 17 + 4 * version;
    const positions = [];

    for (const row of axes) {
      for (const col of axes) {
        const overlapsTopLeft = row <= 8 && col <= 8;
        const overlapsTopRight = row <= 8 && col >= moduleCount - 9;
        const overlapsBottomLeft = row >= moduleCount - 9 && col <= 8;
        if (!overlapsTopLeft && !overlapsTopRight && !overlapsBottomLeft) {
          positions.push([row, col]);
        }
      }
    }

    return positions;
  }

  function calculateQRModuleMetrics(location, version) {
    assertVersion(version);
    if (!location || !location.topLeftFinderPattern || !location.topRightFinderPattern || !location.bottomLeftFinderPattern) {
      throw new TypeError("Finder pattern locations are required.");
    }

    const topLeft = location.topLeftFinderPattern;
    const topRight = location.topRightFinderPattern;
    const bottomLeft = location.bottomLeftFinderPattern;
    const moduleCount = 17 + 4 * version;
    const horizontalDistance = distance(topLeft, topRight);
    const verticalDistance = distance(topLeft, bottomLeft);
    const moduleSizeX = horizontalDistance / (moduleCount - 7);
    const moduleSizeY = verticalDistance / (moduleCount - 7);
    const moduleSize = (moduleSizeX + moduleSizeY) / 2;

    return {
      topLeft,
      topRight,
      bottomLeft,
      moduleCount,
      horizontalDistance,
      verticalDistance,
      moduleSizeX,
      moduleSizeY,
      moduleSize,
      finderModuleSize: 7 * moduleSize
    };
  }

  function mapModulePoint(metrics, row, col) {
    const horizontalUnit = {
      x: (metrics.topRight.x - metrics.topLeft.x) / metrics.horizontalDistance,
      y: (metrics.topRight.y - metrics.topLeft.y) / metrics.horizontalDistance
    };
    const verticalUnit = {
      x: (metrics.bottomLeft.x - metrics.topLeft.x) / metrics.verticalDistance,
      y: (metrics.bottomLeft.y - metrics.topLeft.y) / metrics.verticalDistance
    };
    const originOffset = 3.5;

    return {
      x: metrics.topLeft.x
        + horizontalUnit.x * (col - originOffset) * metrics.moduleSizeX
        + verticalUnit.x * (row - originOffset) * metrics.moduleSizeY,
      y: metrics.topLeft.y
        + horizontalUnit.y * (col - originOffset) * metrics.moduleSizeX
        + verticalUnit.y * (row - originOffset) * metrics.moduleSizeY
    };
  }

  return Object.freeze({
    ALIGNMENT_PATTERN_AXES,
    calculateQRModuleMetrics,
    distance,
    getAlignmentPatternAxes,
    getAlignmentPatternPositions,
    mapModulePoint
  });
});
