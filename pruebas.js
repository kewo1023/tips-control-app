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
probar('separa el efectivo',       r.efectivo, 100);       // 60 + 40
probar('separa la tarjeta',        r.tarjeta, 260);        // 120 + 140
probar('efectivo + tarjeta = propinas', r.efectivo + r.tarjeta, r.propinas);
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

probar('la semana siguiente',
  L.sumarDias('2026-08-03', 7), '2026-08-10');
probar('la semana anterior',
  L.sumarDias('2026-08-03', -7), '2026-07-27');
probar('sumar días cruzando el fin de mes',
  L.sumarDias('2026-08-30', 3), '2026-09-02');
probar('sumar días cruzando el fin de año',
  L.sumarDias('2026-12-30', 3), '2027-01-02');
probar('febrero de un año bisiesto',
  L.sumarDias('2028-02-28', 1), '2028-02-29');

probar('los 7 días de una semana',
  L.diasDeLaSemana('2026-08-03'),
  ['2026-08-03','2026-08-04','2026-08-05','2026-08-06',
   '2026-08-07','2026-08-08','2026-08-09']);

probar('los turnos de un día',
  L.turnosDelDia([{fecha:'2026-08-06'}, {fecha:'2026-08-07'}], '2026-08-06').length, 1);
probar('un día sin turnos devuelve lista vacía',
  L.turnosDelDia([{fecha:'2026-08-06'}], '2026-08-09').length, 0);


/* --------------------------------------------------------------------------
   Atajos de hora
   -------------------------------------------------------------------------- */
grupo('Horas frecuentes');

const HISTORIAL = [
  { entrada: '10:00', salida: '17:30' },
  { entrada: '10:00', salida: '22:45' },
  { entrada: '16:00', salida: '23:10' },
  { entrada: '10:00', salida: '23:10' },
  { entrada: '07:00', salida: '15:00' }
];

probar('la hora de entrada más usada va primero',
  L.horasFrecuentes(HISTORIAL, 'entrada')[0], '10:00');

probar('las devuelve ordenadas por frecuencia',
  L.horasFrecuentes(HISTORIAL, 'entrada'), ['10:00', '07:00', '16:00']);

probar('empatadas, gana la más temprana (el orden no debe bailar)',
  L.horasFrecuentes(HISTORIAL, 'salida').slice(0, 2), ['23:10', '15:00']);

probar('respeta el máximo pedido',
  L.horasFrecuentes(HISTORIAL, 'salida', 2).length, 2);

probar('sin historial no propone nada',
  L.horasFrecuentes([], 'entrada'), []);

probar('ignora los turnos sin hora',
  L.horasFrecuentes([{ entrada: '' }, { entrada: '09:00' }], 'entrada'), ['09:00']);

grupo('Mejor turno');

probar('encuentra el turno que más dejó',
  L.mejorTurno([CENA, BRUNCH], true).fecha, CENA.fecha);      // 162 contra 161.5

probar('sin turnos devuelve nada',
  L.mejorTurno([]), null);


/* --------------------------------------------------------------------------
   Qué cifra es "lo que me llevé"

   Por defecto el sueldo por hora NO se suma: llega en el cheque, semanas
   después y con las retenciones ya quitadas, así que sumarlo a la noche da un
   número que nunca se ve entero.
   -------------------------------------------------------------------------- */
grupo('La cifra principal');

const TURNO_MIXTO = {
  fecha: '2026-08-05', entrada: '17:00', salida: '23:00',
  ventas: 1000, efectivo: 40, tarjeta: 160, tarifaHora: 8, tipOut: 65
};
// A mano: 6 h · propinas 200 · tip-out 65 → netoPropinas 135
//         sueldo 6 × 8 = 48 → totalNeto 183
const C = L.calcularTurno(TURNO_MIXTO);

probar('la cuenta de partida es la esperada', [C.netoPropinas, C.sueldoBase, C.totalNeto],
  [135, 48, 183]);

probar('sin contar el sueldo, el total son las propinas netas',
  L.cifrasPrincipales(C, false).total, 135);

probar('contándolo, sube al total con sueldo',
  L.cifrasPrincipales(C, true).total, 183);

probar('el por hora también cambia de criterio',
  [L.cifrasPrincipales(C, false).porHora, L.cifrasPrincipales(C, true).porHora],
  [22.5, 30.5]);

probar('lo que no se cuenta no se pierde: el sueldo sigue calculado',
  C.sueldoBase, 48);

probar('sin argumentos no revienta',
  L.cifrasPrincipales(null, false), { total: 0, porHora: 0 });

