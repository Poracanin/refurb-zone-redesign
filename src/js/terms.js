'use strict';
let termsData, termsFontPromise, termsObserver;
const termIds = [
  'uvod',
  'servis-smlouva',
  'provedeni-servisu',
  'zaruky-servisu',
  'odstoupeni-podminky',
  'vzor-formulare',
  'prodej-smlouva',
  'platby',
  'doruceni',
  'zaruka-zbozi',
  'osobni-udaje',
  'reseni-sporu',
  'zaver',
];
const termLabels = [
  'Úvodní ustanovení',
  'Sjednání servisu',
  'Provedení servisu',
  'Záruky a reklamace',
  'Odstoupení od smlouvy',
  'Vzorový formulář',
  'Nákup náhradních dílů',
  'Platby',
  'Doručení zboží',
  'Záruka na zboží',
  'Osobní údaje',
  'Řešení sporů',
  'Závěrečná ustanovení',
];
const legalIcon = (name) =>
  `<svg class="legal-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${{ file: '<path d="M14 2H5v20h14V7zM14 2v6h5M8 12h8M8 16h8"/>', download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>', print: '<path d="M6 8V2h12v6M6 17H3V8h18v9h-3M6 13h12v9H6z"/>', mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 5 10 8L22 5"/>', check: '<path d="m4 12 5 5L20 6"/>', arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>', shield: '<path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6zM8 12l3 3 5-6"/>' }[name] || ''}</svg>`;
