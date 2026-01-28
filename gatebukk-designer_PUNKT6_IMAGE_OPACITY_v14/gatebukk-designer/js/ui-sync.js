/* ======================================================
   [JS:UI-SYNC] SELECTION → CONTEXT UI + BACKGROUND UI
====================================================== */
import { canvas, previewScale } from "./canvas.js";
import { state, save } from "./state.js";
import { syncActionsUI } from "./objects.js";
import { setImageOpacity, startCrop, applyCrop } from "./image-tools.js";

const FONTS = ["Arial", "Montserrat", "Poppins"];

let bgColorPicker;
let bgColorSwatch;

let popup;
let popupContext = "NONE";
let fontPanelOpen = false;
let styleRowOpen = false;

function createPopup() {
  if (popup) return;

  popup = document.createElement("div");
  popup.id = "popup";
  const overlayRoot = document.getElementById("overlay-root");
  (overlayRoot || document.body).appendChild(popup);
}

function destroyPopup() {
  if (!popup) return;
  popup.remove();
  popup = null;
  popupContext = "NONE";
  fontPanelOpen = false;
  styleRowOpen = false;
}

function resolveContext(o) {
  if (!o) return "NONE";
  if (o.type === "textbox") return "TEXT";
  return "IMAGE";
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function forceTextLayout(o) {
  o.dirty = true;
  o.initDimensions();
  o.setCoords();
}

function getActiveTextbox() {
  const o = canvas.getActiveObject();
  if (!o || o.type !== "textbox") return null;
  return o;
}

function getActiveImage() {
  const o = canvas.getActiveObject();
  if (!o || o.type === "textbox") return null;
  return o;
}

function removeActiveObject() {
  const o = canvas.getActiveObject();
  if (!o) return;
  canvas.remove(o);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
  save();
  destroyPopup();
  syncActionsUI(null);
}

function syncImageUI() {
  if (!popup) return;
  const root = popup.querySelector("[data-popup-context='image']");
  if (!root) return;
  const o = getActiveImage();
  if (!o) return;
  const opacity = root.querySelector("[data-popup-image-opacity]");
  if (opacity) {
    const v = typeof o.opacity === "number" ? o.opacity : 1;
    opacity.value = String(Math.round(v * 100));
  }
  const cropBtn = root.querySelector("[data-popup-control='crop']");
  const applyBtn = root.querySelector("[data-popup-control='crop-apply']");
  const cropOn = !!o.__cropMode;
  if (cropBtn) {
    if (cropOn) cropBtn.dataset.active = "true";
    else delete cropBtn.dataset.active;
  }
  if (applyBtn) {
    applyBtn.style.display = cropOn ? "inline-flex" : "none";
  }
}

function bindCommonDelete(root) {
  const del = root.querySelector("[data-popup-control='delete']");
  if (del) del.onclick = () => removeActiveObject();
}

function bindImageControls(root) {
  bindCommonDelete(root);
  const opacity = root.querySelector("[data-popup-image-opacity]");
  if (opacity) {
    opacity.oninput = () => {
      const o = getActiveImage();
      if (!o) return;
      const val = parseFloat(opacity.value || "100");
      setImageOpacity(o, val / 100);
      save();
      syncActionsUI(o);
      requestAnimationFrame(updatePopupPosition);
    };
  }

  const cropBtn = root.querySelector("[data-popup-control='crop']");
  if (cropBtn) {
    cropBtn.onclick = () => {
      const o = getActiveImage();
      if (!o) return;
      startCrop(o);
      save();
      syncImageUI();
      requestAnimationFrame(updatePopupPosition);
    };
  }

  const applyBtn = root.querySelector("[data-popup-control='crop-apply']");
  if (applyBtn) {
    applyBtn.onclick = () => {
      const o = getActiveImage();
      if (!o) return;
      applyCrop(o);
      save();
      syncImageUI();
      requestAnimationFrame(updatePopupPosition);
    };
  }
}

function setPopupTextColor(color) {
  if (!popup) return;
  const c = color || "#000000";
  popup.style.setProperty("--popup-text-color", c);
}

function buildTextPopup() {
  if (!popup) return;

  popup.innerHTML = "";
  popupContext = "TEXT";
  fontPanelOpen = false;
  styleRowOpen = false;

  const root = document.createElement("div");
  root.dataset.popupContext = "text";

  const toolbar = document.createElement("div");
  toolbar.dataset.popupToolbar = "true";

  const rowTop = document.createElement("div");
  rowTop.dataset.popupRow = "top";

  const fontBtn = document.createElement("div");
  fontBtn.dataset.popupControl = "font";
  fontBtn.setAttribute("role", "button");
  fontBtn.setAttribute("aria-label", "Velg font");

  const fontChip = document.createElement("span");
  fontChip.dataset.popupFontChip = "true";
  fontChip.textContent = "Aa";
  fontBtn.appendChild(fontChip);

  const color = document.createElement("div");
  color.dataset.popupControl = "color";
  color.setAttribute("role", "button");
  color.setAttribute("aria-label", "Tekstfarge");

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.dataset.popupColorInput = "true";
  colorInput.setAttribute("aria-label", "Velg tekstfarge");
  color.appendChild(colorInput);

  const styleToggle = document.createElement("div");
  styleToggle.dataset.popupControl = "style-toggle";
  styleToggle.setAttribute("role", "button");
  styleToggle.setAttribute("aria-label", "Stil");
  styleToggle.textContent = "Stil…";

  const alignLeft = document.createElement("div");
  alignLeft.dataset.popupControl = "align-left";
  alignLeft.setAttribute("role", "button");
  alignLeft.setAttribute("aria-label", "Venstrejuster");

  const alignCenter = document.createElement("div");
  alignCenter.dataset.popupControl = "align-center";
  alignCenter.setAttribute("role", "button");
  alignCenter.setAttribute("aria-label", "Sentrer");

  const alignRight = document.createElement("div");
  alignRight.dataset.popupControl = "align-right";
  alignRight.setAttribute("role", "button");
  alignRight.setAttribute("aria-label", "Høyrejuster");

  rowTop.appendChild(fontBtn);
  rowTop.appendChild(color);
  rowTop.appendChild(styleToggle);
  const rowLayers = document.createElement("div");
  rowLayers.dataset.popupRow = "layers";

  rowLayers.appendChild(alignLeft);
  rowLayers.appendChild(alignCenter);
  rowLayers.appendChild(alignRight);

   const del = document.createElement("div");
   del.dataset.popupControl = "delete";
   del.setAttribute("role", "button");
   del.setAttribute("aria-label", "Slett objekt");

   rowLayers.appendChild(del);

  const rowStyle = document.createElement("div");
  rowStyle.dataset.popupRow = "style-expand";
  rowStyle.dataset.open = "false";

  const bringForward = document.createElement("div");
  bringForward.dataset.popupControl = "bring-forward";
  bringForward.setAttribute("role", "button");
  bringForward.setAttribute("aria-label", "Flytt forover");

  const sendBackward = document.createElement("div");
  sendBackward.dataset.popupControl = "send-backward";
  sendBackward.setAttribute("role", "button");
  sendBackward.setAttribute("aria-label", "Flytt bakover");

  rowLayers.appendChild(sendBackward);
  rowLayers.appendChild(bringForward);

  const bold = document.createElement("div");
  bold.dataset.popupControl = "bold";
  bold.setAttribute("role", "button");
  bold.setAttribute("aria-label", "Fet");

  const italic = document.createElement("div");
  italic.dataset.popupControl = "italic";
  italic.setAttribute("role", "button");
  italic.setAttribute("aria-label", "Kursiv");

  const underline = document.createElement("div");
  underline.dataset.popupControl = "underline";
  underline.setAttribute("role", "button");
  underline.setAttribute("aria-label", "Understrek");

  const strike = document.createElement("div");
  strike.dataset.popupControl = "strike";
  strike.setAttribute("role", "button");
  strike.setAttribute("aria-label", "Gjennomstrek");

  rowStyle.appendChild(bold);
  rowStyle.appendChild(italic);
  rowStyle.appendChild(underline);
  rowStyle.appendChild(strike);

  toolbar.appendChild(rowTop);
  toolbar.appendChild(rowLayers);
  toolbar.appendChild(rowStyle);

  const panel = document.createElement("div");
  panel.dataset.popupPanel = "true";
  panel.dataset.popupPanelKind = "font";
  panel.dataset.open = "false";

  const group = document.createElement("div");
  group.dataset.popupGroup = "font-list";

  FONTS.forEach(fontName => {
    const item = document.createElement("div");
    item.dataset.popupControl = "font-item";
    item.dataset.fontValue = fontName;
    item.textContent = fontName;
    group.appendChild(item);
  });

  panel.appendChild(group);

  root.appendChild(toolbar);
  root.appendChild(panel);
  popup.appendChild(root);

  bindTextControls(root);
  syncTextUI();

  requestAnimationFrame(updatePopupPosition);
}

function buildImagePopup() {
  if (!popup) return;

  popup.innerHTML = "";
  popupContext = "IMAGE";
  fontPanelOpen = false;
  styleRowOpen = false;

  const root = document.createElement("div");
  root.dataset.popupContext = "image";

  const toolbar = document.createElement("div");

   const rowTools = document.createElement("div");
   rowTools.dataset.popupRow = "image-tools";

   const opacityWrap = document.createElement("div");
   opacityWrap.dataset.popupControl = "opacity";
   opacityWrap.setAttribute("role", "group");
   opacityWrap.setAttribute("aria-label", "Opacity");

   const opacityInput = document.createElement("input");
   opacityInput.type = "range";
   opacityInput.min = "0";
   opacityInput.max = "100";
   opacityInput.value = "100";
   opacityInput.dataset.popupImageOpacity = "true";
   opacityInput.setAttribute("aria-label", "Opacity");
   opacityWrap.appendChild(opacityInput);

   const cropBtn = document.createElement("div");
   cropBtn.dataset.popupControl = "crop";
   cropBtn.setAttribute("role", "button");
   cropBtn.setAttribute("aria-label", "Beskjær");
   cropBtn.textContent = "Crop";

   const applyBtn = document.createElement("div");
   applyBtn.dataset.popupControl = "crop-apply";
   applyBtn.setAttribute("role", "button");
   applyBtn.setAttribute("aria-label", "Bruk beskjæring");
   applyBtn.textContent = "Apply";
   applyBtn.style.display = "none";

   const del = document.createElement("div");
   del.dataset.popupControl = "delete";
   del.setAttribute("role", "button");
   del.setAttribute("aria-label", "Slett objekt");

   rowTools.appendChild(opacityWrap);
   rowTools.appendChild(cropBtn);
   rowTools.appendChild(applyBtn);
   rowTools.appendChild(del);

   const rowLayers = document.createElement("div");
   rowLayers.dataset.popupRow = "layers";

   const bringForward = document.createElement("div");
   bringForward.dataset.popupControl = "bring-forward";
   bringForward.setAttribute("role", "button");
   bringForward.setAttribute("aria-label", "Flytt forover");

   const sendBackward = document.createElement("div");
   sendBackward.dataset.popupControl = "send-backward";
   sendBackward.setAttribute("role", "button");
   sendBackward.setAttribute("aria-label", "Flytt bakover");

   rowLayers.appendChild(sendBackward);
   rowLayers.appendChild(bringForward);

   toolbar.appendChild(rowTools);
   toolbar.appendChild(rowLayers);

  bindLayerControls(root);
  bindImageControls(root);
  syncImageUI();

  requestAnimationFrame(updatePopupPosition);
}

function withActiveObject(fn) {
  const o = canvas.getActiveObject();
  if (!o) return;

  fn(o);
  canvas.setActiveObject(o);
  canvas.requestRenderAll();
  save();
  syncActionsUI(o);

  requestAnimationFrame(updatePopupPosition);
}

function bindLayerControls(root) {
  const bringForward = root.querySelector("[data-popup-control='bring-forward']");
  const sendBackward = root.querySelector("[data-popup-control='send-backward']");

  if (bringForward) {
    bringForward.onclick = () => {
      withActiveObject(o => canvas.bringForward(o));
    };
  }

  if (sendBackward) {
    sendBackward.onclick = () => {
      withActiveObject(o => canvas.sendBackwards(o));
    };
  }
}

function openFontPanel(open) {
  if (!popup) return;

  const root = popup.querySelector("[data-popup-context='text']");
  if (!root) return;

  const fontBtn = root.querySelector("[data-popup-control='font']");
  const panel = root.querySelector("[data-popup-panel-kind='font']");

  fontPanelOpen = !!open;

  if (fontPanelOpen) {
    openStyleRow(false);
  }

  if (panel) {
    panel.dataset.open = fontPanelOpen ? "true" : "false";
  }

  if (fontBtn) {
    if (fontPanelOpen) fontBtn.dataset.active = "true";
    else delete fontBtn.dataset.active;
  }

  requestAnimationFrame(updatePopupPosition);
}

function openStyleRow(open) {
  if (!popup) return;

  const root = popup.querySelector("[data-popup-context='text']");
  if (!root) return;

  const styleBtn = root.querySelector("[data-popup-control='style-toggle']");
  const row = root.querySelector("[data-popup-row='style-expand']");

  styleRowOpen = !!open;

  if (styleRowOpen) {
    openFontPanel(false);
  }

  if (row) {
    row.dataset.open = styleRowOpen ? "true" : "false";
  }

  if (styleBtn) {
    if (styleRowOpen) styleBtn.dataset.active = "true";
    else delete styleBtn.dataset.active;
  }

  requestAnimationFrame(updatePopupPosition);
}

function bindTextControls(root) {
  bindCommonDelete(root);
  const fontBtn = root.querySelector("[data-popup-control='font']");
  const styleToggle = root.querySelector("[data-popup-control='style-toggle']");
  const alignLeft = root.querySelector("[data-popup-control='align-left']");
  const alignCenter = root.querySelector("[data-popup-control='align-center']");
  const alignRight = root.querySelector("[data-popup-control='align-right']");

  const bold = root.querySelector("[data-popup-control='bold']");
  const italic = root.querySelector("[data-popup-control='italic']");
  const underline = root.querySelector("[data-popup-control='underline']");
  const strike = root.querySelector("[data-popup-control='strike']");

  const colorInput = root.querySelector("[data-popup-color-input]");

  const bringForward = root.querySelector("[data-popup-control='bring-forward']");
  const sendBackward = root.querySelector("[data-popup-control='send-backward']");

  bindLayerControls(root);

  if (fontBtn) {
    fontBtn.onclick = () => {
      openFontPanel(!fontPanelOpen);
    };
  }

  if (styleToggle) {
    styleToggle.onclick = () => {
      openStyleRow(!styleRowOpen);
    };
  }

  if (alignLeft) alignLeft.onclick = () => setAlign("left");
  if (alignCenter) alignCenter.onclick = () => setAlign("center");
  if (alignRight) alignRight.onclick = () => setAlign("right");

  if (bold) bold.onclick = () => toggleStyle("bold");
  if (italic) italic.onclick = () => toggleStyle("italic");
  if (underline) underline.onclick = () => toggleStyle("underline");
  if (strike) strike.onclick = () => toggleStyle("strike");

  if (colorInput) {
    colorInput.oninput = () => {
      const o = getActiveTextbox();
      if (!o) return;

      o.set("fill", colorInput.value);
      o._colorChosen = true;

      forceTextLayout(o);
      canvas.requestRenderAll();
      save();
      syncTextUI();
    };
  }

  if (bringForward) {
    bringForward.onclick = () => {
      withActiveObject(o => canvas.bringForward(o));
    };
  }

  if (sendBackward) {
    sendBackward.onclick = () => {
      withActiveObject(o => canvas.sendBackwards(o));
    };
  }

  const fontGroup = root.querySelector("[data-popup-group='font-list']");
  if (fontGroup) {
    fontGroup.querySelectorAll("[data-popup-control='font-item']").forEach(item => {
      item.onclick = () => {
        const o = getActiveTextbox();
        if (!o) return;

        const v = item.dataset.fontValue || "";
        if (!v) return;

        o.fontFamily = v;
        o._fontChosen = true;

        forceTextLayout(o);
        canvas.requestRenderAll();
        save();
        syncTextUI();
      };
    });
  }
}

function setAlign(align) {
  const o = getActiveTextbox();
  if (!o) return;

  o.textAlign = align;
  forceTextLayout(o);
  canvas.requestRenderAll();
  save();
  syncTextUI();
}

function toggleStyle(kind) {
  const o = getActiveTextbox();
  if (!o) return;

  if (kind === "bold") {
    o.fontWeight = o.fontWeight === "bold" ? "normal" : "bold";
  }

  if (kind === "italic") {
    o.fontStyle = o.fontStyle === "italic" ? "normal" : "italic";
  }

  if (kind === "underline") {
    o.underline = !o.underline;
  }

  if (kind === "strike") {
    o.linethrough = !o.linethrough;
  }

  forceTextLayout(o);
  canvas.requestRenderAll();
  save();
  syncTextUI();
}

function syncTextUI() {
  if (!popup) return;
  const root = popup.querySelector("[data-popup-context='text']");
  if (!root) return;

  const o = getActiveTextbox();
  if (!o) return;

  const map = {
    bold: o.fontWeight === "bold",
    italic: o.fontStyle === "italic",
    underline: !!o.underline,
    strike: !!o.linethrough,
    "align-left": o.textAlign === "left",
    "align-center": o.textAlign === "center",
    "align-right": o.textAlign === "right"
  };

  Object.entries(map).forEach(([key, active]) => {
    const el = root.querySelector(`[data-popup-control='${key}']`);
    if (!el) return;
    if (active) el.dataset.active = "true";
    else delete el.dataset.active;
  });

  const colorInput = root.querySelector("[data-popup-color-input]");
  if (colorInput) {
    const c = (o.fill || "#000000").toString();
    colorInput.value = c;
    setPopupTextColor(c);
  }

  const fontChip = root.querySelector("[data-popup-font-chip]");
  if (fontChip) {
    if (o._fontChosen) {
      fontChip.textContent = (o.fontFamily || "").toString() || "Aa";
    } else {
      fontChip.textContent = "Aa";
    }
  }

  const group = root.querySelector("[data-popup-group='font-list']");
  if (group) {
    const f = (o.fontFamily || "").toString();
    group.querySelectorAll("[data-popup-control='font-item']").forEach(item => {
      item.dataset.active = item.dataset.fontValue === f ? "true" : "false";
    });
  }
}

function updatePopupPosition() {
  if (!popup) return;
  const o = canvas.getActiveObject();
  if (!o) return;

  const canvasEl = document.getElementById("c");
  if (!canvasEl) return;

  const cr = canvasEl.getBoundingClientRect();
  const r = o.getBoundingRect(true, true);

  const objLeft = cr.left + r.left * previewScale;
  const objTop = cr.top + r.top * previewScale;
  const objW = r.width * previewScale;
  const objH = r.height * previewScale;

  const margin = 8;
  const gap = 10;

  const pw = popup.offsetWidth || 240;
  const ph = popup.offsetHeight || 60;

  let x = objLeft + objW / 2 - pw / 2;
  let y = objTop - ph - gap;

  if (y < margin) {
    y = objTop + objH + gap;
  }

  x = clamp(x, margin, window.innerWidth - pw - margin);
  y = clamp(y, margin, window.innerHeight - ph - margin);

  popup.style.left = `${Math.round(x)}px`;
  popup.style.top = `${Math.round(y)}px`;
}

function handleSelectionSync() {
  if (!canvas) return;

  const o = canvas.getActiveObject();
  syncActionsUI(o);

  const ctx = resolveContext(o);

  if (ctx === "NONE") {
    destroyPopup();
    return;
  }

  createPopup();

  if (ctx !== popupContext) {
    if (ctx === "TEXT") buildTextPopup();
    if (ctx === "IMAGE") buildImagePopup();
  } else {
    if (ctx === "TEXT") syncTextUI();
    if (ctx === "IMAGE") syncImageUI();
    requestAnimationFrame(updatePopupPosition);
  }
}

function handleGlobalPointerDown(e) {
  if (!canvas) return;

  const t = e.target;
  if (!t) return;

  if (t.closest && t.closest("#popup")) return;
  if (t.closest && t.closest(".menu")) return;

  const canvasEl = canvas.upperCanvasEl || canvas.lowerCanvasEl;
  if (canvasEl && (t === canvasEl || canvasEl.contains(t))) return;

  const o = canvas.getActiveObject();
  if (!o) return;

  canvas.discardActiveObject();
  canvas.requestRenderAll();
  destroyPopup();
  syncActionsUI(null);
}

document.addEventListener("app:init", () => {
  bgColorPicker = document.getElementById("bgColorPicker");
  bgColorSwatch = document.getElementById("bgColorSwatch");

  if (bgColorPicker) {
    bgColorPicker.oninput = () => {
      state.sides[state.meta.active].bg = bgColorPicker.value;
      canvas.setBackgroundColor(bgColorPicker.value, canvas.renderAll.bind(canvas));
      save();
      syncBackgroundUI();
    };
  }

  canvas.on("selection:created", handleSelectionSync);
  canvas.on("selection:updated", handleSelectionSync);
  canvas.on("selection:cleared", handleSelectionSync);
  canvas.on("object:modified", handleSelectionSync);
  canvas.on("object:moving", () => requestAnimationFrame(updatePopupPosition));
  canvas.on("object:scaling", () => requestAnimationFrame(updatePopupPosition));
  canvas.on("object:rotating", () => requestAnimationFrame(updatePopupPosition));
  canvas.on("text:changed", handleSelectionSync);

  window.addEventListener("resize", () => requestAnimationFrame(updatePopupPosition));

  document.addEventListener("pointerdown", handleGlobalPointerDown, true);

  syncBackgroundUI();
});

export function syncBackgroundUI() {
  if (!bgColorPicker || !bgColorSwatch) return;

  const c = state.sides[state.meta.active].bg || "#ffffff";
  bgColorPicker.value = c;
  bgColorSwatch.style.background = c;
}

// DOM-APPEND FIX v1.3
const popupRoot = document.querySelector('#popup-root') || document.body;
if (popup && popupRoot && !popupRoot.contains(popup)) popupRoot.appendChild(popup);


function bindImageOpacitySlider(slider, image) {
  slider.addEventListener('input', (e) => {
    setImageOpacity(image, parseFloat(e.target.value));
  });
}
