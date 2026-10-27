// Report Reader Page: reads a PDF report from assets/reports/<id>/.
// The report id comes from ?laporan=<id>, falling back to <body data-report>.
// Pages are laid out from report.json right away and drawn with pdf.js only
// when they come near the screen, so a long report opens quickly.

const PDFJS = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/";
const ZOOM_STEP = 1.25;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;
const MAX_CANVAS = 4096; // longest canvas side, in device pixels
const MOBILE = window.matchMedia("(max-width: 767px)");

const reportId = new URLSearchParams(location.search).get("laporan") || document.body.dataset.report;
const base = `assets/reports/${encodeURIComponent(reportId)}/`;

const viewport = document.getElementById("reader-viewport");
const pagesEl = viewport.querySelector(".reader__pages");
const statusEl = viewport.querySelector(".reader__status");
const thumbsEl = document.getElementById("reader-thumbs");
const thumbsList = thumbsEl.querySelector(".reader-thumbs__list");
const searchForm = document.getElementById("reader-search");
const searchInput = searchForm.querySelector(".reader-search__input");
const searchCount = searchForm.querySelector(".reader-search__count");
const pagerInput = document.querySelector(".reader-pager__input");
const pagerTotal = document.querySelector(".reader-pager__total strong");
const tool = (action) => document.querySelector(`[data-action="${action}"]`);

const state = {
  pdf: null,
  sizes: [],          // [width, height] in PDF points, per page
  images: {},         // page number → image file, for pages pdf.js can't draw faithfully
  layout: "single",   // "single" | "double"
  fitWidth: false,
  zoom: 1,            // multiplier on top of the fit scale
  scale: 1,           // CSS pixels per PDF point
  current: 1,
  pan: false,
  pages: [],          // per page: { el, canvas, hits, task, drawnScale, visible }
  spreads: [],        // arrays of page numbers shown side by side
  text: null,         // plain text per page, loaded on first search
  hits: [],           // search results: page numbers, one per occurrence
  hitIndex: -1,
  query: "",
};

/* ---------- Setup ---------- */

async function init() {
  let report;
  try {
    report = await fetch(base + "report.json").then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    });
  } catch (err) {
    showStatus("Laporan tidak ditemukan.");
    return;
  }

  document.title = `${report.title} — Kompas Professional Finance`;
  state.sizes = report.sizes;
  state.images = report.images || {};
  pagerTotal.textContent = report.sizes.length;
  buildPages();
  buildThumbs();
  relayout();
  showStatus("");

  pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS + "pdf.worker.min.js";
  try {
    // Range requests: only the bytes of the pages being viewed are downloaded.
    state.pdf = await pdfjsLib.getDocument({
      url: base + report.file,
      disableAutoFetch: true,
      disableStream: true,
    }).promise;
  } catch (err) {
    showStatus("Laporan gagal dimuat. Muat ulang halaman ini.");
    return;
  }
  state.pages.forEach((page, i) => { if (page.visible) drawPage(i + 1); });
  thumbsList.querySelectorAll(".reader-thumb").forEach((thumb) => {
    if (thumb.dataset.visible) drawThumb(+thumb.dataset.page);
  });
}

function showStatus(message) {
  statusEl.textContent = message;
  statusEl.hidden = !message;
}

function buildPages() {
  state.pages = state.sizes.map((size, i) => {
    const el = document.createElement("div");
    el.className = "reader-page";
    el.dataset.page = i + 1;
    el.setAttribute("aria-label", `Halaman ${i + 1}`);
    const canvas = document.createElement("canvas");
    const hits = document.createElement("div");
    hits.className = "reader-page__hits";
    el.append(canvas, hits);
    pageObserver.observe(el);
    return { el, canvas, hits, task: null, drawnScale: 0, visible: false };
  });
}

