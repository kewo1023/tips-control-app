/* ============================================================================
   PRUEBAS DE LA APP — Tips Control
   ----------------------------------------------------------------------------
   Se corren desde la Terminal, parado en la carpeta del proyecto:

       node pruebas-app.js

   Diferencia con `pruebas.js`: aquel comprueba las FÓRMULAS (¿cuánto da el
   tip-out?), este comprueba la APP (¿tocar un día abre su formulario?,
   ¿guardar dos veces duplica el turno?, ¿el tema se recuerda?).

   Carga `index.html` de verdad y lo ejecuta contra el navegador de mentira de
   `mini-dom.js`. No prueba lo visual: eso solo se ve en el teléfono.

   El reloj está congelado en el jueves 6 de agosto de 2026 a propósito. Una
   prueba que depende de la fecha real falla sola un martes cualquiera, cuando
   ya no te acuerdas de qué tocaste.
   ========================================================================== */

const fs = require('fs');
const vm = require('vm');
const { crearDocumento } = require('./mini-dom.js');

const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
// El último bloque <script> del archivo es el de la app (el primero es el
// trocito del tema que va en la cabecera).
const bloques = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
const script = bloques[bloques.length - 1];

const avisos = [];
let almacen = {};
let sistemaOscuro = false;
// Si la app se está viendo desde la pantalla de inicio (instalada) o desde el
// navegador. Por defecto, desde el navegador de un ordenador.
let modoStandalone = false;
const document = crearDocumento(html);

const HOY = new Date(2026, 7, 6, 12, 0, 0);   // jueves
class FechaFija extends Date {
  constructor(...a) { if (a.length === 0) super(HOY.getTime()); else super(...a); }
  static now() { return HOY.getTime(); }
}

const ctx = {
  document,
  // Silenciamos console.error: una de las pruebas le pasa datos corruptos a
  // propósito, y su volcado de error taparía la lista de resultados. Que la
  // app avise se comprueba con `avisos`, no leyendo la consola.
  console: { log: console.log, warn: () => {}, error: () => {} },
  Intl, Math, JSON, Number, String, Array, Object, Boolean,
  isFinite, parseInt, parseFloat, Date: FechaFija,
  crypto: require('crypto').webcrypto,
  alert: m => avisos.push(String(m)),
  confirm: () => true,
  navigator: { userAgent: '', maxTouchPoints: 0 }, addEventListener: () => {},
  /* Antes esto devolvía `sistemaOscuro` fuera cual fuera la pregunta, y eso se
     volvió un problema al aparecer la pantalla de instalación: `estaInstalada()`
     pregunta por `display-mode: standalone` y recibía la respuesta del modo
     oscuro. Con el tema en oscuro, la app se creía instalada. Un doble de
     pruebas que contesta a todo lo mismo miente en cuanto le preguntas dos
     cosas distintas. */
  matchMedia: consulta => ({
    matches: /display-mode/.test(String(consulta)) ? modoStandalone : sistemaOscuro,
    addEventListener: () => {}
  }),
  localStorage: {
    getItem: k => (k in almacen ? almacen[k] : null),
    setItem: (k, v) => { almacen[k] = String(v); },
    removeItem: k => { delete almacen[k]; }
  },
  location: { reload: () => {} },
  // La exportación aplaza la liberación del archivo. En las pruebas no
  // esperamos: lo que importa es que se llame, no cuándo.
  setTimeout: fn => { fn(); return 0; },
  URL: { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} },
  Blob: function () {}, FileReader: function () {}
};
ctx.window = ctx;
ctx.window.scrollTo = () => {};
ctx.window.innerWidth = 390;   // el ancho de un iPhone corriente
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(__dirname + '/logica.js', 'utf8'), ctx);
vm.runInContext(script, ctx);

/* --- El diálogo, en las pruebas ------------------------------------------
   La app ya no usa `alert()` ni `confirm()` del navegador: tiene los suyos
   (`avisar` y `preguntar`), porque los del sistema salen con el nombre del
   repositorio en el título y iOS deja apagarlos con "Eliminar cuadros de
   diálogo", lo que dejaba mudos también los avisos de error.

   Aquí se sustituyen por versiones que apuntan lo que se dijo y aceptan
   siempre, que es justo lo que hacían antes `alert: m => avisos.push(m)` y
   `confirm: () => true`. Se guardan los originales para poder probar el
   diálogo de verdad más abajo: si solo se probara la versión de mentira, las
   pruebas dirían que todo va bien aunque el diálogo no se dibujara nunca. */
const avisarReal = ctx.avisar;
const preguntarReal = ctx.preguntar;
ctx.avisar = m => { avisos.push(String(m)); };
ctx.preguntar = (m, alAceptar) => { avisos.push(String(m)); alAceptar(); };

/* --- Ayudas para escribir las pruebas ------------------------------------ */
const d = document;
const run = s => vm.runInContext(s, ctx);
const D = () => run('datos');
const set = (id, v) => { d.getElementById(id).value = String(v);
                         d.getElementById(id).dispatchEvent({ type: 'input' }); };
const texto = id => d.getElementById(id).textContent.replace(/\s+/g, ' ').trim();
const dias = () => d.querySelectorAll('#dias .dia');
const hijos = id => d.getElementById(id).children;
const cuantasMetricas = id =>
  (d.getElementById(id).innerHTML.match(/class="metrica"/g) || []).length;

let pasadas = 0, falladas = 0;
const ok = (n, c) => { c ? pasadas++ : falladas++; console.log((c ? '  ✓ ' : '  ✗ ') + n); };
const grupo = t => console.log('\n' + t);


/* ==========================================================================
   La bienvenida va PRIMERO porque es lo primero que ve alguien que instala la
   app: el almacenamiento arranca vacío, igual que en un teléfono nuevo. Al
   final de este bloque se completa la configuración, y de ahí en adelante el
   resto de las pruebas corren sobre una app ya configurada.
   ========================================================================== */
grupo('Bienvenida (app recién instalada)');

ok('abre en la bienvenida, no en la semana',
   !d.getElementById('p-bienvenida')._classes.has('oculto'));
ok('la semana está escondida', d.getElementById('p-semana')._classes.has('oculto'));
ok('las pestañas están escondidas', d.getElementById('pestanas')._classes.has('oculto'));
ok('todavía no está configurada', D().configurado === false);

