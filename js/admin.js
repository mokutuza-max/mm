/*
 * Панель управления Министерства.
 * Доступ: роли admin и editor. Управление пользователями — только admin.
 *
 * Все формы отправляются через fetch без перезагрузки страницы:
 * event.preventDefault() -> Site.api() -> обновление интерфейса -> уведомление.
 */

(function () {
    "use strict";

    const app = document.getElementById("app");
    if (!app) return;

    const esc = Auth.escapeHtml;
    const $ = Site.$;

    let me = null;

    const TABS = [
        { id: "news", label: "Новости", roles: ["admin", "editor"] },
        { id: "staff", label: "Состав", roles: ["admin", "editor"] },
        { id: "documents", label: "Документы", roles: ["admin", "editor"] },
        { id: "appeals", label: "Обращения", roles: ["admin", "editor"] },
        { id: "applications", label: "Заявки", roles: ["admin", "editor"] },
        { id: "vacancies", label: "Вакансии", roles: ["admin", "editor"] },
        { id: "users", label: "Пользователи", roles: ["admin"] }
    ];

    const state = {
        tab: "news",
        stats: null,
        news: [],
        staff: [],
        documents: [],
        appeals: [],
        applications: [],
        vacancies: [],
        users: [],
        newsQuery: "",
        appealFilter: "",
        applicationFilter: ""
    };

    /* ---------- вспомогательные ---------- */

    function denied(title, text, showLogin) {
        app.innerHTML = '<div class="authcard"><h1>' + esc(title) + "</h1>" +
            '<p class="sub">' + esc(text) + "</p>" +
            '<div class="uactions">' +
            (showLogin ? '<a class="btn" href="vhod.html?next=administraciya.html">Войти</a>' : "") +
            '<a class="btn sm" href="akkaunt.html">Личный кабинет</a></div></div>';
    }

    function tabById(id) {
        return TABS.find(function (tab) { return tab.id === id; }) || null;
    }

    function allowedTabs() {
        return TABS.filter(function (tab) { return tab.roles.includes(me.role); });
    }

    function roleOptions(selected) {
        return Auth.ROLES.map(function (role) {
            return '<option value="' + role.id + '"' + (role.id === selected ? " selected" : "") + ">" +
                esc(role.label) + "</option>";
        }).join("");
    }

    function stateOptions(selected) {
        return Auth.STATES.map(function (item) {
            return '<option value="' + item.id + '"' + (item.id === selected ? " selected" : "") + ">" +
                esc(item.label) + "</option>";
        }).join("");
    }

    function statusOptions(labels, selected) {
        return Object.keys(labels).map(function (key) {
            return '<option value="' + esc(key) + '"' + (key === selected ? " selected" : "") + ">" +
                esc(labels[key]) + "</option>";
        }).join("");
    }

    function errorBox(modal, text) {
        let box = modal.querySelector(".form-error");
        if (!box) {
            box = document.createElement("div");
            box.className = "msg err form-error";
            const form = modal.querySelector("form");
            if (form) form.prepend(box);
            else modal.querySelector(".mb").prepend(box);
        }
        box.hidden = false;
        box.textContent = text;
    }

    function setBusy(button, busy, busyText, normalText) {
        if (!button) return;
        button.disabled = busy;
        button.textContent = busy ? busyText : normalText;
    }

    function handleFatal(error) {
        if (error && error.status === 401) {
            location.href = "vhod.html?next=administraciya.html";
            return;
        }
        Site.toast((error && error.message) || "Ошибка запроса.", false);
    }

    async function refreshStats() {
        try {
            const data = await Site.api("/api/admin/stats");
            state.stats = data.stats || null;
            renderStats();
        } catch (error) {
            /* Сводка не критична для работы панели. */
        }
    }

    function renderStats() {
        const host = document.getElementById("adminStats");
        if (!host) return;
        const stats = state.stats;
        if (!stats) {
            host.innerHTML = "";
            return;
        }
        const items = [
            { value: stats.news, label: "новостей" },
            { value: stats.drafts, label: "черновиков" },
            { value: stats.staff, label: "в составе" },
            { value: stats.documents, label: "документов" },
            { value: stats.appealsNew, label: "новых обращений" },
            { value: stats.applicationsNew, label: "новых заявок" }
        ];
        if (typeof stats.users === "number") {
            items.push({ value: stats.users, label: "пользователей" });
        }
        host.innerHTML = items.map(function (item) {
            return '<div class="stat"><b>' + esc(item.value) + "</b><span>" + esc(item.label) + "</span></div>";
        }).join("");
    }

    /* ---------- оболочка ---------- */

    function renderShell() {
        app.innerHTML =
            '<div class="admin-top">' +
            '<div><p class="eyebrow">Служебный раздел</p><h1>Панель управления</h1></div>' +
            '<div class="utags"><span class="badge">' + esc(Auth.roleLabel(me.role)) + "</span>" +
            '<span class="badge gray">' + esc(me.name) + "</span></div></div>" +
            '<div class="stats" id="adminStats"></div>' +
            '<div class="admin-tabs" id="adminTabs">' +
            allowedTabs().map(function (tab) {
                return '<button type="button" class="admin-tab" data-tab="' + tab.id + '">' +
                    esc(tab.label) + "</button>";
            }).join("") + "</div>" +
            '<div id="panel" class="admin-panel"></div>';

        document.getElementById("adminTabs").addEventListener("click", function (event) {
            const button = event.target.closest("[data-tab]");
            if (button) setTab(button.dataset.tab);
        });
        renderStats();
    }

    function markTab(tab) {
        Site.$$(".admin-tab").forEach(function (button) {
            button.classList.toggle("on", button.dataset.tab === tab);
        });
    }

    async function setTab(tab) {
        const definition = tabById(tab);
        if (!definition || !definition.roles.includes(me.role)) {
            tab = allowedTabs()[0].id;
        }
        state.tab = tab;
        markTab(tab);
        history.replaceState({}, "", location.pathname + "#" + tab);
        const panel = document.getElementById("panel");
        panel.innerHTML = '<div class="empty">Загрузка…</div>';

        try {
            if (tab === "news") {
                await loadNews();
                renderNews();
            } else if (tab === "staff") {
                await loadStaff();
                renderStaff();
            } else if (tab === "documents") {
                await loadDocuments();
                renderDocuments();
            } else if (tab === "appeals") {
                await loadAppeals();
                renderAppeals();
            } else if (tab === "applications") {
                await loadApplications();
                renderApplications();
            } else if (tab === "vacancies") {
                await loadVacancies();
                renderVacancies();
            } else if (tab === "users") {
                await loadUsers();
                renderUsers();
            }
            refreshStats();
        } catch (error) {
            panel.innerHTML = '<div class="msg err">' + esc(error.message || "Не удалось загрузить раздел.") +
                "</div>";
            handleFatal(error);
        }
    }

    /* ---------- загрузчики ---------- */

    async function loadNews() {
        const data = await Site.api("/api/admin/news");
        state.news = data.news || [];
    }

    async function loadStaff() {
        const data = await Site.api("/api/admin/staff");
        state.staff = data.staff || [];
    }

    async function loadDocuments() {
        const data = await Site.api("/api/admin/documents");
        state.documents = data.documents || [];
    }

    async function loadAppeals() {
        const data = await Site.api("/api/admin/appeals");
        state.appeals = data.appeals || [];
    }

    async function loadApplications() {
        const data = await Site.api("/api/admin/applications");
        state.applications = data.applications || [];
    }

    async function loadVacancies() {
        const data = await Site.api("/api/admin/vacancies");
        state.vacancies = data.vacancies || [];
    }

    async function loadUsers() {
        state.users = await Auth.listUsers();
    }

    /* =======================================================================
       СОСТАВ
       ======================================================================= */

    function staffRow(person, index) {
        const name = person.full_name || "Без имени";
        return '<tr draggable="true" data-id="' + esc(person.id) + '" data-index="' + index + '">' +
            '<td class="num">' + (index + 1) + "</td>" +
            '<td><div class="tinyphoto">' + Site.photoHtml(person.photo_url, name, "—") + "</div></td>" +
            '<td><b>' + esc(name) + "</b>" +
            (person.rank ? '<small class="cell-sub">' + esc(person.rank) + "</small>" : "") + "</td>" +
            "<td>" + esc(person.position) + "</td>" +
            '<td class="muted">' + esc(person.department || "—") + "</td>" +
            '<td class="row-actions">' +
            '<button type="button" class="icon-btn" data-act="up" title="Поднять выше" aria-label="Поднять выше"' +
            (index === 0 ? " disabled" : "") + ">↑</button>" +
            '<button type="button" class="icon-btn" data-act="down" title="Опустить ниже" aria-label="Опустить ниже"' +
            (index === state.staff.length - 1 ? " disabled" : "") + ">↓</button>" +
            '<button type="button" class="btn sm" data-act="edit">Изменить</button>' +
            '<button type="button" class="btn sm danger" data-act="delete">Удалить</button>' +
            "</td></tr>";
    }

    function renderStaff() {
        const panel = document.getElementById("panel");
        const items = state.staff;
        panel.innerHTML =
            '<div class="admin-head"><div><h2>Управление составом</h2>' +
            '<p class="note">Порядок строк соответствует порядку карточек на сайте. ' +
            "Перетащите строку или используйте стрелки ↑ ↓.</p></div>" +
            '<button class="btn sm" type="button" id="staffAdd">+ Добавить человека</button></div>' +
            (items.length
                ? '<div class="table-wrap"><table class="atable"><thead><tr>' +
                "<th>№</th><th>Фото</th><th>ФИО / звание</th><th>Должность</th>" +
                "<th>Подразделение</th><th>Действия</th></tr></thead>" +
                '<tbody id="staffBody">' + items.map(staffRow).join("") + "</tbody></table></div>"
                : '<div class="empty">В составе пока нет людей. Нажмите «Добавить человека».</div>');

        const add = document.getElementById("staffAdd");
        if (add) add.onclick = function () { openStaffForm(null); };

        const body = document.getElementById("staffBody");
        if (!body) return;

        body.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-act]");
            if (!button) return;
            const row = button.closest("tr");
            if (!row) return;
            const index = Number(row.dataset.index);
            const person = state.staff[index];
            if (!person) return;
            const action = button.dataset.act;
            if (action === "edit") openStaffForm(person);
            else if (action === "up") moveStaff(index, -1);
            else if (action === "down") moveStaff(index, 1);
            else if (action === "delete") removeStaff(person);
        });

        /* Drag-and-Drop: меняет display_order на сервере. */
        let dragIndex = null;

        body.addEventListener("dragstart", function (event) {
            const row = event.target.closest("tr");
            if (!row) return;
            dragIndex = Number(row.dataset.index);
            row.classList.add("dragging");
            event.dataTransfer.effectAllowed = "move";
            try { event.dataTransfer.setData("text/plain", row.dataset.id); } catch (error) { /* ignore */ }
        });

        body.addEventListener("dragover", function (event) {
            if (dragIndex === null) return;
            event.preventDefault();
            const row = event.target.closest("tr");
            if (!row || Number(row.dataset.index) === dragIndex) return;
            event.dataTransfer.dropEffect = "move";
            Site.$$("tr", body).forEach(function (item) { item.classList.remove("drop-target"); });
            row.classList.add("drop-target");
        });

        body.addEventListener("dragleave", function (event) {
            const row = event.target.closest("tr");
            if (row) row.classList.remove("drop-target");
        });

        body.addEventListener("drop", function (event) {
            if (dragIndex === null) return;
            event.preventDefault();
            const row = event.target.closest("tr");
            if (!row) return;
            const target = Number(row.dataset.index);
            if (!Number.isFinite(target) || target === dragIndex) {
                dragIndex = null;
                return;
            }
            const next = state.staff.slice();
            const moved = next.splice(dragIndex, 1)[0];
            next.splice(target, 0, moved);
            dragIndex = null;
            saveStaffOrder(next);
        });

        body.addEventListener("dragend", function () {
            dragIndex = null;
            Site.$$("tr", body).forEach(function (item) {
                item.classList.remove("dragging");
                item.classList.remove("drop-target");
            });
        });
    }

    function moveStaff(index, delta) {
        const target = index + delta;
        if (target < 0 || target >= state.staff.length) return;
        const next = state.staff.slice();
        const temp = next[index];
        next[index] = next[target];
        next[target] = temp;
        saveStaffOrder(next);
    }

    async function saveStaffOrder(next) {
        const previous = state.staff;
        state.staff = next.map(function (person, index) {
            return Object.assign({}, person, { display_order: (index + 1) * 10 });
        });
        renderStaff();
        try {
            const data = await Site.api("/api/admin/staff/reorder", {
                method: "POST",
                body: { ids: next.map(function (person) { return person.id; }) }
            });
            state.staff = data.staff || state.staff;
            renderStaff();
            Site.toast("Порядок сохранён.", true);
        } catch (error) {
            state.staff = previous;
            renderStaff();
            Site.toast(error.message || "Не удалось изменить порядок.", false);
        }
    }

    async function removeStaff(person) {
        if (!confirm("Удалить «" + person.full_name + "» из состава? Действие необратимо.")) return;
        try {
            await Site.api("/api/admin/staff/" + encodeURIComponent(person.id), { method: "DELETE" });
            await loadStaff();
            renderStaff();
            Site.toast("Сотрудник удалён.", true);
            refreshStats();
        } catch (error) {
            Site.toast(error.message || "Не удалось удалить сотрудника.", false);
            handleFatal(error);
        }
    }

    function photoField(idPrefix, value) {
        return '<div class="field span2"><label for="' + idPrefix + 'Photo">Фото: ссылка или Base64</label>' +
            '<input id="' + idPrefix + 'Photo" type="text" maxlength="700000" ' +
            'value="' + esc(value || "") + '" placeholder="https://… или img/photo.png">' +
            '<div class="inline-actions">' +
            '<button class="btn sm" type="button" id="' + idPrefix + 'Pick">Загрузить файл</button>' +
            '<input id="' + idPrefix + 'File" type="file" accept="image/jpeg,image/png,image/webp" hidden>' +
            '<span class="hint">JPG, PNG или WebP. Файл уменьшится и сохранится как Base64 в D1.</span>' +
            "</div>" +
            '<div class="photo-preview" id="' + idPrefix + 'Preview"></div>' +
            "</div>";
    }

    function bindPhotoField(modal, prefix) {
        const input = document.getElementById(prefix + "Photo");
        const pick = document.getElementById(prefix + "Pick");
        const file = document.getElementById(prefix + "File");
        const preview = document.getElementById(prefix + "Preview");

        function paint() {
            preview.innerHTML = Site.photoHtml(input.value.trim(), "", "НЕТ ФОТО");
        }

        if (input) input.addEventListener("input", paint);
        if (pick && file) {
            pick.onclick = function () { file.click(); };
            file.onchange = async function () {
                const selected = file.files && file.files[0];
                if (!selected) return;
                pick.disabled = true;
                pick.textContent = "Обработка…";
                try {
                    input.value = await Site.resizeImage(selected, 900, 0.82);
                    paint();
                } catch (error) {
                    Site.toast(error.message || "Не удалось обработать изображение.", false);
                } finally {
                    pick.disabled = false;
                    pick.textContent = "Загрузить файл";
                    file.value = "";
                }
            };
        }
        paint();
    }

    function openStaffForm(person) {
        const editing = !!person;
        const modal = Site.modal(
            '<h2 class="mh">' + (editing ? "Редактировать сотрудника" : "Добавить человека") + "</h2>" +
            '<form id="staffForm" class="formgrid" novalidate>' +
            '<div class="field span2"><label for="sfName">ФИО *</label>' +
            '<input id="sfName" type="text" required maxlength="120" value="' +
            esc(person ? person.full_name : "") + '" placeholder="Иванов Иван Иванович"></div>' +
            '<div class="field"><label for="sfRank">Звание</label>' +
            '<input id="sfRank" type="text" maxlength="80" value="' +
            esc(person ? person.rank || "" : "") + '" placeholder="Полковник"></div>' +
            '<div class="field"><label for="sfDepartment">Подразделение</label>' +
            '<input id="sfDepartment" type="text" maxlength="120" value="' +
            esc(person ? person.department || "" : "") + '" placeholder="Руководство"></div>' +
            '<div class="field span2"><label for="sfPosition">Должность *</label>' +
            '<input id="sfPosition" type="text" required maxlength="160" value="' +
            esc(person ? person.position : "") + '" placeholder="1-й Заместитель Министра"></div>' +
            photoField("sf", person ? person.photo_url : "") +
            '<div class="form-actions span2">' +
            '<button class="btn" type="submit" id="sfSubmit">Сохранить</button>' +
            '<button class="btn sm" type="button" data-close>Отмена</button></div>' +
            "</form>",
            "form-modal"
        );

        bindPhotoField(modal, "sf");
        modal.querySelector("[data-close]").onclick = function () { Site.closeModal(modal); };

        const form = document.getElementById("staffForm");
        const submit = document.getElementById("sfSubmit");
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            const body = {
                full_name: document.getElementById("sfName").value.trim(),
                rank: document.getElementById("sfRank").value.trim(),
                position: document.getElementById("sfPosition").value.trim(),
                department: document.getElementById("sfDepartment").value.trim(),
                photo_url: document.getElementById("sfPhoto").value.trim()
            };
            if (body.full_name.length < 2) {
                errorBox(modal, "Укажите ФИО (не менее 2 символов).");
                return;
            }
            if (!body.position) {
                errorBox(modal, "Укажите должность.");
                return;
            }
            setBusy(submit, true, "Сохранение…", "Сохранить");
            try {
                if (editing) {
                    await Site.api("/api/admin/staff/" + encodeURIComponent(person.id), {
                        method: "PATCH", body: body
                    });
                } else {
                    await Site.api("/api/admin/staff", { method: "POST", body: body });
                }
                Site.closeModal(modal);
                Site.toast("Успешно сохранено!", true);
                await loadStaff();
                renderStaff();
                refreshStats();
            } catch (error) {
                errorBox(modal, error.message || "Не удалось сохранить сотрудника.");
                setBusy(submit, false, "", "Сохранить");
                handleFatal(error);
            }
        });
    }

    /* =======================================================================
       НОВОСТИ
       ======================================================================= */

    function newsRow(item) {
        return '<tr data-id="' + esc(item.id) + '">' +
            '<td><b>' + esc(item.title) + "</b><small class=\"cell-sub\">" +
            esc(Site.excerpt(item.content, 90)) + "</small></td>" +
            '<td><span class="badge">' + esc(item.category) + "</span></td>" +
            '<td><span class="badge ' + (item.status === "published" ? "ok" : "gray") + '">' +
            (item.status === "published" ? "Опубликовано" : "Черновик") + "</span></td>" +
            '<td class="muted">' + esc(Site.formatDate(item.created_at)) + "</td>" +
            '<td class="row-actions">' +
            '<button type="button" class="btn sm" data-act="edit">Изменить</button>' +
            '<button type="button" class="btn sm danger" data-act="delete">Удалить</button>' +
            "</td></tr>";
    }

    function renderNews() {
        const panel = document.getElementById("panel");
        panel.innerHTML =
            '<div class="admin-head"><div><h2>Управление новостями</h2>' +
            '<p class="note">Черновики не отображаются на сайте. Публикация — поле «Статус».</p></div>' +
            '<button class="btn sm" type="button" id="newsAdd">+ Добавить новость</button></div>' +
            '<div class="adminbar"><input id="newsSearch" type="search" placeholder="Поиск по заголовку и тексту">' +
            '<span class="admincount" id="newsCount"></span></div>' +
            '<div id="newsTableHost"></div>';

        document.getElementById("newsAdd").onclick = function () { openNewsForm(null); };
        const host = document.getElementById("newsTableHost");
        const search = document.getElementById("newsSearch");
        const counter = document.getElementById("newsCount");

        function paint() {
            const needle = state.newsQuery.trim().toLowerCase();
            const items = state.news.filter(function (item) {
                if (!needle) return true;
                return (item.title + " " + item.content + " " + item.category)
                    .toLowerCase().includes(needle);
            });
            if (counter) counter.textContent = "Показано: " + items.length + " из " + state.news.length;
            host.innerHTML = items.length
                ? '<div class="table-wrap"><table class="atable"><thead><tr>' +
                "<th>Заголовок</th><th>Категория</th><th>Статус</th><th>Дата</th><th>Действия</th>" +
                "</tr></thead><tbody>" + items.map(newsRow).join("") + "</tbody></table></div>"
                : '<div class="empty">' + (state.news.length
                    ? "Новости не найдены."
                    : "Новостей пока нет. Нажмите «Добавить новость».") + "</div>";
        }

        search.addEventListener("input", function () {
            state.newsQuery = search.value;
            paint();
        });

        host.addEventListener("click", function (event) {
            const button = event.target.closest("button[data-act]");
            if (!button) return;
            const row = button.closest("tr");
            if (!row) return;
            const item = state.news.find(function (news) { return news.id === row.dataset.id; });
            if (!item) return;
            if (button.dataset.act === "edit") openNewsForm(item);
            else if (button.dataset.act === "delete") removeNews(item);
        });

        paint();
    }

    async function removeNews(item) {
        if (!confirm("Удалить новость «" + item.title + "»?")) return;
        try {
            await Site.api("/api/admin/news/" + encodeURIComponent(item.id), { method: "DELETE" });
            await loadNews();
            renderNews();
            Site.toast("Новость удалена.", true);
            refreshStats();
        } catch (error) {
            Site.toast(error.message || "Не удалось удалить новость.", false);
            handleFatal(error);
        }
    }

    function openNewsForm(item) {
        const editing = !!item;
        const modal = Site.modal(
            '<h2 class="mh">' + (editing ? "Редактировать новость" : "Новая новость") + "</h2>" +
            '<form id="newsForm" class="formgrid" novalidate>' +
            '<div class="field span2"><label for="nfTitle">Заголовок *</label>' +
            '<input id="nfTitle" type="text" required maxlength="200" value="' +
            esc(item ? item.title : "") + '"></div>' +
            '<div class="field"><label for="nfCategory">Категория</label>' +
            '<input id="nfCategory" type="text" maxlength="60" list="newsCategoriesList" value="' +
            esc(item ? item.category : "Официально") + '"></div>' +
            '<div class="field"><label for="nfStatus">Статус</label>' +
            '<select id="nfStatus"><option value="draft"' + (!item || item.status === "draft" ? " selected" : "") +
            '>Черновик</option><option value="published"' +
            (item && item.status === "published" ? " selected" : "") + ">Опубликовано</option></select></div>" +
            '<div class="field span2"><label for="nfContent">Текст новости *</label>' +
            '<textarea id="nfContent" rows="10" required maxlength="20000" placeholder="Полный текст новости">' +
            esc(item ? item.content : "") + "</textarea></div>" +
            photoField("nf", item ? item.image_url : "") +
            '<div class="form-actions span2">' +
            '<button class="btn" type="submit" id="nfSubmit">Сохранить</button>' +
            '<button class="btn sm" type="button" data-close>Отмена</button></div>' +
            "</form>" +
            '<datalist id="newsCategoriesList">' +
            ["Официально", "Оперативная сводка", "Учения", "Кадры", "Общество", "Пресс-служба"]
                .map(function (name) { return '<option value="' + esc(name) + '">'; }).join("") +
            "</datalist>",
            "form-modal"
        );

        bindPhotoField(modal, "nf");
        modal.querySelector("[data-close]").onclick = function () { Site.closeModal(modal); };

        const form = document.getElementById("newsForm");
        const submit = document.getElementById("nfSubmit");
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            const body = {
                title: document.getElementById("nfTitle").value.trim(),
                category: document.getElementById("nfCategory").value.trim(),
                status: document.getElementById("nfStatus").value,
                content: document.getElementById("nfContent").value.trim(),
                image_url: document.getElementById("nfPhoto").value.trim()
            };
            if (!body.title) return errorBox(modal, "Укажите заголовок новости.");
            if (!body.content) return errorBox(modal, "Введите текст новости.");
            setBusy(submit, true, "Сохранение…", "Сохранить");
            try {
                if (editing) {
                    await Site.api("/api/admin/news/" + encodeURIComponent(item.id), {
                        method: "PATCH", body: body
                    });
                } else {
                    await Site.api("/api/admin/news", { method: "POST", body: body });
                }
                Site.closeModal(modal);
                Site.toast("Успешно сохранено!", true);
                await loadNews();
                renderNews();
                refreshStats();
            } catch (error) {
                errorBox(modal, error.message || "Не удалось сохранить новость.");
                setBusy(submit, false, "", "Сохранить");
                handleFatal(error);
            }
        });
    }

    /* =======================================================================
       ДОКУМЕНТЫ
       ======================================================================= */

    function documentRow(item) {
        return '<tr data-id="' + esc(item.id) + '">' +
            "<td><b>" + esc(item.title) + "</b>" +
            (item.description ? '<small class="cell-sub">' + esc(item.description) + "</small>" : "") + "</td>" +
            '<td><span class="badge">' + esc(item.category) + "</span></td>" +
            '<td class="muted"><a href="' + esc(item.file_url) + '" target="_blank" rel="noopener noreferrer">' +
            esc(item.file_url) + "</a></td>" +
            '<td class="muted">' + esc(Site.formatDate(item.created_at)) + "</td>" +
            '<td class="row-actions">' +
            '<button type="button" class="btn sm" data-act="edit">Изменить</button>' +
            '<button type="button" class="btn sm danger" data-act="delete">Удалить</button>' +
            "</td></tr>";
    }

    function renderDocuments() {
        const panel = document.getElementById("panel");
        panel.innerHTML =
            '<div class="admin-head"><div><h2>Управление документами</h2>' +
            '<p class="note">Ссылка может вести на файл сайта или внешний ресурс (http/https).</p></div>' +
            '<button class="btn sm" type="button" id="docAdd">+ Добавить документ</button></div>' +
            '<div id="documentHost">' +
            (state.documents.length
                ? '<div class="table-wrap"><table class="atable"><thead><tr>' +
                "<th>Название</th><th>Категория</th><th>Ссылка</th><th>Дата</th><th>Действия</th>" +
                "</tr></thead><tbody>" + state.documents.map(documentRow).join("") + "</tbody></table></div>"
                : '<div class="empty">Документов пока нет. Нажмите «Добавить документ».</div>') +
            "</div>";

        document.getElementById("docAdd").onclick = function () { openDocumentForm(null); };

        document.getElementById("documentHost").addEventListener("click", function (event) {
            const button = event.target.closest("button[data-act]");
            if (!button) return;
            const row = button.closest("tr");
            if (!row) return;
            const item = state.documents.find(function (documentItem) {
                return documentItem.id === row.dataset.id;
            });
            if (!item) return;
            if (button.dataset.act === "edit") openDocumentForm(item);
            else if (button.dataset.act === "delete") removeDocument(item);
        });
    }

    async function removeDocument(item) {
        if (!confirm("Удалить документ «" + item.title + "»?")) return;
        try {
            await Site.api("/api/admin/documents/" + encodeURIComponent(item.id), { method: "DELETE" });
            await loadDocuments();
            renderDocuments();
            Site.toast("Документ удалён.", true);
            refreshStats();
        } catch (error) {
            Site.toast(error.message || "Не удалось удалить документ.", false);
            handleFatal(error);
        }
    }

    function openDocumentForm(item) {
        const editing = !!item;
        const modal = Site.modal(
            '<h2 class="mh">' + (editing ? "Редактировать документ" : "Новый документ") + "</h2>" +
            '<form id="documentForm" class="formgrid" novalidate>' +
            '<div class="field span2"><label for="dfTitle">Название *</label>' +
            '<input id="dfTitle" type="text" required maxlength="200" value="' +
            esc(item ? item.title : "") + '"></div>' +
            '<div class="field"><label for="dfCategory">Категория</label>' +
            '<input id="dfCategory" type="text" maxlength="60" list="docCategoriesList" value="' +
            esc(item ? item.category : "Общее") + '"></div>' +
            '<div class="field"><label for="dfUrl">Ссылка на файл *</label>' +
            '<input id="dfUrl" type="text" required maxlength="2048" value="' +
            esc(item ? item.file_url : "") + '" placeholder="docs/file.pdf или https://…"></div>' +
            '<div class="field span2"><label for="dfDescription">Описание</label>' +
            '<textarea id="dfDescription" rows="4" maxlength="1000">' +
            esc(item ? item.description || "" : "") + "</textarea></div>" +
            '<div class="form-actions span2">' +
            '<button class="btn" type="submit" id="dfSubmit">Сохранить</button>' +
            '<button class="btn sm" type="button" data-close>Отмена</button></div>' +
            "</form>" +
            '<datalist id="docCategoriesList">' +
            ["Общее", "Устав", "Регламенты", "Кадры", "Приказы"].map(function (name) {
                return '<option value="' + esc(name) + '">';
            }).join("") + "</datalist>",
            "form-modal"
        );

        modal.querySelector("[data-close]").onclick = function () { Site.closeModal(modal); };
        const form = document.getElementById("documentForm");
        const submit = document.getElementById("dfSubmit");
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            const body = {
                title: document.getElementById("dfTitle").value.trim(),
                category: document.getElementById("dfCategory").value.trim(),
                file_url: document.getElementById("dfUrl").value.trim(),
                description: document.getElementById("dfDescription").value.trim()
            };
            if (!body.title) return errorBox(modal, "Укажите название документа.");
            if (!body.file_url) return errorBox(modal, "Укажите ссылку на файл.");
            setBusy(submit, true, "Сохранение…", "Сохранить");
            try {
                if (editing) {
                    await Site.api("/api/admin/documents/" + encodeURIComponent(item.id), {
                        method: "PATCH", body: body
                    });
                } else {
                    await Site.api("/api/admin/documents", { method: "POST", body: body });
                }
                Site.closeModal(modal);
                Site.toast("Успешно сохранено!", true);
                await loadDocuments();
                renderDocuments();
                refreshStats();
            } catch (error) {
                errorBox(modal, error.message || "Не удалось сохранить документ.");
                setBusy(submit, false, "", "Сохранить");
                handleFatal(error);
            }
        });
    }

    /* =======================================================================
       ОБРАЩЕНИЯ
       ======================================================================= */

    function appealCard(item) {
        return '<article class="admin-request" data-id="' + esc(item.id) + '">' +
            '<div class="admin-request-head"><h3>' + esc(item.subject) + "</h3>" +
            Site.statusBadge("appeal", item.status) + "</div>" +
            '<p class="admin-request-meta">' + esc(item.name) + " · " + esc(item.email) +
            " · " + esc(Site.formatDate(item.created_at, true)) + "</p>" +
            '<div class="admin-request-text">' + Site.textHtml(item.text) + "</div>" +
            '<div class="field"><label>Ответ ведомства</label>' +
            '<textarea data-answer rows="4" maxlength="10000" placeholder="Текст ответа">' +
            esc(item.answer || "") + "</textarea></div>" +
            '<div class="admin-request-actions">' +
            '<select data-status aria-label="Статус">' +
            statusOptions(Site.APPEAL_STATUS_LABELS, item.status) + "</select>" +
            '<button class="btn sm" type="button" data-act="save">Сохранить</button>' +
            '<button class="btn sm danger" type="button" data-act="delete">Удалить</button>' +
            "</div></article>";
    }

    function renderAppeals() {
        const panel = document.getElementById("panel");
        panel.innerHTML =
            '<div class="admin-head"><div><h2>Обращения граждан</h2>' +
            '<p class="note">Смена статуса и ответ сохраняются сразу, без перезагрузки страницы.</p></div></div>' +
            '<div class="adminbar"><select id="appealFilter" aria-label="Фильтр по статусу">' +
            '<option value="">Все статусы</option>' +
            statusOptions(Site.APPEAL_STATUS_LABELS, state.appealFilter) +
            "</select><span class=\"admincount\" id=\"appealCount\"></span></div>" +
            '<div id="appealList"></div>';

        const filter = document.getElementById("appealFilter");
        if (filter) {
            filter.value = state.appealFilter;
            filter.addEventListener("change", function () {
                state.appealFilter = filter.value;
                paintAppeals();
            });
        }
        paintAppeals();
    }

    function paintAppeals() {
        const host = document.getElementById("appealList");
        if (!host) return;
        const items = state.appeals.filter(function (item) {
            return !state.appealFilter || item.status === state.appealFilter;
        });
        const counter = document.getElementById("appealCount");
        if (counter) counter.textContent = "Показано: " + items.length + " из " + state.appeals.length;
        host.innerHTML = items.length
            ? items.map(appealCard).join("")
            : '<div class="empty">' + (state.appeals.length
                ? "Обращений с таким статусом нет."
                : "Обращений пока нет.") + "</div>";

        host.onclick = async function (event) {
            const button = event.target.closest("button[data-act]");
            if (!button) return;
            const card = button.closest(".admin-request");
            if (!card) return;
            const id = card.dataset.id;
            const item = state.appeals.find(function (appeal) { return appeal.id === id; });
            if (!item) return;

            if (button.dataset.act === "delete") {
                if (!confirm("Удалить обращение «" + item.subject + "»?")) return;
                try {
                    await Site.api("/api/admin/appeals/" + encodeURIComponent(id), { method: "DELETE" });
                    await loadAppeals();
                    paintAppeals();
                    Site.toast("Обращение удалено.", true);
                    refreshStats();
                } catch (error) {
                    Site.toast(error.message || "Не удалось удалить обращение.", false);
                    handleFatal(error);
                }
                return;
            }

            if (button.dataset.act === "save") {
                setBusy(button, true, "Сохранение…", "Сохранить");
                try {
                    await Site.api("/api/admin/appeals/" + encodeURIComponent(id), {
                        method: "PATCH",
                        body: {
                            status: card.querySelector("[data-status]").value,
                            answer: card.querySelector("[data-answer]").value
                        }
                    });
                    await loadAppeals();
                    paintAppeals();
                    Site.toast("Успешно сохранено!", true);
                    refreshStats();
                } catch (error) {
                    Site.toast(error.message || "Не удалось сохранить обращение.", false);
                    setBusy(button, false, "", "Сохранить");
                    handleFatal(error);
                }
            }
        };
    }

    /* =======================================================================
       ЗАЯВКИ
       ======================================================================= */

    function applicationCard(item) {
        return '<article class="admin-request" data-id="' + esc(item.id) + '">' +
            '<div class="admin-request-head"><h3>' + esc(item.position) + "</h3>" +
            Site.statusBadge("application", item.status) + "</div>" +
            '<p class="admin-request-meta">' + esc(item.full_name) + " · " + esc(item.email) +
            (item.discord ? " · Discord: " + esc(item.discord) : "") +
            " · " + esc(Site.formatDate(item.created_at, true)) + "</p>" +
            (item.about ? '<div class="admin-request-text">' + Site.textHtml(item.about) + "</div>" : "") +
            '<div class="field"><label>Комментарий / ответ</label>' +
            '<textarea data-answer rows="4" maxlength="5000" placeholder="Комментарий кандидату">' +
            esc(item.answer || "") + "</textarea></div>" +
            '<div class="admin-request-actions">' +
            '<select data-status aria-label="Статус">' +
            statusOptions(Site.APPLICATION_STATUS_LABELS, item.status) + "</select>" +
            '<button class="btn sm" type="button" data-act="save">Сохранить</button>' +
            '<button class="btn sm danger" type="button" data-act="delete">Удалить</button>' +
            "</div></article>";
    }

    function renderApplications() {
        const panel = document.getElementById("panel");
        panel.innerHTML =
            '<div class="admin-head"><div><h2>Заявки на трудоустройство</h2>' +
            '<p class="note">Статус и комментарий видны кандидату в личном кабинете.</p></div></div>' +
            '<div class="adminbar"><select id="applicationFilter" aria-label="Фильтр по статусу">' +
            '<option value="">Все статусы</option>' +
            statusOptions(Site.APPLICATION_STATUS_LABELS, state.applicationFilter) +
            '</select><span class="admincount" id="applicationCount"></span></div>' +
            '<div id="applicationList"></div>';

        const filter = document.getElementById("applicationFilter");
        if (filter) {
            filter.value = state.applicationFilter;
            filter.addEventListener("change", function () {
                state.applicationFilter = filter.value;
                paintApplications();
            });
        }
        paintApplications();
    }

    function paintApplications() {
        const host = document.getElementById("applicationList");
        if (!host) return;
        const items = state.applications.filter(function (item) {
            return !state.applicationFilter || item.status === state.applicationFilter;
        });
        const counter = document.getElementById("applicationCount");
        if (counter) counter.textContent = "Показано: " + items.length + " из " + state.applications.length;
        host.innerHTML = items.length
            ? items.map(applicationCard).join("")
            : '<div class="empty">' + (state.applications.length
                ? "Заявок с таким статусом нет."
                : "Заявок пока нет.") + "</div>";

        host.onclick = async function (event) {
            const button = event.target.closest("button[data-act]");
            if (!button) return;
            const card = button.closest(".admin-request");
            if (!card) return;
            const id = card.dataset.id;
            const item = state.applications.find(function (application) { return application.id === id; });
            if (!item) return;

            if (button.dataset.act === "delete") {
                if (!confirm("Удалить заявку от «" + item.full_name + "»?")) return;
                try {
                    await Site.api("/api/admin/applications/" + encodeURIComponent(id), { method: "DELETE" });
                    await loadApplications();
                    paintApplications();
                    Site.toast("Заявка удалена.", true);
                    refreshStats();
                } catch (error) {
                    Site.toast(error.message || "Не удалось удалить заявку.", false);
                    handleFatal(error);
                }
                return;
            }

            if (button.dataset.act === "save") {
                setBusy(button, true, "Сохранение…", "Сохранить");
                try {
                    await Site.api("/api/admin/applications/" + encodeURIComponent(id), {
                        method: "PATCH",
                        body: {
                            status: card.querySelector("[data-status]").value,
                            answer: card.querySelector("[data-answer]").value
                        }
                    });
                    await loadApplications();
                    paintApplications();
                    Site.toast("Успешно сохранено!", true);
                    refreshStats();
                } catch (error) {
                    Site.toast(error.message || "Не удалось сохранить заявку.", false);
                    setBusy(button, false, "", "Сохранить");
                    handleFatal(error);
                }
            }
        };
    }

    /* =======================================================================
       ВАКАНСИИ
       ======================================================================= */

    function vacancyRow(item) {
        return '<tr data-id="' + esc(item.id) + '">' +
            "<td><b>" + esc(item.title) + "</b>" +
            (item.description ? '<small class="cell-sub">' + esc(Site.excerpt(item.description, 90)) + "</small>" : "") +
            "</td>" +
            '<td class="muted">' + esc(item.department || "—") + "</td>" +
            '<td><span class="badge ' + (item.status === "open" ? "ok" : "gray") + '">' +
            (item.status === "open" ? "Открыта" : "Закрыта") + "</span></td>" +
            '<td class="num">' + esc(item.display_order) + "</td>" +
            '<td class="row-actions">' +
            '<button type="button" class="btn sm" data-act="edit">Изменить</button>' +
            '<button type="button" class="btn sm danger" data-act="delete">Удалить</button>' +
            "</td></tr>";
    }

    function renderVacancies() {
        const panel = document.getElementById("panel");
        panel.innerHTML =
            '<div class="admin-head"><div><h2>Управление вакансиями</h2>' +
            '<p class="note">Открытые вакансии показываются на странице «Трудоустройство».</p></div>' +
            '<button class="btn sm" type="button" id="vacancyAdd">+ Добавить вакансию</button></div>' +
            '<div id="vacancyHost">' +
            (state.vacancies.length
                ? '<div class="table-wrap"><table class="atable"><thead><tr>' +
                "<th>Вакансия</th><th>Подразделение</th><th>Статус</th><th>Порядок</th><th>Действия</th>" +
                "</tr></thead><tbody>" + state.vacancies.map(vacancyRow).join("") + "</tbody></table></div>"
                : '<div class="empty">Вакансий пока нет. Нажмите «Добавить вакансию».</div>') +
            "</div>";

        document.getElementById("vacancyAdd").onclick = function () { openVacancyForm(null); };

        document.getElementById("vacancyHost").addEventListener("click", function (event) {
            const button = event.target.closest("button[data-act]");
            if (!button) return;
            const row = button.closest("tr");
            if (!row) return;
            const item = state.vacancies.find(function (vacancy) { return vacancy.id === row.dataset.id; });
            if (!item) return;
            if (button.dataset.act === "edit") openVacancyForm(item);
            else if (button.dataset.act === "delete") removeVacancy(item);
        });
    }

    async function removeVacancy(item) {
        if (!confirm("Удалить вакансию «" + item.title + "»?")) return;
        try {
            await Site.api("/api/admin/vacancies/" + encodeURIComponent(item.id), { method: "DELETE" });
            await loadVacancies();
            renderVacancies();
            Site.toast("Вакансия удалена.", true);
            refreshStats();
        } catch (error) {
            Site.toast(error.message || "Не удалось удалить вакансию.", false);
            handleFatal(error);
        }
    }

    function openVacancyForm(item) {
        const editing = !!item;
        const modal = Site.modal(
            '<h2 class="mh">' + (editing ? "Редактировать вакансию" : "Новая вакансия") + "</h2>" +
            '<form id="vacancyForm" class="formgrid" novalidate>' +
            '<div class="field span2"><label for="vfTitle">Название *</label>' +
            '<input id="vfTitle" type="text" required maxlength="160" value="' +
            esc(item ? item.title : "") + '"></div>' +
            '<div class="field"><label for="vfDepartment">Подразделение</label>' +
            '<input id="vfDepartment" type="text" maxlength="120" value="' +
            esc(item ? item.department : "") + '"></div>' +
            '<div class="field"><label for="vfStatus">Статус</label>' +
            '<select id="vfStatus"><option value="open"' + (!item || item.status === "open" ? " selected" : "") +
            '>Открыта</option><option value="closed"' +
            (item && item.status === "closed" ? " selected" : "") + ">Закрыта</option></select></div>" +
            '<div class="field span2"><label for="vfDescription">Описание</label>' +
            '<textarea id="vfDescription" rows="4" maxlength="3000">' +
            esc(item ? item.description || "" : "") + "</textarea></div>" +
            '<div class="field span2"><label for="vfRequirements">Требования</label>' +
            '<textarea id="vfRequirements" rows="4" maxlength="3000">' +
            esc(item ? item.requirements || "" : "") + "</textarea></div>" +
            '<div class="field"><label for="vfOrder">Порядок вывода</label>' +
            '<input id="vfOrder" type="number" min="0" max="1000000" value="' +
            esc(item ? item.display_order : 0) + '"></div>' +
            '<div class="form-actions span2">' +
            '<button class="btn" type="submit" id="vfSubmit">Сохранить</button>' +
            '<button class="btn sm" type="button" data-close>Отмена</button></div>' +
            "</form>",
            "form-modal"
        );

        modal.querySelector("[data-close]").onclick = function () { Site.closeModal(modal); };
        const form = document.getElementById("vacancyForm");
        const submit = document.getElementById("vfSubmit");
        form.addEventListener("submit", async function (event) {
            event.preventDefault();
            const body = {
                title: document.getElementById("vfTitle").value.trim(),
                department: document.getElementById("vfDepartment").value.trim(),
                description: document.getElementById("vfDescription").value.trim(),
                requirements: document.getElementById("vfRequirements").value.trim(),
                status: document.getElementById("vfStatus").value,
                display_order: Number(document.getElementById("vfOrder").value) || 0
            };
            if (!body.title) return errorBox(modal, "Укажите название вакансии.");
            setBusy(submit, true, "Сохранение…", "Сохранить");
            try {
                if (editing) {
                    await Site.api("/api/admin/vacancies/" + encodeURIComponent(item.id), {
                        method: "PATCH", body: body
                    });
                } else {
                    await Site.api("/api/admin/vacancies", { method: "POST", body: body });
                }
                Site.closeModal(modal);
                Site.toast("Успешно сохранено!", true);
                await loadVacancies();
                renderVacancies();
                refreshStats();
            } catch (error) {
                errorBox(modal, error.message || "Не удалось сохранить вакансию.");
                setBusy(submit, false, "", "Сохранить");
                handleFatal(error);
            }
        });
    }

    /* =======================================================================
       ПОЛЬЗОВАТЕЛИ (только admin)
       ======================================================================= */

    function userCard(user) {
        const self = user.id === me.id;
        return '<article class="ucard' + (self ? " self" : "") + '" data-id="' + esc(user.id) + '">' +
            '<div class="uhead"><div class="uwho">' + Auth.avatarHtml(user, "md") +
            "<div><h3>" + esc(user.name) + (self ? ' <span class="badge">вы</span>' : "") + "</h3>" +
            "<p>" + esc(user.email) + " · рег. " + esc(Auth.formatDate(user.createdAt)) +
            " · вход " + esc(Auth.formatDate(user.lastLogin, true)) + "</p></div></div>" +
            '<div class="utags"><span class="badge">' + esc(Auth.roleLabel(user.role)) + "</span>" +
            '<span class="badge gray">' + esc(user.status || "Без статуса") + "</span>" +
            '<span class="badge ' + (user.state === "active" ? "ok" : "warn") + '">' +
            esc(Auth.stateLabel(user.state)) + "</span></div></div>" +
            '<div class="ugrid">' +
            '<div class="field"><label>Должность</label><select data-f="role"' +
            (self ? " disabled" : "") + ">" + roleOptions(user.role) + "</select></div>" +
            '<div class="field"><label>Статус</label><input data-f="status" list="statusPresets" ' +
            'maxlength="80" value="' + esc(user.status || "") + '"></div>' +
            '<div class="field"><label>Состояние</label><select data-f="state"' +
            (self ? " disabled" : "") + ">" + stateOptions(user.state) + "</select></div>" +
            '<div class="uacts"><button class="btn sm" type="button" data-act="save">Сохранить</button>' +
            '<button class="btn sm danger" type="button" data-act="delete"' +
            (self ? " disabled" : "") + ">Удалить</button></div></div></article>";
    }

    function renderUsers() {
        const panel = document.getElementById("panel");
        panel.innerHTML =
            '<div class="admin-head"><div><h2>Пользователи</h2>' +
            '<p class="note">Роли admin и editor получают доступ к панели. ' +
            "Остальные роли — служебные должности профиля.</p></div></div>" +
            '<datalist id="statusPresets">' + Auth.STATUS_PRESETS.map(function (status) {
                return '<option value="' + esc(status) + '">';
            }).join("") + "</datalist>" +
            '<div id="userHost">' +
            (state.users.length
                ? state.users.map(userCard).join("")
                : '<div class="empty">Пользователей пока нет.</div>') +
            "</div>";

        document.getElementById("userHost").addEventListener("click", async function (event) {
            const button = event.target.closest("button[data-act]");
            if (!button) return;
            const card = button.closest(".ucard");
            if (!card) return;
            const id = card.dataset.id;
            const user = state.users.find(function (item) { return item.id === id; });
            if (!user) return;

            if (button.dataset.act === "save") {
                setBusy(button, true, "Сохранение…", "Сохранить");
                try {
                    await Auth.updateUser(id, {
                        role: card.querySelector('[data-f="role"]').value,
                        status: card.querySelector('[data-f="status"]').value,
                        state: card.querySelector('[data-f="state"]').value
                    });
                    await loadUsers();
                    renderUsers();
                    Site.toast("Успешно сохранено!", true);
                } catch (error) {
                    setBusy(button, false, "", "Сохранить");
                    Site.toast(error.message || "Не удалось сохранить пользователя.", false);
                    handleFatal(error);
                }
            } else if (button.dataset.act === "delete") {
                if (!confirm("Удалить аккаунт «" + user.name + "» (" + user.email + ")? Действие необратимо.")) {
                    return;
                }
                try {
                    await Auth.deleteUser(id);
                    await loadUsers();
                    renderUsers();
                    Site.toast("Аккаунт удалён.", true);
                } catch (error) {
                    Site.toast(error.message || "Не удалось удалить аккаунт.", false);
                    handleFatal(error);
                }
            }
        });
    }

    /* ---------- запуск ---------- */

    (async function start() {
        me = Auth.current();
        if (!me) {
            try { me = await Auth.refresh(); } catch (error) { me = null; }
        }
        if (!me) {
            denied("Требуется вход", "Панель управления доступна авторизованным сотрудникам.", true);
            return;
        }
        if (!Auth.canManageContent(me)) {
            denied("Доступ закрыт", "Управлять контентом могут только роли «Администратор» и «Редактор». " +
                "Ваша текущая роль: " + Auth.roleLabel(me.role) + ".", false);
            return;
        }
        renderShell();
        const requested = (location.hash || "").replace("#", "");
        const definition = tabById(requested);
        setTab(definition ? definition.id : allowedTabs()[0].id);
    })();
})();
