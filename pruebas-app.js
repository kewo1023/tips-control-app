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

/* Una tarifa que el teclado del teléfono escribió con coma. Esta es LA
   pantalla donde apareció el fallo: es lo primero que toca alguien que abre la
   app por primera vez, y es donde un compañero se quedó sin poder poner
   decimales. */
avisos.length = 0;
d.getElementById('b-tarifa').value = '8,50';
run('guardarBienvenida()');
ok('una tarifa con coma se guarda en la bienvenida', D().trabajo.tarifaHora === 8.5);
ok('sin avisar de nada', avisos.length === 0);

avisos.length = 0;
d.getElementById('b-tarifa').value = 'ocho con cincuenta';
run('terminarBienvenida()');
ok('una tarifa ilegible no deja empezar', D().configurado === false);
ok('y lo dice', avisos.length === 1);
ok('nombrando el campo', avisos[0].includes('Sueldo por hora'));
ok('y NO se guarda como 0', D().trabajo.tarifaHora === 8.5);

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
     /* Se parte del objeto de fábrica, no de dos campos sueltos: montar a mano
        un trabajo incompleto haría que las pruebas corrieran contra un estado
        que la app de verdad nunca produce, y el código de los campos nuevos no
        se ejecutaría nunca aquí. Ya pasó con tipOutEnEfectivo. */
     datos.trabajo = { ...TRABAJO_POR_DEFECTO,
                       nombre: 'Mi restaurante', tarifaHora: 0 };
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

/* El mismo perfil viejo sirve para vigilar la otra mitad del problema: su
   `trabajo` guardado no trae `tipOutEnEfectivo`, porque el campo no existía
   cuando lo guardó. `cargar()` mezcla superficialmente, así que ese `trabajo`
   reemplaza al de fábrica ENTERO y el campo nuevo llegaría en `undefined` —que
   se lee como "no"— dejando el descuento apagado para todo el que ya usa la
   app, sin un solo error por ninguna parte. Es el mismo fallo que se comió
   `comparar` el 9 de agosto. */
ok('a un perfil viejo se le rellena el campo nuevo',
   D().trabajo.tipOutEnEfectivo === true);
ok('sin pisarle lo que ya tenía puesto', D().trabajo.nombre === 'De antes');

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
     /* Se parte del objeto de fábrica, no de dos campos sueltos: montar a mano
        un trabajo incompleto haría que las pruebas corrieran contra un estado
        que la app de verdad nunca produce, y el código de los campos nuevos no
        se ejecutaría nunca aquí. Ya pasó con tipOutEnEfectivo. */
     datos.trabajo = { ...TRABAJO_POR_DEFECTO,
                       nombre: 'Mi restaurante', tarifaHora: 0 };
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

/* El gris de día libre. Hoy es jueves 6, así que solo lunes, martes y miércoles
   son días vacíos que YA pasaron. Los otros cuatro (hoy incluido) no se pintan:
   un día que no ha llegado no es un día libre, y el gris lo afirmaría. */
ok('solo los días vacíos ya pasados se pintan de hueco',
   dias().filter(x => x._classes.has('pasado')).length === 3);
ok('y son lunes, martes y miércoles',
   [0, 1, 2].every(i => dias()[i]._classes.has('pasado')));
ok('hoy no se pinta: todavía puede haber turno esta noche',
   !dias()[3]._classes.has('pasado'));
ok('ni los días que aún no han llegado',
   [4, 5, 6].every(i => !dias()[i]._classes.has('pasado')));
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
ok('precarga los 4 ayudantes', d.querySelectorAll('#tramos .chip.activo').length === 4);
ok('el formulario viene en blanco', d.getElementById('f-ventas').value === '');
ok('la hora NO se rellena sola', d.getElementById('f-entrada').value === '');


grupo('Registrar el turno');
set('f-entrada', '17:00'); set('f-salida', '23:00');
set('f-ventas', '1200'); set('f-efectivo', '60'); set('f-tarjeta', '120');
ok('el recibo descuenta el tip-out', texto('recibo').includes('$78.00'));

/* La línea del efectivo neto, que es el dato que se necesita en este momento
   exacto: estás cerrando el turno y decides si sacas billetes de la cartera.
   A mano: efectivo 60 − tip-out 78 = −18. Esta noche pones $18 de tu bolsillo
   aunque el turno cierre en $102 a favor, porque $120 se los llevó la tarjeta
   y esos llegan en el cheque. */
ok('el recibo dice cuánto efectivo queda de verdad',
   texto('recibo').includes('Efectivo neto'));
ok('y sale negativo cuando el tip-out se pasa',
   texto('recibo').includes('-$18.00'));
ok('el recibo muestra el sueldo de 6 h aparte', texto('recibo').includes('$60.00'));
// 6 h · propinas 180 · tip-out 78 → 102. El sueldo (60) NO se suma.
ok('el recibo cierra en las propinas netas', texto('recibo').includes('$102.00'));
ok('y no en el total con sueldo', !texto('recibo').includes('$162.00'));
ok('el por hora va sin sueldo: 102 / 6',
   texto('recibo').includes('Por hora') && texto('recibo').includes('$17.00'));