ok('propone los 4 roles más comunes',
   d.querySelectorAll('#b-roles .rol-fila').length === 4);

/* La razón de ser de toda la pantalla: los porcentajes NO vienen puestos. Si
   llegaran con los del restaurante de Kev, alguien podría quedárselos sin
   enterarse y ver un neto que no es el suyo durante semanas. */
ok('con los porcentajes en blanco',
   D().roles.every(r => r.porcentaje === null));
ok('y la suma en cero', texto('b-total') === '0%');

// Sin tarifa no se puede empezar.
avisos.length = 0;
d.getElementById('b-tarifa').value = '';
run('terminarBienvenida()');
ok('sin sueldo por hora no deja empezar', D().configurado === false);
ok('y lo dice en vez de quedarse callada', avisos.length === 1);

// Con tarifa pero sin porcentajes, tampoco: un tip-out en cero infla el neto.
avisos.length = 0;
d.getElementById('b-tarifa').value = '8';
run('terminarBienvenida()');
ok('sin ningún porcentaje tampoco deja empezar', D().configurado === false);
ok('y explica que existe la casilla', avisos[0].includes('casilla'));

// La salida explícita para quien trabaja donde no se reparte.
avisos.length = 0;
d.getElementById('b-sin-tipout').checked = true;
run('terminarBienvenida()');
ok('marcando "no hay tip-out" sí deja empezar', D().configurado === true);
ok('y se queda sin roles, que es la verdad', D().roles.length === 0);
ok('sin avisos', avisos.length === 0);
ok('y aterriza en la semana', !d.getElementById('p-semana')._classes.has('oculto'));
ok('con las pestañas de vuelta', !d.getElementById('pestanas')._classes.has('oculto'));

// Un restaurante sin nombre no deja el encabezado en blanco.
ok('sin nombre pone uno por defecto', D().trabajo.nombre.length > 0);

/* Ahora el camino normal, que es el que deja el estado para el resto del
   archivo: se vuelve a la bienvenida y se configura con tip-out de verdad. */
run(`datos.configurado = false;
     datos.trabajo = { nombre: 'Mi restaurante', tarifaHora: 0 };
     datos.roles = [
       { id: 'r1', nombre: 'Busser', porcentaje: 3 },
       { id: 'r2', nombre: 'Barra',  porcentaje: 1.5 },
       { id: 'r3', nombre: 'Runner', porcentaje: 1 },
       { id: 'r4', nombre: 'Bakery', porcentaje: 1 }
     ];
     irA('bienvenida');`);
d.getElementById('b-sin-tipout').checked = false;
d.getElementById('b-tarifa').value = '8';
avisos.length = 0;
run('terminarBienvenida()');

ok('con tarifa y porcentajes se completa', D().configurado === true);
ok('guarda la tarifa que se escribió', D().trabajo.tarifaHora === 8);
ok('conserva los 4 roles', D().roles.length === 4);
ok('queda guardado en el teléfono',
   JSON.parse(almacen.tipsControl).configurado === true);

// Ya configurada, no vuelve a salir.
run("irA('semana')");
ok('una vez configurada ya no reaparece',
   d.getElementById('p-bienvenida')._classes.has('oculto'));

/* Quien ya venía usando la app no puede toparse con esta pantalla. Sus datos
   guardados no traen `configurado`, y sin la migración le pediría configurar de
   nuevo algo que ya tiene, encima de un historial que ya existe. */
almacen.tipsControl = JSON.stringify({
  turnos: [{ id: 'viejo', fecha: '2026-08-03', ventas: 900, efectivo: 20,
             tarjeta: 120, entrada: '17:00', salida: '23:00', tarifaHora: 8,
             tipOut: 58 }],
  trabajo: { nombre: 'De antes', tarifaHora: 8 }
});
run('cargar()');
ok('un usuario de antes no ve la bienvenida', D().configurado === true);

almacen.tipsControl = JSON.stringify({
  turnos: [], trabajo: { nombre: '', tarifaHora: 12 }
});
run('cargar()');
ok('con tarifa puesta pero sin turnos, tampoco', D().configurado === true);

almacen.tipsControl = JSON.stringify({
  turnos: [], trabajo: { nombre: '', tarifaHora: 0 }
});
run('cargar()');
ok('quien no tiene ni turnos ni tarifa sí la ve', D().configurado === false);

// Dejar el estado como lo esperan las pruebas siguientes.
run(`datos.configurado = true;
     datos.turnos = [];
     datos.trabajo = { nombre: 'Mi restaurante', tarifaHora: 0 };
     datos.roles = [
       { id: 'r1', nombre: 'Busser', porcentaje: 3 },
       { id: 'r2', nombre: 'Barra',  porcentaje: 1.5 },
       { id: 'r3', nombre: 'Runner', porcentaje: 1 },
       { id: 'r4', nombre: 'Bakery', porcentaje: 1 }
     ];
     guardar(); irA('semana');`);


/* ========================================================================== */
grupo('Arranque en la semana actual');
ok('abre en la pantalla de semana', !d.getElementById('p-semana')._classes.has('oculto'));
ok('el formulario está cerrado', d.getElementById('p-turno')._classes.has('oculto'));
ok('muestra 7 días', dias().length === 7);
ok('el rango es el de la semana del jueves 6', texto('rango') === '3 ago – 9 ago');
ok('marca hoy una sola vez', dias().filter(x => x._classes.has('hoy')).length === 1);
ok('hoy es el jueves (4ª casilla)', dias()[3]._classes.has('hoy'));
ok('los 7 días empiezan vacíos', dias().filter(x => x._classes.has('vacio')).length === 7);
ok('no deja avanzar más allá de esta semana', d.getElementById('btn-siguiente').disabled);
ok('el botón Hoy está oculto en la semana actual', d.getElementById('btn-hoy')._classes.has('oculto'));
ok('muestra la pista de qué hacer', !d.getElementById('pista')._classes.has('oculto'));


