# Obchodní podmínky a odstoupení

`obchodni-podminky.html` je veřejná stránka dostupná ze společného zápatí. Obsahuje 13 článků, obsah s odkazy, tisk podmínek a formulář pro odstoupení od **smlouvy o dílo na servis elektroniky**. Formulář nevyžaduje přihlášení a nepředpokládá právo na vrácení náhradních dílů nakoupených podnikatelem.

## Zdroj obsahu

`data/terms.json` obsahuje plné znění dodané provozovatelem. Odstavce a pododstavce jsou zachované; číslování odstavců slouží orientaci. `source_sha256` identifikuje původní text, `prepared_at` je datum přípravy dat, nikoli datum právní účinnosti.

Na výslovný pokyn provozovatele byly sjednoceny PPL zdarma od 3 000 Kč bez DPH, Wolt zdarma od 7 500 Kč bez DPH a kontakt `info@refurb.zone`. Opravený překlep `refur.zone` v odkazu na zásady ochrany údajů nyní vede na `refurb.zone`.

Článek 12 zachovává dodané znění a před ním zobrazuje samostatnou aktuální poznámku: evropská platforma ODR ukončila provoz 20. 7. 2025 a aktuální adresa oddělení ADR ČOI je Gorazdova 1969/24, 120 00 Praha 2. Zdroje jsou přímo v poznámce: [Evropská komise](https://consumer-redress.ec.europa.eu/site-relocation_en) a [ČOI](https://coi.gov.cz/informace-o-adr/). Implementace není úplnou právní revizí dodaných podmínek.

## Generování dokumentu

- `src/js/terms.js`: zobrazení podmínek, formulář, validace, živý náhled a spuštění tisku/stažení.
- `src/js/withdrawal-document.js`: sdílené čištění vstupů, datumy, částky, validace a sazba PDF.
- `src/css/terms.css`: responzivní stránka a oddělený tisk podmínek/oznámení.
- `assets/documents/odstoupeni-vzor.pdf`: prázdný vzor pro přímé stažení.

Vyplněné PDF vzniká lokálně v prohlížeči. Údaje se neposílají na server, nepřidávají do URL a neukládají do místního úložiště. Odeslání oznámení e-mailem nebo poštou musí provést zákazník. Odkaz na e-mail otevírá poštovní aplikaci bez přiložených osobních údajů. Tisk celých podmínek nevytiskne rozpracovaný osobní formulář.

Kontrola vstupů nevyhodnocuje nárok na odstoupení ani 14denní lhůtu. Navazuje na konkrétní vzor v článku 6 a odkazuje na podmínky v článku 5. Běžné vyplnění vytvoří jednu stránku A4, delší popisy mohou pokračovat na další stránce. Texty se vkládají jako text; nepoužívá se převod uživatelského HTML.

## PDF závislosti a aktualizace

Lokální `assets/vendor/jspdf.umd.min.js` odpovídá připnuté npm verzi **jsPDF 4.2.1**. Licence MIT je přiložená. Statické fonty Noto Sans Regular/Bold z balíčku LibreOffice jsou v `assets/fonts/`, včetně licence SIL OFL; v PDF se vkládají jen použité glyfy. Fonty se stáhnou ze stejného webu až při vytváření PDF, nejsou potřeba služby třetích stran.

Po úpravě firemních údajů, sazby PDF nebo písma obnovte prázdný vzor:

```sh
npm ci
node scripts/generate-withdrawal.mjs
npm run check
npm run build -- --base=/refurb-zone-redesign/
npm run check:build -- --base=/refurb-zone-redesign/
```

Při aktualizaci jsPDF aktualizujte npm lockfile a kopie `dist/jspdf.umd.min.js` a `LICENSE` z nainstalovaného balíčku. Ověřte vyplněné i prázdné PDF, diakritiku, dlouhý popis, opakované generování a tisk. PDF musí zůstat dostupné i na hostingu s prefixem repozitáře.
