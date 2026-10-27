import './styles/main.css';
import { AIController, DIFFICULTIES } from './game/AIController';
import { Game } from './game/Game';
import { GameLoop } from './game/GameLoop';
import { DEFAULT_BINDINGS, InputManager } from './game/InputManager';
import { Renderer } from './rendering/Renderer';
import { drawHUD } from './ui/GameHUD';
import { Menu, type MenuAction } from './ui/Menu';

const api = window.cornerApi;

function element<T extends HTMLElement>(selector: string): T {
  const found = document.querySelector<T>(selector);
  if (!found) throw new Error(`Missing element ${selector}`);
  return found;
}

const canvas = element<HTMLCanvasElement>('#game');
const stage = element<HTMLElement>('#stage');
const pinButton = element<HTMLButtonElement>('#btn-pin');
const pauseButton = element<HTMLButtonElement>('#btn-pause');
const minimizeButton = element<HTMLButtonElement>('#btn-min');
const closeButton = element<HTMLButtonElement>('#btn-close');

const game = new Game();
const ai = new AIController('right', 'normal');
const renderer = new Renderer(canvas);
let pinned = true;
let clock = 0;
let frameDt = 0;

const menu = new Menu([
  { action: 'resume', label: () => 'RESUME' },
  { action: 'restart', label: () => 'RESTART' },
  { action: 'level', label: () => `LEVEL: ${ai.difficulty.toUpperCase()}` },
  ...(api ? [{ action: 'pin' as const, label: () => `ON TOP: ${pinned ? 'ON' : 'OFF'}` }] : []),
  { action: 'quit', label: () => 'QUIT' },
]);

const loop = new GameLoop({ update, render, maxFps: 60 });
// Any key wakes the loop, which sleeps while the pause menu is open.
const input = new InputManager(window, DEFAULT_BINDINGS, () => loop.start());

function update(dt: number): void {
  frameDt = menu.open ? 0 : dt;
  clock += dt;

  if (input.consumePressed('pause')) {
    if (menu.open) resume();
    else pause();
  } else if (menu.open) {
    if (input.consumePressed('up')) menu.move(-1);
    if (input.consumePressed('down')) menu.move(1);
    if (input.consumePressed('confirm')) activate(menu.current);
  } else if (game.phase === 'gameover' && input.consumePressed('confirm')) {
    restart();
  } else {
    game.update(dt, { left: input.playerIntent(), right: ai.getIntent(game, dt) });
  }
  renderer.addEvents(game.drainEvents());
  input.endFrame();

  // Nothing moves while paused, so stop rendering until there is input.
  if (menu.open) loop.stop();
}

function render(): void {
  renderer.render(game, frameDt, (ctx) => {
    drawHUD(ctx, game, clock);
    if (menu.open) menu.draw(ctx);
  });
}

function pause(): void {
  if (menu.open) return;
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
    case 'level':
      ai.difficulty = DIFFICULTIES[(DIFFICULTIES.indexOf(ai.difficulty) + 1) % DIFFICULTIES.length];
      render();
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

function quit(): void {
  loop.stop();
  if (api) api.close();
  else window.close();
}

// Mouse: menu items and "click to play again".
canvas.addEventListener('click', (event) => {
  const point = renderer.toWorld(event.clientX, event.clientY);
  if (menu.open) {
    const index = menu.hitTest(point);
    if (index < 0) return;
    menu.selected = index;
    activate(menu.current);
  } else if (game.phase === 'gameover') {
    restart();
  }
});

canvas.addEventListener('pointermove', (event) => {
  if (!menu.open) return;
  const index = menu.hitTest(renderer.toWorld(event.clientX, event.clientY));
  if (index >= 0 && index !== menu.selected) {
    menu.selected = index;
    render();
  }
});

// Title bar buttons. Prevent focus so Space doesn't "click" them again.
for (const button of [pinButton, pauseButton, minimizeButton, closeButton]) {
  button.addEventListener('mousedown', (event) => event.preventDefault());
}
pinButton.addEventListener('click', () => void togglePin());
pauseButton.addEventListener('click', () => (menu.open ? resume() : pause()));
minimizeButton.addEventListener('click', () => api?.minimize());
closeButton.addEventListener('click', quit);
if (!api) {
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
if (api) {
  void api.isAlwaysOnTop().then((value) => {
    pinned = value;
    pinButton.classList.toggle('active', pinned);
  });
}
loop.start();
