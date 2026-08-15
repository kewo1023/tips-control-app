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
  const todos = [];

  // Un barrido por cada etiqueta de apertura del HTML. Se fabrica un elemento
  // para las que tengan `id`, `data-t` o `data-ph`, que son las únicas que la
  // app busca. Las demás no hacen falta: aquí no se dibuja nada.
  const re = /<(\w+)([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const atributos = m[2];
    const id  = /\bid="([^"]+)"/.exec(atributos);
    const dt  = /\bdata-t="([^"]+)"/.exec(atributos);
    const dph = /\bdata-ph="([^"]+)"/.exec(atributos);
    if (!id && !dt && !dph) continue;

    const el = new El(m[1]);
    const cls = /class="([^"]*)"/.exec(atributos);
    if (cls) el.className = cls[1];

    /* Los atributos tal como están escritos en el HTML, para que
       `getAttribute` diga la verdad sobre ellos.
    
       Antes no se guardaban y `getAttribute('type')` devolvía `undefined`
       para TODOS los campos. Eso no es "no lo sé": es una respuesta que se
       parece a una válida. Una prueba escrita para comprobar que un campo ya
       no es `type=number` pasaba en verde tanto si lo era como si no.
    
       Es el mismo fallo que tuvo `matchMedia` cuando contestaba lo mismo a
       cualquier pregunta. La regla del mini-dom: mejor que no sepa algo a que
       lo improvise. */
    const reAttr = /([\w-]+)="([^"]*)"/g;
    let a;
    while ((a = reAttr.exec(atributos))) el.setAttribute(a[1], a[2]);
    // `type` también como propiedad, que es como lo lee el código de la app.
    if (el._attrs.type) el.type = el._attrs.type;
    if (dt)  el.dataset.t = dt[1];
    if (dph) el.dataset.ph = dph[1];
    if (id)  porId[id[1]] = el;
    todos.push(el);
  }

  const raiz = new El('html');
  const meta = new El('meta');   // el <meta name="theme-color">
  // `document.body` lo usa la exportación: mete el enlace de descarga en la
  // página, lo pulsa y lo quita. Un enlace suelto en memoria funciona en casi
  // todos los navegadores, y "casi todos" es justo lo que no sirve cuando la
  // app está en el teléfono de otra persona.
  const cuerpo = new El('body');
  cuerpo.removeChild = hijo => {
    const i = cuerpo.children.indexOf(hijo);
    if (i >= 0) cuerpo.children.splice(i, 1);
    return hijo;
  };

  return {
    documentElement: raiz,
    body: cuerpo,
    _meta: meta,
    // La app engancha aquí el cierre del globo de ayuda. En las pruebas no se
    // simula la propagación de eventos: el abrir y cerrar se comprueba
    // llamando a las funciones directamente.
    addEventListener: () => {},
    getElementById: id => porId[id] || null,
    createElement: t => new El(t),
    querySelector: sel => (sel.includes('theme-color') ? meta : null),
    querySelectorAll(sel) {
      sel = sel.trim();

      // Selectores por atributo: [data-t], [data-ph]
      const atributo = /^\[data-(\w+)\]$/.exec(sel);
      if (atributo) {
        const clave = atributo[1];
        const dentro = todos.flatMap(e => e.descendientes());
        return [...todos, ...dentro].filter(el => el.dataset[clave] !== undefined);
      }

      const partes = sel.split(/\s+/);
      let raices = todos;
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
