(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.I18n = api;
})(typeof window !== "undefined" ? window : null, function (root) {
  "use strict";

  const translations = {
    "QRCrashTest - QRコード破壊耐性クラッシュテスト": "QRCrashTest - QR Code Resilience Lab",
    "表示言語を英語に切り替える": "Switch the display language to English",
    "QRコードに影・汚れ・欠損を与えて、構造と誤り訂正による読み取り耐性を可視化する教育ツール": "An educational tool for visualizing how QR structure and error correction affect readability under shadows, dirt, and damage",
    "読み込み中...": "Loading...", "機能": "Features", "クラッシュテスト": "Crash Test", "解析": "Analysis", "座学": "Learn",
    "QRコード読み込み": "Load a QR Code", "📁 PNG / JPG などのQRコード画像を読み込みます。": "📁 Load a QR code image such as PNG or JPG.",
    "ファイルを選択": "Choose File", "選択されていません": "No file selected",
    "この領域にドラッグ＆ドロップ": "Drag and drop it here", "することもできます。": "as another option.", "サンプルQRコード：": "Sample QR code:",
    "選択してください": "Select a sample", "サンプル1（URL）": "Sample 1 (URL)", "サンプル2（URL）": "Sample 2 (URL)", "使い方": "How to Use",
    "QRコード画像を読み込みます": "Load a QR code image", "ダメージツールを選んでキャンバスに描画します": "Select a damage tool and draw on the canvas",
    "読み取り結果をリアルタイムで確認します": "Check the decoding result in real time", "攻撃プリセットで典型的なダメージを試せます": "Try typical damage with the attack presets",
    "QRコードの構造と誤り訂正の働きを体験的に理解できます。": "Explore how QR structure and error correction work.",
    "📁 QRコード画像をドラッグ＆ドロップ": "📁 Drag and drop a QR code image", "または上のボタンから読み込んでください": "or load one with the control above",
    "読み取り結果": "Decoding Result", "QRコード読み取り状態": "QR code decoding status", "未読込": "Not loaded", "ダメージが占める割合": "Share of pixels covered by damage",
    "破損率：": "Damage ratio:", "誤り訂正レベル（jsQRでは取得不可）": "Error-correction level (unavailable from jsQR)", "不明": "Unknown",
    "QRコードのバージョン": "QR code version", "バージョン：": "Version:", "復号データ：": "Decoded data:", "QR詳細情報": "QR Details",
    "画像サイズ：": "Image size:", "推定モジュール数：": "Estimated module count:", "データ長：": "Data length:", "ダメージツール": "Damage Tools",
    "キャンバス上にダメージを描画できます。描画のたびに自動的に読み取りテストが実行されます。": "Draw damage on the canvas. A decoding test runs automatically after each change.",
    "ペン": "Pen", "自由に線を描いてQRコードを破壊": "Draw freehand lines over the QR code", "散発的な汚れを付着させる": "Add scattered dirt",
    "汚れブラシ": "Dirt Brush", "楕円形の影をかける": "Add an elliptical shadow", "影": "Shadow", "矩形のステッカーを貼り付ける": "Place a rectangular sticker",
    "ステッカー": "Sticker", "ランダムなノイズを発生させる": "Add random noise", "ノイズ": "Noise", "ブラシサイズ:": "Brush size:",
    "影の濃さ:": "Shadow opacity:", "汚れ／ノイズ密度:": "Dirt/noise density:", "ステッカー色": "Sticker color", "白": "White", "黒": "Black",
    "ダメージヒートマップを表示": "Show damage heatmap", "ダメージを受けた領域を赤色のヒートマップで可視化します。破損の分布を直感的に把握できます。": "Show damaged areas as a red heatmap to reveal their distribution.",
    "すべてのダメージをクリア": "Clear all damage", "ダメージをリセット": "Reset Damage", "攻撃シナリオプリセット": "Attack Scenario Presets",
    "同じシードとプリセットは同じダメージを再現します。プリセット適用時は現在の描画を置き換えます。": "The same seed and preset reproduce the same damage. Applying a preset replaces the current drawing.",
    "シード": "Seed", "新しいシード": "New Seed", "同じ条件でもう一度": "Repeat Same Conditions", "撮影条件・幾何変形": "Capture and Geometric Effects",
    "ぼかし": "Blur", "コントラスト": "Contrast", "回転": "Rotation", "構造攻撃": "Structural Attacks", "🎯 Finder破壊": "🎯 Finder Attack",
    "3つのFinderパターンのいずれかをランダムに攻撃。位置検出の要なので致命的。": "Randomly damage one of the three finder patterns, which are essential for position detection.",
    "適用": "Apply", "📏 Timing攻撃": "📏 Timing Attack", "横または縦のTimingパターンを破壊。モジュール位置の基準を狂わせる。": "Damage a horizontal or vertical timing pattern and disrupt the module-position reference.",
    "分散した欠損": "Distributed Damage", "💥 Data汚損": "💥 Data Damage", "Data領域に散発的な汚れを付着。誤り訂正があるため意外と読めてしまうことも。": "Scatter dirt over the data area; error correction may still allow decoding.",
    "🌫️ 全体劣化": "🌫️ Global Degradation", "全体にランダムな汚れを散布。経年劣化や印刷品質の悪さを再現。": "Scatter random dirt over the whole image to model aging or poor print quality.",
    "局所的な遮蔽": "Local Occlusion", "📌 角ステッカー": "📌 Corner Sticker", "4つの角のいずれかにステッカーを貼付。位置によってはFinderを覆う。": "Place a sticker on one of four corners; it may cover a finder pattern.",
    "実験条件": "Experiment Conditions", "デコーダー": "Decoder", "ダメージモデル": "Damage model", "手動／なし": "Manual / none", "画像劣化": "Image effects", "なし": "None",
    "表示結果は、この画像をjsQRで1回読み取った結果です。他のカメラ、照明、印刷条件、デコーダーで同じ結果になることや、一般的な耐性を保証しません。": "This result is one jsQR decoding attempt on this image. It does not guarantee the same result with other cameras, lighting, printing conditions, or decoders, nor general resilience.",
    "📊 このタブでできること": "📊 What You Can Do Here", "読み込んだQRコードの内部構造を可視化し、「どこを破壊すると致命的か」を分析します。": "Visualize the loaded QR code's internal structure and explore which damaged areas are likely to be critical.",
    "Finder・Timing・Format・Data領域を色分けして表示し、破壊耐性の理解を深めます。": "Color-code the Finder, Timing, Format, and Data areas to study damage resilience.",
    "Crash TestタブでQRコードを読み込むと": "Load a QR code in the Crash Test tab to", "構造解析が表示されます。": "display its structural analysis.", "QRコード解析": "QR Code Analysis",
    "使い方：": "How to use:", "Crash TestタブでQRコードを読み込み後、下のボタンを押してください。": "Load a QR code in the Crash Test tab, then press the button below.",
    "jsQRライブラリでQRコードの位置情報を検出し、各構造領域の教育用近似を重ねて表示します。": "jsQR detects the QR position and overlays educational approximations of its structural areas.",
    "🔍 QRコードを解析": "🔍 Analyze QR Code", "左側でQRコードを読み込んでください": "Load a QR code in the Crash Test tab", "構造レイヤー": "Structure Layers",
    "左側のキャンバスに表示する領域を選択できます。各領域の役割を理解しながら、ON/OFFを切り替えてみてください。": "Choose the areas shown on the canvas and toggle them while learning each area's role.",
    "3つの角にある7×7マスの正方形パターン。QRコードの位置・向き・サイズを検出する最重要パーツ。": "The 7x7 square patterns in three corners used to detect position, orientation, and size.",
    "Finder（位置検出パターン）": "Finder (position detection pattern)", "Finderを結ぶ白黒交互のライン。各モジュール（マス）の座標を正確に特定するための基準線。": "Alternating black-and-white lines joining the finder patterns, used to locate modules accurately.",
    "Timing（タイミングパターン）": "Timing pattern", "誤り訂正レベルやマスクパターンを記録した領域。Finderの近くに配置されます。": "An area near the finder patterns that records the error-correction level and mask pattern.",
    "Format情報": "Format information", "実際のデータ（URL・テキストなど）が記録されている領域。誤り訂正により一部破損しても復元可能。": "The area containing data such as URLs or text; some damage may be recovered through error correction.",
    "Data領域（モデル）": "Data area (model)", "破損した場合の致命度を色で表現。赤い領域ほど「当たりどころが悪い」危険ゾーン。": "A color model of damage criticality; redder areas represent riskier locations.",
    "致命度ヒートマップ（モデル）": "Criticality heatmap (model)", "解析ボタンを押すと、jsQRで検出された実際の位置情報から各領域を計算して表示します。": "After analysis, areas are calculated from the position information detected by jsQR.",
    "致命ゾーン概要（モデル）": "Critical Zone Summary (model)", "ヒートマップの統計情報を表示します。赤いセルが多いほど「当たりどころの悪い場所」が多いことを意味します。": "Summary statistics for the heatmap. More red cells mean more locations modeled as critical.",
    "致命度が高いセル：": "High-criticality cells:", "Finder周辺平均：": "Finder-area average:", "Data領域平均：": "Data-area average:",
    "赤に近いほど「当たりどころが悪い」領域です。": "Redder areas are modeled as more critical.", "FinderやTimingに重なるセルは特に致命度が高く、わずかな破損でも読み取り不可になる可能性があります。": "Cells overlapping Finder or Timing structures are modeled as especially critical, so small damage may prevent decoding.",
    "読み取り準備完了": "Ready to decode", "FAIL（読み取り不可）": "FAIL (cannot decode)", "SUCCESS（読み取り成功）": "SUCCESS (decoded)",
    "先にQRコード画像を読み込んでください。": "Load a QR code image first.", "サンプルQRコードの読み込みに失敗しました。": "Failed to load the sample QR code.",
    "ボタンを押してQRコードを解析します": "Press the button to analyze the QR code", "✓ 解析完了 - 各レイヤーの表示/非表示を切り替えられます": "✓ Analysis complete - toggle each layer on or off",
    "Finder破壊": "Finder Attack", "Timing攻撃": "Timing Attack", "Data汚損": "Data Damage", "全体劣化": "Global Degradation", "角ステッカー": "Corner Sticker"
  };

  const originals = new WeakMap();
  const originalAttributes = new WeakMap();
  const attributes = ["title", "aria-label", "data-tooltip"];
  let language = "ja";

  function t(value) {
    if (language !== "en") return value;
    if (translations[value]) return translations[value];
    return String(value)
      .replace(/^約 (\d+)$/, "Approx. $1")
      .replace(/^(\d+) 文字$/, "$1 characters")
      .replace(/^座標: /, "Coordinates: ");
  }

  function makeEnglishStudy() {
    const wrapper = document.createElement("div");
    wrapper.id = "englishStudyContent";
    const sections = [
      ["Learn QR Structure and Damage Resilience", "Work through the QR code's structure and error correction from fundamentals to practical experiments."],
      ["Fundamentals 1: QR code structure", "Finder patterns locate the symbol; timing patterns establish module coordinates; format information records the error-correction level and mask; and the Data + ECC area stores data and recovery codewords. This tool shows a simplified educational model, not an exact bit-level map."],
      ["Fundamentals 2: Error correction", "QR codes use Reed-Solomon error correction. Levels L, M, Q, and H provide different tradeoffs between capacity and correction capability. The often-cited 7%, 15%, 25%, and 30% figures are rough codeword-recovery guides, not guaranteed damaged image areas."],
      ["Fundamentals 3: Alignment patterns and versions", "Version 1 has 21 x 21 modules and no alignment pattern. Larger versions add alignment patterns to help compensate for perspective and surface distortion. Their exact positions depend on the QR version."],
      ["Applied 1: Criticality visualization", "The Analysis tab models Finder and Timing areas as more critical than ordinary Data areas. This is a teaching aid. It does not decode Format information, ECC level, mask, codeword placement, or interleaving."],
      ["Applied 2: Suggested experiments", "Apply a preset, repeat it with the same seed, then change only blur, contrast, or rotation. Compare Finder damage with distributed Data damage. A result is one attempt by jsQR 1.4.0 and does not predict every camera, printer, lighting condition, or decoder."]
    ];
    sections.forEach(([heading, paragraph]) => {
      const section = document.createElement("section");
      section.className = "panel study-section";
      const h2 = document.createElement("h2");
      h2.textContent = heading;
      const p = document.createElement("p");
      p.textContent = paragraph;
      section.append(h2, p);
      wrapper.appendChild(section);
    });
    return wrapper;
  }

  function translateDocument(nextLanguage) {
    if (!root || !root.document) return;
    const study = document.getElementById("tab-study");
    const englishStudy = document.getElementById("englishStudyContent");
    if (study) {
      Array.from(study.children).forEach(child => {
        if (child.id !== "englishStudyContent") child.hidden = nextLanguage === "en";
      });
      if (nextLanguage === "en" && !englishStudy) study.appendChild(makeEnglishStudy());
      if (englishStudy) englishStudy.hidden = nextLanguage !== "en";
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (node.parentElement && node.parentElement.closest("#tab-study")) continue;
      if (node.parentElement && node.parentElement.closest("[data-i18n-dynamic]")) continue;
      if (!originals.has(node)) originals.set(node, node.nodeValue);
      const original = originals.get(node);
      if (nextLanguage === "ja") node.nodeValue = original;
      else {
        const trimmed = original.trim();
        if (translations[trimmed]) node.nodeValue = original.replace(trimmed, translations[trimmed]);
      }
    }
    document.querySelectorAll("[title], [aria-label], [data-tooltip]").forEach(element => {
      if (!originalAttributes.has(element)) originalAttributes.set(element, {});
      const saved = originalAttributes.get(element);
      attributes.forEach(attribute => {
        if (!element.hasAttribute(attribute)) return;
        if (!saved[attribute]) saved[attribute] = element.getAttribute(attribute);
        const original = saved[attribute];
        element.setAttribute(attribute, nextLanguage === "en" ? t(original) : original);
      });
    });
    const toggle = document.getElementById("languageToggle");
    if (toggle) {
      toggle.textContent = nextLanguage === "ja" ? "English" : "日本語";
      toggle.setAttribute("aria-label", nextLanguage === "ja" ? "表示言語を英語に切り替える" : "Switch the display language to Japanese");
    }
    document.documentElement.lang = nextLanguage;
    document.title = nextLanguage === "en" ? translations["QRCrashTest - QRコード破壊耐性クラッシュテスト"] : "QRCrashTest - QRコード破壊耐性クラッシュテスト";
  }

  function setLanguage(nextLanguage, persist) {
    language = nextLanguage === "en" ? "en" : "ja";
    translateDocument(language);
    if (persist !== false && root && root.localStorage) localStorage.setItem("qrcrashtest-language", language);
    if (root) root.dispatchEvent(new CustomEvent("languagechange", { detail: { language } }));
  }

  function init() {
    if (!root || !root.document) return;
    const saved = localStorage.getItem("qrcrashtest-language");
    setLanguage(saved === "en" ? "en" : "ja", false);
    document.getElementById("languageToggle").addEventListener("click", () => setLanguage(language === "ja" ? "en" : "ja"));
  }

  if (root && root.document) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
  }

  return { t, setLanguage, getLanguage: () => language, translations };
});
