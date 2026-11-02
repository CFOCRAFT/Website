/* CFO CRAFT intro scheduler
 * - Fully interactive date picker and searchable IANA time zones
 * - Sample hours (not real availability) until BOTH server endpoints are configured
 * - Real endpoint integration requires authoritative server-side availability + atomic booking
 * - Host's standard scheduling zone: Asia/Kolkata
 */
(()=>{'use strict';
  const $=(id)=>document.getElementById(id);
  const CFG=Object.assign({availabilityEndpoint:'',bookingEndpoint:'',durationMinutes:45,businessEmail:'info@cfocraft.com'},window.CFO_BOOKING_CONFIG||{});
  const LIVE=Boolean(CFG.availabilityEndpoint && CFG.bookingEndpoint);
  const HALF_CONFIG=Boolean(CFG.availabilityEndpoint || CFG.bookingEndpoint)&&!LIVE;
  const HOST_TZ='Asia/Kolkata';
  const DATE_WINDOW_DAYS=60;
  const now=()=>new Date();
  const p2=n=>String(n).padStart(2,'0');
  const partsIn=(date,tz)=>{
    const pieces=new Intl.DateTimeFormat('en-GB',{timeZone:tz,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(date);
    const obj=Object.fromEntries(pieces.map(x=>[x.type,x.value]));return `${obj.year}-${obj.month}-${obj.day}`;
  };
  const today=()=>partsIn(now(),HOST_TZ);
  const getUTC=(key)=>new Date(`${key}T12:00:00Z`);
  const keyFromUTC=(d)=>`${d.getUTCFullYear()}-${p2(d.getUTCMonth()+1)}-${p2(d.getUTCDate())}`;
  const datePlus=(key,days)=>{let d=getUTC(key);d.setUTCDate(d.getUTCDate()+days);return keyFromUTC(d);};
  const monthOf=(key)=>key.slice(0,7);
  const monthMove=(key,n)=>{let [y,m]=key.split('-').map(Number);return `${new Date(Date.UTC(y,m-1+n,1)).getUTCFullYear()}-${p2(new Date(Date.UTC(y,m-1+n,1)).getUTCMonth()+1)}`;};
  const dateLabel=(key,short=false)=>new Intl.DateTimeFormat('en-US',{weekday:short?'short':'long',day:'numeric',month:'long',...(short?{}:{year:'numeric'}),timeZone:'UTC'}).format(getUTC(key));
  const dayWeek=(key)=>getUTC(key).getUTCDay();
  const state={month:monthOf(today()),date:'',zone:'Asia/Kolkata',slots:[],slot:null,step:1,run:0,controller:null,timezoneOpen:false};
  const baseDate=()=>today();
  const withinRange=(key)=>key>=baseDate() && key<=datePlus(baseDate(),DATE_WINDOW_DAYS) && dayWeek(key)!==0 && dayWeek(key)!==6;
  const displayTime=(iso,zone=state.zone)=>new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true,timeZone:zone}).format(new Date(iso));
  const tzDate=(iso,zone=state.zone)=>partsIn(new Date(iso),zone);
  const fullSlot=(iso,zone=state.zone)=>{
    const prefix=tzDate(iso,zone)===state.date?'':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',timeZone:zone}).format(new Date(iso))+' · ';
    return prefix+displayTime(iso,zone);
  };
  const zoneOffset=(zone,date=now())=>{
    try{return new Intl.DateTimeFormat('en-US',{timeZone:zone,timeZoneName:'shortOffset',hour:'numeric'}).formatToParts(date).find(x=>x.type==='timeZoneName')?.value||'GMT';}catch{return 'GMT';}
  };
  const zoneNice=(tz)=>tz.replaceAll('_',' ').replaceAll('/',' / ');
  const zlist=(()=>{
    let supported=[];
    try{supported=Intl.supportedValuesOf('timeZone');}catch{supported=['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','America/New_York','America/Los_Angeles','Australia/Sydney','Europe/Paris'];}
    return [...new Set(['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','America/New_York','America/Los_Angeles','Asia/Tokyo',...supported])].filter(x=>{try{new Intl.DateTimeFormat('en',{timeZone:x});return true}catch{return false}});
  })();
  const favorites=['Asia/Kolkata','Asia/Dubai','Asia/Singapore','Europe/London','America/New_York','America/Los_Angeles'];
  let tzMenu=$('timezone-menu'), tzBtn=$('timezone-button');
  function renderZones(query=''){
    const q=query.toLowerCase().trim().replaceAll(' ','_');
    const sorted=[...zlist].sort((a,b)=>{
      const ia=favorites.indexOf(a),ib=favorites.indexOf(b);
      return (ia===-1?999:ia)-(ib===-1?999:ib)||a.localeCompare(b);
    });
    const matches=sorted.filter(t=>t.toLowerCase().includes(q)||zoneNice(t).toLowerCase().replaceAll(' ','_').includes(q));
    const area=$('timezone-results');area.replaceChildren();
    if(!matches.length){const msg=document.createElement('div');msg.className='tz-empty';msg.textContent='No matching time zones.';area.append(msg);return;}
    const frag=document.createDocumentFragment();
    matches.slice(0,500).forEach(z=>{
      const opt=document.createElement('button');opt.type='button';opt.className='tz-option';opt.role='option';opt.setAttribute('aria-selected',String(z===state.zone));
      const name=document.createElement('span');name.textContent=zoneNice(z);const off=document.createElement('span');off.className='tz-offset';off.textContent=zoneOffset(z);
      opt.append(name,off);opt.addEventListener('click',()=>chooseZone(z));frag.append(opt);
    });area.append(frag);
  }
  function closeZone(){state.timezoneOpen=false;tzMenu.hidden=true;tzBtn.setAttribute('aria-expanded','false');}
  function openZone(){state.timezoneOpen=true;tzMenu.hidden=false;tzBtn.setAttribute('aria-expanded','true');$('timezone-search').value='';renderZones();$('timezone-search').focus();}
  function chooseZone(tz){const old=state.zone;state.zone=tz;closeZone();$('timezone-label').textContent=`${zoneNice(tz)} (${zoneOffset(tz)})`;if(old!==tz && state.date){if(state.slot){state.slot=null;}selectDate(state.date);}else{renderCalendar();}tzBtn.focus();}
  tzBtn.addEventListener('click',()=>state.timezoneOpen?closeZone():openZone());
  $('timezone-search').addEventListener('input',e=>renderZones(e.target.value));
  $('timezone-search').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const first=$('timezone-results').querySelector('button');if(first)first.click();}if(e.key==='Escape'){closeZone();tzBtn.focus();}});
  document.addEventListener('pointerdown',e=>{if(state.timezoneOpen&&!$('timezone-picker').contains(e.target))closeZone();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.timezoneOpen){closeZone();tzBtn.focus();}});

  function renderCalendar(){
    const [y,m]=state.month.split('-').map(Number);
    $('month-title').textContent=new Intl.DateTimeFormat('en-US',{month:'long',year:'numeric',timeZone:'UTC'}).format(new Date(Date.UTC(y,m-1,1)));
    $('month-prev').disabled=state.month<=monthOf(baseDate());
    $('month-next').disabled=state.month>=monthOf(datePlus(baseDate(),DATE_WINDOW_DAYS));
    const firstDay=(new Date(Date.UTC(y,m-1,1)).getUTCDay()+6)%7;
    const dayCount=new Date(Date.UTC(y,m,0)).getUTCDate();
    const grid=$('day-grid');grid.replaceChildren();
    for(let k=0;k<firstDay;k++){const placeholder=document.createElement('span');placeholder.className='day-spacer';grid.append(placeholder);}
    for(let d=1;d<=dayCount;d++){
      const date=`${state.month}-${p2(d)}`;const b=document.createElement('button');b.type='button';b.className='day-cell';b.textContent=d;b.setAttribute('aria-label',dateLabel(date));b.setAttribute('aria-pressed',String(state.date===date));
      if(!withinRange(date)){b.disabled=true;}else{b.classList.add('bookable');b.addEventListener('click',()=>selectDate(date));}
      if(date===baseDate())b.classList.add('today');if(date===state.date)b.classList.add('selected');
      grid.append(b);
    }
  }
  function formatContext(msg){$('time-context').textContent=msg;}
  function emptyTimes(){state.slots=[];state.slot=null;$('times-list').replaceChildren();formatContext('');}
  function loading(active){$('times-loading').hidden=!active;}
  // Stable date-dependent SAMPLE schedule. All times are in the host's time zone,
  // converted into actual UTC instants before display in the visitor's time zone.
  function demoSlotsForDay(key){
    // Demo mode follows the same fixed start times as the live backend.
    return [11,12,13,14,15,16,17].map(h=>{
      const start=new Date(`${key}T${p2(h)}:00:00+05:30`);
      const end=new Date(start.getTime()+CFG.durationMinutes*60000);
      return {start:start.toISOString(),end:end.toISOString(),id:`sample-${key}-${h}`,sample:true};
    }).filter(s=>Date.parse(s.start)>Date.now()+60*60000);
  }
  function slotsMarkup(){
    const area=$('times-list');area.replaceChildren();
    if(!state.slots.length){formatContext('No times for this date. Please choose another day.');return;}
    const fragment=document.createDocumentFragment();
    state.slots.forEach(slot=>{
      const row=document.createElement('div');row.className='time-choice';
      const btn=document.createElement('button');btn.type='button';btn.className='time-button';btn.textContent=fullSlot(slot.start);btn.setAttribute('aria-pressed',String(state.slot?.start===slot.start));
      if(state.slot?.start===slot.start){btn.classList.add('active');const next=document.createElement('button');next.type='button';next.className='next-button';next.textContent='Next →';next.addEventListener('click',goDetails);row.append(btn,next);}else{row.append(btn);}
      btn.addEventListener('click',()=>{state.slot=slot;slotsMarkup();});fragment.append(row);
    });
    area.append(fragment);
    formatContext(LIVE?'Times shown in your selected time zone.':'Illustrative times only · not confirmed availability.');
  }
  async function selectDate(date){
    if(!withinRange(date))return;
    state.run++;const run=state.run;
    if(state.controller){state.controller.abort();state.controller=null;}
    state.date=date;emptyTimes();loading(true);renderCalendar();
    $('time-date-title').textContent=dateLabel(date,true);
    $('time-help').textContent='';
    if(HALF_CONFIG){loading(false);formatContext('Calendar setup is incomplete. Contact CFO CRAFT for availability.');return;}
    try{
      if(LIVE){
        const controller=new AbortController();state.controller=controller;
        const u=new URL(CFG.availabilityEndpoint,location.origin);
        u.searchParams.set('date',date);u.searchParams.set('timezone',state.zone);u.searchParams.set('duration',String(CFG.durationMinutes));
        const response=await fetch(u.toString(),{headers:{Accept:'application/json'},credentials:'same-origin',cache:'no-store',signal:controller.signal});
        if(!response.ok)throw new Error(`Unable to check the calendar (${response.status}).`);
        const data=await response.json();if(!Array.isArray(data.slots))throw new Error('Invalid calendar response');
        if(run!==state.run)return;
        state.slots=data.slots.filter(s=>s&&typeof s.start==='string'&&Number.isFinite(Date.parse(s.start))&&Date.parse(s.start)>Date.now()).map(s=>({start:s.start,end:s.end||new Date(Date.parse(s.start)+CFG.durationMinutes*60000).toISOString(),id:s.id||s.start,sample:false})).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
      }else{
        await new Promise(resolve=>setTimeout(resolve,850));
        if(run!==state.run)return;
        state.slots=demoSlotsForDay(date);
      }
      loading(false);slotsMarkup();
    }catch(err){if(run!==state.run||err.name==='AbortError')return;loading(false);formatContext('Calendar availability could not be verified. Please try another date or contact us.');}
  }
  function gotoStep(num){state.step=num;for(const [n,id] of [[1,'step-time'],[2,'step-details'],[3,'step-finish']])$(id).hidden=n!==num;
    document.querySelectorAll('.progress-step').forEach(el=>{const n=Number(el.dataset.step);el.classList.toggle('is-current',n===num);el.classList.toggle('is-done',n<num);});
    $('step-caption').textContent=`0${num} / 03`;
    document.querySelector('.schedule-pane').scrollIntoView({behavior:'smooth',block:'start'});
  }
  function goDetails(){if(!state.slot)return;
    $('summary-date').textContent=`${dateLabel(state.date)} · ${fullSlot(state.slot.start)}`;
    $('summary-zone').textContent=`${zoneNice(state.zone)} (${zoneOffset(state.zone,new Date(state.slot.start))}) · 45-minute Google Meet`;
    gotoStep(2);$('guest-name').focus({preventScroll:true});
  }
  function buildMailto(d){
    const subject=`Intro to CFO CRAFT — ${d.company}`;
    const body=[`Hello Sudhir and CFO CRAFT,`,'',`I would like to request an introductory 45-minute call.`, '',`Preferred date (host India): ${d.date}`,`Preferred time (${d.timezone}): ${d.displayTime}`,`Proposed start: ${d.slotStart}`,'',`Name: ${d.name}`,`Email: ${d.email}`,`Company: ${d.company}`,`Phone: ${d.phone||'Not provided'}`,`Topic: ${d.topic}`,`Notes: ${d.message||'None'}`,'',`I understand this slot is not confirmed until CFO CRAFT replies.`, 'Thank you.'].join('\n');
    return `mailto:${encodeURIComponent(CFG.businessEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }
  function showFinish(d,confirmed){
    $('finish-tag').textContent=confirmed?'MEETING CONFIRMED':'REQUEST PREPARED';
    $('finish-title').textContent=confirmed?'Your intro is confirmed':'Your intro request is ready';
    $('finish-description').textContent=confirmed?'Your booking has been accepted. Look for the invitation and Google Meet details in your email.':'Please send the prepared email. Your selected time is not reserved until CFO CRAFT confirms it.';
    $('done-symbol').textContent=confirmed?'✓':'✉';
    $('finish-datetime').textContent=`${dateLabel(d.date)} · ${d.displayTime} (${zoneOffset(state.zone,new Date(d.slotStart))})`;
    $('finish-email').textContent=d.email;
    $('email-request').hidden=confirmed;
    gotoStep(3);
  }
  // Public booking security check: Turnstile token never goes in local storage.
  // Render verifies it server-side; BOOKING_TEST_KEY is never sent by visitors.
  let challengeWidgetId=null;
  let challengeWaiter=null;
  function completeChallenge(error,token){
    if(!challengeWaiter)return;
    const pending=challengeWaiter;challengeWaiter=null;
    clearTimeout(pending.timer);
    if(error)pending.reject(error);else pending.resolve(token);
  }
  function challengeToken(){
    const key=CFG.turnstileSiteKey;
    if(!key || key.startsWith('REPLACE_WITH_')){
      return Promise.reject(new Error('Online booking is being configured. Please try again later.'));
    }
    if(!window.turnstile){
      return Promise.reject(new Error('Security verification could not load. Please retry or contact us.'));
    }
    if(challengeWaiter)return Promise.reject(new Error('Verification is already running.'));
    return new Promise((resolve,reject)=>{
      try{
        if(challengeWidgetId===null){
          challengeWidgetId=window.turnstile.render('#cfo-turnstile',{
            sitekey:key,
            execution:'execute',
            appearance:'interaction-only',
            action:'intro_booking',
            callback:token=>completeChallenge(null,token),
            'error-callback':()=>completeChallenge(new Error('Security verification failed. Please retry.')),
            'expired-callback':()=>completeChallenge(new Error('Security verification expired. Please retry.')),
            'timeout-callback':()=>completeChallenge(new Error('Security verification timed out. Please retry.'))
          });
        }
        if(challengeWidgetId===undefined){throw new Error('Security verification could not start.');}
        const timer=setTimeout(()=>completeChallenge(new Error('Security verification timed out. Please retry.')),120000);
        challengeWaiter={resolve,reject,timer};
        window.turnstile.execute(challengeWidgetId);
      }catch(error){
        if(challengeWaiter)completeChallenge(error);
        else reject(new Error('Security verification could not start.'));
      }
    });
  }
  async function sendRequest(event){
    event.preventDefault();$('form-error').hidden=true;
    const f=$('booking-form');if(!f.checkValidity()){f.reportValidity();return;}
    if(!state.slot||!state.date){$('form-error').textContent='Choose a date and time first.';$('form-error').hidden=false;return;}
    const val=id=>$(id).value.trim();
    const details={name:val('guest-name'),email:val('guest-email'),company:val('guest-company'),phone:val('guest-phone'),topic:val('guest-topic'),message:val('guest-message'),date:state.date,timeZone:state.zone,timezone:state.zone,displayTime:fullSlot(state.slot.start),slotStart:state.slot.start,slotEnd:state.slot.end,durationMinutes:CFG.durationMinutes};
    if(!LIVE){const link=buildMailto(details);$('email-request').href=link;showFinish(details,false);window.location.href=link;return;}
    const btn=$('confirm-button');btn.disabled=true;btn.textContent='Confirming with calendar…';
    try{
      details.consent=$('guest-consent').checked;
      details.turnstileToken=await challengeToken();
      const csrf=document.querySelector('meta[name="csrf-token"]')?.content;
      const r=await fetch(new URL(CFG.bookingEndpoint,location.origin).toString(),{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json',...(csrf?{'X-CSRF-Token':csrf}:{})},credentials:'same-origin',cache:'no-store',body:JSON.stringify(details)});
      const j=await r.json().catch(()=>({}));
      if(!r.ok||j.status!=='confirmed')throw new Error(j.message||'Could not reserve the time. Please choose another slot.');
      showFinish(details,true);
    }catch(err){$('form-error').textContent=err.message||'Booking could not be confirmed. Please try again.';$('form-error').hidden=false;}
    finally{
      if(challengeWidgetId!==null && window.turnstile){
        try{window.turnstile.reset(challengeWidgetId);}catch(_){/* ignore reset failures */}
      }
      btn.disabled=false;btn.textContent='Confirm this time →';
    }
  }
  function setup(){
    const q=new URLSearchParams(location.search);const passed=q.get('email');if(passed&&passed.length<255)$('guest-email').value=passed;
    const topic=q.get('service');if(topic){const opt=[...$('guest-topic').options].find(x=>x.value.toLowerCase()===topic.toLowerCase());if(opt)$('guest-topic').value=opt.value;}
    try{const local=Intl.DateTimeFormat().resolvedOptions().timeZone;if(zlist.includes(local))state.zone=local;}catch{}
    $('timezone-label').textContent=`${zoneNice(state.zone)} (${zoneOffset(state.zone)})`;
    state.month=monthOf(baseDate());renderCalendar();
    $('month-prev').addEventListener('click',()=>{state.month=monthMove(state.month,-1);renderCalendar();});
    $('month-next').addEventListener('click',()=>{state.month=monthMove(state.month,1);renderCalendar();});
    $('change-time').addEventListener('click',()=>gotoStep(1));
    $('booking-form').addEventListener('submit',sendRequest);
    $('booking-fineprint').textContent=LIVE?'Confirmation appears after the calendar service accepts your booking.':'Without a calendar connection, submitting prepares an email request; it does not book a meeting.';
    $('sample-disclosure').hidden=LIVE;
    if(HALF_CONFIG)$('sample-disclosure').textContent='Calendar integration is partially configured. Finish both server endpoints before accepting appointments.';
    if(LIVE)$('confirm-button').textContent='Confirm this time →';
    const nav=$('navbar'), menu=$('mobileMenuBtn'), links=document.querySelector('.navbar .nav-links');
    const updateNav=()=>{nav.classList.toggle('scrolled',window.scrollY>36);};
    updateNav();window.addEventListener('scroll',updateNav,{passive:true});
    const closeMobile=()=>{links.classList.remove('active');menu.classList.remove('active');menu.setAttribute('aria-expanded','false');document.querySelectorAll('.nav-dropdown-wrap.open').forEach(w=>w.classList.remove('open'));};
    menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls','booking-nav-links');
    menu.addEventListener('click',()=>{const active=links.classList.toggle('active');menu.classList.toggle('active',active);menu.setAttribute('aria-expanded',String(active));if(!active)document.querySelectorAll('.nav-dropdown-wrap.open').forEach(w=>w.classList.remove('open'));});
    document.querySelectorAll('.navbar .nav-dropdown-wrap > .nav-link').forEach(trigger=>{
      const w=trigger.parentElement;
      trigger.addEventListener('click',()=>{if(matchMedia('(max-width: 768px)').matches){document.querySelectorAll('.nav-dropdown-wrap.open').forEach(other=>{if(other!==w)other.classList.remove('open')});w.classList.toggle('open');}});
      trigger.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();trigger.click();}if(e.key==='Escape')w.classList.remove('open');});
    });
    document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMobile();});
    document.addEventListener('click',e=>{if(!nav.contains(e.target))closeMobile();});
    document.querySelectorAll('.navbar .nav-links a').forEach(a=>a.addEventListener('click',closeMobile));
    window.addEventListener('resize',()=>{if(window.innerWidth>768)closeMobile();});
  }
  setup();
})();
