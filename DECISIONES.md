# Decisiones e incidentes

Los porqués de Tips Control. `CLAUDE.md` tiene las reglas; aquí está de dónde
salió cada una. **Leer la parte que corresponda antes de tocar el código
relacionado.**

Sin cifras que caduquen (líneas, número de pruebas, versión): se miden en el
código.

---

## 1. La diferencia que lo cambia todo: varias personas

La usan un grupo cerrado de 10 a 50 meseros, con cuentas creadas o aprobadas a
mano. No es una app pública. Consecuencias:

- **Los errores ya no los ve solo quien la hizo.** Un fallo silencioso que él
  sabría interpretar, otro lo lee como "la app perdió mi dinero".
- **No se puede asumir un solo restaurante.** Tarifas y reglas de tip-out
  cambian de un sitio a otro.
- **Ni un solo teléfono.** El fallo de la coma decimal (sección 12) apareció en
  el iPhone de otro usuario y era invisible en el del desarrollador. El entorno
  del desarrollador es un caso, no el caso.
- **Los datos son sensibles:** ingresos de una persona.
- **El mantenedor es el soporte.** Cada función es algo que va a tener que
  explicar por WhatsApp un domingo.
- **No todos quieren ver lo mismo.** A unos les motiva la comparación con la
  semana pasada y a otros les pesa; de ahí la casilla para apagarla.
- **Los valores por defecto son para los demás**, no para quien la hizo.
- **RLS desde el día que exista base de datos**, no como arreglo posterior.

**Actualización (27 de septiembre de 2026): se va a compartir fuera del
restaurante donde nació.** Lo de arriba sigue valiendo y se agrava: el
mantenedor ya no conoce a cada usuario ni puede explicarle nada en persona, y
las reglas de cada restaurante dejan de ser las de uno. De ahí la semana de
pago configurable (sección 18) y la ayuda dentro de cada pantalla.

---

## 2. Instalación en el teléfono

Verificado con documentación el 9 de agosto de 2026.

**En iPhone no existe el botón de instalar.** Safari no implementa
`beforeinstallprompt`. El único camino es Compartir → Añadir a pantalla de
inicio, a mano. En Android sí hay prompt nativo y ahí se muestra un botón real.

**Chrome, Firefox y Edge en iPhone son Safari por dentro** (WebKit
obligatorio). Lo único que cambia es que el botón de compartir está arriba a la
derecha: de ahí `esOtroNavegadorIOS()` y la clave `instPaso1bOtro`.

**El almacenamiento del navegador y el de la app instalada son dos cajones
distintos que no se comunican**, aunque sea el mismo teléfono y la misma
dirección. Quien se configure en el navegador y luego instale se la encuentra
vacía. **Y Safari borra los datos de un sitio tras 7 días sin abrirlo**; una
app instalada en la pantalla de inicio queda fuera de esa regla. Usarla sin
instalar no es válido para una app de dinero.

**Por eso se cambió el ORDEN en vez de construir una migración:** "instálala
antes de registrar nada" son dos líneas de texto y una pantalla; mover datos
entre almacenamientos habría sido trabajo frágil de semanas.

### Cómo quedó

**Pantalla de instalación bloqueante (K4 + A3 + S2), antes de la
bienvenida.** Un aviso que se puede ignorar se ignora, y el precio lo paga la
persona veinte minutos después.

- **Tiene salida** ("Prefiero usarla en el navegador"), abajo y en gris. Toda
  la pantalla depende de una sola señal, `display-mode: standalone`; si esa
  detección falla en un teléfono raro, sin salida esa persona no podría usar la
  app nunca. Con un aviso, un falso negativo es una molestia; con una pantalla
  que tapa todo, es un muro.
- **La salida pregunta antes de dejar pasar** y dice qué se pierde.
- **En ordenador no aparece** (`debeInstalar()`).
- **`instalarOculto` vive en memoria y no se guarda.** Al cerrar la app vuelve
  la pantalla. Guardarlo sería guardarlo en el almacenamiento que el teléfono
  borra a los 7 días.

**Aviso en la semana (A2 + S2)** solo para quien eligió el navegador. Los
textos de los dos salen de `pasosInstalacion()`: un texto que vive en dos
sitios se corrige tarde o temprano en uno solo.

**Tres casos detectados:** Android con prompt; navegador metido dentro de otra
app (WhatsApp, Instagram), que no tiene "Añadir a pantalla de inicio" y por eso
se ofrece copiar la dirección y abrirla en Safari; y Safari o similar, con los
tres pasos.

### La primera pantalla, rehecha (27 de septiembre de 2026, elegida sobre una vista previa)

Reemplaza en parte lo de arriba: la salida y los pasos cambiaron.

- **Primero qué es la app** ("Tips Control" y una frase), después cómo
  instalarla. Quien abre un enlace que le pasaron no sabe para qué sirve lo que
  le piden instalar.
- **La salida ya no dice "Prefiero usarla en el navegador"** sino "Ya la
  instalé y me sigue saliendo esta pantalla". Se pidió quitarla; se mantuvo
  como puerta para el fallo de detección, que ahora tiene un caso concreto: en
  iOS 26, si al agregarla se apaga "Abrir como app web", el ícono abre Safari y
  la pantalla saldría siempre. Antes de dejar pasar explica el arreglo.
- **Los pasos dependen del teléfono** (`pasosInstalacion()`), con datos
  verificados en las guías de Apple y Google el 27 de septiembre de 2026:
  - Safari de iOS 26 o más: Más (···) → Compartir → Agregar a Inicio → dejar
    activado "Abrir como app web" → Agregar. Con los diseños de pestañas
    inferior o superior, Compartir está a la vista; como no se puede saber cuál
    usa la persona, el paso nombra los dos.
  - Safari de iOS 18 o antes: Compartir en la barra → Agregar a Inicio →
    Agregar.
  - Chrome, Edge o Firefox en iPhone: Compartir en la barra de la dirección.
  - Dentro de WhatsApp o Instagram: copiar la dirección y abrirla en Safari.
  - Android: con el permiso de Chrome, un botón; sin él, el menú (⋮).
- **La versión de iOS sale de la de Safari** (`versionSafariIOS()`). Desde iOS
  26, Safari congela el sistema en "18_6" en su identificación; "Version/26"
  sí cambia.
- **"Agregar a Inicio", no «Añadir a pantalla de inicio»**: es el nombre de
  Apple en el español de EE. UU. El otro es el de España.
- **Android ya no espera al permiso para mostrar la pantalla.** Chrome lo da
  después de un toque y 30 segundos en la página: en la primera visita no
  llegaba y la pantalla no salía. En Android el navegador y la app instalada
  comparten los datos, así que ahí el riesgo es menor que en iPhone.
