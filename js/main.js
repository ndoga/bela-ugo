// ===== Impostazioni =====
// Numero WhatsApp (cellulare, con prefisso 39, solo cifre, es. "393331234567").
// Se lasciato vuoto il modulo di prenotazione resta nascosto e si prenota per telefono.
const WHATSAPP_NUMBER = "";

// Orari di apertura (0 = domenica). Usati per l'indicatore "Aperto ora".
// Ogni fascia è [apertura, chiusura] in formato "HH:MM"; "24:00" = mezzanotte.
const OPENING_HOURS = {
  0: [["07:00", "12:30"], ["16:00", "24:00"]],
  1: [["06:30", "14:00"], ["16:00", "19:30"]],
  2: [["06:30", "14:00"], ["16:00", "19:30"]],
  3: [["06:30", "14:00"], ["16:00", "19:30"]],
  4: [["06:30", "14:00"], ["16:00", "22:00"]],
  5: [["06:30", "14:00"], ["16:00", "23:00"]],
  6: [["07:00", "12:30"], ["16:00", "24:00"]],
};

// ----- Navigazione -----
const nav = document.querySelector(".nav");
const toggle = document.querySelector(".nav__toggle");

const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open);
});
document.querySelectorAll(".nav__links a").forEach((a) =>
  a.addEventListener("click", () => {
    nav.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  })
);

// ----- Comparsa degli elementi durante lo scroll -----
const revealGroups = [
  ".feature", ".about__image", ".about__text", ".chalkboard", ".review",
  ".hours__grid > *", ".contacts__grid > *", ".booking__intro", ".reviews__sub",
];
const revealObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add("is-visible");
      revealObserver.unobserve(el);
      // a comparsa finita si tolgono le classi, così tornano gli effetti al passaggio del mouse
      const done = (e) => {
        if (e.target !== el) return;
        el.classList.remove("reveal", "is-visible");
        el.removeEventListener("transitionend", done);
      };
      el.addEventListener("transitionend", done);
    }),
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
);
revealGroups.forEach((selector) =>
  document.querySelectorAll(selector).forEach((el, i) => {
    el.classList.add("reveal");
    el.style.setProperty("--d", `${(i % 4) * 0.12}s`); // elementi affiancati compaiono a cascata
    revealObserver.observe(el);
  })
);

// ----- Cameriera: entra da sinistra col titolo sul vassoio, lo serve al centro ed esce a destra -----
const lane = document.querySelector(".waitress-lane");
const waitress = lane.querySelector(".waitress");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const SERVE_MS = 2400;
const SMALL = 0.3; // dimensione del titolo mentre è sul vassoio
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const serve = async (heading) => {
  const box = heading.getBoundingClientRect();
  // se nel frattempo il titolo è uscito dallo schermo lo mostriamo e basta
  if (box.bottom < 0 || box.top > window.innerHeight) {
    heading.classList.remove("to-serve");
    return;
  }
  const range = document.createRange();
  range.selectNodeContents(heading);
  const text = range.getBoundingClientRect(); // ingombro del solo testo
  const cx = text.left + text.width / 2;
  const cy = text.top + text.height / 2;

  // misure del vassoio dentro il disegno (viewBox 140x210, vassoio a x=100, y=48)
  const w = waitress.offsetWidth;
  const trayX = (w * 100) / 140;
  const trayY = (w * 48) / 140;
  const padTop = parseFloat(getComputedStyle(lane).paddingTop);
  lane.style.top = `${window.scrollY + cy + (text.height * SMALL) / 2 - trayY - padTop}px`;

  const startX = -w - 20;
  const stopX = cx - trayX;
  const endX = window.innerWidth + 20;
  heading.style.transformOrigin = `${cx - box.left}px ${cy - box.top}px`;

  lane.classList.add("is-active");
  waitress.classList.add("is-walking");
  heading.classList.remove("to-serve");

  waitress.animate(
    [
      { transform: `translateX(${startX}px)`, easing: "cubic-bezier(.25,.6,.4,1)" },
      { transform: `translateX(${stopX}px)`, offset: 0.4 },
      { transform: `translateX(${stopX}px)`, offset: 0.62, easing: "cubic-bezier(.5,0,.8,.5)" },
      { transform: `translateX(${endX}px)` },
    ],
    { duration: SERVE_MS, fill: "both" }
  );
  heading.animate(
    [
      { transform: `translateX(${startX - stopX}px) scale(${SMALL})`, easing: "cubic-bezier(.25,.6,.4,1)" },
      { transform: `translateX(0) scale(${SMALL})`, offset: 0.4, easing: "cubic-bezier(.3,.7,.3,1)" },
      { transform: "translateY(-14px) scale(1.06)", offset: 0.56 },
      { transform: "none", offset: 0.66 },
      { transform: "none" },
    ],
    { duration: SERVE_MS }
  );

  await wait(SERVE_MS * 0.4);
  waitress.classList.replace("is-walking", "is-serving");
  await wait(SERVE_MS * 0.22);
  waitress.classList.replace("is-serving", "is-walking");
  await wait(SERVE_MS * 0.38);
  waitress.classList.remove("is-walking");
  lane.classList.remove("is-active");
};

// un titolo alla volta
const serveQueue = [];
let serving = false;
const runQueue = async () => {
  if (serving) return;
  serving = true;
  while (serveQueue.length) await serve(serveQueue.shift());
  serving = false;
};
const serveObserver = new IntersectionObserver(
  (entries) =>
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      serveObserver.unobserve(entry.target);
      serveQueue.push(entry.target);
      runQueue();
    }),
  { threshold: 1, rootMargin: "0px 0px -15% 0px" }
);
if (!reduceMotion) {
  document.querySelectorAll("section:not(.hero) h2").forEach((h) => {
    h.classList.add("to-serve");
    serveObserver.observe(h);
  });
}

// ----- Tab del menù -----
const tabs = document.querySelectorAll(".tab");
tabs.forEach((tab) =>
  tab.addEventListener("click", () => {
    tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
    document.querySelectorAll(".menu__panel").forEach((p) =>
      p.classList.toggle("is-active", p.id === tab.dataset.tab)
    );
  })
);

// ----- Orari: evidenzia oggi e mostra se è aperto -----
const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};
const now = new Date();
const today = now.getDay();
document.querySelector(`.hours__table tr[data-day="${today}"]`)?.classList.add("is-today");

const minutesNow = now.getHours() * 60 + now.getMinutes();
const isOpen = OPENING_HOURS[today].some(
  ([from, to]) => minutesNow >= toMinutes(from) && minutesNow < toMinutes(to)
);
const status = document.getElementById("open-status");
status.textContent = isOpen ? "Aperto adesso" : "Chiuso in questo momento";
status.classList.add(isOpen ? "open" : "closed");

// ----- Prenotazione via WhatsApp -----
const form = document.getElementById("booking-form");
form.hidden = !WHATSAPP_NUMBER;
const dateInput = document.getElementById("b-date");
dateInput.min = now.toISOString().split("T")[0];

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const data = new FormData(form);
  const date = new Date(data.get("date") + "T00:00").toLocaleDateString("it-IT", {
    weekday: "long", day: "numeric", month: "long",
  });
  let msg =
    `Ciao! Vorrei prenotare un tavolo.\n` +
    `Nome: ${data.get("name")}\n` +
    `Data: ${date}\n` +
    `Ora: ${data.get("time")}\n` +
    `Persone: ${data.get("people")}`;
  if (data.get("notes").trim()) msg += `\nNote: ${data.get("notes").trim()}`;
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
});

document.getElementById("year").textContent = now.getFullYear();
