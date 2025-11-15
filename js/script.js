document.addEventListener('DOMContentLoaded', () => {
/* ---------------- State ---------------- */
const state = {
  favorites: ["","","","",""],
  favoritesFilled: 0,
  restrictions: { allergy: new Set(), religion:{}, lifestyle:{}, intolerance:{} },
  condition: { mood:35, preg:false, no_caf:false, low_caf:false, low_sugar:false, low_fat:false },
  lang: 'ja',
  resultTaste: {
    pasta: { sweet:60, sour:0, bitter:0, umami:40, salty:30, spice:10 },
    salad: { sweet:20, sour:40, bitter:10, umami:30, salty:20, spice:10 },
    crepe: { sweet:70, sour:20, bitter:5,  umami:10, salty:10, spice:10 },
    drink: { sweet:40, sour:30, bitter:20, umami:10, salty:10, spice:15 }
  },
  pastaDoneness: null,
  crepeSweetness: null
};
const flavorJP = { sweet:'甘', sour:'酸', bitter:'苦', umami:'旨', salty:'塩', spice:'スパイス' };

/* ---------------- Elements ---------------- */
const steps = [...document.querySelectorAll('.tpl-step')];
const footer = document.querySelector('.org-footer');
const btnNext = document.getElementById('footer-next');
const btnBack = document.getElementById('footer-back');
const progressBars = [...document.querySelectorAll('.progress ol')];
let current = Number((document.querySelector('.tpl-step[data-active]')?.dataset.step)||1);

/* ---------------- Utilities ---------------- */
const setProgress = (step) => {
  const map = {1:0,2:1,3:2,4:3,6:4,7:4,8:4,13:4,16:4,14:4,17:4,15:4,18:4,10:4,11:4};
  const idx = map[step] ?? 0;
  progressBars.forEach(ol => {
    const items = [...ol.children];
    items.forEach((li,i) => {
      li.classList.toggle('is-active', i === idx);
      li.classList.toggle('is-done', i < idx);
    });
  });
};

function closeLangMenu(){
  const langMenu = document.getElementById('lang-menu');
  const langToggle = document.getElementById('lang-toggle');
  if (!langMenu || langMenu.hidden) return;
  langMenu.hidden = true;
  langToggle?.setAttribute('aria-expanded','false');
  langMenu.querySelectorAll('[aria-current="true"]').forEach(b=>b.removeAttribute('aria-current'));
}

function updateFooterNextRequirement(){
  if (current === 8){
    btnNext.disabled = !state.pastaDoneness;
  } else if (current === 17){
    btnNext.disabled = !state.crepeSweetness;
  } else {
    btnNext.disabled = false;
  }
}

const show = (n) => {
  steps.forEach(s => s.removeAttribute('data-active'));
  const target = steps.find(s => Number(s.dataset.step) === n);
  if (!target) return;
  target.setAttribute('data-active','');
  current = n;
  setProgress(current);

  if (current === 1) {
    btnBack.classList.add('is-hidden');
    btnNext.classList.add('is-hidden');
  } else if (current === 6) {
    btnBack.classList.remove('is-hidden');
    btnNext.classList.remove('is-hidden');
    btnNext.textContent = '分析';
  } else if ([7,13,14,15].includes(current)) {
    btnBack.classList.remove('is-hidden');
    btnNext.classList.add('is-hidden');
  } else if (current === 11) {
    btnBack.classList.add('is-hidden');
    btnNext.classList.add('is-hidden');
  } else {
    btnBack.classList.remove('is-hidden');
    btnNext.classList.remove('is-hidden');
    btnNext.textContent = (current === 10) ? '完了' : '次へ';
  }

  if (current === 6) updateSummary();
  if ([7,13,14,15].includes(current)) {
    updateAllRecBadges();
    renderAllRecommendationImages();
    updateWhyText();
  }

  closeLangMenu();
  updateFooterNextRequirement();
  window.scrollTo({ top: 0, behavior: 'instant' });
};

const nextOf = (step) => {
  const flow = { 1:2, 2:3, 3:4, 4:6, 6:7, 7:8, 8:13, 13:16, 16:14, 14:17, 17:15, 15:18, 18:10, 10:11, 11:1 };
  return flow[step] ?? step;
};
const backOf = (step) => {
  const flow = { 1:1, 2:1, 3:2, 4:3, 6:4, 7:6, 8:7, 13:8, 16:13, 14:16, 17:14, 15:17, 18:15, 10:18, 11:10 };
  return flow[step] ?? 1;
};
setProgress(current);

/* ---------------- Footer Nav ---------------- */
btnNext.addEventListener('click', () => {
  if (current === 6) return runAnalyze(); // 「分析」
  if (current === 8 && !state.pastaDoneness){
    alert('麺のゆで加減をお選びください。');
    return;
  }
  if (current === 17 && !state.crepeSweetness){
    alert('甘さ加減をお選びください。');
    return;
  }
  show(nextOf(current));
});
btnBack.addEventListener('click', () => show(backOf(current)));

/* ---------------- Start ---------------- */
document.getElementById('start-btn')?.addEventListener('click', ()=> show(2));

/* ---------------- Language dropdown ---------------- */
const langToggle = document.getElementById('lang-toggle');
const langMenu = document.getElementById('lang-menu');
const langIndicator = document.getElementById('lang-indicator');
const langLabel = { ja:'JP', en:'EN', zh:'ZH', ko:'KO' };

function isMenuOpen(){ return !langMenu.hidden; }
function openLangMenu(){
  langMenu.hidden = false;
  langToggle.setAttribute('aria-expanded','true');
  const first = langMenu.querySelector('button[role="menuitem"]');
  langMenu.querySelectorAll('[aria-current="true"]').forEach(b=>b.removeAttribute('aria-current'));
  first?.setAttribute('aria-current','true');
  first?.focus({preventScroll:true});
}
langToggle?.addEventListener('click', (e)=>{
  e.stopPropagation();
  if (isMenuOpen()) closeLangMenu(); else openLangMenu();
});
langMenu?.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-lang]');
  if(!btn) return;
  const lang = btn.dataset.lang;
  state.lang = lang;
  document.documentElement.setAttribute('lang', lang);
  langIndicator.textContent = langLabel[lang] || 'JP';
  closeLangMenu();
});
document.addEventListener('click', (e)=>{
  if (!isMenuOpen()) return;
  if (e.target === langToggle || langToggle.contains(e.target)) return;
  if (langMenu.contains(e.target)) return;
  closeLangMenu();
});
document.addEventListener('keydown', (e)=>{
  if (!isMenuOpen()) return;
  if (e.key === 'Escape'){ closeLangMenu(); langToggle.focus(); }
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp'){
    e.preventDefault();
    const items = [...langMenu.querySelectorAll('button[role="menuitem"]')];
    if (!items.length) return;
    let idx = items.findIndex(b=>b.getAttribute('aria-current')==='true');
    if (idx === -1) idx = 0;
    items[idx].removeAttribute('aria-current');
    if (e.key === 'ArrowDown') idx = (idx+1)%items.length;
    else idx = (idx-1+items.length)%items.length;
    items[idx].setAttribute('aria-current','true');
    items[idx].focus({preventScroll:true});
  }
  if (e.key === 'Enter' || e.key === ' '){
    const cur = langMenu.querySelector('button[role="menuitem"][aria-current="true"]');
    cur?.click();
  }
});

