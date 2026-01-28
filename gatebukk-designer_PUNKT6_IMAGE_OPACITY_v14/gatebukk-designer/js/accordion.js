document.addEventListener("app:init", () => {
  /* ======================================================
     [JS:ACCORDION] SECTION TOGGLES
  ====================================================== */
  const toggles = document.querySelectorAll(".section-title.toggle");

  toggles.forEach(t => {
    t.onclick = () => {
      const targetId = t.dataset.target;
      const body = document.getElementById(targetId);
      if (!body) return;

      const isOpen = body.classList.contains("open");

      toggles.forEach(other => {
        const otherBody = document.getElementById(other.dataset.target);
        if (!otherBody) return;

        otherBody.classList.remove("open");
        other.classList.remove("open");

        const chev = other.querySelector(".chevron");
        if (chev) chev.textContent = "▾";
      });

      if (!isOpen) {
        body.classList.add("open");
        t.classList.add("open");

        const chev = t.querySelector(".chevron");
        if (chev) chev.textContent = "▴";
      }
    };
  });
});