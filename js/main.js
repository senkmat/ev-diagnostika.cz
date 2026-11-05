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
