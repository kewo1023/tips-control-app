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
 * Esto existe por un fallo que apareció en el teléfono de un usuario del
 * piloto: su teclado ofrecía una coma donde el del desarrollador ofrece un punto, escribió "3,5" en
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
 * El modelo de la app: cada rol tiene un porcentaje fijo que se
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
 * El caso típico: al principio del turno hay dos ayudantes y se les paga el 2%;
 * luego llegan tres más y a partir de ahí se paga el 5%. Pero el 5% NO es sobre todo
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

/**
 * Lo que la pantalla dice debajo de cada corte MIENTRAS se escribe.
 *
 * `revisarCortes` solo habla al guardar, y hasta entonces la pantalla
 * calculaba con lo que hubiera: quien escribía las ventas de cada tramo en vez
 * de las acumuladas (700 y luego 500) veía un tramo de −$200, un tip-out que
 * restaba de menos y ningún aviso. Con un solo cambio las dos lecturas dan lo
 * mismo; el malentendido aparece con el segundo. Por eso cada corte enseña
 * las ventas de SU tramo ("$500 en este tramo"), que confirman la lectura
 * buena, o el motivo por el que no se puede usar.
 *
 * Recibe los textos tal como están en los campos, sin convertir: separar
 * "vacío" de "ilegible" es justo lo que hace falta aquí.
 *
 * @returns {{ ok: boolean, cortes: Array<{ estado, ventas, limite }> }}
 *   estado — 'ok' | 'vacio' | 'ilegible' | 'cero' | 'orden' | 'pasa' | 'espera'
 *            ('espera': un corte posterior al que falla; sus ventas dependen
 *            de él y no se pueden decir todavía)
 *   ventas — las ventas del tramo, solo con 'ok'
 *   limite — con 'orden', el corte anterior; con 'pasa', las ventas del turno
 */
function estadoDeCortes(ventasTotales, textos) {
  const totalVentas = Number(ventasTotales) || 0;
  const leidos = (Array.isArray(textos) ? textos : []).map(leerNumero);
  const revision = revisarCortes(totalVentas,
    leidos.map(l => (!l.ok || l.vacio) ? null : l.valor));
  const fallo = revision.ok ? leidos.length : revision.corte;

  const cortes = leidos.map((l, i) => {
    const anterior = i === 0 ? 0 : leidos[i - 1].valor;
    if (i < fallo)  return { estado: 'ok', ventas: redondear(l.valor - anterior), limite: null };
    if (i > fallo)  return { estado: 'espera', ventas: null, limite: null };
    if (!l.ok)      return { estado: 'ilegible', ventas: null, limite: null };
    if (l.vacio)    return { estado: 'vacio', ventas: null, limite: null };
    if (revision.motivo === 'pasa') {
      return { estado: 'pasa', ventas: null, limite: totalVentas };
    }
    return i === 0 ? { estado: 'cero', ventas: null, limite: null }
                   : { estado: 'orden', ventas: null, limite: anterior };
  });

  return { ok: revision.ok, cortes };
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

    /* Los puntos del incentivo. Se suman dos cosas distintas a propósito: los
       puntos y CUÁNTOS turnos los traen.

       El campo es opcional y se rellena al final de un turno, cansado, así que
       algunos se van a quedar sin anotar. Sin la segunda cuenta, la suma de la
       semana sale por debajo y parece correcta: no hay nada en la pantalla que
       delate el hueco. Con ella se puede decir "38, en 4 de 6 turnos", que es
       verdad siempre.

       Por eso se mira si la clave EXISTE en vez de si vale más que cero: un
       cero escrito a mano es un turno anotado —vendiste nada— y un campo en
       blanco es un turno sin anotar. Se ven igual y no significan lo mismo. */
    a.incentivo += Number(turno.incentivo) || 0;
    if (turno.incentivo !== undefined && turno.incentivo !== null) {
      a.turnosConIncentivo += 1;
    }
    return a;
  }, { turnos: 0, horas: 0, ventas: 0, propinas: 0, efectivo: 0, tarjeta: 0,
       efectivoNeto: 0, tipOut: 0, netoPropinas: 0, sueldoBase: 0, totalNeto: 0,
       incentivo: 0, turnosConIncentivo: 0 });

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
  acc.incentivo    = redondear(acc.incentivo);

  acc.propinaPorHora   = acc.horas  > 0 ? redondear(acc.netoPropinas / acc.horas) : 0;
  acc.totalPorHora     = acc.horas  > 0 ? redondear(acc.totalNeto / acc.horas)    : 0;
  acc.porcentajeVentas = acc.ventas > 0 ? redondear(acc.propinas / acc.ventas * 100) : 0;
  acc.promedioPorTurno = acc.turnos > 0 ? redondear(acc.totalNeto / acc.turnos)   : 0;
  // El mismo promedio sin el sueldo. Los dos existen por la misma razón que
  // `propinaPorHora` y `totalPorHora`: `cifrasPrincipales` elige uno según el
  // ajuste, y ninguna pantalla debería escoger por su cuenta.
  acc.propinasPorTurno = acc.turnos > 0 ? redondear(acc.netoPropinas / acc.turnos) : 0;

  return acc;
}


/* --- Fechas -------------------------------------------------------------- */

/**
 * El primer día de la semana a la que pertenece una fecha, como texto
 * "2026-08-03". `diaInicio` usa la numeración de `getDay()`: 0 domingo,
 * 1 lunes… 6 sábado. Sin él, o con algo que no sea un día, la semana empieza
 * en lunes, que es lo que la app hizo siempre.
 *
 * Existe porque la semana que importa es la del CHEQUE, y no todos los
 * restaurantes la cortan el mismo día: donde la semana de pago va de domingo a
 * sábado, un "neto de la semana" de lunes a domingo no cuadra nunca con el
 * cheque, y la persona acaba desconfiando de la app entera.
 *
 * Trabajamos con el texto de la fecha y no con objetos Date porque Date
 * interpreta zonas horarias: "2026-08-06" se puede convertir en el 5 de agosto
 * a las 7 PM según dónde estés, y de repente un turno cambia de semana solo.
 */
