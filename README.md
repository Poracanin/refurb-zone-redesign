# Refurb.zone — redesign

Kompletní návrh e-shopu s díly pro Apple a stránkami servisních služeb. HTML, CSS a JavaScript, bez frontendového frameworku. Data jsou zatím v JSON; databáze ani skutečný objednávkový backend nejsou připojené.

## Spuštění

Vyžaduje Node.js 20 nebo novější.

```sh
npm ci
npm run dev
```

Otevřete **http://127.0.0.1:4173/**. Jiný port: `npm run dev -- --port 4175`. Stránky spouštějte přes tento server, protože načítají JSON pomocí `fetch`; otevření přes `file://` nestačí.

## Stránky

| Soubor / adresa                  | Obsah                                                              |
| -------------------------------- | ------------------------------------------------------------------ |
| `index.html`                     | Úvodní stránka, vyhledávání zařízení, výběr dílů, služby a doprava |
| `katalog.html`                   | Produkty, kategorie, značky, řazení a filtry                       |
| `produkt.html?id=3051`           | Detail produktu, varianty, fotografie a ukázkový košík             |
| `sluzby.html?service=repase`     | Repasování displejů: fotografie modelů a ceník                     |
| `sluzby.html?service=vykup`      | Výkup displejů: modely, stav dotyku, filtrování cen a postup       |
| `sluzby.html?service=zadni-skla` | Výměna zadních skel a ceník                                        |
| `doprava.html`                   | Wolt Drive, PPL, Balíkovna a podmínky doručení                     |

Hlavička se při rolování zmenšuje a zůstává připnutá. Vyhledávání modelů funguje v modálním okně, včetně Apple/Android a fotografií zařízení. Součástí je 50 vzorových produktů se 130 variantami, ne celý katalog původního obchodu.

## Struktura

```text
.
├── index.html, katalog.html, produkt.html, sluzby.html, doprava.html
├── src/
│   ├── css/
│   │   ├── styles.css              # Společný vzhled, responzivita, komponenty
│   │   ├── brand-logo.css          # Vzhled a proporce animovaného loga
│   │   └── buyback.css             # Výkup displejů
│   └── js/
│       ├── data-repository.js      # Jediné místo pro načítání dat
│       ├── brand-logo.js           # Animace identity r → refurb.zone (2,7 s)
│       ├── app.js                  # Katalog, produkt, košík a demo přihlášení
│       ├── experience.js           # Hlavička, navigace, služby a doprava
│       ├── device-search.js        # Výběr zařízení a hledání kompatibilních dílů
│       └── buyback.js              # Ceník a filtry výkupu
├── data/
│   ├── products.json              # Produkty a jejich varianty
│   ├── groups.json                # Kategorie a vazby na produkty
│   ├── brands.json                # Značky a vazby na produkty
│   ├── devices.json               # Modely zařízení a kompatibilita
│   ├── services.json              # Služby a jejich ceníky
│   ├── delivery.json              # Doprava
│   └── meta.json                  # Datum katalogového vzorku
├── assets/
│   ├── brand/                     # Nové logo a PNG favicony
│   ├── fonts/                     # Lokální Inter a licence OFL
│   ├── products/, devices/, categories/, service-models/
│   └── brands/, delivery/         # Loga značek a dopravců
├── docs/                          # Data, budoucí DB a původ obrázků
├── scripts/                       # Lokální server, kontrola a statický build
└── .github/workflows/ci.yml        # Automatická kontrola a build
```

## Logo a favicon v PNG

V `assets/brand/`:

- `logo.png` — současný wordmark **refurb.zone** s průhledným pozadím.
- `logo-with-tagline.png` — stejný wordmark s textem „LCD & OLED REFURBISHING“
- `favicon.png` — favicon ve velikosti 512 × 512 px, průhledné rohy.
- `favicon-32.png`, `favicon-64.png`, `favicon-192.png` — menší velikosti.
- `apple-touch-icon.png` — 180 × 180 px.
- `logo-negative.png` — světlá varianta s ikonou a podtitulkem pro tmavé pozadí.
- `logo-source.html` — typografický zdroj pro další exporty.
- `animation.html` — samotná animace přes celou stránku; kliknutí, mezerník nebo Enter ji přehraje znovu.

Původní vektorový favicon je v `assets/favicon.svg`. PNG jsou exporty současného návrhu; samotná hlavička ponechává ostré textové logo. Písmo Inter je uložené lokálně včetně licence.

Animace v hlavičce trvá 2,7 sekundy: symbol faviconu zůstává vlevo a vedle něj se plynule odkryje celý název s podtitulkem. Spustí se jednou v dané kartě prohlížeče; navigace ani přihlášení ji neopakují. Při nastavení omezeného pohybu se zobrazí rovnou celé logo. Náhled otevřete na `/assets/brand/animation.html`; trvá 3 sekundy a zakončuje jej přechod na černé pozadí se světlým logem. Hlavička používá původní světlou variantu.

## Demo přihlášení

- E-mail: `servis@example.com`
- Heslo: `Demo2026!`

Bez přihlášení rozhraní skrývá ceny. Demo přihlášení a košík používají `sessionStorage`, oblíbené produkty `localStorage`. Nevytváří se skutečný účet ani objednávka. Nepoužívejte skutečné přihlašovací údaje.

**JSON obsahuje ceny a je dostupný prohlížeči.** Toto je ukázka chování, nikoli zabezpečený B2B ceník. Pro produkci musí autentizaci a autorizaci cen řešit server. Soukromý GitHub repozitář sám o sobě není přihlášení do e-shopu.

## Úpravy dat a pozdější databáze

Data upravujte v `data/*.json`, nikoli ve skriptech rozhraní. Po změně spusťte `npm run check`. Identifikátory produktů a variant ponechávejte jako řetězce; používají se v odkazech a vazbách.

`src/js/data-repository.js` sestavuje stávající datový kontrakt. Při přechodu na databázi bude hlavním bodem výměny jeho metoda `load()`, která místo JSON začne volat backendové API. Přístup k cenám pak musí API ověřovat podle uživatele. Podrobnosti jsou v [docs/DATA.md](docs/DATA.md) a [docs/DATABASE.md](docs/DATABASE.md).

## Kontrola a build

```sh
npm run check
npm run build
npm run preview
```

Výstup `dist/` je připravený pro statický hosting. Build nepublikuje web. Při umístění do podadresáře, například pro případné GitHub Pages:

```sh
npm run build -- --base=/refurb-zone-redesign/
```

Tato volba přepíše interní odkazy a cesty k datům. Build s prefixem `/refurb-zone-redesign/` musí hosting skutečně vystavit pod tímto prefixem; lokální `preview` je určené pro výchozí build s `/`.

`npm run format` formátuje zdroje pomocí Prettier. V GitHub Actions běží kontrola JSON vazeb, souborů, syntaxe a build. Žádné automatické zveřejnění webu není zapnuté.

## Původ podkladů

Projekt navazuje na schválený návrh ze září 2026. Produkty a ceníky jsou snapshot z původního Refurb.zone; nejde o živou synchronizaci. U jednotlivých služeb jsou uvedené datum kontroly a původní URL. Fotografie modelů a produktů pocházejí z původního obchodu, servisní hero fotografie jsou ilustrační. Viz [docs/ASSETS.md](docs/ASSETS.md).
