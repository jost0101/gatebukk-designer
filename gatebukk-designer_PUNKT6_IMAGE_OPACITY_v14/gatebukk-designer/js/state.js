/* ======================================================
   [JS:STATE] STATE MODELS
====================================================== */
import { canvas } from "./canvas.js";

export const UI_DEFAULTS = {
  fontFamily: "Arial",
  fill: "#000000",
  textAlign: "center"
};

export const BASE = {
  meta: {
    active: "side1",
    same: false,
    backup: null,

    /* 🔒 STABIL SELECTION */
    lastActiveObjectId: null
  },
  sides: {
    side1: { bg: null, o: [] },
    side2: { bg: null, o: [] }
  }
};

export let state = JSON.parse(JSON.stringify(BASE));

/* ======================================================
   [JS:STATE] SAVE / LOAD
====================================================== */
export function save() {
  if (!canvas) return;

  const active = canvas.getActiveObject();

  state.meta.lastActiveObjectId = active?.objectId || null;

  state.sides[state.meta.active].o =
    canvas.getObjects().map(o => {
      if (!o.objectId) {
        o.objectId = crypto.randomUUID();
      }

      return o.toObject([
        "objectId",

        "fontFamily",
        "fontSize",
        "fontWeight",
        "fontStyle",
        "underline",
        "linethrough",

        "fill",
        "textAlign",

        "_fontChosen",
        "_colorChosen"
      ]);
    });
}

export function load() {
  if (!canvas) return;

  canvas.clear();

  canvas.setBackgroundColor(
    state.sides[state.meta.active].bg || "#ffffff",
    canvas.renderAll.bind(canvas)
  );

  const lastId = state.meta.lastActiveObjectId;

  fabric.util.enlivenObjects(
    state.sides[state.meta.active].o,
    objs => {
      let toSelect = null;

      objs.forEach(o => {
        canvas.add(o);
        if (o.objectId && o.objectId === lastId) {
          toSelect = o;
        }
      });

      if (toSelect) {
        canvas.setActiveObject(toSelect);
      }

      canvas.requestRenderAll();
    }
  );
}

export function resetState() {
  state = JSON.parse(JSON.stringify(BASE));
}