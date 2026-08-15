/* ============================================================================
   LÓGICA — Tips Control
   Copyright (c) 2026 Kevin Rincón. Todos los derechos reservados.
   Uso permitido de la app; copiar o modificar el código, no. Ver LICENSE.
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



/**
 * Convierte lo que una persona escribió en un campo en un número de verdad.
 *
 * Esto existe por un fallo que apareció en el teléfono de un compañero: su
 * teclado ofrecía una coma donde el de Kev ofrece un punto, escribió "3,5" en
 * el porcentaje de un ayudante y la app lo guardó como **0**. Sin avisar. Su
 * tip-out pasó a ser $0 y la app le dijo que se llevaba más dinero del que se
 * llevaba, que es la peor dirección posible del error.
 *
 * La causa de fondo era `Number(campo.value) || 0`. Esa línea parece
 * defensiva y no lo es: convierte tres situaciones distintas —vacío, ilegible
 * y un cero de verdad— en la misma respuesta. Por eso aquí se devuelven las
 * tres por separado y el que llama decide qué hacer con cada una.
 *
 * En Excel sería la diferencia entre una celda vacía, una celda con 0 y una
 * celda con #¡VALOR!. Se parecen en que no suman, pero solo una es un error.
 *
 * Sobre los separadores: el teclado de un teléfono con `inputmode="decimal"`
 * ofrece UNO solo, el del idioma del aparato. O coma, o punto, nunca los dos.
 * Así que "1234,50" y "1234.50" son las dos formas reales de escribir lo
 * mismo y las dos se aceptan. Lo que NO se hace es adivinar separadores de
 * miles: "1.234" se lee como uno coma dos tres cuatro, porque en un teclado
 * que ofrece coma no hay forma de teclear ese punto. Un texto pegado con los
 * dos separadores sí se entiende (el de más a la derecha manda), que es el
 * único caso donde pueden convivir.
 *
 * @param   {string} texto  lo que hay escrito en el campo
 * @returns {{ ok: boolean, vacio: boolean, valor: number }}
 *          ok    — se entendió (un campo vacío también se entiende)
 *          vacio — no había nada escrito, que no es lo mismo que un 0
 *          valor — el número, o 0 si no se entendió (no usarlo con ok en false)
 */