function buildSpreads() {
  const count = state.sizes.length;
  const spreads = [];
  if (state.layout === "double") {
    // The cover stands alone, then pages pair up like an open book.
    spreads.push([1]);
    for (let p = 2; p <= count; p += 2) spreads.push(p + 1 <= count ? [p, p + 1] : [p]);
  } else {
    for (let p = 1; p <= count; p++) spreads.push([p]);
  }
  state.spreads = spreads;

  pagesEl.replaceChildren(...spreads.map((spread) => {
    const row = document.createElement("div");
    row.className = "reader-spread";
    spread.forEach((p) => row.append(state.pages[p - 1].el));
    return row;
  }));
}

/* ---------- Layout and zoom ---------- */

function fitScale() {
  const style = getComputedStyle(pagesEl);
  const padX = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  const padY = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
  const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--reader-page-gap")) || 8;
  const width = viewport.clientWidth - padX;
  const height = viewport.clientHeight - padY;
  // The widest spread sets one scale for every page.
  let byWidth = Infinity;
  let pageHeight = 0;
  state.spreads.forEach((spread) => {
    const points = spread.reduce((sum, p) => sum + state.sizes[p - 1][0], 0);
    byWidth = Math.min(byWidth, (width - (spread.length - 1) * gap) / points);
    spread.forEach((p) => { pageHeight = Math.max(pageHeight, state.sizes[p - 1][1]); });
  });
  return state.fitWidth ? byWidth : Math.min(byWidth, height / pageHeight);
}

function relayout() {
  const keep = state.current;
  if (!state.spreads.length || state.spreads.flat().length !== state.sizes.length) buildSpreads();
  state.scale = fitScale() * state.zoom;
  state.pages.forEach((page, i) => {
    const [w, h] = state.sizes[i];
    page.el.style.width = `${w * state.scale}px`;
    page.el.style.height = `${h * state.scale}px`;
  });
  goTo(keep);
  scheduleRedraw();
}

function setLayout(layout) {
  if (state.layout === layout) return;
  state.layout = layout;
  buildSpreads();
  shownPage = 0;
  updateTools();
  relayout();
}

function setZoom(zoom) {
  state.zoom = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom));
  updateTools();
  relayout();
}

let redrawTimer = 0;
function scheduleRedraw() {
  clearTimeout(redrawTimer);
  // Pages stretch with CSS straight away; sharp redraws follow once zooming settles.
  redrawTimer = setTimeout(() => {
    state.pages.forEach((page, i) => { if (page.visible) drawPage(i + 1); });
  }, 150);
}

/* ---------- Drawing ---------- */

const pageObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const index = +entry.target.dataset.page - 1;
    const page = state.pages[index];
    page.visible = entry.isIntersecting;
    if (entry.isIntersecting) drawPage(index + 1);
    else releasePage(page);
  });
}, { root: viewport, rootMargin: "150% 0px" });

function drawImagePage(page, number) {
  if (page.drawnScale) return;
  const img = new Image();
  img.className = "reader-page__image";
  img.alt = "";
  img.src = base + state.images[number];
  page.canvas.replaceWith(img);
  page.canvas = img;
  page.drawnScale = Infinity; // an image scales with the page, so it never needs redrawing
  page.el.classList.add("is-drawn");
  if (state.query) markHits(number);
}

async function drawPage(number) {
  const page = state.pages[number - 1];
  if (!page.visible) return;
  if (state.images[number]) {
    drawImagePage(page, number);
    return;
  }
  if (!state.pdf) return;
  const ratio = window.devicePixelRatio || 1;
  const [w, h] = state.sizes[number - 1];
  const scale = Math.min(state.scale * ratio, MAX_CANVAS / Math.max(w, h));
  if (page.drawnScale === scale) return;
  if (page.task) page.task.cancel();

  try {
    const pdfPage = await state.pdf.getPage(number);
    const view = pdfPage.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(view.width);
    canvas.height = Math.round(view.height);
    page.task = pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport: view });
    await page.task.promise;
    page.task = null;
    if (!page.visible) return;
    // Swap in the finished canvas so the old one stays on screen while drawing.
    page.canvas.replaceWith(canvas);
    page.canvas = canvas;
    page.drawnScale = scale;
    page.el.classList.add("is-drawn");
    if (state.query) markHits(number);
  } catch (err) {
    page.task = null;
    if (err && err.name !== "RenderingCancelledException") console.error(err);
  }
}

