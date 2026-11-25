// Sizzle & Serve — game loop, state machine (title / playing / game-over),
// wiring, deterministic seeded RNG for shots. One job: run the game.

import { VIEW_W, VIEW_H, SHIFT_SECONDS, STATIONS, mulberry32 } from './config.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { createPlayer, updatePlayer, resetPlayer, nearestStation } from './player.js';
import { createKitchen, resetKitchen, updateKitchen, updateChopping, interact } from './kitchen.js';
import { createOrders, updateOrders, serveDish, resetOrders } from './orders.js';
import { render } from './render.js';
import { setupShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput(canvas);
const audio = createAudio();
const player = createPlayer();
const kitchen = createKitchen();
const orders = createOrders();
orders.elapsed = 0;

const state = {
  mode: 'title', // 'title' | 'playing' | 'over' | 'shot'
  player,
  kitchen,
  orders,
  particles: [],
  floaters: [],
  time: 0,
  shake: 0,
  nearStation: null,
  servePlate: null,
};

let elapsed = 0;
let lastTickSecond = -1;
let rng = mulberry32(20261125);

function addFloater(x, y, text, color) {
  state.floaters.push({ x, y, text, color: color || '#16a34a', life: 1.6, maxLife: 1.6 });
}

function burst(x, y, color, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = (speed || 60) * (0.5 + Math.random() * 0.5);
    state.particles.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v - 30,
      size: 2 + Math.random() * 3,
      color,
      life: 0.7,
      maxLife: 0.7,
    });
  }
}

function handleKitchenEvents(events) {
  for (const ev of events) {
    if (ev.type === 'pickup') {
      audio.pickup();
    } else if (ev.type === 'cook-start') {
      audio.sizzle();
      const bx = STATIONS.stove.x + 28 + ev.burner * 100;
      burst(bx, STATIONS.stove.y + 40, '#f97316', 8, 40);
    } else if (ev.type === 'cooked') {
      audio.ding();
    } else if (ev.type === 'burnt') {
      audio.burn();
      state.shake = 8;
      const bx = STATIONS.stove.x + 28 + ev.burner * 100;
      burst(bx, STATIONS.stove.y + 30, '#57534e', 14, 70);
      addFloater(bx, STATIONS.stove.y - 10, 'BURNT!', '#dc2626');
    } else if (ev.type === 'chopped') {
      audio.chop();
      burst(player.x, player.y - 40, '#dc2626', 10, 80);
    } else if (ev.type === 'chopbit') {
      burst(STATIONS.board.x + STATIONS.board.w / 2, STATIONS.board.y + 30, '#dc2626', 1, 50);
    } else if (ev.type === 'plated') {
      audio.putdown();
    } else if (ev.type === 'pickup-dish') {
      audio.pickup();
    } else if (ev.type === 'binned') {
      audio.putdown();
    } else if (ev.type === 'serve-attempt') {
      const result = serveDish(orders, ev.dish, []);
      if (result.matched) {
        audio.serve();
        addFloater(STATIONS.pass.x + STATIONS.pass.w / 2, STATIONS.pass.y - 14, `+$${result.paid}`, '#16a34a');
        burst(STATIONS.pass.x + STATIONS.pass.w / 2, STATIONS.pass.y + 40, '#f59e0b', 16, 90);
      } else {
        audio.error();
        addFloater(STATIONS.pass.x + STATIONS.pass.w / 2, STATIONS.pass.y - 14, 'WRONG ORDER  -$3', '#dc2626');
      }
    } else if (ev.type === 'expire') {
      audio.expire();
      addFloater(400, 60, 'ORDER EXPIRED  -$3', '#dc2626');
    } else if (ev.type === 'wrong') {
      audio.error();
    }
  }
}

function startShift() {
  resetPlayer(player);
  resetKitchen(kitchen);
  resetOrders(orders);
  orders.elapsed = 0;
  elapsed = 0;
  lastTickSecond = -1;
  state.particles = [];
  state.floaters = [];
  state.servePlate = null;
  state.shake = 0;
  state.mode = 'playing';
  audio.unlock();
  audio.click();
  rng = mulberry32((Date.now() % 100000) + 7);
}

function updatePlaying(dt) {
  elapsed += dt;
  orders.elapsed = elapsed;

  // Shift clock ticks.
  const whole = Math.floor(SHIFT_SECONDS - elapsed);
  if (whole !== lastTickSecond) {
    lastTickSecond = whole;
    if (whole <= 10 && whole > 0) audio.tick();
  }

  updatePlayer(player, input, dt);

  const station = nearestStation(player);
  state.nearStation = station;

  // Hold-to-chop at the board.
  if (station && station.kind === 'board') {
    const evs = [];
    updateChopping(kitchen, player, input.interactHeld, dt, evs);
    handleKitchenEvents(evs);
  } else {
    kitchen.chopProgress = 0;
    kitchen.choppingItem = null;
  }

  // Stove timers.
  const kev = [];
  updateKitchen(kitchen, dt, kev);
  handleKitchenEvents(kev);

  // Orders spawn + tick.
  const oev = [];
  updateOrders(orders, dt, elapsed, rng, oev);
  handleKitchenEvents(oev);

  // One E press = one interaction (not while chopping).
  if (input.interactPressed && !(station && station.kind === 'board')) {
    audio.unlock();
    const evs = [];
    const result = interact(kitchen, player, station, orders, evs);
    if (result === 'hands-full' || result === 'not-cookable' || result === 'no-burner'
      || result === 'already-on-plate' || result === 'burnt-no-plate' || result === 'no-dish') {
      audio.error();
    }
    handleKitchenEvents(evs);
  }

  // Particles + floaters age.
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.life -= dt;
    p.x += (p.vx || 0) * dt;
    p.y += (p.vy || 0) * dt;
    p.vy = (p.vy || 0) + 120 * dt;
    if (p.life <= 0) state.particles.splice(i, 1);
  }
  for (let i = state.floaters.length - 1; i >= 0; i--) {
    const f = state.floaters[i];
    f.life -= dt;
    if (f.life <= 0) state.floaters.splice(i, 1);
  }
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt * 30);

  // Shift over?
  if (elapsed >= SHIFT_SECONDS) {
    state.mode = 'over';
    audio.ding();
  }
}

function updateTitle() {
  if (input.confirmPressed || input.clicked) {
    const bx = (VIEW_W - 260) / 2;
    const by = 570;
    const inButton = input.clicked
      && input.clickX >= bx && input.clickX <= bx + 260
      && input.clickY >= by && input.clickY <= by + 58;
    if (input.confirmPressed || inButton) startShift();
  }
}

function updateOver() {
  if (input.restartPressed || input.clicked) startShift();
}

let lastTime = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  state.time += dt;

  if (state.mode === 'title') updateTitle();
  else if (state.mode === 'playing') updatePlaying(dt);
  else if (state.mode === 'over') updateOver();
  // 'shot' mode: frozen — render only, no updates.

  render(ctx, state);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Staged screenshot mode: ?shot=<name>&seed=<n> freezes a deterministic scene.
const params = new URLSearchParams(window.location.search);
const shotName = params.get('shot');
if (shotName) {
  const seed = parseInt(params.get('seed') || '1', 10) || 1;
  rng = mulberry32(seed);
  setupShot(state, shotName, seed);
  // Render one frozen frame immediately, then keep re-rendering it so the
  // screenshot is stable even if the compositor asks again.
  render(ctx, state);
  document.title = `Sizzle & Serve — shot: ${shotName}`;
}

// Debug hook for automated playtests (read-only state inspection).
window.__sizzle = state;

requestAnimationFrame(frame);
