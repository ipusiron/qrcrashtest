(function initExperimentCore(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.ExperimentCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function createExperimentCore() {
  "use strict";

  function normalizeSeed(seed) {
    const normalized = String(seed ?? "").trim().slice(0, 64);
    return normalized || "day102";
  }

  function hashSeed(seed) {
    const normalized = normalizeSeed(seed);
    let hash = 2166136261;
    for (let index = 0; index < normalized.length; index += 1) {
      hash ^= normalized.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function createSeededRandom(seed) {
    let state = hashSeed(seed);
    return function random() {
      state = (state + 0x6D2B79F5) >>> 0;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function clampNumber(value, min, max, fallback) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(max, Math.max(min, parsed));
  }

  function normalizeEffects(settings = {}) {
    return Object.freeze({
      blur: clampNumber(settings.blur, 0, 8, 0),
      contrast: clampNumber(settings.contrast, 20, 180, 100),
      rotation: clampNumber(settings.rotation, -15, 15, 0)
    });
  }

  function hasEffects(settings) {
    const effects = normalizeEffects(settings);
    return effects.blur !== 0 || effects.contrast !== 100 || effects.rotation !== 0;
  }

  return Object.freeze({ createSeededRandom, hashSeed, hasEffects, normalizeEffects, normalizeSeed });
});
