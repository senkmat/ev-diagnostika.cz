// Jazyk stránky (cs / en)
const EN = document.documentElement.lang === 'en';

// Mobilní menu
const toggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.nav');
if (toggle && nav) {
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => nav.classList.remove('open')));
}

// Rok v patičce
const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();

// Předvyplnění balíčku z tlačítek v ceníku
document.querySelectorAll('[data-package]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sel = document.getElementById('f-package');
    if (sel) { sel.selectedIndex = parseInt(btn.dataset.package, 10) || 0; updatePlace(); }
  });
});

// Místo testu jen když nejde o test v Kníničkách (první volba)
function updatePlace() {
  const sel = document.getElementById('f-package');
  const field = document.getElementById('place-field');
  const input = document.getElementById('f-place');
  if (!sel || !field || !input) return;
  const show = sel.selectedIndex !== 0;
  field.hidden = !show;
  input.disabled = !show;
  input.required = show;
}
const pkg = document.getElementById('f-package');
if (pkg) { pkg.addEventListener('change', updatePlace); updatePlace(); }

// Čas testu: ve všední dny jen od 15:00 – jen upozorní, odeslání neblokuje
const fDate = document.getElementById('f-date');
const fTime = document.getElementById('f-time');
const fTimeTo = document.getElementById('f-time-to');
function orderTime() {
  const a = fTime ? fTime.value : '', b = fTimeTo ? fTimeTo.value : '';
  return a && b ? a + '–' + b : a ? (EN ? 'from ' : 'od ') + a : b ? (EN ? 'until ' : 'do ') + b : '';
}
function updateTimes() {
  const warn = document.getElementById('time-warn');
  if (!warn || !fTime) return;
  const m = (fDate && fDate.value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const day = m ? new Date(+m[1], +m[2] - 1, +m[3]).getDay() : -1;
  const t = fTime.value || (fTimeTo && fTimeTo.value) || '';
  warn.hidden = !(day >= 1 && day <= 5 && t && t < '15:00');
}
[fDate, fTime, fTimeTo].forEach(el => { if (el) el.addEventListener('change', updateTimes); });

// Přehledný e-mail s objednávkou: důležité údaje nahoře, prázdná pole pryč, český datum, předmět s autem a službou
function buildOrder(form) {
  const src = new FormData(form);
  const out = new FormData();
  ['access_key', 'from_name', 'botcheck'].forEach(k => { if (src.has(k)) out.append(k, src.get(k)); });
  const v = k => (src.get(k) || '').toString().trim();
  let date = v('date');
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) date = `${+m[3]}. ${+m[2]}. ${m[1]}`;
  const service = v('service').replace(/\s*\(.*\)$/, '');
  const time = orderTime().replace('from ', 'od ').replace('until ', 'do ');
  const prefix = EN ? 'Poptávka (EN)' : 'Poptávka';
  out.append('subject', `${prefix}: ${v('car') || '?'} – ${service}${date ? ' – ' + date : ''}${time ? (date ? ', ' : ' – ') + time : ''}`);
  const fields = [['Service', v('service')], ['Date', date], ['Time', time], ['Location', v('location')], ['Car', v('car')], ['Year', v('year')],
    ['Name', v('name')], ['Phone', v('phone')], ['email', v('email')], ['Listing', v('listing')], ['Message', v('message')]];
  fields.forEach(([k, val]) => { if (val) out.append(k, val); });
  return out;
}

// Okno s poděkováním po úspěšném odeslání
function showThanks(form) {
  const dlg = document.getElementById('thanks');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  const fd = new FormData(form);
  const v = k => (fd.get(k) || '').toString().trim();
  const selEl = document.getElementById('f-package');
  const service = selEl ? selEl.options[selEl.selectedIndex].text.replace(/\s+–\s+[\d ,.]+\s*(Kč|CZK)$/, '') : '';
  let date = v('date');
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) date = EN ? `${+m[3]} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][+m[2]-1]} ${m[1]}` : `${+m[3]}. ${+m[2]}. ${m[1]}`;
  const time = orderTime();
  document.getElementById('thanks-summary').textContent = [service, v('car'), [date, time].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  // mapa jen u testu v Kníničkách
  const map = document.getElementById('thanks-map');
  const sel = document.getElementById('f-package');
  if (map && sel) map.hidden = sel.selectedIndex !== 0;
  dlg.showModal();
}
document.querySelectorAll('.thanks-close').forEach(b => b.addEventListener('click', () => b.closest('dialog').close()));
const thanksDlg = document.getElementById('thanks');
if (thanksDlg) thanksDlg.addEventListener('click', e => { if (e.target === thanksDlg) thanksDlg.close(); });

