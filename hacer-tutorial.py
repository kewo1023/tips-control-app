#!/usr/bin/env python3
"""
Genera las cuatro imágenes del tutorial de instalación para mandar por WhatsApp.

    python3 hacer-tutorial.py

Salen `tutorial-1.png` … `tutorial-4.png`, verticales (1080x1180), que es la
proporción que WhatsApp muestra entera sin recortar. Una imagen recortada en la
vista previa obliga a abrirla para entenderla, y la mitad de la gente no la abre.

Los colores son los mismos de la app a propósito: quien vea el tutorial y luego
la app tiene que reconocer que son la misma cosa.
"""

from PIL import Image, ImageDraw, ImageFont

ANCHO, ALTO = 1080, 1180

PAPEL      = (250, 249, 247)
TARJETA    = (255, 255, 255)
TINTA      = (22, 21, 15)
TINTA_2    = (107, 105, 99)
TINTA_3    = (154, 152, 145)
LINEA      = (231, 229, 224)
VERDE      = (21, 128, 61)
VERDE_SUAVE = (220, 242, 227)
GRIS_IOS   = (242, 242, 247)

F = '/usr/share/fonts/truetype/liberation2/LiberationSans-%s.ttf'
def fuente(tam, negrita=True):
    return ImageFont.truetype(F % ('Bold' if negrita else 'Regular'), tam)


def texto_centrado(d, y, txt, f, color):
    ancho = d.textbbox((0, 0), txt, font=f)[2]
    d.text(((ANCHO - ancho) / 2, y), txt, font=f, fill=color)


def envolver(d, txt, f, ancho_max):
    """Parte el texto en líneas que quepan. Sin esto, un título largo se sale
    del borde y no hay forma de saberlo hasta ver el PNG."""
    palabras, lineas, actual = txt.split(), [], ''
    for p in palabras:
        prueba = (actual + ' ' + p).strip()
        if d.textbbox((0, 0), prueba, font=f)[2] <= ancho_max:
            actual = prueba
        else:
            lineas.append(actual)
            actual = p
    lineas.append(actual)
    return lineas


def base(numero, titulo, subtitulo):
    img = Image.new('RGB', (ANCHO, ALTO), PAPEL)
    d = ImageDraw.Draw(img)

    # El número en un círculo verde. Es lo único de color de la cabecera: sirve
    # de marcador de posición cuando se ven las cuatro seguidas en el chat.
    d.ellipse([80, 80, 188, 188], fill=VERDE)
    n = str(numero)
    f = fuente(62)
    caja = d.textbbox((0, 0), n, font=f)
    d.text((134 - caja[2] / 2, 134 - caja[3] / 2 - 6), n, font=f, fill=PAPEL)

    f_tit = fuente(64)
    y = 230
    for linea in envolver(d, titulo, f_tit, ANCHO - 160):
        d.text((80, y), linea, font=f_tit, fill=TINTA)
        y += 78

    f_sub = fuente(38, False)
    y += 12
    for linea in envolver(d, subtitulo, f_sub, ANCHO - 160):
        d.text((80, y), linea, font=f_sub, fill=TINTA_2)
        y += 50

    return img, d, y + 40


def icono_compartir(d, cx, cy, escala=1.0, color=(10, 132, 255)):
    """El botón Compartir de iOS: un cuadro abierto con una flecha subiendo."""
    g = 7 * escala
    d.line([(cx, cy - 34 * escala), (cx, cy + 12 * escala)], fill=color, width=int(g))
    d.line([(cx - 20 * escala, cy - 15 * escala), (cx, cy - 36 * escala)],
           fill=color, width=int(g))
    d.line([(cx + 20 * escala, cy - 15 * escala), (cx, cy - 36 * escala)],
           fill=color, width=int(g))
    d.rounded_rectangle(
        [cx - 30 * escala, cy - 8 * escala, cx + 30 * escala, cy + 46 * escala],
        radius=10 * escala, outline=color, width=int(g))
    # Se tapa el hueco de arriba para que la flecha "salga" de la caja.
    d.rectangle([cx - 22 * escala, cy - 14 * escala, cx + 22 * escala, cy], fill=PAPEL)
    d.line([(cx, cy - 34 * escala), (cx, cy + 12 * escala)], fill=color, width=int(g))


def marco_telefono(d, x, y, an, al, relleno=TARJETA):
    d.rounded_rectangle([x, y, x + an, y + al], radius=46, fill=relleno,
                        outline=LINEA, width=3)


# ---------------------------------------------------------------------------
# 1. Abrirlo en Safari
# ---------------------------------------------------------------------------
img, d, y = base(1, 'Abre el enlace en Safari',
                 'Mantén pulsado el enlace de arriba y elige «Abrir en Safari».')

marco_telefono(d, 190, y, 700, 620)
# La burbuja del mensaje
d.rounded_rectangle([240, y + 60, 700, y + 190], radius=28, fill=VERDE_SUAVE)
d.text((280, y + 95), 'kewo1023.github.io', font=fuente(34, False), fill=VERDE)
d.line([(280, y + 138), (620, y + 138)], fill=VERDE, width=3)

