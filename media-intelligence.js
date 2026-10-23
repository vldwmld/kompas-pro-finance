// Media Intelligence: news filter (sentiment, topic, publication window) driving
// the sentiment totals, the line chart and "Artikel Terkait". All data is dummy data.

const SENTIMENTS = [
  { id: "positif", label: "Positif", color: "#6ac322", line: "#6ac322", fill: "#50a718", badge: "positive" },
  { id: "netral", label: "Netral", color: "#057df4", line: "#057df4", fill: "#057df4", badge: "neutral" },
  { id: "negatif", label: "Negatif", color: "#e51c1c", line: "#e51c1c", fill: "#e51c1c", badge: "negative" },
];

const TOPICS = [
  "Bank Digital",
  "Inovasi Teknologi Keuangan",
  "Ekonomi Berkelanjutan",
  "Ekonomi Digital",
  "Investasi Saham",
];

const PERIODS = {
  1: "Hari ini",
  7: "7 hari terakhir",
  14: "14 hari terakhir",
  30: "30 hari terakhir",
};

const DEFAULT_FILTER = { sentiments: SENTIMENTS.map((s) => s.id), topics: [...TOPICS], period: 30 };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const MONTHS_LONG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

// Data window: the 30 days up to the "last updated" date shown on the page.
const END_DATE = new Date(2025, 10, 19);
const DAYS = 30;