function leerNumero(texto) {
  const crudo = String(texto === null || texto === undefined ? '' : texto).trim();
  if (crudo === '') return { ok: true, vacio: true, valor: 0 };

  // Solo dígitos, separadores, espacios y un signo delante. Cualquier letra
  // que se cuele hace que el campo sea ilegible, no cero.
  if (!/^-?[\d.,\s]+$/.test(crudo)) return { ok: false, vacio: false, valor: 0 };

  /* Un separador suelto al final es alguien a medio escribir: "1000," es
     mil, todavía sin decidir los centavos. Si eso contara como ilegible, el
     recibo parpadearía mientras se teclea y, peor, guardar justo ahí daría un
     aviso de error por un número que está bien. Dos separadores seguidos sí
     son basura y siguen cayendo más abajo. */
  let limpio = crudo.replace(/\s/g, '').replace(/[.,]$/, '');
  if (limpio === '' || limpio === '-') return { ok: false, vacio: false, valor: 0 };

  const punto = limpio.lastIndexOf('.');
  const coma  = limpio.lastIndexOf(',');

  if (punto >= 0 && coma >= 0) {
    // Están los dos: el que va más a la derecha es el decimal y el otro
    // separa los miles. Cubre "1.234,56" y "1,234.56" con la misma regla.
    const decimal = punto > coma ? '.' : ',';
    const miles   = decimal === '.' ? ',' : '.';
    limpio = limpio.split(miles).join('').replace(decimal, '.');
  } else if (coma >= 0) {
    limpio = limpio.replace(',', '.');
  }

  // Después de normalizar puede quedar como mucho un separador. Si quedan dos
  // ("1,2,3"), no era un número: es preferible decirlo a inventar uno.
  if ((limpio.match(/\./g) || []).length > 1) return { ok: false, vacio: false, valor: 0 };

  const n = Number(limpio);
  if (!isFinite(n)) return { ok: false, vacio: false, valor: 0 };

  return { ok: true, vacio: false, valor: n };
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


/**
 * El tip-out de un turno en el que el equipo cambió a mitad.
 *
 * El caso real: de 3 a 6 pm hay dos ayudantes y se les paga el 2%; a las 6
 * llegan tres más y a partir de ahí se paga el 5%. Pero el 5% NO es sobre todo
 * el turno: es sobre lo que se vendió después del cambio. Lo de antes ya se
 * pagó al 2% y no se vuelve a pagar.
 *
 * Cada tramo trae `hasta`: las ventas ACUMULADAS del turno en el momento del
 * cambio, que es el número que sale impreso en el recibo del punto de venta.
 * Se pide así, y no las ventas del tramo, porque el recibo dice "$500" y no
 * "$500 desde el corte anterior": pedir otra cosa obligaría a restar a mano al
 * final del turno, que es justo lo que la app viene a evitar.
 *
 * El último tramo lleva `hasta: null` y llega hasta las ventas del turno.
 *
 * Cada tramo se calcula con `calcularTipOut`, la misma función de siempre.
 * Aquí no hay fórmula nueva: lo único que cambia es sobre qué base se aplica
 * cada porcentaje.
 *
 * @param {number} ventasTotales  las ventas del turno entero
 * @param {Array}  tramos  [{ hasta, roles: [{ nombre, porcentaje }] }, ...]
 * @returns {{ total, detalle, tramos }}
 *          detalle — una entrada por rol y tramo, con el número de tramo
 *          tramos  — [{ tramo, ventas, porcentaje, monto }] para poder
 *                    enseñar cada línea del recibo contra su papel del POS
 */
function calcularTipOutTramos(ventasTotales, tramos) {
  const totalVentas = Number(ventasTotales) || 0;
  const lista = Array.isArray(tramos) ? tramos : [];

  let anterior = 0;
  const detalle = [];
  const resumen = [];
  let total = 0;

  lista.forEach((tramo, i) => {
    const esUltimo = i === lista.length - 1;
    const hasta = esUltimo ? totalVentas : (Number(tramo.hasta) || 0);
    // Las ventas DE ESTE tramo: lo acumulado hasta aquí menos lo del anterior.
    const base = redondear(hasta - anterior);
    anterior = hasta;

    const parcial = calcularTipOut(base, tramo.roles);
    // El número de tramo viaja con cada monto. Sin él, un mismo rol presente
    // en dos tramos daría dos entradas indistinguibles, y contar el desglose
    // para decir "N ayudantes" saldría mal.
    parcial.detalle.forEach(d => detalle.push({ ...d, tramo: i }));

    const porcentaje = redondear(
      (Array.isArray(tramo.roles) ? tramo.roles : [])
        .reduce((suma, r) => suma + (Number(r.porcentaje) || 0), 0));

    resumen.push({ tramo: i, ventas: base, porcentaje, monto: parcial.total });
    total = redondear(total + parcial.total);
  });

  return { total, detalle, tramos: resumen };
}

/**
 * ¿Se pueden usar estos cortes?
 *
 * Va aparte del cálculo a propósito. Si estuviera dentro, un corte imposible
 * daría un tip-out raro en vez de un aviso, y el peor de los casos —un corte
 * mayor que las ventas del turno— produce un tramo NEGATIVO: un tip-out que
 * en vez de restar, suma. Un número que le da más dinero a quien lo lee no lo
 * cuestiona nadie.
 *
 * `cortes` son solo los números, en orden. El último tramo no tiene corte.
 *
 * @returns {{ ok: boolean, motivo: string, corte: number }}
 *          motivo — 'falta' | 'orden' | 'pasa'; `corte` es cuál de ellos falla
 */
function revisarCortes(ventasTotales, cortes) {
  const totalVentas = Number(ventasTotales) || 0;
  const lista = Array.isArray(cortes) ? cortes : [];
  if (lista.length === 0) return { ok: true, motivo: '', corte: -1 };

  let anterior = 0;

  for (let i = 0; i < lista.length; i++) {
    const c = lista[i];
    if (c === null || c === undefined || c === '' || !isFinite(Number(c))) {
      return { ok: false, motivo: 'falta', corte: i };
    }
    const n = Number(c);
    // Mayor que el anterior, y el primero mayor que cero: un cambio de equipo
    // sin nada vendido antes no es un tramo, es no haber empezado.
    if (n <= anterior)   return { ok: false, motivo: 'orden', corte: i };
    if (n > totalVentas) return { ok: false, motivo: 'pasa',  corte: i };
    anterior = n;
  }

  return { ok: true, motivo: '', corte: -1 };
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

  /* El efectivo que de verdad se queda en el bolsillo.
   *
   * El tip-out se entrega casi siempre en billetes, al final del turno y en la
   * mano. Así que decir "efectivo: $100" la noche en que entregaste $80 es
   * falso: te quedaste con $20. Y si el tip-out fue de $140, no te quedaste con
   * $0 — pusiste $40 de tu cartera, y la cifra tiene que decir −$40. Un cero
   * ahí miente igual que el $100.
   *
   * Lo que esto NO es, y es la parte importante: no es una resta nueva. El
   * tip-out ya se descuenta una sola vez, arriba, en `netoPropinas`, y sigue
   * descontándose ahí. Esto solo reparte ese mismo neto entre los dos sitios de
   * donde sale el dinero:
   *
   *     efectivoNeto + tarjeta = netoPropinas
   *
   * Esa igualdad es la garantía de que el tip-out no se está restando dos
   * veces, que sería la forma de romper esto sin que se note. Hay una prueba
   * dedicada a vigilarla.
   */
  const efectivoNeto = redondear(efectivo - tipOut);

  // El sueldo por hora del restaurante, aparte de las propinas.
  const sueldoBase = redondear(horas * tarifa);

  // Lo que de verdad te llevaste ese día.
  const totalNeto = redondear(netoPropinas + sueldoBase);

  return {
    horas,
    propinas,
    // Efectivo y tarjeta se devuelven tal cual además del neto, para que quien
    // pinte pueda comprobar la igualdad de arriba sin recalcular nada.
    efectivo: redondear(efectivo),
    tarjeta: redondear(tarjeta),
    efectivoNeto,
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
    // El efectivo ya sin el tip-out. Se suma turno a turno y no se calcula al
    // final restando el tip-out del total: da lo mismo, pero sumar los netos ya
    // redondeados es la única forma de que la cifra de la semana coincida
    // exactamente con lo que se ve sumando los días a mano.
    a.efectivoNeto += c.efectivoNeto;
    a.tipOut       += c.tipOut;
    a.netoPropinas += c.netoPropinas;
    a.sueldoBase   += c.sueldoBase;
    a.totalNeto    += c.totalNeto;
    return a;
  }, { turnos: 0, horas: 0, ventas: 0, propinas: 0, efectivo: 0, tarjeta: 0,
       efectivoNeto: 0, tipOut: 0, netoPropinas: 0, sueldoBase: 0, totalNeto: 0 });

  acc.horas        = redondear(acc.horas);
  acc.ventas       = redondear(acc.ventas);
  acc.propinas     = redondear(acc.propinas);
  acc.efectivo     = redondear(acc.efectivo);
  acc.tarjeta      = redondear(acc.tarjeta);
  acc.efectivoNeto = redondear(acc.efectivoNeto);
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
 * Cuál de las dos cifras de efectivo se enseña.
 *
 * Depende de un dato del restaurante, no de un gusto: **cómo se paga el
 * tip-out**. Hay dos formas y las dos son normales en Estados Unidos:
 *
 *   - **En efectivo** (lo habitual, y el caso de Kev). Los billetes se entregan
 *     en la mano al terminar el turno, así que salen del efectivo. Se muestra
 *     `efectivoNeto`.
 *   - **Descontado del cheque.** El sistema del restaurante lo retiene solo, y
 *     el efectivo que te llevaste esa noche es el que recibiste, entero. Se
 *     muestra `efectivo`.
 *
 * Restarlo en el segundo caso dejaría el efectivo bajo y la tarjeta alta, que
 * es un error peor que el original porque no se nota: los dos números siguen
 * sumando lo mismo.
 *
 * Igual que `cifrasPrincipales`, esta función **no calcula nada**: las dos
 * cifras ya vienen hechas y aquí solo se elige. Y sirve igual para un turno que
 * para una semana, porque los dos devuelven las mismas dos claves.
 */
function efectivoMostrado(calculo, tipOutEnEfectivo) {
  const c = calculo || {};
  return tipOutEnEfectivo ? (c.efectivoNeto || 0) : (c.efectivo || 0);
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
    redondear, leerNumero, horaAMinutos, calcularHoras, calcularTipOut,
    calcularTipOutTramos, revisarCortes,
    calcularTurno, resumir, lunesDeLaSemana,
    sumarDias, diasDeLaSemana, turnosDelDia,
    horasFrecuentes, mejorTurno, cifrasPrincipales, efectivoMostrado,
    turnoValido, fusionarTurnos
  };
}
