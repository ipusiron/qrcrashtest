/**
 * QRCrashTest - QRコード破壊耐性クラッシュテストツール
 *
 * QRコードに物理的なダメージを与えて、構造と誤り訂正による読み取り耐性を可視化する教育ツール
 *
 * 主な機能:
 * - QRコード画像の読み込み（ファイル選択、ドラッグ&ドロップ、サンプル選択）
 * - ダメージ描画ツール（ペン、汚れブラシ、影、ステッカー、ノイズ）
 * - シードで再現できる攻撃プリセットと画像劣化条件
 * - リアルタイムQRコード読み取り（jsQR使用）
 * - 構造レイヤー可視化（Finder/Timing/Format/Data/致命度ヒートマップ）
 * - 座学コンテンツ（QRコード構造と誤り訂正の解説）
 *
 * 使用ライブラリ:
 * - jsQR: QRコード読み取り (https://github.com/cozmo/jsQR)
 */

// ============================================================
// タブ管理
// ============================================================

/**
 * タブ切り替え処理
 * クラッシュテスト/解析/座学の3タブを管理
 */
(function setupTabs() {
  const buttons = document.querySelectorAll(".tab-button");
  const contents = document.querySelectorAll(".tab-content");

  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      buttons.forEach((b) => {
        b.classList.remove("active");
        b.setAttribute("aria-selected", "false");
      });
      contents.forEach((c) => {
        c.classList.remove("active");
        c.hidden = true;
      });
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      const targetPanel = document.getElementById(target);
      targetPanel.classList.add("active");
      targetPanel.hidden = false;
      btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });

      // 分析タブに切り替えた時、QRコード画像が読み込まれていればQRコードを表示
      if (target === "tab-analyze" && qrImageLoaded && originalImage) {
        if (analysisPerformed) {
          // 解析済みの場合は領域オーバーレイも表示
          drawRegionOverlays();
        } else {
          // 未解析の場合はQRコード画像のみ表示
          drawQRImageOnly();
        }
      }
    });

    btn.addEventListener("keydown", (event) => {
      const currentIndex = Array.from(buttons).indexOf(btn);
      let nextIndex = currentIndex;
      if (event.key === "ArrowRight") nextIndex = (currentIndex + 1) % buttons.length;
      if (event.key === "ArrowLeft") nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
      if (event.key === "Home") nextIndex = 0;
      if (event.key === "End") nextIndex = buttons.length - 1;
      if (nextIndex !== currentIndex) {
        event.preventDefault();
        buttons[nextIndex].focus();
        buttons[nextIndex].click();
      }
    });
  });
})();

// ============================================================
// DOM要素の取得
// ============================================================

// --- キャンバス関連 ---
// Crash Testタブのキャンバス群（4層構造）
const baseCanvas = document.getElementById("baseCanvas");           // 元のQR画像
const overlayCanvas = document.getElementById("overlayCanvas");     // ダメージレイヤー
const effectCanvas = document.getElementById("effectCanvas");
const previewCanvas = document.getElementById("previewCanvas");     // 合成結果（非表示、jsQR読み取り用）
const damageHeatmapCanvas = document.getElementById("damageHeatmapCanvas"); // ダメージヒートマップ
const baseCtx = baseCanvas.getContext("2d");
const overlayCtx = overlayCanvas.getContext("2d", { willReadFrequently: true });
const effectCtx = effectCanvas.getContext("2d", { willReadFrequently: true });
const previewCtx = previewCanvas.getContext("2d");
const damageHeatmapCtx = damageHeatmapCanvas.getContext("2d");
const noImageOverlay = document.getElementById("noImageOverlay");   // 「QRコード未読込」オーバーレイ
const canvasDropZone = document.getElementById("canvasDropZone");   // ドラッグ&ドロップゾーン

// 解析タブのキャンバス
const analysisCanvas = document.getElementById("analysisCanvas");
const analysisCtx = analysisCanvas.getContext("2d");
const analysisNoImageOverlay = document.getElementById("analysisNoImageOverlay");

// --- ステータス表示要素 ---
// Crash Testタブ - 読み取り結果
const decodeStatusEl = document.getElementById("decodeStatus");     // SUCCESS/FAIL
const damageRatioEl = document.getElementById("damageRatio");       // 破損率
const eccLevelEl = document.getElementById("eccLevel");             // ECCレベル（本ツールでは常に「不明」）
const versionEl = document.getElementById("qrVersion");             // QRバージョン
const decodedDataEl = document.getElementById("decodedData");       // 復号データ

// 解析タブ - 致命ゾーン概要
const highRiskRatioEl = document.getElementById("highRiskRatio");   // 致命度が高いセル割合
const finderScoreEl = document.getElementById("finderScore");       // Finder周辺平均スコア
const dataScoreEl = document.getElementById("dataScore");           // Data領域平均スコア

// --- コントロール要素 ---
// QRコード読み込み
const fileInput = document.getElementById("fileInput");
const fileName = document.getElementById("fileName");
const sampleQrSelect = document.getElementById("sampleQrSelect");

// ダメージツール設定
const sizeSlider = document.getElementById("sizeSlider");           // ブラシサイズ
const shadowOpacitySlider = document.getElementById("shadowOpacitySlider"); // 影の濃さ
const noiseDensitySlider = document.getElementById("noiseDensitySlider");   // 汚れ/ノイズ密度
const maskColorSelect = document.getElementById("maskColorSelect"); // ステッカー色

const sizeValue = document.getElementById("sizeValue");
const shadowOpacityValue = document.getElementById("shadowOpacityValue");
const noiseDensityValue = document.getElementById("noiseDensityValue");

const currentToolIcon = document.getElementById("currentToolIcon");
const currentToolName = document.getElementById("currentToolName");

// その他のコントロール
const clearOverlayButton = document.getElementById("clearOverlayButton"); // ダメージリセット
const showDamageHeatmap = document.getElementById("showDamageHeatmap");   // ダメージヒートマップ表示
const experimentSeed = document.getElementById("experimentSeed");
const generateSeedButton = document.getElementById("generateSeedButton");
const repeatExperimentButton = document.getElementById("repeatExperimentButton");
const blurSlider = document.getElementById("blurSlider");
const contrastSlider = document.getElementById("contrastSlider");
const rotationSlider = document.getElementById("rotationSlider");
const blurValue = document.getElementById("blurValue");
const contrastValue = document.getElementById("contrastValue");
const rotationValue = document.getElementById("rotationValue");
const resultPreset = document.getElementById("resultPreset");
const resultSeed = document.getElementById("resultSeed");
const resultEffects = document.getElementById("resultEffects");

// QR詳細情報（未使用の可能性あり）
const imageSizeEl = document.getElementById("imageSize");
const moduleCountEl = document.getElementById("moduleCount");
const dataLengthEl = document.getElementById("dataLength");
const qrDetailsEl = document.getElementById("qrDetails");

// ローディングオーバーレイ
const loadingOverlay = document.getElementById("loadingOverlay");

// 解析タブ - レイヤー表示切り替え
const layerFinder = document.getElementById("layerFinder");
const layerTiming = document.getElementById("layerTiming");
const layerFormat = document.getElementById("layerFormat");
const layerData = document.getElementById("layerData");
const layerHeatmap = document.getElementById("layerHeatmap");

// 解析タブ - 解析ボタン
const analyzeButton = document.getElementById("analyzeButton");
const analyzeHint = document.getElementById("analyzeHint");

// ============================================================
// グローバル状態管理
// ============================================================

// --- QRコード関連状態 ---
let qrImageLoaded = false;      // QRコード画像が読み込まれているか
let originalImage = null;       // 元のQR画像（Imageオブジェクト）
let qrDecodeResult = null;      // jsQRのデコード結果（location情報含む）
let decodeScheduled = false;    // デコード処理がスケジュール済みか（連続実行防止）
let analysisPerformed = false;  // 解析タブで「解析」ボタンが押されたか
let lastPresetName = null;
let currentStatus = { key: "notLoaded", decodedText: "" };

// --- 描画ツール関連状態 ---
let currentTool = "pen";        // 現在選択中のツール（pen/dust/shadow/mask/noise）
let drawing = false;            // 現在描画中か
let lastPos = null;             // 直前のマウス位置（連続描画用）
let shadowStart = null;         // 影描画の開始位置
let maskStart = null;           // ステッカー描画の開始位置

