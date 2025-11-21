# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**QRCrashTest** is an interactive browser-based educational tool that simulates physical damage to QR codes and visualizes their resilience through error correction. The tool demonstrates how different types of damage (shadows, occlusion, dirt, scratches) affect QR code readability, with special focus on structural vulnerabilities in Finder patterns, Timing patterns, Format information, and Data regions.

This is Day 102 of the "200 Security Tools with Generative AI" project.

## Core Architecture

### Three-Tab Interface

1. **Crash Test Tab** - Interactive damage simulation
   - Left pane: Dual-layer canvas system (base + overlay)
   - Right pane: Tool controls and real-time decode results

2. **Analyze Tab** - Structure visualization
   - Educational model showing QR code structure layers
   - Heatmap visualization of "critical hit zones"
   - 20×20 grid-based vulnerability scoring system

3. **Study Tab** - Educational content
   - Static documentation about QR structure and error correction

### Canvas Architecture

The tool uses a **dual-canvas system** for non-destructive damage simulation:

- `baseCanvas` - Contains the original QR code image (never modified)
- `overlayCanvas` - Transparent layer for damage rendering
- Composite image is created on-the-fly during decode operations

Both canvases are 500×500px, with images resized while maintaining aspect ratio (centered with letterboxing if needed).

### Key Technical Components