/* El mejor día tiene que ordenar con el mismo criterio que la pantalla, o dirá
   que el mejor fue un día que no es el de la cifra más alta.
   CORTO: 3 h, propinas netas 150, sueldo 24 → 174
   LARGO: 9 h, propinas netas 140, sueldo 72 → 212
   Sin contar el sueldo gana CORTO; contándolo gana LARGO. */
const CORTO = { fecha: '2026-08-05', entrada: '18:00', salida: '21:00',
                ventas: 0, efectivo: 150, tarjeta: 0, tarifaHora: 8, tipOut: 0 };
const LARGO = { fecha: '2026-08-06', entrada: '14:00', salida: '23:00',
                ventas: 0, efectivo: 140, tarjeta: 0, tarifaHora: 8, tipOut: 0 };

probar('sin contar el sueldo, el mejor es el de más propinas',
  L.mejorTurno([CORTO, LARGO], false).fecha, CORTO.fecha);

probar('contándolo, gana el turno largo',
  L.mejorTurno([CORTO, LARGO], true).fecha, LARGO.fecha);


/* --------------------------------------------------------------------------
   El efectivo neto
   --------------------------------------------------------------------------
   El desastre que vigila este grupo no es un número feo: es descontar el
   tip-out DOS veces, una en el total y otra en el efectivo. Por separado los
   dos números seguirían pareciendo razonables, y la app estaría restando de
   más sin que nada se queje. Por eso la primera prueba no es "¿resta bien?"
   sino "¿las partes siguen sumando el mismo total de siempre?".

   Los dos ejemplos son los de Kev, tal cual los contó:
     tarjeta 200, efectivo 100, tip-out  80 → en efectivo me quedan  20
     tarjeta 200, efectivo 100, tip-out 140 → pongo 40 de mi cartera: −40
   -------------------------------------------------------------------------- */
grupo('El efectivo neto');

const BUENA = L.calcularTurno({ fecha: '2026-08-05', entrada: '17:00',
  salida: '23:00', ventas: 2000, efectivo: 100, tarjeta: 200, tipOut: 80 });
const MALA = L.calcularTurno({ fecha: '2026-08-05', entrada: '17:00',
  salida: '23:00', ventas: 2000, efectivo: 100, tarjeta: 200, tipOut: 140 });

probar('las partes suman el neto, no lo restan dos veces',
  [BUENA.efectivoNeto + BUENA.tarjeta, BUENA.netoPropinas], [220, 220]);

probar('y siguen sumándolo cuando el efectivo queda negativo',
  [MALA.efectivoNeto + MALA.tarjeta, MALA.netoPropinas], [160, 160]);

probar('el tip-out sale del efectivo', BUENA.efectivoNeto, 20);

probar('si el tip-out se pasa, el efectivo es negativo, no cero',
  MALA.efectivoNeto, -40);

probar('el efectivo en bruto se sigue calculando aparte',
  [BUENA.efectivo, MALA.efectivo], [100, 100]);

probar('y el total del turno no se mueve por nada de esto',
  [BUENA.netoPropinas, MALA.netoPropinas], [220, 160]);

/* La elección. Igual que con el sueldo, la lógica calcula las dos y la pantalla
   escoge; aquí no se recalcula nada. */
probar('donde el tip-out se paga en efectivo, se muestra el neto',
  L.efectivoMostrado(MALA, true), -40);

probar('donde lo descuenta el cheque, se muestra el bruto',
  L.efectivoMostrado(MALA, false), 100);

probar('sin argumentos no revienta', L.efectivoMostrado(null, true), 0);

/* Y en la semana se acumula igual: dos noches malas dejan el efectivo en −80.
   Si en vez de sumar los netos de cada turno se restara el tip-out del total al
   final, este número saldría igual — pero dejaría de cuadrar con la suma de los
   días a mano en cuanto hubiera centavos de por medio. */
const SEMANA_MALA = L.resumir([
  { fecha: '2026-08-05', entrada: '17:00', salida: '23:00', ventas: 2000,
    efectivo: 100, tarjeta: 200, tipOut: 140 },
  { fecha: '2026-08-06', entrada: '17:00', salida: '23:00', ventas: 2000,
    efectivo: 100, tarjeta: 200, tipOut: 140 }
]);

probar('la semana acumula el efectivo neto', SEMANA_MALA.efectivoNeto, -80);

probar('sin tocar el efectivo en bruto', SEMANA_MALA.efectivo, 200);

probar('y las partes de la semana también suman su neto',
  [SEMANA_MALA.efectivoNeto + SEMANA_MALA.tarjeta, SEMANA_MALA.netoPropinas],
  [320, 320]);


