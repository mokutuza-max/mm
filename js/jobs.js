/* Вакансии и заявка на трудоустройство. */

(function () {
    "use strict";

    const list = document.getElementById("vacancyList");
    const count = document.getElementById("vacancyCount");
    const form = document.getElementById("applyForm");
    if (!list || !form) return;

    const message = document.getElementById("applyMsg");
    const submit = document.getElementById("applySubmit");
    const nameInput = document.getElementById("applyName");
    const emailInput = document.getElementById("applyEmail");
    const discordInput = document.getElementById("applyDiscord");
    const positionSelect = document.getElementById("applyPosition");
    const customField = document.getElementById("customPositionField");
    const customInput = document.getElementById("applyCustomPosition");
    const aboutInput = document.getElementById("applyAbout");
    const consent = document.getElementById("applyConsent");

    let vacancies = [];

    function show(text, ok) {
        message.hidden = false;
        message.className = "msg " + (ok ? "ok" : "err");
        message.textContent = text;
    }

    function vacancyCard(item) {
        return '<article class="vacancy rv">' +
            '<div class="vacancy-head"><div><span class="badge">' +
            Site.esc(item.department || "Министерство") + "</span>" +
            "<h3>" + Site.esc(item.title) + "</h3></div>" +
            '<button class="btn sm" type="button" data-apply="' + Site.esc(item.id) + '">Подать заявку</button>' +
            "</div>" +
            (item.description ? "<p>" + Site.esc(item.description) + "</p>" : "") +
            (item.requirements
                ? '<p class="vacancy-req"><b>Требования:</b> ' + Site.esc(item.requirements) + "</p>"
                : "") +
            "</article>";
    }

    function fillSelect() {
        positionSelect.innerHTML = '<option value="">Выберите вакансию</option>' +
            vacancies.map(function (item) {
                return '<option value="' + Site.esc(item.id) + '">' + Site.esc(item.title) +
                    (item.department ? " — " + Site.esc(item.department) : "") + "</option>";
            }).join("") +
            '<option value="other">Другая должность</option>';
        toggleCustom();
    }

    function toggleCustom() {
        const other = positionSelect.value === "other";
        customField.hidden = !other;
        customInput.required = other;
    }

    function render() {
        if (count) count.textContent = vacancies.length ? "Открыто: " + vacancies.length : "";
        list.innerHTML = vacancies.length
            ? vacancies.map(vacancyCard).join("")
            : '<div class="empty">Сейчас открытых вакансий нет. Вы можете подать заявку на другую должность.</div>';
        fillSelect();
        Site.reveal(list);
    }

    list.addEventListener("click", function (event) {
        const button = event.target.closest("[data-apply]");
        if (!button) return;
        positionSelect.value = button.dataset.apply;
        toggleCustom();
        document.getElementById("applySection").scrollIntoView({ behavior: "smooth", block: "start" });
    });

    positionSelect.addEventListener("change", toggleCustom);

    const me = window.Auth ? Auth.current() : null;
    if (me) {
        if (!nameInput.value) nameInput.value = me.name || "";
        if (!emailInput.value) emailInput.value = me.email || "";
        if (me.discord && me.discord.username && !discordInput.value) {
            discordInput.value = me.discord.username;
        }
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        message.hidden = true;

        const fullName = nameInput.value.trim();
        const email = emailInput.value.trim();
        const discord = discordInput.value.trim();
        const selected = positionSelect.value;
        const about = aboutInput.value.trim();

        if (fullName.length < 2) return show("Укажите ФИО или игровое имя.", false);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return show("Укажите корректный e-mail.", false);
        if (!selected) return show("Выберите вакансию или укажите должность.", false);

        let vacancyId = null;
        let position = "";
        if (selected === "other") {
            position = customInput.value.trim();
            if (position.length < 2) return show("Укажите желаемую должность.", false);
        } else {
            const item = vacancies.find(function (vacancy) { return vacancy.id === selected; });
            if (!item) return show("Выбранная вакансия не найдена. Обновите страницу.", false);
            vacancyId = item.id;
            position = item.title;
        }

        if (consent && !consent.checked) return show("Подтвердите согласие на обработку данных.", false);

        submit.disabled = true;
        submit.textContent = "Отправка…";
        try {
            const result = await Site.api("/api/applications", {
                method: "POST",
                body: {
                    full_name: fullName,
                    email: email,
                    discord: discord,
                    vacancy_id: vacancyId,
                    position: position,
                    about: about
                }
            });
            const ticket = result && result.ticket ? result.ticket : "";
            show("Заявка зарегистрирована" + (ticket ? ". Номер: " + ticket : "") +
                ". Статус доступен в личном кабинете.", true);
            form.reset();
            toggleCustom();
            if (me) {
                nameInput.value = me.name || "";
                emailInput.value = me.email || "";
                if (me.discord && me.discord.username) discordInput.value = me.discord.username;
            }
        } catch (error) {
            show(error.message || "Не удалось отправить заявку.", false);
        } finally {
            submit.disabled = false;
            submit.textContent = "Отправить заявку";
        }
    });

    (async function load() {
        try {
            const data = await Site.api("/api/vacancies");
            vacancies = (data && data.vacancies) || [];
            render();
        } catch (error) {
            list.innerHTML = '<div class="empty">Не удалось загрузить вакансии. ' +
                Site.esc(error.message) + "</div>";
        }
    })();
})();
