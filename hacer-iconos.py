"""
Genera los iconos de Tips Control.
Correr una sola vez:  python3 hacer-iconos.py
(Se guarda en el repo por si algun dia hay que rehacerlos con otro color.)
"""
from PIL import Image, ImageDraw, ImageFont

FONDO = (18, 60, 38)      # verde muy oscuro, se ve bien sobre cualquier fondo de pantalla
BARRA = (74, 222, 128)    # verde claro
FUENTE = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'

def icono(px, archivo):
    # Dibujamos al triple de tamano y luego reducimos: los bordes quedan suaves
    # sin tener que dibujar antialiasing a mano.
    E = 3
    img = Image.new('RGB', (px*E, px*E), FONDO)
    d = ImageDraw.Draw(img)
    W = px*E

    # Tres barras ascendentes: la propina que sube. Legible a 40 px.
    ancho = int(W*0.13)
    hueco = int(W*0.075)
    base  = int(W*0.74)
    inicio = (W - (3*ancho + 2*hueco)) // 2
    for i, alto in enumerate([0.20, 0.32, 0.46]):
        x = inicio + i*(ancho+hueco)
        d.rounded_rectangle([x, base-int(W*alto), x+ancho, base],
                            radius=int(ancho*0.28), fill=BARRA)

    # El signo de dolar debajo, como firma
    f = ImageFont.truetype(FUENTE, int(W*0.17))
    caja = d.textbbox((0,0), '$', font=f)
    d.text(((W-(caja[2]-caja[0]))/2 - caja[0], base + int(W*0.03)),
           '$', font=f, fill=BARRA)

    img.resize((px, px), Image.LANCZOS).save(archivo)
    print('creado', archivo)

for px in (180, 192, 512):
    icono(px, f'icono-{px}.png')
