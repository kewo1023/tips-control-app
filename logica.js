/* ============================================================================
   LÓGICA — Tips Control
   ----------------------------------------------------------------------------
   Aquí viven SOLO los cálculos. Ni una línea que toque la pantalla, ni una que
   guarde datos. ¿Por qué separado?

   Porque este archivo es el que se puede probar. Una función que solo recibe
   números y devuelve números se puede correr desde la Terminal con `node
   pruebas.js` y comprobar que da lo correcto. Una función que además pinta un
   botón, no: necesitaría un navegador.

   En Excel sería la diferencia entre la celda con la fórmula y el formato de
   la celda. Aquí está la fórmula; el color y el tamaño están en index.html.
   ========================================================================== */


/* --- Dinero -------------------------------------------------------------- */

/**
 * Redondea a centavos.
 *
 * Los decimales en programación mienten un poco: 0.1 + 0.2 no da 0.3, da
 * 0.30000000000000004. Con dinero eso se convierte en un centavo perdido que
 * aparece meses después en un total que no cuadra. Redondeamos en cada paso
 * donde el resultado ya "es plata" y no una cuenta intermedia.
 */
function redondear(n) {
  if (!isFinite(n)) return 0;
  return Math.round(n * 100) / 100;
}


/* --- Tiempo -------------------------------------------------------------- */

/**
 * Convierte "17:30" en minutos desde medianoche (1050).
 * Trabajar con un solo número es más fácil que con horas y minutos por
 * separado: restar dos números es una operación, restar dos relojes son tres.
 */