const fmt = (n) => n.toLocaleString("id-ID");
const dayDate = (d) => new Date(END_DATE.getFullYear(), END_DATE.getMonth(), END_DATE.getDate() - (DAYS - 1 - d));
const short = (date) => `${date.getDate()} ${MONTHS[date.getMonth()]}`;
const long = (date) => `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;

function esc(text) {
  return String(text).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

// Split an integer total across weights so the parts add up exactly (largest remainder).
function allocate(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map((w) => (total * w) / sum);
  const out = raw.map(Math.floor);
  let left = total - out.reduce((a, b) => a + b, 0);
  raw
    .map((v, i) => [v - Math.floor(v), i])
    .sort((a, b) => b[0] - a[0])
    .slice(0, left)
    .forEach(([, i]) => (out[i] += 1));
  return out;
}

// ---------- Dummy dataset ----------
// counts[sentiment][day][topic], sized so the 30-day totals match the page summary (6.023 articles).

const SENTIMENT_TOTALS = { positif: 4035, netral: 1627, negatif: 361 };
const TOPIC_WEIGHTS = [0.8, 0.95, 1.25, 1.35, 0.9];
const dayWeight = (d) => 1 + 0.3 * Math.sin(d / 4.2) + 0.85 * Math.exp(-(((d - 21) / 2.6) ** 2));
const SENTIMENT_SHAPE = {
  positif: (d) => 1 + 0.25 * Math.sin(d / 3.1),
  netral: (d) => 1 + 0.35 * Math.cos(d / 3.6 + 0.8),
  negatif: (d) => 1 + 0.55 * Math.sin(d / 5 + 1.2),
};

const counts = {};
SENTIMENTS.forEach(({ id }) => {
  const weights = [];
  for (let d = 0; d < DAYS; d += 1) {
    TOPICS.forEach((_, t) => weights.push(dayWeight(d) * TOPIC_WEIGHTS[t] * SENTIMENT_SHAPE[id](d)));
  }
  const flat = allocate(SENTIMENT_TOTALS[id], weights);
  counts[id] = Array.from({ length: DAYS }, (_, d) => flat.slice(d * TOPICS.length, (d + 1) * TOPICS.length));
});

// "Hari ini" is charted in four-hour blocks.
const HOUR_BLOCKS = ["00.00", "04.00", "08.00", "12.00", "16.00", "20.00"];
const HOUR_WEIGHTS = [0.05, 0.08, 0.22, 0.27, 0.24, 0.14];
const hourly = {};
SENTIMENTS.forEach(({ id }) => {
  hourly[id] = TOPICS.map((_, t) => allocate(counts[id][DAYS - 1][t], HOUR_WEIGHTS));
});

const NEWS = [
  ["Paradoks Pertumbuhan Ekonomi Digital Indonesia", "netral", ["Ekonomi Digital"], 29, "bengkulu.pikiran-rakyat.com"],
  ["Perbankan Percepat Transisi Ekonomi Berkelanjutan", "positif", ["Ekonomi Berkelanjutan", "Inovasi Teknologi Keuangan"], 29, "bengkulu.pikiran-rakyat.com"],
  ["Ekonomi Tertekan, Keluarga Hadapi Kerentanan Tinggi", "negatif", ["Ekonomi Berkelanjutan", "Inovasi Teknologi Keuangan", "Ekonomi Digital", "Investasi Saham"], 29, "trenasia.id"],
  ["Bank Digital Catat Lonjakan Nasabah Muda Sepanjang Oktober", "positif", ["Bank Digital", "Ekonomi Digital"], 28, "kontan.co.id"],
  ["OJK Perketat Pengawasan Layanan Paylater Perbankan", "netral", ["Bank Digital", "Inovasi Teknologi Keuangan"], 28, "bisnis.com"],
  ["Investor Asing Kembali Masuk ke Saham Perbankan Besar", "positif", ["Investasi Saham"], 27, "cnbcindonesia.com"],
  ["Serangan Siber Ganggu Layanan Sejumlah Bank Digital", "negatif", ["Bank Digital", "Inovasi Teknologi Keuangan"], 27, "tempo.co"],
  ["Obligasi Hijau Jadi Primadona Investor Institusi", "positif", ["Ekonomi Berkelanjutan", "Investasi Saham"], 26, "investor.id"],
  ["Transaksi QRIS Tumbuh Pesat, UMKM Makin Terdigitalisasi", "positif", ["Ekonomi Digital", "Inovasi Teknologi Keuangan"], 25, "antaranews.com"],
  ["IHSG Melemah Tertekan Aksi Jual Saham Teknologi", "negatif", ["Investasi Saham"], 24, "idxchannel.com"],
  ["Fintech Lending Diminta Perkuat Manajemen Risiko Kredit", "netral", ["Inovasi Teknologi Keuangan"], 24, "katadata.co.id"],
  ["Bank Daerah Mulai Garap Layanan Digital Terintegrasi", "netral", ["Bank Digital"], 23, "republika.co.id"],
  ["Taksonomi Keuangan Berkelanjutan Dorong Pembiayaan Energi Bersih", "positif", ["Ekonomi Berkelanjutan"], 22, "mediaindonesia.com"],
  ["Ekonomi Digital Indonesia Diproyeksikan Terus Tumbuh Dua Digit", "positif", ["Ekonomi Digital"], 21, "kompas.com"],
  ["Saham Bank Digital Bergerak Fluktuatif Jelang Rilis Kinerja", "netral", ["Bank Digital", "Investasi Saham"], 20, "bareksa.com"],
  ["Kredit Macet Pinjaman Daring Naik di Kalangan Pekerja Muda", "negatif", ["Inovasi Teknologi Keuangan", "Ekonomi Digital"], 19, "liputan6.com"],
  ["Bursa Karbon Mulai Menarik Minat Emiten Energi", "positif", ["Ekonomi Berkelanjutan", "Investasi Saham"], 18, "bisnis.com"],
  ["Super-app Perbankan Bersaing Rebut Pengguna Ritel", "netral", ["Bank Digital", "Ekonomi Digital", "Inovasi Teknologi Keuangan"], 17, "detik.com"],
  ["Reksa Dana Saham Kembali Dilirik di Tengah Koreksi Pasar", "positif", ["Investasi Saham"], 16, "kontan.co.id"],
  ["Kesenjangan Literasi Digital Hambat Inklusi Keuangan", "negatif", ["Ekonomi Digital", "Inovasi Teknologi Keuangan"], 15, "tirto.id"],
  ["Bank Syariah Digital Perluas Layanan Pembiayaan Hijau", "positif", ["Bank Digital", "Ekonomi Berkelanjutan"], 14, "republika.co.id"],
  ["Kecerdasan Buatan Bantu Bank Deteksi Penipuan Transaksi", "positif", ["Inovasi Teknologi Keuangan", "Bank Digital"], 12, "cnnindonesia.com"],
  ["Dana Asing Keluar dari Pasar Saham Domestik", "negatif", ["Investasi Saham"], 11, "cnbcindonesia.com"],
  ["Insentif Kendaraan Listrik Dorong Investasi Hijau", "positif", ["Ekonomi Berkelanjutan"], 9, "antaranews.com"],
  ["Penetrasi Asuransi Digital Masih Rendah Meski Tumbuh Pesat", "netral", ["Inovasi Teknologi Keuangan", "Ekonomi Digital"], 7, "investor.id"],
  ["Perdagangan Daring Dorong Penyaluran Kredit Mikro", "positif", ["Ekonomi Digital", "Bank Digital"], 5, "kontan.co.id"],
  ["Laba Bank Digital Tertekan Biaya Akuisisi Nasabah", "negatif", ["Bank Digital"], 3, "bisnis.com"],
  ["Emiten Energi Terbarukan Catat Kenaikan Pendapatan", "positif", ["Ekonomi Berkelanjutan", "Investasi Saham"], 1, "idxchannel.com"],
].map(([title, sentiment, topics, day, source]) => ({ title, sentiment, topics, day, source }));

// ---------- Aggregation ----------

function buckets(period) {
  if (period === 1) {
    return HOUR_BLOCKS.map((label, i) => ({
      label,
      tooltip: `${short(END_DATE)} ${END_DATE.getFullYear()}, ${label}–${HOUR_BLOCKS[i + 1] || "24.00"}`,
      hour: i,
    }));
  }
  const size = { 7: 1, 14: 2, 30: 5 }[period];
  const count = period / size;
  return Array.from({ length: count }, (_, i) => {
    const days = Array.from({ length: size }, (__, k) => DAYS - period + i * size + k);
    const first = dayDate(days[0]);
    const last = dayDate(days[days.length - 1]);
    let tooltip = `${first.getDate()} ${MONTHS[first.getMonth()]} ${first.getFullYear()}`;
    if (size > 1) {
      tooltip = first.getMonth() === last.getMonth()
        ? `${first.getDate()}–${last.getDate()} ${MONTHS[last.getMonth()]} ${last.getFullYear()}`
        : `${short(first)} – ${short(last)} ${last.getFullYear()}`;
    }
    return { label: short(first), tooltip, days };
  });
}

function summarize(filter) {
  const topicIdx = filter.topics.map((t) => TOPICS.indexOf(t));
  const list = buckets(filter.period);
  const series = {};
  SENTIMENTS.forEach(({ id }) => {
    const on = filter.sentiments.includes(id);
    series[id] = list.map((b) => {
      if (!on) return 0;
      if (b.hour !== undefined) return topicIdx.reduce((sum, t) => sum + hourly[id][t][b.hour], 0);
      return b.days.reduce((sum, d) => sum + topicIdx.reduce((s2, t) => s2 + counts[id][d][t], 0), 0);
    });
  });
  const totals = {};
  SENTIMENTS.forEach(({ id }) => (totals[id] = series[id].reduce((a, b) => a + b, 0)));
  totals.total = totals.positif + totals.netral + totals.negatif;
  return { buckets: list, series, totals };
}

function matchingNews(filter) {
  const from = DAYS - filter.period;
  return NEWS.filter(
    (n) => n.day >= from && filter.sentiments.includes(n.sentiment) && n.topics.some((t) => filter.topics.includes(t))
  );
}

// ---------- Chart ----------

function niceStep(raw) {
  const pow = 10 ** Math.floor(Math.log10(raw));
  const f = raw / pow;
  const n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return Math.max(1, n * pow);
}

// Monotone cubic curve through the points (no overshoot below zero).
function monotonePath(xs, ys) {
  const n = xs.length;
  const d = [];
  for (let i = 0; i < n - 1; i += 1) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  const m = [d[0], ...d.slice(1).map((v, i) => (d[i] * v <= 0 ? 0 : (d[i] + v) / 2)), d[n - 2]];
  for (let i = 0; i < n - 1; i += 1) {
    if (d[i] === 0) {
      m[i] = 0;
      m[i + 1] = 0;
    } else {
      const a = m[i] / d[i];
      const b = m[i + 1] / d[i];
      const s = a * a + b * b;
      if (s > 9) {
        const t = 3 / Math.sqrt(s);
        m[i] = t * a * d[i];
        m[i + 1] = t * b * d[i];
      }
    }
  }
  let path = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i += 1) {
    const h = xs[i + 1] - xs[i];
    path += `C${xs[i] + h / 3},${ys[i] + (m[i] * h) / 3},${xs[i + 1] - h / 3},${ys[i + 1] - (m[i + 1] * h) / 3},${xs[i + 1]},${ys[i + 1]}`;
  }
  return path;
}

const chart = {
  root: document.querySelector("[data-mi-chart]"),
  y: document.querySelector("[data-mi-y]"),
  x: document.querySelector("[data-mi-x]"),
  vgrid: document.querySelector("[data-mi-vgrid]"),
  canvas: document.querySelector("[data-mi-canvas]"),
  tooltip: document.querySelector("[data-mi-tooltip]"),
};

function renderChart(summary, filter) {
  const { buckets: list, series } = summary;
  const n = list.length;
  const shown = SENTIMENTS.filter((s) => filter.sentiments.includes(s.id));
  const max = Math.max(1, ...shown.flatMap((s) => series[s.id]));
  const step = niceStep(max / 5);
  const yMax = step * 5;

  chart.y.innerHTML = Array.from({ length: 6 }, (_, i) => `<span>${fmt(yMax - i * step)}</span>`).join("");
  chart.x.innerHTML = list.map((b) => `<span>${esc(b.label)}</span>`).join("");
  chart.vgrid.innerHTML = "<span></span>".repeat(n + 1);

  const W = 1000;
  const H = 1000;
  const xs = list.map((_, i) => ((i + 0.5) / n) * W);
  const toY = (v) => H - (v / yMax) * H;

  let defs = "";
  let paths = "";
  let nodes = "";
  shown.forEach((s) => {
    const ys = series[s.id].map(toY);
    // Run the curve flat to both edges of the plot, as in the design.
    const px = [0, ...xs, W];
    const py = [ys[0], ...ys, ys[ys.length - 1]];
    const line = monotonePath(px, py);
    defs += `<linearGradient id="mi-fill-${s.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s.fill}" stop-opacity="0.3"/><stop offset="1" stop-color="${s.fill}" stop-opacity="0.05"/></linearGradient>`;
    paths += `<path d="${line}L${W},${H}L0,${H}Z" fill="url(#mi-fill-${s.id})"/>`;
    paths += `<path class="line-chart__line" d="${line}" stroke="${s.line}"/>`;
    series[s.id].forEach((v, i) => {
      nodes += `<span class="line-chart__node" style="--node: ${s.color}; left: ${((i + 0.5) / n) * 100}%; top: ${(1 - v / yMax) * 100}%"></span>`;
    });
  });

  const hits = list
    .map((_, i) => `<span class="line-chart__hit" data-bucket="${i}" style="left: ${(i / n) * 100}%; width: ${100 / n}%"></span>`)
    .join("");

  chart.canvas.innerHTML =
    `<span class="line-chart__band" hidden></span>` +
    `<svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true"><defs>${defs}</defs>${paths}</svg>` +
    nodes +
    hits +
    (shown.length ? "" : '<p class="line-chart__empty">Tidak ada data untuk filter ini.</p>');
  chart.tooltip.hidden = true;

  const range = `${list[0].tooltip.split(/ – |–/)[0]} sampai ${list[n - 1].tooltip}`;
  chart.root.setAttribute(
    "aria-label",
    `Grafik sentimen pemberitaan ${range}: ` + SENTIMENTS.map((s) => `${s.label.toLowerCase()} ${fmt(summary.totals[s.id])}`).join(", ") + "."
  );
  chart.summary = summary;
}

