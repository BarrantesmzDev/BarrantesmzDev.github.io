# Motos 3D

Web tipo Sketchfab pero solo de motos. Cada moto se ve con el visor oficial de Sketchfab y, por medio de su Viewer API, se le puede cambiar el color pieza por pieza o a todo el carenado de una vez. La página no descarga ni copia los modelos, los colores se cambian en vivo dentro del visor.

## Qué trae

- Visor 3D grande, la información del modelo abajo (autor, vistas, licencia) y las motos destacadas al lado, igual que en Sketchfab.
- Búsqueda en vivo solo de motos. El buscador y las categorías (Deportivas, Naked, Doble propósito, marcas) consultan la API pública de Sketchfab con la etiqueta `motorcycle`.
- Personalizar: tocar una pieza en la moto la selecciona y «Todo el carenado» agarra todas las piezas de carrocería de un solo toque.
- Colores base y «Mis colores». Cada persona agrega los suyos con selector, código HEX y nombre, y quedan guardados en su navegador.
- Acabados: brillante, metalizado, satinado, mate y cromado.
- Deshacer y rehacer, quitar color, restablecer, «Solo selección», «Varias» (para seleccionar varias piezas en el celular), vistas de cámara, «Ver armado» (la animación de armado de la R3) y «Captura» para bajar una imagen.

## Motos incluidas

| Moto | Autor en Sketchfab | Licencia | Cómo viene el carenado |
| --- | --- | --- | --- |
| Yamaha YZF-R3 1ª generación (la misma de la 2016) | mandiuza | CC BY 4.0 | 10 piezas separadas: tanque, frontal, laterales, tapas, inferiores, colín y guardabarros |
| Hero XPulse 200 | Rorro (mauriar25) | Sin licencia de descarga, solo se muestra | Plásticos del carenado |
| Suzuki Gixxer 250 SF | F5Fury | CC BY 4.0 | Carrocería en una sola pieza más el frente |
| Yamaha YZF-R3 2017 | e-restrepo1114 | CC BY 4.0 | Por color: carenado azul, carenado plateado y tanque con colín y guardabarros |
| Yamaha YZF-R3 2019 y Yamaha R1 | dragos12_ y ejsnowy | CC BY 4.0 | Se detecta solo por el nombre de los materiales |

## Publicarla en GitHub Pages

1. En GitHub, crear un repositorio nuevo, por ejemplo `motos-3d`, público.
2. Add file → Upload files → subir `index.html` → Commit changes.
3. Settings → Pages → en «Build and deployment» elegir Deploy from a branch, rama `main` y carpeta `/ (root)` → Save.
4. En uno o dos minutos queda en `https://TU-USUARIO.github.io/motos-3d/`.

## Probarla en la compu

Con doble clic (`file://`) el visor de Sketchfab puede fallar, por eso conviene levantar un servidor local. En la carpeta del proyecto se corre `npx serve` y se abre la dirección que muestra. También sirve la extensión Live Server de VS Code.

## Agregar más motos

La idea es sencilla, cada moto es un `uid` de Sketchfab, que son los 32 caracteres al final del link del modelo.

1. Agregarla a `CATALOGO`:

```js
{uid: 'pegar-aqui-el-uid', nombre: 'Kawasaki Ninja 400'},
```

2. Con eso ya aparece en «Destacadas» y se puede pintar. El carenado se detecta por el nombre de los materiales. Si se equivoca, se seleccionan las piezas y se usa «Marcar como carenado».
3. Para dejar ese carenado fijo para todas las personas, se abre la consola del navegador (F12) con esa moto cargada, se corre `motos3d.exportar()` y el resultado se copia en `PRESETS`:

```js
'uid-de-la-moto': {
  carenado: {123: 'Tanque', 456: 'Carenado lateral derecho'},
  nombres: {789: 'Asiento'}
},
```

4. Si además se quieren las vistas con nombre (Lateral, 3/4, Frente, Atrás, Arriba), se agregan `centro` (el punto al que mira la cámara), `frente` y `der` (hacia dónde apunta la moto) y `dist` (qué tan lejos queda la cámara en cada vista). Sin esos datos la moto usa los botones de girar, que sirven para cualquier modelo.

```js
frente: [0, 1, 0], der: [1, 0, 0], centro: [0, -0.65, 0.75],
dist: {tres: 2.6, lateral: 3.2, frente: 2.6, atras: 2.6, arriba: 4},
```

## Licencias y créditos

- Los modelos siguen siendo de sus autores y se muestran con el visor de Sketchfab, que es como ellos los publicaron.
- Los modelos CC BY piden dar crédito. Por eso la página muestra el autor, la licencia y el link de cada moto.
- Si la web va a ser comercial, hay que revisar el tema de las marcas (Yamaha, Suzuki, Hero) y de los logos que traen los modelos. Además, el visor gratis de Sketchfab siempre muestra su marca.
