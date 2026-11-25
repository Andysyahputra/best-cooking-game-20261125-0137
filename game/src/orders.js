// Sizzle & Serve — order spawning, ticket timers, scoring, combo.
// One job: the pressure. Orders arrive, tick down, pay out, or expire.

import { RECIPES, SHIFT_SECONDS } from './config.js';

let nextOrderId = 1;

export function createOrders() {
  return {
    active: [], // {id, recipe, timeLeft, total, done}
    spawnIn: 2.5,
    served: 0,
    expired: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
  };
}

function orderDuration(elapsed) {
  // Tickets get shorter as the shift wears on: 50s early, ~34s late.
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  return 50 - 16 * t;
}

function spawnInterval(elapsed) {
  // Orders arrive faster over the shift: 14s early, ~7s late.
  const t = Math.min(1, elapsed / SHIFT_SECONDS);
  return 14 - 7 * t;
}

export function spawnOrder(orders, elapsed, rng) {
  const recipe = RECIPES[Math.floor(rng() * RECIPES.length)];
  const total = orderDuration(elapsed);
  orders.active.push({
    id: nextOrderId++,
    recipe,
    timeLeft: total,
    total,
    done: false,
  });
}

export function updateOrders(orders, dt, elapsed, rng, events) {
  // Spawn new tickets while there is room (max 3 on the board).
  orders.spawnIn -= dt;
  if (orders.spawnIn <= 0 && orders.active.length < 3) {
    spawnOrder(orders, elapsed, rng);
    orders.spawnIn = spawnInterval(elapsed);
  }
  // Tick timers; expired tickets cost the combo and a small penalty.
  for (let i = orders.active.length - 1; i >= 0; i--) {
    const o = orders.active[i];
    o.timeLeft -= dt;
    if (o.timeLeft <= 0) {
      orders.active.splice(i, 1);
      orders.expired += 1;
      orders.combo = 0;
      orders.coins = Math.max(0, orders.coins - 3);
      if (events) events.push({ type: 'expire', order: o });
    }
  }
}

// Serve a finished dish. Returns {paid, coins, matched} for the caller.
export function serveDish(orders, dishRecipeId, events) {
  const idx = orders.active.findIndex((o) => o.recipe.id === dishRecipeId);
  if (idx === -1) {
    // No ticket wants this dish: small penalty, combo resets.
    orders.combo = 0;
    orders.coins = Math.max(0, orders.coins - 3);
    if (events) events.push({ type: 'wrong' });
    return { paid: 0, matched: false };
  }
  const order = orders.active[idx];
  orders.active.splice(idx, 1);
  const timeBonus = Math.round((order.timeLeft / order.total) * 6);
  orders.combo += 1;
  orders.bestCombo = Math.max(orders.bestCombo, orders.combo);
  const multiplier = 1 + 0.1 * (orders.combo - 1);
  const paid = Math.round((order.recipe.base + timeBonus) * multiplier);
  orders.coins += paid;
  orders.served += 1;
  order.done = true;
  if (events) events.push({ type: 'serve', order, paid });
  return { paid, matched: true, order };
}

export function resetOrders(orders) {
  orders.active.length = 0;
  orders.spawnIn = 2.5;
  orders.served = 0;
  orders.expired = 0;
  orders.coins = 0;
  orders.combo = 0;
  orders.bestCombo = 0;
}