grupo('Tocar un día abre su formulario');
run('datos.trabajo.tarifaHora = 10;');
dias()[3].click();
ok('cambia a la pantalla del turno', !d.getElementById('p-turno')._classes.has('oculto'));
ok('el título trae la fecha del día tocado', texto('turno-fecha').includes('Jueves'));
ok('esconde las pestañas mientras editas', d.getElementById('pestanas')._classes.has('oculto'));
ok('no ofrece borrar en un día vacío', d.getElementById('btn-borrar')._classes.has('oculto'));
ok('precarga los 4 ayudantes', d.querySelectorAll('#chips .chip.activo').length === 4);
ok('el formulario viene en blanco', d.getElementById('f-ventas').value === '');
ok('la hora NO se rellena sola', d.getElementById('f-entrada').value === '');


grupo('Registrar el turno');
set('f-entrada', '17:00'); set('f-salida', '23:00');
set('f-ventas', '1200'); set('f-efectivo', '60'); set('f-tarjeta', '120');
ok('el recibo descuenta el tip-out', texto('recibo').includes('$78.00'));
ok('el recibo muestra el sueldo de 6 h aparte', texto('recibo').includes('$60.00'));
// 6 h · propinas 180 · tip-out 78 → 102. El sueldo (60) NO se suma.
ok('el recibo cierra en las propinas netas', texto('recibo').includes('$102.00'));
ok('y no en el total con sueldo', !texto('recibo').includes('$162.00'));
ok('el por hora va sin sueldo: 102 / 6', texto('recibo').includes('$17.00/h'));
run('guardarTurno()');
ok('guardó el turno', D().turnos.length === 1);
ok('con la fecha del día tocado', D().turnos[0].fecha === '2026-08-06');
ok('con identificador único, no la hora', String(D().turnos[0].id).length > 15);
ok('volvió a la semana', !d.getElementById('p-semana')._classes.has('oculto'));
ok('el jueves ya no está vacío', !dias()[3]._classes.has('vacio'));
ok('el jueves muestra su monto', dias()[3].textContent.includes('$102'));
ok('el jueves dibuja su barra', dias()[3].querySelectorAll('.barra').length === 1);
ok('el total de la semana es $102.00', texto('total-semana') === '$102.00');
ok('resume turnos y horas', texto('contra-semana').includes('1 turno')
                         && texto('contra-semana').includes('6 h'));
ok('quedó guardado en el teléfono', almacen.tipsControl !== undefined);


grupo('Volver a tocar ese día lo edita');
dias()[3].click();
ok('trae los datos guardados', d.getElementById('f-ventas').value === '1200');
ok('el título cambia a editar', texto('turno-fecha').includes('Jueves'));
ok('ahora sí ofrece borrar', !d.getElementById('btn-borrar')._classes.has('oculto'));
ok('recupera sus ayudantes', d.querySelectorAll('#chips .chip.activo').length === 4);
set('f-ventas', '1300');
run('guardarTurno()');
ok('editar no duplica el turno', D().turnos.length === 1);
ok('guardó el valor corregido', D().turnos[0].ventas === 1300);


grupo('Un segundo día y la comparación');
dias()[4].click();
run("rolesActivos = rolesActivos.filter(n => n !== 'Bakery'); pintar();");
set('f-entrada', '17:00'); set('f-salida', '01:00');
set('f-ventas', '1500'); set('f-efectivo', '100'); set('f-tarjeta', '200');
run('guardarTurno()');
ok('guarda el viernes como turno aparte', D().turnos.length === 2);
ok('sin Bakery quedan 3 ayudantes', D().turnos[1].tipoutDetalle.length === 3);
ok('tip-out 5.5% de $1500 = $82.50', D().turnos[1].tipOut === 82.5);
ok('el viernes cruzó la medianoche: 8 h',
   run('calcularTurno(datos.turnos[1])').horas === 8);
ok('la barra del viernes es más alta que la del jueves',
   parseFloat(dias()[4].querySelectorAll('.barra')[0].style.height) >
   parseFloat(dias()[3].querySelectorAll('.barra')[0].style.height));
// jueves 95.5 (ventas ya corregidas a 1300) + viernes 217.5 = 313
ok('el total suma los dos turnos', texto('total-semana') === '$313.00');
ok('dice 2 turnos', texto('contra-semana').includes('2 turnos'));


grupo('Estadísticas');
ok('las esenciales son cuatro', cuantasMetricas('metricas') === 4);
ok('incluye las horas de la semana', texto('metricas').includes('Horas'));
ok('separa el efectivo', texto('metricas').includes('Efectivo'));
ok('separa la tarjeta', texto('metricas').includes('Tarjeta'));
ok('efectivo de la semana: $160', texto('metricas').includes('$160'));
ok('tarjeta de la semana: $320', texto('metricas').includes('$320'));
ok('las extras empiezan ocultas', d.getElementById('metricas-extras')._classes.has('oculto'));
ok('el botón invita a abrirlas', texto('btn-mas') === 'Mostrar más estadísticas');
run('alternarEstadisticas()');
ok('el botón las abre', !d.getElementById('metricas-extras')._classes.has('oculto'));
ok('son seis extras', cuantasMetricas('metricas-extras') === 6);
ok('aparece el mejor día', !d.getElementById('mejor-dia')._classes.has('oculto'));
ok('y dice cuál fue', texto('mejor-dia').includes('Viernes'));
ok('el botón cambia de texto', texto('btn-mas') === 'Mostrar menos');
ok('la preferencia se guarda',
   JSON.parse(almacen.tipsControl).prefs.masEstadisticas === true);
run('alternarEstadisticas()');
ok('se vuelven a cerrar', d.getElementById('metricas-extras')._classes.has('oculto'));


grupo('Atajos de hora');
dias()[0].click();
ok('propone atajos de entrada', hijos('horas-entrada').length > 0);
ok('el más usado va primero', hijos('horas-entrada')[0].textContent === '5 pm');
hijos('horas-entrada')[0].click();
ok('tocar el atajo llena el campo', d.getElementById('f-entrada').value === '17:00');
ok('y el botón queda marcado', hijos('horas-entrada')[0]._classes.has('puesta'));
ok('los atajos de salida son otros', hijos('horas-salida')[0].textContent !== '5 pm');
run('cerrarTurno()');