/* El contrario, y es el que vigila el cambio: antes el por hora iba pegado a
   la etiqueta del total ("Te llevas · $17.00/h"). Era la única línea del recibo
   con dos cifras, y la de la izquierda se leía como parte del nombre. */
ok('y ya no cuelga de la etiqueta del total',
   !texto('recibo').includes('$17.00/h'));

/* Las tres etiquetas nuevas del recibo, con el sueldo apagado (el de fábrica).
   Propinas: 60 + 120 = 180, la única cifra del recibo que no se tecleó.
   Propina dejada: 180 / 1200 = 15%. */
ok('Propinas dice de dónde sale', texto('recibo').includes('Efectivo + tarjeta'));
ok('el porcentaje se lee como lo diría un mesero',
   texto('recibo').includes('Te dejaron de propina')
   && texto('recibo').includes('15%'));
/* Y no la etiqueta vieja, que sonaba a contabilidad, ni "promedio", que en esta
   app ya significa otra cosa: la métrica "Por turno" de la semana. */
ok('y no la etiqueta contable de antes',
   !texto('recibo').includes('sobre ventas')
   && !texto('recibo').includes('promedio'));
ok('con el sueldo fuera, el total NO se llama "total del turno"',
   texto('recibo').includes('Total que te llevas')
   && !texto('recibo').includes('Total del turno'));
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
ok('recupera sus ayudantes', d.querySelectorAll('#tramos .chip.activo').length === 4);
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
ok('separa la tarjeta', texto('metricas').includes('Tarjeta'));
ok('tarjeta de la semana: $320', texto('metricas').includes('$320'));

/* El efectivo, con el tip-out ya descontado.
   A mano, con los dos turnos de esta semana:
     jueves  efectivo  60 − tip-out 84.50 (6.5% de 1300) = −24.50
     viernes efectivo 100 − tip-out 82.50 (5.5% de 1500) = +17.50
                                                    neto =  −7
   O sea: entre los dos días entregaste $167 de propina en billetes y solo
   recibiste $160. Pusiste $7 de tu cartera. La cifra vieja decía "$160". */
ok('la etiqueta avisa de que es el neto',
   texto('metricas').includes('Efectivo neto'));
ok('el efectivo de la semana ya lleva el tip-out descontado',
   texto('metricas').includes('-$7'));
ok('y no muestra el bruto', !texto('metricas').includes('$160'));

/* Las partes tienen que seguir sumando el total, o el tip-out se estaría
   restando dos veces: −7 + 320 = 313, que es el total de la semana. */
ok('las partes siguen cuadrando con el total',
   run('resumir(datos.turnos.filter(x => x.fecha >= "2026-08-03"))').efectivoNeto
   + run('resumir(datos.turnos.filter(x => x.fecha >= "2026-08-03"))').tarjeta
   === 313);

/* El caso contrario, que es lo que hace que la casilla signifique algo: en un
   restaurante donde el tip-out lo descuenta el cheque, el efectivo que te
   llevaste esa noche fue el que recibiste, entero. Restarlo ahí sería un error
   peor, porque los dos números seguirían sumando lo mismo y no se notaría. */
d.getElementById('a-tipout-efectivo').checked = false;
run("cambiarTipOutEnEfectivo(); irA('semana');");
ok('apagada la casilla, vuelve el efectivo en bruto',
   texto('metricas').includes('$160'));
ok('y la etiqueta vuelve a ser Efectivo a secas',
   !texto('metricas').includes('Efectivo neto'));
ok('el total de la semana no se mueve en ningún caso',
   texto('total-semana') === '$313.00');
ok('queda guardado en el trabajo, no en las preferencias',
   JSON.parse(almacen.tipsControl).trabajo.tipOutEnEfectivo === false);

d.getElementById('a-tipout-efectivo').checked = true;
run("cambiarTipOutEnEfectivo(); irA('semana');");
ok('volver a encenderla devuelve el neto', texto('metricas').includes('-$7'));
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
/* La etiqueta del total cambia con lo que el total contiene, igual que
   "Efectivo" pasa a "Efectivo neto". Con el sueldo dentro, esa cifra SÍ es
   todo lo que dio el turno y se puede llamar así. */
ok('y con el sueldo dentro sí se llama "Total del turno"',
   texto('recibo').includes('Total del turno')
   && !texto('recibo').includes('Total que te llevas'));
run("irA('semana')");

d.getElementById('a-contar-sueldo').checked = false;
run('cambiarContarSueldo()');
ok('apagarlo devuelve el total de antes', texto('total-semana') === '$313.00');
ok('la preferencia queda guardada en el teléfono',
   JSON.parse(almacen.tipsControl).prefs.contarSueldo === false);

dias()[3].click();
ok('apagado el recibo cierra sin sueldo', texto('recibo').includes('$95.50'));
ok('pero el sueldo se sigue viendo', texto('recibo').includes('$60.00'));
ok('y la etiqueta vuelve a la que no promete el sueldo',
   texto('recibo').includes('Total que te llevas')
   && !texto('recibo').includes('Total del turno'));
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
ok('el recibo también', texto('recibo').includes('Your take-home'));
/* Las etiquetas nuevas del recibo también viajan a inglés. Sin esto, un cambio
   de texto se hace en español y se descubre en inglés seis semanas después. */
