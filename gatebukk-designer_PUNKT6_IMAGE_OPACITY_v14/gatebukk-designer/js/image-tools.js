
// IMAGE TOOLS – OPACITY + CROP (MVP, CORRECT PATH)

export function setImageOpacity(obj, value) {
  if (!obj || typeof value !== 'number') return;
  obj.opacity = Math.max(0, Math.min(1, value));
  obj.canvas && obj.canvas.requestRenderAll();
}

export function startCrop(obj) {
  if (!obj) return;
  obj.__cropMode = true;
}

export function applyCrop(obj) {
  if (!obj || !obj.__cropMode) return;
  obj.__cropMode = false;
}
