/* ======================================================
   [JS:CANVAS] CANVAS SETUP
====================================================== */
export const W = 260;
export const H = 380;

export let canvas;
export let previewScale = 1;

let ro;

let touchPointers;
let pinch;
let guides;

function dist(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

function midpoint(a, b) {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function isTouch(e) {
  return e && e.pointerType === "touch";
}

function startPinchIfReady() {
  if (!canvas) return;
  if (touchPointers.size !== 2) return;

  const o = canvas.getActiveObject();
  if (!o) return;

  const pts = Array.from(touchPointers.values());
  const d = dist(pts[0], pts[1]);
  if (!d) return;

  pinch.active = true;
  pinch.obj = o;
  pinch.startDist = d;
  pinch.startScaleX = o.scaleX || 1;
  pinch.startScaleY = o.scaleY || 1;

  pinch._prevLock = {
    lockMovementX: !!o.lockMovementX,
    lockMovementY: !!o.lockMovementY,
    lockScalingX: !!o.lockScalingX,
    lockScalingY: !!o.lockScalingY,
    lockRotation: !!o.lockRotation
  };

  o.lockMovementX = true;
  o.lockMovementY = true;
  o.lockRotation = true;
}

function endPinch() {
  if (!pinch.active) return;
  const o = pinch.obj;

  if (o && pinch._prevLock) {
    o.lockMovementX = pinch._prevLock.lockMovementX;
    o.lockMovementY = pinch._prevLock.lockMovementY;
    o.lockScalingX = pinch._prevLock.lockScalingX;
    o.lockScalingY = pinch._prevLock.lockScalingY;
    o.lockRotation = pinch._prevLock.lockRotation;
  }

  pinch.active = false;
  pinch.obj = null;
  pinch._prevLock = null;

  guides.showX = false;
  guides.showY = false;
}

function handlePointerDown(e) {
  if (!isTouch(e)) return;

  touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (touchPointers.size >= 2) {
    e.preventDefault();
    e.stopImmediatePropagation();
    startPinchIfReady();
  }
}

function handlePointerMove(e) {
  if (!isTouch(e)) return;
  if (!touchPointers.has(e.pointerId)) return;

  touchPointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

  if (!pinch.active) {
    if (touchPointers.size === 2) {
      e.preventDefault();
      e.stopImmediatePropagation();
      startPinchIfReady();
    }
    return;
  }

  if (touchPointers.size < 2) {
    endPinch();
    return;
  }

  const o = pinch.obj;
  if (!o || !canvas.getActiveObject() || canvas.getActiveObject() !== o) {
    endPinch();
    return;
  }

  const pts = Array.from(touchPointers.values());
  const d = dist(pts[0], pts[1]);
  if (!d || !pinch.startDist) return;

  e.preventDefault();
  e.stopImmediatePropagation();

  const factor = d / pinch.startDist;
  const nextX = pinch.startScaleX * factor;
  const nextY = pinch.startScaleY * factor;

  o.scaleX = nextX;
  o.scaleY = nextY;

  clampScale(o);
  clampObject(o);

  o.setCoords();
  updateCenterGuides(o);
  canvas.requestRenderAll();
}

function handlePointerUp(e) {
  if (!isTouch(e)) return;
  if (touchPointers.has(e.pointerId)) {
    touchPointers.delete(e.pointerId);
  }

  if (touchPointers.size < 2) {
    endPinch();
  }
}

function updateCenterGuides(o) {
  if (!canvas || !o) return;

  const c = o.getCenterPoint();
  const cx = W / 2;
  const cy = H / 2;

  const threshold = 6;

  guides.showX = Math.abs(c.x - cx) <= threshold;
  guides.showY = Math.abs(c.y - cy) <= threshold;
}

function applyCenterSnap(o) {
  if (!canvas || !o) return;

  const c = o.getCenterPoint();
  const cx = W / 2;
  const cy = H / 2;
  const threshold = 6;

  const dx = cx - c.x;
  const dy = cy - c.y;

  const nearX = Math.abs(dx) <= threshold;
  const nearY = Math.abs(dy) <= threshold;

  if (!nearX && !nearY) return;

  let snapX = false;
  let snapY = false;

  if (nearX && nearY) {
    if (Math.abs(dx) <= Math.abs(dy)) snapX = true;
    else snapY = true;
  } else if (nearX) {
    snapX = true;
  } else if (nearY) {
    snapY = true;
  }

  if (snapX) o.left += dx;
  if (snapY) o.top += dy;

  o.setCoords();
}

function clearCenterGuides() {
  guides.showX = false;
  guides.showY = false;
}

function drawCenterGuides() {
  if (!canvas) return;
  const ctx = canvas.contextContainer;
  if (!ctx) return;

  ctx.save();
  if (!guides.showX && !guides.showY) {
    ctx.restore();
    return;
  }

  const vt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
  const tx = vt[4] || 0;
  const ty = vt[5] || 0;
  const zx = vt[0] || 1;
  const zy = vt[3] || 1;

  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(79, 169, 255, 0.85)";
  ctx.setLineDash([4, 4]);

  if (guides.showX) {
    const x = (W / 2) * zx + tx;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H * zy + ty);
    ctx.stroke();
  }

  if (guides.showY) {
    const y = (H / 2) * zy + ty;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W * zx + tx, y);
    ctx.stroke();
  }

  ctx.restore();
}

