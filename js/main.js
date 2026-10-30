
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
    bg: "radar",
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
    bg: "radar",
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
    bg: "cam",
    awards: [],
  },
  {
    pos: "Заместитель руководителя пресс-службы министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Старший референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Старший референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
    awards: [],
  },
  {
    pos: "Референт министерства обороны Кутузовского Федерального округа",
    name: "",
    photo: "",
    rank: "",
    since: "xx месяц год",
    quote: "",
    bg: "chat",
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
  doc: `<rect x="230" y="40" width="140" height="190" rx="8"/><path d="M255 90h90M255 120h90M255 150h55"/><circle cx="335" cy="195" r="16"/>`,
  mail: `<rect x="205" y="80" width="175" height="120" rx="8"/><path d="M205 90l87 64 88-64M205 200l62-52M380 200l-62-52"/>`,
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

    <!-- Вторая плашка: Только Помощники (Индексы 3, 4, 5) -->
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
      <button class="spoiler-btn" type="button" data-target="spoiler-press">
        Старшие референты министерства обороны Кутузовского федерального округа
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
                <button class="btn sm" data-i="${i + 8}">Подробнее</button>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </div>

        <!-- Пятая плашка: Референты (Индексы 11, 12, 13, 14, 15) -->
    <div class="spoiler-wrapper">
      <button class="spoiler-btn" type="button" data-target="spoiler-press">
        Референты министерства обороны Кутузовского федерального округа
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
                <button class="btn sm" data-i="${i + 13}">Подробнее</button>
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