- **Sin verificar:** el nombre exacto del menú de Chrome Android en español
  (la guía en inglés dice "Add to home screen"; la de es-419, "Instalar y crear
  acceso directo"). El paso nombra "Agregar a la pantalla principal" o
  "Instalar".

**Límite conocido:** si WhatsApp abre el enlace con el visor de Safari, no se
distingue y salen los tres pasos normales. El video de instalación que se manda
con el enlace tiene que **empezar en WhatsApp**: ese es el paso donde se atasca
la gente.

---

## 3. Diseño

**Prioridad: utilidad.** Minimalista, profesional; una herramienta de trabajo.

La primera versión se rechazó por demasiado color, aspecto genérico y mala
jerarquía tipográfica. Lo que quedó:

- **El color no rellena nada.** El verde va en la cifra principal, la barra de
  cada día y en lo que está seleccionado (sección 17). Cuando todo está
  resaltado, nada lo está.
- **Contraste de tamaño fuerte** entre la cifra y su etiqueta. Una jerarquía
  tímida se lee como desorden.
- Etiquetas en versalitas espaciadas (`.etiqueta`); cifras tabulares.
- **Registrar un turno: menos de 30 segundos y una sola pantalla.**
- **El texto de un botón verde va en `var(--papel)`, nunca en blanco fijo.**
  En oscuro el verde se aclara y el blanco encima quedaría ilegible.

### Navegación

**La pantalla principal es la semana**: siete días tocables, flechas entre
semanas y botón "Hoy". **Tocar un día abre su formulario** (crea o edita). Eso
eliminó la pestaña "Registrar" y el campo de fecha. Solo hay dos pestañas:
Semana y Ajustes.

- Con el formulario, la bienvenida o la instalación abiertos, **las pestañas
  se esconden**.
- No se puede avanzar más allá de la semana en curso.
- Al guardar, la app salta a la semana de ese turno.
- La Ayuda cuelga de Ajustes y su pestaña sigue marcada.
- **`pintar()` solo repinta la pantalla activa.** En las pruebas, leer el HTML
  de la semana estando en Ajustes devuelve lo de la última vez que se pintó.

### Los tres estados de un día

Trabajado, vacío ya pasado, vacío por venir. **El orden de los fondos dice
dónde va la vista: trabajado por delante, por venir en medio, libre al
fondo.** En claro sale solo. En oscuro costó dos intentos: el hueco primero se
hundió tanto que desapareció, y al subirlo pasó a ser la celda más clara y la
vista se iba a los días vacíos. La solución fueron tres escalones y una
variable aparte para la celda del día (`--dia` / `--dia-linea`), para subirla
sin arrastrar las tarjetas ni los formularios.

**En oscuro no se puede hundir nada por debajo del fondo: por debajo del
casi-negro no hay sitio.** La profundidad se construye hacia arriba y hay que
rehacer el orden entero.

### El efecto de profundidad

Los días libres se dibujan **3px hacia dentro por los cuatro lados** con
`::before` e `inset`, **sin encoger la celda**: encogiéndola se desalinean los
números y la zona de toque se hace más pequeña. **Separar la caja que se
dibuja de la caja que recibe el dedo** permite mover una sin tocar la otra.

El margen es igual por los cuatro lados y no proporcional: la celda es el
doble de alta que de ancha, y un margen proporcional se lee como una caja mal
centrada. El ojo percibe el hueco, no la razón entre los lados.

### El gris de `.metricas` no es decoración

`background: var(--linea)` con `gap: 1px` dibuja las rayas entre tarjetas. Con
siete tarjetas sobraban celdas y el fondo apareció como un bloque gris. Arreglo:
la última tarjeta se estira según `nth-child(3n+1)` / `3n+2`. **Cuando un color
existe para producir un efecto, escribir en el CSS por qué está.**

### Valores por defecto

**`PREFS_POR_DEFECTO`** — una sola constante usada en el objeto inicial,
`cargar()` y la importación (ver incidente del 9 de agosto).

- **`tema: 'claro'`**: el cierre de caja se hace con las luces del restaurante
  encendidas. Es lo primero que ve alguien que abre un enlace que le pasaron.
- **`escala: 'grande'`**: el default tiene que servirle a quien lee de pie al
  final del turno.
- Cambiar un default **no afecta a quien ya usa la app**: `cargar()` mezcla los
  valores por debajo de lo guardado. Dos pruebas lo vigilan.

**`TRABAJO_POR_DEFECTO`** existe porque `cargar()` mezcla superficialmente: el
`trabajo` guardado reemplaza entero al de fábrica. Sin la mezcla explícita,
cada campo nuevo llegaría en `undefined`, que se lee como "no". **Por eso los
campos nuevos van sueltos**: un objeto anidado se reemplazaría entero y
volvería el problema.

### Tamaño de letra

Normal / Grande / Mayor (1, 1.15, 1.32), cada botón en el tamaño que
representa. **Todo el texto en `rem`**; `aplicarEscala()` cambia el tamaño de
`<html>` en porcentaje, para multiplicarse por el que la persona ya tenga.
**Márgenes y rellenos siguen en píxeles a propósito**: si creciera todo, en
Mayor cabrían tres datos por pantalla. Crecen solo lo que contiene texto (alto
de la celda del día, círculos de ayuda, hueco de las pestañas). **Inputs a
`1rem`**: menos de 16 px y Safari hace zoom. Tres niveles y no un deslizador,
porque infinitas posiciones no se pueden probar.

Montos de cuatro cifras encogen con `.monto.largo`: "$1,23" cortado no es un
número más pequeño, es un número equivocado.

### Bienvenida

Obligatoria, sin pestañas, **detrás de la instalación**. Pide idioma,
restaurante, sueldo por hora y porcentajes de tip-out.

- Los nombres de rol vienen puestos; los porcentajes, vacíos: los nombres se
  repiten entre restaurantes, los porcentajes no.
- Salida explícita "en mi restaurante no se paga tip-out": vacío y cero se ven
  igual y significan cosas distintas.
- Lo escrito se guarda al momento.
- Nada de tema ni apariencia aquí: cada bloque más está entre alguien y su
  primer turno.

### Ayuda en vez de tour guiado

Preguntas plegadas, ordenadas por antigüedad del usuario (la de Reportes va después de las del uso diario: hace falta tener semanas de turnos para que sirva). **Ninguna
respuesta dice dónde está un botón, solo cómo se llama**: así no caduca al
mover cosas. El tour con burbujas se descartó porque se ancla a elementos
concretos y cada rediseño lo rompe en silencio. Una prueba recorre todas las
claves en los dos idiomas.

---

## 4. Modelo de datos

Estructura de tablas SQL aunque hoy viva en `localStorage` (clave
`tipsControl`), para que pasar a Postgres sea directo.

- **`trabajos`** `{ id, user_id, nombre, tarifa_hora, activo }` — hoy uno solo,
  en `datos.trabajo`.
- **`roles_tipout`** `{ id, trabajo_id, nombre, porcentaje, activo }` — por
  defecto Busser, Barra, Runner y Bakery con `porcentaje: null`.
- **`turnos`** `{ id, user_id, trabajo_id, fecha, entrada, salida, ventas,
  efectivo, tarjeta, tarifaHora, tipOut, tipoutDetalle, tipoutTramos,
  incentivo, nota }`
- `datos.configurado`, `datos.prefs`.

**No guardar lo derivable** (horas, propina total, neto, por hora, % sobre
ventas): dos verdades acaban contradiciéndose.

**`calcularTurno` devuelve las partes además del total** (`netoPropinas`,
`sueldoBase`, `totalNeto`). Cuando llegó el interruptor del sueldo, "rehacer las
fórmulas" pasó a ser "elegir cuál pinto".

**Guardar el tip-out ya calculado en el turno** hizo que los tramos, que cambian
por completo cómo se calcula, no tocaran ni una línea de `resumir`, las barras,
la comparación ni las métricas. Como cambiar la fórmula de una celda de Excel:
las cien que la suman ni se enteran.

**Los valores históricos se congelan en el turno.** El trabajo guarda el valor
por defecto de hoy; el turno guarda el que aplicó ese día.

**Los campos nuevos solo se guardan si tienen contenido.** Un turno normal no
carga con campos vacíos y los viejos no cambian de forma.

**UUID, no `Date.now()`:** dos personas guardando en el mismo milisegundo
colisionan en cuanto comparten base de datos.

**Un turno por día.** Es lo que impide que la fusión de respaldos duplique
ingresos.

---

## 5. Tip-out

- Porcentaje sobre las **ventas totales del turno**, misma base para todos los
  roles. No sobre las propinas.
- Cada rol tiene su porcentaje fijo; lo que varía es qué roles hubo.
- `tip_out = ventas × (suma de los % presentes) / 100`, cada monto redondeado
  por separado: es plata que se entrega de verdad.
- Al abrir un día nuevo se precargan los ayudantes del último turno.
- **No hay reparto persona por persona**: el total se le entrega al manager,
  que lo divide. Por eso el recibo enseña UN número comprobable.

### El equipo cambia a mitad de turno

Pasa en pocos turnos, pero sin esto la app obligaba a registrar un número
falso. Ejemplo: un primer tramo con dos ayudantes al 2%; llegan más y a partir
de ahí se paga el 5%, **pero solo sobre lo vendido después**.

- Enlace "+ El equipo cambió durante el turno". Sin tocarlo, la pantalla es la
  de siempre: el turno normal no paga nada por que exista.
- **Se pide el número del recibo del punto de venta**, las ventas ACUMULADAS en
  el momento del cambio. Pedir "las ventas del tramo" obligaría a restar dos
  papeles a mano.
- **El último tramo se calcula**, no se escribe.
- Hasta 3 cambios (`MAX_CORTES`); el tope es de pantalla, no de cálculo.
- **Los tramos nuevos entran sin ayudantes** (el equipo suele crecer) y **los
  cortes no se precargan** del turno anterior: un corte heredado de ayer no se
  nota y falsea el tip-out entero.
- El desglose por tramo va sin signo menos y en tinta apagada: un segundo "−"
  se leería como que se descuenta dos veces.

**`revisarCortes` está aparte del cálculo** porque un corte mayor que las
ventas deja el último tramo en negativo y el tip-out pasa a SUMAR dinero. Se
rechazan también cortes que no crecen, el primero en cero, vacíos e ilegibles.

**El aviso llega mientras se escribe, no solo al guardar** (v41). Con dos
cambios, quien escribió lo vendido en cada tramo (700 y luego 500) en vez del
acumulado vio un tramo de −$200, un "Lo que queda" que parecía bueno y un
tip-out de menos, sin aviso hasta tocar Guardar. Con un cambio solo, las dos
lecturas dan el mismo número, así que el malentendido no se ve hasta el
segundo. Se decidió **seguir pidiendo el acumulado** (el recibo del POS que se
imprime en el momento del cambio) y hacer que la pantalla lo confirme:

- La cabecera dice "Acumulado al cambio N" y debajo de cada cambio va lo
  vendido en SU tramo ("$500.00 en este tramo"): es la comprobación de que el
  número se leyó como se quería.
- Un cambio imposible se dice ahí mismo, en rojo, con contra qué número tiene
  que crecer. "Lo que queda", el tip-out, el total y el por hora pasan a "—":
  una raya no se confunde con una cifra.
- `estadoDeCortes` (logica.js) hace la cuenta; `revisarCortes` sigue siendo
  quien decide al guardar.

Descartado: pasar a pedir lo vendido en cada tramo. Obligaría a restar dos
recibos a mano, y los turnos guardados tienen los cortes como acumulados:
habría que convertirlos.

---

## 6. El incentivo (puntos)

Lo pidieron usuarios que aún no habían usado la app. Se desaconsejó la versión
completa (lista de productos, unas 400 líneas): construir con lo que la gente
cree que va a necesitar, antes del piloto, es gastarse el presupuesto del
piloto. Se hizo la versión pequeña:

- Casilla en Ajustes, apagada de fábrica (en Trabajo hasta la v45; desde la
  v46, en "La semana": ver §23).
- **Nombre configurable del contador** ("Puntos" de marcador). Así la app no
  necesita saber qué cuenta: recibe un número por turno y lo suma. Cuando una
  decisión depende de un dato que varía entre usuarios, a veces la salida es
  mover esa decisión al usuario.
- Campo opcional en el turno; séptima métrica en "más estadísticas".
- Los productos no valen lo mismo, por eso son puntos y no unidades.

**La línea "en 4 de 6 turnos"** aparece solo cuando falta alguno: una cifra
incompleta que no se ve incompleta es peor que no tenerla. Se sostiene en que
**un campo en blanco y un 0 escrito son distintos de punta a punta**.

Apagar la casilla no borra nada. Es lo primero que la app cuenta que no es
dinero: "¿y cuántas mesas atendí?" ya tiene precedente.

---

## 7. Sueldo y efectivo

Dato de dominio: las propinas de tarjeta y las horas llegan en el cheque, más
tarde y con retenciones que **varían de semana a semana** con los mismos
ingresos. El efectivo va directo al bolsillo.

- **El sueldo por hora no se suma al total por defecto.** De los dos errores
  posibles, inflar es el peor: un número que favorece a quien lo lee no lo
  cuestiona nadie.
- **No etiquetar nada como "impuestos" ni "descuento".** "Sueldo del turno" y
  punto. *(Sigue vigente para el resto de la app. El cheque estimado, §27, usa a
  propósito los nombres del cheque —Federal Income, Social Security…—: se
  compara contra el papel, y el mantenedor lo eligió así el 24 de octubre de
  2026.)*
- Efectivo y tarjeta siempre separados.
- `prefs.contarSueldo` decide la cifra vía `cifrasPrincipales()`, **sin
  recalcular**, y se aplica igual en recibo, total, barras, comparación, por
  hora, por turno (desde el 24 de octubre de 2026, ver §25) y **mejor día** (si el "mejor día" no coincide con la barra más alta, se
  desconfía de toda la app).
- Con el sueldo apagado, en el recibo va debajo de la raya y sin `+`.

**Efectivo neto:** `trabajo.tipOutEnEfectivo` y `efectivoMostrado()`. Decir
"efectivo $100" la noche que se entregaron $80 de tip-out es falso; si el
tip-out supera el efectivo, lo honesto es un negativo. La etiqueta cambia a
"Efectivo neto" porque ver bajar el número con el mismo nombre parece una
avería. Garantía vigilada por una prueba: `efectivoNeto + tarjeta =
netoPropinas`.

---

## 8. Respaldo

Archivo `tips-control-AAAA-MM-DD.json` con `datos` entero.

**La importación fusiona**: lo que está en el teléfono nunca se toca; el
archivo solo llena días vacíos (`fusionarTurnos()`).

**Los ajustes del archivo solo entran en un teléfono sin turnos** (vigente
desde el 27 de septiembre de 2026; reemplaza a "los ajustes se reemplazan por
los del respaldo"). Antes el archivo pisaba siempre el sueldo, los roles con
sus porcentajes y las preferencias, con el argumento de que cada turno guarda
congelados su tarifa y su tip-out. Eso protege los turnos viejos, pero no los
que se registran después: importar un respaldo de junio para recuperar un día
devolvía los porcentajes de junio, y los turnos siguientes salían con el
tip-out equivocado. Con turnos en el teléfono, sus ajustes son los vigentes;
sin turnos, es un teléfono nuevo que se está restaurando y el archivo manda.
La pregunta de antes de importar dice cuál de los dos casos es. Tan conservador porque los
turnos no guardan cuándo se modificaron, y sin ese dato cualquier regla de "gana
el archivo" adivina. Reemplazar sigue siendo posible: Borrar todo → Importar,
que obliga a hacer explícito que se destruye algo. Al terminar, la app dice
exactamente qué pasó.

`importar()` lee y valida; `hacerImportacion()` se ejecuta si la persona
acepta. `revokeObjectURL` va aplazado: revocar la URL le quita al navegador el
archivo mientras todavía lo lee.

Ver sección 15 para la protección añadida el 23 de septiembre.

---

## 9. Decisiones técnicas

- **Sin frameworks ni compilación.**
- **`logica.js` aparte** para que las pruebas prueben exactamente el código
  que corre en el teléfono.
- **`localStorage` primero, la nube detrás**: tiene que funcionar sin señal en
  un sótano.
- **Render:** datos → `guardar()` → `pintar()`. Excepciones deliberadas, todas
  porque redibujar mientras se escribe quita el foco y cierra el teclado: al
  escribir en el formulario solo se repinta el recibo; en un corte, el recibo y
  el resto; los eventos de instalación solo repintan lo suyo.
- **Service worker: primero la red, la copia de respaldo.** Los archivos
  secundarios se piden con `cache: 'reload'` (no las navegaciones): GitHub
  Pages deja al navegador quedarse archivos unos minutos, y eso ya causó un
  incidente. Tras publicar un cambio del service worker, la primera vez hay que
  cerrar la app del todo.
- **Revisión de arranque** (`FUNCIONES_NECESARIAS`): si `logica.js` llega
  incompleto, la app se detiene y avisa.

### Campos numéricos: `type="text"` + `leerNumero()`

Con `type="number"` el navegador decide qué es un número válido según el idioma
del teléfono. `leerNumero()`:

- Acepta coma y punto: con `inputmode="decimal"` solo existe la tecla del
  separador del idioma del aparato.
- Un separador suelto al final es alguien a medio escribir: "1000," es mil.
- No adivina separadores de miles; con los dos separadores, manda el de la
  derecha.
- Devuelve `{ ok, vacio, valor }`: tres situaciones separadas.

**`Number(x) || 0` está prohibido**: convierte vacío, ilegible y cero en lo
mismo. Es envolver la hoja en `SI.ERROR(…; 0)`: no arregla nada, apaga la luz
roja. `|| 0` solo cuando el cero significa algo.

### Errores

- Mensaje humano primero, detalle técnico detrás.
- Al diagnosticar, dos preguntas: por qué falló y **por qué nadie se enteró**.
- Ojo con las líneas cortas que tocan el mundo exterior: disco, red, archivos,
  reloj, portapapeles y el teclado de otra persona.
- `guardarTurno()` y `terminarBienvenida()` no cierran si `guardar()` falló.

### Diálogo propio (S1 + A4)

`alert()`/`confirm()` salían con "kewo1023.github.io dice" y, sobre todo, iOS
ofrece "Eliminar cuadros de diálogo" tras varios seguidos: quien lo marcara
apagaba todos los avisos, incluido "no se pudo guardar tu turno". Un `<div>`
propio no se puede apagar.

`preguntar` recibe una función porque un diálogo HTML no congela la página. Hay
cola (`colaDialogos`) para que un segundo mensaje no pise al primero.
`cerrarDialogo()` saca de la cola antes de ejecutar el callback. No lanzar dos
diálogos iguales.

### Mensajes de error

1. Decir si los datos están a salvo.
2. Decir qué hacer ahora.
3. Poner números ("se van a borrar 87 turnos").
4. Nombrar el campo exacto.
5. Ofrecer la salida cuando sirve (exportar antes de borrar).
6. Nombrar el objeto exacto (el archivo que empieza por `tips-control-`).
7. Que un mensaje sirva para los dos caminos que llevan a él.
8. En los dos idiomas; una prueba compara las tablas.

`avisarIlegible()` recibe texto ya resuelto porque el nombre del incentivo lo
pone cada usuario y no tiene clave.

---

## 10. Pruebas

- `pruebas.js`: fórmulas. `pruebas-app.js`: la app cargada en `mini-dom.js`.
  El arnés sustituye `avisar`/`preguntar` por versiones que apuntan y aceptan;
  las originales quedan en `avisarReal`/`preguntarReal`.
- **Comprobar que las pruebas pueden fallar**: romper el código y ver el rojo.
  Así se descubrió una comprobación que pasaba siempre porque el mini-dom no
  leía atributos.
- **Escribir la prueba contra el resultado equivocado** cuando hay dos formas
  plausibles de calcular algo.
- Escribir el resultado esperado a mano antes de correr el código.
- Empezar por el desastre a evitar, no por el camino feliz.
- **Contar, no preguntar si pasó algo** (`=== 1`, no `> 0`).
- Cada grupo monta su estado y lo devuelve al terminar.
- Volver a la semana antes de mirar las métricas.

### El mini-dom miente

Tres veces, siempre igual: un doble que improvisa una respuesta plausible manda
a buscar el fallo donde no está. `matchMedia` contestaba lo mismo a todo;
`getAttribute` no veía los atributos del HTML; `dispatchEvent` no ponía
`target`. Sigue sin conocer los `id` de elementos creados con
`createElement`: por eso el número del último tramo se guarda en una referencia
(`restoVisible`).

---

## 11. Hoja de ruta

- **Fase 0 — Que sirva.** Hecha.
- **Fase 1 — En el teléfono.** Hecha: GitHub Pages + PWA.
- **Piloto.** Hecho: respaldo que fusiona, bienvenida, mensajes de error,
  ayuda, instalación, coma decimal, y las correcciones que salieron de los
  usuarios.
- **Fase 2 — Reportes.** Mes y año, comparaciones, tendencias, y la pregunta
  con la que nació la app: qué turnos conviene tomar.
- **Fase 3 — Cuentas y nube.** Supabase, RLS, login por código,
  sincronización con cola de pendientes. **Solo se baja de la nube cuando la
  cola está vacía.**
- **Fase 4 — Que la usen muchos.** Onboarding completo, varios trabajos.

### Login (Fase 3), investigado el 6 de agosto de 2026

Volver a verificar la documentación antes de implementarlo.

- **Correo con código de 6 dígitos + SMTP propio (Resend)** — recomendado. El
  código se escribe dentro de la app: no hay redirección, que es lo que rompe
  el enlace mágico en una PWA de iOS.
- Google / Apple OAuth — no: en una PWA de iOS la sesión no vuelve a la app.
- Passkeys — todavía no (beta).
- Mantener el login aislado en una sola función.
- Adelantarlo al piloto se desaconsejó: el login no sincroniza nada, y si el
  modelo de tip-out no encaja en otro restaurante, cambiarlo con datos ajenos ya
  en Postgres es una migración.

### Abiertas

- **Partir `index.html`**: el umbral acordado eran 2,000 líneas y está muy por
  encima. Primer corte hecho el 27 de septiembre de 2026: los textos
  (`TEXTOS`) viven en `textos.js` (sección 18). Segundo corte, el mismo día:
  el CSS en `estilos.css`, cargado en el mismo sitio de la cabecera para no
  cambiar la cascada. Las pruebas de diseño leen el HTML y el CSS juntos.
  Siguiente candidato: el código de dibujar (sección T), el más largo.
- Activar la tabla `trabajos` si aparece un segundo trabajo.
- Incentivo con lista de productos, si lo siguen pidiendo.
- Más de 3 cambios de equipo por turno.

---

## 12. Incidentes

### 8 de agosto — el respaldo que "no importaba"

Exportar, borrar un turno e importar no lo devolvía. La fusión era correcta: el
iPhone había descargado el `index.html` nuevo con el `logica.js` viejo de la
caché HTTP, llamó a `fusionarTurnos`, que no existía, y se rompió **sin decir
nada**. Tres arreglos en tres niveles: la causa (`cache: 'reload'`), la red de
seguridad (revisión de arranque) y el silencio (`try/catch` con aviso). Casi se
desarma código que funcionaba por un fallo mudo en otra parte.

### 9 de agosto — la migración que nunca se ejecutaba

`if (datos.configurado === undefined)` sobre el objeto ya mezclado con los
defaults, que valen `false`: a quien ya usaba la app le habría salido la
bienvenida con meses de turnos detrás. Se pregunta al objeto **guardado**. Es
la diferencia entre "no lo has dicho" y "has dicho que no".

### 9 de agosto — `guardar()` podía perder un turno en silencio

`localStorage.setItem` sin protección falla con el almacenamiento lleno y en
navegación privada de iOS.

### 9 de agosto — el aviso que provocaba la pérdida que anunciaba

"Se empieza de cero" y al primer `guardar()` se machacaba lo ilegible. Ahora se
aparta una copia en `tipsControl-roto-AAAA-MM-DD` antes de tocar nada.

### 9 de agosto — defaults copiados en cuatro sitios

La copia de la importación estaba a medias: importar un respaldo viejo dejaba
`comparar` en `undefined` y la persona perdía las comparaciones sin tocar nada.
**Un valor por defecto copiado en varios sitios está esperando a que alguien
actualice solo dos de tres.**

### 15 de agosto — la coma decimal y el cero silencioso

El incidente más importante. En el iPhone de un usuario del piloto el teclado
ofrecía "," y escribió "3,5" en un porcentaje. Con `type="number"`, `.value`
devolvió texto vacío y `Number('') || 0` guardó **0**, sin aviso. Su tip-out
salía $0 todos los turnos y la app le decía que ganaba más de lo real: la peor
dirección del error.

Confirmado con documentación: con `type=number`, `.value` es vacío cuando el
navegador no entiende lo escrito. **La causa exacta en iOS no se pudo
confirmar**; el arreglo funciona con cualquiera de las explicaciones porque le
quita al navegador la decisión.

Dos arreglos, y el segundo importa más: `type="text"` + `leerNumero()`, y **un
número ilegible ya no se vuelve cero en silencio**. La coma solo fue cómo se
descubrió. Consecuencia de soporte: revisar la configuración de quien ya la
tenía puesta.

### 15 de agosto — el aviso duplicado en la bienvenida

La validación de la tarifa avisaba al salir del campo y otra vez al pulsar
Empezar. Lo destapó una prueba que contaba avisos (`=== 1`).

---

## 13. Decisiones que se pagan solas

Guardar `tipOut` calculado, devolver las partes en `calcularTurno` y separar
`leerNumero` en tres respuestas: ninguna se tomó pensando en el problema que
acabó resolviendo. No se planifican; se reconocen cuando aparecen, y por eso
vale la pena escribir por qué se tomaron.

---

## 14. Documentación dentro del repo (23 de septiembre de 2026)

El contexto del proyecto vivía en un documento fuera de la carpeta, que había
que actualizar a mano y ya se había desfasado varias veces (ruta, cifras,
versión). Se trasladó aquí: `CLAUDE.md` con las reglas, este archivo con los
porqués. Viajan en el mismo commit que el código, así que no hay dos versiones
que cuadrar. Las cifras se quitaron: se miden en el código.

---

## 15. Protección contra perder datos (23 de septiembre de 2026)

Todo vive en un solo teléfono y el respaldo dependía de acordarse de
exportar. Tres piezas:

**`pedirPersistencia()` al arrancar, solo en la app instalada.** Por defecto
el navegador puede borrar lo guardado si el teléfono se queda sin espacio;
`navigator.storage.persist()` pide que no. WebKit dice que lo concede según
heurísticas "como que el sitio se abra como app de pantalla de inicio" —el
caso que la pantalla de instalación ya obliga—. No es una garantía, y por eso
no se le avisa a nadie si no se concede: la persona no puede hacer nada con
ese aviso.

**"Último respaldo: hace N días" en Ajustes**, con `datos.ultimoRespaldo` y
`diasEntre()` (en UTC, por el cambio de hora de marzo). Tres reglas:

- **La fecha se apunta solo cuando el respaldo sale**, no al tocar el botón.
  Si no, cerrar el menú de compartir sin guardar dejaría "hoy" encima de un
  archivo que no existe: la línea diría lo contrario de lo que tiene que
  avisar.
- **El archivo lleva su propia fecha**, y al importar **se queda la más
  reciente de las dos**. Un respaldo viejo no hace retroceder la fecha; en un
  teléfono nuevo, el archivo recién importado sí cuenta como respaldo.
- Sin turnos la línea no sale.

**Exportar compartiendo, solo en la app instalada en iPhone.** Es donde la
descarga no siempre funciona, y el menú de compartir tiene "Guardar en
Archivos". En Safari y Android se sigue descargando: no se les cambia lo que
ya conocen. Cerrar el menú sin elegir (`AbortError`) no es un error y no se
avisa. **Cualquier otro fallo se avisa y NO se intenta descargar como plan
B**: fuera del toque que la pidió, el iPhone puede bloquear la descarga sin
decir nada, y la app diría "listo" sin archivo.

`exportar(alTerminar)` recibe una función porque el menú de compartir contesta
más tarde. Borrar todos los datos la usa para decir "listo" solo si el
respaldo salió.

Las pruebas de compartir **esperan de verdad** a la respuesta en vez de fingir
un menú que contesta al instante: un doble que contestara al momento
escondería justo el fallo de marcar la fecha antes de tiempo.

**Lo que falta verificar en un iPhone:** que el menú de compartir aparezca en
la app instalada y que "Guardar en Archivos" deje un `.json` que se pueda
importar.

---

## 16. Reportes: qué turno conviene (Fase 2)

Es la pregunta con la que nació la app. El cálculo vive en `logica.js`
(`franjaDelTurno`, `turnosDelPeriodo`, `reportePorDia`, `reportePorFranja`,
`mejorGrupo`). La pantalla va en una tercera pestaña, "Reportes", donde cabrán
después el mes y el año.

- **La franja la decide la hora de SALIDA**, porque así se cuenta en el
  restaurante: salir a las 3:00 pm o antes es la mañana; después, la tarde.
  Las 3:00 en punto son mañana. **Un doble cae en la tarde** sin regla aparte,
  porque sale después de las 3.
- **Un turno que cruza la medianoche es de la tarde** aunque salga "antes de
  las 3" en el reloj: salir a la 1 am no es un turno de mañana.
- **Regla fija, sin casilla en Ajustes**: hoy todos los usuarios trabajan en el
  mismo tipo de horario. Si entra alguien de un restaurante con otra división,
  se vuelve configurable. **Reemplazada el 27 de septiembre de 2026**: al abrirse a
  otros restaurantes, la hora es `trabajo.corteTarde` (3 pm de fábrica). Un
  corte ilegible cuenta como las 3 pm (`minutosDeCorte`), y la frase de la
  pantalla sale de la misma cifra que el cálculo (`corteVigente`).
- **El "por hora" de un grupo es el total entre el total de horas**
  (`resumir`), no el promedio de los "por hora" de cada turno. Si no, un turno
  de 3 horas pesaría igual que un doble de 10.
- **Solo compite por "el mejor" un grupo con al menos 3 turnos**
  (`MINIMO_TURNOS_REPORTE`). Dos martes buenos no dicen que el martes pague
  más, y alguien podría pedir martes por eso. Con menos turnos se muestra
  "pocos datos". En un empate gana el grupo con más turnos detrás.
- **Los turnos sin hora de salida se cuentan aparte** (`sinHora`) en vez de
  desaparecer: si no, las franjas no cuadrarían con los días sin explicación.
- La cifra respeta `prefs.contarSueldo`, igual que el resto de la app.

### La pantalla (opción A, elegida sobre una vista previa)

Se mostraron dos diseños: tabla y barras. Se eligió la **tabla**: día, por
hora, turnos y promedio por turno. Arriba, la cifra grande del mejor día;
abajo, mañana contra tarde.

- **Período en memoria, 90 días al abrir** (30 / 90 / 1 año / Todo). No se
  guarda: nadie necesita que se recuerde, así que no pasa la prueba de la
  casilla.
- **Sin día que coronar, se dice con palabras**, no con $0.00: un cero se lee
  como "ese día no ganas nada".
- **Siete filas siempre**; las que tienen pocos turnos se apagan en vez de
  esconderse, para que cada día esté siempre en el mismo sitio.
- **"Por turno" usa la misma cifra que "por hora"** (con o sin sueldo). El
  `promedioPorTurno` de `resumir` cuenta siempre el sueldo, y mezclarlo en la
  misma fila daría números que no cuadran entre sí.
- Las clases llevan prefijo `rep-` porque `.fila` ya existe y una tabla con esa
  clase heredaría su rejilla de dos columnas sin dar ningún error.
- **El mini-dom cambia cada etiqueta por un espacio** al leer `textContent`
  ("Los viernes , en 3 turnos"). Las pruebas de la frase con negrita quitan
  las etiquetas a mano para comparar lo que se ve en el teléfono.

---

## 17. Diseño: jerarquía, selecciones, marca de agua y franja de iOS (23 de septiembre de 2026)

Propuestas revisadas antes en una vista previa; el autor eligió.

**Tres niveles de texto, sin colores nuevos.**
- Título: tinta, negrita, grande. El nombre del restaurante y "Reportes" pasan
  a tener el mismo peso que el título de Ajustes o del turno.
- Leyenda (`.etiqueta`, `h2.seccion`): tinta-2, mayúsculas espaciadas.
- Comentario: tinta-2, letra normal, minúsculas.
- **tinta-3 dejó de usarse para texto que hay que leer**: da 2.7:1 en claro
  (mínimo 4.5:1) y era el color de todas las leyendas y las pestañas; por eso
  la app se veía lavada y los niveles se confundían. Queda para guiones, días
  vacíos, placeholders e íconos. Una prueba cuenta sus usos.

**Toda selección se ve como el chip** (fondo verde suave, borde verde, texto
verde en negrita): chips, control segmentado, casillas y pestaña activa.
- Las casillas siguen siendo `<input type="checkbox">`; solo cambia el dibujo
  (`appearance: none` + `:has(input:checked)`). El lector de pantalla y el
  código no cambian.
- ~~La píldora de la pestaña activa se dibuja con `::before`~~ **Reemplazado
  el 15 de octubre de 2026** (§19): una sola píldora que se desliza. La zona
  táctil sigue siendo el tercio entero de la barra. Las casillas ganaron un
  chulo en lugar del punto.
- ~~Pendiente: verde sobre verde suave da 4.26:1 en claro.~~ **Resuelto el 27
  de septiembre de 2026** (opción 4b de una vista previa): `--verde` pasa de
  #15803d a #137537 en claro, 4.92:1 sobre el verde suave y 5.5:1 sobre el
  papel. Se descartaron #147a3a (4.61:1, pasaba justo) y aclarar el fondo
  suave (4.56:1, pero lo elegido se distinguía menos de lo que no). Una prueba
  calcula el contraste con los colores de `estilos.css`, en los dos temas.

**La marca de agua va solo en Ajustes**, junto a la versión. En la Semana y en
Reportes flotaba en medio del espacio vacío. Es una excepción de esta app: la
regla general del kit de marca (marca en la pantalla principal) se deja como
está, por decisión del autor.

**La franja bajo las pestañas es un fallo de iOS 26** (WebKit 301108, abierto):
en las apps instaladas el sistema entrega una pantalla más corta que la real.
Otros proyectos probaron todos los arreglos por CSS y JS sin recuperarla. Lo
que sí es de la app: el margen de `safe-area-inset-bottom` de la barra puede
estar sumándose encima. **Antes de tocar el CSS se mide**: tocar el pie de
Ajustes muestra las medidas del teléfono (`mostrarDiagnostico`). Con ellas se
decide el arreglo: quitar el margen doble cuando se detecte el fallo y pintar
la franja del color de la barra.

### La franja de iOS, medida (23 de septiembre de 2026)

El diagnóstico en un iPhone grande instalado dio: pantalla 956, ventana 894 al
abrir (le falta justo el hueco del reloj, 62) y 956 después de hacer scroll.
`safe-area-inset-top` vale 62 aunque la barra de estado esté en `default`: el
comentario que decía que valía 0 estaba mal y se corrigió.

Arreglo (`medirHuecoIOS()` + clase `hueco-ios`, solo instalada en iOS, en
vertical y con un hueco de 1 a 120): la barra pierde el margen de la rayita
de inicio y la raíz toma el color de la barra, para que la franja se lea como
parte de ella. Se mide al abrir, al cambiar de tamaño y al hacer scroll; cuando
iOS corrige la ventana, la clase se va. **Los 62 del fallo no se recuperan**:
lo que se quita es el margen que se sumaba encima.

Se descartó bajar la barra con un `bottom` negativo hasta el borde real: queda
fuera de la ventana que iOS le da a la app, y si iOS no la pinta o no le pasa
los toques, las pestañas dejarían de funcionar. No se puede probar sin arriesgar
la navegación.

**Incidente de la v31 (23 de septiembre de 2026): las pestañas parpadeaban al
hacer scroll.** La clase `hueco-ios` le ponía al cuerpo un alto mínimo y le
quitaba margen. Como la clase se pone y se quita al hacer scroll, cada cambio
alteraba el alto de la página, iOS volvía a medir la ventana y la clase volvía
a cambiar: un bucle, con la barra saltando arriba y abajo. Arreglo (v32): la
clase solo toca cosas que no ocupan sitio (la barra `fixed`, el fondo de la
raíz y una capa `fixed` de papel). **Regla: nada que se active con el scroll
puede cambiar el alto de la página.** Una prueba lo vigila. La lección de
siempre, con otra cara: la versión probada en el Mac no podía ver el bucle,
porque solo existe en el teléfono con el fallo de iOS de por medio.

**Segunda vuelta (v33): la ventana no se corrige, alterna.** Un video del
teléfono mostró que al hacer scroll iOS hace ir y venir la ventana entre 894 y
956. Con la barra pegada abajo (`bottom: 0`), la barra saltaba 62 cada vez; y
con la clase poniéndose y quitándose (v31, v32), además cambiaba de alto.
Arreglo: la barra se ancla ARRIBA, a la altura corta que iOS da al abrir
(`top: var(--alto-estable)` + `translateY(-100%)`), porque el borde de arriba
de la ventana nunca se mueve; su fondo se prolonga hacia abajo con `::after`; y
la clase se pone una vez y no se quita. Todo en `orientation: portrait`.
El precio: la franja de color de la barra bajo las etiquetas se queda siempre,
también cuando iOS da la pantalla entera. Se prefirió una barra quieta con
espacio debajo a una barra que salta. ~~El fondo blanco por la franja~~ **Reemplazado el
15 de octubre de 2026** (v43, §20): la barra flota y la franja se ve del
papel de la página. El anclaje arriba se queda. `mini-dom.js` aprendió
`style.setProperty` para poder probarlo.


---

## 18. Salir del restaurante de origen (27 de septiembre de 2026)

**La semana de pago empieza el día que diga el restaurante**
(`trabajo.inicioSemana`, 0 domingo … 6 sábado, lunes de fábrica). La semana
que importa es la del cheque; si el restaurante la corta en domingo, un "neto
de la semana" de lunes a domingo no cuadra nunca y la persona desconfía de todo
lo demás. Pasa la prueba de la casilla: dos restaurantes razonables cortan la
semana en días distintos.

- Va en `trabajo` y no en `prefs`: lo decide quien paga, no el gusto de la
  persona. Campo suelto, como los demás.
- `inicioDeSemana(fecha, dia)` en `logica.js`. `lunesDeLaSemana` se queda para
  los Reportes, que agrupan por día de la semana y no por semana de pago.
- Las letras de los días salen de la fecha (`numeroDelDia`), no de la
  posición: con semana de domingo la primera celda es una D.
- La tabla de Reportes sigue el orden de la semana de pago.
- Al cambiarlo mirando la semana en curso, la vista se ancla en HOY: pasar a
  semana de jueves un jueves no puede dejar a la persona mirando la semana
  pasada.
- No se pregunta en la bienvenida: cada bloque de más está entre alguien y su
  primer turno, y el lunes sirve a la mayoría.

**El tip-out sigue siendo un % de las ventas.** Se consideró una base por rol
(ventas de alcohol, propinas, monto fijo) mirando otras apps de propinas, y se
descartó: en los restaurantes que conoce el autor, el bar cobra sobre las
ventas generales. Se revisa si alguien de fuera lo pide.

**`textos.js`: primer corte de `index.html`.** Los textos eran la parte más
larga del script y la que más crece. Partir abre un riesgo que antes no
existía, el del 8 de agosto con otra cara: un `index.html` nuevo con un
`textos.js` viejo. Tres defensas, cada una con su prueba:

- Todo `<script src>` de la página tiene que estar en la copia del service
  worker.
- `t()` con una clave que no existe ni en español avisa una vez
  (`appAMedias`) y devuelve texto vacío, en vez de pintar "undefined".
- Si `textos.js` no llegó, el arranque se detiene con un aviso fijo en los dos
  idiomas: el único texto suelto del código, por la misma razón que el trocito
  del tema en la cabecera.

**Ayuda en cada pantalla (elegida sobre una vista previa: opción 1b).** Una
píldora "Ayuda" en la cabecera de Semana, Turno, Reportes y Ajustes abre una
hoja desde abajo con las preguntas de esa pantalla (`AYUDA_POR_PANTALLA`) y
"Ver todas las preguntas".

- Palabra y no "?": la píldora tiene la forma de "Hoy", así que se lee como
  algo que se toca, y una palabra no depende de conocer un ícono.
- Las preguntas salen de la lista de la Ayuda completa: cada respuesta se
  escribe una vez. Sigue sin ser un tour: no señala ni se ancla a nada.
- Zona de toque de 44 puntos (lo que pide Apple) con `::after`, sin agrandar
  el dibujo. El botón (i) de las métricas, igual: 20 px de dibujo y 44 de
  toque, y pasa a tinta-2 porque con tinta-3 casi no se veía. *(El botón (i)
  ya no existe: reemplazado el 24 de octubre de 2026 por la tarjeta entera,
  §25.)*
- La regla "nombrar, no ubicar" ahora se prueba en TODAS las respuestas, en los
  dos idiomas. La de registrar un turno la rompía ("la fila de arriba").
- Preguntas nuevas: ventas (netas, sin impuestos ni propinas), el equipo
  cambió, qué día empieza la semana, quién ve mis datos.

**Aviso de respaldo en la Semana (opción 3a).** Con 5 turnos o más, si nunca
se respaldó o el último tiene 30 días, sale una tarjeta con "Exportar ahora".
"Ahora no" lo esconde 7 días y se guarda (`datos.respaldoPospuesto`): un aviso
que vuelve cada vez que se abre la app se aprende a ignorar. Se aparta
mientras esté el aviso de instalar. Cuándo sale lo decide `avisoRespaldo()`,
en `logica.js`; en la duda (fechas ilegibles), avisa.

**El día de inicio en Ajustes (opción 4a):** siete letras en el orden de la
fila de la semana y una frase que confirma el rango ("De domingo a sábado"),
porque M y X solas se pueden dudar.

**Texto de la persona dentro de HTML armado a mano: `escaparHTML()`.** El
nombre del incentivo entraba crudo en `innerHTML`: unas comillas rompían el
`aria-label`, un "<" se comía el nombre, y un respaldo manipulado podía colar
código. Donde se pueda, `textContent`.

### Primer uso visto desde fuera (27 de septiembre de 2026)

Tres cosas que salieron al probar la app como usuario nuevo, en un Android y
en un iPhone:

- **Sin turnos no se sugieren horas.** Los atajos de fábrica (10 am, 11 am,
  4 pm…) eran el horario de un restaurante concreto. A alguien de otro sitio
  le proponían un horario que no es el suyo; un atajo equivocado es peor que
  ninguno. Desde el primer turno guardado, los atajos salen de sus turnos.
- **Los roles sin porcentaje no salen en el turno.** Al empezar, los que se
  dejaron en blanco se quitan (la bienvenida ya dice "quita los que no
  existan"; dejarlo vacío es la forma natural de hacerlo). Y en el formulario
  solo aparecen los roles con porcentaje mayor que cero (`rolesQueCobran()`):
  uno vacío salía marcado y escrito "null%". En Ajustes siguen todos, para
  poder rellenarlos.
- **Dos toques no hacen zoom** (`touch-action: manipulation` en la raíz y en la
  hoja de ayuda, que tiene scroll propio). El pellizco para ampliar se deja a
  propósito: quitarlo es una barrera para quien lo necesita para leer.

**Tutoriales en imagen, retirados (27 de septiembre de 2026).** `tutorial-*.png`
y su generador enseñaban «Añadir a pantalla de inicio» (nombre de España) y
los pasos de iOS 18. La pantalla de instalación ya da los pasos según el
teléfono; unas imágenes fijas volverían a quedar viejas con cada iOS. Siguen en
el historial de git si hicieran falta.

**Resumen del año y hoja para Excel (lógica, 27 de septiembre de 2026).**
`resumenAnual` da el año calendario y sus doce meses con `resumir`, así que
cuadra con la semana. `turnosACSV` saca una fila por turno con números sin
"$" y punto decimal, para que se puedan sumar; lleva la marca BOM (sin ella
Excel rompe los acentos) y protege con un apóstrofo el texto que empieza por
= + - o @, porque Excel lo ejecutaría como fórmula y la nota la escribe la
persona. Es un registro personal, nunca un cálculo de impuestos.

**Las pantallas, elegidas sobre una vista previa (27 de septiembre de 2026).**

- **La hora de corte se cambia en Reportes (2a)**, con "Cambiar" junto a la
  frase de mañana o tarde: cinco horas, de 1 a 5 pm. Ahí es donde alguien ve
  que "mañana" no es su mañana; en Ajustes no la buscaría.
- **"Tu año" va al final de Reportes (5a)**: el neto del año, turnos, horas,
  por hora, efectivo, tarjeta, tip-out pagado y sueldo, y los doce meses.
  Efectivo y tarjeta en bruto con el tip-out al lado, para que la resta se
  pueda hacer a ojo. El neto sigue la misma regla del sueldo que el resto de
  la app. Los años se ofrecen solo si hay más de uno.
- **"Descargar para Excel"** baja los turnos del año que se está mirando, por
  el mismo camino que el respaldo (compartir en la app instalada en iPhone,
  descarga en lo demás). Los encabezados van en el idioma de la app y la
  columna del incentivo se llama como la llamó la persona.
- Debajo, siempre: "Es lo que anotaste en la app… No es un documento de
  impuestos." Sin esa línea, en temporada de impuestos se lee como consejo
  fiscal.

**"Enviar un comentario" (27 de septiembre de 2026).** Con la app en manos de
gente que no conoce a quien la mantiene, hacía falta un camino para que los
fallos lleguen. El botón, en Ajustes, copia los datos técnicos (versión,
teléfono, si está instalada, pantalla, idioma, tema, letra y cuántos turnos
hay) y los enseña en el aviso por si copiar falla.

- **Nunca lleva el nombre del restaurante, montos, fechas ni notas**: se pega
  en un mensaje a otra persona. Una prueba lo vigila con datos inventados.
- **No hay destino todavía** (`DESTINO_COMENTARIOS` vacío): se le pide a la
  persona que lo mande a quien le pasó la app. Cuando exista un formulario o
  correo propio de la app, su enlace va en esa constante. **Nunca un correo o
  teléfono personal**: el código es público. Una prueba rechaza correos,
  teléfonos y enlaces de WhatsApp.
- Contar cuánta gente usa la app se dejó para después: pide algún rastreo, y
  la Ayuda promete "sin rastreo". Ver la bitácora.

**"Compartir la app" (27 de septiembre de 2026).** Botón en Ajustes, entre
"Cómo funciona la app" y "Enviar un comentario". Abre el menú de compartir
del teléfono con una frase y el enlace; sin él, copia el enlace; sin
portapapeles, lo enseña. Cancelar el menú no es un error.

- **Solo el enlace y la frase**: nada del restaurante ni de quien comparte.
- **El enlace sale de donde está la app** (`enlaceDeLaApp()`: la carpeta, sin
  "#", sin "?" y sin "index.html"), no escrito a mano. Se calcula con texto y
  no con `new URL()`, que el doble de pruebas no tiene.
- Quien lo recibe cae en la pantalla de instalación, que ya resuelve el caso
  de abrirlo dentro de WhatsApp.


## 19. Movimiento (15 de octubre de 2026)

La app se sentía plana: nada respondía al dedo y todo aparecía de golpe. Se
buscaron referencias en uiverse.io (licencia MIT), se probó una maqueta con
un interruptor antes/después en el teléfono, y el autor eligió. **Nada se
copió:** todo se rehízo con los colores y las curvas de la app, así que no
hay código de terceros ni avisos de copyright que mantener.

Lo que entró, y por qué cada cifra:

- **Todo lo que se toca se encoge al apretar: 0.95, baja en 80 ms.** La
  maqueta probó 0.97 en 160 ms y en el iPhone no se notaba: un toque rápido
  dura unos 100 ms y el dedo se iba antes de que la animación llegara. La
  bajada rápida y la subida lenta (200 ms) hacen que se vea incluso en un
  toque corto. En iOS hace falta escuchar `touchstart` para que `:active`
  funcione (sección U).
- **El botón principal tiene canto y se hunde 4 px.** Mismo problema que el
  anterior con 3 px y un canto negro bajo un botón casi negro: no se veía.
  Ahora la cara sube un escalón (`--principal-cara`) y el canto se queda con
  la tinta, como el lado de una tecla.
- **Aviso breve abajo ("Turno guardado"): 4 s con una raya que se vacía, y
  una X.** Solo confirma lo que salió bien (guardar y borrar un turno, y solo
  si `guardar()` lo consiguió). **Desde la v51, también los campos de texto de
  Ajustes** (nombre, sueldo, ayudantes, incentivo y los de "Tu cheque"), con
  `confirmarAjuste()`: se guardan al salir del campo, sin botón, y nada decía
  que se hubieran guardado ni cómo se entendió lo escrito ("Sueldo por hora:
  $7.25"). Solo si el valor cambió; con un número ilegible, solo el diálogo.
  Los selectores y las casillas no lo llevan: la píldora o el chulo lo dicen
  en el mismo sitio, y un aviso por toque sería ruido. **Un error nunca va ahí:** un aviso que se va
  solo se puede perder, y un error que nadie leyó es un error mudo. Los
  errores siguen en el diálogo. Vive dentro de la barra de pestañas para
  seguirla con el arreglo de iOS 26 (§17); pegado al borde de la ventana se
  metía debajo de la barra cuando iOS alarga la ventana.
- **La hoja de ayuda sube con la curva de los paneles de iOS; el diálogo sube
  un poco mientras aparece.** La entrada va atada a `:not(.oculto)` en el CSS
  y no a una clase que ponga el código: cualquier camino que enseñe la capa la
  anima, incluido el diálogo que el arranque enseña a mano cuando textos.js no
  llegó. La salida sí la pone el código, en dos pasos (`saliendo` y luego
  `oculto`, con `mostrarCapa`/`ocultarCapa`). **Regla:** estas capas no se
  esconden ni se enseñan tocando `oculto` a mano; una prueba lo vigila.
- **Flechas de la semana:** la semana nueva entra por el lado de la flecha.
  Se desplazan los días y el rango; **el total y las métricas solo se
  funden**, porque lo que se lee se lee peor si se mueve.
- **Casillas con chulo que salta**, en vez del punto. Se eligió entre dos
  opciones; la otra ("gelatina", el círculo se aplasta y rebota) era una
  animación que se habría repetido en cada `pintar()`, que vuelve a escribir
  `.checked`. El chulo es una transición: solo corre si el valor cambia.
- **La selección se desliza**, en el control segmentado y en las pestañas:
  una sola píldora por control, que va de una opción a otra. Para que se
  mueva, el elemento tiene que ser el mismo antes y después; por eso
  `pintarSegmentado()` ya no rehace los botones en cada `pintar()`, solo les
  cambia el texto y la clase. Una prueba comprueba que son los mismos objetos.
  El selector de los siete días (semana de pago) no se tocó: se usa una vez.
- **"Enviar un comentario" con un avioncito que despega.** El diálogo con los
  datos espera a que se vaya (420 ms); la copia no espera, porque el
  portapapeles hay que tocarlo dentro del toque.

**Movimiento reducido** (Ajustes del iPhone → Accesibilidad): se quitan los
desplazamientos y se quedan los fundidos. Menos movimiento, no cero.

**Lo que se descartó:** la onda de Material Design al tocar (se ve a Android
dentro de un iPhone), un esqueleto que late mientras carga (la app no espera
nada: sería teatro), el contador de números que gira (pesado para la cifra
que más se mira) y el interruptor "squishy" (la app no tiene interruptores:
§17 decidió que toda selección se ve como chip).


## 20. Barra de pestañas flotante (15 de octubre de 2026)

El autor pidió la barra de habitos-app (flotante, con un ícono por pestaña) y
que no se viera "alta y perdida" en su iPhone Pro Max instalado. Se probó una
maqueta con dos opciones y eligió la de Hábitos con un gris más marcado.

- **Flota** a 12 px de los lados y 10 px encima de la rayita de inicio, con
  vidrio esmerilado (`backdrop-filter`), como en Hábitos.
- **Un ícono por pestaña** (calendario, barras, controles), dibujado con
  `mask` y `currentColor`: cambia de color con la pestaña sin otra imagen.
  Las etiquetas pasan de mayúsculas espaciadas a letra normal, como en
  Hábitos: con ícono, la mayúscula sobraba.
- **La pestaña activa va en gris, no en verde suave.** Es la excepción a "toda
  selección se ve como el chip" (§17): dentro del vidrio, el borde y el
  relleno verdes competían con el ícono. El gris es casi el doble de oscuro
  que el de Hábitos (`.10` contra `.06` en claro, `.16` contra `.10` en
  oscuro) para ver de un vistazo dónde se está; más oscuro, el verde de la
  letra bajaría de 4.5:1. Una prueba mezcla las capas y lo calcula.
- **Por qué sigue sin pegarse al borde en un iPhone instalado:** la franja de
  62 pt es el fallo de WebKit 301108, que sigue abierto (última modificación
  en julio de 2026, sin arreglo publicado). La barra se sigue anclando a la
  ventana corta (§17, v33) porque pegada abajo salta al hacer scroll. Lo que
  cambió es lo de debajo: antes era el blanco de la barra hasta el borde
  (por eso se veía un bloque vacío); ahora es la página.
- **Pendiente, si sigue sintiéndose alta:** probar en el teléfono si iOS
  pinta y deja tocar algo dentro de la franja. Si lo deja, la barra puede
  bajar. §17 lo descartó en su día porque no se podía probar sin arriesgar la
  navegación; la prueba tiene que ir aparte, sin tocar la barra de verdad.


## 21. Lo que pasa debajo de la barra flotante (16 de octubre de 2026)

Con la v43 en el teléfono aparecieron dos cosas: al bajar del todo, el último
botón ("Mostrar menos") quedaba debajo de la barra, y la barra se veía
"sobrepuesta", como un menú mal hecho. Se miró cómo lo resuelve iOS 26 y se
probó una maqueta con scroll; el autor eligió la opción completa.

- **El botón tapado era un fallo de medida.** En un iPhone con la franja
  (§17), la barra queda 62 pt más arriba, pero el espacio del final de la
  página era el de un teléfono normal (5.75rem + la rayita). Con la ventana
  larga, lo último quedaba unos 7 pt debajo. Ahora es 9rem, **en todos los
  teléfonos**: hacerlo depender de `hueco-ios` sería cambiar el alto de la
  página según el fallo, que es justo lo que §17 prohíbe. En un teléfono sin
  el fallo sobra un poco de espacio al final; no molesta.
- **El velo.** La página se apaga en papel antes de llegar a la barra, y por
  debajo de ella no asoma nada. Es lo que hace iOS 26 bajo sus barras
  ("scroll edge effect"). Lo "sobrepuesto" venía de ver pasar la página por
  detrás y por debajo de la barra. Para eso la barra se partió en dos: el
  sitio (`.pestanas`, transparente, de lado a lado, sin recibir toques), que
  sigue anclado igual que antes, y la barra que se ve (`.pestanas-barra`).
- **Se recoge al bajar y vuelve al subir**, como iOS 26
  (`tabBarMinimizeBehavior`): se encoge, los nombres se apagan y los íconos
  bajan al centro. Tocar una pestaña, cambiar de pantalla o un aviso breve la
  abren. Lo decide `decidirRecogida()`, una función pura con pruebas, con una
  protección por cada forma de engañarse en el teléfono:
  - el alto de la ventana cambió (iOS lo alterna al hacer scroll con la
    franja): ese movimiento no cuenta;
  - el rebote elástico se recorta al rango real del scroll;
  - arriba del todo, siempre abierta;
  - 12 px seguidos en una dirección, para que el temblor del dedo no la mueva;
  - con movimiento reducido no se recoge nunca.

  **Recogerse solo usa `transform`, `opacity` y color**: nada que reaccione
  al scroll puede cambiar el alto de la página (el bucle de la v31). Una
  prueba lo vigila.
- **El riesgo que no se pudo probar aquí** es si la protección contra la
  ventana que alterna basta en un iPhone instalado. **Si la barra parpadea
  sola al hacer scroll, se quita la escucha** (`vigilarScroll()` en el
  arranque) y queda el velo, que no depende del scroll.

**El número que asomaba al cambiar de pestaña (v45, 16 de octubre de 2026).**
Un video del teléfono, a 60 fotogramas por segundo, mostró que al pasar de
Semana a Reportes se veía durante dos fotogramas (~33 ms) "Neto de 2026"
debajo de la barra, en la franja; al tercero el velo ya lo tapaba. Al volver
a Semana no pasaba, porque ahí abajo no hay nada. Causa más probable
(inferencia, no medida): al pasar a una pantalla larga iOS alarga la ventana,
y las capas fijas tardan un par de fotogramas en cubrir la zona nueva.
Arreglo: la pantalla nueva entra con un fundido de 200 ms que pasa los
primeros 60 ms en transparente (`aparecerPantalla()`); solo opacidad, y no
si se toca la pestaña en la que ya se está. Se descartó darle a la página un
alto mínimo para que la ventana no cambie: es lo que armó el bucle de la v31.


## 22. Fallos de diseño en teléfonos estrechos y con letra grande (17 de octubre de 2026)

Salieron al sacar capturas de cada pantalla a 320, 375 y 393 px, en los dos
temas, los dos idiomas y los tres tamaños de letra. Ninguno lo podían ver las
pruebas: el mini-dom no calcula CSS. Las pruebas nuevas vigilan que las reglas
del arreglo sigan escritas, no cómo se ve.

- **Una clase de estado no puede ser también una regla suelta.** El texto
  "Toca un día…" usaba `.vacio`, el mismo nombre del estado del día libre
  (`.dia.vacio`) y del mes sin turnos. Esa regla iba más abajo en la hoja y
  les ganaba a los dos: el día libre heredaba 30 px de relleno (su letra caía
  por debajo de la de los días trabajados) y los meses sin turnos de "Tu año"
  salían altos y con el nombre corrido. Ahora el texto es `.texto-vacio` y el
  mes es `.anio-fila.sin-turnos`. Es la misma trampa que ya explicaba el
  prefijo `rep-` (§16): un nombre compartido no da error, solo se ve mal.
- **Pero la letra del día libre se queda abajo, a propósito** (decisión del
  mantenedor, vista en el antes y después). Alineada con los días trabajados
  se perdía el desnivel que deja distinguir un día libre sin leerlo. Ahora lo
  escribe su propia regla (`.dia.vacio { padding-top: 30px }`), con una prueba,
  en vez de depender de un choque de nombres.
- **Las columnas de números llevan hueco** (`column-gap`). Van alineadas a la
  derecha, y sin hueco quedaban pegadas: "POR HORATURNOS", "NETO POR HORA".
- **El segmentado tiene tantas columnas como opciones** (`--n`). El idioma, con
  dos, dejaba un hueco vacío a la derecha.
- **"Más estadísticas" pasa a dos columnas cuando no caben tres**: a 320 px
  (iPhone SE con la pantalla ampliada) y con la letra Mayor en un teléfono
  normal, la tercera columna se salía y el borde la cortaba. Se decide con una
  consulta de contenedor (`@container`) medida en `em`, y no con `@media`:
  según la especificación (CSS Containment 3), los `em` de una consulta de
  contenedor se miden con la letra del contenedor, que crece con el tamaño
  elegido en Ajustes; los de `@media`, siempre con los 16 px de fábrica. El
  contenedor es una caja propia porque declararlo también contiene a los
  hijos con `position: fixed`. Un Safari sin consultas de contenedor
  (anterior a iOS 16) se queda con las tres columnas de antes.
  Sin verificar en un iPhone de verdad: se vio en Chrome a esos anchos.
- **Descartado:** encoger la letra de las etiquetas o abreviarlas ("N.º" en vez
  de "Turnos"). Con la letra Mayor volvería a romperse, y una abreviatura es
  una cosa más que entender de pie al final del turno.

## 23. Ajustes, ordenado por lo que cambia cada cosa (17 de octubre de 2026)

Ajustes se sentía desordenada. Se le mostraron al mantenedor tres opciones en
una vista previa, en los dos temas: A (reordenar), B (A con las notas detrás
de un botón (i)) y C (un índice de pantallas, como los Ajustes del iPhone).
**Eligió la A.**

- **El orden sigue a lo que cambia cada ajuste**: Tu restaurante → Ayudantes y
  tip-out → Sueldo → La semana → Pantalla → Tus datos → Ayuda. Lo que mueve el
  dinero va antes que lo cosmético: unos porcentajes mal puestos cuestan más
  que un tema equivocado.
- **Cada casilla va junto a lo que afecta.** "El tip-out se paga en efectivo"
  vivía en Trabajo, tres tarjetas arriba de los ayudantes; ahora va con ellos.
  "Sumar el sueldo al total" va con el sueldo. "Comparar con la semana
  anterior" estaba en Apariencia, pero no cambia cómo se ve la app: cambia qué
  números salen, y va con el incentivo en "La semana".
- **Las notas, de una o dos frases.** Eran párrafos: la pantalla se leía como
  un manual. El porqué largo sigue en la Ayuda. La del tip-out conserva "el
  total del turno no cambia", que es lo que da miedo al apagarla. Una prueba
  vigila el largo y esa frase, en los dos idiomas.
- **Borrar todo va dentro de "Tus datos"**, debajo de una raya y en texto rojo
  sin caja. Antes era el cuarto de una pila de botones iguales, con la misma
  forma que "Compartir la app".
- **Ayuda y contacto, como lista**: una tarjeta con filas e íconos, como la
  pantalla de Ayuda. Al apretar, la fila se oscurece en vez de encogerse.
- **Descartado**: B, porque el porqué de cada casilla quedaba a un toque y la
  pantalla ya cabe bien con notas cortas; C, porque cada cambio cuesta un toque
  más y pedía pantallas nuevas con su botón para volver.
- La Bienvenida no cambia: es otra pantalla, se ve una vez y tiene su propio
  orden (ver "Bienvenida", en §3).

## 24. Una escala de letra (20 de octubre de 2026)

Al recorrer todas las pantallas midiendo la letra que de verdad se ve (393 px,
letra Grande, los dos temas), la jerarquía de §17 seguía bien pensada pero se
había ido separando en los detalles. Se le mostró al mantenedor una vista
previa con el antes y el después de cada caso, con capturas reales, y aprobó
todo (con el título de la instalación en la opción "solo el peso").

- **La causa: 16 tamaños escritos sueltos en `estilos.css`.** Nada impedía que
  dos cosas del mismo nivel acabaran en tamaños distintos, y no daba error.
  Ahora hay una escala de variables `--letra-*` al principio de la sección B,
  como los colores en la sección A, y una prueba rechaza cualquier
  `font-size` que no salga de ella. Las excepciones son cinco y están
  nombradas en la prueba: la raíz (la cambia el tamaño elegido en Ajustes),
  la letra del día y el monto largo del calendario, la flecha de las filas de
  Ajustes y la X del aviso breve. El HTML tampoco puede escribir tamaños a
  mano: los cinco textos grises que lo hacían usan `.texto-nota`.
- **Niveles de texto**: título, subtítulo, cuerpo, texto, nota, pie y leyenda.
  Las cifras van aparte y pueden ser más grandes que el título (§3).
- **El título ya no salta al cambiar de pestaña.** `.cabecera` (Semana,
  Reportes) y `.barra-titulo` (Ajustes, Turno, Ayuda, Bienvenida) tenían
  rellenos distintos y el título se movía 2 px. Una prueba las compara.
- **La negrita es 600 en toda la app**, también en `<strong>`, `<b>` y el
  `<h1>` de la instalación, que traían 700 del navegador. La pestaña activa
  sigue en 700 a propósito (§20).
- **La nota gris tiene un solo tamaño.** Salía en tres (0.75, 0.8125 y 0.875
  rem), a veces en la misma tarjeta. El precio: las notas de Ajustes crecen un
  poco y la pantalla queda unas líneas más larga.
- **La leyenda de un tramo ("Acumulado al cambio 1") es una leyenda como las
  demás.** Iba más chica para caber junto al campo; con el tamaño normal el
  "1" caía solo en otra línea, y `text-wrap: balance` la parte en dos líneas
  parejas (Safari 17.5 o más nuevo, verificado en las notas de WebKit). En un
  Safari más viejo el "1" vuelve a quedar solo, que se lee igual.
- **La tabla del año pesa como la de los días**: el mes en 500 y el neto en
  600.
- **"Pocos datos" en la tabla de los días se queda en el tamaño de leyenda**:
  más grande no cabe en su columna.
- **Descartado:** igualar también el tamaño del título de la instalación al
  de las demás pantallas (debajo del ícono de 68 px se ve débil: es una
  portada), y tocar "Cerrar" junto a la píldora "Ayuda" en el turno, que es
  una decisión de botones y no de letra.


## 25. Tocar una estadística abre su día a día (24 de octubre de 2026)

La petición: tocar "Efectivo neto $249" y ver de dónde salen esos $249, día
por día. Se evaluó en los cuatro ejes, se le mostró al mantenedor una maqueta
con el antes y el después en los dos temas, la miró en el teléfono y la
aprobó entera.

- **Toda la tarjeta es el botón, y la (i) se va.** Con la (i) dentro de una
  tarjeta que también se toca habría dos zonas de toque una dentro de otra, y
  en un teléfono de 320 px con tres columnas se toca la que no era. La
  explicación que vivía en el globo pasa arriba de la hoja; el globo
  desaparece con su código. Una flecha › ocupa el sitio de la (i) para avisar
  que la tarjeta se abre.
- **Es la misma hoja que la de ayuda** (`.hoja-fondo`, `mostrarCapa` /
  `ocultarCapa`): sube desde abajo, se cierra con "Cerrar" o tocando el
  fondo, y cambiar de pantalla la cierra. El estado vive en memoria
  (`detalleAbierto`), como `hojaAyuda`.
- **El total es la cifra de la tarjeta, no la suma de los renglones.**
  `detalleSemana` (logica.js) lo saca de `resumir`, igual que la tarjeta, con
  las mismas preferencias (sueldo contado o no, tip-out en billetes o no). Si
  la hoja diera otro número que la tarjeta que la abrió, traería justo la
  desconfianza que venía a quitar. Las pruebas comprueban las dos cosas: que
  en las que son sumas los días suman el total, y que el total es la cifra de
  la tarjeta.
- **Con centavos en la hoja**, aunque la tarjeta redondee: así la tarjeta de
  la semana se puede cuadrar contra la línea de propinas de tarjeta del
  cheque.
- **Debajo de cada cifra, de qué está hecha** ("$95 − $38.35 de tip-out",
  "6 h × $5.62"). Las que no son sumas (por hora, prop/vtas, por turno)
  cierran con cómo sale el total ("$1,316.61 ÷ 38 h"), no con un "Total" que
  no lo es.
- **Días libres en una línea al final, no como renglones vacíos.** Solo los
  que ya pasaron sin turno: los que faltan de la semana en curso todavía
  pueden tenerlo.
- **Al apretarla, la tarjeta se oscurece en vez de encogerse** como los demás
  botones: la rejilla dibuja sus rayas con el fondo que asoma por el hueco de
  1 px, y encogida dejaría ver un marco gris alrededor.
- **Hallazgo, arreglado en la v50 con el OK del mantenedor:** la tarjeta
  "Por turno" usaba `promedioPorTurno`, que lleva el sueldo, aunque el ajuste
  dijera que no se contara; Reportes sí lo respetaba. Ahora sale de
  `cifrasPrincipales` (`porTurno`), como el total y el por hora, y la cifra
  baja para quien no cuenta el sueldo. Con el sueldo contado, la hoja dice
  de cada día cuánto fue propina y cuánto sueldo.
- **Descartado:** dejar la (i) con su globo y que el resto de la tarjeta
  abriera el día a día (dos zonas de toque juntas); una pantalla aparte en vez
  de la hoja (sacaría a la persona de la semana para una consulta de un
  vistazo); renglones vacíos para los días libres (alargan la hoja sin dar un
  dato).


## 26. Cheque estimado: la lógica (24 de octubre de 2026)

Vigente. La pantalla todavía no existe: se decide sobre una vista previa
antes de construirla. Aquí va lo que ya está en `logica.js`
(`estimarCheque`, `efectivoDeclarado`, `calibrarEstatal`, `TABLAS_CHEQUE`).

- **Tablas oficiales, no un porcentaje.** Calibrar con "el cheque es el X %
  del bruto" se descartó con datos: dos cheques reales retuvieron el 19.9 % y
  el 24.8 % del bruto, porque la retención federal salta del 12 % al 22 % a
  mitad de las semanas normales de un mesero. Un porcentaje fijo se equivoca
  justo en las semanas buenas. Con las tablas, tres cheques reales de semanas
  distintas cuadraron al centavo en cada línea, salvo un centavo de FLI en
  uno. Esos cheques no están en el repositorio; las pruebas usan números
  inventados con la cuenta a mano en el comentario, contra las tablas
  oficiales y no contra la fórmula que se prueba.
- **Fuentes, verificadas el 24 de octubre de 2026:** IRS Publication 15-T
  (2026), Worksheet 1A y las tablas anuales para W-4 de 2020 o después; SSA
  (tope de Social Security de 2026: $184,500); formulario NJ-W4 (tablas A a E,
  método anual, $1,000 por exención) y las tasas de 2026 del Department of
  Labor del estado (UI 0.3825 % + 0.0425 % hasta $44,800; DI 0.19 % y FLI
  0.23 % hasta $171,100).
- **Cómo redondea la nómina, copiado de los cheques:** Social Security y
  Medicare sobre el acumulado del año (lo retenido hasta hoy menos lo
  retenido hasta el cheque anterior); DI, FLI y UI en cada periodo; la mitad
  de un centavo sube (`centavos()` corrige el residuo de la máquina, y una
  prueba lo vigila con 67.50 × 6.2 % = 4.185). El efectivo declarado como
  porcentaje de la tarjeta se trunca. El centavo de FLI que no cuadró no
  sigue ninguna de las dos reglas; se acepta como margen.
- **El efectivo declarado se suma al bruto y se resta del neto**: solo sirve
  para retener, porque el efectivo ya está en el bolsillo. Tres formas, porque
  cada restaurante lo hace distinto: un porcentaje de la tarjeta, lo anotado
  como efectivo neto, o nada.
- **El W-4 completo en la lógica** (estado civil, casilla del paso 2, pasos 3,
  4a, 4b y 4c). Sale casi gratis y el paso 4b importa: la Pub 15-T de 2026
  dice que quien quiera ver la deducción de propinas en cada cheque lo pide
  con un W-4 nuevo. Qué de eso se pregunta en pantalla se decide con la
  vista previa.
- **Estados:** NJ con sus tablas; "mi estado no descuenta nada", que lo dice
  la persona y no la app (que un estado no cobre impuesto sobre el sueldo no
  garantiza que no descuente otras cosas); y para cualquier otro, un
  porcentaje sacado de un cheque suyo (`calibrarEstatal`), marcado como
  aproximado. Cada estado nuevo con tablas entra con su fuente oficial y al
  menos un cheque real para validarlo.
- **Las tablas tienen año.** Cada enero hay que añadir las nuevas (la Pub
  15-T sale en diciembre). Si falta el año del cheque, `estimarCheque` usa
  las últimas y lo dice (`tablasDelAnio: false`), para que la pantalla avise
  en vez de equivocarse en silencio.
- **Lo que quedaba pendiente se decidió sobre la vista previa: §27.** DECISIONES
  §7 ("no etiquetar nada como impuestos") se reemplaza para esta pantalla:
  el mantenedor eligió que el desglose use los nombres del cheque.


## 27. Cheque estimado: la pantalla (24 de octubre de 2026)

Vigente. Se eligió sobre una vista previa mirada en el teléfono.

- **Debajo del neto de la semana**, en su propia tarjeta (opción A). Es lo
  primero que se mira al abrir la app; al final (opción B) quedaba para quien
  lo busca solo el día de pago. Tocarla abre el desglose en la misma hoja del
  día a día (§25): lo que paga, lo que retiene y el neto, con los nombres del
  cheque y en su orden, para compararlo línea por línea con el papel.
- **Sin configurar nada para verlo.** Pedir día de pago, estado, estado civil
  y efectivo declarado antes de mostrar una cifra es la fricción que hace que
  nadie la use. Viene encendido y con los valores del restaurante donde nació
  la app (donde están hoy todos los que la usan): NJ, tabla A, 16 % de la
  tarjeta declarado, pago los jueves y "soltero" sin nada más en el W-4, que
  es como el IRS manda retener a quien no entregó W-4 (Pub 15-T).
- **El aviso va en la misma tarjeta**, no en una pantalla aparte: "Calculado
  con valores de ejemplo. Revisa tu estado civil y dos datos más en Ajustes",
  y lleva directo a la sección. Se va al tocar cualquier ajuste del cheque o
  "Mis datos están bien" (`chequeRevisado`). El estado civil va primero en el
  aviso porque es el que más mueve la cifra entre dos meseros del mismo
  restaurante.
- **Ajustes → Tu cheque, después de Sueldo** (§23: lo que mueve dinero va
  primero). A la vista, lo que cambia de una persona a otra; plegado ("Más del
  W-4"), lo que casi nadie toca. Una casilla para apagarlo.
- **El acumulado del año sale solo**: la suma de las semanas anotadas que se
  pagan este año antes del cheque. Como la app no sabe lo que se ganó antes de
  usarla, hay un campo opcional para copiar el "year to date" del último
  cheque; se ancla al último día de pago y la app suma lo de después. Solo se
  re-ancla cuando ese número cambia: si se re-anclara al guardar otro campo,
  lo de las semanas siguientes se contaría dos veces.
- **El ancla también sirve hacia atrás (v51, 29 de octubre de 2026).** El
  primer cheque real comparado con la app falló por una línea entera (la UI
  de NJ, ya topada) y no por redondeo. Al copiar el "year to date" para
  arreglarlo, la semana siguió igual: el día de pago se copia el cheque que se
  tiene en la mano y se mira la semana que ese cheque paga, pero el ancla
  quedaba con la fecha de ese mismo cheque y solo se usaba para los
  posteriores. Ahora, para ese cheque o uno anterior, al ancla se le resta lo
  anotado de las semanas pagadas entre medias (con lo anotado: un centavo
  distinto en la tarjeta no mueve ningún tope). Y el aviso breve dice de qué
  cheque tomó el número, para que un ancla mal fechada se vea al escribirla y
  no el día de pago.
- **El bruto del año se pide solo a quien le falta (v51).** "Mis datos están
  bien" quitaba el aviso aunque el acumulado estuviera vacío, y sin él la app
  sigue cobrando la UI a quien ya la pagó. Pedirlo a todos molestaba a quien
  no lo necesita: si hay semanas anotadas pagadas hasta el 7 de enero (el
  primer día de pago del año cae siempre en esa semana), la app ya tiene el
  año entero (`acumuladoDelAnio` → `completo`). Al resto, la tarjeta se lo
  pide hasta que lo copie, con el camino directo al campo, y el desglose lo
  marca en la línea de la UI, que es la única que hoy cambia con él. Quien
  cambió de trabajo a mitad de año lo verá aunque la app tenga todo lo de su
  trabajo nuevo; copiarlo de su primer cheque lo resuelve.
- **Una semana sin turnos no tiene tarjeta**, y otro estado dice
  "aproximado" debajo de la cifra.
- **Descartado:** un asistente de configuración la primera vez (fricción,
  justo lo que se quería evitar); preguntar al instalar la app (quien todavía
  no sabe para qué sirve no va a buscar su W-4); pedir la fecha de pago del
  cheque de donde sale el acumulado (se deduce: es el último día de pago).
