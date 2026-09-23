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

---

## 6. El incentivo (puntos)

Lo pidieron usuarios que aún no habían usado la app. Se desaconsejó la versión
completa (lista de productos, unas 400 líneas): construir con lo que la gente
cree que va a necesitar, antes del piloto, es gastarse el presupuesto del
piloto. Se hizo la versión pequeña:

- Casilla en Ajustes → Trabajo, apagada de fábrica.
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
  punto.
- Efectivo y tarjeta siempre separados.
- `prefs.contarSueldo` decide la cifra vía `cifrasPrincipales()`, **sin
  recalcular**, y se aplica igual en recibo, total, barras, comparación, por
  hora y **mejor día** (si el "mejor día" no coincide con la barra más alta, se
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
archivo solo llena días vacíos (`fusionarTurnos()`). Tan conservador porque los
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
  encima.
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
  se vuelve configurable.
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
- La píldora de la pestaña activa se dibuja con `::before`: la zona táctil
  sigue siendo el tercio entero de la barra.
- **Pendiente:** verde sobre verde suave da 4.26:1 en claro. Subir la letra no
  lo arregla (haría falta ~19 px en negrita); lo arreglaría un verde un poco
  más oscuro, que es cambiar la paleta.

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
espacio debajo a una barra que salta. `mini-dom.js` aprendió
`style.setProperty` para poder probarlo.