/* ======================================================
   [JS:CLAMP] OBJECT CLAMPING
====================================================== */
export function clampObject(o) {
  const b = o.getBoundingRect(true);

  if (b.left < 0) o.left -= b.left;
  if (b.top < 0) o.top -= b.top;
  if (b.left + b.width > W) o.left -= (b.left + b.width - W);
  if (b.top + b.height > H) o.top -= (b.top + b.height - H);

  o.setCoords();
}

export function clampScale(o) {
  const b = o.getBoundingRect(true);

  if (b.width > W) o.scaleX *= W / b.width;
  if (b.height > H) o.scaleY *= H / b.height;
}

/* ======================================================
   [JS:RESPONSIVE] PREVIEW SCALE
====================================================== */
function applyScale() {
  if (!canvas) return;

  const host = canvas.lowerCanvasEl?.parentElement;
  if (!host) return;

  const rect = host.getBoundingClientRect();
  const sx = rect.width / W;
  const sy = rect.height / H;

  previewScale = Math.min(sx, sy, 1);

  canvas.setZoom(previewScale);
  canvas.setViewportTransform([previewScale, 0, 0, previewScale, 0, 0]);
  canvas.requestRenderAll();
}

document.addEventListener("app:init", () => {
  canvas = new fabric.Canvas("c");
  canvas.preserveObjectStacking = true;

  touchPointers = new Map();
  pinch = { active: false, startDist: 0, startScaleX: 1, startScaleY: 1, obj: null, _prevLock: null };
  guides = { showX: false, showY: false };

  const el = canvas.upperCanvasEl;
  if (el) {
    el.addEventListener("pointerdown", handlePointerDown, { passive: false, capture: true });
    el.addEventListener("pointermove", handlePointerMove, { passive: false, capture: true });
    el.addEventListener("pointerup", handlePointerUp, { passive: false, capture: true });
    el.addEventListener("pointercancel", handlePointerUp, { passive: false, capture: true });
  }

  canvas.on("object:moving", e => {
    applyCenterSnap(e.target);
    clampObject(e.target);
    updateCenterGuides(e.target);
  });
  canvas.on("object:scaling", e => {
    clampScale(e.target);
    clampObject(e.target);
  });

  canvas.on("object:scaling", e => {
    updateCenterGuides(e.target);
  });

  canvas.on("mouse:up", () => {
    clearCenterGuides();
    canvas.requestRenderAll();
  });

  canvas.on("selection:cleared", () => {
    clearCenterGuides();
    canvas.requestRenderAll();
  });

  canvas.on("after:render", () => {
    drawCenterGuides();
  });

  applyScale();

  const host = canvas.lowerCanvasEl?.parentElement;
  if (host && "ResizeObserver" in window) {
    ro = new ResizeObserver(() => applyScale());
    ro.observe(host);
  }
});