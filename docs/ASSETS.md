# Grafické podklady

## Vlastní identita návrhu

Wordmark `refurb.zone` používá Inter 800, barvu `#101318`, modrou tečku `#517db7` a stejné proporce jako hlavička návrhu. Exporty PNG mají průhledné pozadí. Textové logo zůstává v hlavičce pro ostré zobrazení v každé velikosti. Nový podtitulek je `LCD & OLED REFURBISHING`.

Favicon je původní symbol `r` na zaobleném tmavém poli `#111419` s tečkou `#7da9ff`. Vektorový zdroj je `assets/favicon.svg`, PNG velikosti jsou v `assets/brand/`.

Inter je přibalený v latinské a rozšířené latinské sadě pro češtinu. Licence SIL Open Font License je v `assets/fonts/OFL.txt`.

## Animace loga

Sdílená komponenta je v `src/js/brand-logo.js` a `src/css/brand-logo.css`. Používá Web Animations API bez další knihovny. Animace trvá 2 700 ms. Ikona `r` zůstává viditelná i po dokončení; vedle ní se jedním pohybem odkryje celé `refurb.zone` a podtitulek. Hlavička si rezervuje konečný rozměr, aby se při přehrávání neposouvalo okolní rozhraní.

V hlavičce proběhne jednou za relaci karty (`sessionStorage`, klíč `refurb-brand-intro-v2`); při omezení pohybu se nepřehrává. Samostatný náhled `/assets/brand/animation.html` zobrazuje pouze animaci přes celou plochu stránky, bez dalších textů a tlačítek. Opakované přehrání spustí kliknutí, mezerník nebo Enter. Volba `play(logo, { negativeCanvas })` přidává závěrečný přechod do negativu: název se dokončí za 2 300 ms, posledních 700 ms se pozadí změní na `#111419` a logo na světlou variantu. Celkem 3 sekundy; negativ pak zůstane zobrazený. Hlavička tuto volbu nepoužívá. Negativní PNG je `assets/brand/logo-negative.png`, zdroj podporuje `?variant=negative`. `logo-source.html` používá tutéž komponentu ve statickém stavu pro export průhledných PNG.

## Fotografie a loga třetích stran

- Produktové fotografie a fotografie zařízení byly převzaté z původního Refurb.zone pro tento redesign.
- Soubory `sources.json` v adresářích assetů uchovávají dostupné zdroje a přiřazení. Metadata nejsou automatickým potvrzením neomezené licence k dalšímu použití.
- Loga Apple, Samsung a dalších značek zůstávají známkami příslušných vlastníků.
- Symbol Android pochází od Google a používá se s uvedením původu podle CC BY 3.0; atribuce je také v patičce webu.
- `service-workshop-hero.png` a `display-buyback-editorial.png` jsou vytvořené ilustrační fotografie, ne dokumentace skutečné provozovny. Jejich doprovodné JSON soubory uchovávají původ.

V repozitáři nejsou přihlašovací tokeny ani cookies původního e-shopu. Dodané demo přihlašovací údaje nejsou skutečným účtem.
