/* Клиент авторизации: работает с API Cloudflare Worker. */

(function () {
    "use strict";

    const config = window.__CONFIG__ || { discord: false };
    let me = window.__USER__ || null;

    const ROLES = [
        { id: "user", label: "Пользователь", level: 0 },
        { id: "referent", label: "Референт", level: 10 },
        { id: "press", label: "Пресс-служба", level: 20 },
        { id: "assistant", label: "Помощник министра", level: 30 },
        { id: "deputy", label: "Заместитель министра", level: 40 },
        { id: "minister", label: "Министр", level: 50 },
        { id: "editor", label: "Редактор", level: 60 },
        { id: "admin", label: "Администратор", level: 100 }
    ];
    const STATES = [
        { id: "active", label: "Активен" },
        { id: "pending", label: "Ожидает подтверждения" },
        { id: "blocked", label: "Заблокирован" }
    ];
    const STATUS_PRESETS = [
        "Не назначен", "Активен", "На рассмотрении", "На испытательном сроке",
        "В отпуске", "Отстранён", "Ветеран"
    ];

    const ROLE_MAP = {};
    ROLES.forEach(function (role) { ROLE_MAP[role.id] = role; });
    const STATE_MAP = {};
    STATES.forEach(function (state) { STATE_MAP[state.id] = state; });

    function canManageContent(user) {
        return !!user && (user.role === "admin" || user.role === "editor");
    }

    function roleLabel(id) {
        return (ROLE_MAP[id] && ROLE_MAP[id].label) || "Пользователь";
    }

    function stateLabel(id) {
        return (STATE_MAP[id] && STATE_MAP[id].label) || "Активен";
    }

    function escapeHtml(value) {
        return String(value == null ? "" : value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    function initials(name) {
        const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return "?";
        return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
    }

    function formatDate(timestamp, withTime) {
        if (!timestamp) return "—";
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) return "—";
        return date.toLocaleString("ru-RU", withTime
            ? { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }
            : { day: "2-digit", month: "2-digit", year: "numeric" });
    }

    function avatarUrl(user) {
        if (!user || !user.avatarUpdatedAt) return "";
        return "/api/avatar/" + encodeURIComponent(user.id) + "?v=" + encodeURIComponent(user.avatarUpdatedAt);
    }

    function avatarHtml(user, extraClass) {
        const className = "ava" + (extraClass ? " " + extraClass : "");
        const url = avatarUrl(user);
        if (url) {
            return '<span class="' + className + '"><img src="' + escapeHtml(url) + '" alt=""></span>';
        }
        return '<span class="' + className + '">' + escapeHtml(initials(user ? user.name : "")) + "</span>";
    }

    function emit() {
        window.dispatchEvent(new CustomEvent("auth:change"));
    }

    function syncGuestUi() {
        const authed = !!me;
        document.querySelectorAll(".guest-only").forEach(function (el) { el.hidden = authed; });
        document.querySelectorAll(".auth-only").forEach(function (el) { el.hidden = !authed; });
        document.body.classList.toggle("is-auth", authed);
        document.body.classList.toggle("is-admin", authed && me.role === "admin");
    }

    function setUser(user) {
        me = user || null;
        syncGuestUi();
        emit();
    }

    async function parseResponse(response) {
        const type = response.headers.get("content-type") || "";
        let data = null;
        if (type.includes("application/json")) {
            try { data = await response.json(); } catch (e) { data = null; }
        }
        if (!response.ok) {
            const error = new Error((data && data.error) || "Ошибка запроса (" + response.status + ").");
            error.status = response.status;
            error.data = data;
            throw error;
        }
        return data;
    }

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
        const response = await fetch(path, init);
        try {
            return await parseResponse(response);
        } catch (error) {
            if (error.status === 401 && !path.startsWith("/api/auth/login")) setUser(null);
            throw error;
        }
    }

    async function ready() {
        return me;
    }

    async function refresh() {
        const data = await api("/api/me");
        setUser(data ? data.user : null);
        return me;
    }

    async function register(data) {
        const result = await api("/api/auth/register", { method: "POST", body: data });
        setUser(result.user);
        return result.user;
    }

    async function login(email, password) {
        const result = await api("/api/auth/login", {
            method: "POST",
            body: { email: email, password: password }
        });
        setUser(result.user);
        return result.user;
    }

    async function logout() {
        try { await api("/api/auth/logout", { method: "POST" }); } catch (e) { /* ignore */ }
        setUser(null);
    }

    async function updateProfile(data) {
        const result = await api("/api/me", { method: "PATCH", body: data });
        setUser(result.user);
        return result.user;
    }

    async function changePassword(currentPassword, newPassword) {
        await api("/api/me/password", {
            method: "POST",
            body: { currentPassword: currentPassword, newPassword: newPassword }
        });
    }

    async function uploadAvatar(blob) {
        const form = new FormData();
        form.append("avatar", blob, "avatar.jpg");
        const response = await fetch("/api/me/avatar", {
            method: "POST",
            credentials: "same-origin",
            body: form
        });
        try {
            const result = await parseResponse(response);
            setUser(result.user);
            return result.user;
        } catch (error) {
            if (error.status === 401) setUser(null);
            throw error;
        }
    }

    async function deleteAvatar() {
        const result = await api("/api/me/avatar", { method: "DELETE" });
        setUser(result.user);
        return result.user;
    }

    async function unlinkDiscord() {
        const result = await api("/api/me/discord/unlink", { method: "POST" });
        setUser(result.user);
        return result.user;
    }

    async function listUsers() {
        const data = await api("/api/users");
        return data.users || [];
    }

    async function updateUser(id, patch) {
        const data = await api("/api/users/" + encodeURIComponent(id), { method: "PATCH", body: patch });
        return data.user;
    }

    async function deleteUser(id) {
        await api("/api/users/" + encodeURIComponent(id), { method: "DELETE" });
    }

    function discordStartUrl(mode) {
        return "/api/auth/discord/start?mode=" + encodeURIComponent(mode || "link");
    }

    /* ---------- интерфейс шапки ---------- */

    function openAccountMenu() {
        if (!me) return;
        const modal = document.createElement("div");
        modal.className = "md";
        modal.innerHTML =
            '<div class="mb umb" role="dialog" aria-modal="true" aria-label="Аккаунт">' +
            '<button class="x" aria-label="Закрыть">×</button>' +
            '<div class="umhead">' + avatarHtml(me, "lg") +
            '<div><h2 class="uh">' + escapeHtml(me.name) + "</h2>" +
            '<p class="umail">' + escapeHtml(me.email) + "</p></div></div>" +
            '<div class="utags"><span class="badge">' + escapeHtml(roleLabel(me.role)) + "</span>" +
            '<span class="badge gray">' + escapeHtml(me.status || "Без статуса") + "</span>" +
            '<span class="badge ' + (me.state === "active" ? "ok" : "warn") + '">' + escapeHtml(stateLabel(me.state)) + "</span></div>" +
            (me.discord ? '<p class="umail">Discord: @' + escapeHtml(me.discord.username) + "</p>" : "") +
            '<div class="uactions"><a class="btn" href="akkaunt.html">Личный кабинет</a>' +
            (canManageContent(me) ? '<a class="btn sm" href="administraciya.html">Панель управления</a>' : "") +
            '<button class="btn sm" id="um-logout" type="button">Выйти</button></div></div>';

        function close() {
            modal.remove();
            if (!document.querySelector(".md")) document.body.style.overflow = "";
            removeEventListener("keydown", onKey);
        }
        function onKey(event) {
            if (event.key === "Escape") close();
        }

        modal.addEventListener("click", function (event) {
            if (event.target === modal || event.target.closest(".x")) close();
        });
        modal.querySelector("#um-logout").onclick = async function () {
            const button = this;
            button.disabled = true;
            button.textContent = "Выход…";
            await logout();
            close();
            location.href = "index.html";
        };
        document.body.append(modal);
        document.body.style.overflow = "hidden";
        modal.querySelector(".x").focus();
        addEventListener("keydown", onKey);
    }

    function mountWidget(selector) {
        const slot = document.querySelector(selector || "#authslot");
        if (!slot) return;
        if (!me) {
            slot.innerHTML = '<a class="btn sm authbtn" href="vhod.html">Войти</a>';
            return;
        }
        slot.innerHTML =
            '<button class="userbtn" type="button" title="Аккаунт">' +
            avatarHtml(me) +
            '<span class="umeta"><b>' + escapeHtml(me.name) + "</b>" +
            "<small>" + escapeHtml(roleLabel(me.role)) + "</small></span></button>";
        slot.querySelector(".userbtn").onclick = openAccountMenu;
    }

    addEventListener("auth:change", function () { mountWidget(); });

    syncGuestUi();

    window.Auth = {
        ROLES: ROLES,
        STATES: STATES,
        STATUS_PRESETS: STATUS_PRESETS,
        config: config,
        ready: ready,
        refresh: refresh,
        current: function () { return me; },
        register: register,
        login: login,
        logout: logout,
        updateProfile: updateProfile,
        changePassword: changePassword,
        uploadAvatar: uploadAvatar,
        deleteAvatar: deleteAvatar,
        unlinkDiscord: unlinkDiscord,
        listUsers: listUsers,
        updateUser: updateUser,
        deleteUser: deleteUser,
        discordStartUrl: discordStartUrl,
        canManageContent: canManageContent,
        roleLabel: roleLabel,
        stateLabel: stateLabel,
        avatarUrl: avatarUrl,
        avatarHtml: avatarHtml,
        mountWidget: mountWidget,
        escapeHtml: escapeHtml,
        initials: initials,
        formatDate: formatDate
    };
})();