/* ---------------- Favorites: Voice 5 slots ---------------- */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null;
function enableSlot(idx){
  document.querySelector(`.mic-btn[data-idx="${idx}"]`)?.removeAttribute('disabled');
  const done = document.querySelector(`.done-btn[data-idx="${idx}"]`);
  if (done) done.disabled = true;
}
function setResult(idx, text){
  const box = document.getElementById(`voice-result-${idx}`);
  if (box) box.textContent = text || '未入力';
  state.favorites[idx] = text || '';
  const done = document.querySelector(`.done-btn[data-idx="${idx}"]`);
  if (text && done) done.disabled = false;
}
function nextSlot(idx){ const n = idx+1; if (n<=4) enableSlot(n); }
function startRecog(idx){
  if (!SpeechRecognition){
    setResult(idx, '（音声認識に未対応のブラウザです）'); return;
  }
  if (recog) { try{ recog.stop(); }catch{} recog = null; }
  recog = new SpeechRecognition();
  recog.lang = (state.lang === 'ja') ? 'ja-JP' :
               (state.lang === 'en') ? 'en-US' :
               (state.lang === 'zh') ? 'zh-CN' : 'ko-KR';
  recog.onresult = (ev)=>{ const text = ev.results[0][0].transcript; setResult(idx, text); };
  try{ recog.start(); }catch{}
}
document.querySelectorAll('.mic-btn').forEach(btn=>{
  btn.addEventListener('click', ()=> startRecog(Number(btn.dataset.idx)));
});
document.querySelectorAll('.done-btn').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    const idx = Number(btn.dataset.idx);
    if (state.favorites[idx]){ state.favoritesFilled = Math.max(state.favoritesFilled, idx+1); nextSlot(idx); }
  });
});
enableSlot(0);

