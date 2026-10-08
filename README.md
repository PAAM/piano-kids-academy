# Piano Kids Academy v5

Abre `index.html` directamente en Chrome, Edge o Firefox. No necesita servidor ni dependencias externas.

## Funciones
- Selector de 8 ejercicios y canciones.
- Dos modos: notas descendentes y paso a paso.
- Piano de 1 a 3 octavas, nombres DO RE MI y teclas negras.
- Instrumentos piano sintetizado y sonido retro de 8 bits.
- Web Audio API: el audio se activa con una interacción del usuario.
- Velocidad, pausa, reinicio y teclas A S D F G H J.

## Canciones
Mario y Pantera Rosa utilizan las secuencias facilitadas por el usuario, con duraciones aproximadas. Dance Monkey incluye acordes arpegiados y escala, no la melodía exacta. Billete Verde es un ejercicio provisional.

## Para añadir canciones
Edita el arreglo `songs` en `index.html`. Cada nota es `[numeroMIDI, duracionEnPulsos]`.

## Desarrollo SCSS
`styles.scss` es editable; `styles.css` es la hoja compilada lista para navegador.
