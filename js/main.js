
const STAFF = [
  {
    pos: "Министр обороны Кутузовского Федерального округа",
    name: "Брежнев Дмитрий Сергеевич",
    photo: "img/minister.png",
    rank: "Генерал-лейтенант",
    since: "17 сентября 2026 года",
    quote: "Уважаемые жители Кутузовского федерального округа, военнослужащие и ветераны! Министерство обороны округа стоит на страже мира и безопасности нашей земли. Мы последовательно укрепляем боеготовность частей, модернизируем технику и вооружение, заботимся о каждом военнослужащем и его семье. Наша сила — в людях. Поэтому особое внимание уделяем подготовке кадров, социальным гарантиям, жилищному обеспечению и открытому диалогу с гражданами. Каждое обращение будет рассмотрено.",
    bg: "star",
    awards: [
      {
        n: "Орден Мужества",
        date: "18.09.2026",
        img: "",
        d: "За мужество, решительность и высокий профессионализм, проявленные при исполнении служебных обязанностей, связанных с обеспечением обороны и безопасности государства.",
      },
    ],
  },
  {
    pos: "1-й Заместитель министра обороны Кутузовского Федерального округа",
    name: "Брагин Александр Евгеньевич",
    photo: "img/zaminister.png",
    rank: "Полковник",
    since: "17 октября 2026 года",
    quote: "",
    bg: "tank",
    awards: [],
  },
    {
    pos: "Заместитель министра обороны Кутузовского Федерального округа",
    name: "Невский Альфредо Максимович",
    photo: "img/zam.png",
    rank: "Полковник",
    since: "29 октября 2026 года",
    quote: "",
    bg: "radar",
    awards: [],
  },
    {
    pos: "Помощник министра обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "crosshair",
    awards: [],
  },
    {
    pos: "Помощник министра обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "shield",
    awards: [],
  },
    {
    pos: "Помощник министра обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "ammo",
    awards: [],
  },
  {
    pos: "Пресс-секретарь министра обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "mic",
    awards: [],
  },
  {
    pos: "Руководитель пресс-службы министерства обороны Кутузовского Федерального округа",
    name: "Токин Евгений Степанович",
    photo: "",
    rank: "",
    since: "27 октября 2026 года",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Заместитель руководителя пресс-службы министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "doc",
    awards: [],
  },
  {
    pos: "Старший референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "radio",
    awards: [],
  },
  {
    pos: "Старший референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "radio",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "helmet",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "helmet",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "helmet",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "helmet",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "helmet",
    awards: [],
  },
];
const star = (cx, cy, R, r) =>
  Array.from({ length: 10 }, (_, i) => {
    const a = ((-90 + i * 36) * Math.PI) / 180,
      k = i % 2 ? r : R;
    return (
      (cx + k * Math.cos(a)).toFixed(1) +
      "," +
      (cy + k * Math.sin(a)).toFixed(1)
    );
  }).join(" ");
