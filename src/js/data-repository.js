'use strict';

/**
 * Jediné místo, které načítá katalog. UI pracuje s existujícím datovým kontraktem.
 * Budoucí API může vrátit stejný objekt a nahradit obsah metody load().
 * Soubory JSON jsou veřejná data prototypu, nikoliv zabezpečený B2B ceník.
 */
const dataRepository = {
  async load() {
    const sources = {
      meta: '/data/meta.json',
      products: '/data/products.json',
      groups: '/data/groups.json',
      brands: '/data/brands.json',
      devices: '/data/devices.json',
      services: '/data/services.json?v=service-workspace-1',
      delivery: '/data/delivery.json?v=shipping-1745',
    };
    const entries = await Promise.all(
      Object.entries(sources).map(async ([key, url]) => {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Nepodařilo se načíst ${url}: ${response.status}`);
        return [key, await response.json()];
      }),
    );
    const { meta, ...catalog } = Object.fromEntries(entries);
    if (!Array.isArray(catalog.products) || !Array.isArray(catalog.services)) {
      throw new Error('Katalog nemá očekávaný datový formát.');
    }
    return { ...meta, ...catalog };
  },
};
