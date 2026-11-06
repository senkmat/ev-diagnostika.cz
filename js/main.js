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
    if (sel) sel.selectedIndex = parseInt(btn.dataset.package, 10) || 0;
  });
});

// Odeslání formuláře přes Web3Forms
const form = document.getElementById('order-form');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('form-msg');
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true;
    msg.className = 'form-msg';
    msg.textContent = 'Odesílám…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      const data = await res.json();
      if (data.success) {
        form.reset();
        msg.classList.add('ok');
        msg.textContent = 'Díky! Objednávka dorazila, do 24 hodin se vám ozveme.';
      } else {
        throw new Error(data.message || 'Chyba');
      }
    } catch (err) {
      msg.classList.add('err');
      msg.innerHTML = 'Odeslání se nepovedlo. Zavolejte prosím na <a href="tel:+420721256963">+420 721 256 963</a> nebo napište na <a href="mailto:evdiagnostika@gmail.com">evdiagnostika@gmail.com</a>.';
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
