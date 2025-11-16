// ----- 基本ステート -----
const pages = Array.from(document.querySelectorAll(".page"));
const totalSteps = pages.length; // 16
let currentStep = 0;

// nav buttons
const prevButton = document.getElementById("prevButton");
const nextButton = document.getElementById("nextButton");
const progressDotsContainer = document.getElementById("progressDots");

// language
const langToggle = document.getElementById("langToggle");
const langLabel = document.getElementById("langLabel");
const langDropdown = document.getElementById("langDropdown");

// font size
const fontToggle = document.getElementById("fontToggle");

// welcome
const startButton = document.getElementById("startButton");

// summary
const consentCheckbox = document.getElementById("consentCheckbox");
const analyzeButton = document.getElementById("analyzeButton");

// condition
const moodSlider = document.getElementById("moodSlider");
const autoMeasureButton = document.getElementById("autoMeasureButton");
const autoMeasureStatus = document.getElementById("autoMeasureStatus");

// staff
const callStaffButton = document.getElementById("callStaffButton");
const staffStatus = document.getElementById("staffStatus");
const staffDoneButton = document.getElementById("staffDoneButton");

// thank you
const backToTopButton = document.getElementById("backToTopButton");

// pasta / crepe options
let selectedPastaDoneness = null;
let selectedCrepeSweetness = null;

// ----- プログレスドット -----
function buildDots() {
  progressDotsContainer.innerHTML = "";
  for (let i = 0; i < totalSteps; i++) {
    const dot = document.createElement("div");
    dot.className = "dot";
    dot.dataset.step = i;
    progressDotsContainer.appendChild(dot);
  }
}
buildDots();

function updateDots() {
  const dots = progressDotsContainer.querySelectorAll(".dot");
  dots.forEach((dot, idx) => {
    dot.classList.toggle("dot-active", idx === currentStep);
  });
}

// ----- ページ遷移 -----
function goToStep(step) {
  const clamped = Math.max(0, Math.min(totalSteps - 1, step));
  if (clamped === currentStep) return;

  pages[currentStep].classList.remove("page-active");
  currentStep = clamped;
  pages[currentStep].classList.add("page-active");

  updateDots();
  updateNavButtons();
}

// ナビボタンの表示制御
const STEPS_WITH_NEXT = new Set([1, 2, 3, 4, 7, 9, 11, 13]);

function updateNavButtons() {
  // 戻る
  if (currentStep === 0 || currentStep === 15) {
    prevButton.disabled = true;
    prevButton.style.visibility = currentStep === 0 ? "hidden" : "hidden";
  } else {
    prevButton.disabled = false;
    prevButton.style.visibility = "visible";
  }

  // 次への表示・状態
  if (!STEPS_WITH_NEXT.has(currentStep)) {
    nextButton.style.visibility = "hidden";
  } else {
    nextButton.style.visibility = "visible";
  }

  // 特定ステップでのバリデーション
  if (currentStep === 7) {
    // パスタ茹で加減必須
    nextButton.disabled = !selectedPastaDoneness;
  } else if (currentStep === 11) {
    // クレープ甘さ必須
    nextButton.disabled = !selectedCrepeSweetness;
  } else {
    nextButton.disabled = false;
  }
}

prevButton.addEventListener("click", () => {
  if (currentStep > 0) {
    goToStep(currentStep - 1);
  }
});

nextButton.addEventListener("click", () => {
  if (!STEPS_WITH_NEXT.has(currentStep)) return;
  goToStep(currentStep + 1);
});

// ----- 言語ドロップダウン -----
langToggle.addEventListener("click", (e) => {
  e.stopPropagation();
  const open = langDropdown.classList.toggle("open");
  langToggle.setAttribute("aria-expanded", open ? "true" : "false");
});

document.querySelectorAll(".lang-option").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const lang = e.currentTarget.dataset.lang;
    langLabel.textContent = lang;
    langDropdown.classList.remove("open");
    langToggle.setAttribute("aria-expanded", "false");
  });
});

document.addEventListener("click", (e) => {
  if (!langSelectorContains(e.target)) {
    langDropdown.classList.remove("open");
    langToggle.setAttribute("aria-expanded", "false");
  }
});

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    langDropdown.classList.remove("open");
    langToggle.setAttribute("aria-expanded", "false");
  }
});

function langSelectorContains(target) {
  return (
    target === langToggle ||
    target === langDropdown ||
    langDropdown.contains(target)
  );
}

// ----- フォントサイズ -----
fontToggle.addEventListener("click", () => {
  document.body.classList.toggle("large-font");
});

// ----- スタート -----
if (startButton) {
  startButton.addEventListener("click", () => {
    goToStep(1);
  });
}

