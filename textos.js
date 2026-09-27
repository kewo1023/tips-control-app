/* ============================================================================
   TEXTOS — Tips Control
   Copyright (c) 2026 Kevin Rincón. Todos los derechos reservados. Ver LICENSE.
   ----------------------------------------------------------------------------
   Es la sección M0 de index.html, sacada a su propio archivo porque era la
   parte más larga (un tercio del script) y la que más crece: cada pantalla y
   cada pregunta de ayuda nueva añade dos textos. Se carga antes que el script
   de la app, igual que logica.js.

   Si este archivo llega viejo (el index.html es nuevo y este no), a la app le
   faltarían textos. `t()` lo detecta y avisa: ver "Si falta un texto" en
   index.html. Es la misma trampa del 8 de agosto con logica.js.
   ========================================================================== */

/* ============================================================================
   Los textos en los dos idiomas (antes, sección M0)
   ----------------------------------------------------------------------------
   Aquí no hay ningún traductor automático. Cada frase está escrita a mano en
   los dos idiomas, y por eso el vocabulario del oficio queda bien: un
   traductor automático convertiría "tip-out" en "propina fuera" y "busser" en
   cualquier cosa.

   Regla para el futuro: **ningún texto que vea el usuario se escribe suelto en
   el código.** Se le pone una clave aquí y se llama con `t('clave')`. Si un
   texto se cuela sin traducir, la app se ve mitad en español y mitad en
   inglés, que es peor que estar entera en el idioma equivocado.

   Los nombres de los roles (Busser, Barra…) NO se traducen: son datos que
   escribe el usuario, no textos de la app.
   ========================================================================== */