const BG = {
  hero: `<polygon points="${star(200, 150, 120, 48)}"/><circle cx="200" cy="150" r="140"/><circle cx="200" cy="150" r="175"/><path d="M0 150H400M200 0V300"/>`,
  star: `<polygon points="${star(290, 150, 105, 42)}"/><circle cx="290" cy="150" r="128"/><circle cx="290" cy="150" r="145"/>`,
  radar: `<circle cx="290" cy="150" r="40"/><circle cx="290" cy="150" r="80"/><circle cx="290" cy="150" r="120"/><path d="M290 20V280M160 150H420M290 150L370 90"/>`,
  mic: `<rect x="262" y="55" width="56" height="110" rx="28"/><path d="M240 140a50 50 0 0 0 100 0M290 190V240M255 240H325M215 105a95 95 0 0 0 0 90M365 105a95 95 0 0 1 0 90"/>`,
  cam: `<rect x="205" y="90" width="170" height="120" rx="12"/><circle cx="290" cy="150" r="38"/><circle cx="290" cy="150" r="20"/><path d="M235 90l14-24h82l14 24M350 112h12"/>`,
  chat: `<path d="M205 65h150a14 14 0 0 1 14 14v70a14 14 0 0 1-14 14h-80l-30 26v-26h-40a14 14 0 0 1-14-14V79a14 14 0 0 1 14-14z"/><path d="M228 98h110M228 124h70"/><rect x="290" y="196" width="80" height="44" rx="10"/>`,
  doc: `<rect x="225" y="50" width="130" height="190" rx="6"/><path d="M250 95h80M250 125h80M250 155h80M250 185h50"/><path d="M275 35h30v15h-30z"/>`,
  mail: `<rect x="205" y="80" width="175" height="120" rx="8"/><path d="M205 90l87 64 88-64M205 200l62-52M380 200l-62-52"/>`,
  shield: `<path d="M225 60h130v45c0 65-65 105-65 105s-65-40-65-105V60z"/><path d="M245 80h90v25c0 45-45 75-45 75s-45-30-45-75V80z"/><path d="M290 95v50M270 120h40"/>`,
  wings: `<path d="M215 150l55-30 20-55 10 55 65 30-65 10-10 55-20-55z"/><circle cx="290" cy="150" r="95"/><path d="M180 150H390"/>`,
  crosshair: `<circle cx="290" cy="150" r="95"/><circle cx="290" cy="150" r="45"/><circle cx="290" cy="150" r="10"/><path d="M290 20v35M290 245v35M160 150h35M355 150h35"/><path d="M225 85l15 15M355 85l-15 15M225 215l15-15M355 215l-15-15"/>`,
  ammo: `<path d="M230 190h30v40h-30zm0-75c0-20 15-35 15-35s15 15 15 35v75h-30zm50 75h30v40h-30zm0-75c0-20 15-35 15-35s15 15 15 35v75h-30zm50 75h30v40h-30zm0-75c0-20 15-35 15-35s15 15 15 35v75h-30z"/><path d="M210 230h160"/>`,
  swords: `<path d="M210 230l110-110M220 240l-10-10 15-15 10 10zM320 120l30-10-10 30zM330 230l-110-110M320 240l10-10-15-15-10 10zM220 120l-30-10 10 30z"/><circle cx="270" cy="170" r="15"/>`,
  helmet: `<path d="M220 150c0-40 30-70 70-70s70 30 70 70v20H220v-20z"/><path d="M230 170v20h20l10-20zM350 170v20h-20l-10-20z"/><path d="M250 150h80v15h-80zM290 80v30"/>`,
  swat: `<path d="M245 110c0-30 20-50 45-50s45 20 45 50c0 25-10 40-15 45v25h-60v-25c-5-5-15-20-15-45z"/><circle cx="270" cy="115" r="10"/><circle cx="310" cy="115" r="10"/><path d="M280 145l10-10 10 15h-20zM260 175h60M250 85c20-15 50-15 70 0l10 15-40-10-40 10z"/>`,
  med: `<path d="M270 70h40v50h40v40h-40v50h-40v-50h-40v-40h40V70z"/><circle cx="290" cy="140" r="90"/><path d="M200 80l180 120M200 200l180-120"/>`,
  tank: `<rect x="230" y="140" width="120" height="50" rx="10"/><rect x="245" y="110" width="80" height="32" rx="6"/><path d="M255 125h110M220 175h140l-10 25H230z"/><circle cx="250" cy="188" r="10"/><circle cx="280" cy="188" r="10"/><circle cx="310" cy="188" r="10"/><circle cx="340" cy="188" r="10"/>`,
  rocket: `<path d="M275 60l15-25 15 25v110l-30 15zm0 130l-15 20v15l15-10zm30 0l15 20v15l-15-10zM290 200v40m-10-30l10 15 10-15"/><circle cx="290" cy="130" r="85"/><path d="M190 130h50m100 0h50"/>`,
  radio: `<path d="M290 60l40 160H250zm0 60l20 80H270zm0-30V40"/><circle cx="290" cy="40" r="6"/><path d="M260 65a45 45 0 0 1 60 0M240 50a75 75 0 0 1 100 0M220 35a105 105 0 0 1 140 0"/>`,
  justice: `<path d="M290 40v180M245 80h90M245 80l20 40h-40zm90 0l20 40h-40zM235 120a10 10 0 0 0 20 0M325 120a10 10 0 0 0 20 0M265 220h50"/>`
};
const E = `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="#ff8a1f" stroke-width="3"/><polygon points="${star(50, 52, 32, 13)}" fill="none" stroke="#ff8a1f" stroke-width="3"/></svg>`;
const RM = matchMedia("(prefers-reduced-motion:reduce)").matches,
  $ = (s) => document.querySelector(s),
  $$ = (s) => document.querySelectorAll(s);