# El menú que sale al mantener pulsado
d.rounded_rectangle([300, y + 250, 830, y + 500], radius=26, fill=GRIS_IOS)
op = [('Abrir', TINTA_2), ('Abrir en Safari', VERDE), ('Copiar', TINTA_2)]
for i, (txt, color) in enumerate(op):
    yy = y + 285 + i * 72
    if color == VERDE:
        d.rounded_rectangle([315, yy - 18, 815, yy + 52], radius=14, fill=(255, 255, 255))
    d.text((345, yy), txt, font=fuente(38, color == VERDE), fill=color)
d.polygon([(700, y + 320), (700, y + 372), (655, y + 346)], fill=VERDE)
img.save('tutorial-1.png')

# ---------------------------------------------------------------------------
# 2. El botón de compartir
# ---------------------------------------------------------------------------
img, d, y = base(2, 'Toca el botón Compartir',
                 'Está abajo del todo, en la barra de Safari.')

marco_telefono(d, 190, y, 700, 620)
d.text((240, y + 50), 'Tips Control', font=fuente(44), fill=TINTA)
d.rounded_rectangle([240, y + 130, 840, y + 300], radius=20, fill=PAPEL, outline=LINEA, width=3)
d.text((275, y + 165), 'Instala la app', font=fuente(34), fill=TINTA)
d.text((275, y + 215), 'Toca compartir y luego', font=fuente(30, False), fill=TINTA_2)
d.text((275, y + 253), 'Añadir a pantalla de inicio', font=fuente(30, False), fill=TINTA_2)

# La barra de Safari, abajo del "teléfono"
d.rounded_rectangle([215, y + 480, 865, y + 595], radius=28, fill=GRIS_IOS)
for i, s in enumerate(['<', '>', '', '', '...']):
    d.text((270 + i * 135, y + 515), s, font=fuente(40), fill=TINTA_3)
icono_compartir(d, 540, y + 545, 1.15)
d.ellipse([475, y + 480, 605, y + 610], outline=VERDE, width=8)
img.save('tutorial-2.png')

# ---------------------------------------------------------------------------
# 3. Añadir a pantalla de inicio
# ---------------------------------------------------------------------------
img, d, y = base(3, 'Añadir a pantalla de inicio',
                 'Baja en la lista hasta encontrarlo. En inglés: Add to Home Screen.')

marco_telefono(d, 190, y, 700, 620, GRIS_IOS)
filas = [('Añadir a Favoritos', False), ('Buscar en la página', False),
         ('Añadir a pantalla de inicio', True), ('Marcar', False)]
for i, (txt, marcada) in enumerate(filas):
    yy = y + 70 + i * 130
    if marcada:
        d.rounded_rectangle([225, yy - 22, 855, yy + 92], radius=22, fill=(255, 255, 255),
                            outline=VERDE, width=6)
    d.text((270, yy + 14), txt, font=fuente(34, marcada), fill=VERDE if marcada else TINTA_2)
    if marcada:
        d.rounded_rectangle([760, yy + 4, 820, yy + 64], radius=14, outline=VERDE, width=5)
        d.line([(790, yy + 18), (790, yy + 50)], fill=VERDE, width=5)
        d.line([(774, yy + 34), (806, yy + 34)], fill=VERDE, width=5)
img.save('tutorial-3.png')

# ---------------------------------------------------------------------------
# 4. Listo
# ---------------------------------------------------------------------------
img, d, y = base(4, 'Listo',
                 'Ya la tienes en tu pantalla de inicio. Ábrela siempre desde ahí.')

try:
    # iOS redondea las esquinas del ícono al ponerlo en la pantalla de inicio.
    # Sin esta máscara sale cuadrado, y entonces no se parece a lo que la
    # persona va a ver en su teléfono — que es lo único que tiene que reconocer.
    icono = Image.open('icono-512.png').convert('RGBA').resize((260, 260))
    mascara = Image.new('L', (260, 260), 0)
    ImageDraw.Draw(mascara).rounded_rectangle([0, 0, 259, 259], radius=58, fill=255)
    img.paste(icono, (410, y + 90), mascara)
except Exception:
    d.rounded_rectangle([410, y + 90, 670, y + 350], radius=58, fill=VERDE)

d.text((0, 0), '', font=fuente(10))
texto_centrado(d, y + 380, 'Tips', fuente(38), TINTA)

texto_centrado(d, y + 480, 'Registra tus turnos SOLO desde aquí.', fuente(34), TINTA)
texto_centrado(d, y + 530, 'Lo que apuntes en el navegador no', fuente(32, False), TINTA_2)
texto_centrado(d, y + 574, 'aparece dentro de la app.', fuente(32, False), TINTA_2)
img.save('tutorial-4.png')

print('Listo: tutorial-1.png a tutorial-4.png')