// Odeslání formuláře přes Web3Forms
const form = document.getElementById('order-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('form-msg');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    msg.className = 'form-msg';
    msg.textContent = EN ? 'Sending…' : 'Odesílám…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: buildOrder(form)
      });
      const data = await res.json();
      if (data.success) {
        showThanks(form);
        adsConversion(ADS.form, 2490);
        form.reset();
        updatePlace();
        updateTimes();
        msg.classList.add('ok');
        msg.textContent = EN ? 'Thank you! Your request has arrived. I will get back to you within 24 hours at the latest.' : 'Díky! Poptávka dorazila. Ozvu se vám co nejdřív, nejpozději do 24 hodin, a domluvíme termín.';
      } else {
        throw new Error(data.message || 'Chyba');
      }
    } catch (err) {
      msg.classList.add('err');
      msg.innerHTML = EN ? 'Sending failed. Please call <a href="tel:+420721256963">+420 721 256 963</a> or email <a href="mailto:evdiagnostika@gmail.com">evdiagnostika@gmail.com</a>.' : 'Odeslání se nepovedlo. Zavolejte prosím na <a href="tel:+420721256963">+420 721 256 963</a> nebo napište na <a href="mailto:evdiagnostika@gmail.com">evdiagnostika@gmail.com</a>.';
    } finally {
      btn.disabled = false;
    }
  });
}

// Recenze z Googlu – plynulé automatické posouvání v jednom řádku
const gq = document.querySelector('.g-quotes');
const gt = gq && gq.querySelector('.g-track');
if (gt && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const items = [...gt.children];
  // zopakovat recenze, aby pás byl delší než šířka stránky
  while (gt.scrollWidth < gq.clientWidth * 1.2) {
    items.forEach(el => { const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); gt.appendChild(c); });
  }
  // zdvojit celou sadu pro plynulou smyčku
  [...gt.children].forEach(el => { const c = el.cloneNode(true); c.setAttribute('aria-hidden', 'true'); gt.appendChild(c); });
  gq.style.setProperty('--g-dur', Math.round(gt.scrollWidth / 2 / 35) + 's'); // ~35 px/s
  gq.classList.add('is-moving');
}

// mapa se načte až po kliknutí (bez cookies Google předem)
document.querySelectorAll('.map-load').forEach(function(btn){
  btn.addEventListener('click',function(){
    var box=btn.parentElement, f=document.createElement('iframe');
    f.src=box.getAttribute('data-src'); f.title=(EN?'Map':'Mapa')+' – U Památníku 18, Brno-Kníničky'; f.loading='lazy'; f.referrerPolicy='no-referrer-when-downgrade';
    box.innerHTML=''; box.appendChild(f);
  });
});

// Měření Google Ads – načítá se všem návštěvníkům bez lišty. Vypnout jde na stránce o ochraně údajů (volba se pamatuje v localStorage).
const ADS = { id: 'AW-18566439737', form: 'qugTCL70oLYdELnGlZVF', call: '', key: 'ads-consent' }; // call: štítek konverze „klik na telefon“ – doplnit, až bude v Google Ads založená
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
let adsOn = false;
function adsGet() { try { return localStorage.getItem(ADS.key); } catch (e) { return null; } }
function adsSet(v) { try { localStorage.setItem(ADS.key, v); } catch (e) {} }
function adsStart() {
  if (adsOn) return;
  adsOn = true;
  gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'denied' });
  gtag('js', new Date());
  gtag('config', ADS.id);
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.googletagmanager.com/gtag/js?id=' + ADS.id;
  document.head.appendChild(s);
}
function adsConversion(label, value) {
  if (!adsOn || !label) return;
  const p = { send_to: ADS.id + '/' + label, transaction_id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8) };
  if (value) { p.value = value; p.currency = 'CZK'; }
  gtag('event', 'conversion', p);
}
if (adsGet() !== 'denied') adsStart();

// Konverze: klik na telefon
document.addEventListener('click', e => {
  const a = e.target.closest && e.target.closest('a[href^="tel:"]');
  if (a) adsConversion(ADS.call);
});

// Stránka o ochraně údajů: změna souhlasu
const adsState = document.getElementById('ads-state');
function adsShowState() {
  if (!adsState) return;
  adsState.textContent = adsGet() === 'denied' ? 'Měření reklamy je teď vypnuté.' : 'Měření reklamy je teď zapnuté.';
}
document.querySelectorAll('[data-ads-set]').forEach(b => b.addEventListener('click', () => {
  adsSet(b.dataset.adsSet);
  if (b.dataset.adsSet === 'granted') adsStart();
  else {
    if (adsOn) gtag('consent', 'update', { ad_storage: 'denied', ad_user_data: 'denied' });
    ['_gcl_aw', '_gcl_au', '_gcl_gs', '_gcl_gb'].forEach(n => ['', '; domain=.' + location.hostname.replace(/^www\./, '')].forEach(d => { document.cookie = n + '=; Max-Age=0; path=/' + d; }));
  }
  adsShowState();
}));
adsShowState();