// ----- 音声入力行の生成 -----
function createVoiceRow(index, groupName) {
  const row = document.createElement("div");
  row.className = "voice-row";
  row.dataset.index = index.toString();
  row.dataset.group = groupName;

  const label = document.createElement("div");
  label.className = "voice-index";
  label.textContent = index + ".";

  const input = document.createElement("input");
  input.type = "text";
  input.className = "voice-input";
  input.placeholder = "未入力";
  input.id = `${groupName}-input-${index}`;

  const micBtn = document.createElement("button");
  micBtn.type = "button";
  micBtn.className = "voice-button";
  micBtn.textContent = "マイク";
  micBtn.addEventListener("click", () => {
    // 実装上は Web Speech API などと連携予定。ここではダミー。
    alert("音声入力のデモです。（実際のマイク連携はデバイス設定後に実装）");
    input.focus();
  });

  const doneBtn = document.createElement("button");
  doneBtn.type = "button";
  doneBtn.className = "voice-button primary";
  doneBtn.textContent = "完了";
  doneBtn.addEventListener("click", () => {
    const value = input.value.trim();
    if (!value) return;

    input.classList.add("filled");

    const nextIndex = index + 1;
    const list =
      groupName === "food"
        ? document.getElementById("foodVoiceList")
        : document.getElementById("sweetsVoiceList");

    if (nextIndex < 5) {
      const nextInput = list.querySelector(
        `input[id='${groupName}-input-${nextIndex}']`
      );
      if (nextInput) {
        nextInput.focus();
      }
    } else {
      // 5つ目を入力完了 → 自動で次のステップに進む
      if (groupName === "food") {
        goToStep(2);
      } else if (groupName === "sweets") {
        goToStep(3);
      }
    }
  });

  row.appendChild(label);
  row.appendChild(input);
  row.appendChild(micBtn);
  row.appendChild(doneBtn);

  return row;
}

function setupVoiceLists() {
  const foodList = document.getElementById("foodVoiceList");
  const sweetsList = document.getElementById("sweetsVoiceList");

  if (foodList) {
    for (let i = 1; i <= 5; i++) {
      foodList.appendChild(createVoiceRow(i, "food"));
    }
  }

  if (sweetsList) {
    for (let i = 1; i <= 5; i++) {
      sweetsList.appendChild(createVoiceRow(i, "sweets"));
    }
  }
}
setupVoiceLists();

// ----- アレルギーチップ -----
const ALLERGY_ITEMS = [
  "えび",
  "かに",
  "くるみ",
  "小麦",
  "そば",
  "卵",
  "乳",
  "落花生(ピーナッツ)",
  "アーモンド",
  "あわび",
  "いか",
  "いくら",
  "オレンジ",
  "カシューナッツ",
  "キウイフルーツ",
  "牛肉",
  "ごま",
  "さけ",
  "さば",
  "大豆",
  "鶏肉",
  "バナナ",
  "豚肉",
  "マカダミアナッツ",
  "もも",
  "やまいも",
  "りんご",
  "ゼラチン"
];

function buildAllergyChips() {
  const container = document.getElementById("allergyChips");
  if (!container) return;

  container.innerHTML = "";
  ALLERGY_ITEMS.forEach((label) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = label;
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
      updateSummaryRestriction();
    });
    container.appendChild(chip);
  });
}
buildAllergyChips();

const allergySearch = document.getElementById("allergySearch");
if (allergySearch) {
  allergySearch.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = allergySearch.value.trim();
      if (!value) return;

      const container = document.getElementById("allergyChips");
      const existingChip = Array.from(
        container.querySelectorAll(".chip")
      ).find((chip) => chip.textContent === value);

      if (existingChip) {
        existingChip.classList.toggle("selected");
      } else {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "chip selected";
        chip.textContent = value;
        chip.addEventListener("click", () => {
          chip.classList.toggle("selected");
          updateSummaryRestriction();
        });
        container.appendChild(chip);
      }

      allergySearch.value = "";
      updateSummaryRestriction();
    }
  });
}

// ----- 体調・気分 -----
if (autoMeasureButton) {
  autoMeasureButton.addEventListener("click", () => {
    autoMeasureStatus.textContent = "簡易チェック中…（デモ表示）";
    setTimeout(() => {
      autoMeasureStatus.textContent = "穏やかな状態です。通常メニューで問題なさそうです。";
    }, 1000);
  });
}

// ----- サマリー更新 -----
function getSelectedChipLabels() {
  const container = document.getElementById("allergyChips");
  if (!container) return [];
  return Array.from(container.querySelectorAll(".chip.selected")).map(
    (chip) => chip.textContent
  );
}

