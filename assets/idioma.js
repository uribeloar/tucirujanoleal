/* Diccionario por página; textos, estados y atributos conservan su original al cambiar idioma. */
(() => {
  'use strict';
  const script = document.currentScript;
  const base = (script?.dataset.base || '/tucirujanoleal/').replace(/\/$/, '');
  const version = new URL(script.src, location.href).search;
  const key = 'hostess-idioma:' + base + '/';
  const html = document.documentElement;
  const norm = text => text.replace(/\s+/g, ' ').trim();
  let saved;
  try { saved = localStorage.getItem(key); } catch {}
  const pathEnglish = location.pathname === base + '/en' || location.pathname.startsWith(base + '/en/');
  const requested = new URLSearchParams(location.search).get('lang') || (pathEnglish ? 'en' : saved);
  const languagePath = (path, lang) => {
    const suffix = path.slice(base.length).replace(/^\/en(?=\/|$)/,'').replace(/\/index\.html$/,'').replace(/\/$/,'');
    return base + (lang === 'en' ? '/en' : '') + suffix;
  };
  let active = pathEnglish ? 'en' : 'es', dictionary = null, reverse = {}, pending = null, sequence = 0, frame = 0, failed = false;
  const originals = new WeakMap(), written = new WeakMap(), attrs = new WeakMap(), hrefs = new WeakMap();
  const attributes = ['alt', 'placeholder', 'aria-label', 'title'];
  const blocked = 'script,style,noscript,template,[data-no-traducir],.lpa-u';
  const translate = value => {
    const text = norm(value);
    if (active !== 'en') return reverse[text] || text;
    if (dictionary?.[text]) return dictionary[text];
    return text.replace(/^Desde (\$[\d,]+ [A-Z]{3})$/, 'From $1');
  };
  const original = value => reverse[norm(value)] || norm(value).replace(/^From (\$[\d,]+ [A-Z]{3})$/, 'Desde $1');
  function load() {
    if (dictionary) return Promise.resolve(dictionary);
    if (pending) return pending;
    const slug = languagePath(location.pathname,'es').slice(base.length).replace(/^\//, '') || 'index';
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    pending = fetch(`${base}/assets/idioma/${slug}.json${version}`, {credentials:'same-origin', signal:controller.signal})
      .then(response => { if (!response.ok) throw new Error('language'); return response.json(); })
      .then(value => {
        if (!value || Array.isArray(value) || typeof value !== 'object' || !Object.values(value).every(x => typeof x === 'string' && x.length)) throw new Error('language');
        dictionary = value;
        reverse = Object.fromEntries(Object.entries(value).map(([es,en]) => [en,es]));
        return value;
      }).finally(() => { clearTimeout(timeout); pending = null; });
    return pending;
  }
  function render() {
    if (!document.body || (active === 'en' && !dictionary)) return;
    const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) {
      if (!node.parentElement || node.parentElement.closest(blocked) || !norm(node.data)) continue;
      if (!originals.has(node) || (written.has(node) && node.data !== written.get(node))) originals.set(node, original(node.data));
      const source = originals.get(node);
      const value = active === 'en' ? translate(source) : source;
      if (norm(node.data) !== value) node.data = (node.data.match(/^\s*/)?.[0] || '') + value + (node.data.match(/\s*$/)?.[0] || '');
      written.set(node, node.data);
    }
    for (const element of document.querySelectorAll('[alt],[placeholder],[aria-label],[title],meta[name=description],meta[property="og:title"],meta[property="og:description"],meta[property="og:image:alt"]')) {
      if (element.closest(blocked)) continue;
      const keys = element.matches('meta') ? ['content'] : attributes;
      const memory = attrs.get(element) || {};
      for (const name of keys) {
        if (!element.hasAttribute(name)) continue;
        const value = element.getAttribute(name);
        if (!memory[name] || memory[name].written !== value) memory[name] = {source:original(value), written:value};
        const next = active === 'en' ? translate(memory[name].source) : memory[name].source;
        if (value !== next) element.setAttribute(name,next);
        memory[name].written = next;
      }
      attrs.set(element,memory);
    }
    for (const link of document.querySelectorAll('a[href]')) {
      if (!hrefs.has(link)) hrefs.set(link,link.getAttribute('href'));
      const source = hrefs.get(link);
      if (!source?.startsWith(base) || link.classList.contains('idioma')) continue;
      const url = new URL(source,location.origin);
      url.pathname = languagePath(url.pathname,active);
      url.searchParams.delete('lang');
      const next = url.pathname + url.search + url.hash;
      if (link.getAttribute('href') !== next) link.setAttribute('href',next);
    }
    html.lang = active === 'en' ? 'en' : 'es-MX';
    const canonical = document.querySelector('link[rel=canonical][data-canonical]');
    if (canonical) {
      const canonicalUrl = new URL(canonical.dataset.canonical);
      canonicalUrl.pathname = languagePath(canonicalUrl.pathname,active);
      const url = canonicalUrl.href;
      canonical.href = url;
      const cardUrl = document.querySelector('meta[property="og:url"]');
      if (cardUrl && cardUrl.content !== url) cardUrl.content = url;
    }
    const locale = document.querySelector('meta[property="og:locale"]');
    const localeValue = active === 'en' ? 'en_US' : 'es_MX';
    if (locale && locale.content !== localeValue) locale.content = localeValue;
    document.querySelectorAll('input[name=idioma]').forEach(input => { input.value = active; });
    const button = document.querySelector('.idioma');
    if (button) {
      const label = active === 'en' ? 'ES' : 'EN';
      const accessible = active === 'en' ? 'Read this page in Spanish' : 'Leer en inglés';
      if (button.textContent !== label) button.textContent = label;
      if (button.getAttribute('aria-label') !== accessible) button.setAttribute('aria-label',accessible);
      button.href = languagePath(location.pathname,active === 'en' ? 'es' : 'en') + location.hash;
      button.hreflang = active === 'en' ? 'es-MX' : 'en';
    }
    html.dataset.idiomaListo = failed ? 'error' : active;
  }
  function queue() { if (!frame) frame = requestAnimationFrame(() => { frame = 0; render(); }); }
  async function change(language, updateUrl = true) {
    const turn = ++sequence;
    const button = document.querySelector('.idioma');
    if (button) button.disabled = true;
    try {
      if (language === 'en' || pathEnglish) await load();
      if (turn !== sequence) return;
      active = language === 'en' ? 'en' : 'es'; failed = false;
      render();
      try { localStorage.setItem(key,active); } catch {}
      if (updateUrl) {
        const url = new URL(location.href); url.pathname = languagePath(url.pathname,active); url.searchParams.delete('lang');
        history.replaceState(null,'',url.pathname + url.search + url.hash);
      }
      document.querySelector('.idioma-aviso')?.remove();
      document.dispatchEvent(new CustomEvent('leal:idioma',{detail:active}));
    } catch {
      if (turn !== sequence) return;
      active = 'es'; failed = true; render();
      let notice = document.querySelector('.idioma-aviso');
      if (!notice) { notice = document.createElement('p'); notice.className = 'idioma-aviso'; notice.setAttribute('role','status'); button?.after(notice); }
      notice.textContent = 'Inténtalo otra vez.';
      html.dataset.idiomaListo = 'error';
    } finally {
      html.classList.remove('idioma-cargando');
      if (button) button.disabled = false;
    }
  }
  window.LealIdioma = {t:translate, cambiar:change, get activo(){return active;}};
  if (requested === 'en' && !pathEnglish) {
    html.classList.add('idioma-cargando');
    const style = document.createElement('style'); style.textContent = 'html.idioma-cargando body{visibility:hidden}';
    document.head.append(style);
    setTimeout(() => html.classList.remove('idioma-cargando'),1500);
    load().catch(() => {});
  }
  function init() {
    document.querySelector('.idioma')?.addEventListener('click',event => { event.preventDefault(); change(active === 'en' ? 'es' : 'en'); });
    new MutationObserver(queue).observe(document.documentElement,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:[...attributes,'content']});
    change(requested === 'en' ? 'en' : 'es',true);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true}); else init();
})();