function releasePage(page) {
  if (page.task) page.task.cancel();
  page.task = null;
  if (!page.drawnScale || page.drawnScale === Infinity) return;
  // Free canvas memory for pages far from the screen.
  page.canvas.width = 0;
  page.canvas.height = 0;
  page.drawnScale = 0;
  page.el.classList.remove("is-drawn");
}

/* ---------- Page navigation ---------- */

function spreadOf(number) {
  return state.spreads.findIndex((spread) => spread.includes(number));
}

function goTo(number) {
  const count = state.sizes.length;
  number = Math.min(count, Math.max(1, Math.round(number) || 1));
  const row = pagesEl.children[spreadOf(number)];
  if (!row) return;
  const top = row.offsetTop - parseFloat(getComputedStyle(pagesEl).paddingTop);
  const left = (pagesEl.scrollWidth - viewport.clientWidth) / 2;
  viewport.scrollTo(Math.max(0, left), Math.max(0, top));
  setCurrent(number);
}

function step(direction) {
  const index = spreadOf(state.current) + direction;
  const spread = state.spreads[Math.min(state.spreads.length - 1, Math.max(0, index))];
  goTo(spread[0]);
}

let shownPage = 0;
function setCurrent(number) {
  state.current = number;
  if (shownPage === number) return;
  shownPage = number;
  pagerInput.value = number;
  tool("prev").disabled = spreadOf(number) <= 0;
  tool("next").disabled = spreadOf(number) >= state.spreads.length - 1;
  const active = thumbsList.querySelector(".reader-thumb.is-active");
  if (active) active.classList.remove("is-active");
  const thumb = thumbsList.children[number - 1];
  if (thumb) {
    thumb.classList.add("is-active");
    if (!thumbsEl.hidden) keepThumbInView(thumb);
  }
}

let scrollFrame = 0;
viewport.addEventListener("scroll", () => {
  cancelAnimationFrame(scrollFrame);
  scrollFrame = requestAnimationFrame(() => {
    // The current page is the first spread still covering the upper part of the screen.
    const line = viewport.scrollTop + viewport.clientHeight * 0.4;
    const rows = pagesEl.children;
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].offsetTop + rows[i].offsetHeight > line) {
        setCurrent(state.spreads[i][0]);
        break;
      }
    }
  });
});

/* ---------- Page list ---------- */

const thumbObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.dataset.visible = "1";
    drawThumb(+entry.target.dataset.page);
  });
}, { root: thumbsEl, rootMargin: "100% 0px" });

function buildThumbs() {
  thumbsList.replaceChildren(...state.sizes.map(([w, h], i) => {
    const thumb = document.createElement("button");
    thumb.type = "button";
    thumb.className = "reader-thumb";
    thumb.dataset.page = i + 1;
    thumb.setAttribute("aria-label", `Halaman ${i + 1}`);
    thumb.innerHTML = `<span class="reader-thumb__image" style="aspect-ratio: ${w} / ${h}"></span><span class="reader-thumb__number">${i + 1}</span>`;
    thumb.addEventListener("click", () => {
      goTo(i + 1);
      if (MOBILE.matches) toggleThumbs(false);
    });
    thumbObserver.observe(thumb);
    return thumb;
  }));
}

async function drawThumb(number) {
  const thumb = thumbsList.children[number - 1];
  if (thumb.dataset.drawn) return;
  if (state.images[number]) {
    thumb.dataset.drawn = "1";
    const img = new Image();
    img.alt = "";
    img.src = base + state.images[number];
    thumb.querySelector(".reader-thumb__image").append(img);
    return;
  }
  if (!state.pdf) return;
  thumb.dataset.drawn = "1";
  try {
    const pdfPage = await state.pdf.getPage(number);
    const width = thumb.querySelector(".reader-thumb__image").clientWidth || 140;
    const scale = (width * (window.devicePixelRatio || 1)) / state.sizes[number - 1][0];
    const view = pdfPage.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(view.width);
    canvas.height = Math.round(view.height);
    await pdfPage.render({ canvasContext: canvas.getContext("2d"), viewport: view }).promise;
    thumb.querySelector(".reader-thumb__image").append(canvas);
  } catch (err) {
    delete thumb.dataset.drawn;
  }
}