// メインコンテンツ要素
const crashMainContent = document.getElementById("crashMainContent");
const loadDropZone = document.getElementById("loadDropZone");

function tr(text) {
  return window.I18n ? window.I18n.t(text) : text;
}

// ============================================================
// ユーティリティ関数
// ============================================================

// --- ローディング表示管理 ---
let loadingStartTime = null;
const MIN_LOADING_DURATION = 200; // 最小表示時間（ミリ秒）- UX改善のため

/**
 * ローディングオーバーレイを表示
 * 強制reflowでペイントを確実にし、最小表示時間を記録
 */
function showLoading() {
  loadingOverlay.classList.add("visible");
  // 強制的にreflowを発生させてペイントを確実にする
  void loadingOverlay.offsetHeight;
  loadingStartTime = Date.now();
}

/**
 * ローディングオーバーレイを非表示
 * 最小表示時間（200ms）に達していない場合は待機してから非表示
 * これにより、高速な処理でもローディング表示がチラつかない
 */
function hideLoading() {
  if (loadingStartTime === null) {
    loadingOverlay.classList.remove("visible");
    return;
  }

  const elapsed = Date.now() - loadingStartTime;
  const remaining = MIN_LOADING_DURATION - elapsed;

  if (remaining > 0) {
    // 最小表示時間に達していない場合は、残り時間だけ待つ
    setTimeout(() => {
      loadingOverlay.classList.remove("visible");
      loadingStartTime = null;
    }, remaining);
  } else {
    // すでに最小表示時間を超えている場合は即座に非表示
    loadingOverlay.classList.remove("visible");
    loadingStartTime = null;
  }
}

/**
 * 読み取り結果のステータス表示を更新
 * @param {string} message - ステータスメッセージ（"SUCCESS", "FAIL", "読み取り準備完了"など）
 * @param {string} decodedText - 復号されたデータ（URLやテキスト）
 */
function setStatus(key, decodedText) {
  const messages = {
    notLoaded: "未読込",
    ready: "読み取り準備完了",
    fail: "FAIL（読み取り不可）",
    success: "SUCCESS（読み取り成功）"
  };
  currentStatus = { key, decodedText: decodedText || "" };
  const message = tr(messages[key] || key);
  decodeStatusEl.textContent = message;
  decodedDataEl.textContent = decodedText || "";

  // ステータスバッジの色を更新
  decodeStatusEl.classList.remove("status-idle", "status-success", "status-fail");
  if (message.includes("SUCCESS") || message.includes("成功")) {
    decodeStatusEl.classList.add("status-success");
  } else if (message.includes("FAIL") || message.includes("失敗") || message.includes("不可")) {
    decodeStatusEl.classList.add("status-fail");
  } else {
    decodeStatusEl.classList.add("status-idle");
  }
}

function clearOverlay() {
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  damageRatioEl.textContent = "-";
  updateDamageHeatmap();
  updateEffectPreview();
}

function getEffects() {
  return ExperimentCore.normalizeEffects({
    blur: blurSlider.value,
    contrast: contrastSlider.value,
    rotation: rotationSlider.value
  });
}

function renderComposite(targetCanvas, targetCtx) {
  const effects = getEffects();
  const source = document.createElement("canvas");
  source.width = baseCanvas.width;
  source.height = baseCanvas.height;
  const sourceCtx = source.getContext("2d");
  sourceCtx.drawImage(baseCanvas, 0, 0);
  sourceCtx.drawImage(overlayCanvas, 0, 0);

  targetCtx.save();
  targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetCtx.fillStyle = "#ffffff";
  targetCtx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetCtx.filter = `blur(${effects.blur}px) contrast(${effects.contrast}%)`;
  targetCtx.translate(targetCanvas.width / 2, targetCanvas.height / 2);
  targetCtx.rotate(effects.rotation * Math.PI / 180);
  targetCtx.drawImage(source, -source.width / 2, -source.height / 2);
  targetCtx.restore();
  return effects;
}

function updateEffectPreview() {
  const effects = renderComposite(effectCanvas, effectCtx);
  const active = ExperimentCore.hasEffects(effects);
  effectCanvas.classList.toggle("visible", active);
  canvasDropZone.classList.toggle("effects-active", active);
}

const presetLabels = {
  "finder-attack": "Finder破壊",
  "timing-damage": "Timing攻撃",
  "data-scatter": "Data汚損",
  "global-dirt": "全体劣化",
  "corner-sticker": "角ステッカー"
};

function updateExperimentSummary() {
  const effects = getEffects();
  resultPreset.textContent = lastPresetName ? tr(presetLabels[lastPresetName]) : tr("手動／なし");
  resultSeed.textContent = ExperimentCore.normalizeSeed(experimentSeed.value);
  const parts = [];
  if (effects.blur) parts.push(`${tr("ぼかし")} ${effects.blur}px`);
  if (effects.contrast !== 100) parts.push(`${tr("コントラスト")} ${effects.contrast}%`);
  if (effects.rotation) parts.push(`${tr("回転")} ${effects.rotation}°`);
  resultEffects.textContent = parts.length ? parts.join(" / ") : tr("なし");
}

function updateDamageHeatmap() {
  if (!showDamageHeatmap.checked) {
    damageHeatmapCanvas.classList.remove("visible");
    return;
  }
  damageHeatmapCanvas.classList.add("visible");

  const w = overlayCanvas.width;
  const h = overlayCanvas.height;
  const imgData = overlayCtx.getImageData(0, 0, w, h);
  const data = imgData.data;

  damageHeatmapCtx.clearRect(0, 0, w, h);

  const gridSize = 20;
  const cellW = w / gridSize;
  const cellH = h / gridSize;

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      let damagedPixels = 0;
      let totalPixels = 0;

      const startX = Math.floor(gx * cellW);
      const startY = Math.floor(gy * cellH);
      const endX = Math.floor((gx + 1) * cellW);
      const endY = Math.floor((gy + 1) * cellH);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx + 3] !== 0) {
            damagedPixels++;
          }
          totalPixels++;
        }
      }

      const ratio = damagedPixels / totalPixels;
      if (ratio > 0) {
        const intensity = Math.min(ratio * 2, 1);
        damageHeatmapCtx.fillStyle = `rgba(255, 0, 0, ${intensity * 0.5})`;
        damageHeatmapCtx.fillRect(startX, startY, cellW, cellH);
      }
    }
  }
}

function updateQrDetails(result, img) {
  if (!result) {
    qrDetailsEl.style.display = "none";
    setTimeout(() => updatePanelHeights(), 10);
    return;
  }

  qrDetailsEl.style.display = "block";
  imageSizeEl.textContent = `${img.naturalWidth} × ${img.naturalHeight} px`;

  // 推定モジュール数（location.topRightFinderPatternから推測）
  if (result.location) {
    const version = result.version || 1;
    const moduleCount = 17 + 4 * version;
    moduleCountEl.textContent = moduleCount > 0 ? tr(`約 ${moduleCount}`) : tr("不明");
  } else {
    moduleCountEl.textContent = tr("不明");
  }

  dataLengthEl.textContent = tr(result.data ? `${result.data.length} 文字` : "0 文字");

  // パネルの高さを更新
  setTimeout(() => updatePanelHeights(), 10);
}

function resizeAndDrawImageToCanvas(img, canvas, ctx) {
  const maxSize = canvas.width;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  let scale = 1;
  if (iw > ih) {
    scale = maxSize / iw;
  } else {
    scale = maxSize / ih;
  }

  const width = iw * scale;
  const height = ih * scale;
  const offsetX = (maxSize - width) / 2;
  const offsetY = (maxSize - height) / 2;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, offsetX, offsetY, width, height);
}

// ダメージ率（overlayのアルファ）を概算
function calculateDamageRatio() {
  const w = overlayCanvas.width;
  const h = overlayCanvas.height;
  const imgData = overlayCtx.getImageData(0, 0, w, h);
  const data = imgData.data;
  let damaged = 0;

  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];
    if (alpha !== 0) {
      damaged++;
    }
  }
  const total = w * h;
  const ratio = (damaged / total) * 100;
  damageRatioEl.textContent = ratio.toFixed(2) + " %";
}

