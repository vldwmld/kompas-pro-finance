// Feature accordion: one item open at a time.
document.querySelectorAll("[data-accordion]").forEach((accordion) => {
  const items = Array.from(accordion.querySelectorAll(".accordion__item"));

  const setOpen = (item, open) => {
    const trigger = item.querySelector(".accordion__trigger");
    const panel = item.querySelector(".accordion__panel");
    item.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    panel.hidden = !open;
  };

  items.forEach((item) => {
    item.querySelector(".accordion__trigger").addEventListener("click", () => {
      const willOpen = !item.classList.contains("is-open");
      items.forEach((other) => setOpen(other, false));
      if (willOpen) setOpen(item, true);
    });
  });
});
