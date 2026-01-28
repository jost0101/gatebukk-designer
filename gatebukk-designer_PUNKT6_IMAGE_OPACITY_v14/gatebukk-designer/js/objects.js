/* ======================================================
   [JS:OBJECTS] OBJECT ACTIONS
====================================================== */
import { canvas } from "./canvas.js";
import { resetState } from "./state.js";
import { switchSide } from "./sides.js";

let bringForward;
let sendBack;
let removeObject;
let reset;

export function syncActionsUI() {
  if (!bringForward || !sendBack || !removeObject) return;

  const hasObject = !!canvas.getActiveObject();

  bringForward.disabled = !hasObject;
  sendBack.disabled = !hasObject;
  removeObject.disabled = !hasObject;

  bringForward.classList.toggle("disabled", !hasObject);
  sendBack.classList.toggle("disabled", !hasObject);
  removeObject.classList.toggle("disabled", !hasObject);
}

function shieldPointerDown(el) {
  if (!el) return;
  el.addEventListener("pointerdown", e => {
    e.stopPropagation();
  });
}

function withActiveObject(fn, { keepSelection = true } = {}) {
  const o = canvas.getActiveObject();
  if (!o) return;

  fn(o);

  if (keepSelection && canvas.contains(o)) {
    canvas.setActiveObject(o);
  }

  canvas.requestRenderAll();
  syncActionsUI();
}

document.addEventListener("app:init", () => {
  bringForward = document.getElementById("bringForward");
  sendBack = document.getElementById("sendBack");
  removeObject = document.getElementById("removeObject");
  reset = document.getElementById("reset");

  if (!bringForward || !sendBack || !removeObject || !reset) return;

  shieldPointerDown(bringForward);
  shieldPointerDown(sendBack);
  shieldPointerDown(removeObject);
  shieldPointerDown(reset);

  bringForward.onclick = () => {
    withActiveObject(o => canvas.bringForward(o));
  };

  sendBack.onclick = () => {
    withActiveObject(o => canvas.sendBackwards(o));
  };

  removeObject.onclick = () => {
    withActiveObject(o => canvas.remove(o), { keepSelection: false });
  };

  reset.onclick = () => {
    resetState();
    switchSide("side1", { skipSave: true });
    canvas.clear();
    syncActionsUI();
  };
});