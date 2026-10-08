# Piano Kids Academy v2

Aplicación web en JavaScript ES Modules, SCSS (fuente) y CSS listo para servir.

## Ejecutar

En la carpeta `piano-kids`, inicia un servidor HTTP local:

```bash
python -m http.server 8000
```

Abre http://localhost:8000. También puedes publicar la carpeta en GitHub Pages (sin compilación).

## Modos

- **Notas descendentes**: pulsa Reproducir para escuchar la melodía y ver barras sincronizadas con el teclado.
- **Paso a paso**: toca la tecla resaltada para avanzar; si fallas, aparece una pista. Puedes tocar con ratón, pantalla táctil o teclas A S D F G H J para las siete notas naturales de la octava central.

## Biblioteca ampliable

Añade a `songs.js` un objeto con `id`, `title`, `bpm` y `notes` (pares `[numeroMidi, duracionEnPulsos]`). Por ejemplo:

```js
{id:'demo',title:'Mi melodía',bpm:100,notes:[[60,1],[62,1],[64,2]]}
```

La nota 60 es DO4. El teclado admite como máximo 3 octavas (DO3–SI5). Las canciones deben mantenerse en ese rango; con 1 o 2 octavas seleccionadas algunas notas pueden quedar fuera de pantalla. La aplicación no transcribe audio ni convierte automáticamente prompts en canciones: el formato facilita incorporar nuevas secuencias preparadas o MIDI transcritos de forma autorizada.

## Archivos

- `index.html`: interfaz
- `app.js`: reproducción, audio, animaciones y lecciones
- `songs.js`: catálogo de canciones
- `styles.scss`: fuente de estilos SCSS
- `styles.css`: hoja de estilos para el navegador

El audio usa síntesis básica con Web Audio API, no muestras de un piano acústico. Para el sonido se requiere interacción del usuario con la página.