ok('y las etiquetas nuevas del recibo', texto('recibo').includes('Cash + card'));
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
ok('sin roles configurados avisa en vez de fallar', texto('tramos').includes('Ajustes'));


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


/* La versión y el pie de Ajustes.

   La versión está escrita en dos archivos —`VERSION` en sw.js y `VERSION_APP`
   en index.html— porque no hay forma de que uno lea al otro. Esta prueba es lo
   único que impide que se separen: si se separan, el pie de Ajustes le diría a
   alguien que tiene la v17 cuando en realidad tiene la v19, y la primera
   pregunta del soporte por WhatsApp pasaría a dar una respuesta falsa. Un dato
   equivocado es peor que ningún dato, porque nadie lo vuelve a comprobar. */
grupo('La versión y el pie de Ajustes');
const versionSW = (fs.readFileSync(__dirname + '/sw.js', 'utf8')
  .match(/const VERSION = '([^']+)'/) || [])[1];
ok('sw.js declara su versión', !!versionSW);
ok('y coincide con la que enseña la app', run('VERSION_APP') === versionSW);

run('irA("ajustes")');
ok('el pie enseña la versión', texto('pie-legal').includes(versionSW));
ok('y el aviso de derechos', texto('pie-legal').includes('Kevin Rincón'));
run("datos.prefs.idioma = 'en'; pintar()");
ok('también en inglés', texto('pie-legal').includes('All rights reserved'));
run("datos.prefs.idioma = 'es'; pintar()");


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


/* ==========================================================================
   Un día en que se perdió plata
   --------------------------------------------------------------------------
   El desastre que vigila este grupo no es una cuenta mal hecha: es un día de
   trabajo que desaparece de la pantalla.

   La celda decidía si había turno preguntando si el total daba cero. Cuando se
   escribió eso, "no hay turno" y "el total es cero" eran la misma cosa. Dejaron
   de serlo el día que un total pudo dar negativo: un turno con el tip-out por
   encima de las propinas no da cero, pero tampoco da positivo, así que no
   pintaba ni monto ni barra. Un día en que pusiste $30 de tu bolsillo se veía
   igual que un día libre.
   ========================================================================== */
grupo('Un día con el total en negativo');

const turnosAntes = run('JSON.stringify(datos.turnos)');

/* Ventas altas y propinas flojas, que es como pasa de verdad: 6.5% de $2.000
   son $130 de tip-out contra $100 de propinas. Neto: −$30. */
run(`datos.turnos = [
       { id: 'malanoche', fecha: '2026-08-06', ventas: 2000, efectivo: 50,
         tarjeta: 50, entrada: '17:00', salida: '23:00', tarifaHora: 0,
         tipOut: 130, tipoutDetalle: [] }
     ];
     guardar(); irAHoy(); irA('semana');`);

ok('el día trabajado NO se marca como vacío', !dias()[3]._classes.has('vacio'));
ok('pinta su monto en negativo', dias()[3].textContent.includes('-$30'));
ok('y en rojo, que un −$30 en verde se lee al revés',
   dias()[3].querySelectorAll('.monto.negativo').length === 1);
ok('sin barra: no hubo nada que medir hacia arriba',
   dias()[3].querySelectorAll('.barra').length === 0);
ok('el total de la semana también va en negativo',
   texto('total-semana') === '-$30.00');

/* El caso contrario, sin el cual la prueba de arriba se podría engañar sola:
   los días que de verdad están vacíos tienen que seguir vacíos y mudos. Si
   alguien "arreglara" esto pintando el monto siempre, aquí saltaría. */
ok('los otros seis días siguen vacíos',
   dias().filter(x => x._classes.has('vacio')).length === 6);
ok('y no muestran ninguna cifra', !dias()[0].textContent.includes('$'));

/* El otro borde, y el más traicionero: un turno cuyo neto da exactamente $0.
   Es justo el valor que devolvía un día sin turno, así que la condición vieja
   no los podía distinguir ni en teoría. Trabajaste: tiene que verse. */
run(`datos.turnos = [
       { id: 'justito', fecha: '2026-08-06', ventas: 1000, efectivo: 0,
         tarjeta: 65, entrada: '17:00', salida: '23:00', tarifaHora: 0,
         tipOut: 65, tipoutDetalle: [] }
     ];
     guardar(); irA('semana');`);
ok('un turno que cierra en $0 tampoco es un día vacío',
   !dias()[3]._classes.has('vacio'));
ok('y enseña el $0 en vez de callarse', dias()[3].textContent.includes('$0'));
ok('el $0 no se pinta de rojo',
   dias()[3].querySelectorAll('.monto.negativo').length === 0);

/* Y el caso contrario del gris de día libre: un día pasado en el que SÍ se
   trabajó no se hunde. Sin esta prueba, pintar de hueco los siete días pasaría
   igual de verde que pintar solo los libres. */
run(`datos.turnos = [
       { id: 'lunes', fecha: '2026-08-03', ventas: 800, efectivo: 40,
         tarjeta: 60, entrada: '17:00', salida: '23:00', tarifaHora: 0,
         tipOut: 0, tipoutDetalle: [] }
     ];
     guardar(); irA('semana');`);
ok('un día pasado con turno no se pinta de hueco',
   !dias()[0]._classes.has('pasado'));