function showTooltip(i) {
  const { buckets: list, series } = chart.summary;
  const n = list.length;
  const band = chart.canvas.querySelector(".line-chart__band");
  band.hidden = false;
  band.style.left = `${(i / n) * 100}%`;
  band.style.width = `${100 / n}%`;
  const total = SENTIMENTS.reduce((sum, s) => sum + series[s.id][i], 0);
  chart.tooltip.innerHTML =
    `<span class="line-chart__tooltip-date">${esc(list[i].tooltip)}</span>` +
    `<span class="line-chart__tooltip-row">Total Pemberitaan: <b>${fmt(total)}</b></span>` +
    SENTIMENTS.map(
      (s) => `<span class="line-chart__tooltip-row"><span class="line-chart__tooltip-dot" style="--dot: ${s.color}"></span>${s.label}: <b>${fmt(series[s.id][i])}</b></span>`
    ).join("");
  chart.tooltip.hidden = false;
  // Sit beside the highlighted column, on whichever side has more room.
  if (i < n / 2) {
    chart.tooltip.style.left = `calc(${((i + 1) / n) * 100}% + 8px)`;
    chart.tooltip.style.right = "auto";
  } else {
    chart.tooltip.style.right = `calc(${(1 - i / n) * 100}% + 8px)`;
    chart.tooltip.style.left = "auto";
  }
}