// 合成キャンバスを生成してQRをデコード
function decodeQrFromComposite() {
  decodeScheduled = false;
  if (!qrImageLoaded) {
    setStatus("notLoaded", "");
    return;
  }

  const tmpCanvas = document.createElement("canvas");
  tmpCanvas.width = baseCanvas.width;
  tmpCanvas.height = baseCanvas.height;
  const tmpCtx = tmpCanvas.getContext("2d");

  renderComposite(tmpCanvas, tmpCtx);

  const imageData = tmpCtx.getImageData(0, 0, tmpCanvas.width, tmpCanvas.height);

  let result = null;
  try {
    result = jsQR(imageData.data, imageData.width, imageData.height);
  } catch (e) {
    console.error("jsQR error:", e);
  }

  qrDecodeResult = result || null;

  if (!result) {
    setStatus("fail", "");
    updateQrDetails(null, null);
    return;
  }

  setStatus("success", result.data || "");
  versionEl.textContent = result.version ? String(result.version) : tr("不明");
  // ECCはライブラリから直接は取得できないため不明扱い
  eccLevelEl.textContent = tr("不明");

  if (originalImage) {
    updateQrDetails(result, originalImage);
  }
}

// デコードをデバウンス
function scheduleDecode() {
  if (!qrImageLoaded) return;
  if (decodeScheduled) return;
  decodeScheduled = true;
  updateEffectPreview();
  // 少し待ってから実行（連続描画の負荷を軽減）
  setTimeout(() => {
    calculateDamageRatio();
    decodeQrFromComposite();
    updateDamageHeatmap();
  }, 200);
}

// ============================================================
// QRコード画像読み込み
// ============================================================

/**
 * QRコード画像を読み込む共通処理
 * ファイル選択、ドラッグ&ドロップ、サンプルQR選択から呼ばれる
 *
 * @param {File} file - 読み込む画像ファイル
 *
 * 処理フロー:
 * 1. ローディング表示
 * 2. FileReaderで画像をDataURLに変換
 * 3. Imageオブジェクトとして読み込み
 * 4. キャンバスにリサイズ描画
 * 5. jsQRでデコードをスケジュール
 */
function loadQRImage(file) {
  if (!file || !file.type.startsWith("image/")) return;

  showLoading();

  // FileReader自体は非同期。先にローディング表示を描画するため、読み込み開始を
  // 次のイベントループへ送る。
  setTimeout(() => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        originalImage = img;
        qrImageLoaded = true;

        noImageOverlay.style.display = "none";
        analysisNoImageOverlay.style.display = "none";

        resizeAndDrawImageToCanvas(img, baseCanvas, baseCtx);
        clearOverlay();
        setStatus("ready", "");

        scheduleDecode();

        // 解析ボタンを有効化、領域描画をリセット
        analyzeButton.disabled = false;
        analyzeHint.textContent = tr("ボタンを押してQRコードを解析します");
        analysisPerformed = false;

        // 分析タブが開いている場合はQRコード画像のみ表示
        const analyzeTab = document.getElementById("tab-analyze");
        if (analyzeTab && analyzeTab.classList.contains("active")) {
          drawQRImageOnly();
        }

        hideLoading();
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  }, 0);
}

fileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  fileName.textContent = file ? file.name : tr("選択されていません");
  loadQRImage(file);
});

// ============================================================
// ダメージツール選択
// ============================================================

// ツール情報マップ（アイコン、名前、カーソルクラス）
const toolInfo = {
  pen: { icon: "✏️", name: "ペン", cursor: "cursor-pen" },
  dust: { icon: "💧", name: "汚れブラシ", cursor: "cursor-dust" },
  shadow: { icon: "🌑", name: "影", cursor: "cursor-shadow" },
  mask: { icon: "📄", name: "ステッカー", cursor: "cursor-mask" },
  noise: { icon: "⚡", name: "ノイズ", cursor: "cursor-noise" }
};

function updateToolDisplay(toolValue) {
  const info = toolInfo[toolValue];
  if (info) {
    currentToolIcon.textContent = info.icon;
  currentToolName.textContent = tr(info.name);

    // カーソルスタイルを更新
    canvasDropZone.classList.remove("cursor-pen", "cursor-dust", "cursor-shadow", "cursor-mask", "cursor-noise");
    canvasDropZone.classList.add(info.cursor);
  }
}

document.querySelectorAll('input[name="tool"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    currentTool = radio.value;
    updateToolDisplay(currentTool);
  });
});

// 初期表示
updateToolDisplay("pen");

// ===== 描画イベント（マウス・タッチ共通） =====

function getCanvasPos(canvas, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * canvas.width;
  const y = ((clientY - rect.top) / rect.height) * canvas.height;
  return { x, y };
}

function handlePointerDown(ev) {
  if (!qrImageLoaded) return;
  ev.preventDefault();
  const point = ev.touches ? ev.touches[0] : ev;
  const pos = getCanvasPos(overlayCanvas, point.clientX, point.clientY);
  drawing = true;
  lastPos = pos;

  if (currentTool === "shadow") {
    shadowStart = pos;
  } else if (currentTool === "mask") {
    maskStart = pos;
  } else if (currentTool === "dust") {
    drawDustAt(pos);
    scheduleDecode();
  } else if (currentTool === "noise") {
    drawNoiseBurstAt(pos);
    scheduleDecode();
  }
}

function handlePointerMove(ev) {
  if (!drawing) return;
  ev.preventDefault();
  const point = ev.touches ? ev.touches[0] : ev;
  const pos = getCanvasPos(overlayCanvas, point.clientX, point.clientY);

  if (currentTool === "pen") {
    drawPenLine(lastPos, pos);
    lastPos = pos;
    scheduleDecode();
  } else if (currentTool === "dust") {
    drawDustAt(pos);
    scheduleDecode();
  } else if (currentTool === "noise") {
    drawNoiseBurstAt(pos);
    scheduleDecode();
  } else if (currentTool === "shadow" && shadowStart) {
    // プレビュー表示
    drawShadowPreview(shadowStart, pos);
  } else if (currentTool === "mask" && maskStart) {
    // プレビュー表示
    drawMaskPreview(maskStart, pos);
  }
}

function handlePointerUp(ev) {
  if (!drawing) return;
  ev.preventDefault();
  drawing = false;

  if (currentTool === "shadow" && shadowStart) {
    const point = ev.changedTouches ? ev.changedTouches[0] : ev;
    const end = getCanvasPos(overlayCanvas, point.clientX, point.clientY);
    drawShadowEllipse(shadowStart, end);
    shadowStart = null;
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    scheduleDecode();
  } else if (currentTool === "mask" && maskStart) {
    const point = ev.changedTouches ? ev.changedTouches[0] : ev;
    const end = getCanvasPos(overlayCanvas, point.clientX, point.clientY);
    drawMaskRect(maskStart, end);
    maskStart = null;
    previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
    scheduleDecode();
  }
}

overlayCanvas.addEventListener("mousedown", handlePointerDown);
overlayCanvas.addEventListener("mousemove", handlePointerMove);
overlayCanvas.addEventListener("mouseup", handlePointerUp);
overlayCanvas.addEventListener("mouseleave", handlePointerUp);

overlayCanvas.addEventListener("touchstart", handlePointerDown, { passive: false });
overlayCanvas.addEventListener("touchmove", handlePointerMove, { passive: false });
overlayCanvas.addEventListener("touchend", handlePointerUp, { passive: false });
overlayCanvas.addEventListener("touchcancel", handlePointerUp, { passive: false });

// ============================================================
// ダメージ描画処理
// ============================================================

/**
 * 影のプレビューを描画（ドラッグ中）
 * @param {Object} p1 - 開始位置 {x, y}
 * @param {Object} p2 - 現在位置 {x, y}
 */
