import './styles/main.css';
import { AIController, DIFFICULTIES } from './game/AIController';
import { Game } from './game/Game';
import { GameLoop } from './game/GameLoop';
import { DEFAULT_BINDINGS, InputManager } from './game/InputManager';
import { Renderer } from './rendering/Renderer';
import { CPU_CHARACTER, type CharacterId } from './rendering/PixelAssets';
import { drawHUD } from './ui/GameHUD';
import { loadCharacter, saveCharacter, stepCharacter } from './ui/CharacterChoice';
import { CharacterSelect } from './ui/CharacterSelect';
import { Menu, type MenuAction } from './ui/Menu';
import { loadOpacity, loadShowBackground, nextOpacity, opacityLabel, saveOpacity, saveShowBackground } from './ui/Transparency';

const api = window.cornerApi;

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element ${selector}`);
  return found;
}

const canvas = element<HTMLCanvasElement>('#game');
const stage = element<HTMLElement>('#stage');
const backgroundButton = element<HTMLButtonElement>('#btn-bg');
const fadeButton = element<HTMLButtonElement>('#btn-fade');
const pinButton = element<HTMLButtonElement>('#btn-pin');
const pauseButton = element<HTMLButtonElement>('#btn-pause');
const minimizeButton = element<HTMLButtonElement>('#btn-min');
const closeButton = element<HTMLButtonElement>('#btn-close');

const game = new Game();
const ai = new AIController('right', 'normal');
const renderer = new Renderer(canvas);
let pinned = true;
let opacity = loadOpacity();
let showBackground = loadShowBackground();
let character = loadCharacter();
renderer.characters = { left: character, right: CPU_CHARACTER };
let clock = 0;
let frameDt = 0;

const menu = new Menu([
  { action: 'resume', label: () => 'RESUME' },
  { action: 'restart', label: () => 'RESTART' },
  { action: 'character', label: () => `CHARACTER: ${character.toUpperCase()}` },
  { action: 'level', label: () => `LEVEL: ${ai.difficulty.toUpperCase()}` },
  { action: 'background', label: () => `BACKGROUND: ${showBackground ? 'ON' : 'OFF'}` },
  ...(api
    ? [
        { action: 'opacity' as const, label: () => `SEE-THROUGH: ${opacityLabel(opacity)}` },
        { action: 'pin' as const, label: () => `ON TOP: ${pinned ? 'ON' : 'OFF'}` },
      ]
    : []),
  { action: 'quit', label: () => 'QUIT' },
]);

// The game opens on the character picker.
const select = new CharacterSelect();
select.show(character);

const loop = new GameLoop({ update, render, maxFps: 60 });
// Any key wakes the loop, which sleeps while the pause menu is open.
const input = new InputManager(window, DEFAULT_BINDINGS, () => loop.start());

function update(dt: number): void {
  frameDt = menu.open || select.open ? 0 : dt;
  clock += dt;

  // See-through and the background switch work with or without the menu open.
  if (input.consumePressed('opacity')) cycleOpacity();
  if (input.consumePressed('background')) setShowBackground(!showBackground);
  if (select.open) {
    updateSelect();
  } else if (input.consumePressed('pause')) {
    if (menu.open) resume();
    else pause();
  } else if (menu.open) {
    if (input.consumePressed('up')) menu.move(-1);
    if (input.consumePressed('down')) menu.move(1);
    if (input.consumePressed('confirm')) activate(menu.current);
    if (menu.current === 'character') {
      if (input.consumePressed('left')) changeCharacter(-1);
      if (input.consumePressed('right')) changeCharacter(1);
    }
  } else if (game.phase === 'gameover' && input.consumePressed('confirm')) {
    restart();
  } else {
    game.update(dt, { left: input.playerIntent(), right: ai.getIntent(game, dt) });
  }
  renderer.addEvents(game.drainEvents());
  input.endFrame();

  // Nothing moves while paused, so stop rendering until there is input.
  if (menu.open || select.open) loop.stop();
}

function updateSelect(): void {
  // Esc goes back to the pause menu; at launch there is nothing to go back to.
  if (input.consumePressed('pause') && menu.open) select.hide();
  if (input.consumePressed('left')) select.move(-1);
  if (input.consumePressed('right')) select.move(1);
  if (input.consumePressed('up')) select.moveRow(-1);
  if (input.consumePressed('down')) select.moveRow(1);
  if (input.consumePressed('confirm')) chooseCharacter(select.current);
}

/** Picked from the character screen: back to the pause menu, or into the game at launch. */
function chooseCharacter(id: CharacterId): void {
  setCharacter(id);
  select.hide();
  input.clear();
  render();
}

function render(): void {
  renderer.render(game, frameDt, (ctx) => {
    if (select.open) {
      select.draw(ctx);
      return;
    }
    drawHUD(ctx, game, clock);
    if (menu.open) menu.draw(ctx);
  });
}

function pause(): void {
  if (menu.open || select.open) return;
  game.paused = true;
  menu.show();
  input.clear();
  pauseButton.classList.add('active');
  render();
}

function resume(): void {
  game.paused = false;
  menu.hide();
  pauseButton.classList.remove('active');
  loop.start();
}

function restart(): void {
  game.restart();
  ai.reset();
  renderer.effects.clear();
  resume();
}

function activate(action: MenuAction): void {
  switch (action) {
    case 'resume':
      resume();
      break;
    case 'restart':
      restart();
      break;
    case 'character':
      select.show(character);
      render();
      break;
    case 'level':
      ai.difficulty = DIFFICULTIES[(DIFFICULTIES.indexOf(ai.difficulty) + 1) % DIFFICULTIES.length];
      render();
      break;
    case 'opacity':
      cycleOpacity();
      break;
    case 'background':
      setShowBackground(!showBackground);
      break;
    case 'pin':
      void togglePin();
      break;
    case 'quit':
      quit();
      break;
  }
}

async function togglePin(): Promise<void> {
  if (!api) return;
  pinned = await api.setAlwaysOnTop(!pinned);
  pinButton.classList.toggle('active', pinned);
  render();
}

function changeCharacter(delta: number): void {
  setCharacter(stepCharacter(character, delta));
  render();
}

function setCharacter(id: CharacterId): void {
  character = id;
  saveCharacter(id);
  renderer.characters.left = id;
}

/** Off leaves only the court, the net and the players over the desktop. */
function setShowBackground(show: boolean): void {
  showBackground = show;
  saveShowBackground(show);
  renderer.showBackground = show;
  document.body.classList.toggle('clear', !show);
  backgroundButton.classList.toggle('active', show);
  render();
}

function cycleOpacity(): void {
  void applyOpacity(nextOpacity(opacity));
}

async function applyOpacity(value: number): Promise<void> {
  if (!api) return;
  opacity = value;
  saveOpacity(value);
  await api.setOpacity(value);
  fadeButton.textContent = opacityLabel(value);
  fadeButton.classList.toggle('active', value < 1);
  render();
}

function quit(): void {
  loop.stop();
  if (api) api.close();
  else window.close();
}

// Mouse: the character screen, menu items and "click to play again".
canvas.addEventListener('click', (event) => {
  const point = renderer.toWorld(event.clientX, event.clientY);
  if (select.open) {
    const index = select.hitTest(point);
    if (index < 0) return;
    select.selected = index;
    chooseCharacter(select.current);
  } else if (menu.open) {
    const index = menu.hitTest(point);
    if (index < 0) return;
    menu.selected = index;
    activate(menu.current);
  } else if (game.phase === 'gameover') {
    restart();
  }
});

canvas.addEventListener('pointermove', (event) => {
  const point = renderer.toWorld(event.clientX, event.clientY);
  if (select.open) {
    const index = select.hitTest(point);
    if (index >= 0 && index !== select.selected) {
      select.selected = index;
      render();
    }
    return;
  }
  if (!menu.open) return;
  const index = menu.hitTest(point);
  if (index >= 0 && index !== menu.selected) {
    menu.selected = index;
    render();
  }
});

// Title bar buttons. Prevent focus so Space doesn't "click" them again.
for (const button of [backgroundButton, fadeButton, pinButton, pauseButton, minimizeButton, closeButton]) {
  button.addEventListener('mousedown', (event) => event.preventDefault());
}
backgroundButton.addEventListener('click', () => setShowBackground(!showBackground));
fadeButton.addEventListener('click', cycleOpacity);
pinButton.addEventListener('click', () => void togglePin());
pauseButton.addEventListener('click', () => {
  if (select.open) return;
  if (menu.open) resume();
  else pause();
});
minimizeButton.addEventListener('click', () => api?.minimize());
closeButton.addEventListener('click', quit);
if (!api) {
  fadeButton.hidden = true;
  pinButton.hidden = true;
  minimizeButton.hidden = true;
}

// Losing focus pauses an active game; the input manager also drops held keys.
window.addEventListener('blur', () => {
  if (game.phase === 'serve' || game.phase === 'rally') pause();
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) loop.stop();
  else loop.start();
});

new ResizeObserver(() => {
  renderer.resize();
  render();
}).observe(stage);

input.attach();
setShowBackground(showBackground);
if (api) {
  void applyOpacity(opacity);
  void api.isAlwaysOnTop().then((value) => {
    pinned = value;
    pinButton.classList.toggle('active', pinned);
  });
}
loop.start();
