# Přechod z JSON na databázi

Databáze zatím není vytvořená. Současná datová vrstva je `src/js/data-repository.js`; pro připojení databáze ji nahradí volání serverového API. Prohlížeč nesmí obsahovat přístupové údaje k databázi.

## Navržené entity

| Entita                                           | Dnešní zdroj                                 |
| ------------------------------------------------ | -------------------------------------------- |
| products                                         | `products.json` bez vnořených variant        |
| product_variants                                 | `products[].variants[]`, vazba na product_id |
| product_images                                   | Obrázky produktu a pořadí                    |
| categories / product_categories                  | `groups.json` a vazby na produkty            |
| brands / product_brands                          | `brands.json`                                |
| devices / product_compatibility                  | `devices.json` a konkrétní product_ids       |
| services / service_price_groups / service_prices | `services.json`, oddělené typy cen           |
| shipping_methods                                 | `delivery.json`                              |

U peněz ukládejte celá čísla v haléřích nebo přesný desetinný typ. Zachovejte původní ID či jejich mapování, aby fungovaly stávající odkazy na produkty. U cen evidujte měnu, daňový režim, datum a původ. Chybějící cena zůstává `null`.

## Doporučený postup implementace

1. Založit backend, databázi a import JSON při zachování vazeb a ID.
2. Implementovat API pro produkty, varianty, kompatibilitu, služby a dopravu. Nejdříve může vracet stejný datový kontrakt jako `dataRepository.load()`.
3. Přesunout přihlášení na server a ověřovat přístup ke klientským cenám v API. Demo přihlášení odstranit; veřejné JSON s chráněnými cenami přestat publikovat.
4. Doplnit skutečné objednávky, rezervaci dostupnosti, výpočet cen a validaci košíku na serveru, pokud budou součástí další etapy.
5. Podle velikosti katalogu přejít z načtení celého vzorku na stránkování a vyhledávání přes API. Současný vzorek obsahuje pouze 50 produktů.

Tento dokument popisuje navazující práci; žádné účty, objednávky, platby ani databázové tabulky nyní neběží.