function drawShadowPreview(p1, p2) {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  const opacity = Number(shadowOpacitySlider.value) / 100;
  const x = (p1.x + p2.x) / 2;
  const y = (p1.y + p2.y) / 2;
  const rx = Math.abs(p2.x - p1.x) / 2;
  const ry = Math.abs(p2.y - p1.y) / 2;

  if (rx < 5 || ry < 5) return;

  previewCtx.save();
  previewCtx.beginPath();
  previewCtx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  previewCtx.fillStyle = `rgba(0,0,0,${opacity.toFixed(2)})`;
  previewCtx.fill();
  previewCtx.restore();
}

function drawMaskPreview(p1, p2) {
  previewCtx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  const size = Number(sizeSlider.value);
  const color = maskColorSelect.value === "black" ? "#000000" : "#ffffff";

  const x1 = Math.min(p1.x, p2.x);
  const y1 = Math.min(p1.y, p2.y);
  const x2 = Math.max(p1.x, p2.x);
  const y2 = Math.max(p1.y, p2.y);

  const width = Math.max(x2 - x1, size);
  const height = Math.max(y2 - y1, size);

  previewCtx.save();
  previewCtx.fillStyle = color;
  previewCtx.globalAlpha = 0.7;
  previewCtx.fillRect(x1, y1, width, height);
  previewCtx.restore();
}

function drawPenLine(p1, p2) {
  const size = Number(sizeSlider.value);
  overlayCtx.save();
  overlayCtx.lineCap = "round";
  overlayCtx.lineJoin = "round";
  overlayCtx.strokeStyle = "#000000";
  overlayCtx.globalAlpha = 1.0;
  overlayCtx.lineWidth = size;
  overlayCtx.beginPath();
  overlayCtx.moveTo(p1.x, p1.y);
  overlayCtx.lineTo(p2.x, p2.y);
  overlayCtx.stroke();
  overlayCtx.restore();
}

function drawDustAt(pos) {
  const density = Number(noiseDensitySlider.value); // 1〜10
  const brushSize = Number(sizeSlider.value); // サイズスライダーの値を使用
  const radius = brushSize; // ブラシサイズに応じて範囲を変更
  overlayCtx.save();
  overlayCtx.fillStyle = "rgba(80,80,80,0.5)";
  for (let i = 0; i < density * 5; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const x = pos.x + Math.cos(angle) * r;
    const y = pos.y + Math.sin(angle) * r;
    const size = 1 + Math.random() * 2;
    overlayCtx.fillRect(x, y, size, size);
  }
  overlayCtx.restore();
}

function drawNoiseBurstAt(pos) {
  const density = Number(noiseDensitySlider.value); // 1〜10
  const brushSize = Number(sizeSlider.value); // サイズスライダーの値を使用
  const radius = brushSize * 1.5; // ノイズは少し広めに散布
  overlayCtx.save();
  overlayCtx.fillStyle = "rgba(0,0,0,0.7)";
  for (let i = 0; i < density * 10; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const x = pos.x + Math.cos(angle) * r;
    const y = pos.y + Math.sin(angle) * r;
    const size = 1 + Math.random() * 3;
    overlayCtx.fillRect(x, y, size, size);
  }
  overlayCtx.restore();
}

function drawShadowEllipse(p1, p2) {
  const opacity = Number(shadowOpacitySlider.value) / 100; // 0.1〜0.8
  const x = (p1.x + p2.x) / 2;
  const y = (p1.y + p2.y) / 2;
  const rx = Math.abs(p2.x - p1.x) / 2;
  const ry = Math.abs(p2.y - p1.y) / 2;

  if (rx < 5 || ry < 5) return;

  overlayCtx.save();
  overlayCtx.beginPath();
  overlayCtx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  overlayCtx.fillStyle = `rgba(0,0,0,${opacity.toFixed(2)})`;
  overlayCtx.fill();
  overlayCtx.restore();
}

function drawMaskRect(p1, p2) {
  const size = Number(sizeSlider.value);
  const color = maskColorSelect.value === "black" ? "#000000" : "#ffffff";

  const x1 = Math.min(p1.x, p2.x);
  const y1 = Math.min(p1.y, p2.y);
  const x2 = Math.max(p1.x, p2.x);
  const y2 = Math.max(p1.y, p2.y);

  // 最低サイズをsizeに合わせる
  const width = Math.max(x2 - x1, size);
  const height = Math.max(y2 - y1, size);

  overlayCtx.save();
  overlayCtx.fillStyle = color;
  overlayCtx.fillRect(x1, y1, width, height);
  overlayCtx.restore();
}

// リセットボタン
clearOverlayButton.addEventListener("click", () => {
  clearOverlay();
  blurSlider.value = 0;
  contrastSlider.value = 100;
  rotationSlider.value = 0;
  blurValue.textContent = "0";
  contrastValue.textContent = "100";
  rotationValue.textContent = "0";
  lastPresetName = null;
  repeatExperimentButton.disabled = true;
  updateEffectPreview();
  updateExperimentSummary();
  scheduleDecode();
});

// ============================================================
// 解析タブ: QRコード構造解析（教育用モデル）
// ============================================================

/**
 * QRコードのモジュールサイズを推定
 * jsQRのlocation情報から実際のモジュールサイズを計算
 *
 * @param {Object} location - jsQRが返す位置情報（topLeftFinderPattern等）
 * @param {number} version - QRコードバージョン（1-40）
 * @returns {number} モジュールサイズ（ピクセル単位）
 */
function estimateModuleSize(location, version) {
  if (!location) return 10; // デフォルト
  return QRCore.calculateQRModuleMetrics(location, version).moduleSize;
}

// Alignmentパターンの位置を取得（QR仕様に基づく）
function getAlignmentPatternPositions(version) {
  return QRCore.getAlignmentPatternPositions(version);
}

// QRコード画像のみを描画（領域オーバーレイなし）
function drawQRImageOnly() {
  analysisCtx.clearRect(0, 0, analysisCanvas.width, analysisCanvas.height);
  if (!qrImageLoaded || !originalImage) {
    analysisNoImageOverlay.style.display = "flex";
    return;
  }

  analysisNoImageOverlay.style.display = "none";

  // 元画像を描画（baseCanvasと同様にリサイズ）
  resizeAndDrawImageToCanvas(originalImage, analysisCanvas, analysisCtx);
}

// ============================================================
// 解析タブ - 領域描画のための補助関数群（リファクタリング済み）
// ============================================================
// drawRegionOverlays()を8つの単一責任関数に分割
// 1. validateAnalysisState() - バリデーション
// 2. calculateQRCanvasTransform() - キャンバス変換計算
// 3. calculateQRModuleMetrics() - モジュールメトリクス計算
// 4. defineQRStructureRegions() - 構造領域定義
// 5. calculateHeatmapScores() - ヒートマップスコア計算
// 6. drawHeatmapLayer() - ヒートマップ描画
// 7. drawStructureLayers() - 構造レイヤー描画
// 8. updateAnalysisMetrics() - メトリクス更新

/**
 * 解析が可能な状態かチェック
 * QRコードが読み込まれ、解析が実行され、jsQRの結果があるか検証
 *
 * @returns {boolean} 解析可能ならtrue
 */
function validateAnalysisState() {
  if (!qrImageLoaded || !originalImage || !analysisPerformed || !qrDecodeResult) {
    return false;
  }
  if (!qrDecodeResult.location) {
    console.warn("QRコードのlocation情報が取得できませんでした");
    return false;
  }
  return true;
}

// QRコードのキャンバス上での変換情報を計算
function calculateQRCanvasTransform() {
  const w = analysisCanvas.width;
  const h = analysisCanvas.height;
  const maxSize = analysisCanvas.width;
  const iw = originalImage.naturalWidth;
  const ih = originalImage.naturalHeight;
  let scale = 1;
  if (iw > ih) {
    scale = maxSize / iw;
  } else {
    scale = maxSize / ih;
  }
  const qrWidth = iw * scale;
  const qrHeight = ih * scale;
  const offsetX = (maxSize - qrWidth) / 2;
  const offsetY = (maxSize - qrHeight) / 2;

  return { w, h, maxSize, scale, qrWidth, qrHeight, offsetX, offsetY };
}

// モジュール数とサイズを計算
function calculateQRModuleMetrics(location, version) {
  return QRCore.calculateQRModuleMetrics(location, version);
}