ok('y tampoco de vacío', !dias()[0]._classes.has('vacio'));
ok('los otros dos días pasados sí siguen huecos',
   [1, 2].every(i => dias()[i]._classes.has('pasado')));

/* Montos de cuatro cifras. La celda del día mide unos 48 puntos y recorta lo
   que se sale, así que "$1,300" salía como "$1,30": no un número más pequeño,
   un número distinto. Aquí no se puede comprobar que quepa —el mini-dom no
   dibuja ni mide— pero sí que la app marque cuáles hay que encoger, que es la
   decisión que se le puede escapar. Lo de que quepa se mira en el teléfono. */
run(`datos.turnos = [
       { id: 'gordo', fecha: '2026-08-03', ventas: 0, efectivo: 600,
         tarjeta: 700, entrada: '17:00', salida: '23:00', tarifaHora: 0,
         tipOut: 0, tipoutDetalle: [] },
       { id: 'normal', fecha: '2026-08-04', ventas: 0, efectivo: 60,
         tarjeta: 70, entrada: '17:00', salida: '23:00', tarifaHora: 0,
         tipOut: 0, tipoutDetalle: [] }
     ];
     guardar(); irA('semana');`);
ok('un monto de cuatro cifras se pinta entero', dias()[0].textContent.includes('$1,300'));
ok('y se marca para encogerlo',
   dias()[0].querySelectorAll('.monto.largo').length === 1);
/* El contrario: si `largo` se pusiera siempre, la app entera se vería encogida
   y la prueba de arriba pasaría igual. */
ok('uno de tres cifras se deja en paz',
   dias()[1].querySelectorAll('.monto.largo').length === 0);
ok('y ese sí muestra $130', dias()[1].textContent.includes('$130'));

/* Los dos contrarios de la línea del recibo. Sin uno de ellos, poner la línea
   siempre pasaría igual de verde. */
/* Este grupo monta también los roles: un grupo anterior los dejó vacíos, y sin
   roles no puede haber tip-out, así que la prueba de abajo estaría comprobando
   la ausencia de la línea por el motivo equivocado. */
run(`datos.turnos = [];
     datos.roles = [{ id: 'r1', nombre: 'Busser', porcentaje: 6.5 }];
     guardar(); irAHoy(); irA('semana');`);
dias()[3].click();
set('f-entrada', '17:00'); set('f-salida', '23:00');
set('f-ventas', '0'); set('f-efectivo', '80'); set('f-tarjeta', '20');
ok('sin tip-out la línea no aparece: repetiría la de arriba',
   !texto('recibo').includes('Efectivo neto'));

set('f-ventas', '1000');   // ahora sí hay tip-out: 6.5% = $65
ok('con tip-out vuelve a aparecer', texto('recibo').includes('Efectivo neto'));

run('datos.trabajo.tipOutEnEfectivo = false; pintarRecibo();');
ok('y desaparece donde el tip-out lo descuenta el cheque',
   !texto('recibo').includes('Efectivo neto'));
run("datos.trabajo.tipOutEnEfectivo = true; cerrarTurno();");

// Devolver los turnos como estaban: este grupo los pisó.
run(`datos.turnos = ${turnosAntes}; guardar(); irA('semana');`);


/* --------------------------------------------------------------------------
   El teclado con coma

   Grupo escrito a partir de un fallo real en el iPhone de un compañero: su
   teclado ofrecía "," donde el de Kev ofrece ".", y lo que escribía llegaba al
   código como texto vacío. `Number('') || 0` lo convertía en 0 sin decir nada.

   Se empieza por el desastre, no por el camino feliz: lo primero que se
   comprueba es que un porcentaje ilegible NO se guarde como 0, porque ese cero
   es el que infla el neto de todos los turnos siguientes.

   Este grupo pisa turnos y roles, así que los guarda al empezar y los devuelve
   al terminar. Sin eso reventaría un grupo veinte líneas más abajo, y ese día
   nadie relaciona una cosa con la otra.
   -------------------------------------------------------------------------- */
grupo('El teclado con coma');

const antesDeLaComa = JSON.stringify(D().turnos);
const rolesAntesDeLaComa = JSON.stringify(D().roles);

run("datos.configurado = true; datos.turnos = []; irA('ajustes')");

// --- El porcentaje de un ayudante ---
avisos.length = 0;
run(`cambiarRol(datos.roles[0].id, 'porcentaje', '3,5')`);
ok('un porcentaje con coma se guarda como 3.5', D().roles[0].porcentaje === 3.5);
ok('y no avisa de nada: se entendió perfectamente', avisos.length === 0);

avisos.length = 0;
run(`cambiarRol(datos.roles[0].id, 'porcentaje', 'tres y medio')`);
ok('un porcentaje ilegible NO se guarda como 0',
   D().roles[0].porcentaje === 3.5);
ok('y lo dice en vez de callarse', avisos.length === 1);
ok('el aviso nombra el campo', avisos[0].includes('Porcentaje del ayudante'));
ok('y aclara que lo demás está a salvo', avisos[0].includes('a salvo'));

avisos.length = 0;
run(`cambiarRol(datos.roles[0].id, 'porcentaje', '')`);
ok('vaciar el campo lo deja en null, no en 0',
   D().roles[0].porcentaje === null);

