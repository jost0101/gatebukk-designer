/* ======================================================
   [JS:TEXT] TEXT CREATION
====================================================== */
import { canvas, W, H } from "./canvas.js";
import { UI_DEFAULTS, save } from "./state.js";

let addText;

document.addEventListener("app:init", () => {
  addText = document.getElementById("addText");
  if (!addText) return;

  addText.onclick = () => {
    const text = new fabric.Textbox("Din tekst", {
      left: W / 2,
      top: H / 2,
      originX: "center",
      originY: "center",
      fontFamily: UI_DEFAULTS.fontFamily,
      fill: UI_DEFAULTS.fill,
      textAlign: UI_DEFAULTS.textAlign,
      fontSize: 22,
      fontWeight: "normal",
      fontStyle: "normal",
      underline: false,
      linethrough: false
    });

    text._fontChosen = false;
    text._colorChosen = false;

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.requestRenderAll();
    save();
  };
});