// Pen canvas
const canvas = document.getElementById("pen-canvas");
if (canvas){
  const ctx = canvas.getContext("2d");
  let drawing = false;
  const stop = ()=>{ drawing=false; ctx.beginPath(); }
  canvas.addEventListener("pointerdown", (e)=>{ drawing=true; ctx.moveTo(e.offsetX,e.offsetY); canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener("pointerup", (e)=>{ stop(); canvas.releasePointerCapture(e.pointerId); });
  canvas.addEventListener("pointerleave", stop);
  canvas.addEventListener("pointermove", (e)=>{
    if (!drawing) return;
    ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000";
    ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY);
  });
  document.getElementById("clear-canvas")?.addEventListener("click", ()=> ctx.clearRect(0,0,canvas.width,canvas.height));
}

/* ---------------- Restrictions (28 + custom) ---------------- */
const ALLERGEN_LIST = [
  "えび","かに","くるみ","小麦","そば","卵","乳","落花生(ピーナッツ)",
  "アーモンド","あわび","いか","いくら","オレンジ","カシューナッツ",
  "キウイフルーツ","牛肉","ごま","さけ","さば","大豆","鶏肉","バナナ",
  "豚肉","マカダミアナッツ","もも","やまいも","りんご","ゼラチン"
];
const allergyChips = document.getElementById('allergy-chips');
const allergySearch = document.getElementById('allergy-search');
const pillsContainer = document.getElementById('allergen-pills');

function renderAllergyChips(filter=""){
  if (!allergyChips) return;
  allergyChips.innerHTML = "";
  const kw = filter.trim().toLowerCase();
  const data = ALLERGEN_LIST.filter(a => !kw || a.toLowerCase().includes(kw));
  data.forEach(label=>{
    const btn = document.createElement('button');
    btn.className = 'chip'; btn.type = 'button'; btn.textContent = label;
    if (state.restrictions.allergy.has(label)) btn.classList.add('is-selected');
    btn.addEventListener('click', ()=>{
      btn.classList.toggle('is-selected');
      if (btn.classList.contains('is-selected')) state.restrictions.allergy.add(label);
      else state.restrictions.allergy.delete(label);
      renderPills();
    });
    allergyChips.appendChild(btn);
  });
}
function renderPills(){
  if (!pillsContainer) return;
  pillsContainer.innerHTML = '';
  [...state.restrictions.allergy].forEach(label=>{
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.dataset.pill = label;
    pill.innerHTML = `${label} <button aria-label="${label} を削除" data-remove="${label}" type="button">×</button>`;
    pillsContainer.appendChild(pill);
  });
}
allergySearch?.addEventListener('input', (e)=> {
  const v = e.target.value || '';
  renderAllergyChips(v);
  const trimmed = v.trim();
  if (trimmed && !ALLERGEN_LIST.some(a=>a===trimmed)){
    const btn = document.createElement('button');
    btn.className = 'chip'; btn.type='button';
    btn.textContent = `「${trimmed}」を追加`;
    btn.addEventListener('click', ()=>{
      state.restrictions.allergy.add(trimmed);
      renderPills();
      e.target.value = '';
      renderAllergyChips('');
    });
    allergyChips.appendChild(btn);
  }
});
pillsContainer?.addEventListener('click', (e)=>{
  const rm = e.target.closest('button[data-remove]');
  if (!rm) return;
  const label = rm.dataset.remove;
  state.restrictions.allergy.delete(label);
  renderPills();
  renderAllergyChips(allergySearch?.value||'');
});
renderAllergyChips();
renderPills();

// toggles
document.querySelectorAll('[data-religion]').forEach(input=>{
  input.addEventListener('change', (e)=> {
    const key = e.target.getAttribute('data-religion');
    state.restrictions.religion[key] = e.target.checked;
  });
});
document.querySelectorAll('[data-life]').forEach(input=>{
  input.addEventListener('change', (e)=> {
    const key = e.target.getAttribute('data-life');
    state.restrictions.lifestyle[key] = e.target.checked;
  });
});
document.querySelectorAll('[data-intolerance]').forEach(input=>{
  input.addEventListener('change', (e)=> {
    const key = e.target.getAttribute('data-intolerance');
    state.restrictions.intolerance[key] = e.target.checked;
  });
});

/* ---------------- Condition ---------------- */
document.getElementById('mood-slider')?.addEventListener('input', e=> state.condition.mood = Number(e.target.value));
document.getElementById('pregnant-cond')?.addEventListener('change', e=> state.condition.preg = e.target.checked);
document.getElementById('no-caffeine')?.addEventListener('change', e=> state.condition.no_caf = e.target.checked);
document.getElementById('low-caffeine')?.addEventListener('change', e=> state.condition.low_caf = e.target.checked);
document.getElementById('low-sugar')?.addEventListener('change', e=> state.condition.low_sugar = e.target.checked);
document.getElementById('low-fat')?.addEventListener('change', e=> state.condition.low_fat = e.target.checked);

/* ---------------- Summary ---------------- */
const $ = (id)=> document.getElementById(id);
const summaryTaste = $('summary-taste');
const summaryRestrictions = $('summary-restrictions');
const summaryCondition = $('summary-condition');
function updateSummary(){
  const fav = state.favorites.filter(Boolean);
  summaryTaste.textContent = fav.length ? fav.join(' / ') : '—';

  const al = [...state.restrictions.allergy];
  const rel = Object.entries(state.restrictions.religion).filter(([,v])=>v).map(([k])=>k.toUpperCase());
  const life = Object.entries(state.restrictions.lifestyle).filter(([,v])=>v).map(([k])=>k);
  const into = Object.entries(state.restrictions.intolerance).filter(([,v])=>v).map(([k])=>k);
  const parts = [];
  if (al.length) parts.push(`アレルギー: ${al.join(', ')}`);
  if (rel.length) parts.push(`宗教: ${rel.join(', ')}`);
  if (life.length) parts.push(`ライフ: ${life.join(', ')}`);
  if (into.length) parts.push(`不耐症: ${into.join(', ')}`);
  summaryRestrictions.textContent = parts.length ? parts.join(' / ') : '—';

  const cond = [];
  cond.push(`気分 ${state.condition.mood}`);
  if (state.condition.no_caf) cond.push('ノンカフェイン');
  if (state.condition.low_caf) cond.push('低カフェイン');
  if (state.condition.low_sugar) cond.push('低糖');
  if (state.condition.low_fat) cond.push('低脂');
  if (state.condition.preg) cond.push('妊娠中');
  summaryCondition.textContent = cond.join(' / ');
}
document.querySelectorAll('[data-jump]').forEach(btn=>{
  btn.addEventListener('click', ()=> show(Number(btn.getAttribute('data-jump'))));
});

/* ---------------- Analyze → Randomize → Recommendations ---------------- */
function randomizeTaste(base){
  const keys = ['salty','umami','bitter','sour','sweet','spice'];
  const t = { ...base };
  const shuffle = [...keys].sort(()=>Math.random()-0.5);
  const changeN = 2 + Math.floor(Math.random()*2);
  for (let i=0;i<changeN;i++){
    const k = shuffle[i];
    const delta = (Math.random()<0.5?-1:1)*(5+Math.random()*15);
    t[k] = Math.max(0, Math.min(100, (t[k]||0) + delta));
  }
  return t;
}
function runAnalyze(){
  const consent = document.getElementById('consent-check');
  if (!consent || !consent.checked){
    alert('同意にチェックを入れてください。'); return;
  }
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `
    <div class="dialog" role="dialog" aria-modal="true" aria-label="分析中">
      <div class="analyze-spinner"></div>
      <p class="body">回答をもとに、あなたに最適なメニューを分析しています…</p>
      <div class="actions-row"><button type="button" class="btn btn-secondary" data-dismiss>閉じる</button></div>
    </div>`;
  document.body.appendChild(ov);
  ov.querySelector('[data-dismiss]').addEventListener('click', ()=> ov.remove());
  ov.addEventListener('click', (e)=>{ if (e.target === ov) ov.remove(); });

  const base = { sweet:40, sour:20, bitter:10, umami:30, salty:20, spice:10 };
  state.resultTaste.pasta = randomizeTaste(base);
  state.resultTaste.salad = randomizeTaste(base);
  state.resultTaste.crepe = randomizeTaste(base);
  state.resultTaste.drink = randomizeTaste(base);

  setTimeout(()=>{ ov.remove(); show(7); }, 900);
}

/* ---------------- Radar SVG ---------------- */
function polarPoint(cx, cy, r, deg){
  const rad = (Math.PI/180)*deg;
  return [cx + r*Math.cos(rad), cy - r*Math.sin(rad)];
}
function buildRadarPoints(vals, maxR=70){
  const order = ['sweet','sour','bitter','umami','salty','spice'];
  return order.map((key, i) => {
    const pct = Math.max(0, Math.min(100, vals[key]||0)) / 100;
    const ang = -90 + i*60;
    const [x,y] = polarPoint(100,100,maxR*pct, ang);
    return `${x},${y}`;
  }).join(' ');
}
function badgeSvg(x,y,text){
  const w = Math.max(64, text.length*12+20);
  return `<g transform="translate(${x},${y})">
    <rect rx="6" ry="6" width="${w}" height="24" fill="#F1F2F4" stroke="#CBD5E1"/>
    <text x="10" y="16" font-size="12" fill="#1A1D21">${text}</text>
  </g>`;
}
function svgForTaste(vals, meta){
  const poly = buildRadarPoints(vals);
  const tags = meta.slice(0,4);
  const badges = tags.map((t,i)=> badgeSvg(10, 10 + i*26, t)).join('');
  return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" preserveAspectRatio="xMidYMid meet" shape-rendering="geometricPrecision">
  <rect x="0" y="0" width="200" height="200" fill="#F1F2F4"/>
  ${badges}
  ${[14,28,42,56,70].map(r=>`<circle cx="100" cy="100" r="${r}" fill="none" stroke="#E5E7EB" />`).join('')}
  ${['甘','酸','苦','旨','塩','スパイス'].map((a,i)=>{
    const [x,y]=polarPoint(100,100,78,-90+i*60);
    return `<line x1="100" y1="100" x2="${x}" y2="${y}" stroke="#CBD5E1"/>
            <text x="${x}" y="${y}" font-size="12" fill="#5B6673" text-anchor="middle" dy="${y<100?-4:12}">${a}</text>`;
  }).join('')}
  <polygon points="${poly}" fill="rgba(11,61,145,.18)" stroke="rgba(11,61,145,.6)" stroke-width="2"/>
</svg>`;
}
function svgToDataUrl(svg){ return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); }

function computeBadges(){
  const labels = [];
  if (state.restrictions.allergy.size > 0) labels.push('Allergen Safe');
  if (state.restrictions.lifestyle.vegan) labels.push('Vegan');
  if (state.restrictions.religion.halal) labels.push('Halal');
  if (state.restrictions.religion.kosher) labels.push('Kosher');
  if (state.restrictions.religion.pork_ng) labels.push('Pork-Free');
  if (state.restrictions.religion.alcohol_ng) labels.push('Alcohol-Free');
  return labels;
}
function updateBadgesIn(stepNo){
  const boxes = document.querySelectorAll(`[data-step="${stepNo}"] .reco .badges`);
  const labels = computeBadges();
  boxes.forEach(box => box.innerHTML = labels.map(t=>`<span class="badge">${t}</span>`).join(''));
}
function updateAllRecBadges(){ [7,13,14,15].forEach(updateBadgesIn); }

function metaTags(){
  const fav = state.favorites.filter(Boolean);
  const favTag = fav.length ? `好み:${fav.slice(0,2).join('/')}` : '';
  const al = [...state.restrictions.allergy];
  const rel = Object.entries(state.restrictions.religion).filter(([,v])=>v).map(([k])=>k);
  const life = Object.entries(state.restrictions.lifestyle).filter(([,v])=>v).map(([k])=>k);
  const into = Object.entries(state.restrictions.intolerance).filter(([,v])=>v).map(([k])=>k);
  const c1 = al.length?`制約:${al.slice(0,2).join('/')}`:'';
  const c2 = rel.length?`宗教:${rel.join('/')}`:'';
  const c3 = life.length?`ライフ:${life.join('/')}`:'';
  const c4 = into.length?`不耐:${into.join('/')}`:'';
  return [favTag,c1,c2,c3,c4].filter(Boolean);
}
function renderRecommendationGroup(prefix, vals){
  const meta = metaTags();
  for (let i=1;i<=3;i++){
    const img = document.querySelector(`img.analysis-img[data-card="${prefix}-${i}"]`);
    if (!img) continue;
    const mod = randomizeTaste(vals);
    img.src = svgToDataUrl(svgForTaste(mod, meta));
  }
}
function renderAllRecommendationImages(){
  renderRecommendationGroup('pasta', state.resultTaste.pasta);
  renderRecommendationGroup('salad', state.resultTaste.salad);
  renderRecommendationGroup('crepe', state.resultTaste.crepe);
  renderRecommendationGroup('drink', state.resultTaste.drink);
}
function updateWhyText(){
  const best2 = (vals)=> Object.entries(vals).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>flavorJP[k]).join('×');
  const set = (id, text)=>{ const el=document.getElementById(id); if (el) el.textContent = text; };

  set('why-pasta-1', `あなたの傾向（${best2(state.resultTaste.pasta)}）に最適化。`);
  set('why-pasta-2', `近接レンジ（${best2(randomizeTaste(state.resultTaste.pasta))}）を提案。`);
  set('why-pasta-3', `安全枠内で新レンジ（${best2(randomizeTaste(state.resultTaste.pasta))}）。`);

  set('why-salad-1', `あなたの傾向（${best2(state.resultTaste.salad)}）に最適化。`);
  set('why-salad-2', `近接レンジ（${best2(randomizeTaste(state.resultTaste.salad))}）を提案。`);
  set('why-salad-3', `安全枠内で新レンジ（${best2(randomizeTaste(state.resultTaste.salad))}）。`);

  set('why-crepe-1', `あなたの傾向（${best2(state.resultTaste.crepe)}）に最適化。`);
  set('why-crepe-2', `近接レンジ（${best2(randomizeTaste(state.resultTaste.crepe))}）を提案。`);
  set('why-crepe-3', `安全枠内で新レンジ（${best2(randomizeTaste(state.resultTaste.crepe))}）。`);

  set('why-drink-1', `あなたの傾向（${best2(state.resultTaste.drink)}）に最適化。`);
  set('why-drink-2', `近接レンジ（${best2(randomizeTaste(state.resultTaste.drink))}）を提案。`);
  set('why-drink-3', `安全枠内で新レンジ（${best2(randomizeTaste(state.resultTaste.drink))}）。`);
}

/* ---------------- Buttons to Queue/Flow ---------------- */
document.querySelectorAll('.btn-order[data-go]').forEach(btn=>{
  btn.addEventListener('click', ()=> show(Number(btn.getAttribute('data-go'))));
});

/* ---------------- Staff Help ---------------- */
(function setupStaffHelp(){
  const callBtn = document.getElementById('call-staff');
  const live = document.getElementById('call-status');
  if (!callBtn || !live) return;

  const CALL_COOLDOWN_MS = 30000;
  let cooldownTimer = null;

  const showCallOverlay = (ticket) => {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `
      <div class="dialog" role="dialog" aria-modal="true" aria-label="スタッフ呼出">
        <h3 class="h2">スタッフに通知しました</h3>
        <div class="call-status">
          <span class="dot"></span>
          <span class="body">呼出番号 <strong>${ticket}</strong> / 推定到着 <strong>約 1〜2 分</strong></span>
        </div>
        <p class="caption">混雑状況により前後する場合があります。しばらくお待ちください。</p>
        <div class="actions-row">
          <button class="btn btn-secondary" type="button" data-close>閉じる</button>
        </div>
      </div>`;
    document.body.appendChild(ov);

    setTimeout(()=>{ ov.querySelector('.dot')?.classList.add('ok'); }, 1200);
    ov.querySelector('[data-close]')?.addEventListener('click', ()=> ov.remove());
    ov.addEventListener('click', (e)=>{ if (e.target === ov) ov.remove(); });
  };

  const makeTicket = () => `S-${Math.floor(100 + Math.random()*900)}`;

  const notifyStaff = () => {
    const ticket = makeTicket();
    live.hidden = false;
    live.textContent = `スタッフを呼び出しました。呼出番号 ${ticket}。推定到着 1〜2 分。`;

    callBtn.disabled = true;
    const original = callBtn.textContent;
    callBtn.textContent = '呼出済み';
    callBtn.setAttribute('aria-disabled','true');

    showCallOverlay(ticket);

    setTimeout(()=>{
      callBtn.disabled = false;
      callBtn.textContent = original;
      callBtn.removeAttribute('aria-disabled');
      live.hidden = true;
      live.textContent = '';
    }, CALL_COOLDOWN_MS);
  };

  callBtn.addEventListener('click', notifyStaff);
})();

/* ---------------- Pasta Doneness: handlers ---------------- */
(function setupPastaDoneness(){
  const selectedEl = document.getElementById('pasta-doneness-selected');
  const inputs = document.querySelectorAll('input[name="pasta-doneness"]');
  inputs.forEach(inp=>{
    inp.addEventListener('change', ()=>{
      state.pastaDoneness = inp.value;
      if (selectedEl) selectedEl.textContent = state.pastaDoneness || '未選択';
      updateFooterNextRequirement();
    });
  });
})();

/* ---------------- Crepe Sweetness: handlers ---------------- */
(function setupCrepeSweetness(){
  const selectedEl = document.getElementById('crepe-sweetness-selected');
  const inputs = document.querySelectorAll('input[name="crepe-sweetness"]');
  inputs.forEach(inp=>{
    inp.addEventListener('change', ()=>{
      state.crepeSweetness = inp.value;
      if (selectedEl) selectedEl.textContent = state.crepeSweetness || '未選択';
      updateFooterNextRequirement();
    });
  });
})();

/* ---------------- Init show ---------------- */
function initialShow(){
  show(current);
}
initialShow();

});
