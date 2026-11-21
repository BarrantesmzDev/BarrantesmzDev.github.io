# Motos 3D

Una Yamaha R3 en 3D con todo el carenado separado pieza por pieza. Se toca cualquier tapa de la moto, se ve cómo se llama y se pinta con el color y el acabado que uno quiera, así se tiene una idea de cómo quedaría antes de mandarla a pintar.

Los colores de fábrica son los de la R3 2016 Racing Blue: frontal, tanque, colín y rines azules, los laterales y la tapa superior del tanque en plata y el resto en negro. Las calcomanías no vienen en el modelo, por eso los laterales se ven lisos.

## De dónde sale el modelo

El modelo 3D está basado en [«Yamaha YZF R3 2015»](https://sketchfab.com/3d-models/yamaha-yzf-r3-2015-3b1aa6970bc944299c3f1e4914e630ca) de [Nieve5677](https://sketchfab.com/niev), publicado en Sketchfab con licencia [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/). La licencia deja usarlo y cambiarlo siempre que se dé el crédito, por eso el crédito sale en la página, en la ayuda y dentro del `.glb` que se descarga.

Lo que se le cambió:

- Venía de lado y un poco invertido. Se giró para que quede de pie, con el frente hacia `+x`.
- Venía en 167 mallas con nombres de número. Se juntaron en 70 piezas con nombre en español.
- El lateral de cada lado venía pegado en una sola malla con el panel de arriba y con el lateral del otro lado. Se cortó por la línea donde termina el lateral y por el centro de la panza, así quedan cuatro piezas con bordes limpios.
- El colín venía en una sola pieza. Se separó por zonas en colín derecho, colín izquierdo y la base que queda debajo de los asientos.
- Se le quitaron las texturas y se le pusieron materiales nuevos para poder pintar cada pieza.
- Se bajó de 1.27 millones de triángulos a unos 553 mil y se comprimió, así pasó de 40 MB a 4 MB. Lo que se simplificó fueron las piezas donde no se nota, como rines, motor, direccionales y tornillería. Las tapas de afuera quedaron con todo su detalle.

Un detalle: los nombres internos de las mallas dicen `desirefx.me`, que es un sitio que vuelve a subir modelos de otras personas. Puede ser que Nieve5677 no sea el autor original. Para una página personal no es problema, pero si algún día se quiere usar para vender algo vale la pena buscar al autor original o usar otro modelo.

## Qué trae

- **Un toque selecciona.** La pieza se marca en naranja, sale una etiqueta con su nombre al lado y arriba aparece cuál es. Tocar el fondo suelta la selección y con dos toques seguidos la cámara se acerca a esa pieza.
- **Todo el carenado separado.** Frontal, burbuja, panel superior y lateral de cada lado, carenado inferior, tapas laterales del tanque, tapas bajo el asiento, carenado interior, interior del frontal, rejilla de la toma de aire, protectores del radiador, guardabarro delantero, tanque, tapa superior del tanque, tapa de gasolina, asientos, colín, base del colín, guardabarro trasero, portaplaca y placa.
- **70 piezas en total.** Además del carenado vienen rines, llantas, discos, calipers, cadena, chasis, basculante, horquilla, amortiguador y resorte, motor con sus tapas, escape, manubrio, espejos, tablero, estriberas y luces.
- **Despiezar.** Separa todo el carenado con una animación y una barra para decidir qué tanto se abre. Con «Nombres» cada pieza muestra su nombre y también se puede tocar el nombre para elegirla.
- **Todo el carenado.** Un interruptor elige las 15 tapas de afuera de una vez para pintar la moto completa de un solo color.
- **Ambos lados.** Al tocar un lado se elige también el otro, para pintar izquierda y derecha iguales. Se puede apagar.
- **Varias piezas.** Con el interruptor, con Ctrl o Shift en la compu, o dejando el dedo apretado en el celular, cada toque suma o quita piezas.
- **Colores y acabados.** 18 colores base y «Mis colores», donde cada persona guarda los suyos con nombre. Acabados: brillante, metalizado, satinado, mate, cromado, anodizado, tornasol y carbono.
- **Estilos.** Nueve combinaciones listas y el botón «Sorpréndeme». Abajo se explica qué pieza lleva cada color y con «Elegir» se agarran todas las piezas de ese grupo de una vez.
- **Solo esto.** Deja visible solo lo seleccionado y el resto queda transparente.
- Deshacer y rehacer, vistas de cámara, girar sola, foto, modo oscuro automático y descarga del modelo pintado en `.glb`.
- **Compartir** crea un link con el diseño. Además el diseño se guarda solo en el navegador.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `index.html` | La página y los estilos. |
| `app.js` | La escena, la selección, el despiece, las etiquetas, los colores y el panel. |
| `moto-r3.js` | Carga el modelo, arma las piezas con sus materiales y tiene la lista de acabados. |
| `modelo/r3.glb` | El modelo ya procesado, con cada pieza separada y sus datos (nombre, grupo, color de fábrica, lado y hacia dónde sale al despiezar). |
| `modelo/CREDITOS.md` | El crédito del modelo original y la licencia. |
| `herramientas/r3-construir.mjs` | El script que convierte el modelo de Sketchfab en `modelo/r3.glb`. |
| `galeria.html` | La versión anterior con otros modelos de Sketchfab. |

## Cómo se generó el modelo

El script `herramientas/r3-construir.mjs` hace todo el proceso. La idea es sencilla, lee el modelo original, gira cada malla, decide a qué pieza va cada triángulo y guarda un `.glb` nuevo con una pieza por nodo.

1. Se descarga el modelo de Sketchfab en formato glTF y se descomprime en una carpeta, por ejemplo `modelo-r3/`.
2. En otra carpeta se instalan las dependencias:

   ```
   npm i @gltf-transform/core @gltf-transform/extensions @gltf-transform/functions meshoptimizer
   ```

3. Se corre el script con la ruta del modelo, la salida y un resumen:

   ```
   node herramientas/r3-construir.mjs modelo-r3/scene.gltf modelo/r3.glb resumen.json
   ```

Al final imprime cuántas piezas y triángulos quedaron y el peso del archivo.

## Cambiar una pieza

Todo está en el script, en la tabla `PIEZAS`. Cada pieza tiene su nombre, grupo, color de fábrica (`hex`), acabado, hacia dónde sale al despiezar (`explota: [x, y, z]`) y si entra o no en «Todo el carenado» (`carenado: true`).

- Para cambiar un color de fábrica se cambia `hex` y se vuelve a correr el script.
- Para mover una malla de una pieza a otra se cambia en la tabla `reglas`, que dice a qué pieza va cada malla por su número.
- Para correr el corte entre el lateral y el panel superior se mueven los puntos de `lineaFin`. Son puntos vistos de lado, `x` hacia adelante y `y` hacia arriba, en metros.

Las medidas van en metros: `x` hacia adelante, `y` hacia arriba y `z` hacia la derecha. El eje de la rueda delantera está en `x= 0.699` y el de la trasera en `x= -0.699`.

## Probarla en la compu

Los módulos de JavaScript no cargan con doble clic (`file://`), por eso se levanta un servidor local en la carpeta, por ejemplo con `npx serve`, y se abre la dirección que muestra.

## Publicarla

Ya está en GitHub Pages dentro de `barrantesmzdev.github.io/motos-3d/`. Para actualizarla basta con subir los archivos nuevos a esa carpeta. Si un cambio no se ve, se sube el número de `?v=` en `index.html`, en el `import` de `app.js` y en la ruta de `modelo/r3.glb` para que el navegador no use la versión vieja.
