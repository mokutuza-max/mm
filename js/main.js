/*
 * Общий фронтенд-слой: шапка, подвал, навигация, API-клиент,
 * уведомления, модальные окна и безопасный вывод текста.
 * Зависит от js/auth.js (объект window.Auth).
 */

(function () {
    "use strict";

    const $ = function (selector, root) { return (root || document).querySelector(selector); };
    const $$ = function (selector, root) { return Array.prototype.slice.call((root || document).querySelectorAll(selector)); };

    /* ---------- безопасный вывод ---------- */

    function esc(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function formatDate(timestamp, withTime) {
        if (!timestamp) return "—";
        const date = new Date(Number(timestamp));
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleString("ru-RU", withTime
            ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
            : { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function textHtml(text) {
        const safe = esc(text);
        return safe.split(/\n{2,}/).map(function (paragraph) {
            return "<p>" + paragraph.replace(/\n/g, "<br>") + "</p>";
        }).join("");
    }

    function excerpt(text, length) {
        const clean = String(text == null ? "" : text).replace(/\s+/g, " ").trim();
        const limit = length || 160;
        if (clean.length <= limit) return clean;
        return clean.slice(0, limit).replace(/\s+\S*$/, "") + "…";
    }

    /* ---------- API ---------- */

    async function api(path, options) {
        options = options || {};
        const init = {
            method: options.method || "GET",
            credentials: "same-origin",
            headers: {}
        };
        if (options.body !== undefined) {
            init.headers["content-type"] = "application/json";
            init.body = JSON.stringify(options.body);
        }
        let response;
        try {
            response = await fetch(path, init);
        } catch (error) {
            const network = new Error("Нет связи с сервером. Проверьте подключение.");
            network.status = 0;
            throw network;
        }
        const type = response.headers.get("content-type") || "";
        let data = null;
        if (type.includes("application/json")) {
            try { data = await response.json(); } catch (error) { data = null; }
        }
        if (!response.ok) {
            const requestError = new Error((data && data.error) || ("Ошибка запроса (" + response.status + ")."));
            requestError.status = response.status;
            requestError.data = data;
            throw requestError;
        }
        return data;
    }

    /* ---------- уведомления ---------- */

    function toast(text, ok) {
        let host = $(".toasts");
        if (!host) {
            host = document.createElement("div");
            host.className = "toasts";
            host.setAttribute("aria-live", "polite");
            document.body.append(host);
        }
        const item = document.createElement("div");
        item.className = "toast " + (ok === false ? "err" : "ok");
        item.setAttribute("role", "status");
        item.textContent = text;
        host.append(item);
        window.setTimeout(function () {
            item.classList.add("out");
            window.setTimeout(function () { item.remove(); }, 350);
        }, 3600);
    }

    /* ---------- модальные окна ---------- */

    const openModals = [];

    function closeModal(modal) {
        if (!modal || !modal.parentNode) return;
        modal.dispatchEvent(new CustomEvent("modal:close"));
        modal.remove();
        const index = openModals.indexOf(modal);
        if (index >= 0) openModals.splice(index, 1);
        if (!openModals.length) document.body.style.overflow = "";
    }

    function modal(html, extraClass) {
        const wrapper = document.createElement("div");
        wrapper.className = "md";
        wrapper.innerHTML =
            '<div class="mb ' + esc(extraClass || "") + '" role="dialog" aria-modal="true">' +
            '<button class="x" type="button" aria-label="Закрыть">×</button>' +
            html +
            "</div>";
        wrapper.addEventListener("click", function (event) {
            if (event.target === wrapper || event.target.closest(".x")) closeModal(wrapper);
        });
        document.body.append(wrapper);
        document.body.style.overflow = "hidden";
        openModals.push(wrapper);
        const focusTarget = wrapper.querySelector("input, select, textarea, button.x");
        if (focusTarget) focusTarget.focus();
        return wrapper;
    }

    addEventListener("keydown", function (event) {
        if (event.key === "Escape" && openModals.length) {
            closeModal(openModals[openModals.length - 1]);
        }
    });

    /* ---------- изображения ---------- */

    function resizeImage(file, maxSize, quality) {
        return new Promise(function (resolve, reject) {
            if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
                reject(new Error("Выберите изображение JPG, PNG или WebP."));
                return;
            }
            if (file.size > 8 * 1024 * 1024) {
                reject(new Error("Файл слишком большой (максимум 8 МБ)."));
                return;
            }
            const objectUrl = URL.createObjectURL(file);
            const image = new Image();
            image.onload = function () {
                try {
                    const limit = maxSize || 900;
                    const scale = Math.min(1, limit / Math.max(image.naturalWidth, image.naturalHeight));
                    const width = Math.max(1, Math.round(image.naturalWidth * scale));
                    const height = Math.max(1, Math.round(image.naturalHeight * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    context.fillStyle = "#0d0d0f";
                    context.fillRect(0, 0, width, height);
                    context.drawImage(image, 0, 0, width, height);
                    URL.revokeObjectURL(objectUrl);
                    resolve(canvas.toDataURL("image/jpeg", quality || 0.82));
                } catch (error) {
                    URL.revokeObjectURL(objectUrl);
                    reject(new Error("Не удалось обработать изображение."));
                }
            };
            image.onerror = function () {
                URL.revokeObjectURL(objectUrl);
                reject(new Error("Не удалось прочитать изображение."));
            };
            image.src = objectUrl;
        });
    }

    function photoHtml(src, alt, fallbackText) {
        if (src) {
            return '<img src="' + esc(src) + '" alt="' + esc(alt || "") + '" loading="lazy">';
        }
        return "<span>" + esc(fallbackText || "НЕТ ФОТО") + "</span>";
    }

    /* ---------- фоновые SVG ---------- */

    const star = function (cx, cy, R, r) {
        return Array.from({ length: 10 }, function (_, i) {
            const angle = ((-90 + i * 36) * Math.PI) / 180;
            const k = i % 2 ? r : R;
            return (cx + k * Math.cos(angle)).toFixed(1) + "," + (cy + k * Math.sin(angle)).toFixed(1);
        }).join(" ");
    };

    const BG = {
        hero: '<polygon points="' + star(200, 150, 120, 48) + '"/><circle cx="200" cy="150" r="140"/><circle cx="200" cy="150" r="175"/><path d="M0 150H400M200 0V300"/>',
        star: '<polygon points="' + star(290, 150, 105, 42) + '"/><circle cx="290" cy="150" r="128"/><circle cx="290" cy="150" r="145"/>',
        radar: '<circle cx="290" cy="150" r="40"/><circle cx="290" cy="150" r="80"/><circle cx="290" cy="150" r="120"/><path d="M290 20V280M160 150H420M290 150L370 90"/>',
        mic: '<rect x="262" y="55" width="56" height="110" rx="28"/><path d="M240 140a50 50 0 0 0 100 0M290 190V240M255 240H325M215 105a95 95 0 0 0 0 90M365 105a95 95 0 0 1 0 90"/>',
        chat: '<path d="M205 65h150a14 14 0 0 1 14 14v70a14 14 0 0 1-14 14h-80l-30 26v-26h-40a14 14 0 0 1-14-14V79a14 14 0 0 1 14-14z"/><path d="M228 98h110M228 124h70"/><rect x="290" y="196" width="80" height="44" rx="10"/>',
        doc: '<rect x="225" y="50" width="130" height="190" rx="6"/><path d="M250 95h80M250 125h80M250 155h80M250 185h50"/><path d="M275 35h30v15h-30z"/>',
        mail: '<rect x="205" y="80" width="175" height="120" rx="8"/><path d="M205 90l87 64 88-64M205 200l62-52M380 200l-62-52"/>',
        shield: '<path d="M225 60h130v45c0 65-65 105-65 105s-65-40-65-105V60z"/><path d="M245 80h90v25c0 45-45 75-45 75s-45-30-45-75V80z"/><path d="M290 95v50M270 120h40"/>',
        wings: '<path d="M215 150l55-30 20-55 10 55 65 30-65 10-10 55-20-55z"/><circle cx="290" cy="150" r="95"/><path d="M180 150H390"/>',
        crosshair: '<circle cx="290" cy="150" r="95"/><circle cx="290" cy="150" r="45"/><circle cx="290" cy="150" r="10"/><path d="M290 20v35M290 245v35M160 150h35M355 150h35"/><path d="M225 85l15 15M355 85l-15 15M225 215l15-15M355 215l-15-15"/>',
        ammo: '<path d="M230 190h30v40h-30zm0-75c0-20 15-35 15-35s15 15 15 35v75h-30zm50 75h30v40h-30zm0-75c0-20 15-35 15-35s15 15 15 35v75h-30zm50 75h30v40h-30zm0-75c0-20 15-35 15-35s15 15 15 35v75h-30z"/><path d="M210 230h160"/>',
        swords: '<path d="M210 230l110-110M220 240l-10-10 15-15 10 10zM320 120l30-10-10 30zM330 230l-110-110M320 240l10-10-15-15-10 10zM220 120l-30-10 10 30z"/><circle cx="270" cy="170" r="15"/>',
        helmet: '<path d="M220 150c0-40 30-70 70-70s70 30 70 70v20H220v-20z"/><path d="M230 170v20h20l10-20zM350 170v20h-20l-10-20z"/><path d="M250 150h80v15h-80zM290 80v30"/>',
        tank: '<rect x="230" y="140" width="120" height="50" rx="10"/><rect x="245" y="110" width="80" height="32" rx="6"/><path d="M255 125h110M220 175h140l-10 25H230z"/><circle cx="250" cy="188" r="10"/><circle cx="280" cy="188" r="10"/><circle cx="310" cy="188" r="10"/><circle cx="340" cy="188" r="10"/>',
        rocket: '<path d="M275 60l15-25 15 25v110l-30 15zm0 130l-15 20v15l15-10zm30 0l15 20v15l-15-10zM290 200v40m-10-30l10 15 10-15"/><circle cx="290" cy="130" r="85"/><path d="M190 130h50m100 0h50"/>',
        radio: '<path d="M290 60l40 160H250zm0 60l20 80H270zm0-30V40"/><circle cx="290" cy="40" r="6"/><path d="M260 65a45 45 0 0 1 60 0M240 50a75 75 0 0 1 100 0M220 35a105 105 0 0 1 140 0"/>',
        justice: '<path d="M290 40v180M245 80h90M245 80l20 40h-40zm90 0l20 40h-40zM235 120a10 10 0 0 0 20 0M325 120a10 10 0 0 0 20 0M265 220h50"/>'
    };

    const brandIcon = '<svg viewBox="0 0 100 100" fill="none" stroke="#e05a2b" stroke-width="3">' +
        '<circle cx="50" cy="50" r="46"/><polygon points="' + star(50, 52, 32, 13) + '"/></svg>';

    function applyBackgrounds(root) {
        $$("[data-bg]", root).forEach(function (element) {
            if (element.querySelector(":scope > svg.bg")) return;
            const shape = BG[element.dataset.bg];
            if (!shape) return;
            element.insertAdjacentHTML("afterbegin",
                '<svg class="bg" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
                shape + "</svg>");
            $$(".bg *", element).forEach(function (node) { node.setAttribute("pathLength", 1); });
        });
    }

    /* ---------- шапка и подвал ---------- */

    const NAV = [
        ["index.html", "Главная"],
        ["o-ministerstve.html", "О Министерстве"],
        ["sostav.html", "Состав"],
        ["novosti.html", "Новости"],
        ["documents.html", "Документы"],
        ["obrashcheniya.html", "Обращения"],
        ["trudoustroystvo.html", "Трудоустройство"]
    ];

    const currentPage = (function () {
        let file = location.pathname.split("/").pop() || "index.html";
        if (file === "") file = "index.html";
        if (!/\.[a-z0-9]+$/i.test(file)) file += ".html";
        return file;
    })();

    function navHtml() {
        return NAV.map(function (item) {
            const href = item[0];
            const active = href === currentPage || (currentPage === "novost.html" && href === "novosti.html");
            return '<a href="' + href + '"' + (active ? ' class="on"' : "") + ">" + esc(item[1]) + "</a>";
        }).join("");
    }

    if (!document.getElementById("hd")) {
        document.body.insertAdjacentHTML("afterbegin",
            '<header id="hd"><div class="wrap bar">' +
            '<a class="brand" href="index.html">' + brandIcon +
            "<span><b>Министерство Обороны</b><small>Кутузовский Федеральный Округ</small></span></a>" +
            '<nav id="nav">' + navHtml() + "</nav>" +
            '<div class="authslot" id="authslot"></div>' +
            '<button id="burger" type="button" aria-label="Открыть меню" aria-expanded="false">☰</button>' +
            '</div><div class="prog" id="prog"></div></header>');
    }

    if (!document.querySelector("footer.site-footer")) {
        document.body.insertAdjacentHTML("beforeend",
            '<footer class="site-footer"><div class="wrap">© Министерство Обороны Кутузовского Федерального Округа. ' +
            "Материалы относятся к игровому процессу GTA 5 RP (сервер RMRP Кутузовский) " +
            "и не являются реальными государственными документами.</div></footer>");
    }

    const burger = document.getElementById("burger");
    const nav = document.getElementById("nav");
    if (burger && nav) {
        burger.addEventListener("click", function () {
            const open = nav.classList.toggle("open");
            burger.setAttribute("aria-expanded", open ? "true" : "false");
        });
        nav.addEventListener("click", function (event) {
            if (event.target.closest("a")) {
                nav.classList.remove("open");
                burger.setAttribute("aria-expanded", "false");
            }
        });
    }

    if (window.Auth) {
        Auth.mountWidget("#authslot");
        addEventListener("auth:change", function () {
            const slot = document.getElementById("authslot");
            if (slot) Auth.mountWidget("#authslot");
        });
    }

    /* ---------- анимации появления ---------- */

    let observer = null;

    function reveal(root) {
        const elements = $$(".rv", root);
        elements.forEach(function (element, index) {
            if (!element.style.getPropertyValue("--i")) {
                element.style.setProperty("--i", String(index));
            }
        });
        if (!("IntersectionObserver" in window)) {
            elements.forEach(function (element) { element.classList.add("in"); });
            return;
        }
        if (!observer) {
            observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add("in");
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.15 });
        }
        elements.forEach(function (element) {
            if (!element.classList.contains("in")) observer.observe(element);
        });
        $$(".top, .hero, .steps", root).forEach(function (element) {
            element.classList.add("in");
        });
    }

    /* ---------- прокрутка ---------- */

    const header = document.getElementById("hd");
    const progress = document.getElementById("prog");
    function updateScroll() {
        if (header) header.classList.toggle("sm", window.scrollY > 40);
        if (progress) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
        }
    }
    addEventListener("scroll", updateScroll, { passive: true });
    updateScroll();

    /* ---------- статусы ---------- */

    const APPEAL_STATUS_LABELS = {
        new: "Новое",
        in_progress: "В работе",
        answered: "Отвечено",
        rejected: "Отклонено"
    };

    const APPLICATION_STATUS_LABELS = {
        new: "Новая",
        reviewed: "Рассмотрена",
        invited: "Приглашение",
        rejected: "Отказ"
    };

    function statusBadge(kind, status) {
        const labels = kind === "application" ? APPLICATION_STATUS_LABELS : APPEAL_STATUS_LABELS;
        const label = labels[status] || status || "—";
        const css = kind === "application" ? "app-" : "app-";
        return '<span class="badge status ' + css + esc(status || "") + '">' + esc(label) + "</span>";
    }

    function statusLabel(kind, status) {
        const labels = kind === "application" ? APPLICATION_STATUS_LABELS : APPEAL_STATUS_LABELS;
        return labels[status] || status || "—";
    }

    function newsCard(item) {
        const href = "novost.html?id=" + encodeURIComponent(item.id);
        const media = item.image_url
            ? '<img src="' + esc(item.image_url) + '" alt="' + esc(item.title) + '" loading="lazy">'
            : '<span class="news-placeholder">' + brandIcon + "</span>";
        return '<article class="newscard rv">' +
            '<a class="newscard-img" href="' + href + '" aria-hidden="true" tabindex="-1">' + media + "</a>" +
            '<div class="newscard-body">' +
            '<div class="newsmeta"><span class="badge">' + esc(item.category || "Общее") + "</span>" +
            "<time>" + esc(formatDate(item.created_at)) + "</time></div>" +
            '<h3><a href="' + href + '">' + esc(item.title) + "</a></h3>" +
            "<p>" + esc(excerpt(item.content, 170)) + "</p>" +
            '<a class="more" href="' + href + '">Читать далее →</a>' +
            "</div></article>";
    }

    /* ---------- запуск ---------- */

    applyBackgrounds(document);
    reveal(document);

    window.Site = {
        $: $,
        $$: $$,
        esc: esc,
        formatDate: formatDate,
        textHtml: textHtml,
        excerpt: excerpt,
        api: api,
        toast: toast,
        modal: modal,
        closeModal: closeModal,
        resizeImage: resizeImage,
        photoHtml: photoHtml,
        applyBackgrounds: applyBackgrounds,
        reveal: reveal,
        statusBadge: statusBadge,
        statusLabel: statusLabel,
        newsCard: newsCard,
        APPEAL_STATUS_LABELS: APPEAL_STATUS_LABELS,
        APPLICATION_STATUS_LABELS: APPLICATION_STATUS_LABELS
    };
})();
