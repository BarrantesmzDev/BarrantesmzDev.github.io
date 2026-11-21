# Motos 3D

Moto deportiva en 3D hecha desde cero con código, pieza por pieza. Se toca cualquier parte de la moto, se ve cómo se llama y se pinta con el color y el acabado que uno quiera. El carenado completo se puede despiezar para ver y elegir cada panel por separado.

El modelo no viene de Sketchfab ni de ninguna marca. Se arma en el navegador con `moto.js`, por eso la página pesa poco y se puede cambiar cualquier forma desde el código. Es una deportiva original del estilo de una 300 cc, no una copia de la R3 ni de otra moto.

## Qué trae

- **Un toque selecciona.** La pieza se marca en naranja, sale una etiqueta con su nombre al lado de la pieza y arriba aparece cuál es. Tocar el fondo suelta la selección y con dos toques seguidos la cámara se acerca a esa pieza.
- **Despiezar.** Separa todo el carenado con una animación y una barra para decidir qué tanto se abre. Con «Nombres» cada pieza muestra su nombre y también se puede tocar el nombre para elegirla.
- **65 piezas.** 19 del carenado (frontal, laterales superiores e inferiores, tomas de aire, quilla, cubre tanque, tapas del tanque, tapas bajo el asiento, colín, tapa del colín, bandeja y guardabarro), más burbuja, asientos, rines, llantas, discos, calipers, catalina, cadena, chasis, subchasis, basculante, horquilla, amortiguador, motor y sus tapas, radiador, escape, manubrio, espejos, estriberas y luces.
- **Lista de piezas con foto.** Cada pieza tiene una miniatura sacada del mismo modelo, el color que tiene ahora y un buscador.
- **Ambos lados.** Al tocar un lado se elige también el otro, para pintar izquierda y derecha iguales. Se puede apagar.
- **Varias piezas.** Con el interruptor, con Ctrl o Shift en la compu, o dejando el dedo apretado en el celular, cada toque suma o quita piezas.
- **Colores y acabados.** 18 colores base y «Mis colores», donde cada persona guarda los suyos con nombre. Acabados: brillante, metalizado, satinado, mate, cromado, anodizado, tornasol y carbono.
- **Estilos.** Nueve combinaciones listas y el botón «Sorpréndeme». Abajo se explica qué pieza lleva cada color y con «Elegir» se agarran todas las piezas de ese grupo de una vez.
- **Solo esto.** Deja visible solo lo seleccionado y el resto queda transparente, así se ve bien la forma de la pieza.
- Deshacer y rehacer, vistas de cámara, girar sola, foto, modo oscuro automático y descarga del modelo en `.glb` para usarlo en otros programas.
- **Compartir** crea un link con el diseño. Además el diseño se guarda solo en el navegador.

## Archivos

| Archivo | Qué hace |
| --- | --- |
| `index.html` | La página y los estilos. |
| `app.js` | La escena, la selección, el despiece, las etiquetas, los colores y el panel. |
| `moto.js` | Arma la moto. Cada pieza es una función o un panel con sus puntos. |
| `galeria.html` | La versión anterior con los modelos reales de Sketchfab. |

## Cómo se arma el carenado

La idea es sencilla, la carrocería se define con cuatro «envolventes» (frente, carenado inferior, tanque y colín). Cada envolvente es una forma que cambia a lo largo de la moto, con su alto, su ancho y qué tan cuadrada o redonda es.

Cada panel se dibuja encima de una envolvente con un contorno de puntos vistos de lado (`P(x, y)`), desde arriba (`Pa(x, z)`), desde abajo (`Pb(x, z)`) o por ángulo (`Pf(x, ángulo)`). Los puntos con un `1` al final son las cuatro esquinas del panel. Con eso el código hace la malla, le da grosor de plástico, redondea el borde y deja una junta de 4 mm con el panel de al lado.

Las medidas van en metros: `x` hacia adelante, `y` hacia arriba y `z` hacia la derecha. Por ejemplo, el eje de la rueda delantera está en `x= 0.69` y la trasera en `x= -0.69`.

## Cambiar o agregar una pieza

1. En `moto.js` se busca la pieza por su `id`, por ejemplo `colin`.
2. Para cambiar la forma se mueven los puntos del contorno. Para cambiar hacia dónde sale al despiezar se cambia `explota: [x, y, z]`.
3. Para una pieza nueva se usa `unico(...)` si va en el centro o `parPanel(...)` si lleva lado derecho e izquierdo. El lado izquierdo se crea solo, como espejo del derecho.
4. Si la pieza es del carenado, se agrega su `id` a la lista `CARENADO` en `app.js` para que entre en «Todo el carenado».

## Probarla en la compu

Los módulos de JavaScript no cargan con doble clic (`file://`), por eso se levanta un servidor local en la carpeta, por ejemplo con `npx serve`, y se abre la dirección que muestra.

## Publicarla

Ya está en GitHub Pages dentro de `barrantesmzdev.github.io/motos-3d/`. Para actualizarla basta con subir los archivos nuevos a esa carpeta. Si un cambio no se ve, se sube el número de `?v=` en `index.html` y en el `import` de `app.js` para que el navegador no use la versión vieja.