grupo('Moverse entre semanas');
run('cambiarSemana(-1)');
ok('retrocede una semana', texto('rango') === '27 jul – 2 ago');
ok('aparece el botón Hoy', !d.getElementById('btn-hoy')._classes.has('oculto'));
ok('ahora sí deja avanzar', d.getElementById('btn-siguiente').disabled === false);
ok('la semana pasada está vacía', texto('total-semana') === '$0.00');
ok('lo dice sin inventar comparación', texto('contra-semana').includes('Sin turnos'));
run('irAHoy()');
ok('el botón Hoy vuelve a la semana actual', texto('rango') === '3 ago – 9 ago');
run("lunes = lunesDeLaSemana('2026-08-10'); pintar();");
ok('la semana siguiente compara con la anterior',
   texto('contra-semana').includes('que la semana pasada'));
ok('y marca la caída', texto('contra-semana').includes('−$313.00'));


/* ==========================================================================
   Sumar o no el sueldo por hora.

   En este punto hay dos turnos guardados:
     jueves  6 h · propinas netas  95.5 · sueldo 60 → 155.5
     viernes 8 h · propinas netas 217.5 · sueldo 80 → 297.5
   Sin sueldo la semana son 313.00 y con sueldo 453.00; 14 horas en total.
   ========================================================================== */
grupo('Sumar el sueldo por hora al total');

// El grupo anterior dejó la vista en la semana siguiente. Sin volver a la de
// los turnos, todo esto mediría una semana vacía y pasaría o fallaría por
// motivos que no tienen nada que ver con el interruptor.
run('irAHoy()');

ok('viene apagado de fábrica', D().prefs.contarSueldo === false);
ok('la semana muestra solo las propinas netas', texto('total-semana') === '$313.00');
ok('y el por hora va sin sueldo: 313 / 14', texto('metricas').includes('$22.36'));

d.getElementById('a-contar-sueldo').checked = true;
run('cambiarContarSueldo()');
run("irA('semana')");
ok('encendido, la semana sube al total con sueldo', texto('total-semana') === '$453.00');
ok('y el por hora también: 453 / 14', texto('metricas').includes('$32.36'));

// El interruptor no toca los datos: las dos cifras salen de lo mismo.
ok('los turnos guardados no cambian', D().turnos.length === 2);
ok('ni su tip-out', D().turnos[1].tipOut === 82.5);

// En el recibo, encendido el sueldo suma; apagado se ve pero aparte.
dias()[3].click();
ok('encendido el recibo cierra con sueldo', texto('recibo').includes('$155.50'));
run("irA('semana')");

d.getElementById('a-contar-sueldo').checked = false;
run('cambiarContarSueldo()');
ok('apagarlo devuelve el total de antes', texto('total-semana') === '$313.00');
ok('la preferencia queda guardada en el teléfono',
   JSON.parse(almacen.tipsControl).prefs.contarSueldo === false);

dias()[3].click();
ok('apagado el recibo cierra sin sueldo', texto('recibo').includes('$95.50'));
ok('pero el sueldo se sigue viendo', texto('recibo').includes('$60.00'));
run("irA('semana')");


grupo('Tamaño de la letra');
run('irA("ajustes")');
ok('ofrece tres tamaños', hijos('escalas').length === 3);
// Arranca en Grande y no en Normal: el valor por defecto tiene que servirle a
// quien no hizo la app, leyendo de pie al final del turno.
ok('arranca en Grande', D().prefs.escala === 'grande');
ok('y eso es el 115%', d.documentElement.style.fontSize === '115%');

run('cambiarEscala("mayor")');
ok('cambiar de tamaño agranda la base', d.documentElement.style.fontSize === '132%');
ok('y queda guardado', JSON.parse(almacen.tipsControl).prefs.escala === 'mayor');

/* Un valor que no reconocemos no puede dejar la pantalla en un tamaño
   indefinido: sin esta red, un respaldo de otra versión podría dejar la app
   ilegible y sin forma de volver a Ajustes para arreglarlo. */
run('datos.prefs.escala = "gigantesco"; aplicarEscala();');
ok('un tamaño desconocido cae en Normal', d.documentElement.style.fontSize === '100%');

run('cambiarEscala("normal")');
ok('volver a Normal deja la base como estaba',
   d.documentElement.style.fontSize === '100%');

// El tamaño es solo apariencia: no puede tocar ni un dato.
ok('cambiar el tamaño no toca los turnos', D().turnos.length === 2);


grupo('Tema claro y oscuro');
run('irA("ajustes")');
ok('ofrece tres temas', hijos('temas').length === 3);
// Arranca en Claro (el segundo de los tres: auto, claro, oscuro). La primera
// pantalla que ve alguien que abre el enlace de un compañero tiene que ser la
// misma para todos, y el cierre de caja se hace con las luces encendidas.
ok('arranca en Claro', hijos('temas')[1]._classes.has('activo'));
ok('el sistema dice claro, la app está clara',
   d.documentElement.dataset.tema === 'claro');
hijos('temas')[2].click();
ok('elegir Oscuro lo aplica', d.documentElement.dataset.tema === 'oscuro');
ok('marca el botón elegido', hijos('temas')[2]._classes.has('activo'));
ok('y desmarca Automático', !hijos('temas')[0]._classes.has('activo'));
ok('cambia el color de la barra de estado',
   d.querySelector('meta[name="theme-color"]').getAttribute('content') === '#0e0e0d');
ok('lo recuerda al guardar', JSON.parse(almacen.tipsControl).prefs.tema === 'oscuro');
hijos('temas')[1].click();
ok('elegir Claro lo aplica', d.documentElement.dataset.tema === 'claro');
hijos('temas')[0].click();
ok('volver a Automático sigue al sistema', d.documentElement.dataset.tema === 'claro');
sistemaOscuro = true;
run('aplicarTema()');
ok('en Automático, si el sistema se oscurece la app también',
   d.documentElement.dataset.tema === 'oscuro');
run('cambiarTema("claro")');
ok('pero una elección explícita le gana al sistema',
   d.documentElement.dataset.tema === 'claro');
sistemaOscuro = false;


/* El desastre que se quiere evitar al cambiar un valor por defecto: que el
   cambio se le aplique a quien lleva meses usando la app. Alguien que eligió
   Automático y letra Normal tiene que seguir viendo Automático y letra Normal
   aunque los que abren la app hoy por primera vez arranquen en Claro y Grande.
   Un default que pisa una elección ya hecha es peor que un default malo: la
   persona no cambió nada y aun así le cambió la app. */
