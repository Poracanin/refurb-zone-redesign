'use strict';
window.opsStore = (() => {
  const key = 'refurb-zone-operations-demo-v1';
  let seed,
    products = [],
    promise;
  const clone = (v) => JSON.parse(JSON.stringify(v));
  function read() {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : clone(seed);
  }
  function initialState() {
    const state = clone(seed),
      today = new Date(),
      anchor = new Date(state.anchor_date + 'T00:00:00Z');
    const shift =
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - anchor.getTime();
    const shiftDates = (value) => {
      if (Array.isArray(value)) return value.map(shiftDates);
      if (value && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shiftDates(v)]));
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))
        return new Date(new Date(value).getTime() + shift).toISOString();
      return value;
    };
    return shiftDates(state);
  }
  function announce() {
    window.dispatchEvent(new CustomEvent('refurb:operationschange'));
  }
  async function load() {
    if (!promise)
      promise = (async () => {
        const responses = await Promise.all(
          ['/data/operations-demo.json?v=service-workspace-1', '/data/products.json'].map((url) =>
            fetch(url).then((r) => {
              if (!r.ok) throw Error('Ukázková data se nepodařilo načíst.');
              return r.json();
            }),
          ),
        );
        [seed, products] = responses;
        if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify(initialState()));
        const state = read();
        if (state.version !== 1 || !Array.isArray(state.repairs))
          throw Error('Uložená data mají neplatný formát.');
        return state;
      })().catch((e) => {
        promise = null;
        throw e;
      });
    await promise;
    return read();
  }
  function dispatch(action) {
    const client = action.type === 'request.create';
    if (sessionStorage.getItem(client ? 'refurb-demo-client' : 'refurb-admin-session') !== 'active')
      throw Error('Nejprve se přihlaste.');
    const updated = operationsCore.reduce(read(), {
      ...action,
      at: new Date().toISOString(),
      actor: client ? 'Klient' : 'Administrátor (demo)',
    });
    // Do not report success if browser storage is unavailable or full.
    localStorage.setItem(key, JSON.stringify(updated));
    announce();
    return updated;
  }
  function reset() {
    if (sessionStorage.getItem('refurb-admin-session') !== 'active')
      throw Error('Nejprve se přihlaste.');
    localStorage.setItem(key, JSON.stringify(initialState()));
    announce();
  }
  window.addEventListener('storage', (e) => {
    if (e.key === key) announce();
  });
  return {
    load,
    read,
    dispatch,
    reset,
    get products() {
      return products;
    },
  };
})();