function hideTooltip() {
  chart.tooltip.hidden = true;
  const band = chart.canvas.querySelector(".line-chart__band");
  if (band) band.hidden = true;
}

chart.canvas.addEventListener("pointerover", (event) => {
  const hit = event.target.closest(".line-chart__hit");
  if (hit) showTooltip(Number(hit.dataset.bucket));
});
chart.canvas.addEventListener("click", (event) => {
  const hit = event.target.closest(".line-chart__hit");
  if (hit) showTooltip(Number(hit.dataset.bucket));
});
chart.canvas.addEventListener("pointerleave", hideTooltip);

// ---------- Page state ----------

let applied = structuredClone(DEFAULT_FILTER);
let newsLimit = 10;

const ui = {
  trigger: document.querySelector("[data-filter-open]"),
  triggerIcon: document.querySelector(".filter-trigger__icon"),
  triggerCount: document.querySelector(".filter-trigger__count"),
  triggerLabel: document.querySelector(".filter-trigger__label"),
  chips: document.querySelector("[data-active-filters]"),
  showing: document.querySelector("[data-mi-showing]"),
  updated: document.querySelector("[data-mi-updated]"),
  stats: document.querySelectorAll("[data-mi-stat]"),
  news: document.querySelector("[data-mi-news]"),
  newsCount: document.querySelector("[data-mi-related-count]"),
  more: document.querySelector("[data-mi-more]"),
};

