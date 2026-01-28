/* ======================================================
   [JS:SIDE] SIDE SWITCHING + SAME DESIGN
====================================================== */
import { state, save, load } from "./state.js";
import { syncBackgroundUI } from "./ui-sync.js";

let side1;
let side2;
let sameDesign;

document.addEventListener("app:init", () => {
  side1 = document.getElementById("side1");
  side2 = document.getElementById("side2");
  sameDesign = document.getElementById("sameDesign");

  if (!side1 || !side2 || !sameDesign) return;

  side1.onclick = () => switchSide("side1");

  side2.onclick = () => {
    if (state.meta.same) return;
    switchSide("side2");
  };

  /* ======================================================
     [JS:SAME] SAME DESIGN TOGGLE
  ====================================================== */
  sameDesign.onchange = () => {
    save();

    if (sameDesign.checked) {
      state.meta.lastActive = state.meta.active;
      state.meta.backup = JSON.parse(JSON.stringify(state.sides.side2));
      state.meta.same = true;

      state.sides.side2 = JSON.parse(JSON.stringify(state.sides.side1));
      side2.classList.add("disabled");

      state.meta.active = "side1";
      load();
    } else {
      state.meta.same = false;

      if (state.meta.backup) {
        state.sides.side2 = JSON.parse(JSON.stringify(state.meta.backup));
      }

      side2.classList.remove("disabled");

      if (state.meta.lastActive === "side2") {
        state.meta.active = "side2";
      }

      load();
    }

    syncBackgroundUI();
  };
});

export function switchSide(side, options = {}) {
  if (!side1 || !side2) return;

  if (!options.skipSave) {
    save();
  }

  state.meta.active = side;
  load();

  side1.classList.toggle("active", side === "side1");
  side2.classList.toggle("active", side === "side2");

  syncBackgroundUI();
}