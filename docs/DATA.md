# JSON data

`dataRepository.load()` načítá sedm souborů a vrací objekt `{ updated_at, products, groups, brands, devices, services, delivery }`. Rozhraní nadále dostává stejný tvar dat jako původní prototyp.

| Soubor          | Důležitá pole / vazby                                                                          |
| --------------- | ---------------------------------------------------------------------------------------------- |
| `products.json` | `id`, `name`, `source`, `group`, `kind`, `price`, `gross`, `images`, `description`, `variants` |
| `groups.json`   | `id`, `name`, `source_url`, `product_ids`                                                      |
| `brands.json`   | `id`, název, logo a `product_ids`                                                              |
| `devices.json`  | `id`, `name`, `family`, `platform`, `aliases`, `image`, `product_ids`                          |
| `services.json` | Služba `id`, `title`, `summary`, `source`, `checked_at`, skupiny ceníku                        |
| `delivery.json` | Převzaté dopravní podmínky                                                                     |
| `meta.json`     | `updated_at`: datum vzorku produktového katalogu                                               |

ID produktů a variant jsou řetězce. Cena produktu `price` je v Kč bez DPH, `gross` včetně DPH. Jednotlivé varianty mohou mít různé ceny, SKU, obrázky i dostupnost. Nepočítejte ceny variant z nejnižší ceny celé produktové karty.

`devices[].product_ids` vyjadřuje skutečně zadanou kompatibilitu. Shoda části názvu produktu není dostatečná pro přiřazení zařízení. Pole `image_is_family` u některých zařízení říká, že jde o fotografii řady.

## Služby

Repasování a výměna zadních skel mají `groups[].rows[]` s modelem, druhem opravy, cenou bez DPH a fotografií. U společné cenové položky je `image_model` jeden konkrétní model z této skupiny. Celé zařízení může mít `surcharge` podle původního ceníku.

Výkup používá `buyback_groups[].rows[]`:

- `model`: společný název položky z původního ceníku.
- `models`: rozepsané modely pro přesné vyhledávání, bez změny cenové skupiny.
- `price`: viditelná korunová výkupní cena.
- `damaged_touch_price`: cena za poškozený dotyk u iPhonu; `null` znamená, že cenu zdroj neuvádí. Není to nula.

Výkupní ceník má 33 položek a jeho cenu definitivně potvrzuje servis po testování. Původní web měl odlišné částky v HTML a v datech pro přepínač EUR; převzaté jsou viditelné výchozí hodnoty v Kč. Režim DPH se u výkupu nepředpokládá, protože ho zdroj výslovně neurčuje.

## Kontrola po editaci

`npm run check` ověřuje unikátní ID, vazby kategorií, značek a zařízení na existující produkty, místní assety, soubory stránek a syntaxi JavaScriptu. Neověřuje aktuálnost cen ani dostupnost v původním obchodě.