// QRコード構造領域を定義
function defineQRStructureRegions(metrics) {
  const { topLeft, topRight, bottomLeft, horizontalDistance, verticalDistance, moduleSize, finderModuleSize } = metrics;

  const regions = {
    finder: [
      { x: topLeft.x - finderModuleSize / 2, y: topLeft.y - finderModuleSize / 2, w: finderModuleSize, h: finderModuleSize },
      { x: topRight.x - finderModuleSize / 2, y: topRight.y - finderModuleSize / 2, w: finderModuleSize, h: finderModuleSize },
      { x: bottomLeft.x - finderModuleSize / 2, y: bottomLeft.y - finderModuleSize / 2, w: finderModuleSize, h: finderModuleSize }
    ],
    timing: [
      {
        x: topLeft.x + finderModuleSize / 2,
        y: topLeft.y - moduleSize / 2,
        w: horizontalDistance - finderModuleSize,
        h: moduleSize
      },
      {
        x: topLeft.x - moduleSize / 2,
        y: topLeft.y + finderModuleSize / 2,
        w: moduleSize,
        h: verticalDistance - finderModuleSize
      }
    ],
    format: [
      { x: topLeft.x + finderModuleSize / 2, y: topLeft.y - finderModuleSize / 2, w: moduleSize, h: finderModuleSize },
      { x: topLeft.x - finderModuleSize / 2, y: topLeft.y + finderModuleSize / 2, w: finderModuleSize, h: moduleSize },
      { x: topRight.x - finderModuleSize / 2, y: topRight.y + finderModuleSize / 2, w: finderModuleSize, h: moduleSize },
      { x: bottomLeft.x + finderModuleSize / 2, y: bottomLeft.y - finderModuleSize / 2, w: moduleSize, h: finderModuleSize }
    ]
  };

  const dataRegion = {
    x: topLeft.x + finderModuleSize * 0.6,
    y: topLeft.y + finderModuleSize * 0.6,
    w: horizontalDistance - finderModuleSize * 1.2,
    h: verticalDistance - finderModuleSize * 1.2
  };

  return { regions, dataRegion };
}

// ヒートマップスコアを計算
function calculateHeatmapScores(canvasTransform, regions, dataRegion) {
  const { w, h } = canvasTransform;
  const gridSize = 20;
  const cellW = w / gridSize;
  const cellH = h / gridSize;

  const scores = [];
  let highRiskCount = 0;
  let finderScoreSum = 0;
  let finderScoreCells = 0;
  let dataScoreSum = 0;
  let dataScoreCells = 0;

  function rectsIntersect(a, b) {
    return !(
      a.x + a.w <= b.x ||
      b.x + b.w <= a.x ||
      a.y + a.h <= b.y ||
      b.y + b.h <= a.y
    );
  }

  for (let gy = 0; gy < gridSize; gy++) {
    for (let gx = 0; gx < gridSize; gx++) {
      const cellRect = {
        x: gx * cellW,
        y: gy * cellH,
        w: cellW,
        h: cellH
      };

      let score = 0;

      if (regions.finder.some((r) => rectsIntersect(r, cellRect))) {
        score += 3;
      }

      if (regions.timing.some((r) => rectsIntersect(r, cellRect))) {
        score += 2;
      }

      if (regions.format.some((r) => rectsIntersect(r, cellRect))) {
        score += 1.5;
      }

      if (rectsIntersect(dataRegion, cellRect)) {
        score += 1;
      }

      scores.push({ gx, gy, score });

      if (score >= 3) {
        highRiskCount++;
      }

      if (regions.finder.some((r) => rectsIntersect(r, cellRect))) {
        finderScoreSum += score;
        finderScoreCells++;
      } else if (rectsIntersect(dataRegion, cellRect)) {
        dataScoreSum += score;
        dataScoreCells++;
      }
    }
  }

  return {
    scores,
    gridSize,
    cellW,
    cellH,
    highRiskCount,
    finderScoreSum,
    finderScoreCells,
    dataScoreSum,
    dataScoreCells
  };
}

// ヒートマップレイヤーを描画
function drawHeatmapLayer(heatmapData) {
  if (!layerHeatmap.checked) return;

  const { scores, cellW, cellH } = heatmapData;

  scores.forEach(({ gx, gy, score }) => {
    if (score <= 0) return;
    const maxScore = 5;
    const t = Math.min(score / maxScore, 1);
    const r = Math.round(255 * t);
    const g = Math.round(255 * (1 - Math.max(0, (t - 0.3) / 0.7)));
    const b = 0;
    analysisCtx.fillStyle = `rgba(${r},${g},${b},0.35)`;
    analysisCtx.fillRect(gx * cellW, gy * cellH, cellW, cellH);
  });
}

// 構造レイヤーを描画
function drawStructureLayers(regions, dataRegion, metrics, version) {
  // Data領域
  if (layerData.checked) {
    analysisCtx.save();
    analysisCtx.fillStyle = "rgba(255, 152, 0, 0.25)";
    analysisCtx.fillRect(dataRegion.x, dataRegion.y, dataRegion.w, dataRegion.h);
    analysisCtx.strokeStyle = "rgba(255, 152, 0, 0.6)";
    analysisCtx.lineWidth = 2;
    analysisCtx.strokeRect(dataRegion.x, dataRegion.y, dataRegion.w, dataRegion.h);
    analysisCtx.restore();
  }

  // Format情報
  if (layerFormat.checked) {
    analysisCtx.save();
    analysisCtx.fillStyle = "rgba(156, 39, 176, 0.35)";
    analysisCtx.strokeStyle = "rgba(156, 39, 176, 0.8)";
    analysisCtx.lineWidth = 2;
    regions.format.forEach((r) => {
      analysisCtx.fillRect(r.x, r.y, r.w, r.h);
      analysisCtx.strokeRect(r.x, r.y, r.w, r.h);
    });
    analysisCtx.restore();
  }

  // Timingパターン
  if (layerTiming.checked) {
    analysisCtx.save();
    analysisCtx.fillStyle = "rgba(76, 175, 80, 0.4)";
    analysisCtx.strokeStyle = "rgba(76, 175, 80, 0.9)";
    analysisCtx.lineWidth = 3;
    regions.timing.forEach((r) => {
      analysisCtx.fillRect(r.x, r.y, r.w, r.h);
      analysisCtx.strokeRect(r.x, r.y, r.w, r.h);
    });
    analysisCtx.restore();
  }

  // Finderパターン
  if (layerFinder.checked) {
    analysisCtx.save();
    analysisCtx.fillStyle = "rgba(33, 150, 243, 0.4)";
    analysisCtx.strokeStyle = "rgba(33, 150, 243, 1)";
    analysisCtx.lineWidth = 3;
    regions.finder.forEach((r) => {
      analysisCtx.fillRect(r.x, r.y, r.w, r.h);
      analysisCtx.strokeRect(r.x, r.y, r.w, r.h);
    });
    analysisCtx.restore();
  }

  // Alignmentパターン（バージョン2以上）
  if (layerFinder.checked && qrDecodeResult && qrDecodeResult.version >= 2) {
    const alignmentPositions = getAlignmentPatternPositions(version);

    if (alignmentPositions.length > 0) {
      analysisCtx.save();
      analysisCtx.strokeStyle = "rgba(233, 30, 99, 0.9)";
      analysisCtx.fillStyle = "rgba(233, 30, 99, 0.3)";
      analysisCtx.lineWidth = 2;

      alignmentPositions.forEach(([row, col]) => {
        const { x, y } = QRCore.mapModulePoint(metrics, row, col);
        const { moduleSize } = metrics;
        const radius = moduleSize * 2.5;

        analysisCtx.beginPath();
        analysisCtx.arc(x, y, radius, 0, Math.PI * 2);
        analysisCtx.fill();
        analysisCtx.stroke();

        analysisCtx.fillStyle = "rgba(233, 30, 99, 0.8)";
        analysisCtx.beginPath();
        analysisCtx.arc(x, y, moduleSize * 0.5, 0, Math.PI * 2);
        analysisCtx.fill();
        analysisCtx.fillStyle = "rgba(233, 30, 99, 0.3)";
      });
      analysisCtx.restore();
    }
  }
}

