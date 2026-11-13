(() => {
  "use strict";
  const root = document.querySelector('.case3d-section');
  if (!root) return;
  const DATA = [{"title": "Pricing Strategy Reinvention", "category": "Service Company", "challenge": "Inconsistent pricing and shrinking margins despite growing demand.", "solution": "Value-based pricing tiers and an effort-linked costing model.", "impact": ["Billing rates increased by 18%", "Profit margins improved significantly", "Stronger client negotiations"], "image": "../images/case-studies/case-study-1.jpg"}, {"title": "Cash Burn & Runway Visibility", "category": "Tech Company", "challenge": "Fast scaling without clear cash burn or runway visibility.", "solution": "A rolling 12-month cash model and operating-expense restructuring.", "impact": ["Burn reduced by 37%", "Runway extended by 8 months", "Clear monthly cash visibility"], "image": "../images/case-studies/case-study-2.jpg"}, {"title": "Profitability, Pricing & Initiative Impact", "category": "Manufacturing", "challenge": "Volatile margins, ad-hoc pricing, and unclear initiative returns.", "solution": "Redesigned pricing with initiative-level contribution and disciplined costs.", "impact": ["~6.5% gross margin improvement", "Profitability visible by product", "Improved decision clarity"], "image": "../images/case-studies/case-study-3.jpg"}, {"title": "ERP Implementation", "category": "SME", "challenge": "Spreadsheet-driven operations caused errors and delayed reporting.", "solution": "End-to-end ERP mapping, migration, modules and training.", "impact": ["100% inventory visibility", "Faster order-to-cash cycle", "Automated MIS reporting"], "image": "../images/case-studies/case-study-4.jpg"}, {"title": "Financial Projections for Investors", "category": "SaaS", "challenge": "Missing investor-grade financial forecasts and SaaS KPIs.", "solution": "Three-scenario financial planning aligned with product and GTM.", "impact": ["Investor-ready forecasts in 3 weeks", "ARR and churn KPI clarity", "Stronger investor conversations"], "image": "../images/case-studies/case-study-5.jpg"}, {"title": "Organisation Restructuring", "category": "Growing Business", "challenge": "Sales goals and operations were not aligned.", "solution": "Clear roles, connected KPIs and a reliable reporting rhythm.", "impact": ["27% efficiency improvement", "Faster operational handovers", "Clearer accountability"], "image": "../images/case-studies/case-study-6.jpg"}, {"title": "Profitability Clarity", "category": "Service Company", "challenge": "Unclear which clients and projects were profitable.", "solution": "Project-level costing, utilisation dashboard, and client profitability analysis.", "impact": ["18% utilisation improvement", "Better client profitability insight", "Smarter team allocation"], "image": "../images/case-studies/case-study-7.jpg"}, {"title": "MIS & SOP Transformation", "category": "Corporate", "challenge": "Fragmented reporting processes and inconsistent data.", "solution": "Unified MIS and standard operating procedures across departments.", "impact": ["Weekly leadership dashboards", "80% SOP compliance improvement", "Faster decisions"], "image": "../images/case-studies/case-study-8.jpg"}, {"title": "Turnaround", "category": "Startup", "challenge": "Rapid growth came with unsustainable cash burn.", "solution": "Zero-based budgets, cost realignment and a 12-month turnaround plan.", "impact": ["Losses reduced by 44%", "Runway extended from 5 to 14 months", "Focused execution"], "image": "../images/case-studies/case-study-9.jpg"}];
  // Intro copy mirrors the homepage case-study cards, while the rows below
  // retain the carousel's own challenge, solution and measurable outcomes.
  const INTRO = [
    'The company delivered high-value work but charged inconsistent, legacy rates. Margins were shrinking despite growing demand.',
    'The tech firm was scaling fast but burning cash even faster. The founders lacked clarity on monthly burn and runway.',
    'Despite steady revenue, margins were volatile due to ad-hoc pricing, high production variances and unclear initiative ROI.',
    'The SME ran operations on spreadsheets, resulting in delays, errors and zero real-time visibility.',
    'The SaaS startup had traction but lacked investor-grade projections, ARR clarity, churn, CAC/LTV and GTM metrics.',
    'Sales grew, but operations and finance were not aligned with revenue goals, leading to delays and inefficiency.',
    'The company was busy with clients but unclear on which projects were profitable and which drained resources.',
    'Leadership had no structured reporting. Departments followed different processes, leading to delays and inconsistent data.',
    'Strong growth but unsustainable burn. The runway was short and the founders lacked clarity on where the leaks were.'
  ];
  const stage = root.querySelector('.case3d-stage');
  const track = root.querySelector('[data-case3d-track]');
  const dots = root.querySelector('[data-case3d-dots]');
  const number = root.querySelector('[data-case3d-current]');
  const title = root.querySelector('[data-case3d-title]');
  const category = root.querySelector('[data-case3d-category]');
  const challenge = root.querySelector('[data-case3d-challenge]');
  const solution = root.querySelector('[data-case3d-solution]');
  const impact = root.querySelector('[data-case3d-impact]');
  let current = 0;
  let lastWheel = 0;
  let wheelAccum = 0;
  let wheelDirection = 0;
  let wheelIdle = 0;
  let narrow = window.innerWidth < 601;
  const safe = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const cards = DATA.map((item, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'case3d-card';
    button.setAttribute('aria-label', `View case study ${i+1}: ${item.title}`);
    button.innerHTML = `
      <span class="case3d-card-copy">
        <span class="case3d-card-tags"><span class="case3d-card-tag">Case Study ${String(i+1).padStart(2,'0')}</span><span class="case3d-card-category">${safe(item.category)}</span></span>
        <span class="case3d-card-heading">${safe(item.title)}</span>
        <span class="case3d-card-lede">${safe(INTRO[i])}</span>
        <span class="case3d-card-story">
          <span class="case3d-card-point"><span class="case3d-card-icon">◎</span><span><strong>Challenge</strong><span>${safe(item.challenge)}</span></span></span>
          <span class="case3d-card-point"><span class="case3d-card-icon">✧</span><span><strong>Our Solution</strong><span>${safe(item.solution)}</span></span></span>
        </span>
        <span class="case3d-card-impact-row"><span class="case3d-card-icon">▥</span><span class="case3d-card-impact"><strong>Impact</strong>${item.impact.map(line => `<span>✓ ${safe(line)}</span>`).join('')}</span></span>
      </span>
      <span class="case3d-card-visual"><img src="${safe(item.image)}" alt="" loading="${i < 3 ? 'eager' : 'lazy'}" decoding="async"></span>`;
    button.addEventListener('click', () => set(i));
    track.append(button);
    const dot = document.createElement('button');
    dot.type = 'button'; dot.className = 'case3d-dot';
    dot.textContent = String(i+1).padStart(2,'0');
    dot.setAttribute('aria-label', `Case study ${i+1}`);
    dot.addEventListener('click', () => set(i));
    dots.append(dot);
    return button;
  });
  const dotButtons = [...dots.children];
  function set(index) {
    current = (index + DATA.length) % DATA.length;
    cards.forEach((card,i) => {
      let d = (i-current+DATA.length)%DATA.length;
      if (d > DATA.length/2) d -= DATA.length;
      const abs = Math.abs(d);
      const step = narrow ? 67 : 72;
      const x = d * step;
      const rotate = d === 0 ? 0 : d < 0 ? 22 : -22;
      const scale = Math.max(.58,1-abs*.13);
      card.dataset.distance = String(Math.max(-2, Math.min(2,d)));
      card.dataset.hidden = abs > 2 ? 'true':'false';
      card.style.transform = `translate(-50%, -50%) translateX(${x}%) translateZ(${-abs*115}px) rotateY(${rotate}deg) scale(${scale})`;
      card.style.opacity = abs > 2 ? '0' : abs === 2 ? '.25' : abs === 1 ? '.64':'1';
      card.style.zIndex = String(10-abs);
      card.tabIndex = abs > 2 ? -1:0;
      card.setAttribute('aria-hidden', abs > 2 ? 'true':'false');
    });
    dotButtons.forEach((dot,i) => dot.setAttribute('aria-current',String(i===current)));
    const item=DATA[current];
    number.textContent=String(current+1).padStart(2,'0');
    category.textContent=item.category;
    title.textContent=item.title;
    challenge.textContent=`Challenge: ${item.challenge}`;
    solution.textContent=`Our solution: ${item.solution}`;
    impact.replaceChildren(...item.impact.map(line=>{const li=document.createElement('li');li.textContent=line;return li;}));
  }
  root.querySelector('[data-case3d-prev]').addEventListener('click',()=>set(current-1));
  root.querySelector('[data-case3d-next]').addEventListener('click',()=>set(current+1));
  stage.addEventListener('keydown',e=>{
    if (e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();set(current+(e.key==='ArrowRight'?1:-1));}
  });
  // Capture the wheel ONLY over the carousel, and only while another slide exists.
  // Accumulate trackpad micro-deltas instead of triggering accidental multi-slide jumps.
  stage.addEventListener('wheel', e => {
    const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
    if (!delta) return;
    const dir = Math.sign(delta);
    const atEnd = (dir > 0 && current === DATA.length - 1) || (dir < 0 && current === 0);
    if (atEnd || e.ctrlKey) { wheelAccum = 0; return; } // allow ordinary page scrolling
    e.preventDefault();
    const now = performance.now();
    if (now - wheelIdle > 220 || wheelDirection !== dir) wheelAccum = 0;
    wheelIdle = now;
    wheelDirection = dir;
    // A normal mouse wheel click is about 100px; trackpads emit smaller pulses.
    wheelAccum += Math.abs(delta) * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 500 : 1);
    if (now - lastWheel < 520 || wheelAccum < 38) return;
    wheelAccum = 0;
    lastWheel = now;
    set(current + dir);
  }, {passive:false});
  let startX=null;
  stage.addEventListener('touchstart',e=>{if(e.touches.length===1)startX=e.touches[0].clientX;},{passive:true});
  stage.addEventListener('touchend',e=>{if(startX===null)return;const dx=e.changedTouches[0].clientX-startX;startX=null;if(Math.abs(dx)>45)set(current+(dx<0?1:-1));},{passive:true});
  // Ignore height-only resize changes (mobile browser toolbar).
  window.addEventListener('resize', () => {
    const nextNarrow = window.innerWidth < 601;
    if (nextNarrow !== narrow) { narrow = nextNarrow; set(current); }
  }, {passive:true});
  set(0);
})();