function inicioDeSemana(fechaTexto, diaInicio) {
  const inicio = Number.isInteger(diaInicio) && diaInicio >= 0 && diaInicio <= 6
    ? diaInicio : 1;
  const [a, m, d] = String(fechaTexto).split('-').map(Number);
  const fecha = new Date(a, (m || 1) - 1, d || 1);
  const dia = fecha.getDay();                  // 0 domingo, 1 lunes, ... 6 sábado
  const retroceder = (dia - inicio + 7) % 7;   // cuántos días hay que ir atrás
  fecha.setDate(fecha.getDate() - retroceder);
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mm}-${dd}`;
}

/**
 * El lunes de la semana de una fecha. Se queda aparte de `inicioDeSemana`
 * porque los Reportes agrupan por día de la semana (los lunes, los martes…),
 * y eso no depende de qué día empiece la semana de pago de nadie.
 */
function lunesDeLaSemana(fechaTexto) {
  return inicioDeSemana(fechaTexto, 1);
}

/**
 * Qué día de la semana es una fecha, contando desde el lunes: 0 lunes …
 * 6 domingo. Es el orden de las listas de nombres y letras de los días. No se
 * usa `getDay()` directamente porque ese empieza en domingo, y confundir las
 * dos numeraciones pone la letra de un día encima de la fecha del otro.
 */
function numeroDelDia(fechaTexto) {
  return diasEntre(lunesDeLaSemana(fechaTexto), fechaTexto);
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

/**
 * Cuántos días van de una fecha a otra, en texto "AAAA-MM-DD".
 * `diasEntre('2026-08-01', '2026-08-06')` → 5. Si alguna fecha no se entiende,
 * devuelve `null`: la usa la línea del último respaldo, y un "hace NaN días"
 * en pantalla es peor que no decir nada.
 *
 * Las dos fechas se pasan a UTC antes de restar. Con la hora local, el día en
 * que se adelanta el reloj en marzo dura 23 horas, y dividir entre 24 daba un
 * día de menos. Es la misma trampa que restar dos fechas con hora en Excel y
 * quedarse con la parte entera: la cuenta sale bien casi siempre y falla
 * justo dos veces al año.
 */
function diasEntre(desde, hasta) {
  const aUTC = texto => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(texto));
    return m ? Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : NaN;
  };
  const dias = (aUTC(hasta) - aUTC(desde)) / 86400000;
  return Number.isFinite(dias) ? dias : null;
}

/** Las 7 fechas de la semana que empieza en esa fecha (sea el día que sea). */
function diasDeLaSemana(inicio) {
  return [0, 1, 2, 3, 4, 5, 6].map(i => sumarDias(inicio, i));
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
 * devuelven las mismas cuatro claves. `porTurno` solo tiene sentido en un
 * resumen (un turno suelto no tiene promedio) y en un turno da 0.
 *
 * `porTurno` se añadió el 24 de octubre de 2026: hasta la v49 la tarjeta "Por
 * turno" usaba siempre el promedio CON sueldo, aunque el ajuste dijera que no
 * se contara, y era la única cifra que no lo respetaba (DECISIONES §7).
 */
function cifrasPrincipales(calculo, contarSueldo) {
  const c = calculo || {};
  return contarSueldo
    ? { total: c.totalNeto    || 0, porHora: c.totalPorHora   || 0, porTurno: c.promedioPorTurno || 0 }
    : { total: c.netoPropinas || 0, porHora: c.propinaPorHora || 0, porTurno: c.propinasPorTurno || 0 };
}

/**
 * Cuál de las dos cifras de efectivo se enseña.
 *
 * Depende de un dato del restaurante, no de un gusto: **cómo se paga el
 * tip-out**. Hay dos formas y las dos son normales en Estados Unidos:
 *
 *   - **En efectivo** (lo habitual). Los billetes se entregan
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

/**
 * El día a día detrás de una estadística de la semana: una fila por turno, en
 * orden de fecha, y el total, que es la MISMA cifra de la tarjeta.
 *
 * Existe para responder "¿de dónde salen estos $249?". Por eso el total no se
 * vuelve a calcular sumando las filas: sale de `resumir`, igual que la
 * tarjeta. Si los dos caminos dieran distinto, la hoja contradiría a la
 * pantalla que la abrió, que es justo la desconfianza que venía a quitar. Una
 * prueba comprueba que, en las que son sumas, las filas suman el total.
 *
 * Cuatro no son sumas (por hora, prop/vtas, por turno y, con huecos, el
 * incentivo). Para esas `suma` es false y cada fila y el total traen las
 * piezas con las que se arman, para poder escribir "$1,316.61 ÷ 38 h".
 *
 * Los números van sin formato: el texto lo pone quien pinta, en su idioma.
 *
 * @param {Array}  turnos   Los turnos de la semana.
 * @param {string} clave    Una de DETALLES.
 * @param {Object} opciones { contarSueldo, tipOutEnEfectivo }, las mismas
 *                          preferencias con las que se pintó la tarjeta.
 */
const DETALLES = ['horas', 'porHora', 'efectivo', 'tarjeta', 'propinas', 'tipOut',
                  'ventas', 'propVtas', 'sueldo', 'porTurno', 'incentivo'];

function detalleSemana(turnos, clave, opciones) {
  // Una clave desconocida es un error de quien llama, no de los datos. Se
  // dice en voz alta: devolver una lista vacía pintaría una hoja en blanco
  // que parece una semana sin turnos.
  if (!DETALLES.includes(clave)) throw new Error('detalleSemana: clave desconocida ' + clave);

  const lista = (Array.isArray(turnos) ? turnos : []).slice()
    .sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0));
  const o = opciones || {};
  const conSueldo = !!o.contarSueldo;
  const enEfectivo = !!o.tipOutEnEfectivo;

  const fila = turno => {
    const c = calcularTurno(turno);
    const cifras = cifrasPrincipales(c, conSueldo);
    const ventas = redondear(Number(turno.ventas) || 0);
    switch (clave) {
      case 'horas':    return { valor: c.horas };
      case 'porHora':  return { valor: cifras.porHora, total: cifras.total, horas: c.horas };
      // El tip-out solo se enseña restando cuando de verdad sale de los billetes.
      case 'efectivo': return { valor: efectivoMostrado(c, enEfectivo), efectivo: c.efectivo,
                                tipOut: enEfectivo ? c.tipOut : 0 };
      case 'tarjeta':  return { valor: c.tarjeta };
      case 'propinas': return { valor: c.propinas, efectivo: c.efectivo, tarjeta: c.tarjeta };
      case 'tipOut':   return { valor: c.tipOut, ventas };
      case 'ventas':   return { valor: ventas };
      case 'propVtas': return { valor: c.porcentajeVentas, propinas: c.propinas, ventas };
      case 'sueldo':   return { valor: c.sueldoBase, horas: c.horas,
                                tarifa: redondear(Number(turno.tarifaHora) || 0) };
      // Cada día vale lo que se llevó, con el mismo criterio que el total. Con
      // el sueldo contado, se dice cuánto fue propina y cuánto sueldo.
      case 'porTurno': return conSueldo
        ? { valor: cifras.total, propinas: c.netoPropinas, sueldo: c.sueldoBase }
        : { valor: cifras.total };
      // Un campo en blanco no es un cero: es un turno sin anotar (ver `resumir`).
      case 'incentivo': {
        const anotado = turno.incentivo !== undefined && turno.incentivo !== null;
        return { valor: anotado ? redondear(Number(turno.incentivo) || 0) : null };
      }
    }
  };

  const r = resumir(lista);
  const cifras = cifrasPrincipales(r, conSueldo);
  const totales = {
    horas:     { valor: r.horas },
    porHora:   { valor: cifras.porHora, total: cifras.total, horas: r.horas },
    efectivo:  { valor: efectivoMostrado(r, enEfectivo) },
    tarjeta:   { valor: r.tarjeta },
    propinas:  { valor: r.propinas },
    tipOut:    { valor: r.tipOut },
    ventas:    { valor: r.ventas },
    propVtas:  { valor: r.porcentajeVentas, propinas: r.propinas, ventas: r.ventas },
    sueldo:    { valor: r.sueldoBase },
    porTurno:  { valor: cifras.porTurno, total: cifras.total, turnos: r.turnos },
    incentivo: { valor: redondear(r.incentivo), anotados: r.turnosConIncentivo, turnos: r.turnos }
  };

  return {
    filas: lista.map(turno => Object.assign({ fecha: turno.fecha }, fila(turno))),
    total: totales[clave],
    suma: !['porHora', 'propVtas', 'porTurno'].includes(clave)
  };
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


/* --- Reportes: qué turno conviene -------------------------------------- */

/* La franja la decide la hora de SALIDA, no la de entrada: así lo cuentan en
   el restaurante. Quien sale a las 3:00 pm o antes hizo el turno de la
   mañana; quien sale después, el de la tarde. Las 3:00 en punto todavía son
   mañana.

   Un doble (mañana y tarde seguidas, más de 9 horas) sale después de las 3 y
   cae en la tarde solo, sin regla aparte: así se cuenta allá.

   Las 3 pm son el valor de fábrica. Desde el 27 de septiembre de 2026 cada
   quien puede poner la suya (`trabajo.corteTarde`): en otro restaurante el
   turno de la mañana puede terminar a las 4, y con la hora fija los Reportes
   le mezclaban las dos franjas. */
const CORTE_TARDE_MIN = 15 * 60;

/* Con menos turnos que esto, un grupo no compite por "el mejor". Dos martes
   buenos no dicen que el martes pague más: dicen que hubo dos martes buenos,
   y alguien podría pedir martes por eso. */
const MINIMO_TURNOS_REPORTE = 3;

/**
 * 'manana', 'tarde', o `null` si el turno no tiene una hora de salida que se
 * entienda.
 *
 * El caso que importa es el de la madrugada: un turno de 5 pm a 1 am sale a
 * la 1:00, que en el reloj es "antes de las 3". Comparando solo la hora de
 * salida caería en la mañana. Por eso, si la salida es menor que la entrada
 * (el turno cruzó la medianoche, como en `calcularHoras`), es de la tarde.
 */
function franjaDelTurno(turno, corte) {
  const t = turno || {};
  const ini = horaAMinutos(t.entrada);
  const fin = horaAMinutos(t.salida);
  if (fin === null) return null;
  if (ini !== null && fin < ini) return 'tarde';
  return fin <= minutosDeCorte(corte) ? 'manana' : 'tarde';
}

/**
 * La hora de corte en minutos. Acepta "HH:MM"; sin ella o con algo que no se
 * entienda, las 3 pm de fábrica. Un corte ilegible no puede dejar todos los
 * turnos en una sola franja sin que nadie sepa por qué.
 */
function minutosDeCorte(corte) {
  const min = horaAMinutos(corte);   // null con cualquier cosa que no sea "HH:MM"
  return min === null ? CORTE_TARDE_MIN : min;
}

/**
 * Los turnos de los últimos `dias` días, contando hoy. Con `dias` vacío,
 * todos. "Últimos 30 días" el 6 de agosto va del 8 de julio al 6 de agosto:
 * 30 fechas, no 31. Tampoco entran turnos con fecha posterior a hoy.
 */
function turnosDelPeriodo(turnos, hoyTexto, dias) {
  const lista = Array.isArray(turnos) ? turnos.filter(turnoValido) : [];
  if (!dias) return lista.filter(t => t.fecha <= hoyTexto);
  const desde = sumarDias(hoyTexto, -(dias - 1));
  return lista.filter(t => t.fecha >= desde && t.fecha <= hoyTexto);
}

/**
 * Los turnos agrupados por día de la semana, de lunes (0) a domingo (6), cada
 * grupo ya resumido con `resumir`. Siempre devuelve los siete, aunque alguno
 * esté vacío: una tabla a la que le faltan filas según el mes se lee peor que
 * una fila con un guion.
 *
 * El "por hora" de cada día es el de `resumir`: el total dividido entre el
 * total de horas, no el promedio de los "por hora" de cada turno. En Excel,
 * SUMA(neto)/SUMA(horas) y no PROMEDIO(neto_por_hora), que haría pesar igual
 * un turno de 3 horas que un doble de 10.
 */
function reportePorDia(turnos) {
  const grupos = [[], [], [], [], [], [], []];
  (Array.isArray(turnos) ? turnos : []).filter(turnoValido).forEach(t => {
    grupos[numeroDelDia(t.fecha)].push(t);
  });
  return grupos.map((lista, dia) => ({ clave: dia, resumen: resumir(lista) }));
}

/**
 * Los turnos agrupados por franja, más cuántos no se pudieron clasificar.
 * `sinHora` existe para poder decirlo en la pantalla: si un turno sin hora de
 * salida desapareciera de la tabla sin más, la suma de las franjas no cuadraría
 * con la de los días y nada lo explicaría.
 */
function reportePorFranja(turnos, corte) {
  const manana = [], tarde = [];
  let sinHora = 0;
  (Array.isArray(turnos) ? turnos : []).filter(turnoValido).forEach(t => {
    const f = franjaDelTurno(t, corte);
    if (f === 'manana') manana.push(t);
    else if (f === 'tarde') tarde.push(t);
    else sinHora++;
  });
  return {
    grupos: [{ clave: 'manana', resumen: resumir(manana) },
             { clave: 'tarde',  resumen: resumir(tarde) }],
    sinHora
  };
}

/**
 * La clave del grupo que más deja por hora, con la misma cifra que se está
 * mostrando (con o sin sueldo, igual que `mejorTurno`). Solo compiten los
 * grupos con al menos `MINIMO_TURNOS_REPORTE` turnos; si ninguno llega,
 * devuelve `null` y la pantalla dice "pocos datos" en vez de coronar a uno.
 * En un empate gana el que tiene más turnos detrás: es la cifra más sólida.
 */
function mejorGrupo(grupos, contarSueldo) {
  const candidatos = (Array.isArray(grupos) ? grupos : [])
    .filter(g => g && g.resumen && g.resumen.turnos >= MINIMO_TURNOS_REPORTE);
  if (candidatos.length === 0) return null;
  const porHora = g => cifrasPrincipales(g.resumen, contarSueldo).porHora;
  return candidatos.reduce((mejor, g) =>
    porHora(g) > porHora(mejor)
    || (porHora(g) === porHora(mejor) && g.resumen.turnos > mejor.resumen.turnos)
      ? g : mejor).clave;
}


/* --- El resumen del año y la hoja para Excel ------------------------------ */

/**
 * El año entero: el total y los doce meses, cada uno ya resumido con
 * `resumir` (las mismas cifras que la semana, así que cuadran entre sí).
 * Siempre los doce meses, aunque estén vacíos: una tabla a la que le faltan
 * meses se lee como un error.
 *
 * Es un registro personal de lo que la persona anotó, no un cálculo de
 * impuestos: la pantalla no lo presenta como otra cosa.
 */
function resumenAnual(turnos, anio) {
  const prefijo = String(anio) + '-';
  const delAnio = (Array.isArray(turnos) ? turnos : [])
    .filter(t => turnoValido(t) && t.fecha.startsWith(prefijo));
  const meses = Array.from({ length: 12 }, (_, i) => {
    const mes = prefijo + String(i + 1).padStart(2, '0') + '-';
    return resumir(delAnio.filter(t => t.fecha.startsWith(mes)));
  });
  return { anio: Number(anio), total: resumir(delAnio), meses };
}

/** Los años que tienen turnos, del más reciente al más viejo. */
function aniosConTurnos(turnos) {
  const anios = new Set((Array.isArray(turnos) ? turnos : [])
    .filter(turnoValido).map(t => Number(t.fecha.slice(0, 4))));
  return [...anios].sort((a, b) => b - a);
}

/* Las columnas de la hoja, en orden. Los encabezados los pone quien llama, en
   su idioma; aquí solo se decide qué va y en qué orden. Efectivo y tarjeta
   separados, como en toda la app. */
const COLUMNAS_CSV = ['fecha', 'entrada', 'salida', 'horas', 'ventas',
  'efectivo', 'tarjeta', 'propinas', 'tipOut', 'netoPropinas',
  'tarifaHora', 'sueldo', 'incentivo', 'nota'];

/**
 * Una celda de CSV.
 *
 * Los números van tal cual, con punto decimal y sin "$", para que Excel y
 * Google Sheets los lean como números y se puedan sumar. El texto va entre
 * comillas si lleva coma, comillas o saltos de línea.
 *
 * Y un texto que empieza por = + - o @ se protege con un apóstrofo: Excel lo
 * tomaría como una fórmula y la ejecutaría al abrir el archivo. La nota la
 * escribe la persona, y un respaldo ajeno puede traer cualquier cosa.
 */
function celdaCSV(valor) {
  if (typeof valor === 'number') return Number.isFinite(valor) ? String(valor) : '';
  if (valor === null || valor === undefined) return '';
  let texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) texto = "'" + texto;
  return /[",\r\n]/.test(texto) ? '"' + texto.replace(/"/g, '""') + '"' : texto;
}

/**
 * Los turnos como hoja de cálculo (CSV), uno por fila, del más viejo al más
 * nuevo. `encabezados` trae el nombre de cada columna de `COLUMNAS_CSV`.
 *
 * Empieza con la marca BOM para que Excel abra bien los acentos: sin ella,
 * "Sección" sale como "SecciÃ³n". Filas separadas con CRLF, como pide el
 * formato.
 */
function turnosACSV(turnos, encabezados) {
  const nombres = encabezados || {};
  const lista = (Array.isArray(turnos) ? turnos : []).filter(turnoValido)
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const filas = lista.map(t => {
    const c = calcularTurno(t);
    const incentivo = typeof t.incentivo === 'number' ? t.incentivo : '';
    const valores = {
      fecha: t.fecha, entrada: t.entrada || '', salida: t.salida || '',
      horas: c.horas, ventas: redondear(Number(t.ventas) || 0),
      efectivo: c.efectivo, tarjeta: c.tarjeta, propinas: c.propinas,
      tipOut: c.tipOut, netoPropinas: c.netoPropinas,
      tarifaHora: Number(t.tarifaHora) || 0, sueldo: c.sueldoBase,
      incentivo, nota: t.nota || ''
    };
    return COLUMNAS_CSV.map(col => celdaCSV(valores[col])).join(',');
  });
  const cabecera = COLUMNAS_CSV.map(col => celdaCSV(nombres[col] || col)).join(',');
  return '\uFEFF' + [cabecera, ...filas].join('\r\n') + '\r\n';
}


/* --- El aviso de respaldo ----------------------------------------------- */

/* Cuándo sale el aviso de respaldo en la Semana. Con menos de 5 turnos hay
   poco que perder y el aviso sería ruido para alguien que acaba de empezar;
   30 días es lo que se tarda en juntar un mes que dolería perder; y "Ahora
   no" lo esconde 7 días: lo bastante para no ser una molestia diaria, lo
   bastante poco para que no se olvide. */
/* --- Cheque estimado ----------------------------------------------------- */

/*
 * Cuánto va a llegar en el cheque de la semana, antes de que llegue.
 *
 * El cheque paga el sueldo y la propina de tarjeta, y retiene sobre eso más el
 * efectivo que se declara (que se suma al bruto solo para retener y después se
 * resta, porque ya está en el bolsillo):
 *
 *     bruto = sueldo + tarjeta + efectivo declarado
 *     neto  = bruto − retenciones − efectivo declarado
 *
 * Las retenciones salen de las tablas oficiales del año, no de un porcentaje:
 * la federal es progresiva y salta del 12 % al 22 % dentro de semanas normales
 * de un mesero, así que un porcentaje fijo se equivoca justo en las semanas
 * buenas (DECISIONES §26). Se probó contra tres cheques reales de semanas
 * distintas y cuadró al centavo en las retenciones; esos cheques no están en
 * el repositorio, y las pruebas usan números inventados.
 *
 * Las tablas cambian cada enero. Si el año del cheque no está aquí, se usan
 * las del último año que sí está y el resultado lo dice (`tablasDelAnio`),
 * para que la pantalla avise en vez de equivocarse en silencio.
 */
const TABLAS_CHEQUE = {
  2026: {
    // IRS Publication 15-T (2026), Worksheet 1A y "Annual Percentage Method
    // Tables" para un W-4 de 2020 o después. Cada fila: [desde, base, tasa].
    federal: {
      deduccionSinPaso2: { casadoJunto: 12900, otro: 8600 },   // línea 1g
      tablas: {
        normal: {
          casadoJunto: [[0, 0, 0], [19300, 0, .10], [44100, 2480, .12], [120100, 11600, .22],
                        [230700, 35932, .24], [422850, 82048, .32], [531750, 116896, .35],
                        [788000, 206583.50, .37]],
          soltero:     [[0, 0, 0], [7500, 0, .10], [19900, 1240, .12], [57900, 5800, .22],
                        [113200, 17966, .24], [209275, 41024, .32], [263725, 58448, .35],
                        [648100, 192979.25, .37]],
          jefeHogar:   [[0, 0, 0], [15550, 0, .10], [33250, 1770, .12], [83000, 7740, .22],
                        [121250, 16155, .24], [217300, 39207, .32], [271750, 56631, .35],
                        [656150, 191171, .37]]
        },
        // La casilla del paso 2 (dos trabajos): tramos a la mitad.
        paso2: {
          casadoJunto: [[0, 0, 0], [16100, 0, .10], [28500, 1240, .12], [66500, 5800, .22],
                        [121800, 17966, .24], [217875, 41024, .32], [272325, 58448, .35],
                        [400450, 103291.75, .37]],
          soltero:     [[0, 0, 0], [8050, 0, .10], [14250, 620, .12], [33250, 2900, .22],
                        [60900, 8983, .24], [108938, 20512, .32], [136163, 29224, .35],
                        [328350, 96489.63, .37]],
          jefeHogar:   [[0, 0, 0], [12075, 0, .10], [20925, 885, .12], [45800, 3870, .22],
                        [64925, 8077.50, .24], [112950, 19603.50, .32], [140175, 28315.50, .35],
                        [332375, 95585.50, .37]]
        }
      }
    },
    // SSA: tope de 2026 para Social Security. Medicare no tiene tope, pero
    // desde $200,000 en el año el empleador retiene 0.9 % más.
    socialSecurity: { tasa: .062, tope: 184500 },
    medicare: { tasa: .0145, adicional: .009, desde: 200000 },
    // NJ: tablas del formulario NJ-W4 (método anual, $1,000 por exención) y
    // tasas del Department of Labor para 2026. UI es la suma de UI (0.3825 %)
    // y del fondo de capacitación (0.0425 %).
    nj: {
      exencion: 1000,
      tablas: {
        A: [[0, 0, .015], [20000, 300, .02], [35000, 600, .039], [40000, 795, .061],
            [75000, 2930, .07], [500000, 32680, .099], [1000000, 82180, .118]],
        B: [[0, 0, .015], [20000, 300, .02], [50000, 900, .027], [70000, 1440, .039],
            [80000, 1830, .061], [150000, 6100, .07], [500000, 30600, .099],
            [1000000, 80100, .118]],
        C: [[0, 0, .015], [20000, 300, .023], [40000, 760, .028], [50000, 1040, .035],
            [60000, 1390, .056], [150000, 6430, .066], [500000, 29530, .099],
            [1000000, 79030, .118]],
        D: [[0, 0, .015], [20000, 300, .027], [40000, 840, .034], [50000, 1180, .043],
            [60000, 1610, .056], [150000, 6650, .065], [500000, 29400, .099],
            [1000000, 78900, .118]],
        E: [[0, 0, .015], [20000, 300, .02], [35000, 600, .058], [100000, 4370, .065],
            [500000, 30370, .099], [1000000, 79870, .118]]
      },
      ui:  { tasa: .00425, tope: 44800 },
      di:  { tasa: .0019,  tope: 171100 },
      fli: { tasa: .0023,  tope: 171100 }
    }
  }
};

/* Centavos con la regla de la nómina: la mitad sube. `redondear` hace lo
   mismo, pero 1.005 se guarda en la máquina como 1.00499999… y bajaría; aquí
   se corrige ese residuo antes de redondear, porque en una retención un
   centavo de menos es un cheque que no cuadra. */
function centavos(n) {
  if (!isFinite(n)) return 0;
  return Math.round(Number((n * 100).toFixed(6))) / 100;
}

/* El impuesto de una tabla de tramos [desde, base, tasa] para un monto. */
function porTramos(tabla, monto) {
  let resultado = 0;
  tabla.forEach(([desde, base, tasa]) => {
    if (monto > desde) resultado = base + tasa * (monto - desde);
  });
  return resultado;
}

/**
 * El efectivo que se declara en el cheque, según cómo lo haga el restaurante:
 *
 *   - 'porcentaje': un porcentaje fijo de la propina de tarjeta, que pone el
 *     restaurante. Se TRUNCA al centavo: así salió en los cheques con que se
 *     probó (1,067.99 × 16 % = 170.878 → 170.87).
 *   - 'anotado': lo que se anotó en la app como efectivo neto (lo que de
 *     verdad se queda), sin bajar de cero.
 *   - 'nada': no se declara efectivo.
 */
function efectivoDeclarado(metodo, datos) {
  const d = datos || {};
  if (metodo === 'porcentaje') {
    const monto = (Number(d.tarjeta) || 0) * (Number(d.porcentaje) || 0) / 100;
    return Math.floor(Number((monto * 100).toFixed(6))) / 100;
  }
  if (metodo === 'anotado') return Math.max(0, centavos(Number(d.efectivoNeto) || 0));
  return 0;
}

/**
 * El cheque estimado de un periodo de pago.
 *
 * @param {Object} entrada
 *   sueldo, tarjeta, declarado — lo del periodo (ver `efectivoDeclarado`).
 *   acumulado — el bruto del año ANTES de este cheque. Hace falta para los
 *     topes (la UI de NJ se acaba en $44,800) y para redondear Social Security
 *     y Medicare sobre el acumulado, como lo hace la nómina. Sin él (null) se
 *     calcula el periodo solo: puede fallar por un centavo y no ve los topes.
 *   anio — el año del día de pago.
 *   perfil — { periodos: 52,
 *     federal: { estado: 'soltero'|'casadoJunto'|'jefeHogar', paso2: false,
 *                paso3: 0, paso4a: 0, paso4b: 0, paso4c: 0 },   // como el W-4
 *     estatal: { tipo: 'nj'|'ninguno'|'porcentaje',
 *                tasa: 'A'..'E', exenciones: 0,                 // si es 'nj'
 *                porcentaje: 0 } }                              // si es 'porcentaje'
 * @returns {{ bruto, lineas: Array<{clave, monto}>, retenciones, neto,
 *             anioTablas, tablasDelAnio }}
 */
function estimarCheque(entrada) {
  const e = entrada || {};
  const anios = Object.keys(TABLAS_CHEQUE).map(Number).sort((a, b) => a - b);
  const anioPedido = Number(e.anio) || anios[anios.length - 1];
  const anioTablas = TABLAS_CHEQUE[anioPedido] ? anioPedido
                   : anios.filter(a => a <= anioPedido).pop() || anios[0];
  const T = TABLAS_CHEQUE[anioTablas];

  const perfil = e.perfil || {};
  const periodos = Number(perfil.periodos) || 52;
  const fed = perfil.federal || {};
  const est = perfil.estatal || {};

  const sueldo = centavos(Number(e.sueldo) || 0);
  const tarjeta = centavos(Number(e.tarjeta) || 0);
  const declarado = centavos(Number(e.declarado) || 0);
  const bruto = centavos(sueldo + tarjeta + declarado);
  const hayAcumulado = e.acumulado !== null && e.acumulado !== undefined
                    && isFinite(Number(e.acumulado));
  const antes = hayAcumulado ? Math.max(0, Number(e.acumulado)) : 0;

  /* Un porcentaje con tope sobre el año. Con el acumulado se calcula como la
     nómina: lo retenido en el año hasta hoy menos lo retenido hasta el cheque
     anterior, cada uno redondeado. Así no se arrastran medios centavos. */
  const sobreElAnio = (tasa, tope) => {
    if (!hayAcumulado) return centavos(Math.min(bruto, tope) * tasa);
    const hasta = monto => centavos(Math.min(monto, tope) * tasa);
    return centavos(hasta(antes + bruto) - hasta(antes));
  };
  // Igual, pero redondeando cada periodo (así salen DI y FLI en la nómina).
  const delPeriodo = (tasa, tope) =>
    centavos(Math.max(0, Math.min(bruto, tope - antes)) * tasa);

  // Federal: Worksheet 1A de la Pub 15-T, paso por paso.
  const estado = ['casadoJunto', 'jefeHogar'].includes(fed.estado) ? fed.estado : 'soltero';
  const anual = bruto * periodos + (Number(fed.paso4a) || 0);
  const deduccion = (Number(fed.paso4b) || 0) + (fed.paso2 ? 0
    : T.federal.deduccionSinPaso2[estado === 'casadoJunto' ? 'casadoJunto' : 'otro']);
  const ajustado = Math.max(0, anual - deduccion);
  const tabla = T.federal.tablas[fed.paso2 ? 'paso2' : 'normal'][estado];
  const tentativo = centavos(porTramos(tabla, ajustado) / periodos);
  const federal = centavos(Math.max(0, tentativo - (Number(fed.paso3) || 0) / periodos)
                         + (Number(fed.paso4c) || 0));

  const ss = sobreElAnio(T.socialSecurity.tasa, T.socialSecurity.tope);
  const medicare = centavos(sobreElAnio(T.medicare.tasa, Infinity)
    + Math.max(0, antes + bruto - Math.max(antes, T.medicare.desde)) * T.medicare.adicional);

  const lineas = [
    { clave: 'federal', monto: federal },
    { clave: 'socialSecurity', monto: ss },
    { clave: 'medicare', monto: medicare }
  ];

  if (est.tipo === 'nj') {
    const tablaNJ = T.nj;
    const tasa = tablaNJ.tablas[est.tasa] ? est.tasa : 'A';
    const gravable = Math.max(0, bruto * periodos - (Number(est.exenciones) || 0) * tablaNJ.exencion);
    lineas.push(
      { clave: 'njRenta', monto: centavos(porTramos(tablaNJ.tablas[tasa], gravable) / periodos) },
      { clave: 'njUI',  monto: delPeriodo(tablaNJ.ui.tasa, tablaNJ.ui.tope) },
      { clave: 'njDI',  monto: delPeriodo(tablaNJ.di.tasa, tablaNJ.di.tope) },
      { clave: 'njFLI', monto: delPeriodo(tablaNJ.fli.tasa, tablaNJ.fli.tope) });
  } else if (est.tipo === 'porcentaje') {
    lineas.push({ clave: 'estatal', monto: centavos(bruto * (Number(est.porcentaje) || 0) / 100) });
  }

  const retenciones = centavos(lineas.reduce((s, l) => s + l.monto, 0));
  return {
    bruto,
    lineas,
    retenciones,
    neto: centavos(bruto - retenciones - declarado),
    anioTablas,
    tablasDelAnio: anioTablas === anioPedido
  };
}

/**
 * El porcentaje estatal de una persona, sacado de un cheque suyo: lo que el
 * cheque retuvo para el estado (todas las líneas del estado sumadas) entre
 * su bruto. Es la salida para los estados que la app no tiene en tablas: no
 * es exacto (el impuesto estatal casi siempre es progresivo), pero es el de
 * ESA persona y se puede rehacer con un cheque nuevo.
 */
function calibrarEstatal(bruto, retenidoEstatal) {
  const b = Number(bruto) || 0;
  if (b <= 0) return 0;
  return Math.round((Number(retenidoEstatal) || 0) / b * 100 * 10000) / 10000;
}

/**
 * El día en que llega el cheque de una semana: el primer `diaPago` DESPUÉS
 * del último día de la semana (con la numeración de `getDay()`, 0 domingo).
 * La semana que termina el domingo 18 y se paga los jueves llega el 22.
 */
function fechaDePago(finDeSemana, diaPago) {
  const objetivo = Number.isInteger(diaPago) && diaPago >= 0 && diaPago <= 6 ? diaPago : 4;
  for (let i = 1; i <= 7; i++) {
    const fecha = sumarDias(finDeSemana, i);
    const [a, m, d] = fecha.split('-').map(Number);
    if (new Date(a, m - 1, d).getDay() === objetivo) return fecha;
  }
  return sumarDias(finDeSemana, 7);   // no se llega aquí: algún día de 7 coincide
}

/**
 * Lo que entra al cheque por una semana de turnos: el sueldo, la propina de
 * tarjeta y el efectivo declarado. Es lo que pide `estimarCheque`.
 *
 * El efectivo "anotado" es el que de verdad queda en el bolsillo: con el
 * tip-out pagado en billetes, el efectivo neto (`efectivoMostrado`).
 *
 * @param {Object} opciones { declara, porcentaje, tipOutEnEfectivo }
 */
function chequeDeLaSemana(turnos, opciones) {
  const o = opciones || {};
  const r = resumir(turnos);
  return {
    sueldo: r.sueldoBase,
    tarjeta: r.tarjeta,
    declarado: efectivoDeclarado(o.declara, {
      tarjeta: r.tarjeta, porcentaje: o.porcentaje,
      efectivoNeto: efectivoMostrado(r, !!o.tipOutEnEfectivo)
    })
  };
}

/**
 * El bruto del año ANTES de un cheque, que necesita `estimarCheque` para los
 * topes. Dos fuentes:
 *
 *   - **El ancla**: el "year to date" que la persona copió de un cheque suyo,
 *     con la fecha de pago de ese cheque (y ese cheque ya va dentro). Para un
 *     cheque posterior se le suma lo anotado de las semanas pagadas después;
 *     para ese mismo cheque o uno anterior, se le resta lo de las semanas
 *     pagadas desde el cheque que se calcula hasta el del ancla. Lo segundo
 *     es lo que pasa siempre el día de pago: se copia el cheque que se tiene
 *     en la mano y se mira la semana que paga. Es lo más fiable, porque la
 *     app no sabe lo que se ganó antes de empezar a usarla.
 *   - **La app**: sin ancla (o con una de otro año), la suma de los brutos de
 *     las semanas anotadas que se pagan este año antes de este cheque.
 *
 * `completo` dice si el monto cubre todo el año. Con ancla, sí. Sin ella,
 * solo si hay semanas anotadas pagadas hasta el 7 de enero: el primer día de
 * pago del año siempre cae en esa semana, así que quien ya anotaba entonces
 * tiene el año entero en la app. Quien empezó a usarla a mitad de año, no: la
 * pantalla se lo pide, porque sin el acumulado no se ven los topes.
 *
 * @param {Array}  semanas   [{ fechaPago, bruto }] de todas las semanas anotadas
 * @param {string} fechaPago la de este cheque
 * @param {Object} ancla     { monto, fecha } o null
 * @returns {{ monto: number, fuente: 'ancla'|'app', completo: boolean }}
 */
function acumuladoDelAnio(semanas, fechaPago, ancla) {
  const anio = String(fechaPago).slice(0, 4);
  const lista = Array.isArray(semanas) ? semanas : [];
  const delAnio = lista.filter(s => String(s.fechaPago).slice(0, 4) === anio);
  // Lo pagado con desde < fecha ≤ hasta (o < hasta, si `cerrado` es falso).
  const suma = (desde, hasta, cerrado) => centavos(delAnio
    .filter(s => s.fechaPago > desde && (cerrado ? s.fechaPago <= hasta : s.fechaPago < hasta))
    .reduce((t, s) => t + (Number(s.bruto) || 0), 0));

  const a = ancla || {};
  const anclaSirve = isFinite(Number(a.monto)) && a.monto !== null && a.monto !== ''
    && typeof a.fecha === 'string' && a.fecha.slice(0, 4) === anio;
  if (anclaSirve) {
    const monto = a.fecha < fechaPago
      ? Number(a.monto) + suma(a.fecha, fechaPago, false)
      // Desde el día ANTERIOR al de este cheque: este cheque también se resta.
      : Number(a.monto) - suma(sumarDias(fechaPago, -1), a.fecha, true);
    return { monto: centavos(Math.max(0, monto)), fuente: 'ancla', completo: true };
  }
  const primeraSemana = anio + '-01-07';
  return {
    monto: suma('', fechaPago, false),
    fuente: 'app',
    completo: fechaPago <= primeraSemana || lista.some(s => s.fechaPago <= primeraSemana)
  };
}

const MINIMO_TURNOS_AVISO_RESPALDO = 5;
const DIAS_AVISO_RESPALDO = 30;
const DIAS_POSPONER_RESPALDO = 7;

/**
 * Si hay que avisar de que falta un respaldo, y por qué.
 * Devuelve `null` si no, o `{ dias }`: `null` si nunca se hizo, o cuántos
 * días tiene el último.
 *
 * Las fechas que no se entienden cuentan como que no existen: un respaldo con
 * fecha ilegible es "nunca", y un "ahora no" ilegible no esconde nada. En la
 * duda, avisar; un aviso de más molesta, uno de menos cuesta los turnos.
 */
function avisoRespaldo(turnos, ultimoRespaldo, pospuesto, hoyTexto) {
  const cuantos = Array.isArray(turnos) ? turnos.filter(turnoValido).length : 0;
  if (cuantos < MINIMO_TURNOS_AVISO_RESPALDO) return null;

  const desdePospuesto = diasEntre(pospuesto, hoyTexto);
  if (desdePospuesto !== null && desdePospuesto >= 0
      && desdePospuesto < DIAS_POSPONER_RESPALDO) return null;

  const dias = diasEntre(ultimoRespaldo, hoyTexto);
  if (dias === null) return { dias: null };
  // Una fecha en el futuro (reloj movido) se trata como hoy: no avisa.
  return dias >= DIAS_AVISO_RESPALDO ? { dias } : null;
}


/* --- Para que node pueda probar este archivo ----------------------------- */
/* En el navegador estas funciones ya quedan disponibles al cargar el script.
   `module` solo existe cuando el archivo lo abre node, así que esta línea es
   invisible para el teléfono y necesaria para las pruebas. */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    redondear, leerNumero, horaAMinutos, calcularHoras, calcularTipOut,
    calcularTipOutTramos, revisarCortes, estadoDeCortes,
    calcularTurno, resumir, lunesDeLaSemana, inicioDeSemana, numeroDelDia,
    sumarDias, diasEntre, diasDeLaSemana, turnosDelDia,
    horasFrecuentes, mejorTurno, cifrasPrincipales, efectivoMostrado,
    detalleSemana, DETALLES,
    estimarCheque, efectivoDeclarado, calibrarEstatal, TABLAS_CHEQUE,
    fechaDePago, chequeDeLaSemana, acumuladoDelAnio,
    turnoValido, fusionarTurnos,
    franjaDelTurno, minutosDeCorte, turnosDelPeriodo, reportePorDia, reportePorFranja, mejorGrupo,
    avisoRespaldo, resumenAnual, aniosConTurnos, celdaCSV, turnosACSV,
    COLUMNAS_CSV,
    CORTE_TARDE_MIN, MINIMO_TURNOS_REPORTE, MINIMO_TURNOS_AVISO_RESPALDO,
    DIAS_AVISO_RESPALDO, DIAS_POSPONER_RESPALDO
  };
}