function keepThumbInView(thumb) {
  const top = thumb.offsetTop - thumbsEl.offsetTop;
  if (top < thumbsEl.scrollTop || top + thumb.offsetHeight > thumbsEl.scrollTop + thumbsEl.clientHeight) {
    thumbsEl.scrollTop = top - thumbsEl.clientHeight / 2 + thumb.offsetHeight / 2;
  }
}

function toggleThumbs(open = thumbsEl.hidden) {
  thumbsEl.hidden = !open;
  tool("thumbs").setAttribute("aria-pressed", String(open));
  if (open) {
    const thumb = thumbsList.children[state.current - 1];
    if (thumb) keepThumbInView(thumb);
  }
  if (!MOBILE.matches) relayout();
}

/* ---------- Search ---------- */

function normalize(value) {
  return value.toLocaleLowerCase("id").replace(/­/g, "").replace(/\s+/g, " ");
}

async function loadText() {
  if (!state.text) {
    const text = await fetch(base + "text.json").then((r) => r.json());
    state.text = text.map(normalize);
  }
  return state.text;
}

async function runSearch() {
  const query = normalize(searchInput.value.trim());
  if (query === state.query) return;
  state.query = query;
  state.hits = [];
  state.hitIndex = -1;
  clearHits();
  if (query.length < 2) {
    searchCount.textContent = "";
    return;
  }
  const text = await loadText();
  if (query !== state.query) return;
  text.forEach((pageText, i) => {
    let at = pageText.indexOf(query);
    while (at !== -1) {
      state.hits.push(i + 1);
      at = pageText.indexOf(query, at + query.length);
    }
  });
  if (!state.hits.length) {
    searchCount.textContent = "Tidak ditemukan";
    return;
  }
  // Start from the first result at or after the page being read.
  const from = state.hits.findIndex((p) => p >= state.current);
  showHit(from === -1 ? 0 : from);
  state.pages.forEach((page, i) => { if (page.drawnScale) markHits(i + 1); });
}

function showHit(index) {
  const total = state.hits.length;
  if (!total) return;
  state.hitIndex = (index + total) % total;
  searchCount.textContent = `${state.hitIndex + 1} dari ${total}`;
  goTo(state.hits[state.hitIndex]);
}

const textCache = new Map();
async function markHits(number) {
  const page = state.pages[number - 1];
  page.hits.replaceChildren();
  const query = state.query;
  if (!query || !state.hits.includes(number) || !state.pdf) return;

  if (!textCache.has(number)) {
    const pdfPage = await state.pdf.getPage(number);
    const content = await pdfPage.getTextContent();
    textCache.set(number, { content, view: pdfPage.getViewport({ scale: 1 }) });
  }
  if (query !== state.query) return;
  const { content, view } = textCache.get(number);
  const [w, h] = state.sizes[number - 1];

  // Mark matches inside each text run, placed in percentages so they follow zoom.
  content.items.forEach((item) => {
    const str = normalize(item.str || "");
    if (!str) return;
    let at = str.indexOf(query);
    while (at !== -1) {
      const t = pdfjsLib.Util.transform(view.transform, item.transform);
      const fontHeight = Math.hypot(t[2], t[3]);
      const left = t[4] + item.width * (at / str.length);
      const width = item.width * (query.length / str.length);
      const mark = document.createElement("span");
      mark.className = "reader-hit";
      mark.style.left = `${(left / w) * 100}%`;
      mark.style.top = `${((t[5] - fontHeight) / h) * 100}%`;
      mark.style.width = `${(width / w) * 100}%`;
      mark.style.height = `${(fontHeight * 1.2 / h) * 100}%`;
      page.hits.append(mark);
      at = str.indexOf(query, at + query.length);
    }
  });
}

function clearHits() {
  state.pages.forEach((page) => page.hits.replaceChildren());
}

