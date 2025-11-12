(() => {
  /* ---------------- State ---------------- */
  const state = {
    mode: 'detailed',
    taste: { sweet:60, sour:0, bitter:0, umami:0, salty:0, spice:0 },
    restrictions: { allergy: new Set(), religion:{}, lifestyle:{} },
    condition: { mood:35, low_caffeine:false, low_sugar:false, low_fat:false },
    values: { co2:1, fairtrade:false, organic:false, additive_free:false, price:'std', fast:false }
  };

  /* ---------------- Elements ---------------- */
  const steps = [...document.querySelectorAll('.tpl-step')];
  const footer = document.querySelector('.org-footer');
  const btnNext = footer.querySelector('.btn.btn-primary');
  const btnBack = footer.querySelector('.btn.btn-secondary');

  const progressBars = [...document.querySelectorAll('.progress ol')];
  const setProgress = (step) => {
    const map = {1:0,2:1,3:2,4:3,5:4,6:5,7:5,8:5,9:0,10:5,11:5,12:5,0:0};
    const idx = map[step] ?? 0;
    progressBars.forEach(ol => {
      const items = [...ol.children];
      items.forEach((li,i) => {
        li.classList.toggle('is-active', i === idx);
        li.classList.toggle('is-done', i < idx);
      });
    });
  };

  let current = Number((document.querySelector('.tpl-step[data-active]')?.dataset.step)||1);

  const nextOf = (step) => {
    if (state.mode === 'simple') {
      const flow = { 1:2, 2:3, 3:6, 6:7, 7:8, 8:10, 10:11, 11:1, 9:1 };
      return flow[step] ?? step;
    } else {
      const flow = { 1:2, 2:3, 3:4, 4:5, 5:6, 6:7, 7:8, 8:10, 10:11, 11:1, 9:1 };
      return flow[step] ?? step;
    }
  };
  const backOf = (step) => {
    if (state.mode === 'simple') {
      const flow = { 1:1, 2:1, 3:2, 6:3, 7:6, 8:7, 10:8, 11:10, 12:7, 0:1, 9:1 };
      return flow[step] ?? 1;
    } else {
      const flow = { 1:1, 2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:7, 10:8, 11:10, 12:7, 0:1, 9:1 };
      return flow[step] ?? 1;
    }
  };

  const show = (n) => {
    steps.forEach(s => s.removeAttribute('data-active'));
    const target = steps.find(s => Number(s.dataset.step) === n);
    if (!target) return;
    target.setAttribute('data-active','');
    current = n;
    setProgress(current);

    if (current === 6) updateSummary();

    if (current === 7) {
      updateRecommendationImages();
      updateWhyText();
      updateRecommendationBadges();
    }

    // Nextの表示制御：Step 7 / 12 / 11 / 0 では非表示
    if (current === 7 || current === 12 || current === 11 || current === 0) {
      btnNext.classList.add('is-hidden');
    } else {
      btnNext.classList.remove('is-hidden');
    }

    // Step 10 の Next ラベルを「完了」へ
    btnNext.textContent = (current === 10) ? '完了' : '次へ';

    if (current === 6) {
      const consent = document.getElementById('consent-check');
      btnNext.disabled = !consent?.checked;
      consent?.addEventListener('change', () => { btnNext.disabled = !consent.checked; });
    } else if (![7,12,11,0].includes(current)) {
      btnNext.disabled = false;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  show(current);

  /* ---------------- Footer Nav ---------------- */
  btnNext.addEventListener('click', () => show(nextOf(current)));
  btnBack.addEventListener('click', () => show(backOf(current)));

  /* ---------------- 言語選択へ遷移（ヘッダー＆Step1ボタン） ---------------- */
  const langIndicator = document.getElementById('lang-indicator');
  langIndicator?.addEventListener('click', () => show(0)); // ヘッダーのJPボタンで Step0 へ
  document.querySelectorAll('.btn-lang-switch').forEach(b => b.addEventListener('click', ()=> show(0)));

  /* ---------------- Language Tabs ---------------- */
  const langTabs = document.getElementById('lang-tabs');
  const mapLabel = { ja:'JP', en:'EN', zh:'ZH', ko:'KO' };
  if (langTabs) {
    langTabs.addEventListener('click', (e) => {
      const btn = e.target.closest('button[role="tab"]');
      if (!btn) return;
      const lang = btn.dataset.lang || 'ja';
      [...langTabs.querySelectorAll('button[role="tab"]')].forEach(t => t.setAttribute('aria-selected','false'));
      btn.setAttribute('aria-selected','true');
      document.documentElement.setAttribute('lang', lang);
      if (langIndicator) langIndicator.textContent = mapLabel[lang] || 'JP';
    });
  }

  /* ---------------- Step 1: Mode Select + Motion ---------------- */
  const modeCards = document.querySelectorAll('[data-step="1"] .selectable');
  modeCards.forEach(card => {
    const pressOn = () => card.classList.add('is-pressing');
    const pressOff = () => card.classList.remove('is-pressing');
    card.addEventListener('pointerdown', pressOn);
    card.addEventListener('pointerup', pressOff);
    card.addEventListener('pointerleave', pressOff);
    card.addEventListener('pointercancel', pressOff);
    card.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { card.classList.add('is-pressing'); }
      if (e.key === ' ') e.preventDefault();
    });
    card.addEventListener('keyup', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { card.classList.remove('is-pressing'); card.click(); }
    });
    card.addEventListener('click', () => {
      state.mode = card.dataset.mode === 'simple' ? 'simple' : 'detailed';
      show(2);
    });
  });

  /* ---------------- Step 2: Taste ---------------- */
// 音声入力（Web Speech API）
const voiceBtn = document.getElementById("voice-btn");
const voiceResult = document.getElementById("voice-result");

if (voiceBtn) {
  voiceBtn.addEventListener("click", () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      voiceResult.textContent = "音声認識はこのブラウザでサポートされていません";
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ja-JP";
    recognition.start();
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      voiceResult.textContent = text;
      answers.favorites = text; // 保存
    };
  });
}