const TEXTOS = {
  es: {
    // Pantalla de la semana
    semana: 'Semana', ajustes: 'Ajustes', hoy: 'Hoy',
    netoSemana: 'Neto de la semana',
    pista: 'Toca un día para registrar el turno.',
    sinTurnos: 'Sin turnos esta semana',
    turno: 'turno', turnos: 'turnos',
    queSemanaPasada: 'que la semana pasada',
    mostrarMas: 'Mostrar más estadísticas', mostrarMenos: 'Mostrar menos',
    mejorDia: 'Mejor día', conEn: 'con', enHoras: 'en',
    semanaAnterior: 'Semana anterior', semanaSiguiente: 'Semana siguiente',
    letrasDias: ['L','M','X','J','V','S','D'],
    reportes: 'Reportes',
    diagnostico: 'Medidas de la pantalla. Mándale una captura de esto a quien te pasó la app:',
    repPorDia: 'Por día de la semana', repFranjas: 'Mañana o tarde',
    rep30: '30 días', rep90: '90 días', repAno: '1 año', repTodo: 'Todo',
    repDia: 'Día', repPorHora: 'Por hora', repTurnos: 'Turnos', repPorTurno: 'Por turno',
    repEtiquetaPropina: 'Tu mejor día · propina por hora',
    repEtiquetaTotal: 'Tu mejor día · total por hora',
    repContra: 'Los %1, en %2 turnos',
    repPocosDatos: 'pocos datos',
    repSinMejor: 'Todavía no hay un día con 3 turnos o más en este período. Con menos, comparar días es adivinar.',
    repSinTurnos: 'No hay turnos en este período.',
    repPorHoraTurnos: 'por hora · %1 turnos',
    repAclara: 'Mañana: sales a las 3 pm o antes. Tarde: sales después, dobles incluidos.',
    repSinHora: '%1 turnos sin hora de salida no entran en mañana o tarde.',
    nombresDias: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],
    diasPlural: ['lunes','martes','miércoles','jueves','viernes','sábados','domingos'],
    franjaManana: 'Mañana', franjaTarde: 'Tarde',

    // Los botones del diálogo
    dlgAceptar: 'Aceptar', dlgCancelar: 'Cancelar', dlgEntendido: 'Entendido',

    // Aviso y pantalla de instalación
    instTitulo: 'Instala la app',
    instEntradilla: 'Tips Control funciona como una app de tu teléfono. Instálala primero: solo toma unos segundos.',
    instSalida: 'Prefiero usarla en el navegador',
    instSalidaPregunta: 'Sin instalar, lo que registres se queda en el navegador y NO aparecerá en la app cuando la instales. Además el teléfono puede borrarlo si pasas una semana sin abrirla. ¿Seguir así?',
    instIOS: 'Se abre como una app normal, sin la barra del navegador.',
    instPaso1a: 'Toca',
    instPaso1b: 'en la barra de Safari (abajo del todo).',
    /* Chrome y Firefox de iPhone son Safari por dentro, pero el botón de
       compartir lo tienen arriba a la derecha y no abajo. Es la clase de detalle
       que convierte un paso a paso en un mensaje de WhatsApp. */
    instPaso1bOtro: 'arriba a la derecha, en la barra del navegador.',
    instPaso2: 'Baja y toca <b>«Añadir a pantalla de inicio»</b> (en inglés, <b>Add to Home Screen</b>).',
    instPaso3: 'Toca <b>«Añadir»</b> arriba a la derecha. Listo.',
    instBoton: 'Instalar la app',
    instAndroid: 'Se abre como una app normal, sin la barra del navegador.',
    instOtro: 'Estás viendo la app dentro de otra aplicación (WhatsApp, Instagram…) y desde aquí no se puede instalar. Copia la dirección y ábrela en <b>Safari</b>.',
    instCopiar: 'Copiar dirección',
    instCopiada: '¡Copiada!',
    instCopiarMal: 'No se pudo copiar sola. Esta es la dirección:',
    instLuego: 'Ahora no',
    /* Este es el texto que hace que el banner no se lea como un capricho. Sin
       él, "instálala" es una molestia; con él, es la diferencia entre conservar
       tus turnos y perderlos. */
    instAviso: 'Importante: instálala antes de registrar turnos. Lo que apuntes aquí en el navegador no pasa a la app instalada, y el teléfono puede borrarlo si pasas una semana sin abrirla.',

    // Métricas y su explicación
    mHoras: 'Horas',        nHoras: 'Suma de la duración de cada turno.',
    mPorHora: 'Por hora',   nPorHora: 'Todo lo que te llevas ÷ horas trabajadas.',
    mEfectivo: 'Efectivo',  nEfectivo: 'Propina en billetes. Va a tu bolsillo esa noche.',
    /* Nombre distinto porque es un número distinto. Si se hubiera quedado
       llamándose "Efectivo" a secas, quien lleva semanas mirando esa cifra la
       vería bajar de golpe y lo leería como que la app se rompió. */
    mEfectivoNeto: 'Efectivo neto',
    nEfectivoNeto: 'Los billetes que te quedan después de pagar el tip-out. Puede salir negativo: es la noche en que pusiste de tu cartera.',
    mTarjeta: 'Tarjeta',    nTarjeta: 'Propina en tarjeta. Llega en el cheque.',
    mPropinas: 'Propinas',  nPropinas: 'Efectivo + tarjeta, antes del tip-out.',
    mTipOut: 'Tip-out',     nTipOut: 'Lo que repartiste a los ayudantes.',
    mVentas: 'Ventas',      nVentas: 'Lo que vendiste en total.',
    mPropVtas: 'Prop/vtas', nPropVtas: 'Propinas ÷ ventas. Qué tan bien te fue con los clientes.',
    mSueldo: 'Sueldo',      nSueldo: 'Horas × tu tarifa por hora.',
    mPorTurno: 'Por turno', nPorTurno: 'Promedio de lo que te llevas cada turno.',

    // Formulario
    cerrar: 'Cerrar', entrada: 'Entrada', salida: 'Salida',
    ventasTurno: 'Ventas del turno',
    propEfectivo: 'Propina efectivo', propTarjeta: 'Propina tarjeta',
    ayudantes: 'Ayudantes del turno', nota: 'Nota',
    notaEjemplo: 'Sección 3, evento privado…',
    guardarTurno: 'Guardar turno', borrarTurno: 'Borrar este turno',
    ayudante: 'ayudante', ayudantesPl: 'ayudantes',
    sueldoRecibo: 'Sueldo',
    propinasDe: 'Efectivo + tarjeta',
    /* Antes decía "Propina sobre ventas". Es exacto y suena a contabilidad.
       No se puso "Propina promedio" porque ese 18% no es un promedio de nada
       —es una división, propinas ÷ ventas— y porque "promedio" ya significa
       otra cosa en esta app: la métrica "Por turno" de la semana sí es un
       promedio, y sí está en dólares. Una palabra, un significado. */
    propinaDejada: 'Te dejaron de propina',
    /* Dos nombres para la misma línea, y la que se pinta depende de si el
       sueldo entra en la cuenta. Es la misma regla que ya cambia "Efectivo"
       por "Efectivo neto": la etiqueta cambia con la cifra.
       Con el sueldo apagado, ese número NO es el total del turno —el sueldo
       aparece debajo, fuera de la suma—, así que llamarlo "Total del turno"
       se leería como una resta que no cuadra. */
    totalTurno: 'Total del turno',
    teLlevas: 'Total que te llevas',
    porHoraRecibo: 'Por hora',
    /* Sirve para los dos casos que llevan a no tener roles: quien marcó en la
       bienvenida que en su restaurante no se reparte, y quien los borró todos
       sin querer. Al primero, "agrega tus roles en Ajustes" a secas lo dejaba
       pensando que le faltaba algo por hacer. */
    rolesEnAjustes: 'Este turno va sin tip-out. Si en tu restaurante sí se reparte, agrega los roles en Ajustes.',

    // Ajustes
    trabajo: 'Trabajo', restaurante: 'Restaurante', sueldoHora: 'Sueldo por hora',
    idioma: 'Idioma', apariencia: 'Apariencia',
    ayudantesTipout: 'Ayudantes y tip-out', agregarRol: '+ Agregar rol',
    sobreVentas: 'Porcentaje sobre las ventas del turno. Con todos:',
    respaldo: 'Respaldo',
    soloTelefono: 'Los datos viven solo en este teléfono. Exporta de vez en cuando.',
    ultimoRespaldoNunca: 'Todavía no has hecho ningún respaldo en este teléfono.',
    ultimoRespaldoHoy: 'Último respaldo: hoy.',
    ultimoRespaldoAyer: 'Último respaldo: ayer.',
    ultimoRespaldoDias: 'Último respaldo: hace %1 días.',
    errorExportar: 'No se pudo hacer el respaldo. Tus turnos siguen guardados en el teléfono; vuelve a intentarlo. Si se repite, manda esta pantalla por WhatsApp:',
    exportar: 'Exportar', importar: 'Importar',
    borrarTodo: 'Borrar todos los datos',
    pieDerechos: 'Tips Control %1\n© 2026 Kevin Rincón. Todos los derechos reservados.',
    temaAuto: 'Automático', temaClaro: 'Claro', temaOscuro: 'Oscuro',
    miRestaurante: 'Mi restaurante', nuevoRol: 'Nuevo rol',

    // Avisos
    faltaHora: 'Falta la hora de entrada o la de salida. Sin las dos no se puede calcular cuánto ganaste por hora.',
    /* El nombre del campo va dentro del mensaje. Sin él, quien lo lea tiene
       que revisar los tres números para encontrar cuál es. */
    numeroIlegible: 'No se entendió lo que escribiste en “%1”, así que no se guardó. Lo demás está a salvo. Escribe solo números; para los centavos usa la coma o el punto, el que te dé tu teclado. Por ejemplo: 1234,50',
    campoPorcentaje: 'Porcentaje del ayudante',
    ventasCambio: 'Ventas hasta el cambio de equipo',
    // Los cambios de equipo a mitad de turno
    equipoCambio: '+ El equipo cambió durante el turno',
    tramoHasta: 'Hasta el cambio %1',
    tramoResto: 'Lo que queda',
    alPorciento: 'al',
    cambioEquipo: 'cambio', cambiosEquipoPl: 'cambios',
    corteFalta: 'Falta escribir las ventas de un cambio de equipo. Si al final no hubo cambio, quita la línea con la ✕.',
    corteOrden: 'Las ventas de cada cambio tienen que ser mayores que las del cambio anterior, y mayores que cero. Son las ventas acumuladas del turno hasta ese momento, tal como salen en el recibo.',
    cortePasa: 'Un cambio de equipo no puede tener más ventas que el turno entero (%1). Revisa las ventas del turno o el número del cambio.',
    // El incentivo
    incentivoActivar: 'Llevar la cuenta de un incentivo',
    incentivoNota: 'Añade un campo opcional en cada turno y su total en la semana, dentro de más estadísticas. Para los puntos que dan por vender ciertos productos.',
    incentivoNombre: 'Cómo se llama',
    incentivoPorDefecto: 'Puntos',
    incentivoEnTurnos: 'en %1 de %2 turnos',
    nIncentivo: 'La suma de lo que anotaste en cada turno de la semana. El campo es opcional: los turnos donde no anotaste nada no suman, y por eso debajo dice en cuántos lo anotaste.',
    faltaPlata: 'Escribe al menos las ventas o la propina del turno. Un turno sin ninguna cifra no se puede guardar.',
    confirmBorrarTurno: 'Se va a borrar el turno del',
    confirmBorrarTurno2: 'No se puede deshacer.',
    confirmQuitarRol: '¿Quitar "%s"? Los turnos ya guardados no cambian.',
    confirmImportar: 'El respaldo trae %1 turnos. Se agregan solo los días que hoy tienes vacíos: nada de lo que ya está guardado se borra, y tus ajustes se quedan como están. ¿Seguir?',
    confirmImportarNuevo: 'El respaldo trae %1 turnos. Como este teléfono todavía no tiene turnos, también se traen los ajustes del respaldo: sueldo, ayudantes y porcentajes. ¿Seguir?',
    resumenImportar: 'Listo: %1 turnos agregados, %2 omitidos porque ese día ya tenía turno.',
    resumenIgnorados: 'Otros %1 no se pudieron leer y se dejaron fuera.',
    errorImportar: 'Algo falló al importar y no se cambió nada. Manda esta pantalla por WhatsApp:',
    appAMedias: 'La app se actualizó a medias y no puede abrir sin riesgo. Tus turnos están a salvo: no se ha tocado nada. Ciérrala del todo (deslízala hacia arriba) y vuelve a abrirla.',
    bienvenida: 'Bienvenido',
    bienvenidaIntro: 'Antes de empezar, dos datos de tu trabajo. Sin ellos las cuentas saldrían con los valores de otro restaurante.',
    bienvenidaTipout: 'El porcentaje de tus ventas que le pagas a cada rol. Los nombres son los más comunes: cámbialos o quita los que no existan en tu restaurante.',
    sinTipout: 'En mi restaurante no se paga tip-out',
    empezar: 'Empezar',
    faltaTarifa: 'Pon tu sueldo por hora. Si te pagan solo con propinas, escribe 0.',
    faltaTipout: 'Falta el porcentaje de al menos un ayudante. Si en tu restaurante no se paga tip-out, marca la casilla de abajo.',
    sumarSueldo: 'Sumar el sueldo por hora al total',
    sumarSueldoNota: 'Apagado, el total de cada turno son solo las propinas menos el tip-out. El sueldo se sigue viendo aparte.',
    /* Esta casilla no es un gusto: es un dato del restaurante, como el sueldo
       por hora. Por eso vive en Trabajo y no en Apariencia. */
    tipOutEfectivo: 'El tip-out se paga en efectivo',
    tipOutEfectivoNota: 'Encendido, el tip-out se descuenta del efectivo, que es de donde sale: los billetes se entregan en la mano al terminar. Apágalo si en tu restaurante lo descuentan del cheque. El total del turno no cambia en ninguno de los dos casos.',
    verComparaciones: 'Comparar con la semana anterior',
    tamanoLetra: 'Tamaño de la letra',
    escalaNormal: 'Normal', escalaGrande: 'Grande', escalaMayor: 'Mayor',

    verAyuda: 'Cómo funciona la app',
    ayuda: 'Cómo funciona',

    ayudaRegistrarP: '¿Cómo registro un turno?',
    ayudaRegistrarR: 'Toca el día en la fila de los siete cuadros. Se abre el formulario de ese día: pones la hora de entrada y la de salida, las ventas, y cuánto te dieron en efectivo y en tarjeta. Marcas qué ayudantes trabajaron y guardas. No hay que escribir la fecha en ningún sitio: la fecha es el día que tocaste.',

    ayudaCorregirP: '¿Puedo corregir un turno ya guardado?',
    ayudaCorregirR: 'Sí. Toca otra vez ese mismo día y se abre con lo que habías puesto. Cambias lo que haga falta y guardas. No se crea un turno nuevo: se corrige el que había. Ahí mismo está el botón para borrarlo, si lo registraste por error.',

    ayudaTipoutP: '¿Cómo calcula la app el tip-out?',
    ayudaTipoutR: 'Cada ayudante tiene un porcentaje fijo, y ese porcentaje se aplica sobre las VENTAS del turno, no sobre tus propinas. Si esa noche no hubo bakery, su porcentaje simplemente no se cuenta y los demás no reciben más por eso. Por eso hay que marcar quién trabajó: la app suma solo los porcentajes de los que marcaste. Los porcentajes se cambian en Ajustes.',

    ayudaSueldoP: '¿Por qué el total no suma mi sueldo por hora?',
    ayudaSueldoR: 'Porque el sueldo por hora no te lo llevas esa noche: llega en el cheque, más tarde y con las retenciones ya descontadas. Sumarlo al total del turno da un número que nunca ves entero. Igual se sigue mostrando, debajo del total y sin sumarse, para que sepas cuánto va al cheque. Si prefieres verlo sumado, se enciende en Ajustes.',

    ayudaPorHoraP: '¿Qué significa "por hora"?',
    ayudaPorHoraR: 'Lo que te dejó cada hora que estuviste ahí: el total dividido entre las horas trabajadas. Es el número que sirve para decidir qué turnos te convienen. Un turno de $150 en 4 horas te deja más que uno de $180 en 8, aunque el segundo suene mejor.',

    ayudaFuturoP: '¿Por qué no puedo pasar a la semana que viene?',
    ayudaFuturoR: 'Porque todavía no ha pasado y no hay nada que apuntar. La flecha se activa cuando llega. Hacia atrás sí puedes ir todo lo que quieras.',

    ayudaReportesP: '¿Cómo leo los Reportes?',
    ayudaReportesR: 'Reportes junta tus turnos por día de la semana y te dice cuál te deja más por hora. Ese "por hora" es todo lo que ganaste ese día dividido entre todas las horas, así que un doble pesa lo que duró. Un día solo compite si tiene 3 turnos o más en el período; con menos sale "pocos datos", porque dos viernes buenos no dicen que el viernes pague más. Mañana es cuando sales a las 3 pm o antes; tarde, cuando sales después, dobles incluidos. Puedes mirar los últimos 30 días, 90 días, 1 año o todo.',

    ayudaCambioPctP: 'Me cambiaron los porcentajes del tip-out, ¿qué hago?',
    ayudaCambioPctR: 'Cámbialos en Ajustes y listo. Los turnos que ya tienes guardados NO se recalculan: cada uno se queda con el porcentaje que se pagó ese día, que es lo correcto. Lo nuevo empieza a usar el porcentaje nuevo.',

    ayudaDatosP: '¿Dónde están mis datos? ¿Y si cambio de teléfono?',
    ayudaDatosR: 'Tus turnos están guardados solo en este teléfono, no en internet: nadie más los ve, pero tampoco hay copia en ningún lado. Por eso, cada cierto tiempo entra en Ajustes y toca Exportar: sale un archivo con todo. En el iPhone, con la app instalada, se abre el menú de compartir: elige Guardar en Archivos. Guárdalo donde no lo pierdas; en Ajustes ves cuándo fue tu último respaldo. En el teléfono nuevo instalas la app y tocas Importar. Si no exportas y pierdes el teléfono, los turnos no se pueden recuperar.',

    ayudaVentasP: '¿Qué número pongo en Ventas?',
    ayudaVentasR: 'Las ventas netas de tu cierre (checkout) en el punto de venta: sin impuestos y sin propinas. Es la cifra sobre la que se calcula el tip-out. Si en tu restaurante el tip-out se calcula sobre otra cifra, pon esa.',

    ayudaEquipoP: '¿Qué es "El equipo cambió durante el turno"?',
    ayudaEquipoR: 'Es para las noches en que llegan o se van ayudantes a mitad de turno y el tip-out cambia desde ese momento. Tocas ese enlace, escribes las ventas que marcaba el punto de venta cuando cambió el equipo y marcas quién había antes y quién después. La app calcula cada tramo con su equipo. Si el equipo fue el mismo toda la noche, no lo toques.',

    ayudaSemanaPagoP: '¿Qué día empieza mi semana?',
    ayudaSemanaPagoR: 'El día en que empieza tu semana de pago, para que el neto de la semana cuadre con tu cheque. Viene en lunes; si tu restaurante corta la semana otro día, cámbialo en Ajustes. Tus turnos no cambian: solo se agrupan distinto.',

    ayudaPrivacidadP: '¿Quién ve mis datos?',
    ayudaPrivacidadR: 'Nadie. Tus turnos se guardan solo en este teléfono: la app no tiene cuentas, no manda tus números a ningún servidor y no lleva publicidad ni rastreo. Como cualquier página web, el sitio donde vive la app (GitHub Pages) registra la dirección de internet de quien la abre; eso lo maneja GitHub, no la app.',

    // La hoja de ayuda de cada pantalla
    ayudaBoton: 'Ayuda',
    ayudaDe: 'Ayuda · %1',
    turnoTitulo: 'Turno',
    verTodas: 'Ver todas las preguntas',

    // El aviso de respaldo en la semana
    respaldoNuncaTitulo: 'Tus turnos no tienen copia',
    respaldoNuncaTexto: 'Si pierdes o cambias el teléfono, no se pueden recuperar. Exportar toma unos segundos.',
    respaldoViejoTitulo: 'Tu copia tiene %1 días',
    respaldoViejoTexto: 'Lo que registraste desde entonces no está en ninguna copia. Exportar toma unos segundos.',
    respaldoExportar: 'Exportar ahora',

    // El día en que empieza la semana de pago
    inicioSemana: 'La semana de pago empieza el',
    semanaDeA: 'De %1 a %2.',
    diasEnFrase: ['lunes','martes','miércoles','jueves','viernes','sábado','domingo'],
    archivoMalo: 'Ese archivo no parece un respaldo de Tips Control. Busca el que empieza por "tips-control-" y termina en .json, el que sale al tocar Exportar. Tus turnos no se han tocado.',
    datosIlegibles: 'No se pudieron leer los datos guardados en este teléfono. Se guardó una copia de lo que había por si se puede recuperar, así que NO borres la app ni sus datos. Manda una captura de esta pantalla antes de seguir usándola.',
    noSeGuardo: 'No se pudo guardar en este teléfono. Puede que no quede espacio, o que estés navegando en modo privado. Lo que escribiste sigue en pantalla: apúntalo en otro sitio antes de cerrar, o libera espacio y vuelve a intentarlo.',
    ofrecerRespaldo: 'Tienes %1 turnos guardados. ¿Quieres descargar un respaldo antes de borrarlos?',
    respaldoAntesDeBorrar: 'Listo el respaldo. Guárdalo donde lo puedas encontrar y vuelve a tocar Borrar todos los datos cuando quieras seguir.',
    confirmBorrarTodo: 'Se van a borrar %1 turnos de este teléfono. ¿Seguro?',
    confirmBorrarTodo2: 'No se puede deshacer y no hay forma de recuperarlos. ¿De verdad?'
  },

  en: {
    semana: 'Week', ajustes: 'Settings', hoy: 'Today',
    netoSemana: 'Week take-home',
    pista: 'Tap a day to log your shift.',
    sinTurnos: 'No shifts this week',
    turno: 'shift', turnos: 'shifts',
    queSemanaPasada: 'vs. last week',
    mostrarMas: 'Show more stats', mostrarMenos: 'Show less',
    mejorDia: 'Best day', conEn: 'with', enHoras: 'in',
    semanaAnterior: 'Previous week', semanaSiguiente: 'Next week',
    letrasDias: ['M','T','W','T','F','S','S'],
    reportes: 'Reports',
    diagnostico: 'Screen measurements. Send a screenshot of this to whoever shared the app with you:',
    repPorDia: 'By day of the week', repFranjas: 'Morning or evening',
    rep30: '30 days', rep90: '90 days', repAno: '1 year', repTodo: 'All',
    repDia: 'Day', repPorHora: 'Per hour', repTurnos: 'Shifts', repPorTurno: 'Per shift',
    repEtiquetaPropina: 'Your best day · tips per hour',
    repEtiquetaTotal: 'Your best day · total per hour',
    repContra: '%1, over %2 shifts',
    repPocosDatos: 'not enough data',
    repSinMejor: 'No day has 3 or more shifts in this period yet. With fewer, comparing days is guessing.',
    repSinTurnos: 'No shifts in this period.',
    repPorHoraTurnos: 'per hour · %1 shifts',
    repAclara: 'Morning: you leave at 3 pm or earlier. Evening: you leave later, doubles included.',
    repSinHora: '%1 shifts without a clock-out time are not counted as morning or evening.',
    nombresDias: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    diasPlural: ['Mondays','Tuesdays','Wednesdays','Thursdays','Fridays','Saturdays','Sundays'],
    franjaManana: 'Morning', franjaTarde: 'Evening',

    mHoras: 'Hours',       nHoras: 'Total length of every shift.',
    mPorHora: 'Per hour',  nPorHora: 'Everything you take home ÷ hours worked.',
    mEfectivo: 'Cash',     nEfectivo: 'Cash tips. Straight to your pocket that night.',
    mEfectivoNeto: 'Net cash',
    nEfectivoNeto: 'The bills you keep after paying tip-out. It can go negative: that is the night you paid out of your own pocket.',
    mTarjeta: 'Card',      nTarjeta: 'Credit card tips. They come on your paycheck.',
    mPropinas: 'Tips',     nPropinas: 'Cash + card, before tip-out.',
    mTipOut: 'Tip-out',    nTipOut: 'What you paid out to support staff.',
    mVentas: 'Sales',      nVentas: 'Your total sales.',
    mPropVtas: 'Tip %',    nPropVtas: 'Tips ÷ sales. How well your guests treated you.',
    mSueldo: 'Wages',      nSueldo: 'Hours × your hourly rate.',
    mPorTurno: 'Per shift', nPorTurno: 'Average take-home per shift.',

    cerrar: 'Close', entrada: 'Clock in', salida: 'Clock out',
    ventasTurno: 'Shift sales',
    propEfectivo: 'Cash tips', propTarjeta: 'Card tips',
    ayudantes: 'Support staff', nota: 'Note',
    notaEjemplo: 'Section 3, private party…',
    guardarTurno: 'Save shift', borrarTurno: 'Delete this shift',
    ayudante: 'person', ayudantesPl: 'people',
    sueldoRecibo: 'Wages',
    propinasDe: 'Cash + card',
    propinaDejada: 'Your guests tipped',
    totalTurno: 'Shift total',
    teLlevas: 'Your take-home',
    porHoraRecibo: 'Per hour',
    rolesEnAjustes: 'This shift has no tip-out. If your restaurant does share tips, add the roles in Settings.',

    trabajo: 'Job', restaurante: 'Restaurant', sueldoHora: 'Hourly wage',
    // Dialog buttons
    dlgAceptar: 'OK', dlgCancelar: 'Cancel', dlgEntendido: 'Got it',

    // Install prompt and screen
    instTitulo: 'Install the app',
    instEntradilla: 'Tips Control works like an app on your phone. Install it first: it only takes a few seconds.',
    instSalida: 'I would rather use it in the browser',
    instSalidaPregunta: 'Without installing, whatever you log stays in the browser and will NOT show up in the app once you install it. Your phone may also delete it if you go a week without opening it. Continue anyway?',
    instIOS: 'It opens like a normal app, with no browser bar.',
    instPaso1a: 'Tap',
    instPaso1b: 'in the Safari bar (at the very bottom).',
    instPaso1bOtro: 'in the top right of the browser bar.',
    instPaso2: 'Scroll down and tap <b>Add to Home Screen</b>.',
    instPaso3: 'Tap <b>Add</b> in the top right. Done.',
    instBoton: 'Install the app',
    instAndroid: 'It opens like a normal app, with no browser bar.',
    instOtro: 'You are viewing the app inside another application (WhatsApp, Instagram…) and it cannot be installed from here. Copy the address and open it in <b>Safari</b>.',
    instCopiar: 'Copy address',
    instCopiada: 'Copied!',
    instCopiarMal: 'Could not copy it. Here is the address:',
    instLuego: 'Not now',
    instAviso: 'Important: install it before logging any shifts. What you enter here in the browser does not carry over to the installed app, and your phone may delete it if you go a week without opening it.',

    idioma: 'Language', apariencia: 'Appearance',
    ayudantesTipout: 'Support staff and tip-out', agregarRol: '+ Add role',
    sobreVentas: 'Percentage of shift sales. With everyone:',
    respaldo: 'Backup',
    soloTelefono: 'Your data lives only on this phone. Export it now and then.',
    ultimoRespaldoNunca: 'You have not made a backup on this phone yet.',
    ultimoRespaldoHoy: 'Last backup: today.',
    ultimoRespaldoAyer: 'Last backup: yesterday.',
    ultimoRespaldoDias: 'Last backup: %1 days ago.',
    errorExportar: 'The backup could not be made. Your shifts are still saved on this phone; try again. If it happens again, send this screen over WhatsApp:',
    exportar: 'Export', importar: 'Import',
    borrarTodo: 'Delete all data',
    pieDerechos: 'Tips Control %1\n© 2026 Kevin Rincón. All rights reserved.',
    temaAuto: 'Automatic', temaClaro: 'Light', temaOscuro: 'Dark',
    miRestaurante: 'My restaurant', nuevoRol: 'New role',

    faltaHora: 'Clock-in or clock-out time is missing. Without both, hourly earnings can’t be calculated.',
    numeroIlegible: 'What you typed in “%1” wasn’t understood, so it wasn’t saved. Everything else is safe. Use numbers only; for cents use a comma or a period, whichever your keyboard gives you. For example: 1234.50',
    campoPorcentaje: 'Helper percentage',
    ventasCambio: 'Sales up to the team change',
    equipoCambio: '+ The team changed during the shift',
    tramoHasta: 'Up to change %1',
    tramoResto: 'What is left',
    alPorciento: 'at',
    cambioEquipo: 'change', cambiosEquipoPl: 'changes',
    corteFalta: 'One team change is missing its sales figure. If there was no change after all, remove the line with the ✕.',
    corteOrden: 'Each change must have higher sales than the previous one, and above zero. These are the shift sales accumulated up to that moment, as printed on the receipt.',
    cortePasa: 'A team change cannot have more sales than the whole shift (%1). Check the shift sales or the change figure.',
    incentivoActivar: 'Track an incentive count',
    incentivoNota: 'Adds an optional field on every shift and its weekly total, inside more stats. For the points earned by selling certain products.',
    incentivoNombre: 'What to call it',
    incentivoPorDefecto: 'Points',
    incentivoEnTurnos: 'on %1 of %2 shifts',
    nIncentivo: 'The sum of what you entered on each shift this week. The field is optional: shifts where you entered nothing do not add up, which is why it says how many you filled in.',
    faltaPlata: 'Enter at least the sales or the tips for this shift. A shift with no figures can’t be saved.',
    confirmBorrarTurno: 'This will delete the shift from',
    confirmBorrarTurno2: 'It cannot be undone.',
    confirmQuitarRol: 'Remove "%s"? Saved shifts stay as they are.',
    confirmImportar: 'The backup has %1 shifts. Only days that are empty right now will be added: nothing already saved gets deleted, and your settings stay as they are. Continue?',
    confirmImportarNuevo: 'The backup has %1 shifts. Since this phone has no shifts yet, the backup’s settings come in too: wage, support staff and percentages. Continue?',
    resumenImportar: 'Done: %1 shifts added, %2 skipped because that day already had a shift.',
    resumenIgnorados: 'Another %1 could not be read and were left out.',
    errorImportar: 'Something failed during the import and nothing was changed. Send this screen over WhatsApp:',
    appAMedias: 'The app updated halfway and cannot open safely. Your shifts are fine: nothing was touched. Close it completely (swipe it up) and open it again.',
    bienvenida: 'Welcome',
    bienvenidaIntro: 'Before you start, two things about your job. Without them the math would use another restaurant’s numbers.',
    bienvenidaTipout: 'The percentage of your sales you pay each role. These are the most common names: change them or remove the ones your restaurant doesn’t have.',
    sinTipout: 'My restaurant has no tip-out',
    empezar: 'Start',
    faltaTarifa: 'Enter your hourly wage. If you are paid in tips only, type 0.',
    faltaTipout: 'At least one helper needs a percentage. If your restaurant has no tip-out, check the box below.',
    sumarSueldo: 'Add hourly wage to the total',
    sumarSueldoNota: 'When off, each shift’s total is just tips minus tip-out. The wage is still shown separately.',
    tipOutEfectivo: 'Tip-out is paid in cash',
    tipOutEfectivoNota: 'When on, tip-out comes out of your cash, which is where it actually comes from: the bills are handed over at the end of the shift. Turn it off if your restaurant deducts it from your paycheck. Either way, the shift total stays the same.',
    verComparaciones: 'Compare with last week',
    tamanoLetra: 'Text size',
    escalaNormal: 'Normal', escalaGrande: 'Large', escalaMayor: 'Larger',

    verAyuda: 'How the app works',
    ayuda: 'How it works',

    ayudaRegistrarP: 'How do I log a shift?',
    ayudaRegistrarR: 'Tap the day in the row of seven boxes. That day’s form opens: enter your clock-in and clock-out times, the sales, and how much you got in cash and on cards. Mark which helpers worked and save. You never type a date anywhere: the date is the day you tapped.',

    ayudaCorregirP: 'Can I fix a shift I already saved?',
    ayudaCorregirR: 'Yes. Tap that same day again and it opens with what you entered. Change what you need and save. It does not create a second shift: it corrects the one that was there. The button to delete it is there too, if you logged it by mistake.',

    ayudaTipoutP: 'How does the app calculate tip-out?',
    ayudaTipoutR: 'Each helper has a fixed percentage, and that percentage applies to the SALES of the shift, not to your tips. If there was no bakery that night, their percentage simply isn’t counted, and the others don’t get more because of it. That’s why you mark who worked: the app only adds up the percentages you marked. You change the percentages in Settings.',

    ayudaSueldoP: 'Why doesn’t the total include my hourly wage?',
    ayudaSueldoR: 'Because you don’t take the hourly wage home that night: it arrives in your paycheck, later and with withholdings already taken out. Adding it to the shift total gives you a number you never see whole. It’s still shown, below the total and not added in, so you know what goes to the check. If you prefer it added, you can turn that on in Settings.',

    ayudaPorHoraP: 'What does "per hour" mean?',
    ayudaPorHoraR: 'What each hour you were there earned you: the total divided by hours worked. It’s the number that tells you which shifts are worth taking. A $150 shift in 4 hours leaves you more than a $180 one in 8, even though the second sounds better.',

    ayudaFuturoP: 'Why can’t I move to next week?',
    ayudaFuturoR: 'Because it hasn’t happened yet and there’s nothing to log. The arrow turns on when it arrives. You can go back as far as you like.',

    ayudaReportesP: 'How do I read Reports?',
    ayudaReportesR: 'Reports groups your shifts by day of the week and tells you which one pays you the most per hour. That "per hour" is everything you made that day divided by all the hours, so a double counts for as long as it lasted. A day only competes if it has 3 or more shifts in the period; with fewer it says "not enough data", because two good Fridays don’t mean Friday pays more. Morning is when you leave at 3 pm or earlier; evening, when you leave later, doubles included. You can look at the last 30 days, 90 days, 1 year or everything.',

    ayudaCambioPctP: 'My tip-out percentages changed. What do I do?',
    ayudaCambioPctR: 'Change them in Settings and that’s it. Shifts you already saved are NOT recalculated: each one keeps the percentage that was actually paid that day, which is the correct behavior. New shifts start using the new percentage.',

    ayudaDatosP: 'Where is my data? What if I change phones?',
    ayudaDatosR: 'Your shifts are saved only on this phone, not on the internet: nobody else sees them, but there’s no copy anywhere either. So every once in a while go to Settings and tap Export: you get a file with everything. On an iPhone, with the app installed, the share menu opens: choose Save to Files. Keep it somewhere safe; Settings shows when your last backup was. On the new phone you install the app and tap Import. If you don’t export and you lose the phone, the shifts cannot be recovered.',

    ayudaVentasP: 'What number goes in Sales?',
    ayudaVentasR: 'The net sales on your checkout from the point of sale: no tax and no tips. It is the number tip-out is calculated on. If your restaurant calculates tip-out on a different number, use that one.',

    ayudaEquipoP: 'What is "The team changed during the shift"?',
    ayudaEquipoR: 'It is for nights when helpers arrive or leave mid-shift and tip-out changes from that moment on. Tap that link, enter the sales the point of sale showed when the team changed, and mark who was there before and after. The app calculates each part with its own team. If the team was the same all night, leave it alone.',

    ayudaSemanaPagoP: 'What day does my week start?',
    ayudaSemanaPagoR: 'The day your pay week starts, so the week’s net matches your paycheck. It comes set to Monday; if your restaurant starts the week on another day, change it in Settings. Your shifts don’t change: they are just grouped differently.',

    ayudaPrivacidadP: 'Who sees my data?',
    ayudaPrivacidadR: 'Nobody. Your shifts are saved only on this phone: the app has no accounts, doesn’t send your numbers to any server, and has no ads or tracking. Like any website, the site where the app lives (GitHub Pages) logs the internet address of whoever opens it; GitHub handles that, not the app.',

    // The help sheet on each screen
    ayudaBoton: 'Help',
    ayudaDe: 'Help · %1',
    turnoTitulo: 'Shift',
    verTodas: 'See all questions',

    // The backup reminder on the week
    respaldoNuncaTitulo: 'Your shifts have no copy',
    respaldoNuncaTexto: 'If you lose or change your phone, they cannot be recovered. Exporting takes a few seconds.',
    respaldoViejoTitulo: 'Your copy is %1 days old',
    respaldoViejoTexto: 'What you logged since then is not in any copy. Exporting takes a few seconds.',
    respaldoExportar: 'Export now',

    // The day the pay week starts
    inicioSemana: 'Pay week starts on',
    semanaDeA: '%1 to %2.',
    diasEnFrase: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
    archivoMalo: 'That file doesn’t look like a Tips Control backup. Look for the one starting with "tips-control-" and ending in .json, the one you get from Export. Your shifts were not touched.',
    datosIlegibles: 'The data saved on this phone could not be read. A copy of what was there has been kept in case it can be recovered, so do NOT delete the app or its data. Send a screenshot of this message before you keep using it.',
    noSeGuardo: 'Could not save on this phone. You may be out of space, or browsing in private mode. What you typed is still on screen: write it down somewhere before closing, or free up space and try again.',
    ofrecerRespaldo: 'You have %1 shifts saved. Do you want to download a backup before deleting them?',
    respaldoAntesDeBorrar: 'Backup done. Save it somewhere you can find it, then tap Delete all data again when you are ready.',
    confirmBorrarTodo: 'This will delete %1 shifts from this phone. Sure?',
    confirmBorrarTodo2: 'It cannot be undone and there is no way to get them back. Really?'
  }
};