run(`cambiarRol(datos.roles[0].id, 'porcentaje', 3)`);
ok('un número de verdad sigue entrando igual', D().roles[0].porcentaje === 3);

// --- El sueldo por hora ---
avisos.length = 0;
set('a-tarifa', '12,50');
run('guardarAjustes()');
ok('la tarifa con coma entra bien', D().trabajo.tarifaHora === 12.5);

avisos.length = 0;
set('a-nombre', 'El Sitio Nuevo');
set('a-tarifa', 'doce cincuenta');
run('guardarAjustes()');
ok('una tarifa ilegible no pisa la que ya estaba', D().trabajo.tarifaHora === 12.5);
ok('avisa', avisos.length === 1);
/* El nombre está en la misma tarjeta y no tiene la culpa del campo de al
   lado. Perderlo sería castigar dos cosas por un solo error. */
ok('pero el nombre del restaurante sí se guardó',
   D().trabajo.nombre === 'El Sitio Nuevo');
ok('y el campo vuelve a enseñar la tarifa buena',
   d.getElementById('a-tarifa').value === '12.5');

// --- Los tres números del turno ---
run("datos.roles.forEach(r => r.porcentaje = 2); irA('semana')");
dias()[1].click();                       // martes 4
set('f-entrada', '17:00'); set('f-salida', '23:00');

avisos.length = 0;
set('f-ventas', '1000,50'); set('f-efectivo', '80'); set('f-tarjeta', '120');
run('guardarTurno()');
ok('unas ventas con coma se guardan enteras', D().turnos[0].ventas === 1000.5);

run("borrarTurno(); irA('semana')");
dias()[1].click();
set('f-entrada', '17:00'); set('f-salida', '23:00');

avisos.length = 0;
set('f-ventas', '1000x'); set('f-efectivo', '80'); set('f-tarjeta', '120');
run('guardarTurno()');
/* Lo que de verdad se está vigilando: con las ventas ilegibles leídas como 0,
   el tip-out habría salido $0 y el neto del turno habría quedado inflado. Un
   total de más nadie lo cuestiona. */
ok('un turno con un número ilegible no se guarda', D().turnos.length === 0);
ok('avisa', avisos.length === 1);
ok('y nombra el campo que falla, no "hay un error"',
   avisos[0].includes('Ventas del turno'));
ok('no cierra el formulario',
   !d.getElementById('p-turno')._classes.has('oculto'));
ok('y lo escrito sigue en pantalla para poder corregirlo',
   d.getElementById('f-ventas').value === '1000x');

avisos.length = 0;
set('f-ventas', '1000'); set('f-efectivo', '8o');
run('guardarTurno()');
ok('el efectivo ilegible también frena el guardado', D().turnos.length === 0);
ok('y el aviso nombra el efectivo, no las ventas',
   avisos[0].includes('Propina efectivo'));

/* A medio escribir: la coma final no puede dar un aviso de error. Es el caso
   que aparece solo si alguien teclea los centavos y toca Guardar antes de
   escribirlos. */
avisos.length = 0;
set('f-efectivo', '80,');
run('guardarTurno()');
ok('una coma a medio escribir NO se trata como error', avisos.length === 0);
ok('y se lee como el número entero', D().turnos[0].efectivo === 80);

run("borrarTurno(); irA('semana')");
dias()[1].click();
set('f-entrada', '17:00'); set('f-salida', '23:00');
set('f-ventas', '1000'); set('f-tarjeta', '120');

avisos.length = 0;
set('f-efectivo', '80,25');
run('guardarTurno()');
ok('corregido, guarda', D().turnos.length === 1);
ok('con el efectivo bien leído', D().turnos[0].efectivo === 80.25);
ok('y sin avisos', avisos.length === 0);

// --- Los campos ya no son type=number ---
/* La comprobación que evita que alguien "limpie" esto en seis meses sin saber
   por qué estaba: si vuelven a ser `type=number`, el navegador vuelve a
   decidir qué es un número válido y el fallo del compañero vuelve entero.

   Se mira el elemento Y el texto del archivo. Lo segundo no es redundante: el
   campo del porcentaje de cada rol no existe en el HTML, lo fabrica
   `pintarListaRoles` desde el código, así que un `type = 'number'` ahí no lo
   vería ninguna comprobación sobre elementos. */
['f-ventas', 'f-efectivo', 'f-tarjeta', 'a-tarifa', 'b-tarifa'].forEach(id =>
  ok(`${id} no es type=number`,
     d.getElementById(id).getAttribute('type') === 'text'));

ok('no queda ningún type="number" en el archivo',
   !/type="number"/.test(html));
ok('ni ninguno puesto desde el código',
   !/\.type\s*=\s*'number'/.test(html));

run(`datos.turnos = ${antesDeLaComa}; datos.roles = ${rolesAntesDeLaComa};`
  + `datos.trabajo.tarifaHora = 8; datos.trabajo.nombre = 'Cafe Test';`
  + `guardar(); irA('semana');`);