function legalText(text) {
  return esc(text).replace(
    /\[refurb\.zone\]\(http:\/\/www\.refurb\.zone\/\)/g,
    '<a href="https://www.refurb.zone/" target="_blank" rel="noopener">refurb.zone</a>',
  );
}
async function termsPage() {
  const host = document.getElementById('page-content');
  host.innerHTML =
    '<div class="container legal-loading" role="status">Načítáme obchodní podmínky…</div>';
  try {
    const response = await fetch('/data/terms.json?v=terms-1');
    if (!response.ok) throw Error('Podmínky se nepodařilo načíst.');
    termsData = await response.json();
    const c = termsData.company;
    host.innerHTML = `<div class="container legal-page"><div class="breadcrumbs"><a href="/">Domů</a><span>/</span><span>Obchodní podmínky</span></div>
      <header class="legal-hero"><div><span class="eyebrow">INFORMACE PRO ZÁKAZNÍKY</span><h1>Obchodní podmínky<span class="legal-title-dot">.</span></h1><p>Vše o servisu elektroniky a nákupu náhradních dílů.<br>Podmínky spolupráce přehledně na jednom místě.</p><div class="legal-hero-actions"><a class="button primary" href="#odstoupeni">${legalIcon('file')} Formulář odstoupení ${legalIcon('arrow')}</a><button class="button secondary" data-print-terms>${legalIcon('print')} Vytisknout podmínky</button></div></div><div class="legal-hero-note">${legalIcon('shield')}<strong>Jasné podmínky.<br>Férová spolupráce.</strong><span>Servis pro spotřebitele i podnikatele.<br>Prodej dílů výhradně podnikatelům.</span></div></header>
      <section class="legal-company" aria-label="Provozovatel obchodu"><div><span>PROVOZOVATEL</span><strong>${esc(c.name)}</strong><small>IČO ${c.ico} · DIČ ${c.dic}</small></div><div><span>SÍDLO SPOLEČNOSTI</span><strong>${esc(c.street)}</strong><small>${esc(c.city)}</small></div><div><span>KONTAKT PRO ZÁKAZNÍKY</span><a href="mailto:${c.email}">${c.email} ${legalIcon('arrow')}</a><small>Dotazy k podmínkám i odstoupení</small></div></section>
      <div class="legal-layout" id="podminky"><aside class="legal-sidebar"><nav aria-label="Obsah obchodních podmínek"><div class="legal-toc-heading">V TOMTO DOKUMENTU <span>13 článků</span></div>${termsData.articles.map((a, i) => `<a href="#${termIds[i]}" data-term-link="${termIds[i]}"><span>${String(a.number).padStart(2, '0')}</span>${termLabels[i]}</a>`).join('')}</nav><a class="legal-help" href="#odstoupeni">${legalIcon('file')}<span>Potřebujete odstoupit?<small>Vyplnit a stáhnout formulář</small></span>${legalIcon('arrow')}</a></aside>
      <article class="legal-document" aria-label="Znění obchodních podmínek"><div class="legal-document-intro"><span>VŠEOBECNÉ OBCHODNÍ PODMÍNKY</span><p>${esc(c.name)}, IČO ${c.ico}, DIČ ${c.dic}, se sídlem ${esc(c.street)}, ${esc(c.city)}, ${esc(c.registry.charAt(0).toLowerCase() + c.registry.slice(1))}, e-mail <a href="mailto:${c.email}">${c.email}</a> (dále „Společnost“).</p></div>${termsData.articles.map((a, i) => `<section id="${termIds[i]}" class="legal-article"><header><span>${String(a.number).padStart(2, '0')}</span><h2>${esc(a.title)}</h2></header>${a.notice ? `<aside class="legal-update"><strong>${esc(a.notice.title)}</strong><p>${esc(a.notice.text)}</p><div>${a.notice.links.map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${esc(l.label)} ${legalIcon('arrow')}</a>`).join('')}</div></aside>` : ''}${a.number === 6 ? `<div class="legal-template-callout"><div>${legalIcon('file')}<h3>Vzor připravený k vyplnění</h3><p>Údaje doplňte online a stáhněte si hotové oznámení. Můžete použít také prázdný formulář.</p></div><a class="button primary" href="#odstoupeni">Vyplnit formulář ${legalIcon('arrow')}</a><a href="/assets/documents/odstoupeni-vzor.pdf" class="text-link" download>Stáhnout prázdný vzor PDF ${legalIcon('download')}</a></div><details class="legal-template-source"><summary>Zobrazit znění vzorového formuláře</summary><pre>${esc(a.template)}</pre></details>` : `<ol class="legal-clauses">${a.clauses.map((p, n) => `<li><span class="clause-number">${a.number}.${n + 1}</span><div><p>${legalText(p.text)}</p>${p.children.length ? `<ul>${p.children.map((t) => `<li>${legalText(t)}</li>`).join('')}</ul>` : ''}</div></li>`).join('')}</ol>`}</section>`).join('')}</article></div>
      ${withdrawalMarkup()}
      <section class="legal-contact"><div>${legalIcon('mail')}<span><strong>Potřebujete něco upřesnit?</strong><small>Napište nám k podmínkám nebo k vašemu servisu.</small></span></div><a href="mailto:${c.email}">${c.email} ${legalIcon('arrow')}</a></section>
      </div>`;
    updateWithdrawalPreview();
    observeTerms();
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target)
      requestAnimationFrame(() => target.scrollIntoView({ block: 'start', behavior: 'instant' }));
  } catch (e) {
    host.innerHTML = `<div class="container legal-loading"><h1>Obchodní podmínky</h1><p role="alert">${esc(e.message)}</p><button class="button primary" data-retry-terms>Zkusit znovu</button></div>`;
  }
}
function withdrawalMarkup() {
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('-');
  return `<section id="odstoupeni" class="withdrawal-section" aria-labelledby="withdrawal-title"><header class="withdrawal-heading"><div><span class="eyebrow">FORMULÁŘ K ODSTOUPENÍ OD SMLOUVY O DÍLO</span><h2 id="withdrawal-title">Vyplňte údaje.<br>Dokument připravíme za vás.</h2><p>Pro odstoupení od smlouvy na servis elektroniky. Podmínky najdete v <a href="#odstoupeni-podminky">článku 5</a>. Formulář je dostupný i bez přihlášení.</p></div><a class="text-link" href="/assets/documents/odstoupeni-vzor.pdf" download>${legalIcon('download')} Prázdný formulář PDF</a></header>
 <div class="withdrawal-layout"><form id="withdrawal-form" novalidate><div class="withdrawal-form-top"><span>${legalIcon('file')} Údaje pro oznámení</span><small>* Povinné údaje</small></div>
 <fieldset><legend><span>01</span> Vaše údaje</legend><div class="withdrawal-fields"><label class="wide">Jméno a příjmení *<input name="name" autocomplete="name" required maxlength="120" placeholder="Jana Nováková"></label><label class="wide">Ulice a číslo *<input name="street" autocomplete="address-line1" required maxlength="160" placeholder="Ulice a číslo domu"></label><label>PSČ *<input name="zip" autocomplete="postal-code" required maxlength="12" placeholder="110 00"></label><label>Město *<input name="city" autocomplete="address-level2" required maxlength="100" placeholder="Praha"></label><label>E-mail <span class="optional">volitelné</span><input name="email" type="email" autocomplete="email" maxlength="160" placeholder="vas@email.cz"></label><label>Telefon <span class="optional">volitelné</span><input name="phone" type="tel" autocomplete="tel" maxlength="40" placeholder="+420"></label></div></fieldset>
 <fieldset><legend><span>02</span> Zařízení a servis</legend><div class="withdrawal-fields"><label class="wide">Elektronické zařízení *<input name="device" required maxlength="160" placeholder="Např. iPhone 15 Pro, případně sériové číslo"></label><label class="wide">Popis objednaného servisu <span class="optional">volitelné</span><textarea name="service" rows="3" maxlength="800" placeholder="Např. výměna vrchního skla displeje"></textarea></label><label>Číslo objednávky / smlouvy <span class="optional">volitelné</span><input name="orderNumber" maxlength="100" placeholder="Např. SRV-2026-123"></label><label>Datum objednání <span class="optional">volitelné</span><input name="orderDate" type="date"></label><label>Cena servisu v Kč <span class="optional">volitelné</span><input name="price" type="number" min="0" step="0.01" placeholder="0"></label><label>Datum odstoupení *<input name="withdrawalDate" type="date" required value="${today}"></label></div></fieldset>
 <div class="withdrawal-submit"><p id="withdrawal-error" role="alert" tabindex="-1" hidden></p><p class="withdrawal-local">${legalIcon('shield')} Údaje slouží pouze k vytvoření dokumentu v tomto prohlížeči. Formulář se automaticky neodesílá ani neukládá.</p><button type="submit" class="button primary" id="withdrawal-download">${legalIcon('download')} Stáhnout vyplněné PDF</button><button class="button secondary" type="button" data-print-withdrawal>${legalIcon('print')} Vytisknout oznámení</button><span id="withdrawal-status" role="status" aria-live="polite"></span></div></form>
 <aside class="withdrawal-preview-column"><div class="withdrawal-preview-heading"><span><i></i> ŽIVÝ NÁHLED DOKUMENTU</span><small>A4 · PDF</small></div><div id="withdrawal-preview" class="withdrawal-paper" aria-label="Náhled oznámení"></div><div class="withdrawal-next"><strong>Co s hotovým dokumentem?</strong><ol><li>Stáhněte oznámení a zkontrolujte údaje.</li><li>Odešlete jej na <a href="mailto:${termsData.company.email}">${termsData.company.email}</a>, nebo poštou na sídlo společnosti.</li><li>Při odesílání poštou připojte vlastnoruční podpis. Při zaslání e-mailem podle vzoru podpis není potřeba.</li></ol><small>Stažení PDF samo o sobě není odesláním odstoupení společnosti.</small></div></aside></div></section>`;
}
function withdrawalValues() {
  return withdrawalDocument.clean(
    Object.fromEntries(new FormData(document.getElementById('withdrawal-form'))),
  );
}
function updateWithdrawalPreview() {
  const f = withdrawalValues(),
    c = termsData.company,
    shown = (v, label) => (v ? esc(v) : `<span class="paper-placeholder">${label}</span>`);
  document.getElementById('withdrawal-preview').innerHTML =
    `<div class="paper-brand">refurb<span>.</span>zone<small>LCD & OLED REFURBISHING</small></div><h3>Oznámení o odstoupení<br>od smlouvy o dílo</h3><div class="paper-recipient"><small>ADRESÁT</small><strong>${esc(c.name)}</strong><span>${esc(c.street)}, ${esc(c.city)}</span><span>IČO ${c.ico} · ${c.email}</span></div><p>Oznamuji Vám, že tímto odstupuji od smlouvy o dílo, jejímž předmětem byl níže uvedený servis elektronického zařízení.</p><dl><div><dt>Elektronické zařízení</dt><dd>${shown(f.device, 'Specifikace zařízení')}</dd></div><div><dt>Servis a cena</dt><dd>${shown([f.service, f.price !== '' ? withdrawalDocument.amount(f.price) : ''].filter(Boolean).join(' · '), 'Popis servisu a jeho cena')}</dd></div><div class="paper-pair"><div><dt>Číslo objednávky / smlouvy</dt><dd>${shown(f.orderNumber, 'Číslo objednávky')}</dd></div><div><dt>Objednáno dne</dt><dd>${shown(withdrawalDocument.date(f.orderDate), 'Datum objednání')}</dd></div></div><div><dt>Jméno a příjmení</dt><dd>${shown(f.name, 'Vaše jméno')}</dd></div><div><dt>Adresa</dt><dd>${shown([f.street, [f.zip, f.city].filter(Boolean).join(' ')].filter(Boolean).join(', '), 'Ulice, PSČ a město')}</dd></div><div><dt>Kontakt</dt><dd>${shown([f.email, f.phone].filter(Boolean).join(' · '), 'E-mail nebo telefon')}</dd></div></dl><div class="paper-signature"><span>Datum: ${shown(withdrawalDocument.date(f.withdrawalDate), 'Datum')}</span><span>Podpis: ................................</span></div><small class="paper-footnote">Vlastnoruční podpis pouze při odeslání v listinné podobě.</small>`;
}
async function pdfFonts() {
  if (!termsFontPromise)
    termsFontPromise = Promise.all(
      ['/assets/fonts/noto-sans-regular-pdf.ttf', '/assets/fonts/noto-sans-bold-pdf.ttf'].map(
        async (url) => {
          const r = await fetch(url);
          if (!r.ok) throw Error('Nepodařilo se načíst písmo pro PDF.');
          const bytes = new Uint8Array(await r.arrayBuffer());
          let binary = '';
          for (let i = 0; i < bytes.length; i += 8192)
            binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
          return btoa(binary);
        },
      ),
    )
      .then(([regular, bold]) => ({ regular, bold }))
      .catch((e) => {
        termsFontPromise = null;
        throw e;
      });
  return termsFontPromise;
}
function validWithdrawal() {
  const form = document.getElementById('withdrawal-form'),
    result = withdrawalDocument.validate(withdrawalValues()),
    error = document.getElementById('withdrawal-error');
  form.querySelectorAll('[aria-invalid]').forEach((el) => {
    el.removeAttribute('aria-invalid');
    el.removeAttribute('aria-describedby');
  });
  const keys = Object.keys(result.errors);
  error.hidden = !keys.length;
  if (keys.length) {
    error.textContent = Object.values(result.errors).join(' ');
    keys.forEach((k) => {
      form.elements[k].setAttribute('aria-invalid', 'true');
      form.elements[k].setAttribute('aria-describedby', 'withdrawal-error');
    });
    form.elements[keys[0]].focus();
    return null;
  }
  return result.fields;
}
async function downloadWithdrawal() {
  const f = validWithdrawal();
  if (!f) return;
  const button = document.getElementById('withdrawal-download'),
    status = document.getElementById('withdrawal-status');
  button.disabled = true;
  status.textContent = 'Připravujeme vaše PDF…';
  try {
    const fonts = await pdfFonts();
    const pdf = withdrawalDocument.create(window.jspdf.jsPDF, fonts, termsData.company, f);
    pdf.save('odstoupeni-od-smlouvy.pdf');
    status.textContent = 'PDF je připravené ke stažení. Společnosti nebylo nic odesláno.';
  } catch (e) {
    status.textContent = 'PDF se nepodařilo vytvořit. Zkuste to znovu nebo použijte tisk oznámení.';
  } finally {
    button.disabled = false;
  }
}
function printLegal(mode) {
  if (mode === 'withdrawal' && !validWithdrawal()) return;
  document.body.dataset.legalPrint = mode;
  window.print();
}
function observeTerms() {
  termsObserver?.disconnect();
  const links = [...document.querySelectorAll('[data-term-link]')];
  termsObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries)
        if (entry.isIntersecting) {
          links.forEach((a) => {
            const active = a.dataset.termLink === entry.target.id;
            a.classList.toggle('active', active);
            if (active) a.setAttribute('aria-current', 'location');
            else a.removeAttribute('aria-current');
          });
        }
    },
    { rootMargin: '-160px 0px -55% 0px' },
  );
  document.querySelectorAll('.legal-article').forEach((el) => termsObserver.observe(el));
}
document.addEventListener('input', (e) => {
  if (e.target.closest('#withdrawal-form')) {
    updateWithdrawalPreview();
    document.getElementById('withdrawal-status').textContent = '';
    if (e.target.hasAttribute('aria-invalid')) e.target.removeAttribute('aria-invalid');
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.id === 'withdrawal-form') {
    e.preventDefault();
    downloadWithdrawal();
  }
});
document.addEventListener('click', (e) => {
  if (e.target.closest('[data-print-terms]')) printLegal('terms');
  if (e.target.closest('[data-print-withdrawal]')) printLegal('withdrawal');
  if (e.target.closest('[data-retry-terms]')) termsPage();
});
window.addEventListener('beforeprint', () => {
  if (document.body.dataset.legalPrint === 'withdrawal') return;
  document.querySelectorAll('.legal-template-source:not([open])').forEach((el) => {
    el.dataset.openedForPrint = 'true';
    el.open = true;
  });
});
window.addEventListener('afterprint', () => {
  delete document.body.dataset.legalPrint;
  document.querySelectorAll('[data-opened-for-print]').forEach((el) => {
    el.open = false;
    delete el.dataset.openedForPrint;
  });
});