function activeChips(filter) {
  const chips = [];
  if (filter.sentiments.length < SENTIMENTS.length) {
    SENTIMENTS.filter((s) => filter.sentiments.includes(s.id)).forEach((s) => chips.push({ type: "sentiment", value: s.id, label: s.label }));
  }
  if (filter.topics.length < TOPICS.length) {
    TOPICS.filter((t) => filter.topics.includes(t)).forEach((t) => chips.push({ type: "topic", value: t, label: t }));
  }
  if (filter.period !== DEFAULT_FILTER.period) {
    chips.push({ type: "period", value: filter.period, label: PERIODS[filter.period] });
  }
  return chips;
}

function renderNews(filter, total) {
  const items = matchingNews(filter);
  const visible = items.slice(0, newsLimit);
  ui.news.innerHTML = visible.length
    ? visible
        .map(
          (n, i) => `${i ? '<hr class="rule">' : ""}<article class="news-item">
  <div class="news-item__main">
    <span class="badge badge--${SENTIMENTS.find((s) => s.id === n.sentiment).badge}">${SENTIMENTS.find((s) => s.id === n.sentiment).label}</span>
    <h3 class="title-lg"><a class="hover-title" href="#">${esc(n.title)}</a></h3>
    <p class="meta">${long(dayDate(n.day))}</p>
    <a class="source-link" href="#">${esc(n.source)}<img src="assets/finance/icon-external-link.svg" alt=""></a>
  </div>
  <div class="topics">Topik: ${n.topics.map((t) => `<span class="badge">${esc(t)}</span>`).join("")}</div>
</article>`
        )
        .join("")
    : '<p class="news-empty">Belum ada artikel yang sesuai dengan filter ini.</p>';
  ui.newsCount.textContent = `Menampilkan ${fmt(visible.length)} dari ${fmt(total)} pemberitaan`;
  ui.more.hidden = items.length <= visible.length;
}

