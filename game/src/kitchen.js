// Sizzle & Serve — station definitions and interaction logic.
// One job: what happens when the chef presses E at each station
// (pick up / chop / cook / assemble / serve / bin).

import { CHOP_SECONDS, ITEMS, STATIONS, recipeForPlate } from './config.js';

export function createKitchen() {
  return {
    // Two stove burners: {item, cookLeft, state: 'cooking'|'done'|'burnt'} | null
    burners: [null, null],
    // Items stacked on the assembly counter plate.
    plate: [],
    // 0..1 chopping progress while the chef holds E at the board.
    chopProgress: 0,
    choppingItem: null,
  };
}

export function resetKitchen(kitchen) {
  kitchen.burners = [null, null];
  kitchen.plate = [];
  kitchen.chopProgress = 0;
  kitchen.choppingItem = null;
}

function choppedForm(item) {
  return item === 'tomato' ? 'tomato_chopped' : item === 'lettuce' ? 'lettuce_chopped' : null;
}

function cookedForm(item) {
  return item === 'patty' ? 'patty_cooked' : item === 'egg' ? 'egg_cooked' : null;
}

// Advance stove timers. Returns events: {type:'done'|'burnt', burner}.
export function updateKitchen(kitchen, dt, events) {
  for (let i = 0; i < kitchen.burners.length; i++) {
    const b = kitchen.burners[i];
    if (!b) continue;
    if (b.state === 'cooking') {
      b.cookLeft -= dt;
      if (b.cookLeft <= 0) {
        b.state = 'done';
        b.burnLeft = 4;
        if (events) events.push({ type: 'cooked', burner: i, item: b.item });
      }
    } else if (b.state === 'done') {
      b.burnLeft -= dt;
      if (b.burnLeft <= 0) {
        b.state = 'burnt';
        if (events) events.push({ type: 'burnt', burner: i, item: b.item });
      }
    }
  }
}

// Hold-to-chop: call every frame while the chef stands at the board holding E.
// Returns 'chopped' when a chop finishes, else null.
export function updateChopping(kitchen, player, holding, dt, events) {
  const item = player.carrying;
  const canChop = typeof item === 'string' && choppedForm(item);
  if (!canChop || !holding) {
    if (!canChop) {
      kitchen.chopProgress = 0;
      kitchen.choppingItem = null;
    }
    return null;
  }
  if (kitchen.choppingItem !== item) {
    kitchen.choppingItem = item;
    kitchen.chopProgress = 0;
  }
  kitchen.chopProgress += dt / CHOP_SECONDS;
  if (events && Math.random() < dt * 14) events.push({ type: 'chopbit' });
  if (kitchen.chopProgress >= 1) {
    player.carrying = choppedForm(item);
    kitchen.chopProgress = 0;
    kitchen.choppingItem = null;
    if (events) events.push({ type: 'chopped', item: player.carrying });
    return 'chopped';
  }
  return null;
}

// One press of E at the station the chef stands by.
// Returns a short event string for sounds / floating text, or null.
export function interact(kitchen, player, station, orders, events) {
  if (!station) return null;
  const carried = player.carrying;

  if (station.kind === 'crate') {
    if (carried) return 'hands-full';
    player.carrying = station.item;
    if (events) events.push({ type: 'pickup', item: station.item });
    return 'pickup';
  }

  if (station.kind === 'board') {
    // Chopping is hold-to-chop (see updateChopping); a tap does nothing.
    return null;
  }

  if (station.kind === 'stove') {
    // Pick up a finished (or burnt) item first.
    for (let i = 0; i < kitchen.burners.length; i++) {
      const b = kitchen.burners[i];
      if (b && (b.state === 'done' || b.state === 'burnt') && !carried) {
        player.carrying = b.state === 'burnt' ? 'burnt' : cookedForm(b.item);
        kitchen.burners[i] = null;
        if (events) events.push({ type: 'pickup', item: player.carrying });
        return 'pickup';
      }
    }
    // Otherwise place a cookable raw item on a free burner.
    if (typeof carried === 'string' && ITEMS[carried] && ITEMS[carried].cookable) {
      const free = kitchen.burners.findIndex((b) => b === null);
      if (free === -1) return 'no-burner';
      kitchen.burners[free] = {
        item: carried,
        cookLeft: ITEMS[carried].cookTime,
        burnLeft: 4,
        state: 'cooking',
      };
      player.carrying = null;
      if (events) events.push({ type: 'cook-start', item: carried, burner: free });
      return 'cook-start';
    }
    return 'not-cookable';
  }

  if (station.kind === 'assembly') {
    // Pick up a finished dish with empty hands.
    const dish = recipeForPlate(kitchen.plate);
    if (dish && !carried) {
      player.carrying = { dish: dish.id };
      kitchen.plate = [];
      if (events) events.push({ type: 'pickup-dish', dish: dish.id });
      return 'pickup-dish';
    }
    // Add a carried ingredient to the plate.
    if (typeof carried === 'string' && !ITEMS[carried].burnt) {
      const usable = ['rice', 'bun', 'tomato_chopped', 'lettuce_chopped', 'patty_cooked', 'egg_cooked'];
      if (!usable.includes(carried)) return 'not-plateable';
      if (kitchen.plate.includes(carried)) return 'already-on-plate';
      kitchen.plate.push(carried);
      player.carrying = null;
      if (events) events.push({ type: 'plated', item: carried });
      return 'plated';
    }
    if (typeof carried === 'string' && ITEMS[carried].burnt) return 'burnt-no-plate';
    return null;
  }

  if (station.kind === 'pass') {
    if (carried && typeof carried === 'object' && carried.dish) {
      player.carrying = null;
      if (events) events.push({ type: 'serve-attempt', dish: carried.dish });
      return 'serve';
    }
    return 'no-dish';
  }

  if (station.kind === 'bin') {
    if (carried) {
      const was = carried;
      player.carrying = null;
      if (events) events.push({ type: 'binned', item: was });
      return 'binned';
    }
    // Bin the plate's contents too.
    if (kitchen.plate.length > 0) {
      kitchen.plate = [];
      if (events) events.push({ type: 'binned-plate' });
      return 'binned-plate';
    }
    return null;
  }

  return null;
}
