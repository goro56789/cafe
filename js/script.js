(() => {
  /* ---------------- State ---------------- */
  const state = {
    favorites: ["", "", "", "", ""],
    taste: { sweet:60, sour:20, bitter:15, umami:55, salty:30, spice:25 },
    restrictions: {
      allergy: new Set(),
      religion: {},
      lifestyle: {},
      intolerance: {}   // 追加：食物不耐症
    },
    condition: {
      mood:35,
      low_caffeine:false,
      decaf:false,       // 追加：カフェインレス
      low_sugar:false,
      low_fat:false,
      pregnant:false     // 追加：妊娠中
    },
    variants: { pasta: [], salad: [], crepe: [], drink: [] },
    supportedSpeech: !!(window.SpeechRecognition || window.webkitSpeechRecognition),
    pastaBoil: null,
    crepeSweetness: null,
  };

  /* ---------------- Elements ---------------- */
  const steps = [...document.querySelectorAll('.tpl-step')];
  const btnNext = document.getElementById('btn-next');
  const btnBack = document.getElementById('btn-back');
  let current = Number((document.querySelector('.tpl-step[data-active]')?.dataset.step)||1);

  /* ---------------- Progress ---------------- */
  const progressBars = [...document.querySelectorAll('.progress ol')];
  const setProgress = (step) => {
    const map = {
      1:0, 2:1, 3:2, 4:3, 6:4,
      71:5, 72:5, 73:5, 74:5, 81:5, 82:5, 83:5, 84:5, 10:5, 11:5
    };
    const idx = map[step] ?? 0;
    progressBars.forEach(ol => {
      const items = [...ol.children];
      items.forEach((li,i) => {
        li.classList.toggle('is-active', i === idx);
        li.classList.toggle('is-done', i < idx);
      });
    });
  };

  /* ---------------- Step flow ---------------- */
  const nextOf = (step) => {
    const flow = {
      1:2, 2:3, 3:4, 4:6, 6:71,
      71:81, 81:72, 72:82, 82:73, 73:83, 83:74, 74:84, 84:10, 10:11, 11:1
    };
    return flow[step] ?? step;
  };
  const backOf = (step) => {
    const flow = {
      1:1, 2:1, 3:2, 4:3, 6:4,
      71:6, 81:71, 72:81, 82:72, 73:82, 83:73, 74:83, 84:74, 10:84, 11:10
    };
    return flow[step] ?? 1;
  };

  const show = (n) => {
    steps.forEach(s => s.removeAttribute('data-active'));
    const target = steps.find(s => Number(s.dataset.step) === n);
    if (!target) return;
    target.setAttribute('data-active','');
    current = n;
    setProgress(current);

    const hideNext = [1, 6, 71,72,73,74, 11].includes(current);
    const hideBack = [1, 11].includes(current);
    btnNext.classList.toggle('is-hidden', hideNext);
    btnBack.classList.toggle('is-hidden', hideBack);

    if ([71,72,73,74].includes(current)) updateRecommendationImagesForStep(current);
    if (current === 81) btnNext.disabled = !state.pastaBoil;
    if (current === 83) btnNext.disabled = !state.crepeSweetness;
    if (current === 6) updateSummaryAndConsent();

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  show(current);

  /* ---------------- Footer Nav ---------------- */
  btnNext.addEventListener('click', () => show(nextOf(current)));
  btnBack.addEventListener('click', () => show(backOf(current)));
  document.querySelector('.btn-start')?.addEventListener('click', () => show(2));

  /* ---------------- Language dropdown ---------------- */
  const langBtn = document.getElementById('lang-button');
  const langMenu = document.getElementById('lang-menu');
  const langIndicator = document.getElementById('lang-indicator');
  const mapLabel = { ja:'JP', en:'EN', zh:'ZH', ko:'KO' };

  const closeLang = () => {
    langMenu.hidden = true;
    langBtn.setAttribute('aria-expanded','false');
    document.removeEventListener('click', clickOutsideLang, {capture:true});
    document.removeEventListener('keydown', escCloseLang);
  };
  const openLang = () => {
    langMenu.hidden = false;
    langBtn.setAttribute('aria-expanded','true');
    langMenu.focus();
    setTimeout(()=>{
      document.addEventListener('click', clickOutsideLang, {capture:true});
      document.addEventListener('keydown', escCloseLang);
    },0);
  };
  const clickOutsideLang = (e) => {
    if (!langMenu.contains(e.target) && !langBtn.contains(e.target)) closeLang();
  };
  const escCloseLang = (e) => { if (e.key === 'Escape') closeLang(); };

  langBtn?.addEventListener('click', () => {
    const expanded = langBtn.getAttribute('aria-expanded') === 'true';
    expanded ? closeLang() : openLang();
  });

  langMenu?.addEventListener('click', (e) => {
    const li = e.target.closest('li[role="option"]');
    if (!li) return;
    const lang = li.dataset.lang || 'ja';
    [...langMenu.querySelectorAll('li')].forEach(x => x.removeAttribute('aria-selected'));
    li.setAttribute('aria-selected','true');
    document.documentElement.setAttribute('lang', lang);
    if (langIndicator) langIndicator.textContent = mapLabel[lang] || 'JP';
    closeLang();
  });

  /* ---------------- Step 2: 音声入力 ---------------- */
  const voiceBanner = document.getElementById('voice-banner');
  if (!state.supportedSpeech) voiceBanner?.classList.remove('is-hidden');

  document.querySelector('[data-step="2"]')?.addEventListener('click', (e) => {
    const mic = e.target.closest('.mic');
    const done = e.target.closest('.done');

    if (mic) {
      const row = mic.closest('.voice-row');
      const idx = Number(row.dataset.index);
      startSpeechFor(idx);
    }
    if (done) {
      const row = done.closest('.voice-row');
      const idx = Number(row.dataset.index);
      completeVoiceRow(idx);
    }
  });

  function startSpeechFor(idx){
    const out = document.getElementById(`voice-out-${idx}`);
    if (!state.supportedSpeech){
      out?.focus();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = document.documentElement.lang === 'ja' ? 'ja-JP' : 'en-US';
    rec.start();
    rec.onresult = (ev)=>{
      const text = ev.results[0][0].transcript;
      if (out){ out.value = text; out.focus(); }
    };
    rec.onerror = ()=>{ out?.focus(); };
  }

  function completeVoiceRow(idx){
    const out = document.getElementById(`voice-out-${idx}`);
    const val = (out?.value || '').trim();
    if (!val) { out?.focus(); return; }
    state.favorites[idx-1] = val;

    if (idx < 5) {
      const nextOut = document.getElementById(`voice-out-${idx+1}`);
      nextOut?.focus();
    } else {
      const ok = state.favorites.every(s=>s && s.length>0);
      if (ok) show(3);
    }
  }

  // ペン入力
  const canvas = document.getElementById("pen-canvas");
  if (canvas){
    const ctx = canvas.getContext("2d");
    let drawing = false;
    canvas.addEventListener("pointerdown", (e)=>{ drawing=true; ctx.beginPath(); ctx.moveTo(e.offsetX,e.offsetY); canvas.setPointerCapture(e.pointerId); });
    canvas.addEventListener("pointerup", (e)=>{ drawing=false; canvas.releasePointerCapture(e.pointerId); });
    canvas.addEventListener("pointerleave", ()=> drawing=false);
    canvas.addEventListener("pointermove", (e)=>{
      if (!drawing) return;
      ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.strokeStyle = "#000";
      ctx.lineTo(e.offsetX, e.offsetY); ctx.stroke(); ctx.beginPath(); ctx.moveTo(e.offsetX, e.offsetY);
    });
    document.getElementById('clear-canvas')?.addEventListener('click', ()=> ctx.clearRect(0,0,canvas.width,canvas.height));
    document.getElementById('save-canvas')?.addEventListener('click', ()=> alert('手書きメモを保存しました（ダミー）'));
  }

  /* ---------------- Step 3: アレルギー（28品目） ---------------- */
  const ALLERGENS = [
    "えび","かに","くるみ","小麦","そば","卵","乳","落花生（ピーナッツ）",
    "アーモンド","あわび","いか","いくら","オレンジ","カシューナッツ","キウイフルーツ",
    "牛肉","ごま","さけ","さば","大豆","鶏肉","バナナ","豚肉","マカダミアナッツ",
    "もも","やまいも","りんご","ゼラチン"
  ];
  const chipsBox = document.getElementById('allergen-chips');
  const pillsBox = document.getElementById('allergen-pills');
  const searchBox = document.getElementById('allergen-search');

  function renderChips(filter=""){
    if (!chipsBox) return;
    chipsBox.innerHTML = '';
    const list = ALLERGENS.filter(a => a.toLowerCase().includes(filter.toLowerCase()));
    list.forEach(name=>{
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip';
      btn.dataset.allergen = name;
      btn.textContent = name;
      if (state.restrictions.allergy.has(name)) btn.classList.add('is-selected');
      chipsBox.appendChild(btn);
    });
  }
  function renderPills(){
    if (!pillsBox) return;
    pillsBox.innerHTML = '';
    [...state.restrictions.allergy].forEach(label=>{
      const pill = document.createElement('span');
      pill.className = 'pill';
      pill.dataset.pill = label;
      pill.innerHTML = `${label} <button aria-label="${label} を削除" data-remove="${label}">×</button>`;
      pillsBox.appendChild(pill);
    });
  }
  renderChips();
  renderPills();

  chipsBox?.addEventListener('click', (e)=>{
    const chip = e.target.closest('.chip');
    if (!chip) return;
    const name = chip.dataset.allergen;
    chip.classList.toggle('is-selected');
    if (chip.classList.contains('is-selected')) state.restrictions.allergy.add(name);
    else state.restrictions.allergy.delete(name);
    renderPills();
  });
  pillsBox?.addEventListener('click', (e)=>{
    const rm = e.target.closest('button[data-remove]');
    if (!rm) return;
    const label = rm.dataset.remove;
    state.restrictions.allergy.delete(label);
    renderChips(searchBox?.value||"");
    renderPills();
  });
  searchBox?.addEventListener('input', (e)=> renderChips(e.target.value));

  // 宗教・ライフスタイル・不耐症
  document.querySelectorAll('[data-religion]').forEach(input=>{
    input.addEventListener('change', (e)=> {
      const key = e.target.getAttribute('data-religion');
      state.restrictions.religion[key] = e.target.checked;
    });
  });
  document.querySelectorAll('[data-life]').forEach(input=>{
    input.addEventListener('change', (e)=>{
      const key = e.target.getAttribute('data-life');
      state.restrictions.lifestyle[key] = e.target.checked;
    });
  });
  document.querySelectorAll('[data-intolerance]').forEach(input=>{
    input.addEventListener('change', (e)=>{
      const key = e.target.getAttribute('data-intolerance');
      state.restrictions.intolerance[key] = e.target.checked;
    });
  });

  /* ---------------- Step 4: Condition ---------------- */
  document.getElementById('mood-slider')?.addEventListener('input', (e)=> state.condition.mood = Number(e.target.value));
  document.getElementById('low-caffeine')?.addEventListener('change', (e)=> state.condition.low_caffeine = e.target.checked);
  document.getElementById('decaf')?.addEventListener('change', (e)=> state.condition.decaf = e.target.checked);
  document.getElementById('low-sugar')?.addEventListener('change', (e)=> state.condition.low_sugar = e.target.checked);
  document.getElementById('low-fat')?.addEventListener('change', (e)=> state.condition.low_fat = e.target.checked);
  document.getElementById('pregnant')?.addEventListener('change', (e)=> state.condition.pregnant = e.target.checked);
  document.getElementById('btn-auto-measure')?.addEventListener('click', ()=> alert('自動測定（デモ）：脈拍・ストレス指標を推定しました。'));

  /* ---------------- Step 6: Summary & Analyze ---------------- */
  const $ = (id)=> document.getElementById(id);
  const summaryFavs = $('summary-favs');
  const summaryRestrictions = $('summary-restrictions');
  const summaryCondition = $('summary-condition');
  const consent = $('consent-check');
  const btnAnalyze = $('btn-analyze');

  function updateSummaryAndConsent(){
    // 好きな食べ物
    const favs = state.favorites.filter(Boolean);
    summaryFavs.textContent = favs.length ? favs.join(' / ') : '—';

    // 制約（アレルギー / 宗教 / ライフ / 不耐症）
    const al = [...state.restrictions.allergy];
    const rel = Object.entries(state.restrictions.religion).filter(([,v])=>v).map(([k])=>k.toUpperCase());
    const life = Object.entries(state.restrictions.lifestyle).filter(([,v])=>v).map(([k])=>k);
    const inta = Object.entries(state.restrictions.intolerance).filter(([,v])=>v).map(([k])=>{
      if (k==='lactose') return '乳糖不耐症';
      if (k==='gluten') return 'グルテン不耐症';
      return k;
    });
    const parts = [];
    if (al.length) parts.push(`アレルギー: ${al.join(', ')}`);
    if (rel.length) parts.push(`宗教: ${rel.join(', ')}`);
    if (life.length) parts.push(`ライフ: ${life.join(', ')}`);
    if (inta.length) parts.push(`不耐症: ${inta.join(', ')}`);
    summaryRestrictions.textContent = parts.length ? parts.join(' / ') : '—';

    // 体調
    const condParts = [`気分 ${state.condition.mood}`];
    if (state.condition.low_caffeine) condParts.push('低カフェイン');
    if (state.condition.decaf) condParts.push('カフェインレス');
    if (state.condition.low_sugar) condParts.push('低糖');
    if (state.condition.low_fat) condParts.push('低脂');
    if (state.condition.pregnant) condParts.push('妊娠中');
    summaryCondition.textContent = condParts.join(' / ');

    // 同意チェックで分析ボタン活性
    if (consent) btnAnalyze.disabled = !consent.checked;
    consent?.addEventListener('change', ()=> btnAnalyze.disabled = !consent.checked);
  }

  btnAnalyze?.addEventListener('click', ()=>{
    btnAnalyze.classList.add('btn-analyzing');
    const label = btnAnalyze.querySelector('.analyze-label');
    const old = label.textContent;
    label.textContent = '分析中…';

    setTimeout(()=>{
      label.textContent = old;
      btnAnalyze.classList.remove('btn-analyzing');
      computeVariants();
      show(71);
    }, 1000);
  });

  function computeVariants(){
    const base = {...state.taste};
    const make = (bias)=> {
      const v = {...base};
      Object.keys(v).forEach(k=>{
        let delta = Math.floor(Math.random()*26)-10;
        if (k===bias) delta += 10;
        v[k] = clamp(v[k] + delta, 0, 100);
      });
      return v;
    };
    state.variants.pasta = [ make('umami'), make('salty'), make('bitter') ];
    state.variants.salad = [ make('sour'), make('salty'), make('umami') ];
    state.variants.crepe = [ make('sweet'), make('spice'), make('bitter') ];
    state.variants.drink = [ make('sweet'), make('sour'), make('spice') ];
  }

  function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

  /* ---------------- Radar SVG生成 ---------------- */
  const polarPoint = (cx, cy, r, deg) => {
    const rad = (Math.PI/180)*deg;
    return [cx + r*Math.cos(rad), cy - r*Math.sin(rad)];
  };
  const buildRadarPoints = (vals, maxR=70) => {
    const order = ['sweet','sour','bitter','umami','salty','spice'];
    return order.map((key, i) => {
      const pct = clamp(vals[key]||0,0,100) / 100;
      const ang = -90 + i*60;
      const [x,y] = polarPoint(100,100,maxR*pct, ang);
      return `${x},${y}`;
    }).join(' ');
  };
  const buildAnalysisSVG = (vals, title) => {
    const poly = buildRadarPoints(vals);
    const axes = ['甘','酸','苦','旨','塩','スパイス'];
    const axisSvg = axes.map((a,i)=>{
      const [x,y]=polarPoint(100,100,78,-90+i*60);
      return `<line x1="100" y1="100" x2="${x}" y2="${y}" stroke="#CBD5E1"/>
              <text x="${x}" y="${y}" font-size="12" fill="#5B6673" text-anchor="middle" dy="${y<100?-4:12}">${a}</text>`;
    }).join('');
    return `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200" preserveAspectRatio="xMidYMid meet">
  <rect x="0" y="0" width="200" height="200" fill="#F1F2F4"/>
  ${[14,28,42,56,70].map(r=>`<circle cx="100" cy="100" r="${r}" fill="none" stroke="#E5E7EB" />`).join('')}
  ${axisSvg}
  <polygon points="${poly}" fill="rgba(11,61,145,.18)" stroke="rgba(11,61,145,.6)" stroke-width="2"/>
</svg>`;
  };
  const svgToUrl = (svg) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

  function updateRecommendationImagesForStep(step){
    let cat = 'pasta';
    if (step===72) cat='salad';
    if (step===73) cat='crepe';
    if (step===74) cat='drink';

    const arr = state.variants[cat] || [];
    for (let i=1;i<=3;i++){
      const img = document.querySelector(`.analysis-img[data-reco="${cat}-${i}"]`);
      if (img) img.src = svgToUrl(buildAnalysisSVG(arr[i-1] || state.taste, `${cat}-${i}`));
    }
    const mapWhy = {
      pasta:['上位味軸に最も合致','塩・旨を調整','苦味を抑えてコク強化'],
      salad:['酸・塩をベースに最適化','塩を少し強めさっぱり','旨味寄りで満足度UP'],
      crepe:['甘を最適化','スパイスで変化','苦味を抑え軽やかに'],
      drink:['甘×酸の黄金比','酸味を前に出す','スパイスの余韻をプラス']
    };
    ['1','2','3'].forEach((n,idx)=>{
      const el = document.getElementById(`why-${cat}-${n}`);
      if (el && mapWhy[cat]) el.textContent = mapWhy[cat][idx] + '。';
    });
  }

  /* ---------------- おすすめ → Queue ---------------- */
  document.querySelectorAll('.btn-order[data-order]').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const type = btn.getAttribute('data-order');
      if (type==='pasta') show(81);
      if (type==='salad') show(82);
      if (type==='crepe') show(83);
      if (type==='drink') show(84);
    });
  });

  /* ---------------- Queue custom selects ---------------- */
  document.querySelector('[data-group="pasta-boil"]')?.addEventListener('click', (e)=>{
    const card = e.target.closest('.radio-card');
    if (!card) return;
    const input = card.querySelector('input[type="radio"]');
    input.checked = true;
    state.pastaBoil = input.value;
    document.querySelectorAll('[data-group="pasta-boil"] .radio-card').forEach(c=> c.classList.remove('is-active'));
    card.classList.add('is-active');
    document.getElementById('choice-pasta').textContent = `現在の選択：${state.pastaBoil}`;
    if (current === 81) btnNext.disabled = false;
  });

  document.querySelector('[data-group="crepe-sweetness"]')?.addEventListener('click', (e)=>{
    const card = e.target.closest('.radio-card');
    if (!card) return;
    const input = card.querySelector('input[type="radio"]');
    input.checked = true;
    state.crepeSweetness = input.value;
    document.querySelectorAll('[data-group="crepe-sweetness"] .radio-card').forEach(c=> c.classList.remove('is-active'));
    card.classList.add('is-active');
    document.getElementById('choice-crepe').textContent = `現在の選択：${state.crepeSweetness}`;
    if (current === 83) btnNext.disabled = false;
  });

  /* ---------------- サマリーの編集ショートカット ---------------- */
  document.querySelectorAll('[data-jump]').forEach(b=>{
    b.addEventListener('click', (e)=>{
      const s = Number(e.currentTarget.getAttribute('data-jump'));
      show(s);
    });
  });

  /* ---------------- スタッフヘルプ ---------------- */
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
            <span class="body">呼出番号 <strong>${ticket}</strong> / 推定到着 <strong>約 1〜2 分</strong></span>
          </div>
          <p class="caption">混雑状況により前後する場合があります。しばらくお待ちください。</p>
          <div class="qd-actions">
            <button class="btn btn-secondary" data-close>閉じる</button>
          </div>
        </div>`;
      document.body.appendChild(ov);
      ov.querySelector('[data-close]').addEventListener('click', ()=> ov.remove());
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

})();