function render() {
  const summary = summarize(applied);
  const chips = activeChips(applied);

  ui.triggerLabel.textContent = chips.length ? "Filter dipilih" : "Semua sentimen - 30 hari terakhir";
  ui.triggerIcon.hidden = chips.length > 0;
  ui.triggerCount.hidden = chips.length === 0;
  ui.triggerCount.textContent = chips.length;

  ui.chips.hidden = chips.length === 0;
  ui.chips.innerHTML =
    chips
      .map(
        (c) => `<span class="filter-chip">${esc(c.label)}<button type="button" aria-label="Hapus filter ${esc(c.label)}" data-remove-type="${c.type}" data-remove-value="${esc(c.value)}"><img src="assets/finance/icon-close.svg" alt=""></button></span>`
      )
      .join("") + (chips.length ? '<button class="active-filters__clear" type="button" data-clear-filters>Hapus semua</button>' : "");

  ui.showing.textContent = `Menampilkan ${fmt(summary.totals.total)} pemberitaan`;
  ui.updated.hidden = chips.length > 0;
  ui.stats.forEach((el) => (el.textContent = fmt(summary.totals[el.dataset.miStat])));

  renderChart(summary, applied);
  renderNews(applied, summary.totals.total);
}

ui.chips.addEventListener("click", (event) => {
  if (event.target.closest("[data-clear-filters]")) {
    applied = structuredClone(DEFAULT_FILTER);
  } else {
    const button = event.target.closest("[data-remove-type]");
    if (!button) return;
    const { removeType: type, removeValue: value } = button.dataset;
    if (type === "period") {
      applied.period = DEFAULT_FILTER.period;
    } else {
      const key = type === "sentiment" ? "sentiments" : "topics";
      applied[key] = applied[key].filter((v) => v !== value);
      // Removing the last chip of a group means "no restriction" again.
      if (!applied[key].length) applied[key] = [...DEFAULT_FILTER[key]];
    }
  }
  newsLimit = 10;
  render();
});

ui.more.addEventListener("click", (event) => {
  event.preventDefault();
  newsLimit += 10;
  renderNews(applied, summarize(applied).totals.total);
});

// ---------- Filter dialog ----------

const dialog = document.getElementById("news-filter");
const form = dialog.querySelector("form");
const applyButton = dialog.querySelector(".filter-dialog__apply");

function syncGroup(group) {
  const all = form.querySelector(`[data-check-all="${group}"]`);
  const boxes = [...form.querySelectorAll(`input[name="${group}"]`)];
  const checked = boxes.filter((b) => b.checked).length;
  all.checked = checked === boxes.length;
  all.indeterminate = checked > 0 && checked < boxes.length;
  applyButton.disabled = ["sentiment", "topic"].some((g) => !form.querySelector(`input[name="${g}"]:checked`));
}

function openDialog() {
  form.querySelectorAll('input[name="sentiment"]').forEach((b) => (b.checked = applied.sentiments.includes(b.value)));
  form.querySelectorAll('input[name="topic"]').forEach((b) => (b.checked = applied.topics.includes(b.value)));
  form.querySelectorAll('input[name="period"]').forEach((b) => (b.checked = Number(b.value) === applied.period));
  syncGroup("sentiment");
  syncGroup("topic");
  dialog.hidden = false;
  document.body.classList.add("has-dialog");
  form.querySelector("input").focus({ preventScroll: true });
}

function closeDialog() {
  dialog.hidden = true;
  document.body.classList.remove("has-dialog");
  ui.trigger.focus();
}

form.addEventListener("change", (event) => {
  const input = event.target;
  if (input.dataset.checkAll) {
    form.querySelectorAll(`input[name="${input.dataset.checkAll}"]`).forEach((b) => (b.checked = input.checked));
    syncGroup(input.dataset.checkAll);
  } else if (input.name === "sentiment" || input.name === "topic") {
    syncGroup(input.name);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const data = new FormData(form);
  applied = {
    sentiments: data.getAll("sentiment"),
    topics: data.getAll("topic"),
    period: Number(data.get("period")),
  };
  newsLimit = 10;
  render();
  closeDialog();
});

ui.trigger.addEventListener("click", openDialog);
dialog.querySelectorAll("[data-filter-close]").forEach((el) => el.addEventListener("click", closeDialog));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !dialog.hidden) closeDialog();
});

render();
