// Sizzle & Serve — all canvas drawing: kitchen, stations, chef, food,
// HUD (order board, timer, coins, shift clock), particles, title/game-over.
// One job: everything the player sees.

import { COLORS, ITEMS, RECIPES, STATIONS, VIEW_W, VIEW_H, SHIFT_SECONDS, DISH_LABELS } from './config.js';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function itemColor(item) {
  switch (item) {
    case 'tomato': return '#ef4444';
    case 'tomato_chopped': return '#dc2626';
    case 'lettuce': return '#4ade80';
    case 'lettuce_chopped': return '#22c55e';
    case 'patty': return '#b45309';
    case 'patty_cooked': return '#78350f';
    case 'bun': return '#fbbf24';
    case 'rice': return '#fefce8';
    case 'egg': return '#fde68a';
    case 'egg_cooked': return '#fef3c7';
    case 'burnt': return '#1c1917';
    default: return '#a8a29e';
  }
}

// Draw one chunky, appetising food item centred at (x, y), size s (radius-ish).
export function drawItem(ctx, item, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  switch (item) {
    case 'tomato': {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
        ctx.moveTo(0, -s * 0.5);
        ctx.lineTo(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55 - s * 0.4);
        ctx.lineTo(Math.cos(a + 0.5) * s * 0.3, Math.sin(a + 0.5) * s * 0.3 - s * 0.4);
      }
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.beginPath(); ctx.arc(-s * 0.35, -s * 0.35, s * 0.22, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'tomato_chopped': {
      ctx.fillStyle = '#dc2626';
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.rotate((i - 1) * 0.5);
        ctx.beginPath();
        ctx.moveTo(0, 0); ctx.arc(0, 0, s, -0.5, 0.5); ctx.closePath(); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.35, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'lettuce':
    case 'lettuce_chopped': {
      ctx.fillStyle = item === 'lettuce' ? '#4ade80' : '#22c55e';
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI * 2) / 8;
        ctx.arc(Math.cos(a) * s * 0.55, Math.sin(a) * s * 0.55, s * 0.55, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.fillStyle = '#86efac';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.55, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'patty':
    case 'patty_cooked': {
      ctx.fillStyle = item === 'patty' ? '#b45309' : '#78350f';
      rr(ctx, -s, -s * 0.45, s * 2, s * 0.9, s * 0.4);
      ctx.fill();
      if (item === 'patty_cooked') {
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        for (let i = -1; i <= 1; i++) {
          ctx.beginPath(); ctx.moveTo(-s * 0.7, i * s * 0.25); ctx.lineTo(s * 0.7, i * s * 0.25); ctx.stroke();
        }
      }
      break;
    }
    case 'bun': {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(0, s * 0.15, s, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(0, s * 0.15, s * 0.62, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fff7ed';
      for (const [sx, sy] of [[-0.4, -0.45], [0, -0.6], [0.4, -0.45]]) {
        ctx.beginPath(); ctx.arc(sx * s, sy * s, s * 0.08, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'rice': {
      ctx.fillStyle = '#e7e5e4';
      ctx.beginPath(); ctx.ellipse(0, s * 0.2, s, s * 0.55, 0, Math.PI, 0); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath(); ctx.arc(0, -s * 0.15, s * 0.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#d6d3d1';
      for (const [sx, sy] of [[-0.35, -0.3], [0.1, -0.45], [0.45, -0.1]]) {
        ctx.beginPath(); ctx.arc(sx * s, sy * s, s * 0.1, 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case 'egg': {
      ctx.fillStyle = '#fef9c3';
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.95, s * 1.05, 0.3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'egg_cooked': {
      ctx.fillStyle = '#fffbeb';
      ctx.beginPath();
      ctx.ellipse(0, 0, s * 1.05, s * 0.8, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 1.05, s * 0.8, 0.2, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath(); ctx.arc(s * 0.1, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.beginPath(); ctx.arc(s * 0.02, -s * 0.08, s * 0.18, 0, Math.PI * 2); ctx.fill();
      break;
    }
    case 'burnt': {
      ctx.fillStyle = '#1c1917';
      ctx.beginPath(); ctx.arc(0, 0, s * 0.9, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#44403c';
      ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.2, s * 0.3, 0, Math.PI * 2); ctx.fill();
      break;
    }
    default: {
      ctx.fillStyle = '#a8a29e';
      ctx.beginPath(); ctx.arc(0, 0, s, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

function drawChef(ctx, player, time) {
  const { x, y } = player;
  const bob = player.moving ? Math.sin(player.walkPhase) * 2 : Math.sin(time * 2) * 1;
  ctx.save();
  ctx.translate(x, y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.beginPath(); ctx.ellipse(0, 26, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body / apron.
  ctx.fillStyle = '#f8fafc';
  rr(ctx, -16, -6 + bob * 0.3, 32, 30, 10);
  ctx.fill();
  ctx.fillStyle = '#0f766e';
  rr(ctx, -16, 12, 32, 12, 5);
  ctx.fill();
  // Arms.
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath(); ctx.arc(-18, 4 + bob * 0.3, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(18, 4 + bob * 0.3, 7, 0, Math.PI * 2); ctx.fill();
  // Head.
  ctx.fillStyle = '#fcd9b8';
  ctx.beginPath(); ctx.arc(0, -18 + bob * 0.3, 14, 0, Math.PI * 2); ctx.fill();
  // Eyes look where the chef faces.
  ctx.fillStyle = '#292524';
  ctx.beginPath(); ctx.arc(player.facing * 4 - 4, -20 + bob * 0.3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(player.facing * 4 + 5, -20 + bob * 0.3, 2, 0, Math.PI * 2); ctx.fill();
  // Smile.
  ctx.strokeStyle = '#292524';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(player.facing * 3, -14 + bob * 0.3, 5, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
  // Toque.
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -30 + bob * 0.3, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -34 + bob * 0.3, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -30 + bob * 0.3, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillRect(-14, -32 + bob * 0.3, 28, 8);
  // Carried item floats above the toque.
  const carried = player.carrying;
  if (carried) {
    const cy = -58 + bob * 0.3;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(0, cy, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#d6d3d1';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (typeof carried === 'object' && carried.dish) {
      drawPlate(ctx, 0, cy, 15, carried.dish);
    } else {
      drawItem(ctx, carried, 0, cy, 13);
    }
  }
  ctx.restore();
}

// A white plate, optionally stacked with a dish's ingredients.
function drawPlate(ctx, x, y, s, dishId) {
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.45, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 2;
  ctx.stroke();
  if (dishId) {
    const recipe = RECIPES.find((r) => r.id === dishId);
    if (recipe) {
      let oy = -s * 0.15;
      for (const item of recipe.needs) {
        drawItem(ctx, item, 0, oy, s * 0.55);
        oy -= s * 0.28;
      }
    }
  }
  ctx.restore();
}

function drawStationLabel(ctx, text, x, y) {
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = COLORS.ink;
  ctx.fillText(text, x, y);
}

function drawKitchen(ctx, kitchen, time, rngSeed) {
  // Floor tiles.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 108, VIEW_W, VIEW_H - 108);
  ctx.fillStyle = COLORS.floorTile;
  for (let ty = 132; ty < VIEW_H; ty += 48) {
    for (let tx = ((ty / 48) % 2) * 24; tx < VIEW_W; tx += 48) {
      ctx.fillRect(tx, ty, 46, 2);
    }
  }
  // Back wall band.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 108, VIEW_W, 16);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#92400e';
  ctx.fillText('SIZZLE & SERVE  —  fresh from the pass', 24, 122 - 8 + 8);

  // Ingredient crates.
  for (const crate of STATIONS.crates) {
    const cx = crate.x + crate.w / 2;
    const cy = crate.y + crate.h / 2;
    ctx.fillStyle = '#92400e';
    rr(ctx, crate.x, crate.y, crate.w, crate.h, 8);
    ctx.fill();
    ctx.fillStyle = '#b45309';
    rr(ctx, crate.x + 5, crate.y + 5, crate.w - 10, crate.h - 10, 6);
    ctx.fill();
    drawItem(ctx, crate.item, cx, cy - 6, 20);
    ctx.fillStyle = '#fff7ed';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(ITEMS[crate.item].label.toUpperCase(), cx, crate.y + crate.h - 8);
  }

  // Chopping board.
  const b = STATIONS.board;
  ctx.fillStyle = '#78350f';
  rr(ctx, b.x, b.y, b.w, b.h, 8);
  ctx.fill();
  ctx.fillStyle = '#fde68a';
  rr(ctx, b.x + 8, b.y + 8, b.w - 16, b.h - 16, 6);
  ctx.fill();
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(b.x + 20, b.y + b.h / 2); ctx.lineTo(b.x + b.w - 20, b.y + b.h / 2); ctx.stroke();
  drawStationLabel(ctx, 'CHOPPING BOARD', b.x + b.w / 2, b.y + b.h + 16);
  // Chop progress ring.
  if (kitchen.chopProgress > 0 && kitchen.choppingItem) {
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.arc(cx, cy, 30, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = '#16a34a';
    ctx.beginPath(); ctx.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + kitchen.chopProgress * Math.PI * 2); ctx.stroke();
    drawItem(ctx, kitchen.choppingItem, cx, cy, 16);
  }

  // Stove.
  const st = STATIONS.stove;
  ctx.fillStyle = '#44403c';
  rr(ctx, st.x, st.y, st.w, st.h, 8);
  ctx.fill();
  for (let i = 0; i < 2; i++) {
    const bx = st.x + 28 + i * 100;
    const by = st.y + st.h / 2;
    const burner = kitchen.burners[i];
    ctx.fillStyle = '#1c1917';
    ctx.beginPath(); ctx.arc(bx, by, 30, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = burner && burner.state === 'cooking' ? '#f97316' : '#78716c';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(bx, by, 24, 0, Math.PI * 2); ctx.stroke();
    if (burner) {
      if (burner.state === 'burnt') {
        drawItem(ctx, 'burnt', bx, by, 20);
        ctx.fillStyle = '#dc2626';
        ctx.font = 'bold 12px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('BURNT!', bx, by - 38);
      } else {
        drawItem(ctx, burner.item, bx, by, 20);
        // Cook progress ring.
        const total = ITEMS[burner.item].cookTime;
        const frac = burner.state === 'done' ? 1 : 1 - burner.cookLeft / total;
        ctx.strokeStyle = burner.state === 'done' ? '#16a34a' : '#f59e0b';
        ctx.lineWidth = 5;
        ctx.beginPath(); ctx.arc(bx, by, 34, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke();
        if (burner.state === 'done') {
          ctx.fillStyle = '#16a34a';
          ctx.font = 'bold 12px system-ui, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('READY!', bx, by - 40);
        }
        // Sizzle steam.
        const wob = Math.sin(time * 5 + i * 2) * 3;
        ctx.strokeStyle = 'rgba(255,255,255,0.75)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx + wob, by - 30);
        ctx.quadraticCurveTo(bx + wob + 6, by - 44, bx + wob, by - 56);
        ctx.stroke();
      }
    }
  }
  drawStationLabel(ctx, 'STOVE', st.x + st.w / 2, st.y + st.h + 16);

  // Sink (decor).
  const sk = STATIONS.sink;
  ctx.fillStyle = '#a8a29e';
  rr(ctx, sk.x, sk.y, sk.w, sk.h, 8);
  ctx.fill();
  ctx.fillStyle = '#60a5fa';
  rr(ctx, sk.x + 12, sk.y + 12, sk.w - 24, sk.h - 24, 6);
  ctx.fill();
  drawStationLabel(ctx, 'SINK', sk.x + sk.w / 2, sk.y + sk.h + 16);

  // Assembly counter.
  const a = STATIONS.assembly;
  ctx.fillStyle = COLORS.counterEdge;
  rr(ctx, a.x, a.y, a.w, a.h, 10);
  ctx.fill();
  ctx.fillStyle = COLORS.counterTop;
  rr(ctx, a.x + 6, a.y + 6, a.w - 12, a.h - 12, 8);
  ctx.fill();
  drawStationLabel(ctx, 'ASSEMBLY COUNTER', a.x + a.w / 2, a.y + a.h + 16);
  // Plate with stacked items.
  const px = a.x + a.w / 2;
  const py = a.y + a.h / 2 + 4;
  drawPlate(ctx, px, py, 34, null);
  let oy = py - 6;
  for (const item of kitchen.plate) {
    drawItem(ctx, item, px, oy, 17);
    oy -= 12;
  }
  if (kitchen.plate.length > 0) {
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${kitchen.plate.length} on the plate`, px, a.y - 8);
  }

  // Serving pass.
  const p = STATIONS.pass;
  ctx.fillStyle = COLORS.boardDark;
  rr(ctx, p.x, p.y, p.w, p.h, 10);
  ctx.fill();
  ctx.fillStyle = '#f0fdfa';
  rr(ctx, p.x + 6, p.y + 6, p.w - 12, p.h - 12, 8);
  ctx.fill();
  ctx.fillStyle = COLORS.boardDark;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SERVING PASS', p.x + p.w / 2, p.y + 24);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(p.x + p.w / 2 - 40, p.y + p.h - 12);
  ctx.lineTo(p.x + p.w / 2 + 40, p.y + p.h - 12);
  ctx.lineTo(p.x + p.w / 2, p.y + p.h - 30);
  ctx.closePath();
  ctx.fill();
  drawStationLabel(ctx, 'SERVE HERE', p.x + p.w / 2, p.y + p.h + 16);

  // Bin.
  const bn = STATIONS.bin;
  ctx.fillStyle = '#57534e';
  rr(ctx, bn.x, bn.y, bn.w, bn.h, 8);
  ctx.fill();
  ctx.fillStyle = '#78716c';
  rr(ctx, bn.x + 6, bn.y + 6, bn.w - 12, 18, 5);
  ctx.fill();
  ctx.fillStyle = '#fff7ed';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('BIN', bn.x + bn.w / 2, bn.y + bn.h / 2 + 18);

  // Fridge (decor).
  const fr = STATIONS.fridge;
  ctx.fillStyle = '#e7e5e4';
  rr(ctx, fr.x, fr.y, fr.w, fr.h, 10);
  ctx.fill();
  ctx.strokeStyle = '#a8a29e';
  ctx.lineWidth = 2;
  ctx.strokeRect(fr.x + 6, fr.y + 6, fr.w - 12, fr.h - 12);
  ctx.fillStyle = '#0f766e';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('FRIDGE', fr.x + fr.w / 2, fr.y + 30);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(fr.x + 40, fr.y + 55, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(fr.x + 90, fr.y + 60, 7, 0, Math.PI * 2); ctx.fill();
}

function drawOrderBoard(ctx, orders, time) {
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, VIEW_W, 108);
  ctx.fillStyle = COLORS.boardDark;
  ctx.fillRect(0, 100, VIEW_W, 8);
  ctx.fillStyle = '#f0fdfa';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ORDER BOARD', 20, 28);

  // Tickets.
  const ticketW = 250;
  const ticketH = 72;
  orders.active.forEach((order, i) => {
    const x = 180 + i * (ticketW + 14);
    const y = 14;
    const frac = Math.max(0, order.timeLeft / order.total);
    const urgent = order.timeLeft < 10;
    const pulse = urgent ? 0.75 + 0.25 * Math.sin(time * 8) : 1;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#fff7ed';
    rr(ctx, x, y, ticketW, ticketH, 8);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = urgent ? COLORS.red : '#d6d3d1';
    ctx.lineWidth = urgent ? 3 : 1.5;
    rr(ctx, x, y, ticketW, ticketH, 8);
    ctx.stroke();
    ctx.fillStyle = COLORS.ink;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(order.recipe.name, x + 10, y + 22);
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillStyle = COLORS.muted;
    ctx.fillText(order.recipe.blurb, x + 10, y + 40);
    // Ingredient dots.
    order.recipe.needs.forEach((item, j) => {
      drawItem(ctx, item, x + 22 + j * 30, y + 58, 10);
    });
    // Timer bar.
    ctx.fillStyle = '#e7e5e4';
    rr(ctx, x + 10, y + ticketH - 12, ticketW - 20, 7, 3);
    ctx.fill();
    ctx.fillStyle = urgent ? COLORS.red : frac > 0.5 ? COLORS.green : COLORS.gold;
    const bw = (ticketW - 20) * frac;
    if (bw > 4) {
      rr(ctx, x + 10, y + ticketH - 12, bw, 7, 3);
      ctx.fill();
    }
    ctx.fillStyle = urgent ? COLORS.red : COLORS.ink;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.ceil(order.timeLeft)}s`, x + ticketW - 10, y + 22);
    if (order.done) {
      ctx.save();
      ctx.translate(x + ticketW / 2, y + ticketH / 2);
      ctx.rotate(-0.25);
      ctx.strokeStyle = COLORS.green;
      ctx.lineWidth = 4;
      ctx.strokeRect(-52, -16, 104, 32);
      ctx.fillStyle = COLORS.green;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('DONE', 0, 6);
      ctx.restore();
    }
  });

  // Coins, combo, shift clock — right side of the board.
  const rightX = VIEW_W - 20;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText(`$${orders.coins}`, rightX, 34);
  ctx.fillStyle = '#f0fdfa';
  ctx.font = 'bold 14px system-ui, sans-serif';
  const comboText = orders.combo > 1 ? `COMBO x${orders.combo}` : 'COMBO —';
  ctx.fillText(comboText, rightX, 56);
  const shiftLeft = Math.max(0, SHIFT_SECONDS - orders.elapsed);
  const mm = Math.floor(shiftLeft / 60);
  const ss = String(Math.floor(shiftLeft % 60)).padStart(2, '0');
  ctx.font = 'bold 16px system-ui, sans-serif';
  ctx.fillText(`SHIFT ${mm}:${ss}`, rightX, 82);
  // Shift progress bar under the clock.
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  rr(ctx, rightX - 150, 90, 150, 6, 3);
  ctx.fill();
  ctx.fillStyle = '#fbbf24';
  rr(ctx, rightX - 150, 90, 150 * (shiftLeft / SHIFT_SECONDS), 6, 3);
  ctx.fill();
}

function drawParticles(ctx, particles) {
  for (const pt of particles) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFloaters(ctx, floaters) {
  for (const f of floaters) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, f.life / 0.5));
    ctx.fillStyle = f.color;
    ctx.font = 'bold 24px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(f.text, f.x, f.y - (1 - f.life / f.maxLife) * 40);
    ctx.restore();
  }
}

function drawHint(ctx, text) {
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  const w = ctx.measureText(text).width + 28;
  rr(ctx, (VIEW_W - w) / 2, VIEW_H - 34, w, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#fff7ed';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW_W / 2, VIEW_H - 16);
}

function drawTitle(ctx, time) {
  ctx.fillStyle = 'rgba(15, 118, 110, 0.92)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  // Decorative food row.
  const foods = ['tomato', 'egg_cooked', 'patty_cooked', 'bun', 'lettuce', 'rice'];
  foods.forEach((f, i) => {
    const x = 220 + i * 170;
    const y = 150 + Math.sin(time * 1.5 + i) * 8;
    drawItem(ctx, f, x, y, 34);
  });
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff7ed';
  ctx.font = 'bold 72px system-ui, sans-serif';
  ctx.fillText('SIZZLE & SERVE', VIEW_W / 2, 300);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('A fast little kitchen — cook the tickets before they run out!', VIEW_W / 2, 345);
  ctx.fillStyle = '#f0fdfa';
  ctx.font = '17px system-ui, sans-serif';
  const lines = [
    'Move: WASD / arrows, or click a floor tile to walk there',
    'Interact: E (or Space) — grab, chop (hold E), cook, plate, serve',
    'Chop tomato & lettuce, fry patty & egg on the stove — don\'t let it burn!',
    'Stack the recipe on the assembly counter, carry the plate to the SERVING PASS',
    'Shift lasts 2½ minutes. Orders speed up as the rush builds.',
  ];
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 400 + i * 28));
  // Start button.
  const bw = 260;
  const bh = 58;
  const bx = (VIEW_W - bw) / 2;
  const by = 570;
  const pulse = 1 + 0.04 * Math.sin(time * 3);
  ctx.save();
  ctx.translate(VIEW_W / 2, by + bh / 2);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#f59e0b';
  rr(ctx, -bw / 2, -bh / 2, bw, bh, 14);
  ctx.fill();
  ctx.fillStyle = '#451a03';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('START SHIFT', 0, 9);
  ctx.restore();
  ctx.fillStyle = 'rgba(240,253,250,0.8)';
  ctx.font = '15px system-ui, sans-serif';
  ctx.fillText('Click START or press Enter', VIEW_W / 2, by + bh + 30);
}

function drawGameOver(ctx, orders) {
  ctx.fillStyle = 'rgba(28, 25, 23, 0.78)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff7ed';
  ctx.font = 'bold 56px system-ui, sans-serif';
  ctx.fillText('SHIFT OVER!', VIEW_W / 2, 220);
  ctx.fillStyle = '#fde68a';
  ctx.font = 'bold 40px system-ui, sans-serif';
  ctx.fillText(`You earned $${orders.coins}`, VIEW_W / 2, 300);
  ctx.fillStyle = '#f0fdfa';
  ctx.font = '22px system-ui, sans-serif';
  ctx.fillText(`Dishes served: ${orders.served}    Best combo: x${orders.bestCombo}    Tickets lost: ${orders.expired}`, VIEW_W / 2, 360);
  const verdict = orders.served >= 8 ? 'Head-chef material. The pass salutes you.'
    : orders.served >= 4 ? 'A solid shift — the rush nearly had you.'
    : 'The kitchen won this round. One more shift?';
  ctx.fillStyle = '#fdba74';
  ctx.font = 'italic 20px system-ui, sans-serif';
  ctx.fillText(verdict, VIEW_W / 2, 405);
  ctx.fillStyle = '#f59e0b';
  rr(ctx, (VIEW_W - 260) / 2, 460, 260, 58, 14);
  ctx.fill();
  ctx.fillStyle = '#451a03';
  ctx.font = 'bold 26px system-ui, sans-serif';
  ctx.fillText('COOK AGAIN  (R)', VIEW_W / 2, 497);
}

// The single render entry point. `state` carries everything main.js owns.
export function render(ctx, state) {
  const { mode, player, kitchen, orders, particles, floaters, time, shake } = state;
  ctx.save();
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  ctx.fillStyle = COLORS.board;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawKitchen(ctx, kitchen, time);
  // A finished dish waiting on the serving pass (staged serve shot).
  if (state.servePlate) {
    const p = STATIONS.pass;
    drawPlate(ctx, p.x + p.w / 2, p.y + p.h - 10, 20, state.servePlate);
  }
  drawParticles(ctx, particles);
  drawChef(ctx, player, time);
  drawFloaters(ctx, floaters);
  drawOrderBoard(ctx, orders, time);
  if (mode === 'playing') {
    const station = state.nearStation;
    let hint = 'WASD / click to move — E to interact';
    if (station) {
      if (station.kind === 'crate') hint = `E: grab ${ITEMS[station.item].label}`;
      else if (station.kind === 'board') hint = 'Hold E: chop what you carry';
      else if (station.kind === 'stove') hint = 'E: cook / pick up from the stove';
      else if (station.kind === 'assembly') hint = 'E: add to plate / pick up finished dish';
      else if (station.kind === 'pass') hint = 'E: serve the finished dish';
      else if (station.kind === 'bin') hint = 'E: bin what you carry';
    }
    if (kitchen.chopProgress > 0) hint = 'Keep holding E… chopping!';
    drawHint(ctx, hint);
  }
  ctx.restore();
  if (mode === 'title') drawTitle(ctx, time);
  if (mode === 'over') drawGameOver(ctx, orders);
}