function updateSummaryTaste() {
  const summaryTaste = document.getElementById("summaryTaste");
  if (!summaryTaste) return;

  const foodTexts = [];
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`food-input-${i}`);
    if (input && input.value.trim()) {
      foodTexts.push(input.value.trim());
    }
  }
  const sweetsTexts = [];
  for (let i = 1; i <= 5; i++) {
    const input = document.getElementById(`sweets-input-${i}`);
    if (input && input.value.trim()) {
      sweetsTexts.push(input.value.trim());
    }
  }

  if (!foodTexts.length && !sweetsTexts.length) {
    summaryTaste.textContent = "―";
  } else {
    const joined = [...foodTexts, ...sweetsTexts].slice(0, 6).join("、");
    summaryTaste.textContent = joined;
  }
}

function updateSummaryRestriction() {
  const summaryRestriction = document.getElementById("summaryRestriction");
  if (!summaryRestriction) return;

  const allergies = getSelectedChipLabels();
  const religion = Array.from(
    document.querySelectorAll("input[name='religion']:checked")
  ).map((i) => i.parentElement.textContent.trim());
  const lifestyle = Array.from(
    document.querySelectorAll("input[name='lifestyle']:checked")
  ).map((i) => i.parentElement.textContent.trim());
  const intolerance = Array.from(
    document.querySelectorAll("input[name='intolerance']:checked")
  ).map((i) => i.parentElement.textContent.trim());

  const parts = [];
  if (allergies.length) parts.push(`アレルギー：${allergies.join("、")}`);
  if (religion.length) parts.push(`宗教的：${religion.join("、")}`);
  if (lifestyle.length) parts.push(`ライフスタイル：${lifestyle.join("、")}`);
  if (intolerance.length)
    parts.push(`不耐性：${intolerance.join("、")}`);

  summaryRestriction.textContent = parts.length ? parts.join(" / ") : "―";
}

function updateSummaryCondition() {
  const summaryCondition = document.getElementById("summaryCondition");
  if (!summaryCondition) return;

  const mood = moodSlider ? moodSlider.value : 50;
  const conditionChecks = Array.from(
    document.querySelectorAll("input[name='condition']:checked")
  ).map((i) => i.parentElement.textContent.trim());

  let text = `気分 ${mood}`;
  if (conditionChecks.length) {
    text += ` / ${conditionChecks.join("、")}`;
  }

  summaryCondition.textContent = text;
}

if (moodSlider) {
  moodSlider.addEventListener("input", updateSummaryCondition);
}

document.querySelectorAll("input[name='condition']").forEach((input) => {
  input.addEventListener("change", updateSummaryCondition);
});

document
  .querySelectorAll("input[name='religion'], input[name='lifestyle'], input[name='intolerance']")
  .forEach((input) => {
    input.addEventListener("change", updateSummaryRestriction);
  });

// サマリー編集ボタン
document.querySelectorAll(".summary-edit").forEach((btn) => {
  btn.addEventListener("click", () => {
    const step = parseInt(btn.dataset.editStep, 10);
    goToStep(step);
  });
});

// 同意チェックで「分析」ボタン有効化
if (consentCheckbox) {
  consentCheckbox.addEventListener("change", () => {
    analyzeButton.disabled = !consentCheckbox.checked;
  });
}

// ----- レコメンド生成（簡易ランダム） -----
function randomRadarValues() {
  // 0〜100 の値を6軸分
  const axes = ["塩", "旨", "苦", "酸", "甘", "スパイス"];
  const values = {};
  axes.forEach((axis) => {
    values[axis] = Math.floor(Math.random() * 100);
  });
  return values;
}

function createRadarElement(values) {
  const wrapper = document.createElement("div");
  wrapper.className = "radar";

  const inner = document.createElement("div");
  inner.className = "radar-inner";
  inner.textContent = "Flavor Compass";

  const val = document.createElement("div");
  val.className = "radar-values";
  val.textContent = `塩:${values["塩"]} / 旨:${values["旨"]} / 苦:${values["苦"]} / 酸:${values["酸"]} / 甘:${values["甘"]} / スパイス:${values["スパイス"]}`;

  wrapper.appendChild(inner);
  wrapper.appendChild(val);
  return wrapper;
}

