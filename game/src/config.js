// Sizzle & Serve — constants, recipes, station layout, colours, timings.
// One job: every tunable number and name in the game lives here.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export const SHIFT_SECONDS = 150;

export const COLORS = {
  floor: '#e8b07d',
  floorTile: '#dfa26e',
  wall: '#f7ead7',
  board: '#0f766e',
  boardDark: '#0b5e57',
  counterWood: '#a16207',
  counterTop: '#d9a05b',
  counterEdge: '#7c4a12',
  cream: '#fff7e6',
  ink: '#292524',
  muted: '#78716c',
  red: '#dc2626',
  green: '#16a34a',
  gold: '#f59e0b',
  teal: '#14b8a6',
};

export const RECIPES = [
  {
    id: 'rice-bowl',
    name: 'Sunny Rice Bowl',
    base: 14,
    needs: ['rice', 'egg_cooked', 'tomato_chopped'],
    blurb: 'rice + fried egg + chopped tomato',
  },
  {
    id: 'ember-burger',
    name: 'Ember Burger',
    base: 18,
    needs: ['bun', 'patty_cooked', 'lettuce_chopped'],
    blurb: 'bun + cooked patty + chopped lettuce',
  },
  {
    id: 'garden-crunch',
    name: 'Garden Crunch',
    base: 12,
    needs: ['lettuce_chopped', 'tomato_chopped'],
    blurb: 'chopped lettuce + chopped tomato',
  },
];

export const ITEMS = {
  tomato: { label: 'Tomato', raw: true, choppable: true },
  lettuce: { label: 'Lettuce', raw: true, choppable: true },
  patty: { label: 'Patty', raw: true, cookable: true, cookTime: 6 },
  bun: { label: 'Bun', raw: true },
  rice: { label: 'Rice', raw: true },
  egg: { label: 'Egg', raw: true, cookable: true, cookTime: 5 },
  tomato_chopped: { label: 'Chopped Tomato', chopped: true },
  lettuce_chopped: { label: 'Chopped Lettuce', chopped: true },
  patty_cooked: { label: 'Cooked Patty', cooked: true },
  egg_cooked: { label: 'Fried Egg', cooked: true },
  burnt: { label: 'Burnt!', burnt: true },
};

export const DISH_LABELS = {
  'rice-bowl': 'Sunny Rice Bowl',
  'ember-burger': 'Ember Burger',
  'garden-crunch': 'Garden Crunch',
};

// Station rectangles in kitchen coordinates (y starts below the order board).
export const STATIONS = {
  crates: [
    { id: 'crate-tomato', item: 'tomato', x: 40, y: 132, w: 92, h: 78 },
    { id: 'crate-lettuce', item: 'lettuce', x: 140, y: 132, w: 92, h: 78 },
    { id: 'crate-patty', item: 'patty', x: 240, y: 132, w: 92, h: 78 },
    { id: 'crate-bun', item: 'bun', x: 340, y: 132, w: 92, h: 78 },
    { id: 'crate-rice', item: 'rice', x: 440, y: 132, w: 92, h: 78 },
    { id: 'crate-egg', item: 'egg', x: 540, y: 132, w: 92, h: 78 },
  ],
  board: { id: 'board', x: 680, y: 132, w: 140, h: 78 },
  stove: { id: 'stove', x: 860, y: 132, w: 220, h: 78 },
  assembly: { id: 'assembly', x: 420, y: 400, w: 440, h: 80 },
  pass: { id: 'pass', x: 1000, y: 400, w: 240, h: 80 },
  bin: { id: 'bin', x: 1120, y: 600, w: 100, h: 90 },
  sink: { id: 'sink', x: 1120, y: 132, w: 120, h: 78 },
  fridge: { id: 'fridge', x: 40, y: 600, w: 140, h: 100 },
};

export const CHOP_SECONDS = 1.4;
export const BURN_GRACE_SECONDS = 4;
export const PLAYER_SPEED = 265;
export const PLAYER_RADIUS = 22;
export const INTERACT_RANGE = 78;

export function recipeById(id) {
  return RECIPES.find((r) => r.id === id);
}

export function recipeForPlate(plateItems) {
  const sorted = [...plateItems].sort();
  for (const r of RECIPES) {
    const needs = [...r.needs].sort();
    if (needs.length === sorted.length && needs.every((n, i) => n === sorted[i])) return r;
  }
  return null;
}

// Mulberry32 — tiny deterministic RNG used for staged shots.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