const cur = location.pathname.split("/").pop() || "index.html";
const NAV = [
  ["index.html", "Главная"],
  ["sostav.html", "Состав"],
  ["trudoustroystvo.html", "Трудоустройство"],
  ["obrashcheniya.html", "Обращения"],
];
document.body.insertAdjacentHTML(
  "afterbegin",
  `<header id="hd"><div class="wrap bar"><a class="brand" href="index.html">${E}<span><b>Министерство Обороны</b><small>Кутузовский Федеральный Округ</small></span></a><button id="burger" aria-label="Меню">☰</button><nav id="nav">${NAV.map(([h, t]) => `<a href="${h}"${h === cur ? ' class="on"' : ""}>${t}</a>`).join("")}</nav></div><div class="prog" id="prog"></div></header>`,
);
document.body.insertAdjacentHTML(
  "beforeend",
  '<footer><div class="wrap">© Министерство Обороны Кутузовского Федерального Округа. Материалы относятся к игровому процессу GTA 5 RP (сервер RMRP Кутузовский) и не являются реальными государственными документами.</div></footer>',
);
$("#burger").onclick = () => $("#nav").classList.toggle("open");
// модальные окна
const openM = (h) => {
  const m = document.createElement("div");
  m.className = "md";
  m.innerHTML = `<div class="mb" role="dialog" aria-modal="true"><button class="x" aria-label="Закрыть">×</button>${h}</div>`;
  m.onclick = (e) => {
    if (e.target === m || e.target.classList.contains("x")) closeM(m);
  };
  document.body.append(m);
  document.body.style.overflow = "hidden";
  m.querySelector(".x").focus();
  return m;
};
const closeM = (m) => {
  m.remove();
  if (!$(".md")) document.body.style.overflow = "";
};
addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const a = $$(".md");
    a.length && closeM(a[a.length - 1]);
  }
});
const ph = (s) =>
  s.photo ? `<img src="${s.photo}" alt="${s.name}">` : "<span>ВАКАНТНО</span>";
