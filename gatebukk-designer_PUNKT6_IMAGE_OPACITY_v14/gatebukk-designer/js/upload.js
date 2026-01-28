/* ======================================================
   [JS:UPLOAD] IMAGE UPLOAD
====================================================== */
import { canvas, W, H } from "./canvas.js";
import { save } from "./state.js";

let upload;

document.addEventListener("app:init", () => {
  upload = document.getElementById("upload");
  if (!upload) return;

  upload.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = ev => {
      fabric.Image.fromURL(ev.target.result, img => {
        const scale = Math.min(W / img.width, H / img.height, 1);

        img.set({
          originX: "center",
          originY: "center",
          left: W / 2,
          top: H / 2,
          scaleX: scale,
          scaleY: scale
        });

        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        save();
      });
    };

    reader.readAsDataURL(file);
  };
});