/* --------------------------------------------------------------------------
   El equipo cambió a mitad de turno

   El caso de Kev: de 3 a 6 pm dos ayudantes al 2% sobre $500, y después los
   cuatro al 6.5% sobre lo que queda. Lo que se vigila aquí no es la fórmula
   —eso está en pruebas.js— sino el formulario: que los tramos se guarden, que
   vuelvan al reabrir el turno, y sobre todo que un corte imposible NO se pueda
   guardar.

   Este grupo pisa los turnos, así que los guarda al empezar y los devuelve.
   -------------------------------------------------------------------------- */
grupo('El equipo cambió a mitad de turno');

const antesDeTramos = JSON.stringify(D().turnos);
run(`datos.turnos = []; datos.roles = [
       { id: 'r1', nombre: 'Busser', porcentaje: 3 },
       { id: 'r2', nombre: 'Barra',  porcentaje: 1.5 },
       { id: 'r3', nombre: 'Runner', porcentaje: 1 },
       { id: 'r4', nombre: 'Bakery', porcentaje: 1 }
     ]; irA('semana');`);

const corte = i => d.querySelectorAll('#tramos .tramo-cab')[i].children
                    .find(e => e.tagName === 'INPUT');
const chipsDe = i => d.querySelectorAll('#tramos .tramo')[i]
                      .descendientes().filter(e => e._classes.has('chip'));
const marcados = i => chipsDe(i).filter(e => e._classes.has('activo')).length;

dias()[0].click();                       // lunes 3
set('f-entrada', '15:00'); set('f-salida', '23:00');
set('f-ventas', '1800');

ok('de entrada hay un solo bloque de ayudantes',
   d.querySelectorAll('#tramos .tramo').length === 1);
ok('y ninguna cabecera de tramo: la pantalla queda como siempre',
   d.querySelectorAll('#tramos .tramo-cab').length === 0);

run('agregarCorte()');
ok('al añadir un cambio salen dos bloques',
   d.querySelectorAll('#tramos .tramo').length === 2);
/* El tramo nuevo entra vacío. Precargarlo con todos obligaría a desmarcar más
   de lo que se marca, y un ayudante de más ahí se paga de menos sin avisar. */
ok('el tramo nuevo entra sin ningún ayudante', marcados(0) === 0);
ok('y el último conserva los que ya estaban', marcados(1) === 4);

// Los dos ayudantes de las 3 a las 6: Busser (3%) y Runner (1%) = 4%.
chipsDe(0)[0].click();                   // Busser
chipsDe(0)[2].click();                   // Runner
ok('marcar en el primer tramo no toca el segundo', marcados(1) === 4);
ok('y el primero queda con dos', marcados(0) === 2);

corte(0).value = '500';
corte(0).dispatchEvent({ type: 'input' });
ok('el resto se calcula solo', d.querySelectorAll('#tramos .resto')[0].textContent === '$1,300.00');

avisos.length = 0;
run('guardarTurno()');
ok('guarda', D().turnos.length === 1);
/* 4% de $500 = $20, y 6.5% de $1300 = $84.50. Escrito a mano antes de correr
   nada: si se apuntara lo que salió, la prueba no comprobaría nada. */
ok('el tip-out es el de cada tramo sobre SU base', D().turnos[0].tipOut === 104.5);
ok('y no el del equipo completo sobre todo el turno',
   D().turnos[0].tipOut !== 117);
ok('guarda los tramos escritos', (D().turnos[0].tipoutTramos || []).length === 2);
ok('con el corte donde se puso', (D().turnos[0].tipoutTramos || [{}])[0].hasta === 500);
ok('el último tramo no tiene corte: llega hasta el final',
   (D().turnos[0].tipoutTramos || [{},{}])[1].hasta === null);
ok('el desglose lleva las 6 entradas, con repetidos',
   D().turnos[0].tipoutDetalle.length === 6);

// --- Reabrir el turno ---
run("irA('semana')");
dias()[0].click();
ok('al reabrirlo vuelven los dos tramos',
   d.querySelectorAll('#tramos .tramo').length === 2);
ok('con su corte escrito', corte(0).value === '500');
ok('los ayudantes del primer tramo, como estaban', marcados(0) === 2);
ok('y los del último también', marcados(1) === 4);
ok('el recibo desglosa por tramo', texto('recibo').includes('$500.00 al 4%'));
ok('y también el otro tramo', texto('recibo').includes('$1,300.00 al 6.5%'));
ok('con el total del tip-out en una sola línea',
   texto('recibo').includes('1 cambio'));

// --- Lo que no se puede guardar ---
avisos.length = 0;
corte(0).value = '2000';                 // más que las ventas del turno
corte(0).dispatchEvent({ type: 'input' });
run('guardarTurno()');
/* El fallo grande que esto evita: con el corte por encima de las ventas, el
   último tramo sale negativo y el tip-out pasa a SUMAR dinero. */
ok('un corte mayor que las ventas no se guarda', avisos.length === 1);
ok('y el aviso dice cuáles son las ventas del turno',
   avisos[0].includes('$1,800.00'));
ok('el turno guardado sigue con el tip-out bueno', D().turnos[0].tipOut === 104.5);

avisos.length = 0;
corte(0).value = '';
corte(0).dispatchEvent({ type: 'input' });
run('guardarTurno()');
ok('un cambio sin ventas escritas tampoco', avisos.length === 1);
ok('y le dice cómo quitarlo', avisos[0].includes('✕'));

