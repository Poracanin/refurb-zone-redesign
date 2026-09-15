# Servisní poptávky a administrace

Stránka `administrace.html` je interaktivní demo servisního provozu. Je dostupná z hlavičky obchodu přes **Administrace**. Provozní data jsou fiktivní; názvy a fotografie produktů pocházejí ze stávajícího katalogového vzorku.

## Přihlášení

| Vstup            | E-mail               | Heslo        |
| ---------------- | -------------------- | ------------ |
| Klient v obchodě | `servis@example.com` | `Demo2026!`  |
| Administrace     | `admin@example.com`  | `Admin2026!` |

Oba formuláře mají tlačítko pro vyplnění demo údajů. Klientské přihlášení neotevře administraci. Nejde o serverovou autentizaci: veřejný statický web obsahuje JSON i demo hesla, proto není určen pro skutečné osobní údaje nebo neveřejné ceny.

## Jak vyzkoušet celý průchod

1. Na stránce repasování, výkupu nebo výměny zadního skla vyberte model. Přihlášení pokračuje rovnou k vybrané poptávce.
2. Vyplňte konkrétní model, počet kusů, závadu, kontakt a dopravu. U repase se cena přepočítá podle počtu kusů a příplatku za celé zařízení, u výkupu podle stavu dotyku. Chybějící cena zůstává „Na posouzení“.
3. Odešlete demo poptávku. Dostane číslo `POP-…` a zobrazí se v klientském účtu v **Moje poptávky a opravy**.
4. Ve stejném prohlížeči otevřete administraci. V **Servisních zakázkách** nebo **Výkupu displejů** najdete stejný záznam. Přiřaďte technika, termín, cenu, kontrolní seznam a interní poznámku.
5. Přesuňte zakázku do stavu **K odeslání** a zvolte **Připravit zásilku**. V expedici označte balík jako zabalený, předaný přepravci a nakonec doručený. Dokončení se projeví také v klientském přehledu.
6. U objednávky dílů nastavte uhrazení a stav **K expedici**. Po vytvoření, zabalení a demo odeslání balíku se odečtou kusy ze skladu. Opakované odeslání stejného balíku neodečte zásoby znovu.

**Žádný krok neposílá skutečný e-mail, nezakládá objednávku v Shoptetu, nerezervuje přepravu ani neprovádí platbu.** Interní tisková průvodka je označená jako demo a není přepravním štítkem.

## Co obsahuje administrace

- Přehled rozpracovaných oprav, čekajících plateb, zásilek, nízkých zásob a naléhavých zakázek.
- Servis a výkup: nástěnka nebo seznam, hledání, filtry stavů, detail zařízení, nabídka, technik, termín, kontrolní seznam, poznámky a historie.
- Objednávky: položky, kontakt, platba, stav, hromadné akce a příprava zásilek.
- Expedice: stav balíku, dopravce, hmotnost, poznámka, hromadné zabalení/odeslání/doručení a tisk interní průvodky.
- Sklad: fotografie, SKU, pozice, fyzický stav, rezervace, dostupné kusy, minimum, příjem/výdej a historie pohybů.
- Zákazníci: kontaktní karty a související zakázky a objednávky.
- Nastavení: provozovna, odesílatel, výchozí dopravce, seznam demo týmu, CSV/JSON export a potvrzené obnovení výchozích dat.

Vzorová data obsahují 24 objednávek, 21 servisních/výkupních případů, 8 zákazníků a 50 skladových karet. Při prvním načtení se termíny vzorku posunou na aktuální datum. Přehledy počítají skutečné hodnoty z aktuálního lokálního stavu.

## Datová vrstva

| Soubor                       | Úloha                                                            |
| ---------------------------- | ---------------------------------------------------------------- |
| `data/services.json`         | Původní ceníky a fotografie modelů; změna rozhraní nemění částky |
| `data/operations-demo.json`  | Výchozí provozní vzorek                                          |
| `src/js/operations-core.js`  | Pravidla a atomické změny zakázek, objednávek, zásilek a skladu  |
| `src/js/operations-store.js` | Načtení JSON, demo přístup a lokální ukládání                    |
| `src/js/service-shop.js`     | Dlaždice služeb, klientský formulář a přehled poptávek           |
| `src/js/admin.js`            | Rozhraní administrace                                            |

Změny se ukládají do `localStorage` pod klíčem `refurb-zone-operations-demo-v1`. Přetrvají obnovení stránky a sdílejí se mezi kartami na stejném původu webu. Data z localhostu, GitHub Pages a jiného prohlížeče jsou oddělená. Změny nepřepisují JSON v repozitáři. Export je možné stáhnout v nastavení; reset vyžaduje potvrzení a obnoví pouze toto demo.

Přihlášení je uložené v `sessionStorage`: klient `refurb-demo-client`, správce `refurb-admin-session`. Demo není určené pro souběžné zapisování více pracovníků. Produkce potřebuje serverovou databázi, autorizaci každé operace a databázové transakce pro rezervace a odpisy zásob.

## Ověření

`npm run check` spouští testy provozních pravidel: vazby demo dat, rezervace, validace poptávky, neznámá cena, zrušení objednávky, vytvoření zásilky, podmínky expedice, odpis zásob právě jednou, příjem/výdej, atomické hromadné změny a servisní nabídky. Oba buildy (`/` a `/refurb-zone-redesign/`) kontrolují také odkazy a assety administrace.

## Inspirace a další etapa

Členění objednávek, expedice a skladu vychází z veřejně popsaných postupů [zpracování objednávky v Shoptetu](https://podpora.shoptet.cz/zpracovani-objednavky/), [stavů objednávek](https://podpora.shoptet.cz/stavy-objednavky/) a [skladových nároků](https://podpora.shoptet.cz/skladove-naroky/). Rozhraní je vlastní návrh Refurb.zone, bez napojení na účet Shoptet.

Navazující implementace: databázové entity a API, skutečné klientské/správcovské účty a oprávnění, notifikace, schvalování nabídek, případně Shoptet a dopravci. Viz [DATABASE.md](DATABASE.md).