const medal = `<svg viewBox="0 0 100 130" fill="none" stroke="#ff8a1f" stroke-width="2"><path d="M30 0h40l-9 52H39zM50 52v6"/><circle cx="50" cy="88" r="34"/><circle cx="50" cy="88" r="27"/><polygon points="${star(50, 88, 20, 8)}"/></svg>`;
const awards = (s) => {
  const m = openM(""),
    b = m.querySelector(".mb"),
    X = m.querySelector(".x").outerHTML,
    N = s.awards.length;
  const pic = (a) => (a.img ? `<img src="${a.img}" alt="">` : medal);
  const list = () => {
    b.innerHTML =
      X +
      `<h2 class="ah">Награды · ${N}</h2><div class="ag">${s.awards.map((a, i) => `<button class="at" data-k="${i}">${pic(a)}<span>${a.n}</span></button>`).join("")}</div>`;
  };
  const one = (i) => {
    const a = s.awards[i];
    b.innerHTML =
      X +
      (N > 1 ? '<button class="bk">← Все награды</button>' : "") +
      `<div class="aw">${pic(a)}<h3>${a.n}</h3><time>Дата присвоения: ${a.date}</time><p>${a.d}</p></div>`;
  };
  b.onclick = (e) => {
    const t = e.target.closest(".at");
    if (t) one(+t.dataset.k);
    if (e.target.closest(".bk")) list();
  };
  N > 1 ? list() : one(0);
};
const info = (i) => {
  const s = STAFF[i],
    n = s.name || "Вакантно";
  const m = openM(
    `<div class="dt"><div class="ph">${ph(s)}</div><div><h2>${n}</h2><p class="pos">${s.pos}</p>${s.rank ? `<p><b>Воинское звание:</b> ${s.rank}</p>` : ""}<p><b>На посту с:</b> ${s.since || "—"}</p></div></div>${s.quote ? `<blockquote>«${s.quote}»<cite>— ${n}, ${s.pos}</cite></blockquote>` : '<p style="color:var(--mute);margin-bottom:16px">Должность вакантна.</p>'}${s.awards.length ? `<button class="btn" id="aw">Награды (${s.awards.length})</button>` : ""}`,
  );
  const b = m.querySelector("#aw");
  if (b) b.onclick = () => awards(s);
};
const ST = $("#staff");
if (ST) {
    ST.innerHTML = `
    <!-- Первая плашка: Руководящий состав (Индексы 0, 1, 2) -->
    <div class="spoiler-wrapper">
      <button class="spoiler-btn" type="button" data-target="spoiler-main">
        Руководящий состав Министерства Обороны Кутузовского Федерального округа
        <span class="spoiler-arrow">▼</span>
      </button>
      <div class="spoiler-content" id="spoiler-main">
        <div class="grid st">
          ${STAFF.slice(0, 3).map((s, i) => `
            <article class="card rv" data-bg="${s.bg}">
              <div class="ph">${ph(s)}</div>
              <div>
                <h3>${s.name || "Вакантно"}</h3>
                <p class="pos">${s.pos}</p>
                <button class="btn sm" data-i="${i}">Подробнее</button>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </div>

    <!-- Вторая плашка: Помощники (Индексы 3, 4, 5) -->
    <div class="spoiler-wrapper">
      <button class="spoiler-btn" type="button" data-target="spoiler-helpers">
        Помощники министра обороны Кутузовского федерального округа
        <span class="spoiler-arrow">▼</span>
      </button>
      <div class="spoiler-content" id="spoiler-helpers">
        <div class="grid st">
          ${STAFF.slice(3, 6).map((s, i) => `
            <article class="card rv" data-bg="${s.bg}">
              <div class="ph">${ph(s)}</div>
              <div>
                <h3>${s.name || "Вакантно"}</h3>
                <p class="pos">${s.pos}</p>
                <button class="btn sm" data-i="${i + 3}">Подробнее</button>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </div>

    <!-- Третья плашка: Пресс-служба (Индексы 6, 7, 8) -->
    <div class="spoiler-wrapper">
      <button class="spoiler-btn" type="button" data-target="spoiler-press">
        Пресс-служба министерства обороны Кутузовского федерального округа
        <span class="spoiler-arrow">▼</span>
      </button>
      <div class="spoiler-content" id="spoiler-press">
        <div class="grid st">
          ${STAFF.slice(6, 9).map((s, i) => `
            <article class="card rv" data-bg="${s.bg}">
              <div class="ph">${ph(s)}</div>
              <div>
                <h3>${s.name || "Вакантно"}</h3>
                <p class="pos">${s.pos}</p>
                <button class="btn sm" data-i="${i + 6}">Подробнее</button>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </div>

    <!-- Четвертая плашка: Старшие референты (Индексы 9, 10) -->
    <div class="spoiler-wrapper">
      <button class="spoiler-btn" type="button" data-target="spoiler-sr-referents">
        Старший референт министерства обороны Кутузовского федерального округа
        <span class="spoiler-arrow">▼</span>
      </button>
      <div class="spoiler-content" id="spoiler-sr-referents">
        <div class="grid st">
          ${STAFF.slice(9, 11).map((s, i) => `
            <article class="card rv" data-bg="${s.bg}">
              <div class="ph">${ph(s)}</div>
              <div>
                <h3>${s.name || "Вакантно"}</h3>
                <p class="pos">${s.pos}</p>
                <button class="btn sm" data-i="${i + 9}">Подробнее</button>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </div>

    <!-- Пятая плашка: Обычные референты (Индексы 11-15) -->
    <div class="spoiler-wrapper">
      <button class="spoiler-btn" type="button" data-target="spoiler-referents">
        Референт министерства обороны Кутузовского федерального округа
        <span class="spoiler-arrow">▼</span>
      </button>
      <div class="spoiler-content" id="spoiler-referents">
        <div class="grid st">
          ${STAFF.slice(11, 16).map((s, i) => `
            <article class="card rv" data-bg="${s.bg}">
              <div class="ph">${ph(s)}</div>
              <div>
                <h3>${s.name || "Вакантно"}</h3>
                <p class="pos">${s.pos}</p>
                <button class="btn sm" data-i="${i + 11}">Подробнее</button>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </div>
  `;
  // Обработчик клика для кнопок "Подробнее"
  ST.onclick = (e) => {
    const b = e.target.closest("[data-i]");
    if (b) info(+b.dataset.i);
  };

  // Универсальная логика открытия и закрытия плашек
  ST.querySelectorAll(".spoiler-btn").forEach(btn => {
    btn.onclick = () => {
      const targetId = btn.dataset.target;
      const content = ST.querySelector(`#${targetId}`);
      const isOpen = content.classList.toggle("open");
      btn.classList.toggle("active");
      
      if (isOpen) {
          content.style.maxHeight = content.scrollHeight + "px";
      } else {
          content.style.maxHeight = "0px";
      }
    };
  });
}
// фоновые векторные линии
$$("[data-bg]").forEach((el) => {
  el.insertAdjacentHTML(
    "afterbegin",
    `<svg class="bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${BG[el.dataset.bg] || ""}</svg>`,
  );
  el.querySelectorAll(".bg *").forEach((x) => x.setAttribute("pathLength", 1));
});
// анимации
const h1 = $(".hero h1");
if (h1)
  h1.innerHTML = h1.textContent
    .split(" ")
    .map((w, i) => `<span style="--d:${i * 0.12}s">${w}</span>`)
    .join(" ");
$$(".rv").forEach((e) =>
  e.style.setProperty("--i", [...e.parentNode.children].indexOf(e)),
);
const io = new IntersectionObserver(
  (es) =>
    es.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    }),
  { threshold: 0.15 },
);
$$(".rv,.top,.steps,.hero").forEach((e) => io.observe(e));
const hd = $("#hd"),
  pr = $("#prog");
