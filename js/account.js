/* Личный кабинет: профиль, фото, Discord, пароль. */

(function () {
    "use strict";

    const app = document.getElementById("app");
    const esc = Auth.escapeHtml;
    let flash = null;

    function queryFlash() {
        const params = new URLSearchParams(location.search);
        const discord = params.get("discord");
        const denied = params.get("denied");
        let message = null;
        if (discord === "linked") message = { text: "Discord успешно привязан.", ok: true };
        else if (discord === "login") message = { text: "Вход через Discord выполнен.", ok: true };
        else if (discord === "exists") message = { text: "Этот Discord уже привязан к другому аккаунту.", ok: false };
        else if (discord === "error") message = { text: "Не удалось подтвердить Discord. Попробуйте ещё раз.", ok: false };
        else if (denied === "admin") message = { text: "Панель управления доступна администраторам и редакторам.", ok: false };
        if (message) history.replaceState({}, "", location.pathname);
        return message;
    }

    function setFlash(text, ok) {
        flash = { text: text, ok: !!ok };
    }

    function flashHtml() {
        if (!flash) return "";
        return '<div class="msg ' + (flash.ok ? "ok" : "err") + '" role="status">' + esc(flash.text) + "</div>";
    }

    function guestView() {
        app.innerHTML =
            '<div class="authcard">' + flashHtml() +
            "<h1>Вы не вошли</h1>" +
            '<p class="sub">Войдите в аккаунт или создайте новый, чтобы открыть личный кабинет.</p>' +
            '<div class="uactions"><a class="btn" href="vhod.html?next=akkaunt.html">Войти</a>' +
            '<a class="btn sm" href="registraciya.html">Регистрация</a></div></div>';
    }

    function discordSection(me) {
        if (!Auth.config.discord) {
            return '<section class="panel"><h2>Discord</h2>' +
                '<p class="note">Привязка Discord не настроена на сервере.</p></section>';
        }
        if (me.discord) {
            const globalName = me.discord.globalName
                ? ' <span class="muted">(' + esc(me.discord.globalName) + ")</span>"
                : "";
            return '<section class="panel"><h2>Discord</h2>' +
                '<p class="discord-line">Привязан: <b>@' + esc(me.discord.username) + "</b>" + globalName + "</p>" +
                '<button class="btn sm danger" id="unlinkDiscord" type="button">Отвязать Discord</button></section>';
        }
        return '<section class="panel"><h2>Discord</h2>' +
            '<p class="note">Привяжите Discord, чтобы входить на сайт через него.</p>' +
            '<a class="btn sm discord" href="' + Auth.discordStartUrl("link") + '">Привязать Discord</a></section>';
    }

    function avatarBox(me) {
        const hasAvatar = !!me.avatarUpdatedAt;
        return '<div class="avatar-box">' + Auth.avatarHtml(me, "xl") +
            '<input type="file" id="avatarInput" accept="image/jpeg,image/png,image/webp" hidden>' +
            '<button class="btn sm" id="avatarUpload" type="button">' +
            (hasAvatar ? "Заменить фото" : "Загрузить фото") + "</button>" +
            (hasAvatar ? '<button class="btn sm danger" id="avatarDelete" type="button">Удалить фото</button>' : "") +
            '<p class="hint">JPG, PNG или WebP. Фото автоматически уменьшится до 512 px.</p></div>';
    }

    function profileView(me) {
        app.innerHTML = flashHtml() +
            '<div class="profile">' +
            '<aside class="panel pcard">' + avatarBox(me) +
            "<h2>" + esc(me.name) + "</h2>" +
            '<p class="pemail">' + esc(me.email) + "</p>" +
            '<div class="utags"><span class="badge">' + esc(Auth.roleLabel(me.role)) + "</span>" +
            '<span class="badge gray">' + esc(me.status || "Без статуса") + "</span>" +
            '<span class="badge ' + (me.state === "active" ? "ok" : "warn") + '">' + esc(Auth.stateLabel(me.state)) + "</span></div>" +
            (Auth.canManageContent(me)
                ? '<a class="btn" href="administraciya.html">Панель управления</a>'
                : '<p class="note">Должность и статус назначает администратор.</p>') +
            '<button class="btn sm" id="logout" type="button">Выйти из аккаунта</button>' +
            "</aside>" +
            '<div class="pcol">' +
            '<section class="panel"><h2>Данные аккаунта</h2><dl class="kv">' +
            "<dt>E-mail</dt><dd>" + esc(me.email) + "</dd>" +
            "<dt>Должность</dt><dd>" + esc(Auth.roleLabel(me.role)) + "</dd>" +
            "<dt>Статус</dt><dd>" + esc(me.status || "Без статуса") + "</dd>" +
            "<dt>Состояние</dt><dd>" + esc(Auth.stateLabel(me.state)) + "</dd>" +
            "<dt>Регистрация</dt><dd>" + esc(Auth.formatDate(me.createdAt, true)) + "</dd>" +
            "<dt>Последний вход</dt><dd>" + esc(Auth.formatDate(me.lastLogin, true)) + "</dd>" +
            "</dl></section>" +
            discordSection(me) +
            '<section class="panel"><h2>Изменить имя</h2>' +
            '<form id="nameForm"><div class="field"><label for="fio">ФИО / отображаемое имя</label>' +
            '<input id="fio" type="text" required minlength="2" maxlength="60" value="' + esc(me.name) + '"></div>' +
            '<button class="btn sm" type="submit">Сохранить имя</button></form></section>' +
            '<section class="panel"><h2>Смена пароля</h2>' +
            '<form id="passForm">' +
            '<div class="field"><label for="oldPass">Текущий пароль</label><input id="oldPass" type="password" autocomplete="current-password" required></div>' +
            '<div class="field"><label for="newPass">Новый пароль</label><input id="newPass" type="password" autocomplete="new-password" required minlength="8" maxlength="128"></div>' +
            '<div class="field"><label for="newPass2">Повторите новый пароль</label><input id="newPass2" type="password" autocomplete="new-password" required minlength="8" maxlength="128"></div>' +
            '<button class="btn sm" type="submit">Изменить пароль</button></form></section>' +
            '<section class="panel" id="requestsPanel"><h2>Мои обращения и заявки</h2>' +
            '<div id="myRequests"><p class="note">Загрузка…</p></div></section>' +
            "</div></div>";

        bindProfile(me);
        loadRequests();
    }

    function requestCard(statusKind, title, meta, text, answer) {
        return '<article class="request">' +
            '<div class="request-head"><h3>' + esc(title) + "</h3>" +
            Site.statusBadge(statusKind, meta.status) + "</div>" +
            '<p class="request-meta">' + esc(Site.formatDate(meta.created_at, true)) + "</p>" +
            (text ? '<details class="request-details"><summary>Текст</summary><div class="request-text">' +
                Site.textHtml(text) + "</div></details>" : "") +
            (answer ? '<div class="request-answer"><b>Ответ ведомства</b>' +
                Site.textHtml(answer) + "</div>" : "") +
            "</article>";
    }

    async function loadRequests() {
        const host = document.getElementById("myRequests");
        if (!host) return;
        const results = await Promise.allSettled([
            Site.api("/api/me/appeals"),
            Site.api("/api/me/applications")
        ]);
        const appealsResult = results[0];
        const applicationsResult = results[1];
        const appeals = appealsResult.status === "fulfilled"
            ? (appealsResult.value.appeals || []) : [];
        const applications = applicationsResult.status === "fulfilled"
            ? (applicationsResult.value.applications || []) : [];

        if (appealsResult.status === "rejected" && applicationsResult.status === "rejected") {
            host.innerHTML = '<p class="note">Не удалось загрузить обращения и заявки.</p>';
            return;
        }

        let html = "";
        if (appeals.length) {
            html += '<h3 class="requests-title">Обращения граждан</h3>' +
                appeals.map(function (item) {
                    return requestCard("appeal", item.subject, item, item.text, item.answer);
                }).join("");
        } else {
            html += '<p class="note">Обращений пока нет. <a href="obrashcheniya.html">Направить обращение</a>.</p>';
        }
        if (applications.length) {
            html += '<h3 class="requests-title">Заявки на трудоустройство</h3>' +
                applications.map(function (item) {
                    return requestCard("application", item.position, item, item.about, item.answer);
                }).join("");
        } else {
            html += '<p class="note">Заявок на трудоустройство пока нет. ' +
                '<a href="trudoustroystvo.html">Открыть вакансии</a>.</p>';
        }
        host.innerHTML = html;
    }

    function bindProfile(me) {
        document.getElementById("logout").onclick = async function () {
            this.disabled = true;
            this.textContent = "Выход…";
            await Auth.logout();
            location.href = "index.html";
        };

        document.getElementById("nameForm").addEventListener("submit", async function (event) {
            event.preventDefault();
            const button = this.querySelector("button");
            const name = document.getElementById("fio").value;
            button.disabled = true;
            button.textContent = "Сохранение…";
            try {
                await Auth.updateProfile({ name: name });
                setFlash("Имя сохранено.", true);
            } catch (error) {
                setFlash(error.message, false);
            }
            render(Auth.current());
        });

        document.getElementById("passForm").addEventListener("submit", async function (event) {
            event.preventDefault();
            const button = this.querySelector("button");
            const oldPassword = document.getElementById("oldPass").value;
            const newPassword = document.getElementById("newPass").value;
            const newPassword2 = document.getElementById("newPass2").value;
            if (newPassword !== newPassword2) {
                setFlash("Новые пароли не совпадают.", false);
                render(Auth.current());
                return;
            }
            button.disabled = true;
            button.textContent = "Сохранение…";
            try {
                await Auth.changePassword(oldPassword, newPassword);
                setFlash("Пароль изменён.", true);
            } catch (error) {
                setFlash(error.message, false);
            }
            render(Auth.current());
        });

        const unlink = document.getElementById("unlinkDiscord");
        if (unlink) unlink.onclick = async function () {
            if (!confirm("Отвязать Discord от аккаунта?")) return;
            this.disabled = true;
            try {
                await Auth.unlinkDiscord();
                setFlash("Discord отвязан.", true);
            } catch (error) {
                setFlash(error.message, false);
            }
            render(Auth.current());
        };

        const input = document.getElementById("avatarInput");
        const uploadButton = document.getElementById("avatarUpload");
        uploadButton.onclick = function () { input.click(); };
        input.onchange = async function () {
            const file = input.files && input.files[0];
            if (!file) return;
            if (!/^image\/(jpeg|png|webp)$/.test(file.type)) {
                setFlash("Выберите изображение JPG, PNG или WebP.", false);
                render(Auth.current());
                return;
            }
            if (file.size > 8 * 1024 * 1024) {
                setFlash("Файл слишком большой (максимум 8 МБ).", false);
                render(Auth.current());
                return;
            }
            uploadButton.disabled = true;
            uploadButton.textContent = "Загрузка…";
            try {
                const blob = await resizeImage(file, 512);
                await Auth.uploadAvatar(blob);
                setFlash("Фото обновлено.", true);
            } catch (error) {
                setFlash(error.message || "Не удалось загрузить фото.", false);
            }
            render(Auth.current());
        };

        const remove = document.getElementById("avatarDelete");
        if (remove) remove.onclick = async function () {
            if (!confirm("Удалить фотографию профиля?")) return;
            this.disabled = true;
            try {
                await Auth.deleteAvatar();
                setFlash("Фото удалено.", true);
            } catch (error) {
                setFlash(error.message, false);
            }
            render(Auth.current());
        };
    }

    function resizeImage(file, maxSize) {
        return new Promise(function (resolve, reject) {
            const url = URL.createObjectURL(file);
            const image = new Image();
            image.onload = function () {
                try {
                    const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
                    const width = Math.max(1, Math.round(image.naturalWidth * scale));
                    const height = Math.max(1, Math.round(image.naturalHeight * scale));
                    const canvas = document.createElement("canvas");
                    canvas.width = width;
                    canvas.height = height;
                    const context = canvas.getContext("2d");
                    context.fillStyle = "#111111";
                    context.fillRect(0, 0, width, height);
                    context.drawImage(image, 0, 0, width, height);
                    URL.revokeObjectURL(url);
                    canvas.toBlob(function (blob) {
                        if (blob) resolve(blob);
                        else reject(new Error("Не удалось обработать изображение."));
                    }, "image/jpeg", 0.9);
                } catch (error) {
                    URL.revokeObjectURL(url);
                    reject(error);
                }
            };
            image.onerror = function () {
                URL.revokeObjectURL(url);
                reject(new Error("Не удалось прочитать изображение."));
            };
            image.src = url;
        });
    }

    function render(user) {
        if (!user) {
            guestView();
            return;
        }
        profileView(user);
    }

    (async function start() {
        flash = queryFlash();
        const user = await Auth.ready();
        render(user);
    })();
})();
