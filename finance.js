// Shared header and footer for the Kompas Professional Finance member pages.
// Each page marks its slot with data-site-header / data-site-footer, and
// <body data-page="..."> selects the active tab.

const TABS = [
  { id: "beranda", label: "Beranda", href: "beranda.html" },
  { id: "media-intelligence", label: "Media Intelligence", href: "media-intelligence.html" },
  { id: "survei-analisis", label: "Survei dan Analisis", href: "#" },
  { id: "laporan-utama", label: "Laporan Utama", href: "#" },
  { id: "laporan-strategis", label: "Laporan Strategis", href: "laporan-strategis.html" },
  { id: "wawancara-khusus", label: "Wawancara Khusus", href: "#" },
  { id: "dinamika-korporasi", label: "Dinamika Korporasi", href: "dinamika-korporasi.html" },
];

const ICON = {
  phone: '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" transform="translate(96 96) scale(.625)" d="M497.39 361.8l-112-48a24 24 0 0 0-28 6.9l-49.6 60.6A370.66 370.66 0 0 1 130.6 204.11l60.6-49.6a23.94 23.94 0 0 0 6.9-28l-48-112A24.16 24.16 0 0 0 122.6.61l-104 24A24 24 0 0 0 0 48c0 256.5 207.9 464 464 464a24 24 0 0 0 23.4-18.6l24-104a24.29 24.29 0 0 0-14.01-27.6z"/></svg>',
  envelope: '<svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" transform="translate(96 96) scale(.625)" d="M502.3 190.8c3.9-3.1 9.7-.2 9.7 4.7V400c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V195.6c0-5 5.7-7.8 9.7-4.7 22.4 17.4 52.1 39.5 154.1 113.6 21.1 15.4 56.7 47.8 92.2 47.6 35.7.3 72-32.8 92.3-47.6 102-74.1 131.6-96.3 154-113.7zM256 320c23.2.4 56.6-29.2 73.4-41.4 132.7-96.3 142.8-104.7 173.4-128.7 5.8-4.5 9.2-11.5 9.2-18.9v-19c0-26.5-21.5-48-48-48H48C21.5 64 0 85.5 0 112v19c0 7.4 3.4 14.3 9.2 18.9 30.6 23.9 40.7 32.4 173.4 128.7 16.8 12.2 50.2 41.8 73.4 41.4z"/></svg>',
  whatsapp: '<svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" transform="translate(3 3) scale(.7)" d="M16.304 3.61562C14.6205 1.92812 12.3786 1 9.99598 1C5.07812 1 1.07634 5.00179 1.07634 9.91964C1.07634 11.4906 1.48616 13.0254 2.26562 14.3795L1 19L5.72902 17.7585C7.0308 18.4696 8.49732 18.8433 9.99196 18.8433H9.99598C14.9098 18.8433 19 14.8415 19 9.92366C19 7.54107 17.9875 5.30312 16.304 3.61562V3.61562ZM9.99598 17.3406C8.66205 17.3406 7.35625 16.983 6.2192 16.308L5.95 16.1473L3.14554 16.8826L3.89286 14.1464L3.71607 13.8652C2.97277 12.6839 2.58304 11.3219 2.58304 9.91964C2.58304 5.83348 5.90982 2.5067 10 2.5067C11.9808 2.5067 13.8411 3.27812 15.2393 4.68036C16.6375 6.08259 17.4973 7.94286 17.4933 9.92366C17.4933 14.0138 14.0821 17.3406 9.99598 17.3406V17.3406ZM14.0621 11.7879C13.8411 11.6754 12.7442 11.1371 12.5393 11.0647C12.3344 10.9884 12.1857 10.9522 12.0371 11.1772C11.8884 11.4022 11.4625 11.9004 11.3299 12.0531C11.2013 12.2018 11.0688 12.2219 10.8478 12.1094C9.53795 11.4545 8.67813 10.9402 7.81429 9.45759C7.58527 9.06384 8.0433 9.09196 8.4692 8.24018C8.54152 8.09152 8.50536 7.96295 8.44911 7.85045C8.39286 7.73795 7.94688 6.64107 7.76205 6.19509C7.58125 5.76116 7.39643 5.82143 7.25982 5.81339C7.13125 5.80536 6.98259 5.80536 6.83393 5.80536C6.68527 5.80536 6.4442 5.86161 6.23929 6.08259C6.03437 6.30759 5.45982 6.84598 5.45982 7.94286C5.45982 9.03973 6.25938 10.1004 6.36786 10.2491C6.48036 10.3978 7.93884 12.6478 10.1768 13.6161C11.5911 14.2268 12.1455 14.279 12.8527 14.1746C13.2826 14.1103 14.1705 13.6362 14.3554 13.1138C14.5402 12.5915 14.5402 12.1455 14.4839 12.0531C14.4317 11.9527 14.283 11.8964 14.0621 11.7879Z"/></svg>',
  instagram: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect width="20" height="20" rx="4" fill="#c53579"/><rect x="5" y="5" width="10" height="10" rx="3" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="10" cy="10" r="2.4" fill="none" stroke="#fff" stroke-width="1.4"/><circle cx="13.1" cy="6.9" r=".8" fill="#fff"/></svg>',
  youtube: '<svg viewBox="0 0 20 20" aria-hidden="true"><rect width="20" height="20" rx="4" fill="#f44336"/><rect x="4.5" y="6" width="11" height="8" rx="2" fill="#fff"/><path d="M9 8.2v3.6l3-1.8z" fill="#f44336"/></svg>',
};