function createRecommendCard(kind, planName, reasonText) {
  const card = document.createElement("div");
  card.className = "recommend-card";

  const radarVals = randomRadarValues();
  const radar = createRadarElement(radarVals);

  const content = document.createElement("div");

  const title = document.createElement("div");
  title.className = "recommend-title";
  title.textContent = planName;

  const body = document.createElement("div");
  body.className = "recommend-body";
  body.textContent = `あなたの回答から、${kind}としてバランスの良い組み合わせを選びました。`;

  const footer = document.createElement("div");
  footer.className = "recommend-footer";

  const reasonToggle = document.createElement("button");
  reasonToggle.type = "button";
  reasonToggle.className = "secondary-button";
  reasonToggle.textContent = "なぜこれ？";

  const reason = document.createElement("div");
  reason.className = "recommend-reason-text";
  reason.textContent = reasonText;
  reason.style.display = "none";

  reasonToggle.addEventListener("click", () => {
    const visible = reason.style.display === "block";
    reason.style.display = visible ? "none" : "block";
  });

  const orderButton = document.createElement("button");
  orderButton.type = "button";
  orderButton.className = "primary-button";
  orderButton.textContent = "注文へ";

  footer.appendChild(reasonToggle);
  footer.appendChild(orderButton);

  content.appendChild(title);
  content.appendChild(body);
  content.appendChild(reason);
  content.appendChild(footer);

  card.appendChild(radar);
  card.appendChild(content);

  return { card, orderButton };
}

function buildRecommendations() {
  const pastaWrap = document.getElementById("pastaRecommendations");
  const saladWrap = document.getElementById("saladRecommendations");
  const crepeWrap = document.getElementById("crepeRecommendations");
  const drinkWrap = document.getElementById("drinkRecommendations");

  const plans = [
    { name: "最適プラン", reason: "あなたの上位2つの味の軸を中心に設計しました。" },
    { name: "代替プラン", reason: "少しだけ味のレンジを広げ、気分に合わせて選べるよう調整しました。" },
    { name: "冒険プラン", reason: "安全な範囲で、いつもと違う味わいを試せる組み合わせです。" }
  ];

  function fillWrapper(wrapper, kind, nextStep) {
    if (!wrapper) return;
    wrapper.innerHTML = "";
    plans.forEach((p, idx) => {
      const { card, orderButton } = createRecommendCard(kind, p.name, p.reason);
      orderButton.addEventListener("click", () => {
        goToStep(nextStep);
      });
      wrapper.appendChild(card);
    });
  }

  fillWrapper(pastaWrap, "パスタ", 7);
  fillWrapper(saladWrap, "サラダ", 9);
  fillWrapper(crepeWrap, "クレープ", 11);
  fillWrapper(drinkWrap, "ドリンク", 13);
}

// 分析ボタンクリック → レコメンド生成＋パスタ推薦へ
if (analyzeButton) {
  analyzeButton.addEventListener("click", () => {
    updateSummaryTaste();
    updateSummaryRestriction();
    updateSummaryCondition();
    buildRecommendations();
    goToStep(6);
  });
}

// ----- パスタ茹で加減 / クレープ甘さ -----
function setupOptionCards() {
  document
    .querySelectorAll(".option-card-row[data-group='pasta-doneness'] .option-card")
    .forEach((card) => {
      card.addEventListener("click", () => {
        document
          .querySelectorAll(".option-card-row[data-group='pasta-doneness'] .option-card")
          .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedPastaDoneness = card.dataset.value;
        const label = document.getElementById("pastaDonenessLabel");
        if (label) {
          label.textContent = card.querySelector(".option-title").textContent;
        }
        updateNavButtons();
      });
    });

  document
    .querySelectorAll(".option-card-row[data-group='crepe-sweetness'] .option-card")
    .forEach((card) => {
      card.addEventListener("click", () => {
        document
          .querySelectorAll(".option-card-row[data-group='crepe-sweetness'] .option-card")
          .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
        selectedCrepeSweetness = card.dataset.value;
        const label = document.getElementById("crepeSweetnessLabel");
        if (label) {
          label.textContent = card.querySelector(".option-title").textContent;
        }
        updateNavButtons();
      });
    });
}
setupOptionCards();

// ----- スタッフヘルプ -----
if (callStaffButton) {
  callStaffButton.addEventListener("click", () => {
    callStaffButton.disabled = true;
    staffStatus.textContent = "スタッフをお呼びしました。少々お待ちください。";
    setTimeout(() => {
      staffStatus.textContent = "スタッフが向かっています。席番号を確認してお待ちください。";
    }, 2000);
  });
}

if (staffDoneButton) {
  staffDoneButton.addEventListener("click", () => {
    goToStep(15);
  });
}

// ----- トップへ戻る -----
if (backToTopButton) {
  backToTopButton.addEventListener("click", () => {
    // 状態リセット（必要なものだけ簡単に）
    selectedPastaDoneness = null;
    selectedCrepeSweetness = null;
    document
      .querySelectorAll(".option-card.selected")
      .forEach((c) => c.classList.remove("selected"));
    const pLabel = document.getElementById("pastaDonenessLabel");
    const cLabel = document.getElementById("crepeSweetnessLabel");
    if (pLabel) pLabel.textContent = "未選択";
    if (cLabel) cLabel.textContent = "未選択";

    goToStep(0);
  });
}

// ----- 初期状態 -----
updateDots();
updateNavButtons();
updateSummaryCondition();