grupo('Cambiar un valor por defecto no toca a quien ya usa la app');
/* Este grupo pisa los turnos y los roles para montar sus propios casos, y los
   grupos de más abajo cuentan con los que ya había. Se guarda el estado antes y
   se devuelve al final. La alternativa —dejarlo como quede— hace que una prueba
   de aquí reviente otra que está 40 líneas más abajo y no tiene nada que ver,
   y ese día nadie relaciona una cosa con la otra. */
const estadoAntesDeLosDefaults = almacen.tipsControl;

almacen.tipsControl = JSON.stringify({
  configurado: true,
  turnos: [], roles: [],
  trabajo: { nombre: 'El de siempre', tarifaHora: 8 },
  prefs: { masEstadisticas: false, tema: 'auto', idioma: 'es',
           contarSueldo: false, escala: 'normal', comparar: true }
});
run('cargar()');
ok('conserva el tema que ya había elegido', D().prefs.tema === 'auto');
ok('y el tamaño de letra que ya tenía', D().prefs.escala === 'normal');

/* El caso contrario, sin el cual el de arriba pasaría también con el código
   roto: quien no tiene ninguna preferencia sí recibe los valores nuevos.
   Hay que vaciar `datos.prefs` a mano porque `cargar()` conserva a propósito lo
   que ya está en memoria, y en memoria están las preferencias de la prueba
   anterior. Alguien que abre la app por primera vez no tiene ninguna de las
   dos cosas. */
almacen.tipsControl = JSON.stringify({
  configurado: true, turnos: [], roles: [],
  trabajo: { nombre: 'Nuevo', tarifaHora: 8 }
});
run('datos.prefs = {}');
run('cargar()');
ok('quien no tenía preferencias recibe las nuevas', D().prefs.tema === 'claro');
ok('también el tamaño de letra', D().prefs.escala === 'grande');
/* Esta faltaba y por eso no se vio: la copia de los valores por defecto que usa
   la importación estaba a medias, sin `comparar`. Un respaldo viejo dejaba esa
   preferencia en undefined, que se lee como "no", y las comparaciones de la
   semana desaparecían sin que nadie hubiera tocado nada. */
ok('y ninguna preferencia se queda sin valor',
   Object.keys(run('PREFS_POR_DEFECTO')).every(k => D().prefs[k] !== undefined));

// Devolver el estado que esperan los grupos siguientes.
almacen.tipsControl = estadoAntesDeLosDefaults;
run('cargar()');


grupo('Ajustes');
ok('lista los roles', d.querySelectorAll('#roles .rol-fila').length === 4);
ok('suma el total de porcentajes', texto('a-total') === '6.5%');
run('agregarRol(); cambiarRol(datos.roles[4].id, "porcentaje", 2);');
ok('agregar un rol actualiza el total', texto('a-total') === '8.5%');
run('borrarRol(datos.roles[4].id)');
ok('quitarlo no toca los turnos guardados',
   D().roles.length === 4 && D().turnos[0].tipoutDetalle.length === 4);


grupo('Comparación contra la semana anterior');
run("irA('semana'); lunes = lunesDeLaSemana('2026-08-06'); pintar();");
ok('en una semana sin anterior no hay flechas de comparación',
   !d.getElementById('metricas').innerHTML.includes('class="delta'));
// Registramos un turno flojo en la semana siguiente para comparar contra ella.
run("abrirDia('2026-08-10')");
set('f-entrada', '17:00'); set('f-salida', '22:00');
set('f-ventas', '600'); set('f-efectivo', '20'); set('f-tarjeta', '40');
run('guardarTurno()');
const htmlMetricas = () => d.getElementById('metricas').innerHTML;
ok('ahora sí compara', htmlMetricas().includes('class="delta'));
ok('ganar menos se pinta de rojo', htmlMetricas().includes('delta baja'));
ok('y lo muestra con el signo menos', htmlMetricas().includes('−'));
ok('las horas no se juzgan: van en gris',
   /mHoras|Horas[\s\S]{0,120}delta plano/.test(htmlMetricas())
   || htmlMetricas().includes('delta plano'));
run('alternarEstadisticas()');
ok('el tip-out tampoco se juzga',
   d.getElementById('metricas-extras').innerHTML.includes('delta plano'));
ok('pero las ventas sí', d.getElementById('metricas-extras').innerHTML.includes('delta baja'));