/* --------------------------------------------------------------------------
   Fusionar un respaldo con lo que ya hay

   Estas pruebas son las más importantes del archivo. Todas las demás
   comprueban que una cuenta dé bien; estas comprueban que nadie pierda su
   historial ni vea dinero que no ganó.
   -------------------------------------------------------------------------- */
grupo('Turno válido');

probar('un turno con fecha en regla pasa',
  L.turnoValido({ id: 'a', fecha: '2026-08-05' }), true);

probar('sin fecha no pasa',
  L.turnoValido({ id: 'a' }), false);

probar('con la fecha al revés no pasa',
  L.turnoValido({ id: 'a', fecha: '05/08/2026' }), false);

probar('un texto suelto no es un turno',
  L.turnoValido('2026-08-05'), false);

probar('nada no es un turno',
  L.turnoValido(null), false);


grupo('Fusionar turnos');

/* Un turno del teléfono y su gemelo del archivo: mismo id, pero el del archivo
   trae las ventas de antes de una corrección. */
const EN_TELEFONO = { id: 'uno', fecha: '2026-08-05', ventas: 1000,
                      efectivo: 40, tarjeta: 160, entrada: '17:00',
                      salida: '23:00', tarifaHora: 8, tipOut: 65 };
const MISMO_ID    = { ...EN_TELEFONO, ventas: 900, tarjeta: 100 };
const MISMA_FECHA = { ...EN_TELEFONO, id: 'otro' };
const DIA_NUEVO   = { ...EN_TELEFONO, id: 'dos', fecha: '2026-08-06' };
const DIA_VIEJO   = { ...EN_TELEFONO, id: 'tres', fecha: '2026-08-01' };

probar('en un teléfono vacío entra todo el archivo',
  L.fusionarTurnos([], [DIA_VIEJO, DIA_NUEVO]).agregados, 2);

probar('un archivo vacío no quita nada',
  L.fusionarTurnos([EN_TELEFONO], []).turnos.length, 1);

probar('un día que no existía se agrega',
  L.fusionarTurnos([EN_TELEFONO], [DIA_NUEVO]).agregados, 1);

probar('el mismo turno dos veces no se duplica',
  L.fusionarTurnos([EN_TELEFONO], [MISMO_ID]).turnos.length, 1);

probar('y se cuenta como omitido, no como agregado',
  L.fusionarTurnos([EN_TELEFONO], [MISMO_ID]).omitidos, 1);

/* El corazón del asunto: gana lo que está en el teléfono. Si el archivo
   pisara al turno corregido, la corrección se perdería sin avisar. */
probar('ante el mismo id manda el teléfono, no el archivo',
  L.fusionarTurnos([EN_TELEFONO], [MISMO_ID]).turnos[0].ventas, 1000);

probar('dos registros distintos del mismo día: solo queda uno',
  L.fusionarTurnos([EN_TELEFONO], [MISMA_FECHA]).turnos.length, 1);

probar('y el que queda es el del teléfono',
  L.fusionarTurnos([EN_TELEFONO], [MISMA_FECHA]).turnos[0].id, 'uno');

/* La prueba que justifica toda la regla: si el turno del 5 de agosto entrara
   dos veces, el neto de esa semana saldría al doble y nadie lo notaría. */
probar('fusionar no infla el neto',
  L.resumir(L.fusionarTurnos([EN_TELEFONO], [MISMA_FECHA, MISMO_ID]).turnos).totalNeto,
  L.resumir([EN_TELEFONO]).totalNeto);

probar('dos turnos del archivo el mismo día: entra uno',
  L.fusionarTurnos([], [DIA_NUEVO, { ...DIA_NUEVO, id: 'cuatro' }]).agregados, 1);

probar('la basura del archivo se descarta',
  L.fusionarTurnos([], [DIA_NUEVO, { id: 'x' }, null]).invalidos, 2);

probar('y no llega a la lista',
  L.fusionarTurnos([], [DIA_NUEVO, { id: 'x' }, null]).turnos.length, 1);

probar('el resultado queda ordenado por fecha',
  L.fusionarTurnos([DIA_NUEVO], [DIA_VIEJO]).turnos.map(t => t.fecha),
  ['2026-08-01', '2026-08-06']);

probar('un turno roto que ya estaba guardado también se limpia',
  L.fusionarTurnos([{ id: 'malo' }], []).turnos.length, 0);

probar('sin argumentos no revienta',
  L.fusionarTurnos(undefined, undefined).turnos, []);


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