function horaAMinutos(hora) {
  if (typeof hora !== 'string' || !hora.includes(':')) return null;
  const [h, m] = hora.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

/**
 * Horas trabajadas entre dos horas del reloj.
 *
 * El caso que importa: entras 5:00 PM y sales 1:00 AM. En el reloj la salida
 * es "menor" que la entrada, pero trabajaste 8 horas, no -16. Cuando eso pasa,
 * sumamos un día completo (1440 minutos). Sin esta línea, todos tus turnos de
 * noche darían negativo y arrastrarían el resto de los cálculos.
 */
function calcularHoras(entrada, salida) {
  const ini = horaAMinutos(entrada);
  const fin = horaAMinutos(salida);
  if (ini === null || fin === null) return 0;

  let minutos = fin - ini;
  if (minutos < 0) minutos += 24 * 60;   // el turno cruzó la medianoche

  return Math.round((minutos / 60) * 100) / 100;
}


/* --- Tip-out ------------------------------------------------------------- */

/**
 * Reparte el tip-out entre los roles que trabajaron ese turno.
 *
 * Regla del restaurante de Kev: cada rol tiene un porcentaje fijo que se
 * calcula sobre las VENTAS TOTALES del turno. Si un rol no estuvo, su
 * porcentaje simplemente no se suma; los demás no reciben más por eso.
 *
 * Devuelve el detalle además del total. El total se podría recalcular, pero el
 * detalle no: si el mes que viene el busser pasa de 3% a 3.5%, los turnos
 * viejos tienen que seguir contando lo que de verdad se pagó ese día.
 *
 * @param {number} ventas  ventas totales del turno
 * @param {Array}  roles   [{ nombre: 'Busser', porcentaje: 3 }, ...]
 * @returns {{ total: number, detalle: Array }}
 */
function calcularTipOut(ventas, roles) {
  const base = Number(ventas) || 0;
  const lista = Array.isArray(roles) ? roles : [];

  const detalle = lista.map(rol => {
    const pct = Number(rol.porcentaje) || 0;
    return {
      rol: rol.nombre,
      porcentaje: pct,
      // Redondeamos cada monto por separado, no al final. Es plata que se
      // entrega de verdad a una persona: si el desglose sumara $77.99 y el
      // total dijera $78.00, el que sobra no existe en ningún bolsillo.
      monto: redondear(base * pct / 100)
    };
  });

  const total = redondear(detalle.reduce((suma, d) => suma + d.monto, 0));

  return { total, detalle };
}


/* --- El turno completo --------------------------------------------------- */

/**
 * Toma un turno guardado y devuelve todo lo que se puede deducir de él.
 *
 * Nada de esto se guarda: se calcula cada vez que se dibuja la pantalla. Si se
 * guardara, existirían dos verdades (el dato y su resumen) y tarde o temprano
 * dejarían de coincidir.
 *
 * @param {Object} turno { ventas, efectivo, tarjeta, entrada, salida,
 *                         tarifaHora, tipOut }
 */
function calcularTurno(turno) {
  const t = turno || {};

  const ventas    = Number(t.ventas)   || 0;
  const efectivo  = Number(t.efectivo) || 0;
  const tarjeta   = Number(t.tarjeta)  || 0;
  const tipOut    = Number(t.tipOut)   || 0;
  const tarifa    = Number(t.tarifaHora) || 0;

  const horas     = calcularHoras(t.entrada, t.salida);
  const propinas  = redondear(efectivo + tarjeta);

  // Lo que te queda de propinas después de repartir.
  const netoPropinas = redondear(propinas - tipOut);

  // El sueldo por hora del restaurante, aparte de las propinas.
  const sueldoBase = redondear(horas * tarifa);

  // Lo que de verdad te llevaste ese día.
  const totalNeto = redondear(netoPropinas + sueldoBase);

  return {
    horas,
    propinas,
    tipOut: redondear(tipOut),
    netoPropinas,
    sueldoBase,
    totalNeto,

    // Las dos métricas que responden "¿me convino este turno?".
    // Si horas es 0 devolvemos 0 en vez de infinito: dividir por cero no
    // rompe JavaScript, devuelve Infinity, y eso se imprime en pantalla como
    // "Infinity" y asusta a quien lo lea.
    propinaPorHora: horas > 0 ? redondear(netoPropinas / horas) : 0,
    totalPorHora:   horas > 0 ? redondear(totalNeto / horas)    : 0,

    // Porcentaje de propina sobre lo que vendiste. La medida de qué tan bien
    // te fue con los clientes, independiente de cuánto vendió el restaurante.
    porcentajeVentas: ventas > 0 ? redondear(propinas / ventas * 100) : 0
  };
}


/* --- Resúmenes de varios turnos ------------------------------------------ */

/**
 * Suma un conjunto de turnos (una semana, un mes, todo).
 * Ojo con el promedio por hora: NO es el promedio de los promedios de cada
 * turno, es el total dividido entre el total de horas. Un turno de 3 horas y
 * uno de 9 no pesan igual, y promediar sus tasas le daría al corto la misma
 * importancia que al largo.
 */
function resumir(turnos) {
  const lista = Array.isArray(turnos) ? turnos : [];

  const acc = lista.reduce((a, turno) => {
    const c = calcularTurno(turno);
    a.turnos       += 1;
    a.horas        += c.horas;
    a.ventas       += Number(turno.ventas) || 0;
    a.propinas     += c.propinas;
    // Efectivo y tarjeta van separados a propósito: la propina de tarjeta
    // llega en el cheque (y paga impuestos ahí), la de efectivo va directa al
    // bolsillo. Sumadas son un número que no sirve para planear nada.
    a.efectivo     += Number(turno.efectivo) || 0;
    a.tarjeta      += Number(turno.tarjeta)  || 0;
    a.tipOut       += c.tipOut;
    a.netoPropinas += c.netoPropinas;
    a.sueldoBase   += c.sueldoBase;
    a.totalNeto    += c.totalNeto;
    return a;
  }, { turnos: 0, horas: 0, ventas: 0, propinas: 0, efectivo: 0, tarjeta: 0,
       tipOut: 0, netoPropinas: 0, sueldoBase: 0, totalNeto: 0 });

  acc.horas        = redondear(acc.horas);
  acc.ventas       = redondear(acc.ventas);
  acc.propinas     = redondear(acc.propinas);
  acc.efectivo     = redondear(acc.efectivo);
  acc.tarjeta      = redondear(acc.tarjeta);
  acc.tipOut       = redondear(acc.tipOut);
  acc.netoPropinas = redondear(acc.netoPropinas);
  acc.sueldoBase   = redondear(acc.sueldoBase);
  acc.totalNeto    = redondear(acc.totalNeto);

  acc.propinaPorHora   = acc.horas  > 0 ? redondear(acc.netoPropinas / acc.horas) : 0;
  acc.totalPorHora     = acc.horas  > 0 ? redondear(acc.totalNeto / acc.horas)    : 0;
  acc.porcentajeVentas = acc.ventas > 0 ? redondear(acc.propinas / acc.ventas * 100) : 0;
  acc.promedioPorTurno = acc.turnos > 0 ? redondear(acc.totalNeto / acc.turnos)   : 0;

  return acc;
}


/* --- Fechas -------------------------------------------------------------- */

/**
 * Devuelve el lunes de la semana de una fecha, como texto "2026-08-03".
 * Trabajamos con el texto de la fecha y no con objetos Date porque Date
 * interpreta zonas horarias: "2026-08-06" se puede convertir en el 5 de agosto
 * a las 7 PM según dónde estés, y de repente un turno cambia de semana solo.
 */
function lunesDeLaSemana(fechaTexto) {
  const [a, m, d] = String(fechaTexto).split('-').map(Number);
  const fecha = new Date(a, (m || 1) - 1, d || 1);
  const dia = fecha.getDay();              // 0 domingo, 1 lunes, ... 6 sábado
  const retroceder = (dia + 6) % 7;        // cuántos días hay que ir atrás
  fecha.setDate(fecha.getDate() - retroceder);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}


/**
 * Suma (o resta, con números negativos) días a una fecha en texto.
 * `new Date(a, m, d)` acepta días fuera de rango y se acomoda solo: el día 32
 * de agosto es el 1 de septiembre. Nos ahorra tener que saber cuántos días
 * tiene cada mes y acordarnos de los años bisiestos.
 */
function sumarDias(fechaTexto, dias) {
  const [a, m, d] = String(fechaTexto).split('-').map(Number);
  const fecha = new Date(a, (m || 1) - 1, (d || 1) + dias);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

/** Las 7 fechas de la semana que empieza ese lunes. */
function diasDeLaSemana(lunes) {
  return [0, 1, 2, 3, 4, 5, 6].map(i => sumarDias(lunes, i));
}

/**
 * Las horas que más se repiten en un campo (`entrada` o `salida`).
 *
 * Sirve para ofrecer atajos: si siempre entras a las 10:00, el botón "10:00"
 * ahorra abrir el selector de hora. En vez de adivinar los horarios típicos de
 * un restaurante, se los preguntamos a los turnos ya registrados.
 *
 * Empatados en frecuencia, gana la hora más temprana: así el orden de los
 * botones no baila de un día para otro, que sería peor que no tenerlos (la
 * memoria muscular vale más que el orden perfecto).
 */
function horasFrecuentes(turnos, campo, cuantas = 4) {
  const cuenta = {};
  (Array.isArray(turnos) ? turnos : []).forEach(t => {
    const hora = t[campo];
    if (hora) cuenta[hora] = (cuenta[hora] || 0) + 1;
  });
  return Object.keys(cuenta)
    .sort((a, b) => cuenta[b] - cuenta[a] || a.localeCompare(b))
    .slice(0, cuantas);
}

/**
 * Cuál de las cifras calculadas es "lo que me llevé".
 *
 * Hay dos respuestas legítimas y dependen de cómo cobre cada persona:
 *
 *   - **Sin contar el sueldo** (por defecto). Las propinas menos el tip-out, y
 *     ya. El sueldo por hora llega en el cheque semanas después y con las
 *     retenciones descontadas, así que sumarlo al total de la noche da un
 *     número que nunca se ve entero. Y un número inflado no lo cuestiona nadie:
 *     favorece a quien lo lee.
 *   - **Contándolo.** Para quien prefiera ver el ingreso bruto del turno
 *     completo, sueldo incluido.
 *
 * Las dos cifras ya venían calculadas por separado en `calcularTurno` y
 * `resumir`; esta función solo elige. Por eso el interruptor no recalcula nada
 * ni toca el historial: cambia lo que se pinta, no lo que se guardó.
 *
 * Sirve igual para un turno que para un resumen de la semana, porque ambos
 * devuelven las mismas cuatro claves.
 */
function cifrasPrincipales(calculo, contarSueldo) {
  const c = calculo || {};
  return contarSueldo
    ? { total: c.totalNeto     || 0, porHora: c.totalPorHora   || 0 }
    : { total: c.netoPropinas  || 0, porHora: c.propinaPorHora || 0 };
}

/**
 * El turno que más dejó, con el mismo criterio que se está mostrando.
 *
 * Si la app no cuenta el sueldo, el "mejor día" tampoco puede contarlo: un día
 * corto con propinas altas y otro largo con propinas flojas pueden intercambiar
 * el puesto según qué se sume. Que la pantalla diga que el mejor fue el martes
 * mientras la cifra más alta está en el jueves es de las cosas que hacen
 * desconfiar de toda la app, aunque las dos cuentas estén bien.
 */
function mejorTurno(turnos, contarSueldo) {
  const lista = Array.isArray(turnos) ? turnos : [];
  if (lista.length === 0) return null;
  const valor = t => cifrasPrincipales(calcularTurno(t), contarSueldo).total;
  return lista.reduce((mejor, t) => valor(t) > valor(mejor) ? t : mejor);
}

/** Los turnos de una fecha concreta. */
function turnosDelDia(turnos, fecha) {
  return (Array.isArray(turnos) ? turnos : []).filter(t => t.fecha === fecha);
}

/* --- Fusionar un respaldo con lo que ya hay ------------------------------ */

/**
 * ¿Tiene este turno la pinta mínima de ser un turno?
 *
 * No comprueba que los números sean razonables, solo que exista una fecha con
 * el formato correcto. Es lo imprescindible para poder colocarlo en un día del
 * calendario: sin fecha, un turno no se puede ni mostrar ni comparar.
 */
function turnoValido(turno) {
  return !!turno
      && typeof turno === 'object'
      && /^\d{4}-\d{2}-\d{2}$/.test(String(turno.fecha || ''));
}

/**
 * Mete los turnos de un archivo de respaldo entre los que ya están guardados.
 *
 * La regla es una sola y no tiene excepciones: **lo que está en el teléfono
 * nunca se toca.** El archivo solo puede agregar días que hoy están vacíos.
 *
 * ¿Por qué tan conservador? Porque un turno del archivo y uno del teléfono con
 * el mismo identificador pueden diferir por una edición, y no hay forma de
 * saber cuál es la buena: los turnos no guardan la hora en que se modificaron.
 * Sin ese dato, cualquier regla que decida "gana el archivo" está adivinando, y
 * adivinar con el dinero de otro no es una opción. Ante la duda, se conserva lo
 * que la persona tiene delante.
 *
 * Un turno se omite por dos motivos distintos:
 *
 *   - **Mismo id.** Es el mismo turno; ya está.
 *   - **Misma fecha, id distinto.** Son dos registros diferentes del mismo día,
 *     normalmente porque se creó uno en cada dispositivo. Este es el caso
 *     peligroso: si se agregaran los dos, la app sumaría dos veces las propinas
 *     de ese día. El modelo es de un turno por día justamente para que esto no
 *     pase. Y un total inflado es peor que uno incompleto: un turno que falta
 *     salta a la vista, un total de más nadie lo cuestiona, se lo cree.
 *
 * Devuelve las cuentas además de la lista, para poder decirle a la persona qué
 * pasó exactamente en vez de un "listo" que no significa nada.
 *
 * @param {Array} actuales   los turnos que ya están en el teléfono
 * @param {Array} importados los turnos que vienen del archivo
 * @returns {{ turnos, agregados, omitidos, invalidos }}
 */
function fusionarTurnos(actuales, importados) {
  const base  = (Array.isArray(actuales) ? actuales : []).filter(turnoValido);
  const nuevos = Array.isArray(importados) ? importados : [];

  // Dos índices para no recorrer la lista entera por cada turno del archivo.
  // Con 20 turnos daría igual; con tres años de historial, no.
  const ids    = new Set(base.map(t => t.id));
  const fechas = new Set(base.map(t => t.fecha));

  const resultado = base.slice();
  let agregados = 0, omitidos = 0, invalidos = 0;

  nuevos.forEach(turno => {
    if (!turnoValido(turno)) { invalidos++; return; }
    if (ids.has(turno.id) || fechas.has(turno.fecha)) { omitidos++; return; }

    resultado.push(turno);
    ids.add(turno.id);
    fechas.add(turno.fecha);   // dos turnos del archivo en el mismo día: entra uno
    agregados++;
  });

  // Ordenados por fecha, para que la lista guardada tenga siempre el mismo
  // orden venga de donde venga.
  resultado.sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

  return { turnos: resultado, agregados, omitidos, invalidos };
}


/* --- Para que node pueda probar este archivo ----------------------------- */
/* En el navegador estas funciones ya quedan disponibles al cargar el script.
   `module` solo existe cuando el archivo lo abre node, así que esta línea es
   invisible para el teléfono y necesaria para las pruebas. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    redondear, horaAMinutos, calcularHoras, calcularTipOut,
    calcularTurno, resumir, lunesDeLaSemana,
    sumarDias, diasDeLaSemana, turnosDelDia,
    horasFrecuentes, mejorTurno, cifrasPrincipales,
    turnoValido, fusionarTurnos
  };
}