grupo('La diferencia va debajo de la cifra');
ok('la delta sale fuera del div del valor, en su propio renglón',
   /<div class="valor">[^<]*<\/div><span class="delta/.test(htmlMetricas()));


grupo('Explicación de cada dato, a petición');
ok('cada métrica esencial trae su botón de información',
   (htmlMetricas().match(/class="info"/g) || []).length === 4);
ok('las extras también',
   (d.getElementById('metricas-extras').innerHTML.match(/class="info"/g) || []).length === 6);
ok('ya no hay descripciones siempre visibles',
   !htmlMetricas().includes('class="nota"'));
ok('el botón sabe qué nota abrir',
   htmlMetricas().includes("mostrarNota('nPorHora'"));

const globo = () => d.getElementById('globo');
ok('el globo empieza cerrado', globo()._classes.has('oculto'));
run("mostrarNota('nPorHora', null)");
ok('el botón lo abre', !globo()._classes.has('oculto'));
ok('con la explicación correcta', globo().textContent.includes('÷ horas trabajadas'));
run("cerrarNota()");
ok('tocar fuera lo cierra', globo()._classes.has('oculto'));
run("mostrarNota('nTarjeta', null)");
ok('otro botón muestra otra explicación',
   globo().textContent.includes('cheque'));
run("cambiarIdioma('en'); mostrarNota('nTarjeta', null);");
ok('la explicación también está traducida',
   globo().textContent.includes('paycheck'));
run("cambiarIdioma('es'); cerrarNota();");

// El globo se coloca a mano con las medidas del botón. Comprobamos que no se
// salga por el borde derecho, que es lo que pasaría con las tarjetas de esa
// columna si no se le pusiera tope.
const botonFalso = izq => ({
  getBoundingClientRect: () => ({ left: izq, width: 16, bottom: 300 })
});
run("irA('semana')");
vm.runInContext('mostrarNota', ctx)('nHoras', botonFalso(370));
ok('no se sale por la derecha',
   parseFloat(globo().style.left) + 235 <= 390);
vm.runInContext('mostrarNota', ctx)('nHoras', botonFalso(2));
ok('ni por la izquierda', parseFloat(globo().style.left) >= 14);
ok('y se coloca debajo del botón', parseFloat(globo().style.top) > 300);
run('cerrarNota()');


grupo('Idioma');
run("irA('ajustes')");
ok('ofrece dos idiomas', hijos('idiomas').length === 2);
ok('arranca en español', hijos('idiomas')[0]._classes.has('activo'));
ok('los idiomas se nombran en su propio idioma',
   hijos('idiomas')[1].textContent === 'English');
ok('los títulos están en español', texto('tab-semana') === 'Semana');
hijos('idiomas')[1].click();
ok('cambia las pestañas', texto('tab-semana') === 'Week');
ok('cambia los títulos de sección', texto('tab-ajustes') === 'Settings');
ok('cambia los botones', d.getElementById('temas').children[0].textContent === 'Automatic');
ok('lo recuerda', JSON.parse(almacen.tipsControl).prefs.idioma === 'en');
run("irA('semana')");
ok('cambia las etiquetas de las métricas', texto('metricas').includes('Per hour'));
ok('y las de las estadísticas extras',
   d.getElementById('metricas-extras').innerHTML.includes('Sales'));
ok('las letras de los días cambian de idioma',
   dias()[0].textContent.trim().startsWith('M'));
run("abrirDia('2026-08-07')");
ok('la fecha del turno sale en inglés', texto('turno-fecha').includes('Friday'));
const porClave = clave => d.querySelectorAll('[data-t]')
  .find(el => el.dataset.t === clave);
ok('las etiquetas del formulario también',
   porClave('entrada').textContent === 'Clock in'
   && porClave('ayudantes').textContent === 'Support staff');
ok('el recibo también', texto('recibo').includes('You take home'));
ok('el placeholder de la nota también',
   d.getElementById('f-nota').getAttribute('placeholder').includes('private party'));
run('cerrarTurno()');
run("cambiarIdioma('es')");
ok('volver a español lo deshace', texto('tab-semana') === 'Semana');

// Esta comprueba el diccionario entero de una vez: si mañana se agrega una
// frase en español y se olvida su traducción, esta prueba lo dice. Sin ella,
// el error aparecería como una palabra suelta en español en medio de la app
// en inglés, que es justo lo que nadie mira.
const claves = k => Object.keys(run('TEXTOS')[k]).sort();
ok('los dos idiomas tienen exactamente las mismas claves',
   JSON.stringify(claves('es')) === JSON.stringify(claves('en')));
ok('ninguna traducción quedó vacía',
   Object.values(run('TEXTOS').en).every(v =>
     Array.isArray(v) ? v.length === 7 : String(v).trim().length > 0));


grupo('Lo que suele romperse');
run("irA('semana'); lunes = lunesDeLaSemana('2026-08-06'); pintar();");
dias()[1].click();
avisos.length = 0;
run('guardarTurno()');
ok('no guarda un turno sin horas',
   D().turnos.length === 3 && avisos.some(a => a.includes('entrada')));
set('f-entrada', '17:00'); set('f-salida', '23:00');
avisos.length = 0;
run('guardarTurno()');
ok('no guarda un turno sin plata', D().turnos.length === 3 && avisos.length === 1);
set('f-efectivo', '95');
run("rolesActivos = []; guardarTurno();");
ok('sí guarda sin ventas ni ayudantes', D().turnos.length === 4);
ok('ese turno no paga tip-out',
   D().turnos.find(t => t.fecha === '2026-08-04').tipOut === 0);
run("irA('semana')");
dias()[3].click();
run('borrarTurno()');
ok('borrar quita solo ese turno', D().turnos.length === 3);
ok('el jueves vuelve a estar vacío', dias()[3]._classes.has('vacio'));

almacen.tipsControl = '{roto';
avisos.length = 0;
run('cargar()');
ok('sobrevive a datos corruptos sin pantalla en blanco', avisos.length === 1);
almacen.tipsControl = JSON.stringify({ turnos: [], roles: [],
  trabajo: { nombre: 'X', tarifaHora: 0 } });
run('cargar()');
// Ojo: no se comprueba que el tema vuelva a 'auto'. Las preferencias que ya
// están en memoria se conservan a propósito, y en esta corrida el tema se
// cambió a mano unas pruebas más arriba. Lo que importa aquí es que un
// guardado sin `prefs` no deje el objeto incompleto y reviente al primer toque.
const prefs = run('datos.prefs');
ok('un guardado de una versión anterior no deja las prefs incompletas',
   prefs !== undefined && typeof prefs.masEstadisticas === 'boolean'
                       && typeof prefs.tema === 'string');
run('alternarEstadisticas(); cambiarTema("auto");');
ok('y los botones siguen funcionando después',
   run('datos.prefs').tema === 'auto');
run("datos.roles = []; irA('semana');");
dias()[2].click();
ok('sin roles configurados avisa en vez de fallar', texto('chips').includes('Ajustes'));


/* ==========================================================================
   Cuando el teléfono no deja guardar.

   Pasa de verdad: almacenamiento lleno, o navegación privada en iOS, donde
   escribir está prohibido. Antes esto rompía la función a la mitad sin decir
   nada y el turno desaparecía. Es el fallo más caro que puede tener la app.
   ========================================================================== */
/* ==========================================================================
   Comparar o no con la semana anterior.

   Se apagan los "+$147" de colores, no las barras de los días: aquellas
   comparan dentro de la misma semana y no llevan juicio de valor.
   ========================================================================== */
grupo('Comparar con la semana anterior');

/* El estado se monta aquí entero en vez de heredarlo del grupo anterior. Las
   pruebas de datos corruptos que corren más arriba dejan la lista de turnos
   vacía, y una prueba que depende de en qué orden se ejecutan las demás falla
   sola el día que alguien mueve un bloque. */
run(`datos.configurado = true;
     datos.prefs.comparar = true;
     datos.turnos = [
       { id: 'ahora',  fecha: '2026-08-06', ventas: 0, efectivo: 100,
         tarjeta: 100, entrada: '17:00', salida: '23:00', tarifaHora: 0, tipOut: 0 },
       { id: 'previo', fecha: '2026-07-30', ventas: 0, efectivo: 50,
         tarjeta: 50, entrada: '17:00', salida: '22:00', tarifaHora: 0, tipOut: 0 }
     ];
     guardar(); irAHoy(); irA('semana');`);

// Esta semana 200, la pasada 100: la diferencia es +$100.
ok('viene encendido de fábrica', D().prefs.comparar === true);
ok('y se ve la comparación', texto('contra-semana').includes('que la semana pasada'));
ok('con la diferencia calculada', texto('contra-semana').includes('+$100.00'));
ok('y deltas en las métricas', texto('metricas').includes('+$50'));

d.getElementById('a-comparar').checked = false;
run("cambiarComparar(); irA('semana');");
ok('apagado desaparece la comparación',
   !texto('contra-semana').includes('que la semana pasada'));
ok('y los deltas de las métricas', !texto('metricas').includes('+$50'));
/* Lo que NO puede desaparecer: el resumen de turnos y horas es un dato útil,
   no una comparación. Quitarlo dejaría la línea vacía. */
ok('pero el resumen de turnos y horas se queda',
   texto('contra-semana').includes('1 turno') && texto('contra-semana').includes('6 h'));
ok('y el total de la semana no se toca', texto('total-semana') === '$200.00');
/* Las barras comparan dentro de la misma semana, sin colores ni juicio: esas
   se quedan pase lo que pase. */
ok('las barras de los días siguen ahí',
   dias().filter(x => x.querySelectorAll('.barra').length === 1).length === 1);
ok('queda guardado', JSON.parse(almacen.tipsControl).prefs.comparar === false);

d.getElementById('a-comparar').checked = true;
run("cambiarComparar(); irA('semana');");
ok('encenderlo la devuelve', texto('contra-semana').includes('+$100.00'));


grupo('La Ayuda');
run("irA('ajustes')");
run("irA('ayuda')");
ok('se abre desde Ajustes', !d.getElementById('p-ayuda')._classes.has('oculto'));
ok('la pestaña de Ajustes sigue marcada',
   d.getElementById('tab-ajustes')._classes.has('activa'));
ok('lista las ocho preguntas', d.querySelectorAll('#ayuda-lista .ayuda-item').length === 8);
ok('todas empiezan cerradas',
   d.querySelectorAll('#ayuda-lista .ayuda-r').length === 0);

run("abrirAyuda('tipout')");
ok('tocar una pregunta muestra su respuesta',
   d.querySelectorAll('#ayuda-lista .ayuda-r').length === 1);
ok('y es la que se tocó', texto('ayuda-lista').includes('VENTAS del turno'));

/* Solo una abierta a la vez: con varias, hay que desplazarse para encontrar la
   siguiente pregunta, que es justo lo que el plegado venía a evitar. */
run("abrirAyuda('datos')");
ok('abrir otra cierra la anterior',
   d.querySelectorAll('#ayuda-lista .ayuda-r').length === 1);
run("abrirAyuda('datos')");
ok('tocar la abierta la cierra',
   d.querySelectorAll('#ayuda-lista .ayuda-r').length === 0);

/* Las claves se arman con texto ('ayuda' + Registrar + 'P'), así que una
   pregunta mal escrita no da error: pinta "undefined" y nadie se entera hasta
   que un compañero manda la captura. */
const clavesAyuda = run('AYUDA');
const faltantes = clavesAyuda.filter(c => {
  const M = c.charAt(0).toUpperCase() + c.slice(1);
  return !run(`t('ayuda${M}P')`) || !run(`t('ayuda${M}R')`);
});
ok('ninguna pregunta se quedó sin texto', faltantes.length === 0);

run('cambiarIdioma("en")');
const faltantesEn = clavesAyuda.filter(c => {
  const M = c.charAt(0).toUpperCase() + c.slice(1);
  return !run(`TEXTOS.en['ayuda${M}P']`) || !run(`TEXTOS.en['ayuda${M}R']`);
});
ok('ni en inglés', faltantesEn.length === 0);
run('cambiarIdioma("es")');

run("irA('ajustes')");
ok('cerrar devuelve a Ajustes', !d.getElementById('p-ajustes')._classes.has('oculto'));


grupo('El teléfono no deja guardar');

run("datos.configurado = true; datos.turnos = []; irA('semana')");
const guardarDeVerdad = ctx.localStorage.setItem;
ctx.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };

avisos.length = 0;
dias()[2].click();                      // miércoles 5
set('f-entrada', '17:00'); set('f-salida', '23:00');
set('f-ventas', '1000'); set('f-efectivo', '50'); set('f-tarjeta', '150');
run('guardarTurno()');

ok('avisa en vez de quedarse callada', avisos.length === 1);
ok('el aviso dice qué hacer', avisos[0].includes('espacio'));
/* Lo más importante de todo el grupo: no volver a la semana. Salir del
   formulario le diría a alguien que su turno quedó registrado cuando no lo
   está, y de paso le borraría de la pantalla lo que acaba de escribir. */
ok('no cierra el formulario', !d.getElementById('p-turno')._classes.has('oculto'));
ok('y lo escrito sigue en pantalla', d.getElementById('f-ventas').value === '1000');

ctx.localStorage.setItem = guardarDeVerdad;
run('guardarTurno()');
ok('al volver a funcionar, guarda sin repetir el turno', D().turnos.length === 1);
run("irA('semana')");


grupo('Datos ilegibles: no se destruye lo que había');
almacen.tipsControl = '{esto no es json';
avisos.length = 0;
run('cargar()');
ok('avisa', avisos.length === 1);
ok('y dice que no borre nada', avisos[0].includes('NO borres'));
/* Antes el aviso decía "se empieza de cero" y acto seguido el primer guardado
   machacaba el original, que casi siempre es recuperable a mano. */
const copias = Object.keys(almacen).filter(k => k.includes('-roto-'));
ok('aparta una copia de lo que había', copias.length === 1);
ok('con el contenido intacto', almacen[copias[0]] === '{esto no es json');