const MENU_BUTTON = `<button class="menu-button" type="button" aria-label="Menu" aria-controls="side-menu" aria-expanded="false">
          <img src="assets/finance/icon-menu.svg" alt="">
          <span>Menu</span>
        </button>`;

const USER_NAV = `<div class="user-nav">
          <a class="user-nav__bell" href="#" aria-label="Notifikasi">
            <img src="assets/finance/icon-bell.svg" alt="">
          </a>
          <a class="avatar" href="#" aria-label="Akun saya">
            <span class="avatar__circle">
              <img src="assets/finance/avatar-circle.svg" alt="">
              <span class="avatar__initial">C</span>
              <img class="avatar__badge" src="assets/finance/membership.svg" alt="">
            </span>
            <img class="avatar__chevron" src="assets/finance/chevron-down-white.svg" alt="">
          </a>
        </div>`;

function renderHeader(page, overlay) {
  const tabs = TABS.map(
    (tab) =>
      `<a class="tab${tab.id === page ? " is-active" : ""}" href="${tab.href}"${
        tab.id === page ? ' aria-current="page"' : ""
      }>${tab.label}</a>`
  ).join("");

  return `
    <header class="site-header${overlay ? " site-header--overlay" : ""}">
      <div class="container site-header__bar">
        ${MENU_BUTTON}
        <a class="brand" href="beranda.html" aria-label="Kompas Professional Finance — Beranda">
          <img class="brand__top" src="assets/finance/logo-top.svg" alt="">
          <img class="brand__finance" src="assets/finance/logo-finance.svg" alt="">
        </a>
        ${USER_NAV}
      </div>
      ${
        overlay
          ? ""
          : `<nav class="site-tabs" aria-label="Kanal">
        <div class="container site-tabs__inner">
          <div class="site-tabs__list">${tabs}</div>
          <a class="tab tab--kompasid" href="https://www.kompas.id">Kompas.id</a>
        </div>
      </nav>`
      }
    </header>`;
}

// Compact bar that slides in once the full header has scrolled away.
function renderScrolledHeader() {
  return `
    <div class="scrolled-header" inert>
      <div class="container scrolled-header__bar">
        <div class="scrolled-header__start">
          ${MENU_BUTTON}
          <a class="scrolled-header__mark" href="beranda.html" aria-label="Kompas Professional Finance — Beranda">
            <img src="assets/finance/menu-logo-k.svg" alt="">
          </a>
        </div>
        <a class="brand brand--compact" href="beranda.html" aria-label="Kompas Professional Finance — Beranda">
          <img class="brand__top" src="assets/finance/logo-top.svg" alt="">
          <img class="brand__finance" src="assets/finance/logo-finance.svg" alt="">
        </a>
        ${USER_NAV}
      </div>
    </div>`;
}

