/* ============================================================================
   MINI-DOM — un navegador de mentira, en 100 líneas
   ----------------------------------------------------------------------------
   `pruebas.js` comprueba las fórmulas. Esto sirve para comprobar la APP: que
   tocar un día abra el formulario, que guardar no duplique, que el botón de
   estadísticas se acuerde de su estado.

   Para eso hace falta un navegador, y node no tiene. Lo normal sería usar
   `jsdom`, pero no está disponible en el entorno donde se escribe este
   proyecto, así que aquí hay una imitación mínima: solo lo que la app usa de
   verdad (getElementById, createElement, classList, appendChild y poco más).

   No es un navegador: no calcula estilos, no hace layout y no entiende HTML
   escrito dentro de `innerHTML`. Sirve para probar el comportamiento, no la
   apariencia. Lo visual solo se prueba mirando el teléfono.

   No hace falta tocarlo. Se usa desde `pruebas-app.js`.
   ========================================================================== */

const sinTags = s => String(s).replace(/<[^>]*>/g, ' ');

class El {
  constructor(tag) {
    this.tagName = (tag || 'div').toUpperCase();
    this.children = []; this._value = ''; this.style = {}; this.dataset = {};
    this._text = ''; this._html = ''; this._classes = new Set();
    this._lis = {}; this.onclick = null; this.onchange = null;
    this.type = ''; this.disabled = false;
    this._attrs = {};
  }
  // El navegador convierte a texto cualquier cosa que se asigne a .value.
  get value() { return this._value; }
  set value(v) { this._value = v === null || v === undefined ? '' : String(v); }

  get classList() {
    const c = this._classes;
    return {
      add: (...n) => n.forEach(x => c.add(x)),
      remove: (...n) => n.forEach(x => c.delete(x)),
      contains: n => c.has(n),
      toggle: (n, f) => { const on = f === undefined ? !c.has(n) : f;
                          on ? c.add(n) : c.delete(n); return on; }
    };
  }
  get className() { return [...this._classes].join(' '); }
  set className(v) { this._classes = new Set(String(v).split(/\s+/).filter(Boolean)); }

  set textContent(v) { this._text = String(v); this._html = ''; this.children = []; }
  get textContent() {
    return this._text + sinTags(this._html)
         + this.children.map(c => c.textContent).join(' ');
  }
  set innerHTML(v) { this._html = String(v); this._text = ''; this.children = []; }
  get innerHTML() { return this._html; }

  setAttribute(n, v) { this._attrs[n] = String(v); }
  getAttribute(n) { return this._attrs[n]; }

  appendChild(c) { this.children.push(c); return c; }
  append(...cs) { cs.forEach(c => this.children.push(c)); }
  addEventListener(t, fn) { (this._lis[t] = this._lis[t] || []).push(fn); }
  dispatchEvent(e) { (this._lis[e.type] || []).forEach(fn => fn(e)); }
  click() { if (this.onclick) this.onclick(); }

  descendientes() { return this.children.flatMap(c => [c, ...c.descendientes()]); }
  querySelectorAll(sel) {
    const clases = sel.trim().split('.').filter(Boolean);
    return this.descendientes().filter(el => clases.every(c => el._classes.has(c)));
  }
}

/**
 * Crea un documento a partir del HTML: busca todas las etiquetas con `id` y
 * fabrica un elemento por cada una, con sus clases iniciales.
 */
function crearDocumento(html) {
  const porId = {};
  const re = /<(\w+)([^>]*\bid="([^"]+)"[^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const el = new El(m[1]);
    const cls = /class="([^"]*)"/.exec(m[2]);
    if (cls) el.className = cls[1];
    porId[m[3]] = el;
  }

  const raiz = new El('html');
  const meta = new El('meta');   // el <meta name="theme-color">

  return {
    documentElement: raiz,
    _meta: meta,
    getElementById: id => porId[id] || null,
    createElement: t => new El(t),
    querySelector: sel => (sel.includes('theme-color') ? meta : null),
    querySelectorAll(sel) {
      const partes = sel.trim().split(/\s+/);
      let raices = Object.values(porId);
      if (partes[0].startsWith('#')) {
        const r = porId[partes[0].slice(1)];
        raices = r ? [r] : [];
        partes.shift();
      }
      const clases = (partes[0] || '').split('.').filter(Boolean);
      return raices.flatMap(r => [r, ...r.descendientes()])
                   .filter(el => clases.every(c => el._classes.has(c)));
    }
  };
}

module.exports = { El, crearDocumento, sinTags };