function toggleSearch(open = searchForm.hidden) {
  searchForm.hidden = !open;
  tool("search").setAttribute("aria-pressed", String(open));
  if (open) {
    searchInput.focus();
    searchInput.select();
  } else {
    searchInput.value = "";
    runSearch();
    viewport.focus({ preventScroll: true });
  }
}

let searchTimer = 0;
searchInput.addEventListener("input", () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(runSearch, 250);
});
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  clearTimeout(searchTimer);
  const query = normalize(searchInput.value.trim());
  if (query !== state.query) await runSearch();
  else showHit(state.hitIndex + 1);
});
searchForm.querySelectorAll("[data-step]").forEach((button) => {
  button.addEventListener("click", () => showHit(state.hitIndex + Number(button.dataset.step)));
});
searchForm.querySelector(".reader-search__close").addEventListener("click", () => toggleSearch(false));

/* ---------- Drag to move ---------- */

let drag = null;
viewport.addEventListener("pointerdown", (event) => {
  if (!state.pan || event.pointerType !== "mouse" || event.button !== 0) return;
  drag = { x: event.clientX, y: event.clientY, left: viewport.scrollLeft, top: viewport.scrollTop };
  viewport.setPointerCapture(event.pointerId);
  viewport.classList.add("is-dragging");
  event.preventDefault();
});
viewport.addEventListener("pointermove", (event) => {
  if (!drag) return;
  viewport.scrollLeft = drag.left - (event.clientX - drag.x);
  viewport.scrollTop = drag.top - (event.clientY - drag.y);
});
["pointerup", "pointercancel"].forEach((type) => viewport.addEventListener(type, () => {
  drag = null;
  viewport.classList.remove("is-dragging");
}));

/* ---------- Toolbar ---------- */

function updateTools() {
  tool("single").setAttribute("aria-pressed", String(state.layout === "single"));
  tool("double").setAttribute("aria-pressed", String(state.layout === "double"));
  tool("fit").setAttribute("aria-pressed", String(state.fitWidth));
  tool("pan").setAttribute("aria-pressed", String(state.pan));
  tool("zoom-in").disabled = state.zoom >= ZOOM_MAX;
  tool("zoom-out").disabled = state.zoom <= ZOOM_MIN;
  viewport.classList.toggle("is-pan", state.pan);
}

const actions = {
  thumbs: () => toggleThumbs(),
  double: () => setLayout("double"),
  single: () => setLayout("single"),
  "zoom-in": () => setZoom(state.zoom * ZOOM_STEP),
  "zoom-out": () => setZoom(state.zoom / ZOOM_STEP),
  pan: () => { state.pan = !state.pan; updateTools(); },
  prev: () => step(-1),
  next: () => step(1),
  fit: () => { state.fitWidth = !state.fitWidth; state.zoom = 1; updateTools(); relayout(); },
  search: () => toggleSearch(),
};
document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => actions[button.dataset.action]());
});

pagerInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    goTo(Number(pagerInput.value));
    pagerInput.blur();
  }
});
pagerInput.addEventListener("blur", () => { pagerInput.value = state.current; });
pagerInput.addEventListener("focus", () => pagerInput.select());

document.addEventListener("keydown", (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleSearch(true);
    return;
  }
  if (event.key === "Escape" && !searchForm.hidden) {
    toggleSearch(false);
    return;
  }
  if (event.target.closest("input")) return;
  if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); step(1); }
  if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); step(-1); }
  if (event.key === "+" || event.key === "=") setZoom(state.zoom * ZOOM_STEP);
  if (event.key === "-") setZoom(state.zoom / ZOOM_STEP);
});

// Trackpad pinch arrives as ctrl + wheel.
viewport.addEventListener("wheel", (event) => {
  if (!event.ctrlKey) return;
  event.preventDefault();
  setZoom(state.zoom * Math.exp(-event.deltaY / 200));
}, { passive: false });

let resizeTimer = 0;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (MOBILE.matches && state.layout === "double") setLayout("single");
    else relayout();
  }, 100);
});

updateTools();
init();