const upd = () => {
  const m = document.documentElement.scrollHeight - innerHeight;
  hd.classList.toggle("sm", scrollY > 40);
  pr.style.width = (m > 0 ? (scrollY / m) * 100 : 0) + "%";
};
addEventListener("scroll", upd, { passive: true });
upd();
// плавный скролл колесом мыши
if (!RM && matchMedia("(pointer:fine)").matches) {
  const de = document.documentElement;
  de.style.scrollBehavior = "auto";
  let t = scrollY,
    c = scrollY,
    run = false;
  const mx = () => de.scrollHeight - innerHeight;
  const tick = () => {
    c += (t - c) * 0.085;
    if (Math.abs(t - c) < 0.5) {
      c = t;
      run = false;
    }
    scrollTo(0, c);
    if (run) requestAnimationFrame(tick);
  };
  addEventListener(
    "wheel",
    (e) => {
      if (e.ctrlKey || $(".md")) return;
      const big = e.deltaMode === 1 || Math.abs(e.deltaY) >= 40;
      if (!big && !run) return;
      e.preventDefault();
      t = Math.max(
        0,
        Math.min(mx(), t + e.deltaY * (e.deltaMode === 1 ? 34 : 1)),
      );
      if (!run) {
        run = true;
        requestAnimationFrame(tick);
      }
    },
    { passive: false },
  );
  addEventListener("scroll", () => {
    if (!run) t = c = scrollY;
  });
}
