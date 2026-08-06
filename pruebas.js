/* ============================================================================
   PRUEBAS — Tips Control
   ----------------------------------------------------------------------------
   Se corren desde la Terminal, parado en la carpeta del proyecto:

       node pruebas.js

   Si todo está bien, imprime una lista de ✓ y termina. Si algo se rompió,
   imprime ✗ con lo que esperaba y lo que recibió, y termina con error.

   Para qué sirve esto: dentro de un mes vas a cambiar una fórmula y no vas a
   acordarte de que otra dependía de ella. Estas pruebas se acuerdan por ti.
   Córrelas SIEMPRE después de tocar logica.js.
   ========================================================================== */

const L = require('./logica.js');

let pasadas = 0;
let falladas = 0;

/** Compara lo que dio la función con lo que debería dar. */
function probar(nombre, recibido, esperado) {
  const iguales = JSON.stringify(recibido) === JSON.stringify(esperado);
  if (iguales) {
    pasadas++;
    console.log(`  ✓ ${nombre}`);
  } else {
    falladas++;
    console.log(`  ✗ ${nombre}`);
    console.log(`      esperaba: ${JSON.stringify(esperado)}`);
    console.log(`      recibió : ${JSON.stringify(recibido)}`);
  }
}

function grupo(titulo) {
  console.log(`\n${titulo}`);
}


/* --------------------------------------------------------------------------
   Horas trabajadas
   -------------------------------------------------------------------------- */
grupo('Horas trabajadas');

probar('turno normal de tarde',
  L.calcularHoras('17:00', '23:00'), 6);

probar('con media hora',
  L.calcularHoras('16:30', '23:00'), 6.5);

probar('cruzando la medianoche (el caso que más se rompe)',
  L.calcularHoras('17:00', '01:00'), 8);

probar('cruzando la medianoche con minutos',
  L.calcularHoras('18:15', '02:45'), 8.5);

probar('turno de brunch',
  L.calcularHoras('09:00', '15:30'), 6.5);

probar('horas vacías no rompen nada',
  L.calcularHoras('', ''), 0);

probar('hora con formato inválido devuelve 0',
  L.calcularHoras('25:00', '30:99'), 0);


/* --------------------------------------------------------------------------
   Tip-out
   -------------------------------------------------------------------------- */
grupo('Tip-out');

const ROLES = [
  { nombre: 'Busser',  porcentaje: 3 },
  { nombre: 'Barra',   porcentaje: 1.5 },
  { nombre: 'Runner',  porcentaje: 1 },
  { nombre: 'Bakery',  porcentaje: 1 }
];

probar('los cuatro roles sobre $1200 = 6.5%',
  L.calcularTipOut(1200, ROLES).total, 78);

probar('sin bakery baja a 5.5%',
  L.calcularTipOut(1200, ROLES.filter(r => r.nombre !== 'Bakery')).total, 66);

probar('el desglose dice quién se llevó cuánto',
  L.calcularTipOut(1200, ROLES).detalle,
  [
    { rol: 'Busser', porcentaje: 3,   monto: 36 },
    { rol: 'Barra',  porcentaje: 1.5, monto: 18 },
    { rol: 'Runner', porcentaje: 1,   monto: 12 },
    { rol: 'Bakery', porcentaje: 1,   monto: 12 }
  ]);

// Sumamos el desglose con `redondear` por la misma razón que la función lo usa
// por dentro: sumar 27.22 + 12.56 + 8.37 + 8.37 en JavaScript da
// 54.419999999999995. El centavo fantasma es del lenguaje, no de la fórmula.
probar('el desglose siempre suma exactamente el total',
  L.redondear(L.calcularTipOut(837.43, ROLES).detalle.reduce((s, d) => s + d.monto, 0)),
  L.calcularTipOut(837.43, ROLES).total);

probar('sin ayudantes no se paga tip-out',
  L.calcularTipOut(1200, []).total, 0);

probar('sin ventas no se paga tip-out',
  L.calcularTipOut(0, ROLES).total, 0);

probar('redondea a centavos, no deja fracciones de centavo',
  L.calcularTipOut(1033.33, [{ nombre: 'Busser', porcentaje: 3 }]).total, 31);


/* --------------------------------------------------------------------------
   El turno completo
   -------------------------------------------------------------------------- */
grupo('Turno completo');