grupo('Borrar todos los datos');
almacen.tipsControl = JSON.stringify({ configurado: true,
  trabajo: { nombre: 'X', tarifaHora: 8 }, roles: [],
  turnos: [{ id: 'a', fecha: '2026-08-05', ventas: 100, efectivo: 20,
             tarjeta: 30, entrada: '17:00', salida: '23:00',
             tarifaHora: 8, tipOut: 0 }] });
run('cargar()');
avisos.length = 0;
run('borrarTodo()');
/* `preguntar` siempre dice que sí en las pruebas, así que este camino es el de
   quien acepta el respaldo: se exporta y se le pide volver a pulsar.
   Ahora `avisos` recoge dos cosas y no una: la pregunta y el aviso. Antes las
   preguntas no se apuntaban porque `confirm()` solo devolvía verdadero o falso
   y no pasaba por aquí; que ahora queden registradas es lo que permite
   comprobar que la oferta del respaldo se hace, y no solo que se exportó. */
ok('ofrece el respaldo antes de borrar', avisos.length === 2);
ok('y no borra todavía', D().turnos.length === 1);
ok('el aviso explica que hay que volver a tocar', avisos[1].includes('vuelve a tocar'));


/* El diálogo de verdad, no el de mentira que usan las pruebas de arriba.
   Se llama a `cerrarDialogo()` en vez de tocar los botones porque el mini-dom
   solo dispara los `onclick` que se asignan desde el código, y los de este
   diálogo están escritos en el HTML. Que el botón esté bien cableado se ve en
   el teléfono; lo que se prueba aquí es lo que decide: qué se muestra, qué
   botones salen y qué pasa al contestar. */
grupo('El diálogo propio');
const dlg = () => d.getElementById('dialogo');

avisarReal('Se acabó el espacio');
ok('un aviso abre el diálogo', !dlg()._classes.has('oculto'));
ok('con el texto que se le pasó', texto('dialogo-texto') === 'Se acabó el espacio');
ok('y sin botón de cancelar',
   d.getElementById('dialogo-cancelar')._classes.has('oculto'));
ok('el botón dice Entendido', texto('dialogo-ok') === 'Entendido');
run('cerrarDialogo(true)');
ok('al aceptar se cierra', dlg()._classes.has('oculto'));

let hizo = false;
preguntarReal('¿Borro el turno?', () => { hizo = true; });
ok('una pregunta sí ofrece cancelar',
   !d.getElementById('dialogo-cancelar')._classes.has('oculto'));
run('cerrarDialogo(false)');
ok('cancelar no ejecuta nada', hizo === false);
ok('y cierra igual', dlg()._classes.has('oculto'));

// El caso contrario: sin él, la prueba de arriba pasaría también si el diálogo
// no ejecutara NUNCA lo que se le pide.
preguntarReal('¿Borro el turno?', () => { hizo = true; });
run('cerrarDialogo(true)');
ok('aceptar sí lo ejecuta', hizo === true);

/* La cola. Es el motivo por el que hay cola: al borrar todos los datos, si la
   exportación falla salta su aviso y justo después el que dice que el respaldo
   se descargó. Sin cola, el segundo pisaba al primero y el error desaparecía
   antes de que nadie llegara a leerlo. */
avisarReal('Primero');
avisarReal('Segundo');
ok('con dos avisos se muestra el primero', texto('dialogo-texto') === 'Primero');
run('cerrarDialogo(true)');
ok('y al cerrarlo aparece el segundo', texto('dialogo-texto') === 'Segundo');
ok('sin quedarse oculto por el camino', !dlg()._classes.has('oculto'));
run('cerrarDialogo(true)');
ok('cerrado el último, se cierra del todo', dlg()._classes.has('oculto'));
ok('y no queda ninguno en la cola', run('colaDialogos').length === 0);


/* La pantalla de instalación.
   Se prueba de última porque cambia el navegador de mentira por uno que dice
   ser un iPhone, y dejarlo así confundiría a cualquier prueba de más abajo. */
grupo('La pantalla de instalación');
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) '
             + 'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 '
             + 'Mobile/15E148 Safari/604.1';

ok('en un ordenador no se pide instalar nada', run('debeInstalar()') === false);

ctx.navigator.userAgent = IPHONE;
run('instalarOculto = false');
ok('en un iPhone sin instalar, sí', run('debeInstalar()') === true);

modoStandalone = true;
ok('pero no si ya está instalada', run('debeInstalar()') === false);
modoStandalone = false;

/* Que la pantalla se dibuje de verdad. Sin esto, las pruebas de arriba dirían
   que "hay que instalar" aunque la pantalla saliera en blanco. */
run("pantalla = 'instalacion'; pintar()");
ok('la pantalla se muestra',
   !d.getElementById('p-instalacion')._classes.has('oculto'));
ok('con las pestañas escondidas, como la bienvenida',
   d.getElementById('pestanas')._classes.has('oculto'));
ok('y explica los tres pasos',
   (d.getElementById('inst2-cuerpo').innerHTML.match(/<li>/g) || []).length === 3);
ok('avisa de que lo escrito aquí no pasa a la app instalada',
   d.getElementById('inst2-cuerpo').innerHTML.includes('no pasa a la app instalada'));

/* La salida. Existe solo para que un fallo de detección en algún teléfono raro
   no deje a esa persona encerrada fuera de su app, así que tiene que llevar a
   algún sitio de verdad. `preguntar` acepta siempre en las pruebas, que es el
   caso de quien confirma que prefiere el navegador. */
run('datos.configurado = false');
run('seguirSinInstalar()');
ok('la salida lleva a la bienvenida si no se ha configurado',
   run('pantalla') === 'bienvenida');

run('instalarOculto = false; datos.configurado = true');
run('seguirSinInstalar()');
ok('y a la semana si ya se configuró antes', run('pantalla') === 'semana');
ok('quien ya salió sigue viendo el aviso en la semana',
   !d.getElementById('instalar')._classes.has('oculto'));

// Dejar el navegador de mentira como estaba.
ctx.navigator.userAgent = '';


/* ========================================================================== */
console.log('\n' + '-'.repeat(52));
if (falladas === 0) {
  console.log(`Todo bien: ${pasadas} comprobaciones pasaron.`);
} else {
  console.log(`${pasadas} pasaron, ${falladas} FALLARON.`);
  process.exit(1);
}