avisos.length = 0;
corte(0).value = '4oo';
corte(0).dispatchEvent({ type: 'input' });
run('guardarTurno()');
ok('ni uno con un número ilegible', avisos.length === 1);
ok('nombrando el campo', avisos[0].includes('cambio de equipo'));

avisos.length = 0;
corte(0).value = '0';
corte(0).dispatchEvent({ type: 'input' });
run('guardarTurno()');
ok('ni un cambio en cero: sin ventas antes no hay tramo', avisos.length === 1);

// --- Dos cambios, y el tope ---
corte(0).value = '500';
corte(0).dispatchEvent({ type: 'input' });
run('agregarCorte()');
corte(1).value = '1200';
corte(1).dispatchEvent({ type: 'input' });
chipsDe(1)[0].click();                   // Busser en el segundo tramo
ok('tres bloques', d.querySelectorAll('#tramos .tramo').length === 3);
ok('y el resto se recalcula con el último corte',
   d.querySelectorAll('#tramos .resto')[0].textContent === '$600.00');

avisos.length = 0;
corte(1).value = '400';                  // hacia atrás
corte(1).dispatchEvent({ type: 'input' });
run('guardarTurno()');
ok('un cambio que va hacia atrás no se guarda', avisos.length === 1);

corte(1).value = '1200';
corte(1).dispatchEvent({ type: 'input' });
avisos.length = 0;
run('guardarTurno()');
// $500 al 4% = $20; $700 al 3% = $21; $600 al 6.5% = $39.
ok('con dos cambios suma los tres tramos', D().turnos[0].tipOut === 80);
ok('y guarda los tres', (D().turnos[0].tipoutTramos || []).length === 3);

run("irA('semana')"); dias()[0].click(); run('agregarCorte()');
ok('al tercer cambio el botón se apaga',
   d.getElementById('btn-corte').disabled === true);
ok('y no deja añadir un cuarto',
   (run('agregarCorte(); cortes.length')) === 3);

// --- Quitar un cambio ---
run('quitarCorte(0); quitarCorte(0); quitarCorte(0);');
ok('quitando los cambios vuelve a un solo bloque',
   d.querySelectorAll('#tramos .tramo').length === 1);
avisos.length = 0;
run('guardarTurno()');
ok('y al guardar el turno deja de llevar tramos',
   D().turnos[0].tipoutTramos === undefined);
ok('con el tip-out del equipo completo sobre todo el turno',
   D().turnos[0].tipOut === 117);

// --- Un turno de antes de que existieran los tramos ---
run(`datos.turnos = [{ id: 'viejo', fecha: '2026-08-04', entrada: '17:00',
       salida: '23:00', ventas: 1000, efectivo: 50, tarjeta: 100,
       tarifaHora: 8, tipOut: 65,
       tipoutDetalle: [{ rol: 'Busser', porcentaje: 3, monto: 30 },
                       { rol: 'Barra', porcentaje: 1.5, monto: 15 }] }];
     guardar(); irA('semana');`);
dias()[1].click();
ok('un turno guardado antes de los tramos abre con un solo bloque',
   d.querySelectorAll('#tramos .tramo').length === 1);
ok('y con sus ayudantes marcados', marcados(0) === 2);

// --- Renombrar un rol con tramos puestos ---
run('agregarCorte();');
chipsDe(0)[0].click();                   // Busser en el primer tramo
run(`cambiarRol('r1', 'nombre', 'Bus Boy')`);
ok('renombrar un rol lo mantiene marcado también dentro de un tramo',
   marcados(0) === 1);
run(`cambiarRol('r1', 'nombre', 'Busser')`);

// --- Borrar un rol con tramos puestos ---
run(`borrarRol('r3')`);
ok('borrar un rol lo saca de los tramos',
   (run('cortes[0].roles.includes("Runner")')) === false);

run(`datos.turnos = ${antesDeTramos}; datos.roles = [
       { id: 'r1', nombre: 'Busser', porcentaje: 3 },
       { id: 'r2', nombre: 'Barra',  porcentaje: 1.5 },
       { id: 'r3', nombre: 'Runner', porcentaje: 1 },
       { id: 'r4', nombre: 'Bakery', porcentaje: 1 }
     ]; cortes = []; guardar(); irA('semana');`);


/* --------------------------------------------------------------------------
   El incentivo

   Un campo opcional en el turno y una métrica en la semana. Lo que más se
   vigila no es que sume: es que un campo en blanco y un 0 escrito sigan
   siendo cosas distintas de punta a punta —del formulario al guardado, del
   guardado a la línea de "en 4 de 6 turnos" y de vuelta al formulario—.

   Este grupo pisa turnos y el trabajo, así que los devuelve al terminar.
   -------------------------------------------------------------------------- */
grupo('El incentivo');

const antesDeIncentivo = JSON.stringify(D().turnos);
const trabajoAntes = JSON.stringify(D().trabajo);
run("datos.turnos = []; irA('semana')");

// --- Apagado, no existe ---
dias()[0].click();
ok('apagado, el campo no se ve en el turno',
   d.getElementById('campo-incentivo')._classes.has('oculto'));
run("cerrarTurno(); irA('ajustes')");
ok('y el campo del nombre tampoco',
   d.getElementById('campo-nombre-incentivo')._classes.has('oculto'));
