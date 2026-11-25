// Sizzle & Serve — staged screenshot scenes for ?shot=<name>&seed=<n>.
// One job: build a deterministic, frozen game state per scene so each
// screenshot is a stable render of the game's own code.

import { RECIPES, SHIFT_SECONDS } from './config.js';

function makeTicket(recipeId, timeLeft, total, done) {
  const recipe = RECIPES.find((r) => r.id === recipeId);
  return { id: Math.floor(Math.random() * 10000), recipe, timeLeft, total, done: !!done };
}

function baseOrders() {
  return {
    active: [],
    spawnIn: 99,
    served: 0,
    expired: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    elapsed: 0,
  };
}

// Set up `state` (the same object main.js renders) for a named shot.
// Gameplay is frozen afterwards: main.js skips updates in shot mode.
export function setupShot(state, name, seed) {
  const { player, kitchen, orders } = state;
  state.mode = 'shot';
  state.time = 1.2;
  state.shake = 0;
  state.particles = [];
  state.floaters = [];
  state.nearStation = null;

  // A mid-shift clock so the timer reads as live pressure.
  orders.elapsed = 62;

  if (name === 'kitchen') {
    Object.assign(orders, baseOrders(), {
      elapsed: 24,
      coins: 18,
      combo: 2,
      bestCombo: 2,
      active: [
        makeTicket('ember-burger', 38, 50, false),
        makeTicket('rice-bowl', 22, 48, false),
      ],
    });
    player.x = 300;
    player.y = 320;
    player.facing = 1;
    player.carrying = null;
    kitchen.burners = [null, null];
    kitchen.plate = [];
    kitchen.chopProgress = 0;
    kitchen.choppingItem = null;
  } else if (name === 'chopping') {
    Object.assign(orders, baseOrders(), {
      elapsed: 48,
      coins: 32,
      combo: 3,
      bestCombo: 3,
      active: [
        makeTicket('garden-crunch', 9, 46, false),
        makeTicket('ember-burger', 31, 50, false),
      ],
    });
    player.x = 750;
    player.y = 300;
    player.facing = -1;
    player.carrying = 'tomato';
    kitchen.burners = [null, null];
    kitchen.plate = ['lettuce_chopped'];
    kitchen.chopProgress = 0.55;
    kitchen.choppingItem = 'tomato';
    // Flying chop bits, frozen mid-air.
    state.particles = [
      { x: 700, y: 160, size: 4, color: '#dc2626', life: 0.6, maxLife: 0.8 },
      { x: 760, y: 150, size: 3, color: '#fca5a5', life: 0.5, maxLife: 0.8 },
      { x: 730, y: 140, size: 4, color: '#dc2626', life: 0.7, maxLife: 0.8 },
      { x: 780, y: 170, size: 3, color: '#16a34a', life: 0.4, maxLife: 0.8 },
    ];
  } else if (name === 'assembly') {
    Object.assign(orders, baseOrders(), {
      elapsed: 74,
      coins: 46,
      combo: 4,
      bestCombo: 4,
      active: [
        makeTicket('ember-burger', 27, 44, false),
        makeTicket('garden-crunch', 18, 42, false),
      ],
    });
    player.x = 500;
    player.y = 580;
    player.facing = 1;
    player.carrying = 'lettuce_chopped';
    kitchen.burners = [
      { item: 'patty', cookLeft: 0, burnLeft: 3, state: 'done' },
      null,
    ];
    // Burger mid-assembly: bun + cooked patty on the plate, lettuce in hand.
    kitchen.plate = ['bun', 'patty_cooked'];
    kitchen.chopProgress = 0;
    kitchen.choppingItem = null;
  } else if (name === 'serve') {
    Object.assign(orders, baseOrders(), {
      elapsed: 96,
      coins: 64,
      combo: 5,
      bestCombo: 5,
      active: [
        makeTicket('ember-burger', 30, 44, true),
        makeTicket('rice-bowl', 24, 42, false),
      ],
    });
    player.x = 1080;
    player.y = 560;
    player.facing = 1;
    player.carrying = null;
    kitchen.burners = [null, null];
    kitchen.plate = [];
    kitchen.chopProgress = 0;
    kitchen.choppingItem = null;
    // Finished plate on the pass + the "+$18" float + DONE ticket above.
    state.servePlate = 'ember-burger';
    state.floaters = [
      { x: 1120, y: 380, text: '+$18', color: '#16a34a', life: 1.4, maxLife: 1.6 },
    ];
    state.particles = [
      { x: 1080, y: 420, size: 4, color: '#f59e0b', life: 0.7, maxLife: 0.9 },
      { x: 1150, y: 410, size: 3, color: '#fde68a', life: 0.6, maxLife: 0.9 },
      { x: 1120, y: 440, size: 4, color: '#f59e0b', life: 0.5, maxLife: 0.9 },
    ];
  } else {
    // Unknown shot name: fall back to the plain kitchen scene.
    setupShot(state, 'kitchen', seed);
  }
  return state;
}