// ペン入力（Canvas）
const canvas = document.getElementById("pen-canvas");
const ctx = canvas.getContext("2d");
let drawing = false;

canvas.addEventListener("mousedown", () => { drawing = true; });
canvas.addEventListener("mouseup", () => { drawing = false; ctx.beginPath(); });
canvas.addEventListener("mousemove", draw);

function draw(e) {
  if (!drawing) return;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#000";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
}

document.getElementById("clear-canvas").addEventListener("click", () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});


  /* ---------------- Step 3: Restrictions ---------------- */
  const allergyGroup = document.querySelector('.allergy-group');
  const pillsContainer = document.getElementById('allergen-pills');

  const renderPills = () => {
    if (!pillsContainer) return;
    pillsContainer.innerHTML = '';
    [...state.restrictions.allergy].forEach(label => {
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.dataset.pill = label;
      pill.innerHTML = `${label} <button aria-label="${label} を削除" data-remove="${label}">×</button>`;
      pillsContainer.appendChild(pill);
    });
  };

  if (allergyGroup) {
    allergyGroup.addEventListener('click', (e) => {
      const btn = e.target.closest('button.chip[data-allergen]');
      if (!btn) return;
      const label = btn.dataset.allergen;
      btn.classList.toggle('is-selected');
      if (btn.classList.contains('is-selected')) state.restrictions.allergy.add(label);
      else state.restrictions.allergy.delete(label);
      renderPills();
    });
  }
  if (pillsContainer) {
    pillsContainer.addEventListener('click', (e) => {
      const rm = e.target.closest('button[data-remove]');
      if (!rm) return;
      const label = rm.dataset.remove;
      state.restrictions.allergy.delete(label);
      const chip = document.querySelector(`.allergy-group .chip[data-allergen="${label}"]`);
      chip?.classList.remove('is-selected');
      renderPills();
    });
  }

  document.querySelectorAll('[data-religion]').forEach(input => {
    input.addEventListener('change', (e) => {
      const key = e.target.getAttribute('data-religion');
      state.restrictions.religion[key] = e.target.checked;
    });
  });
  document.querySelectorAll('[data-life]').forEach(input => {
    input.addEventListener('change', (e) => {
      const key = e.target.getAttribute('data-life');
      state.restrictions.lifestyle[key] = e.target.checked;
    });
  });

  /* ---------------- Step 4: Condition ---------------- */
  const mood = document.getElementById('mood-slider');
  const lc = document.getElementById('low-caffeine');
  const ls = document.getElementById('low-sugar');
  const lf = document.getElementById('low-fat');
  mood?.addEventListener('input', e => state.condition.mood = Number(e.target.value));
  lc?.addEventListener('change', e => state.condition.low_caffeine = e.target.checked);
  ls?.addEventListener('change', e => state.condition.low_sugar = e.target.checked);
  lf?.addEventListener('change', e => state.condition.low_fat = e.target.checked);

  /* ---------------- Step 5: Values ---------------- */
  const co2 = document.getElementById('co2-slider');
  const fair = document.getElementById('fairtrade');
  const org = document.getElementById('organic');
  const addf = document.getElementById('additive-free');
  const priceChips = document.querySelectorAll('[data-price]');
  const fast = document.getElementById('fast-serving');

  co2?.addEventListener('input', e => state.values.co2 = Number(e.target.value));
  fair?.addEventListener('change', e => state.values.fairtrade = e.target.checked);
  org?.addEventListener('change', e => state.values.organic = e.target.checked);
  addf?.addEventListener('change', e => state.values.additive_free = e.target.checked);
  priceChips.forEach(ch => ch.addEventListener('click', () => {
    priceChips.forEach(c => c.classList.remove('is-selected'));
    ch.classList.add('is-selected');
    state.values.price = ch.getAttribute('data-price');
  }));
  fast?.addEventListener('change', e => state.values.fast = e.target.checked);

  /* ---------------- Summary (Step 6) ---------------- */
  const $ = (id) => document.getElementById(id);
  const summaryTaste = $('summary-taste');
  const summaryRestrictions = $('summary-restrictions');
  const summaryCondition = $('summary-condition');
  const summaryValues = $('summary-values');

  const updateSummary = () => {
    const t = state.taste;
    summaryTaste.textContent =
      `甘 ${t.sweet}% / 酸 ${t.sour}% / 苦 ${t.bitter}% / 旨 ${t.umami}% / 塩 ${t.salty}% / スパイス ${t.spice}%`;

    const al = [...state.restrictions.allergy];
    const rel = Object.entries(state.restrictions.religion).filter(([,v])=>v).map(([k])=>k.toUpperCase());
    const life = Object.entries(state.restrictions.lifestyle).filter(([,v])=>v).map(([k])=>k);
    const parts = [];
    if (al.length) parts.push(`アレルギー: ${al.join(', ')}`);
    if (rel.length) parts.push(`宗教: ${rel.join(', ')}`);
    if (life.length) parts.push(`ライフ: ${life.join(', ')}`);
    summaryRestrictions.textContent = parts.length ? parts.join(' / ') : '—';

    const condParts = [`気分 ${state.condition.mood}`];
    if (state.condition.low_caffeine) condParts.push('低カフェイン');
    if (state.condition.low_sugar) condParts.push('低糖');
    if (state.condition.low_fat) condParts.push('低脂');
    summaryCondition.textContent = (state.mode === 'simple') ? '（かんたんモード：入力省略）' : condParts.join(' / ');

    const v = state.values;
    const tag = [];
    if (v.fairtrade) tag.push('フェアトレード');
    if (v.organic) tag.push('オーガニック');
    if (v.additive_free) tag.push('無添加');
    const priceMap = { low:'ワンコイン', std:'スタンダード', premium:'プレミアム' };
    const valText = (state.mode === 'simple')
      ? '（かんたんモード：入力省略）'
      : `CO₂:${v.co2} / 価格:${priceMap[v.price]}${v.fast?' / 速度優先':''}${tag.length? ' / ' + tag.join(', '):''}`;
    summaryValues.textContent = valText;
  };

  document.querySelectorAll('[data-jump]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const s = Number(e.currentTarget.getAttribute('data-jump'));
      show(s);
    });
  });

  /* ---------------- Step 7: 解析画像（SVG→IMG） ---------------- */
  const polarPoint = (cx, cy, r, deg) => {
    const rad = (Math.PI/180)*deg;
    return [cx + r*Math.cos(rad), cy - r*Math.sin(rad)];
  };
  const buildRadarPoints = (vals, maxR=70) => {
    const order = ['sweet','sour','bitter','umami','salty','spice'];
    return order.map((key, i) => {
      const pct = Math.max(0, Math.min(100, vals[key]||0)) / 100;
      const ang = -90 + i*60;
      const [x,y] = polarPoint(100,100,maxR*pct, ang);
      return `${x},${y}`;
    }).join(' ');
  };
  const badgeSvg = (x,y,text) =>
    `<g transform="translate(${x},${y})"><rect rx="6" ry="6" width="${Math.max(64, text.length*12+20)}" height="24" fill="#F1F2F4" stroke="#CBD5E1"/><text x="10" y="16" font-size="12" fill="#1A1D21">${text}</text></g>`;

  const buildAnalysisSVG = (vals, meta) => {
    const poly = buildRadarPoints(vals);
    const tags = [];
    const nameMap = {sweet:'甘',sour:'酸',bitter:'苦',umami:'旨',salty:'塩',spice:'スパイス'};
    const top2 = Object.entries(vals).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>nameMap[k]).join('×');
    if (top2) tags.push(`味:${top2}`);
    if (meta.constraint) tags.push(`制約:${meta.constraint}`);
    if (meta.condition)  tags.push(`体調:${meta.condition}`);
    if (meta.values)     tags.push(`価値観:${meta.values}`);
    if (meta.price)      tags.push(`価格:${meta.price}`);
    const badges = tags.slice(0,4).map((t,i)=> badgeSvg(10, 10 + i*26, t)).join('');

    return `
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 200 200"
     width="200" height="200"
     preserveAspectRatio="xMidYMid meet"
     shape-rendering="geometricPrecision">
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
  };
  const svgToDataUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  const summarizeMeta = () => {
    const al = [...state.restrictions.allergy];
    const rel = Object.entries(state.restrictions.religion).filter(([,v])=>v).map(([k])=>k);
    const life = Object.entries(state.restrictions.lifestyle).filter(([,v])=>v).map(([k])=>k);
    const constraint = [al.length?al.join('/'):null, rel.length?rel.join('/'):null, life.length?life.join('/'):null]
      .filter(Boolean).join(' / ');
    const cond = state.mode==='simple' ? ''
      : [
          state.condition.low_caffeine?'低CAF':null,
          state.condition.low_sugar?'低糖':null,
          state.condition.low_fat?'低脂':null
        ].filter(Boolean).join('/');
    const values = state.mode==='simple' ? '' :
      [
        state.values.fairtrade?'FT':null,
        state.values.organic?'ORG':null,
        state.values.additive_free?'無添加':null
      ].filter(Boolean).join('/');
    const priceMap = { low:'¥', std:'¥¥', premium:'¥¥¥' };
    const price = priceMap[state.values.price] || '';
    return { constraint, condition:cond, values, price };
  };

  const updateRecommendationImages = () => {
    const baseVals = {...state.taste};
    const altVals  = {...baseVals, spice: Math.min(100, (baseVals.spice||0)+20) };
    const advVals  = {...baseVals, sour: Math.min(100, (baseVals.sour||0)+15), bitter: Math.max(0, (baseVals.bitter||0)-10) };
    const meta = summarizeMeta();

    const img1 = document.querySelector('.analysis-img[data-card="1"]');
    const img2 = document.querySelector('.analysis-img[data-card="2"]');
    const img3 = document.querySelector('.analysis-img[data-card="3"]');

    if (img1) img1.src = svgToDataUrl(buildAnalysisSVG(baseVals, meta));
    if (img2) img2.src = svgToDataUrl(buildAnalysisSVG(altVals,  meta));
    if (img3) img3.src = svgToDataUrl(buildAnalysisSVG(advVals,  meta));
  };

  const updateWhyText = () => {
    const map = { sweet:'甘', sour:'酸', bitter:'苦', umami:'旨', salty:'塩', spice:'スパイス' };
    const top2 = Object.entries(state.taste).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>map[k]).join('×');
    const w1 = document.getElementById('why-1');
    if (w1) w1.textContent = `あなたの味傾向（${top2}）に基づき最適化。`;
  };

  /* ---- おすすめバッジを入力から動的に描画 ---- */
  const computeBadges = () => {
    const labels = [];
    if (state.restrictions.allergy.size > 0) labels.push('Allergen Safe');
    if (state.restrictions.lifestyle.vegan) labels.push('Vegan');
    if (state.restrictions.religion.halal) labels.push('Halal');
    if (state.restrictions.religion.kosher) labels.push('Kosher');
    if (state.restrictions.religion.pork_ng) labels.push('Pork-Free');
    if (state.restrictions.religion.alcohol_ng) labels.push('Alcohol-Free');
    if (state.values.co2 === 2) labels.push('Low-CO₂');
    return labels;
  };
  const renderBadgesInto = (container, labels) => {
    if (!container) return;
    container.innerHTML = labels.map(t=>`<span class="badge">${t}</span>`).join('');
  };
  const updateRecommendationBadges = () => {
    const labels = computeBadges();
    document.querySelectorAll('[data-step="7"] .reco .badges').forEach(box=>{
      renderBadgesInto(box, labels);
    });
  };

  // 07: 「注文へ」→ 8（ドリンク）
  document.querySelectorAll('[data-step="7"] .reco .btn-order')
    .forEach(b => b.addEventListener('click', () => show(8)));

  /* ===================== 量子ダイス・スイーツ ===================== */
  (function setupQuantumDice(){
    const btn = document.querySelector('[data-step="7"] .dice .btn');
    const visual = document.querySelector('[data-step="7"] .dice .dice-visual');
    if (!btn || !visual) return;

    const FLAVOR_BANDS = ['シトラス','ベリー','ストーンフルーツ','ハーブ','スパイス','ナッツ','チョコ','キャラメル','フローラル'];
    const TEXTURES = ['ムース','ジェル','クランチ','グラニテ','パンナコッタ','メレンゲ'];
    const SURPRISES = ['微発泡','低糖仕様','低カフェイン','温冷ツイン','ハーブ香り付け','食感トッピング'];

    const tasteTop2 = () => Object.entries(state.taste).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k])=>k);
    const weightedPick = (options, boostKeys=[]) => {
      const bag = [];
      options.forEach(opt => {
        const weight = boostKeys.some(k => (opt.includes('スパイス') && k==='spice') ||
                                          (opt.includes('ハーブ') && (k==='sour'||k==='umami')) ||
                                          (opt.includes('ベリー') && k==='sweet') ||
                                          (opt.includes('ナッツ') && k==='umami') ||
                                          (opt.includes('シトラス') && k==='sour'))
                      ? 3 : 1;
        for(let i=0;i<weight;i++) bag.push(opt);
      });
      return bag[Math.floor(Math.random()*bag.length)];
    };

    const showOverlay = (title, tags) => {
      const ov = document.createElement('div');
      ov.className = 'qd-overlay';
      ov.innerHTML = `
        <div class="qd-dialog" role="dialog" aria-modal="true" aria-label="量子ダイス結果">
          <h3 class="h2">${title}</h3>
          <div class="qd-tags">
            ${tags.map(t=>`<span class="qd-tag">${t}</span>`).join('')}
          </div>
          <p class="caption">安全枠内でのランダム。禁忌成分は自動除外されています。</p>
          <div class="qd-actions">
            <button class="btn btn-primary">このスイーツで注文に進む</button>
            <button class="btn btn-secondary">閉じる</button>
          </div>
        </div>`;
      document.body.appendChild(ov);

      const [btnPrimary, btnClose] = ov.querySelectorAll('.qd-actions .btn');
      btnClose.addEventListener('click', ()=> ov.remove());
      btnPrimary.addEventListener('click', ()=>{
        ov.remove();
        show(12); // デザート用キューへ
      });
    };

    btn.addEventListener('click', ()=>{
      visual.classList.add('is-rolling');
      setTimeout(()=>{
        visual.classList.remove('is-rolling');
        const top = tasteTop2();
        const band = weightedPick(FLAVOR_BANDS, top);
        const texture = TEXTURES[Math.floor(Math.random()*TEXTURES.length)];
        const surprise = SURPRISES[Math.floor(Math.random()*SURPRISES.length)];
        const title = `結果：${band} × ${texture}`;
        const tags = [band, texture, surprise].slice(0,4);
        showOverlay(title, tags);
      }, 900);
    });
  })();

  /* ===================== 受付QR（ドリンク/デザート） ===================== */
  function setupQueueQR(buttonId, numberId){
    const btn = document.getElementById(buttonId);
    if (!btn) return;

    const getOrderNumber = () => {
      const el = document.getElementById(numberId);
      if (el && el.textContent.trim()) return el.textContent.trim();
      const n = Math.floor(100 + Math.random()*900);
      return `X-${n}`;
    };

    const generateFakeQR = (seedText = 'QuantumCafe', size = 220) => {
      const canvas = document.createElement('canvas');
      canvas.width = size; canvas.height = size;
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0,0,size,size);
      let seed = 0; for (let i=0;i<seedText.length;i++) seed = (seed*31 + seedText.charCodeAt(i)) >>> 0;
      const rand = () => { seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5; return (seed>>>0)/0xFFFFFFFF; };

      const cells = 29, margin = 12;
      const cell = Math.floor((size - margin*2) / cells);
      const offset = Math.floor((size - cell*cells) / 2);

      ctx.strokeStyle = '#000'; ctx.lineWidth = 2;
      ctx.strokeRect(offset-1, offset-1, cell*cells+2, cell*cells+2);

      const drawFinder = (gx, gy) => {
        ctx.fillStyle = '#000'; ctx.fillRect(offset+gx*cell, offset+gy*cell, cell*7, cell*7);
        ctx.fillStyle = '#FFF'; ctx.fillRect(offset+(gx+1)*cell, offset+(gy+1)*cell, cell*5, cell*5);
        ctx.fillStyle = '#000'; ctx.fillRect(offset+(gx+2)*cell, offset+(gy+2)*cell, cell*3, cell*3);
      };
      drawFinder(0,0); drawFinder(cells-7,0); drawFinder(0,cells-7);

      ctx.fillStyle = '#000';
      for (let y=0; y<cells; y++){
        for (let x=0; x<cells; x++){
          const inFinder = (x<7 && y<7) || (x>=cells-7 && y<7) || (x<7 && y>=cells-7);
          if (inFinder) continue;
          if (rand() > 0.5) ctx.fillRect(offset+x*cell, offset+y*cell, cell, cell);
        }
      }
      return canvas.toDataURL('image/png');
    };

    const showQrOverlay = () => {
      const no = getOrderNumber();
      const dataUrl = generateFakeQR(`QuantumCafe:${no}`);
      const ov = document.createElement('div');
      ov.className = 'qd-overlay';
      ov.innerHTML = `
        <div class="qd-dialog" role="dialog" aria-modal="true" aria-label="受付QR">
          <h3 class="h2">受付QRを提示してください</h3>
          <div class="qr-box">
            <div class="qr-number">${no}</div>
            <img class="qr-img" alt="受付QRコード" src="${dataUrl}">
          </div>
          <p class="caption">スタッフがスキャンします。画面の明るさを上げると読み取りやすくなります。</p>
          <div class="qd-actions">
            <button class="btn btn-secondary" data-close>閉じる</button>
          </div>
        </div>`;
      document.body.appendChild(ov);
      ov.querySelector('[data-close]').addEventListener('click', ()=> ov.remove());
      ov.addEventListener('click', (e)=>{ if (e.target === ov) ov.remove(); });
    };

    btn.addEventListener('click', showQrOverlay);
  }
  setupQueueQR('show-qr', 'order-no');                 // ドリンク
  setupQueueQR('show-qr-dessert', 'order-no-dessert'); // デザート

  /* ---------------- スタッフヘルプ：呼出ロジック ---------------- */
  (function setupStaffHelp(){
    const callBtn = document.getElementById('call-staff');
    const live = document.getElementById('call-status');
    if (!callBtn || !live) return;

    const CALL_COOLDOWN_MS = 30000;
    let cooldownTimer = null;

    const showCallOverlay = (ticket) => {
      const ov = document.createElement('div');
      ov.className = 'qd-overlay';
      ov.innerHTML = `
        <div class="qd-dialog" role="dialog" aria-modal="true" aria-label="スタッフ呼出">
          <h3 class="h2">スタッフに通知しました</h3>
          <div class="call-status">
            <span class="dot"></span>
            <span class="body">呼出番号 <strong>${ticket}</strong> / 推定到着 <strong>約 1〜2 分</strong></span>
          </div>
          <p class="caption">混雑状況により前後する場合があります。しばらくお待ちください。</p>
          <div class="qd-actions">
            <button class="btn btn-secondary" data-close>閉じる</button>
          </div>
        </div>`;
      document.body.appendChild(ov);

      setTimeout(()=>{
        const dot = ov.querySelector('.dot');
        if (dot) dot.classList.add('ok');
      }, 1200);

      ov.querySelector('[data-close]').addEventListener('click', ()=> ov.remove());
      ov.addEventListener('click', (e)=>{ if (e.target === ov) ov.remove(); });
    };

    const makeTicket = () => {
      const n = Math.floor(100 + Math.random()*900);
      return `S-${n}`;
    };

    const notifyStaff = () => {
      const ticket = makeTicket();

      live.hidden = false;
      live.textContent = `スタッフを呼び出しました。呼出番号 ${ticket}。推定到着 1〜2 分。`;

      callBtn.disabled = true;
      const original = callBtn.textContent;
      callBtn.textContent = '呼出済み';
      callBtn.setAttribute('aria-disabled','true');

      showCallOverlay(ticket);

      clearTimeout(cooldownTimer);
      cooldownTimer = setTimeout(()=>{
        callBtn.disabled = false;
        callBtn.textContent = original;
        callBtn.removeAttribute('aria-disabled');
        live.hidden = true;
        live.textContent = '';
      }, CALL_COOLDOWN_MS);
    };

    callBtn.addEventListener('click', notifyStaff);
  })();

  // answers に不耐症と体調を追加
answers.intolerance = [];
answers.pregnantCond = false;
answers.noCaffeine = false;

// 保存処理に追加
function saveStepAnswers(step) {
  switch(step) {
    case "3": // 食の制約
      answers.intolerance = Array.from(document.querySelectorAll('[data-step="3"] input[data-intolerance]:checked'))
                                .map(cb => cb.parentElement.textContent.trim());
      break;
    case "4": // 体調・気分
      answers.pregnantCond = document.getElementById("pregnant-cond").checked;
      answers.noCaffeine = document.getElementById("no-caffeine").checked;
      break;
  }
}


  /* ---------------- Timeout & Others ---------------- */
  document.querySelectorAll('[data-step="9"] .btn.btn-primary')
    .forEach(b => b.addEventListener('click', () => show(1)));
  document.querySelectorAll('[data-step="9"] .btn.btn-secondary')
    .forEach(b => b.addEventListener('click', () => show(0)));

  document.querySelectorAll('[data-step="11"] [data-jump]').forEach(btn=>{
    btn.addEventListener('click', (e)=>{
      const s = Number(btn.getAttribute('data-jump'));
      show(s);
    });
  });

})();