function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container site-footer__main">
        <div class="site-footer__top">
          <a class="brand-kompasid" href="https://www.kompas.id" aria-label="Kompas.id">
            <img style="left: 15.11%; top: 90.19%; width: 53.49%; height: 9.81%" src="assets/finance/footer-logo-1.svg" alt="">
            <img style="left: 0%; top: 0%; width: 82.46%; height: 76.29%" src="assets/finance/footer-logo-2.svg" alt="">
            <img style="left: 85.19%; top: 0%; width: 14.48%; height: 74.38%" src="assets/icons/kompasid-g2.svg" alt="">
            <img class="is-faded" style="left: 92.43%; top: 37.24%; width: 5.14%; height: 37.14%" src="assets/icons/kompasid-g3.svg" alt="">
            <img class="is-faded" style="left: 92.43%; top: 10.86%; width: 7.25%; height: 26.38%" src="assets/icons/kompasid-g4.svg" alt="">
            <img class="is-faded" style="left: 87.31%; top: 0%; width: 5.12%; height: 37.24%" src="assets/icons/kompasid-g5.svg" alt="">
            <img class="is-faded" style="left: 85.19%; top: 37.24%; width: 7.24%; height: 26.28%" src="assets/icons/kompasid-g6.svg" alt="">
            <img class="is-faded" style="left: 92.43%; top: 37.24%; width: 7.25%; height: 26.28%" src="assets/icons/kompasid-g7.svg" alt="">
            <img class="is-faded" style="left: 92.43%; top: 0%; width: 5.14%; height: 37.24%" src="assets/icons/kompasid-g8.svg" alt="">
            <img class="is-faded" style="left: 85.19%; top: 10.86%; width: 7.24%; height: 26.38%" src="assets/icons/kompasid-g9.svg" alt="">
            <img class="is-faded" style="left: 87.31%; top: 37.24%; width: 5.12%; height: 37.14%" src="assets/icons/kompasid-g10.svg" alt="">
            <img style="left: 87.6%; top: 47.52%; width: 1.62%; height: 8.19%" src="assets/icons/kompasid-g11.svg" alt="">
            <img style="left: 90%; top: 18.95%; width: 7.18%; height: 37.05%" src="assets/icons/kompasid-g12.svg" alt="">
          </a>
          <div class="app-badges">
            <a class="app-badge app-badge--ios" href="#" aria-label="Download di App Store">
              <img style="inset: 0; width: 100%; height: 100%" src="assets/finance/badge-appstore-bg.svg" alt="">
              <img style="left: 8.33%; top: 21.8%; width: 14.81%; height: 54.44%" src="assets/finance/badge-appstore-g14.svg" alt="">
              <img style="left: 28.77%; top: 44.68%; width: 62.73%; height: 39.05%" src="assets/finance/badge-appstore-g15.svg" alt="">
              <img style="left: 29.81%; top: 20.63%; width: 42%; height: 16.33%" src="assets/finance/badge-appstore-g16.svg" alt="">
            </a>
            <a class="app-badge app-badge--android" href="#" aria-label="Temukan di Google Play">
              <img style="left: -10px; top: -9px; width: 153px; height: 58px" src="assets/finance/badge-gplay.png" alt="">
            </a>
          </div>
        </div>

        <div class="site-footer__content">
          <div class="footer-office">
            <div class="footer-block">
              <p class="footer-heading">Kantor Redaksi</p>
              <p class="footer-address">Menara Kompas Lantai 5, Jalan Palmerah Selatan 21, Jakarta Pusat, DKI Jakarta, Indonesia, 10270.</p>
              <div class="footer-phones">
                <b>Tlp.</b>
                <div class="footer-phones__grid">
                  <span>+6221 5347 710</span><span>+6221 5347 720</span>
                  <span>+6221 5347 730</span><span>+6221 530 2200</span>
                </div>
              </div>
            </div>
            <div class="footer-block">
              <p class="footer-heading">Kantor Iklan</p>
              <p class="footer-address">Menara Kompas Lantai 2, Jalan Palmerah Selatan 21, Jakarta Pusat, DKI Jakarta, Indonesia, 10270.</p>
              <div class="footer-phones">
                <b>Tlp.</b>
                <span>+6221 8062 6699</span>
              </div>
            </div>
          </div>

          <div class="footer-links">
            <div class="footer-col footer-col--narrow">
              <p class="footer-heading">Produk</p>
              <a href="#">ePaper</a>
              <a href="https://www.kompas.id">Kompas.Id</a>
              <a href="#">Interaktif</a>
              <a href="#">Kompas Data</a>
              <a href="#">Kompaspedia</a>
            </div>
            <div class="footer-col footer-col--narrow">
              <p class="footer-heading">Bisnis</p>
              <a href="#">Advertorial</a>
              <a href="#">Gerai</a>
              <a href="#">Event</a>
              <a href="#">Klasika</a>
              <a href="#">Klasiloka</a>
              <a href="#">Iklan</a>
            </div>
            <div class="footer-col footer-col--narrow">
              <p class="footer-heading">Tentang</p>
              <a href="#">Profil Perusahaan</a>
              <a href="#">Sejarah</a>
              <a href="#">Organisasi</a>
            </div>
            <div class="footer-col footer-col--narrow">
              <p class="footer-heading">Lainnya</p>
              <a href="#">Bantuan</a>
            </div>
            <div class="footer-col">
              <p class="footer-heading">Layanan Pelanggan</p>
              <div class="contact-item">${ICON.phone}<span>Kompas Kring<b>+6221 2567 6000</b></span></div>
              <div class="contact-item">${ICON.whatsapp}<span>Whatsapp<b>+62812 900 50 800</b></span></div>
              <div class="contact-item">${ICON.envelope}<span>Email<b>hotline@kompas.id</b></span></div>
            </div>
            <div class="footer-col">
              <p class="footer-heading">Ikuti Harian Kompas di</p>
              <div class="social-list">
                <a class="social-item" href="#">${ICON.instagram}@hariankompas</a>
                <a class="social-item" href="#"><img src="assets/finance/social-1.svg" alt="">@hariankompas</a>
                <a class="social-item" href="#"><img src="assets/finance/social-2.svg" alt="">@hariankompas</a>
                <a class="social-item" href="#">${ICON.youtube}Harian Kompas</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="site-footer__bottom">
        <div class="container site-footer__bottom-inner">
          <div class="bottom-links">
            <span>© 2025 PT Kompas Media Nusantara</span>
            <i aria-hidden="true">·</i><a href="#">Organisasi</a>
            <i aria-hidden="true">·</i><a href="#">Tanya Jawab</a>
            <i aria-hidden="true">·</i><a href="#">Hubungi Kami</a>
            <i aria-hidden="true">·</i><a href="#">Sidik Gangguan</a>
            <i aria-hidden="true">·</i><a href="#">Pedoman Media Siber</a>
            <i aria-hidden="true">·</i><a href="#">Syarat &amp; Ketentuan</a>
          </div>
          <div class="bottom-links">
            <a href="#">Karier</a>
            <i aria-hidden="true">·</i><a href="#">Iklan</a>
            <i aria-hidden="true">·</i><a href="#">Berlangganan</a>
          </div>
        </div>
      </div>
    </footer>`;
}

function renderSideMenu() {
  const current = location.pathname.split("/").pop() || "beranda.html";
  const links = TABS.filter((tab) => tab.id !== "beranda")
    .map(
      (tab) =>
        `<a href="${tab.href}"${tab.href === current ? ' aria-current="page"' : ""}>${tab.label}</a>`
    )
    .join("");

  return `
    <div class="side-menu" id="side-menu" aria-hidden="true">
      <div class="side-menu__backdrop" data-side-menu-close></div>
      <nav class="side-menu__panel" aria-label="Menu utama" role="dialog" aria-modal="true">
        <div class="side-menu__head">
          <a href="beranda.html" aria-label="Kompas Professional Finance — Beranda">
            <img class="side-menu__logo" src="assets/finance/menu-logo-k.svg" alt="">
          </a>
          <button class="side-menu__icon-button" type="button" aria-label="Tutup menu" data-side-menu-close>
            <img src="assets/finance/icon-close.svg" alt="">
          </button>
        </div>
        <div class="side-menu__body">
          <div>
            <div class="side-menu__group-head">
              <a class="side-menu__item" href="beranda.html">Finance</a>
              <button class="side-menu__icon-button side-menu__toggle" type="button" aria-label="Tampilkan kanal Finance" aria-expanded="true" aria-controls="side-menu-finance">
                <img class="side-menu__chevron" src="assets/finance/chevron-up-dark.svg" alt="">
              </button>
            </div>
            <div class="side-menu__sub" id="side-menu-finance">${links}</div>
          </div>
          <hr class="side-menu__divider">
          <a class="side-menu__item" href="#">Mining</a>
          <a class="side-menu__item" href="https://www.kompas.id">Kompas.id</a>
        </div>
      </nav>
    </div>`;
}

const page = document.body.dataset.page;

document.querySelectorAll("[data-site-header]").forEach((slot) => {
  slot.outerHTML =
    renderHeader(page, slot.dataset.siteHeader === "overlay") + renderScrolledHeader() + renderSideMenu();
});

const mainHeader = document.querySelector(".site-header");
const scrolledHeader = document.querySelector(".scrolled-header");

function updateScrolledHeader() {
  const show = window.scrollY > mainHeader.offsetHeight;
  scrolledHeader.classList.toggle("is-visible", show);
  scrolledHeader.inert = !show;
}

if (mainHeader && scrolledHeader) {
  updateScrolledHeader();
  window.addEventListener("scroll", updateScrolledHeader, { passive: true });
  window.addEventListener("resize", updateScrolledHeader);
}

// Side menu: opens from either header's Menu button, closes on ×, backdrop or Escape.
const sideMenu = document.getElementById("side-menu");
const menuButtons = document.querySelectorAll(".menu-button");
let menuOpener = menuButtons[0];

function setSideMenu(open) {
  sideMenu.classList.toggle("is-open", open);
  sideMenu.setAttribute("aria-hidden", String(!open));
  menuButtons.forEach((button) => button.setAttribute("aria-expanded", String(open)));
  document.body.classList.toggle("has-side-menu", open);
  if (open) {
    sideMenu.querySelector(".side-menu__icon-button").focus();
  } else {
    menuOpener.focus();
  }
}

if (sideMenu && menuButtons.length) {
  menuButtons.forEach((button) => {
    button.addEventListener("click", () => {
      menuOpener = button;
      setSideMenu(true);
    });
  });
  sideMenu.querySelectorAll("[data-side-menu-close]").forEach((el) => {
    el.addEventListener("click", () => setSideMenu(false));
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && sideMenu.classList.contains("is-open")) setSideMenu(false);
  });

  const toggle = sideMenu.querySelector(".side-menu__toggle");
  const submenu = document.getElementById(toggle.getAttribute("aria-controls"));
  toggle.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    submenu.hidden = expanded;
  });
}

document.querySelectorAll("[data-site-footer]").forEach((slot) => {
  slot.outerHTML = renderFooter();
});

// Keep the active tab visible when the tab strip scrolls on narrow screens.
const activeTab = document.querySelector(".site-tabs__list .tab.is-active");
if (activeTab) {
  const list = activeTab.parentElement;
  list.scrollLeft = activeTab.offsetLeft - (list.clientWidth - activeTab.offsetWidth) / 2;
}