// Turno de referencia: 6 horas, $1200 en ventas, $180 de propina, 6.5% tip-out.
const TURNO = {
  fecha: '2026-08-06',
  entrada: '17:00',
  salida: '23:00',
  ventas: 1200,
  efectivo: 60,
  tarjeta: 120,
  tarifaHora: 10,
  tipOut: 78
};

const c = L.calcularTurno(TURNO);

probar('horas',                  c.horas, 6);
probar('propinas totales',       c.propinas, 180);
probar('neto de propinas',       c.netoPropinas, 102);      // 180 - 78
probar('sueldo base',            c.sueldoBase, 60);         // 6 h x $10
probar('total que te llevaste',  c.totalNeto, 162);         // 102 + 60
probar('propina por hora',       c.propinaPorHora, 17);     // 102 / 6
probar('ingreso total por hora', c.totalPorHora, 27);       // 162 / 6
probar('% de propina sobre ventas', c.porcentajeVentas, 15);// 180 / 1200

probar('un turno vacío no rompe la app',
  L.calcularTurno({}).totalNeto, 0);

probar('sin horas no se divide por cero',
  L.calcularTurno({ efectivo: 100 }).propinaPorHora, 0);

probar('sin ventas el porcentaje es 0, no Infinity',
  L.calcularTurno({ efectivo: 100, ventas: 0 }).porcentajeVentas, 0);

probar('un turno puede dar negativo si el tip-out supera la propina',
  L.calcularTurno({ entrada: '17:00', salida: '23:00',
                    efectivo: 20, tipOut: 50 }).netoPropinas, -30);


/* --------------------------------------------------------------------------
   Resumen de varios turnos
   -------------------------------------------------------------------------- */
grupo('Resumen de varios turnos');

// Dos turnos a propósito muy distintos: una cena larga y un brunch corto pero
// más rentable por hora. Si fueran parecidos, la prueba del promedio ponderado
// pasaría por casualidad y no probaría nada.
const CENA   = TURNO;                                    // 6 h → $162 → $27/h
const BRUNCH = { fecha: '2026-08-07', entrada: '11:00', salida: '15:00',
                 ventas: 900, efectivo: 40, tarjeta: 140,
                 tarifaHora: 10, tipOut: 58.5 };         // 4 h → $161.5 → $40.38/h

const r = L.resumir([CENA, BRUNCH]);

probar('cuenta los turnos',        r.turnos, 2);
probar('suma las horas',           r.horas, 10);            // 6 + 4
probar('suma las ventas',          r.ventas, 2100);
probar('suma las propinas',        r.propinas, 360);
probar('suma el tip-out',          r.tipOut, 136.5);
probar('suma el neto de propinas', r.netoPropinas, 223.5);  // 102 + 121.5
probar('suma el total neto',       r.totalNeto, 323.5);     // 162 + 161.5

probar('el promedio por hora pesa las horas, no los turnos',
  r.totalPorHora, 32.35);                                   // 323.5 / 10

probar('promedio por turno',       r.promedioPorTurno, 161.75);

probar('una lista vacía devuelve ceros, no error',
  L.resumir([]).totalNeto, 0);

// Esta es la que justifica el comentario en logica.js. Promediar las tasas de
// cada turno daría $33.69/h: le daría al brunch de 4 horas el mismo peso que a
// la cena de 6 y te haría creer que ganas más de lo que ganas.
probar('NO es el promedio de los promedios',
  L.redondear((27 + 40.38) / 2) !== r.totalPorHora, true);


/* --------------------------------------------------------------------------
   Fechas
   -------------------------------------------------------------------------- */
grupo('Semanas');

probar('el lunes de un jueves',    L.lunesDeLaSemana('2026-08-06'), '2026-08-03');
probar('el lunes de un lunes es él mismo', L.lunesDeLaSemana('2026-08-03'), '2026-08-03');
probar('el domingo pertenece a la semana que empezó el lunes',
  L.lunesDeLaSemana('2026-08-09'), '2026-08-03');
probar('cruzando el cambio de mes',
  L.lunesDeLaSemana('2026-09-02'), '2026-08-31');


/* --------------------------------------------------------------------------
   Resultado
   -------------------------------------------------------------------------- */
console.log(`\n${'─'.repeat(50)}`);
if (falladas === 0) {
  console.log(`Todo bien: ${pasadas} pruebas pasaron.`);
} else {
  console.log(`${pasadas} pasaron, ${falladas} FALLARON.`);
  process.exit(1);   // avisa a la Terminal que algo salió mal
}