**QR Code Decoding:**
- Uses [jsQR](https://github.com/cozmo/jsQR) library (loaded via CDN)
- Decode triggered via debounced `scheduleDecode()` (200ms delay)
- Merges base + overlay canvases into temporary canvas for analysis
- ECC level cannot be extracted from jsQR, displayed as "不明" (unknown)

**Damage Tools:**
- `pen` - Continuous stroke drawing (uses lineCap/lineJoin: round)
- `dust` - Scattered semi-transparent particles (density-based)
- `shadow` - Elliptical gradient overlay (drag to define)
- `mask` - Solid white/black rectangle sticker (drag to define)
- `noise` - Burst of random pixels (density-based)

**Attack Scenario Presets:**
- Finder Attack - Targets one of the three Finder patterns randomly
- Data Attack - Damages the central data region
- Wide Attack - Broad damage across large area
- Scattered Dirt - Random small dirt spots throughout

**UI Enhancements:**
- Damage Heatmap - Red overlay showing damaged pixels distribution
- Tooltips - "?" icons with hover explanations for features
- Loading Overlay - Minimum 200ms display time with spinner (prevents flicker)

**Analysis Tab Model (Educational Simplification):**
- NOT a strict QR spec implementation
- Finder regions: 22% of canvas width, 3% margin
- Timing patterns: 8px wide lines connecting Finders
- Format info: Modeled as 12px strips near Finder corners
- Data region: Central area avoiding Finders/Timing
- Vulnerability scoring: Finder=3, Timing=2, Format=1.5, Data=1
- Heatmap: Green→Yellow→Red gradient based on score

## Development Workflow

### Running the Tool

This is a **client-side only application**. No build process or server required.

1. Open `index.html` directly in a browser, OR
2. Use a local server: `python -m http.server 8000` then navigate to `http://localhost:8000`

### Testing Changes

- Modify HTML/CSS/JS files directly
- Refresh browser to see changes (hard refresh: Ctrl+F5 / Cmd+Shift+R)
- Test with various QR codes (different versions, error correction levels)
- Verify touch events work on mobile/tablet devices

### Key Files

- `index.html` - Structure and UI layout (3 tabs) - 820 lines
- `script.js` - All application logic (~1,800 lines) with JSDoc comments
- `style.css` - Styling with responsive breakpoints (~1,300 lines) with section comments
- `README.md` - Comprehensive documentation in Japanese with directory structure
- `assets/` - Screenshots and sample QR codes

## Important Implementation Details

### Canvas Coordinate System

`getCanvasPos()` converts client coordinates to canvas coordinates, accounting for CSS scaling:
```javascript
// Canvas is 500×500 logical pixels
// But may display at different physical size in browser
const x = ((clientX - rect.left) / rect.width) * canvas.width;
```

### Damage Ratio Calculation

`calculateDamageRatio()` counts non-transparent pixels in overlay:
```javascript
// Iterates through ImageData of overlay canvas
// Counts pixels where alpha !== 0
// Percentage = (damaged_pixels / total_pixels) × 100
```

### Event Handling (Mouse + Touch)

Unified pointer handling via separate mouse/touch listeners:
- `handlePointerDown` - Initiates drawing, stores start position
- `handlePointerMove` - Continues stroke for pen/dust/noise
- `handlePointerUp` - Completes shadow/mask drag operations

### Loading Indicator Implementation

The loading overlay uses three techniques to ensure visibility:
1. **Forced Reflow** - `void loadingOverlay.offsetHeight` forces browser to paint
2. **setTimeout(0)** - Defers FileReader to next event loop, allowing paint
3. **Minimum Duration** - `MIN_LOADING_DURATION = 200ms` prevents flicker on fast operations

```javascript
function showLoading() {
  loadingOverlay.classList.add("visible");
  void loadingOverlay.offsetHeight; // Force reflow
  loadingStartTime = Date.now();
}

function hideLoading() {
  const elapsed = Date.now() - loadingStartTime;
  const remaining = 200 - elapsed;
  if (remaining > 0) {
    setTimeout(() => loadingOverlay.classList.remove("visible"), remaining);
  }
}
```

### Code Organization & Refactoring

**drawRegionOverlays() Decomposition:**
The 270-line monolithic function was split into 8 single-responsibility functions:
1. `validateAnalysisState()` - Pre-condition checks
2. `calculateQRCanvasTransform()` - Canvas scaling/positioning
3. `calculateQRModuleMetrics()` - Module size from jsQR location data
4. `defineQRStructureRegions()` - Finder/Timing/Format boundaries
5. `calculateHeatmapScores()` - 20×20 grid vulnerability scoring
6. `drawHeatmapLayer()` - Gradient visualization
7. `drawStructureLayers()` - Finder/Timing/Format/Data overlays
8. `updateAnalysisMetrics()` - Statistics display

**Developer Comments:**
- JSDoc comments added to major functions with `@param` and `@returns`
- Section headers in script.js and style.css for navigation
- Inline comments explain non-obvious algorithms (e.g., reflow forcing)

### Educational Modeling Philosophy

The Analyze tab uses **simplified approximations** for pedagogical clarity:
- Real QR codes have complex interlaced data/ECC patterns
- This tool models Finder/Timing/Format/Data as distinct rectangular zones
- Vulnerability scores are conceptual ("where is it dangerous to damage?")
- Heatmap helps visualize concepts, not actual Reed-Solomon boundaries

## Relationship to Related Tools

- **ImageDiffSec** (Day021) - Image tampering detection through pixel diff analysis
- **QR Risk Radar** (Day074) - URL safety evaluation for QR code contents

QRCrashTest focuses specifically on **physical resilience and structural vulnerability** of the QR code itself, not content security or image forensics.

## Code Conventions

- Vanilla JavaScript (no framework)
- IIFE for tab setup to avoid global pollution
- Event listeners use arrow functions for concise syntax
- Canvas operations wrapped in `save()`/`restore()` for isolation
- Japanese comments and UI text throughout (target audience)
- `const` for DOM elements, `let` for mutable state

### Terminology Standards (Japanese)

Katakana terms use long vowel marks (音引き):
- ブラウザー (browser), サーバー (server), レイヤー (layer), パラメーター (parameter)
- エディター (editor), コンピューター (computer), フィルター (filter)

Hiragana preference for common words:
- すべて (not 全て), すでに (not 既に), ない (not 無い), もっとも (not 最も)

Interface terminology:
- インターフェイス (not インターフェース)
