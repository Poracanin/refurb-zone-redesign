# Grafické podklady

## Vlastní identita návrhu

Wordmark `refurb.zone` používá Inter 800, barvu `#101318`, růžovou tečku `#ec4899` a stejné proporce jako hlavička návrhu. Exporty PNG mají průhledné pozadí. Textové logo zůstává v hlavičce pro ostré zobrazení v každé velikosti. Nový podtitulek je `LCD & OLED REFURBISHING`.

Favicon je původní symbol `r` na zaobleném tmavém poli `#111419` s tečkou `#ec4899`. Vektorový zdroj je `assets/favicon.svg`, PNG velikosti jsou v `assets/brand/`.

Inter je přibalený v latinské a rozšířené latinské sadě pro češtinu. Licence SIL Open Font License je v `assets/fonts/OFL.txt`.

## Animace loga

Sdílená komponenta je v `src/js/brand-logo.js` a `src/css/brand-logo.css`. Používá Web Animations API bez další knihovny. Logo v hlavičce je statické, včetně překreslení po přihlášení nebo změně košíku.

Vstupní animaci přes celou obrazovku spouští `src/js/site-intro.js` jednou za relaci karty (`sessionStorage`, klíč `refurb-site-intro-v1`). Název se dokončí za 2 300 ms, posledních 700 ms přechází pozadí na `#111419` a logo na světlou variantu. Poté překryv během 280 ms odkryje web. Kliknutí, Esc, Enter, mezerník nebo Tab vstup přeskočí. Omezený pohyb animaci vynechá či ihned ukončí. Po dobu úvodu není obsah pod ním interaktivní; při selhání dokončení se web nejpozději za 5,5 sekundy odblokuje.

Samostatný náhled `/assets/brand/animation.html` zobrazuje pouze animaci přes celou plochu stránky, bez dalších textů a tlačítek. Opakované přehrání spustí kliknutí, mezerník nebo Enter. Volba `play(logo, { negativeCanvas })` přidává závěrečný přechod do negativu a vrací příslib dokončení. V náhledu negativ zůstane zobrazený. Negativní PNG je `assets/brand/logo-negative.png`, zdroj podporuje `?variant=negative`. `logo-source.html` používá tutéž komponentu ve statickém stavu pro export průhledných PNG.

## Fotografie a loga třetích stran

- Produktové fotografie a fotografie zařízení byly převzaté z původního Refurb.zone pro tento redesign.
- Soubory `sources.json` v adresářích assetů uchovávají dostupné zdroje a přiřazení. Metadata nejsou automatickým potvrzením neomezené licence k dalšímu použití.
- Loga Apple, Samsung a dalších značek zůstávají známkami příslušných vlastníků.
- Symbol Android pochází od Google a používá se s uvedením původu podle CC BY 3.0; atribuce je také v patičce webu.
- `service-workshop-hero.png` a `display-buyback-editorial.png` jsou vytvořené ilustrační fotografie, ne dokumentace skutečné provozovny. Jejich doprovodné JSON soubory uchovávají původ.

V repozitáři nejsou přihlašovací tokeny ani cookies původního e-shopu. Dodané demo přihlašovací údaje nejsou skutečným účtem.
