'use strict';
(function (root) {
  const limits = {
    name: 120,
    street: 160,
    city: 100,
    zip: 12,
    email: 160,
    phone: 40,
    device: 160,
    service: 800,
    orderNumber: 100,
    orderDate: 10,
    withdrawalDate: 10,
    price: 30,
  };
  function clean(input = {}) {
    return Object.fromEntries(
      Object.entries(limits).map(([key, max]) => [
        key,
        String(input[key] ?? '')
          .normalize('NFC')
          .replace(/[\u0000-\u001f\u007f]/g, ' ')
          .trim()
          .slice(0, max),
      ]),
    );
  }
  function date(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const [y, m, d] = value.split('-');
    return `${Number(d)}. ${Number(m)}. ${y}`;
  }
  function amount(value) {
    if (value === '') return '';
    const n = Number(value.replace(',', '.'));
    return Number.isFinite(n) && n >= 0
      ? new Intl.NumberFormat('cs-CZ', {
          style: 'currency',
          currency: 'CZK',
          minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
          maximumFractionDigits: 2,
        }).format(n)
      : value;
  }
  function validate(input) {
    const f = clean(input),
      errors = {};
    for (const [key, label] of [
      ['name', 'jméno a příjmení'],
      ['street', 'ulici a číslo'],
      ['city', 'město'],
      ['zip', 'PSČ'],
      ['device', 'zařízení'],
      ['withdrawalDate', 'datum odstoupení'],
    ])
      if (!f[key]) errors[key] = `Doplňte ${label}.`;
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email))
      errors.email = 'Zadejte platný e-mail.';
    if (
      f.price !== '' &&
      (!Number.isFinite(Number(f.price.replace(',', '.'))) || Number(f.price.replace(',', '.')) < 0)
    )
      errors.price = 'Cena nesmí být záporná.';
    for (const key of ['orderDate', 'withdrawalDate'])
      if (
        f[key] &&
        (!/^\d{4}-\d{2}-\d{2}$/.test(f[key]) ||
          !Number.isFinite(Date.parse(f[key] + 'T12:00:00Z')) ||
          new Date(f[key] + 'T12:00:00Z').toISOString().slice(0, 10) !== f[key])
      )
        errors[key] = 'Zadejte platné datum.';
    return { fields: f, errors };
  }
  function create(jsPDF, fonts, company, input = {}) {
    const f = clean(input),
      doc = new jsPDF({ format: 'a4', unit: 'mm', compress: true, putOnlyUsedFonts: true });
    doc.addFileToVFS('NotoSans-Regular.ttf', fonts.regular);
    doc.addFont('NotoSans-Regular.ttf', 'NotoSans', 'normal');
    doc.addFileToVFS('NotoSans-Bold.ttf', fonts.bold);
    doc.addFont('NotoSans-Bold.ttf', 'NotoSans', 'bold');
    doc.setProperties({
      title: 'Oznámení o odstoupení od smlouvy o dílo',
      subject: 'Formulář odstoupení od smlouvy - Refurb.zone',
      author: company.name,
      creator: 'Refurb.zone',
    });
    let y = 0;
    const left = 22,
      width = 166,
      bottom = 266;
    function page() {
      if (doc.getNumberOfPages() > 1 || y) doc.addPage();
      doc.setFont('NotoSans', 'bold');
      doc.setFontSize(13);
      doc.setTextColor(16, 21, 28);
      doc.text('refurb.zone', left, 19);
      doc.setFont('NotoSans', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(104, 114, 131);
      doc.text('LCD & OLED REFURBISHING', 188, 19, { align: 'right' });
      doc.setDrawColor(229, 234, 241);
      doc.line(left, 25, 188, 25);
      y = 38;
    }
    function ensure(height) {
      if (y + height > bottom) page();
    }
    function write(text, size = 10.5, bold = false, color = [35, 45, 59]) {
      doc.setFont('NotoSans', bold ? 'bold' : 'normal');
      doc.setFontSize(size);
      doc.setTextColor(...color);
      const lines = doc.splitTextToSize(String(text), width);
      for (const line of lines) {
        ensure(6);
        doc.setFont('NotoSans', bold ? 'bold' : 'normal');
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.text(line, left, y);
        y += size > 16 ? 9 : 5.5;
      }
      return lines.length;
    }
    function field(label, value) {
      ensure(18);
      write(label.toUpperCase(), 8, true, [110, 123, 143]);
      y += 1;
      write(
        value ||
          '....................................................................................................',
      );
      y += 2;
    }
    page();
    write('Oznámení o odstoupení\nod smlouvy o dílo', 20, true);
    y += 5;
    write('Adresát', 8, true, [110, 123, 143]);
    y += 1;
    write(company.name, 11, true);
    write(`${company.street}, ${company.city}`);
    write(`IČO: ${company.ico}  |  E-mail: ${company.email}`);
    y += 7;
    write(
      'Oznamuji Vám, že tímto odstupuji od smlouvy o dílo, jejímž předmětem byl níže uvedený servis elektronického zařízení.',
    );
    y += 7;
    field('Elektronické zařízení', f.device);
    field(
      'Specifikace servisu a jeho cena',
      [f.service, f.price !== '' ? 'Cena servisu: ' + amount(f.price) : '']
        .filter(Boolean)
        .join('\n'),
    );
    field('Číslo objednávky / smlouvy', f.orderNumber);
    field('Objednáno dne', date(f.orderDate));
    field('Jméno a příjmení', f.name);
    field(
      'Adresa zákazníka',
      [f.street, [f.zip, f.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
    );
    field('Kontakt', [f.email, f.phone].filter(Boolean).join(' | '));
    ensure(38);
    doc.setFont('NotoSans', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(35, 45, 59);
    doc.text(
      'Datum: ' + (date(f.withdrawalDate) || '....................................'),
      left,
      y,
    );
    y += 17;
    doc.text('Podpis: ........................................................', left, y);
    y += 9;
    write(
      'Vlastnoruční podpis se doplňuje pouze při odeslání v listinné podobě.',
      8,
      false,
      [104, 114, 131],
    );
    const count = doc.getNumberOfPages();
    for (let p = 1; p <= count; p++) {
      doc.setPage(p);
      doc.setDrawColor(229, 234, 241);
      doc.line(left, 279, 188, 279);
      doc.setFont('NotoSans', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(104, 114, 131);
      doc.text(company.email, left, 286);
      doc.text(`${p} / ${count}`, 188, 286, { align: 'right' });
    }
    return doc;
  }
  const api = { clean, date, amount, validate, create };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.withdrawalDocument = api;
})(globalThis);