run("irA('semana')");
ok('la métrica no está', cuantasMetricas('metricas-extras') === 6);
run("irA('ajustes')");

// --- Encenderlo ---
d.getElementById('a-incentivo').checked = true;
run('cambiarIncentivo()');
ok('encendido, aparece el campo del nombre',
   !d.getElementById('campo-nombre-incentivo')._classes.has('oculto'));
/* `pintarSemana()` solo corre estando en la semana, así que hay que volver
   allí antes de mirar las métricas. Leerlas desde Ajustes devuelve el HTML de
   la última vez que se pintó, que es de antes de este cambio. */
run("irA('semana')");
ok('y la métrica se suma a las estadísticas',
   cuantasMetricas('metricas-extras') === 7);
ok('con el nombre de fábrica', texto('metricas-extras').includes('Puntos'));

dias()[0].click();
ok('el campo ya se ve en el turno',
   !d.getElementById('campo-incentivo')._classes.has('oculto'));
ok('con su etiqueta puesta',
   texto('lbl-incentivo') === 'Puntos');

// --- Un turno con puntos ---
set('f-entrada', '17:00'); set('f-salida', '23:00');
set('f-ventas', '900'); set('f-efectivo', '60'); set('f-tarjeta', '90');
set('f-incentivo', '12');
avisos.length = 0;
run('guardarTurno()');
ok('guarda los puntos con el turno', D().turnos[0].incentivo === 12);
ok('sin avisos', avisos.length === 0);

// --- Un turno sin anotar nada ---
dias()[1].click();
set('f-entrada', '17:00'); set('f-salida', '23:00');
set('f-ventas', '800'); set('f-efectivo', '50'); set('f-tarjeta', '70');
run('guardarTurno()');
/* La clave NO existe, no vale 0. Es lo que separa "no vendí nada" de "no lo
   apunté", y de eso depende que la línea de abajo diga la verdad. */
ok('un turno sin anotar no guarda el campo',
   D().turnos[1].incentivo === undefined);

run("irA('semana')");
ok('la semana suma solo lo anotado', texto('metricas-extras').includes('12'));
ok('y avisa de que falta un turno por anotar',
   texto('metricas-extras').includes('en 1 de 2 turnos'));

// --- Un cero escrito a mano ---
dias()[1].click();
set('f-incentivo', '0');
run('guardarTurno()');
ok('un 0 escrito sí se guarda', D().turnos[1].incentivo === 0);
run("irA('semana')");
ok('y entonces ya no falta ninguno',
   !texto('metricas-extras').includes('de 2 turnos'));

dias()[1].click();
ok('al reabrirlo, el 0 vuelve a verse en el campo',
   d.getElementById('f-incentivo').value === '0');
run('cerrarTurno()');

// --- Lo que no se puede escribir ---
dias()[0].click();
avisos.length = 0;
set('f-incentivo', 'doce');
run('guardarTurno()');
ok('un valor ilegible no se guarda', avisos.length === 1);
ok('y el aviso lo llama por su nombre', avisos[0].includes('Puntos'));
ok('el turno conserva lo que ya tenía', D().turnos[0].incentivo === 12);

set('f-incentivo', '12,5');
avisos.length = 0;
run('guardarTurno()');
ok('con coma decimal entra igual que en los demás campos',
   D().turnos[0].incentivo === 12.5);

// --- El nombre, que es lo que lo hace servir en otro restaurante ---
run("irA('ajustes')");
d.getElementById('a-incentivo-nombre').value = 'Botellas';
run('guardarNombreIncentivo()');
run("irA('semana')");
ok('el nombre elegido manda en la métrica',
   texto('metricas-extras').includes('Botellas'));
dias()[0].click();
ok('y también en el campo del turno', texto('lbl-incentivo') === 'Botellas');

avisos.length = 0;
set('f-incentivo', 'x');
run('guardarTurno()');
ok('y en el aviso de error', avisos[0].includes('Botellas'));

run("irA('ajustes')");
d.getElementById('a-incentivo-nombre').value = '   ';
run('guardarNombreIncentivo()');
run("irA('semana')");
ok('un nombre de solo espacios cae al de fábrica, no deja la etiqueta en blanco',
   texto('metricas-extras').includes('Puntos'));

// --- Apagarlo no borra nada ---
run("irA('ajustes')");
d.getElementById('a-incentivo').checked = false;
run('cambiarIncentivo()');
run("irA('semana')");
ok('apagado, la métrica se va', cuantasMetricas('metricas-extras') === 6);
ok('pero los números siguen en los turnos', D().turnos[0].incentivo === 12.5);

run("irA('ajustes')");
d.getElementById('a-incentivo').checked = true;
run('cambiarIncentivo()');
run("irA('semana')");
ok('y al volver a encenderlo están todos ahí',
   texto('metricas-extras').includes('12.5'));

run(`datos.turnos = ${antesDeIncentivo}; datos.trabajo = ${trabajoAntes};
     guardar(); irA('semana');`);


/* ========================================================================== */
console.log('\n' + '-'.repeat(52));
if (falladas === 0) {
  console.log(`Todo bien: ${pasadas} comprobaciones pasaron.`);
} else {
  console.log(`${pasadas} pasaron, ${falladas} FALLARON.`);
  process.exit(1);
}
