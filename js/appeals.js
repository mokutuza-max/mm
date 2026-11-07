/* Отправка обращения гражданина без перезагрузки страницы. */

(function () {
    "use strict";

    const form = document.getElementById("appealForm");
    if (!form) return;

    const message = document.getElementById("appealMsg");
    const submit = document.getElementById("appealSubmit");
    const nameInput = document.getElementById("appealName");
    const emailInput = document.getElementById("appealEmail");
    const subjectInput = document.getElementById("appealSubject");
    const textInput = document.getElementById("appealText");
    const consent = document.getElementById("appealConsent");

    function show(text, ok) {
        message.hidden = false;
        message.className = "msg " + (ok ? "ok" : "err");
        message.textContent = text;
    }

    const me = window.Auth ? Auth.current() : null;
    if (me) {
        if (nameInput && !nameInput.value) nameInput.value = me.name || "";
        if (emailInput && !emailInput.value) emailInput.value = me.email || "";
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        message.hidden = true;

        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const subject = subjectInput.value.trim();
        const text = textInput.value.trim();

        if (name.length < 2) return show("Укажите ФИО или имя (не менее 2 символов).", false);
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return show("Укажите корректный e-mail.", false);
        if (!subject) return show("Укажите тему обращения.", false);
        if (text.length < 10) return show("Опишите суть обращения (не менее 10 символов).", false);
        if (consent && !consent.checked) return show("Подтвердите согласие на обработку данных.", false);

        submit.disabled = true;
        submit.textContent = "Отправка…";
        try {
            const result = await Site.api("/api/appeals", {
                method: "POST",
                body: { name: name, email: email, subject: subject, text: text }
            });
            const ticket = result && result.ticket ? result.ticket : "";
            show("Обращение зарегистрировано" + (ticket ? ". Номер: " + ticket : "") +
                ". Ответ появится в личном кабинете.", true);
            subjectInput.value = "";
            textInput.value = "";
            if (consent) consent.checked = false;
        } catch (error) {
            show(error.message || "Не удалось отправить обращение.", false);
        } finally {
            submit.disabled = false;
            submit.textContent = "Отправить обращение";
        }
    });
})();
