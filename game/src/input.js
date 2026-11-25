// Sizzle & Serve — keyboard state + mouse click-to-move (tile targeting).
// One job: turn raw device input into a clean, frame-ready input snapshot.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    // Click-to-move target in canvas coordinates, or null.
    clickTarget: null,
    // True on the frame the interact key was first pressed down.
    interactPressed: false,
    interactHeld: false,
    // True on the frame the confirm key (Enter) was first pressed.
    confirmPressed: false,
    // True on the frame R was first pressed.
    restartPressed: false,
    // True on the frame a mouse click landed (used by title / game-over buttons).
    clicked: false,
    clickX: 0,
    clickY: 0,
    mouseX: 0,
    mouseY: 0,
  };

  const KEYMAP = {
    KeyW: 'up', ArrowUp: 'up',
    KeyS: 'down', ArrowDown: 'down',
    KeyA: 'left', ArrowLeft: 'left',
    KeyD: 'right', ArrowRight: 'right',
  };

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
    }
    const action = KEYMAP[event.code];
    if (action && !event.repeat) keys.add(action);
    if ((event.code === 'KeyE' || event.code === 'Space') && !event.repeat) {
      state.interactPressed = true;
      state.interactHeld = true;
    }
    if (event.code === 'Enter' && !event.repeat) state.confirmPressed = true;
    if (event.code === 'KeyR' && !event.repeat) state.restartPressed = true;
  });

  window.addEventListener('keyup', (event) => {
    const action = KEYMAP[event.code];
    if (action) keys.delete(action);
    if (event.code === 'KeyE' || event.code === 'Space') state.interactHeld = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    const p = canvasPoint(event);
    state.clicked = true;
    state.clickX = p.x;
    state.clickY = p.y;
    state.mouseX = p.x;
    state.mouseY = p.y;
    // A click on the kitchen floor is a walk order; clicks on stations are
    // handled by the same rule (walk to the station, then interact with E).
    state.clickTarget = { x: p.x, y: p.y };
  });

  canvas.addEventListener('pointermove', (event) => {
    const p = canvasPoint(event);
    state.mouseX = p.x;
    state.mouseY = p.y;
  });

  // Movement vector from held keys; {x, y} each in -1..1, normalised.
  state.moveVector = function moveVector() {
    let x = 0;
    let y = 0;
    if (keys.has('left')) x -= 1;
    if (keys.has('right')) x += 1;
    if (keys.has('up')) y -= 1;
    if (keys.has('down')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.SQRT2;
      x *= inv;
      y *= inv;
    }
    return { x, y };
  };

  state.hasMoveKeys = function hasMoveKeys() {
    return keys.size > 0;
  };

  // Call once per frame after the game has read the edge-triggered flags.
  state.endFrame = function endFrame() {
    state.interactPressed = false;
    state.confirmPressed = false;
    state.restartPressed = false;
    state.clicked = false;
  };

  return state;
}