// 解析メトリクスを更新
function updateAnalysisMetrics(heatmapData) {
  const { gridSize, highRiskCount, finderScoreSum, finderScoreCells, dataScoreSum, dataScoreCells } = heatmapData;

  const totalCells = gridSize * gridSize;
  const highRatio = (highRiskCount / totalCells) * 100;
  highRiskRatioEl.textContent = highRatio.toFixed(1) + " %";

  finderScoreEl.textContent =
    finderScoreCells > 0 ? (finderScoreSum / finderScoreCells).toFixed(2) : "-";
  dataScoreEl.textContent =
    dataScoreCells > 0 ? (dataScoreSum / dataScoreCells).toFixed(2) : "-";
}

// ===== メイン関数：領域オーバーレイを描画 =====

// 領域オーバーレイのみを描画（QRコード画像の上に重ねる）
function drawRegionOverlays() {
  // バリデーション
  if (!validateAnalysisState()) {
    return;
  }

  // QRコード画像を再描画
  drawQRImageOnly();

  // キャンバス変換情報を計算
  const canvasTransform = calculateQRCanvasTransform();

  // QRコードのバージョンと位置情報
  const version = qrDecodeResult.version || 1;
  const location = qrDecodeResult.location;

  // モジュールメトリクスを計算
  const metrics = calculateQRModuleMetrics(location, version);

  // 構造領域を定義
  const { regions, dataRegion } = defineQRStructureRegions(metrics);

  // ヒートマップスコアを計算
  const heatmapData = calculateHeatmapScores(canvasTransform, regions, dataRegion);

  // ヒートマップレイヤーを描画
  drawHeatmapLayer(heatmapData);

  // 構造レイヤーを描画
  drawStructureLayers(regions, dataRegion, metrics, version);

  // メトリクスを更新
  updateAnalysisMetrics(heatmapData);
}

function computeRiskMetrics() {
  if (!qrImageLoaded || !originalImage) {
    highRiskRatioEl.textContent = "-";
    finderScoreEl.textContent = "-";
    dataScoreEl.textContent = "-";
    return;
  }
  // drawRegionOverlays内で計算されるので、ここでは何もしない
}

// 解析ボタンのイベントハンドラー
analyzeButton.addEventListener("click", () => {
  if (!qrImageLoaded || !originalImage || !qrDecodeResult) return;

  analysisPerformed = true;
  analyzeHint.textContent = tr("✓ 解析完了 - 各レイヤーの表示/非表示を切り替えられます");
  drawRegionOverlays();
});

// レイヤーのON/OFF変更時
[layerFinder, layerTiming, layerFormat, layerData, layerHeatmap].forEach((el) => {
  el.addEventListener("change", () => {
    if (!qrImageLoaded || !originalImage || !analysisPerformed) return;
    drawRegionOverlays();
  });
});

// 初期状態
setStatus("notLoaded", "");
damageRatioEl.textContent = "-";
eccLevelEl.textContent = tr("不明");
versionEl.textContent = tr("不明");
highRiskRatioEl.textContent = "-";
finderScoreEl.textContent = "-";
dataScoreEl.textContent = "-";

// ===== スライダー値のリアルタイム表示 =====

sizeSlider.addEventListener("input", () => {
  sizeValue.textContent = sizeSlider.value;
});

shadowOpacitySlider.addEventListener("input", () => {
  shadowOpacityValue.textContent = shadowOpacitySlider.value;
});

noiseDensitySlider.addEventListener("input", () => {
  noiseDensityValue.textContent = noiseDensitySlider.value;
});

// ===== ドラッグ＆ドロップ対応 =====

// 読み込みセクションのドロップゾーン
if (loadDropZone) {
  loadDropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    loadDropZone.classList.add("drag-over");
  });

  loadDropZone.addEventListener("dragleave", () => {
    loadDropZone.classList.remove("drag-over");
  });

  loadDropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    loadDropZone.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    loadQRImage(file);
  });
}

// キャンバスエリアのドロップゾーン
canvasDropZone.addEventListener("dragover", (e) => {
  e.preventDefault();
  canvasDropZone.classList.add("drag-over");
});

canvasDropZone.addEventListener("dragleave", () => {
  canvasDropZone.classList.remove("drag-over");
});

canvasDropZone.addEventListener("drop", (e) => {
  e.preventDefault();
  canvasDropZone.classList.remove("drag-over");
  const file = e.dataTransfer.files[0];
  loadQRImage(file);
});

// ===== パネルの折りたたみ =====

function updatePanelHeights() {
  document.querySelectorAll(".panel-content:not(.collapsed)").forEach((panel) => {
    panel.style.maxHeight = panel.scrollHeight + "px";
  });
}

document.querySelectorAll(".toggle-panel").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const panel = document.getElementById(targetId);
    if (panel) {
      if (panel.classList.contains("collapsed")) {
        panel.classList.remove("collapsed");
        panel.style.maxHeight = panel.scrollHeight + "px";
        btn.textContent = "−";
      } else {
        panel.style.maxHeight = panel.scrollHeight + "px";
        panel.classList.add("collapsed");
        btn.textContent = "+";
      }
    }
  });
});

// 初期状態のmax-heightを設定
document.querySelectorAll(".panel-content").forEach((panel) => {
  panel.style.maxHeight = "none";
});

// ===== ダメージヒートマップ表示切替 =====

showDamageHeatmap.addEventListener("change", () => {
  updateDamageHeatmap();
});

// ===== サンプルQRコード選択 =====

const sampleQRs = {
  sample1: "https://hack.booth.pm/items/7517001",
  sample2: "https://hack.booth.pm/items/6833516"
};

function createSampleDataUrl(value) {
  const qr = qrcode(0, "M");
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  const quiet = 4;
  const scale = 12;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = (count + quiet * 2) * scale;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000";
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) ctx.fillRect((col + quiet) * scale, (row + quiet) * scale, scale, scale);
    }
  }
  return canvas.toDataURL("image/png");
}

sampleQrSelect.addEventListener("change", () => {
  const selected = sampleQrSelect.value;
  if (!selected || !sampleQRs[selected]) return;

  showLoading();

  // 次のイベントループに遅延して、ローディング表示を確実にレンダリング
  setTimeout(() => {
    const img = new Image();
    img.onload = () => {
      originalImage = img;
      qrImageLoaded = true;

      noImageOverlay.style.display = "none";
      analysisNoImageOverlay.style.display = "none";

      resizeAndDrawImageToCanvas(img, baseCanvas, baseCtx);
      clearOverlay();
      setStatus("ready", "");

      scheduleDecode();

      // 解析ボタンを有効化、領域描画をリセット
      analyzeButton.disabled = false;
      analyzeHint.textContent = tr("ボタンを押してQRコードを解析します");
      analysisPerformed = false;

      // 分析タブが開いている場合はQRコード画像のみ表示
      const analyzeTab = document.getElementById("tab-analyze");
      if (analyzeTab && analyzeTab.classList.contains("active")) {
        drawQRImageOnly();
      }

      hideLoading();
    };
    img.onerror = () => {
      alert(tr("サンプルQRコードの読み込みに失敗しました。"));
      hideLoading();
    };
    img.src = createSampleDataUrl(sampleQRs[selected]);
  }, 0);
});

// ===== 攻撃シナリオプリセット =====

