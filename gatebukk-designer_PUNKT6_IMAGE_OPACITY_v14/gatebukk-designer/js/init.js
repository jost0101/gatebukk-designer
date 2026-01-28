/* ======================================================
   [JS:INIT] INITIAL LOAD
====================================================== */
import { load } from "./state.js";
import { syncBackgroundUI } from "./ui-sync.js";

let didInit = false;

function init() {
  if (didInit) return;
  didInit = true;

  document.dispatchEvent(new Event("app:init"));

  load();
  syncBackgroundUI();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}