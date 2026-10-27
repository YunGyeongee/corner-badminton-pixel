import { describe, expect, it } from 'vitest';
import { InputManager } from '../src/game/InputManager';

function key(type: 'keydown' | 'keyup', code: string, extra: { repeat?: boolean; metaKey?: boolean } = {}): Event {
  return Object.assign(new Event(type, { cancelable: true }), { code, repeat: false, metaKey: false, ctrlKey: false, ...extra });
}

function setup() {
  const target = new EventTarget();
  const input = new InputManager(target);
  input.attach();
  return { target, input };
}

describe('InputManager', () => {
  it('maps held keys to movement', () => {
    const { target, input } = setup();
    target.dispatchEvent(key('keydown', 'KeyD'));
    expect(input.playerIntent().move).toBe(1);
    target.dispatchEvent(key('keydown', 'KeyA'));
    expect(input.playerIntent().move).toBe(0);
    target.dispatchEvent(key('keyup', 'KeyD'));
    expect(input.playerIntent().move).toBe(-1);
  });

  it('reports a swing once per press and ignores key repeat', () => {
    const { target, input } = setup();
    target.dispatchEvent(key('keydown', 'Space'));
    expect(input.playerIntent().swing).toBe(true);
    expect(input.playerIntent().swing).toBe(false);
    target.dispatchEvent(key('keydown', 'Space', { repeat: true }));
    expect(input.playerIntent().swing).toBe(false);
  });

  it('drops unconsumed presses at the end of the frame', () => {
    const { target, input } = setup();
    target.dispatchEvent(key('keydown', 'Space'));
    input.endFrame();
    expect(input.consumePressed('swing')).toBe(false);
  });

  it('releases every key when the window loses focus', () => {
    const { target, input } = setup();
    target.dispatchEvent(key('keydown', 'KeyA'));
    target.dispatchEvent(key('keydown', 'KeyW'));
    target.dispatchEvent(new Event('blur'));
    expect(input.isDown('left')).toBe(false);
    expect(input.playerIntent()).toEqual({ move: 0, jump: false, swing: false });
  });

  it('prevents the default action for bound keys only', () => {
    const { target } = setup();
    const bound = key('keydown', 'Space');
    const unbound = key('keydown', 'KeyQ');
    target.dispatchEvent(bound);
    target.dispatchEvent(unbound);
    expect(bound.defaultPrevented).toBe(true);
    expect(unbound.defaultPrevented).toBe(false);
  });

  it('leaves system shortcuts alone', () => {
    const { target, input } = setup();
    target.dispatchEvent(key('keydown', 'KeyW', { metaKey: true }));
    expect(input.isDown('jump')).toBe(false);
  });

  it('supports custom bindings', () => {
    const target = new EventTarget();
    const input = new InputManager(target, {
      left: ['KeyJ'], right: ['KeyL'], jump: ['KeyI'], swing: ['KeyK'],
      pause: ['KeyP'], up: ['KeyI'], down: ['KeyM'], confirm: ['Enter'],
    });
    input.attach();
    target.dispatchEvent(key('keydown', 'KeyJ'));
    target.dispatchEvent(key('keydown', 'KeyK'));
    expect(input.playerIntent()).toEqual({ move: -1, jump: false, swing: true });
    input.detach();
    target.dispatchEvent(key('keydown', 'KeyL'));
    expect(input.isDown('right')).toBe(false);
  });
});