function applyPreset(presetName) {
  if (!qrImageLoaded) {
    alert(tr("先にQRコード画像を読み込んでください。"));
    return;
  }

  clearOverlay();
  const seed = ExperimentCore.normalizeSeed(experimentSeed.value);
  experimentSeed.value = seed;
  const random = ExperimentCore.createSeededRandom(seed);

  const w = overlayCanvas.width;
  const h = overlayCanvas.height;

  // QRコードの実際の位置情報を使用（利用可能な場合）
  let finderSize, margin, finderPositions;

  if (qrDecodeResult && qrDecodeResult.location) {
    // jsQRから実際の位置情報を取得
    const location = qrDecodeResult.location;
    const topLeft = location.topLeftFinderPattern;
    const version = qrDecodeResult.version || 1;
    const metrics = QRCore.calculateQRModuleMetrics(location, version);
    const moduleSize = metrics.moduleSize;
    finderSize = 7 * moduleSize;

    finderPositions = [
      { x: topLeft.x - finderSize / 2, y: topLeft.y - finderSize / 2 },
      { x: metrics.topRight.x - finderSize / 2, y: metrics.topRight.y - finderSize / 2 },
      { x: metrics.bottomLeft.x - finderSize / 2, y: metrics.bottomLeft.y - finderSize / 2 }
    ];
  } else {
    // フォールバック: 固定比率を使用
    finderSize = w * 0.22;
    margin = w * 0.03;
    finderPositions = [
      { x: margin, y: margin },
      { x: w - finderSize - margin, y: margin },
      { x: margin, y: h - finderSize - margin }
    ];
  }

  switch (presetName) {
    case "finder-attack":
      // ランダムにFinderを選んで集中攻撃
      const targetFinder = finderPositions[Math.floor(random() * 3)];
      const attackSize = finderSize * (0.3 + random() * 0.2); // 0.3-0.5
      const offsetX = random() * (finderSize - attackSize);
      const offsetY = random() * (finderSize - attackSize);
      overlayCtx.fillStyle = "#000000";
      overlayCtx.fillRect(
        targetFinder.x + offsetX,
        targetFinder.y + offsetY,
        attackSize,
        attackSize
      );
      break;

    case "data-scatter":
      // Data領域にランダムな汚れ（位置を毎回変える）
      overlayCtx.fillStyle = "rgba(80,80,80,0.6)";
      const centerX = w * (0.25 + random() * 0.2); // 0.25-0.45
      const centerY = h * (0.25 + random() * 0.2);
      const scatterSize = w * (0.3 + random() * 0.2); // 0.3-0.5
      for (let i = 0; i < 150; i++) {
        const x = centerX + random() * scatterSize;
        const y = centerY + random() * scatterSize;
        const size = 2 + random() * 4;
        overlayCtx.fillRect(x, y, size, size);
      }
      break;

    case "timing-damage":
      // Timingパターンをランダムな位置で破壊
      overlayCtx.fillStyle = "#000000";
      if (qrDecodeResult && qrDecodeResult.location) {
        const location = qrDecodeResult.location;
        const topLeft = location.topLeftFinderPattern;
        const version = qrDecodeResult.version || 1;
        const metrics = QRCore.calculateQRModuleMetrics(location, version);
        const horizontalDistance = metrics.horizontalDistance;
        const verticalDistance = metrics.verticalDistance;
        const moduleSize = metrics.moduleSize;
        const finderModuleSize = 7 * moduleSize;

        // 横または縦をランダムに選択
        if (random() > 0.5) {
          // 横のTiming
          const startX = topLeft.x + finderModuleSize / 2 + random() * (horizontalDistance - finderModuleSize) * 0.5;
          const width = (horizontalDistance - finderModuleSize) * (0.2 + random() * 0.3);
          overlayCtx.fillRect(startX, topLeft.y - moduleSize / 2 - 5, width, moduleSize + 10);
        } else {
          // 縦のTiming
          const startY = topLeft.y + finderModuleSize / 2 + random() * (verticalDistance - finderModuleSize) * 0.5;
          const height = (verticalDistance - finderModuleSize) * (0.2 + random() * 0.3);
          overlayCtx.fillRect(topLeft.x - moduleSize / 2 - 5, startY, moduleSize + 10, height);
        }
      } else {
        // フォールバック
        if (random() > 0.5) {
          overlayCtx.fillRect(margin + finderSize, margin + finderSize / 2 - 10, w - 2 * (margin + finderSize), 20);
        } else {
          overlayCtx.fillRect(margin + finderSize / 2 - 10, margin + finderSize, 20, h - 2 * (margin + finderSize));
        }
      }
      break;

    case "global-dirt":
      // 全体的にランダムな劣化
      overlayCtx.fillStyle = "rgba(100,100,100,0.15)";
      for (let i = 0; i < 300; i++) {
        const x = random() * w;
        const y = random() * h;
        const size = 1 + random() * 3;
        overlayCtx.fillRect(x, y, size, size);
      }
      break;

    case "corner-sticker":
      // ランダムな角にステッカー
      const corners = [
        { x: 0, y: 0 }, // 左上
        { x: w - 80, y: 0 }, // 右上
        { x: 0, y: h - 80 }, // 左下
        { x: w - 80, y: h - 80 } // 右下
      ];
      const corner = corners[Math.floor(random() * 4)];
      const stickerSize = 60 + random() * 40; // 60-100
      const color = random() > 0.5 ? "#ffffff" : "#000000";
      overlayCtx.fillStyle = color;
      overlayCtx.fillRect(corner.x, corner.y, stickerSize, stickerSize);
      break;
  }

  lastPresetName = presetName;
  repeatExperimentButton.disabled = false;
  updateEffectPreview();
  updateExperimentSummary();
  scheduleDecode();
}

document.querySelectorAll(".preset-button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = btn.dataset.preset;
    applyPreset(preset);
  });
});

generateSeedButton.addEventListener("click", () => {
  const values = new Uint32Array(2);
  crypto.getRandomValues(values);
  experimentSeed.value = Array.from(values, value => value.toString(16).padStart(8, "0")).join("");
  updateExperimentSummary();
});

repeatExperimentButton.addEventListener("click", () => {
  if (lastPresetName) applyPreset(lastPresetName);
});

[blurSlider, contrastSlider, rotationSlider].forEach(control => {
  control.addEventListener("input", () => {
    const effects = getEffects();
    blurValue.textContent = effects.blur;
    contrastValue.textContent = effects.contrast;
    rotationValue.textContent = effects.rotation;
    updateEffectPreview();
    updateExperimentSummary();
    scheduleDecode();
  });
});

experimentSeed.addEventListener("input", updateExperimentSummary);

// ===== 学習タブのアコーディオン =====

document.querySelectorAll(".study-toggle").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.dataset.target;
    const content = document.getElementById(targetId);

    if (content) {
      const isCollapsed = content.classList.contains("collapsed");

      if (isCollapsed) {
        // 開く
        content.classList.remove("collapsed");
        btn.classList.add("active");
      } else {
        // 閉じる
        content.classList.add("collapsed");
        btn.classList.remove("active");
      }
    }
  });
});

// ===== 色分けQRコードの生成 =====

function generateColoredQR() {
  const svg = document.getElementById("coloredQrDiagram");
  if (!svg) return;

  // 実際のURLからQRコードを生成
  const url = "https://hack.booth.pm/items/7517001";
  const qr = qrcode(0, 'M'); // Type 0 (自動), Error correction level M
  qr.addData(url);
  qr.make();

  const size = qr.getModuleCount(); // 実際のモジュール数を取得
  const cellSize = 10; // 各モジュールのサイズ
  const totalSize = size * cellSize;

  // SVGのviewBoxを調整
  svg.setAttribute("viewBox", `0 0 ${totalSize} ${totalSize}`);

  // 領域の定義
  function isFinder(x, y) {
    // 左上 (0-6, 0-6)
    if (x <= 6 && y <= 6) return true;
    // 右上
    if (x >= size - 7 && y <= 6) return true;
    // 左下
    if (x <= 6 && y >= size - 7) return true;
    return false;
  }

  function isSeparator(x, y) {
    // Finderの周りの分離パターン（常に白）
    // 左上
    if ((x === 7 && y <= 7) || (y === 7 && x <= 7)) return true;
    // 右上
    if ((x === size - 8 && y <= 7) || (y === 7 && x >= size - 8)) return true;
    // 左下
    if ((x === 7 && y >= size - 8) || (y === size - 8 && x <= 7)) return true;
    return false;
  }

  function isTiming(x, y) {
    // 横のTiming（y=6）
    if (y === 6 && x >= 8 && x < size - 8) return true;
    // 縦のTiming（x=6）
    if (x === 6 && y >= 8 && y < size - 8) return true;
    return false;
  }

  function isFormat(x, y) {
    // Format情報は x=8 または y=8 の位置（Finder領域外）
    // 左上周辺
    if (x === 8 && y <= 8) return true;
    if (y === 8 && x < 8) return true;
    // 右上周辺
    if (x >= size - 8 && y === 8) return true;
    // 左下周辺
    if (y >= size - 7 && x === 8) return true;
    return false;
  }

  // 実際のQRコードデータを取得
  const pattern = [];
  for (let y = 0; y < size; y++) {
    pattern[y] = [];
    for (let x = 0; x < size; x++) {
      // qrcode-generatorから実際のモジュールデータを取得
      // isDark(row, col) が true なら黒（1）、false なら白（0）
      pattern[y][x] = qr.isDark(y, x) ? 1 : 0;
    }
  }

  // SVGに描画
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("x", x * cellSize);
      rect.setAttribute("y", y * cellSize);
      rect.setAttribute("width", cellSize);
      rect.setAttribute("height", cellSize);

      let fillColor;
      const isBlack = pattern[y][x] === 1;

      // Separator（Finderの一部として扱う）
      if (isSeparator(x, y)) {
        fillColor = "#BBDEFB"; // 常に明るい青（Finderの白モジュールと同じ）
      }
      // Finder
      else if (isFinder(x, y)) {
        fillColor = isBlack ? "#2196F3" : "#BBDEFB";
      }
      // Timing
      else if (isTiming(x, y)) {
        fillColor = isBlack ? "#4CAF50" : "#C8E6C9";
      }
      // Format
      else if (isFormat(x, y)) {
        fillColor = isBlack ? "#9C27B0" : "#E1BEE7";
      }
      // Data
      else {
        fillColor = isBlack ? "#FF9800" : "#FFE0B2";
      }

      rect.setAttribute("fill", fillColor);
      rect.setAttribute("stroke", "#fff");
      rect.setAttribute("stroke-width", "0.5");

      svg.appendChild(rect);
    }
  }
}

