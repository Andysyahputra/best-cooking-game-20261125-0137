// Sizzle & Serve — chef movement and carrying.
// One job: where the chef is, how they get there, and what they hold.

import { PLAYER_SPEED, PLAYER_RADIUS, STATIONS, VIEW_W, VIEW_H } from './config.js';

export function createPlayer() {
  return {
    x: 640,
    y: 600,
    facing: 1, // 1 = right, -1 = left
    carrying: null, // item id string, or a dish object {dish: recipeId}
    walkPhase: 0,
    moving: false,
  };
}

function stationRects() {
  const rects = [];
  for (const c of STATIONS.crates) rects.push(c);
  rects.push(STATIONS.board, STATIONS.stove, STATIONS.assembly, STATIONS.pass);
  rects.push(STATIONS.bin, STATIONS.sink, STATIONS.fridge);
  return rects;
}

function collides(x, y, rects) {
  for (const r of rects) {
    const pad = PLAYER_RADIUS - 4;
    if (x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad) {
      return r;
    }
  }
  return null;
}

export function updatePlayer(player, input, dt) {
  const vec = input.moveVector();
  let vx = vec.x;
  let vy = vec.y;

  // Click-to-move: walk toward the clicked floor tile unless keys are held.
  if (!input.hasMoveKeys() && input.clickTarget) {
    const dx = input.clickTarget.x - player.x;
    const dy = input.clickTarget.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 10) {
      input.clickTarget = null;
    } else {
      vx = dx / dist;
      vy = dy / dist;
    }
  }

  const rects = stationRects();
  player.moving = vx !== 0 || vy !== 0;
  if (player.moving) {
    if (vx > 0.05) player.facing = 1;
    if (vx < -0.05) player.facing = -1;
    const step = PLAYER_SPEED * dt;
    const nx = player.x + vx * step;
    const ny = player.y + vy * step;
    // Move axis by axis so the chef slides along counters instead of sticking.
    const clampedX = Math.max(24, Math.min(VIEW_W - 24, nx));
    const clampedY = Math.max(124, Math.min(VIEW_H - 24, ny));
    if (!collides(clampedX, player.y, rects)) player.x = clampedX;
    if (!collides(player.x, clampedY, rects)) player.y = clampedY;
    player.walkPhase += dt * 10;
  }
}

export function resetPlayer(player) {
  player.x = 640;
  player.y = 600;
  player.facing = 1;
  player.carrying = null;
  player.walkPhase = 0;
  player.moving = false;
}

// Centre of a station rect — the point the chef walks toward / stands by.
export function stationCenter(rect) {
  return { x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 };
}

// Nearest station whose expanded edge is within interaction range.
export function nearestStation(player) {
  let best = null;
  let bestDist = Infinity;
  const all = [];
  for (const c of STATIONS.crates) all.push({ kind: 'crate', rect: c, item: c.item });
  all.push({ kind: 'board', rect: STATIONS.board });
  all.push({ kind: 'stove', rect: STATIONS.stove });
  all.push({ kind: 'assembly', rect: STATIONS.assembly });
  all.push({ kind: 'pass', rect: STATIONS.pass });
  all.push({ kind: 'bin', rect: STATIONS.bin });
  for (const s of all) {
    const cx = Math.max(s.rect.x, Math.min(player.x, s.rect.x + s.rect.w));
    const cy = Math.max(s.rect.y, Math.min(player.y, s.rect.y + s.rect.h));
    const d = Math.hypot(player.x - cx, player.y - cy);
    if (d < bestDist) {
      bestDist = d;
      best = s;
    }
  }
  return bestDist <= 78 ? best : null;
}
