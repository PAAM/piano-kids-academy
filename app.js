import { songs } from './songs.js';

const $ = id => document.getElementById(id);
const NOTE_NAMES = ['DO','DO♯','RE','RE♯','MI','FA','FA♯','SOL','SOL♯','LA','LA♯','SI'];
const isBlack = midi => [1,3,6,8,10].includes(midi % 12);
const noteName = midi => `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
const whiteWidth = 42;
const keys = new Map();
const state = { song: songs[0], mode: 'falling', octaves: 3, index: 0, playing: false, paused: false, elapsed: 0, startAt: 0, frame: null, audio: null, lastSoundIndex: -1, flashes: new Map() };
let timeline = [];

function context() {
  state.audio ??= new (window.AudioContext || window.webkitAudioContext)();
  if (state.audio.state === 'suspended') state.audio.resume();
  return state.audio;
}
function sound(midi, seconds = .4) {
  const audio = context(), t = audio.currentTime;
  const osc = audio.createOscillator(), gain = audio.createGain();
  osc.type = 'triangle'; osc.frequency.value = 440 * 2 ** ((midi - 69) / 12);
  gain.gain.setValueAtTime(.0001, t);
  gain.gain.exponentialRampToValueAtTime(.18, t + .015);
  gain.gain.exponentialRampToValueAtTime(.0001, t + Math.max(.12, seconds));
  osc.connect(gain).connect(audio.destination); osc.start(t); osc.stop(t + Math.max(.12, seconds) + .03);
}
function flash(midi, ms = 300) {
  const key = keys.get(midi); if (!key) return;
  clearTimeout(state.flashes.get(midi)); key.classList.add('active');
  state.flashes.set(midi, setTimeout(() => { key.classList.remove('active'); state.flashes.delete(midi); }, ms));
}
function keyboard() {
  const el = $('keyboard'); el.replaceChildren(); keys.clear();
  const first = 60 - (state.octaves - 1) * 12, last = 71;
  let white = 0;
  for (let midi = first; midi <= last; midi++) {
    const black = isBlack(midi), key = document.createElement('button');
    key.type = 'button'; key.className = `key ${black ? 'black' : 'white'}`;
    key.style.left = `${black ? white * whiteWidth - 13 : white * whiteWidth}px`;
    key.style.width = `${black ? 26 : whiteWidth}px`;
    key.innerHTML = `<span>${NOTE_NAMES[midi % 12]}<small>${Math.floor(midi / 12) - 1}</small></span>`;
    key.setAttribute('aria-label', noteName(midi));
    key.addEventListener('pointerdown', event => { event.preventDefault(); hit(midi); });
    el.append(key); keys.set(midi, key); if (!black) white++;
  }
  el.style.width = `${white * whiteWidth}px`;
  $('range-label').textContent = `${noteName(first)} – ${noteName(last)} · ${state.octaves} octava${state.octaves > 1 ? 's' : ''}`;
  highlightTarget();
}
function speedFactor() { return Number($('tempo').value) / 100; }
function buildTimeline() {
  const beat = 60 / state.song.bpm / speedFactor(); let elapsed = 0;
  timeline = state.song.notes.map(([midi, beats]) => {
    const event = { midi, start: elapsed, duration: beats * beat };
    elapsed += event.duration; return event;
  });
  return elapsed;
}
function duration() { const last = timeline.at(-1); return last ? last.start + last.duration : 0; }
function renderNotes() {
  $('notes').replaceChildren(...state.song.notes.map(([midi], i) => {
    const note = document.createElement('span'); note.className = `note ${i === state.index ? 'current' : ''} ${i < state.index ? 'done' : ''}`;
    note.textContent = noteName(midi); return note;
  }));
  $('counter').textContent = `${Math.min(state.index, timeline.length)} / ${timeline.length}`;
  $('progress').style.width = `${timeline.length ? 100 * Math.min(state.index, timeline.length) / timeline.length : 0}%`;
  highlightTarget();
}
function highlightTarget() {
  keys.forEach(k => k.classList.remove('target'));
  if (state.mode === 'guided' && state.index < timeline.length) keys.get(timeline[state.index].midi)?.classList.add('target');
}
function renderFalling(elapsed = 0) {
  const lane = $('falling-lane'); lane.querySelectorAll('.falling-note').forEach(n => n.remove());
  const ahead = 3.4, height = lane.clientHeight || 220, first = 60 - (state.octaves - 1) * 12;
  const count = state.octaves * 7, width = lane.clientWidth / count;
  const whiteIndex = midi => { let n = 0; for (let i = first; i < midi; i++) if (!isBlack(i)) n++; return n; };
  timeline.forEach((event, i) => {
    const remaining = event.start - elapsed;
    if (remaining < -event.duration || remaining > ahead || event.midi < first || event.midi > 71) return;
    const bar = document.createElement('div'); bar.className = `falling-note ${isBlack(event.midi) ? 'sharp' : ''}`;
    const wi = whiteIndex(event.midi);
    const x = (wi + (isBlack(event.midi) ? -.32 : .07)) * width;
    const h = Math.max(20, event.duration / ahead * (height - 30));
    const bottom = 18 + remaining / ahead * (height - 36);
    bar.style.left = `${x}px`; bar.style.width = `${width * (isBlack(event.midi) ? .65 : .86)}px`;
    bar.style.height = `${h}px`; bar.style.bottom = `${bottom}px`;
    bar.textContent = noteName(event.midi); bar.dataset.index = String(i); lane.append(bar);
  });
}
function updateButtons() {
  $('play').textContent = state.playing && !state.paused ? '▶ Reproduciendo' : state.paused ? '▶ Continuar' : '▶ Reproducir';
  $('pause').disabled = !state.playing || state.paused || state.mode === 'guided';
}
function stop(reset = true) {
  cancelAnimationFrame(state.frame); state.frame = null;
  state.playing = false; state.paused = false;
  if (reset) { state.index = 0; state.elapsed = 0; state.lastSoundIndex = -1; }
  updateButtons(); renderNotes(); renderFalling(state.elapsed);
}
function tick(now) {
  if (!state.playing || state.paused || state.mode !== 'falling') return;
  state.elapsed = (now - state.startAt) / 1000;
  let i = 0;
  while (i < timeline.length && timeline[i].start <= state.elapsed) i++;
  if (i - 1 > state.lastSoundIndex) {
    for (let j = state.lastSoundIndex + 1; j < i; j++) {
      const event = timeline[j]; sound(event.midi, event.duration * .86); flash(event.midi, event.duration * 860);
      $('status').textContent = `Escucha ${noteName(event.midi)} · nota ${j + 1} de ${timeline.length}`;
    }
    state.lastSoundIndex = i - 1;
  }
  if (state.index !== i) { state.index = i; renderNotes(); }
  renderFalling(state.elapsed);
  if (state.elapsed >= duration()) { stop(false); state.index = timeline.length; renderNotes(); $('status').textContent = '🎉 ¡Melodía terminada! Puedes repetirla o practicar paso a paso.'; return; }
  state.frame = requestAnimationFrame(tick);
}
function play() {
  context();
  if (state.mode === 'guided') {
    if (state.index >= timeline.length) state.index = 0;
    $('status').textContent = `Toca la tecla iluminada: ${noteName(timeline[state.index].midi)}`;
    renderNotes(); return;
  }
  if (state.playing && !state.paused) return;
  if (state.elapsed >= duration()) { state.elapsed = 0; state.index = 0; state.lastSoundIndex = -1; }
  state.playing = true; state.paused = false; state.startAt = performance.now() - state.elapsed * 1000;
  updateButtons(); state.frame = requestAnimationFrame(tick);
}
function pause() {
  if (!state.playing || state.paused) return;
  state.paused = true; cancelAnimationFrame(state.frame); updateButtons(); $('status').textContent = 'Reproducción pausada.';
}
function hit(midi) {
  sound(midi); flash(midi);
  if (state.mode !== 'guided' || state.index >= timeline.length) return;
  const expected = timeline[state.index].midi;
  if (midi !== expected) { $('status').textContent = `Prueba otra vez: busca ${noteName(expected)}.`; return; }
  state.index++; renderNotes();
  if (state.index >= timeline.length) $('status').textContent = '🎉 ¡Excelente! Has completado toda la canción.';
  else $('status').textContent = `¡Muy bien! Ahora toca ${noteName(timeline[state.index].midi)}.`;
}
function changeMode(mode) {
  stop(); state.mode = mode;
  const guided = mode === 'guided';
  $('guided-mode').classList.toggle('selected', guided); $('falling-mode').classList.toggle('selected', !guided);
  $('guided-mode').setAttribute('aria-pressed', String(guided)); $('falling-mode').setAttribute('aria-pressed', String(!guided));
  $('mode-description').textContent = guided ? 'TOCA CADA TECLA ILUMINADA PARA AVANZAR' : 'OBSERVA LAS NOTAS Y ESCUCHA LA MELODÍA';
  $('visualizer').hidden = guided;
  $('status').textContent = guided ? `Comienza tocando ${noteName(timeline[0].midi)}.` : 'Pulsa reproducir para ver las notas descendentes.';
  updateButtons(); renderNotes();
}
function selectSong() {
  stop(); state.song = songs.find(s => s.id === $('song').value) ?? songs[0];
  buildTimeline(); $('title').textContent = state.song.title;
  state.index = 0; state.elapsed = 0; state.lastSoundIndex = -1;
  // Show the full song range when possible (one to three octaves).
  const min = Math.min(...state.song.notes.map(n => n[0]));
  const required = Math.min(3, Math.max(1, Math.ceil((72 - min) / 12)));
  if (required > state.octaves) { state.octaves = required; $('octaves').value = String(required); keyboard(); }
  renderNotes(); renderFalling();
  $('status').textContent = state.mode === 'guided' ? `Comienza tocando ${noteName(timeline[0].midi)}.` : 'Pulsa reproducir para empezar.';
}
$('song').replaceChildren(...songs.map(song => { const option = document.createElement('option'); option.value = song.id; option.textContent = song.title; return option; }));
$('song').addEventListener('change', selectSong);
$('tempo').addEventListener('input', () => { $('speed').textContent = `${$('tempo').value}%`; stop(); buildTimeline(); renderNotes(); renderFalling(); });
$('octaves').addEventListener('change', () => { stop(); state.octaves = Number($('octaves').value); keyboard(); renderFalling(); });
$('play').addEventListener('click', play); $('pause').addEventListener('click', pause);
$('stop').addEventListener('click', () => { stop(); $('status').textContent = 'Detenido. Listo para volver a empezar.'; });
$('restart').addEventListener('click', () => { stop(); if (state.mode === 'falling') play(); else $('status').textContent = `Empieza con ${noteName(timeline[0].midi)}.`; });
$('falling-mode').addEventListener('click', () => changeMode('falling'));
$('guided-mode').addEventListener('click', () => changeMode('guided'));
const keyboardMap = { a:60, s:62, d:64, f:65, g:67, h:69, j:71 };
document.addEventListener('keydown', event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey || ['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)) return;
  const midi = keyboardMap[event.key.toLowerCase()]; if (midi !== undefined) hit(midi);
});
window.addEventListener('resize', () => renderFalling(state.elapsed));
keyboard(); selectSong(); changeMode('falling');