// ページ読み込み時に生成
if (document.getElementById("coloredQrDiagram")) {
  generateColoredQR();
}

// ===== QRコード構成要素のインタラクティブハイライト =====

function setupQRHighlight() {
  const componentListItems = document.querySelectorAll(".component-list li[data-component]");
  const highlightOverlay = document.getElementById("highlightOverlay");

  if (!highlightOverlay) return;

  // QRコードのサイズを取得（generateColoredQR内と同じ）
  const url = "https://hack.booth.pm/items/7517001";
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  const size = qr.getModuleCount();
  const cellSize = 10;
  const totalSize = size * cellSize;

  highlightOverlay.setAttribute("viewBox", `0 0 ${totalSize} ${totalSize}`);

  // 各構成要素にホバーイベントを設定
  componentListItems.forEach(item => {
    const component = item.dataset.component;

    item.addEventListener("mouseenter", () => {
      // ハイライトオーバーレイをクリア
      while (highlightOverlay.firstChild) {
        highlightOverlay.removeChild(highlightOverlay.firstChild);
      }

      // 各コンポーネントのハイライトを描画
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          let shouldHighlight = false;

          if (component === "finder") {
            shouldHighlight = isFinder(x, y, size);
          } else if (component === "timing") {
            shouldHighlight = isTiming(x, y, size);
          } else if (component === "format") {
            shouldHighlight = isFormat(x, y, size);
          } else if (component === "data") {
            shouldHighlight = isData(x, y, size);
          }

          if (shouldHighlight) {
            const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
            rect.setAttribute("x", x * cellSize);
            rect.setAttribute("y", y * cellSize);
            rect.setAttribute("width", cellSize);
            rect.setAttribute("height", cellSize);
            rect.setAttribute("fill", "rgba(255, 255, 0, 0.4)");
            rect.setAttribute("stroke", "rgba(255, 200, 0, 0.8)");
            rect.setAttribute("stroke-width", "1");
            highlightOverlay.appendChild(rect);
          }
        }
      }

      // オーバーレイを表示
      highlightOverlay.style.opacity = "1";
    });

    item.addEventListener("mouseleave", () => {
      // ハイライトオーバーレイを非表示
      highlightOverlay.style.opacity = "0";
    });
  });
}

// 領域判定関数（generateColoredQRと同じロジック）
function isFinder(x, y, size) {
  // 左上 (0-6, 0-6)
  if (x <= 6 && y <= 6) return true;
  // 右上
  if (x >= size - 7 && y <= 6) return true;
  // 左下
  if (x <= 6 && y >= size - 7) return true;
  return false;
}

function isTiming(x, y, size) {
  // 横のTiming（y=6）
  if (y === 6 && x >= 8 && x < size - 8) return true;
  // 縦のTiming（x=6）
  if (x === 6 && y >= 8 && y < size - 8) return true;
  return false;
}

function isFormat(x, y, size) {
  // Format情報は x=8 または y=8 の位置（Finder領域外）
  // 左上周辺
  if (x === 8 && y <= 8) return true;
  if (y === 8 && x < 8) return true;
  // 右上周辺
  if (x >= size - 8 && y === 8) return true;
  // 左下周辺
  if (y >= size - 7 && x === 8) return true;
  return false;
}

function isData(x, y, size) {
  // Data領域 = Finder、Timing、Formatのいずれでもない箇所
  return !isFinder(x, y, size) && !isTiming(x, y, size) && !isFormat(x, y, size) && !isSeparator(x, y, size);
}

function isSeparator(x, y, size) {
  // Finderの周りの分離パターン（常に白）
  // 左上
  if ((x === 7 && y <= 7) || (y === 7 && x <= 7)) return true;
  // 右上
  if ((x === size - 8 && y <= 7) || (y === 7 && x >= size - 8)) return true;
  // 左下
  if ((x === 7 && y >= size - 8) || (y === size - 8 && x <= 7)) return true;
  return false;
}

// ページ読み込み時にセットアップ
if (document.querySelector(".component-list")) {
  setupQRHighlight();
}

// ===== QRコード座標表示 =====

function setupQRCoordinateDisplay() {
  const coloredQrDiagram = document.getElementById("coloredQrDiagram");
  const coordinateDisplay = document.getElementById("qrCoordinateDisplay");

  if (!coloredQrDiagram || !coordinateDisplay) return;

  // QRコードのサイズを取得
  const url = "https://hack.booth.pm/items/7517001";
  const qr = qrcode(0, 'M');
  qr.addData(url);
  qr.make();

  const size = qr.getModuleCount();
  const cellSize = 10;

  coloredQrDiagram.addEventListener("mousemove", (e) => {
    const svg = coloredQrDiagram;
    const rect = svg.getBoundingClientRect();

    // マウスのSVG内の座標を計算
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // SVGのviewBoxサイズを取得
    const viewBox = svg.viewBox.baseVal;
    const svgWidth = viewBox.width;
    const svgHeight = viewBox.height;

    // マウス座標をviewBox座標系に変換
    const svgX = (x / rect.width) * svgWidth;
    const svgY = (y / rect.height) * svgHeight;

    // モジュール座標を計算（0,0基準）
    const moduleX = Math.floor(svgX / cellSize);
    const moduleY = Math.floor(svgY / cellSize);

    // QRコードの範囲内かチェック
    if (moduleX >= 0 && moduleX < size && moduleY >= 0 && moduleY < size) {
      coordinateDisplay.textContent = tr(`座標: (${moduleX}, ${moduleY})`);
    } else {
      coordinateDisplay.textContent = tr("座標: -");
    }
  });

  coloredQrDiagram.addEventListener("mouseleave", () => {
    coordinateDisplay.textContent = tr("座標: -");
  });
}

// ページ読み込み時にセットアップ
if (document.getElementById("coloredQrDiagram")) {
  setupQRCoordinateDisplay();
}

window.addEventListener("languagechange", () => {
  setStatus(currentStatus.key, currentStatus.decodedText);
  currentToolName.textContent = tr(toolInfo[currentTool].name);
  eccLevelEl.textContent = tr("不明");
  if (!qrDecodeResult || !qrDecodeResult.version) versionEl.textContent = tr("不明");
  if (qrDecodeResult && originalImage) updateQrDetails(qrDecodeResult, originalImage);
  analyzeHint.textContent = analysisPerformed
    ? tr("✓ 解析完了 - 各レイヤーの表示/非表示を切り替えられます")
    : tr(qrImageLoaded ? "ボタンを押してQRコードを解析します" : "左側でQRコードを読み込んでください");
  updateExperimentSummary();
  fileName.textContent = fileInput.files && fileInput.files[0] ? fileInput.files[0].name : tr("選択されていません");
});

updateExperimentSummary();
