/* Общие функции авторизации, паролей и сессий для Cloudflare Worker + D1. */

export class HttpError extends Error {
    constructor(status, message) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

export function fail(status, message) {
    throw new HttpError(status, message);
}

export const ROLES = [
    { id: "user", label: "Пользователь", level: 0 },
    { id: "referent", label: "Референт", level: 10 },
    { id: "press", label: "Пресс-служба", level: 20 },
    { id: "assistant", label: "Помощник министра", level: 30 },
    { id: "deputy", label: "Заместитель министра", level: 40 },
    { id: "minister", label: "Министр", level: 50 },
    { id: "editor", label: "Редактор", level: 60 },
    { id: "admin", label: "Администратор", level: 100 }
];

export const STATES = [
    { id: "active", label: "Активен" },
    { id: "pending", label: "Ожидает подтверждения" },
    { id: "blocked", label: "Заблокирован" }
];

export const STATUS_PRESETS = [
    "Не назначен",
    "Активен",
    "На рассмотрении",
    "На испытательном сроке",
    "В отпуске",
    "Отстранён",
    "Ветеран"
];

export const ROLE_IDS = new Set(ROLES.map(function (r) { return r.id; }));
export const STATE_IDS = new Set(STATES.map(function (s) { return s.id; }));

/* Cloudflare Workers поддерживает PBKDF2 не более 100 000 итераций. */
const PBKDF2_ITERATIONS = 100000;
const SESSION_TTL_MS = 7 * 86400000;
export const SESSION_COOKIE = "mkfo_session";
export const OAUTH_COOKIE = "mkfo_oauth_state";
const encoder = new TextEncoder();

/* ---------- строки и данные ---------- */

export function cleanText(value, max) {
    return String(value == null ? "" : value)
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, max);
}

export function normalizeEmail(value) {
    return String(value == null ? "" : value).trim().toLowerCase().slice(0, 254);
}

export function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
}

export function validateName(value) {
    const name = cleanText(value, 60);
    if (name.length < 2) fail(400, "Укажите имя (не менее 2 символов).");
    return name;
}

export function validatePassword(password) {
    if (typeof password !== "string" || password.length < 8) {
        fail(400, "Пароль должен содержать не менее 8 символов.");
    }
    if (password.length > 128) {
        fail(400, "Пароль слишком длинный (максимум 128 символов).");
    }
}

/* ---------- JSON и cookies ---------- */

export function json(data, status, headers) {
    const h = new Headers(headers || {});
    h.set("content-type", "application/json; charset=utf-8");
    h.set("cache-control", "no-store");
    return new Response(JSON.stringify(data), { status: status || 200, headers: h });
}

export function readJson(request) {
    const type = request.headers.get("content-type") || "";
    if (!type.includes("application/json")) fail(415, "Ожидается JSON.");
    return request.json().catch(function () {
        fail(400, "Некорректный JSON.");
    }).then(function (body) {
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            fail(400, "Некорректные данные.");
        }
        return body;
    });
}

export function redirect(location, cookies) {
    const headers = new Headers({ location: location, "cache-control": "no-store" });
    (cookies || []).forEach(function (cookie) { headers.append("set-cookie", cookie); });
    return new Response(null, { status: 302, headers: headers });
}

export function parseCookies(header) {
    const out = {};
    if (!header) return out;
    header.split(";").forEach(function (part) {
        const i = part.indexOf("=");
        if (i < 0) return;
        const key = part.slice(0, i).trim();
        const value = part.slice(i + 1).trim();
        if (!key || Object.prototype.hasOwnProperty.call(out, key)) return;
        try { out[key] = decodeURIComponent(value); } catch (e) { out[key] = value; }
    });
    return out;
}

export function serializeCookie(name, value, options) {
    options = options || {};
    const parts = [name + "=" + value, "Path=" + (options.path || "/")];
    parts.push("Max-Age=" + Math.max(0, Math.floor(options.maxAge || 0)));
    if (options.httpOnly !== false) parts.push("HttpOnly");
    parts.push("SameSite=" + (options.sameSite || "Lax"));
    if (options.secure) parts.push("Secure");
    return parts.join("; ");
}

function isSecure(request) {
    return new URL(request.url).protocol === "https:";
}

export function sessionCookie(token, request) {
    return serializeCookie(SESSION_COOKIE, token, {
        maxAge: SESSION_TTL_MS / 1000,
        secure: isSecure(request),
        httpOnly: true,
        sameSite: "Lax"
    });
}

export function clearSessionCookie(request) {
    return serializeCookie(SESSION_COOKIE, "", {
        maxAge: 0,
        secure: isSecure(request),
        httpOnly: true,
        sameSite: "Lax"
    });
}

export function oauthStateCookie(value, request) {
    return serializeCookie(OAUTH_COOKIE, value, {
        maxAge: 600,
        secure: isSecure(request),
        httpOnly: true,
        sameSite: "Lax"
    });
}

export function clearOauthStateCookie(request) {
    return serializeCookie(OAUTH_COOKIE, "", {
        maxAge: 0,
        secure: isSecure(request),
        httpOnly: true,
        sameSite: "Lax"
    });
}

export function assertSameOrigin(request) {
    const method = request.method.toUpperCase();
    if (method === "GET" || method === "HEAD" || method === "OPTIONS") return;
    const origin = request.headers.get("Origin");
    const expected = new URL(request.url).origin;
    if (!origin || origin !== expected) fail(403, "Запрос отклонён: неверный источник.");
}

export function appOrigin(env, request) {
    if (env.APP_URL && /^https?:\/\//.test(env.APP_URL)) return env.APP_URL.replace(/\/+$/, "");
    return new URL(request.url).origin;
}

/* ---------- криптография ---------- */

function bytesToBase64(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s);
}

function base64ToBytes(value) {
    const bin = atob(value);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
}

export function safeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
    let diff = 0;
    for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
    return diff === 0;
}

export function randomToken(byteLength) {
    const bytes = crypto.getRandomValues(new Uint8Array(byteLength || 32));
    return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function sha256Base64(value) {
    const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
    return bytesToBase64(new Uint8Array(digest));
}

async function derivePassword(password, saltBase64, iterations) {
    const material = await crypto.subtle.importKey(
        "raw",
        encoder.encode(password),
        { name: "PBKDF2" },
        false,
        ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: base64ToBytes(saltBase64),
            iterations: iterations,
            hash: "SHA-256"
        },
        material,
        256
    );
    return bytesToBase64(new Uint8Array(bits));
}

export async function makePassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltBase64 = bytesToBase64(salt);
    return {
        hash: await derivePassword(password, saltBase64, PBKDF2_ITERATIONS),
        salt: saltBase64,
        iterations: PBKDF2_ITERATIONS
    };
}

export async function verifyPassword(password, user) {
    if (!user || !user.password_hash || !user.password_salt) return false;
    const hash = await derivePassword(
        password,
        user.password_salt,
        Number(user.password_iterations) || PBKDF2_ITERATIONS
    );
    return safeEqual(hash, user.password_hash);
}

/* ---------- пользователи и сессии ---------- */

/* Фото профиля может лежать в D1 (BLOB), поэтому его нельзя тянуть в каждом запросе. */
export const USER_COLUMNS =
    "id, name, email, password_hash, password_salt, password_iterations, role, status, state, " +
    "avatar_key, avatar_updated_at, discord_id, discord_username, discord_global_name, " +
    "created_at, updated_at, last_login";

export async function findUserByEmail(env, email) {
    return (await env.DB.prepare("SELECT " + USER_COLUMNS + " FROM users WHERE email = ?")
        .bind(email).first()) || null;
}

export async function findUserById(env, id) {
    return (await env.DB.prepare("SELECT " + USER_COLUMNS + " FROM users WHERE id = ?")
        .bind(id).first()) || null;
}

export async function countUsers(env) {
    const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
    return row ? Number(row.n) : 0;
}

export async function adminCount(env) {
    const row = await env.DB.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'admin'").first();
    return row ? Number(row.n) : 0;
}

export function publicUser(row) {
    return {
        id: row.id,
        name: row.name,
        email: row.email,
        role: row.role,
        status: row.status,
        state: row.state,
        avatarUpdatedAt: row.avatar_updated_at || null,
        discord: row.discord_id ? {
            id: row.discord_id,
            username: row.discord_username || "",
            globalName: row.discord_global_name || ""
        } : null,
        createdAt: row.created_at,
        lastLogin: row.last_login || null
    };
}

export async function createSession(env, userId, request) {
    const token = randomToken(32);
    const id = await sha256Base64(token);
    const now = Date.now();
    await env.DB.batch([
        env.DB.prepare("DELETE FROM sessions WHERE expires_at <= ?").bind(now),
        env.DB.prepare("INSERT INTO sessions (id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
            .bind(id, userId, now, now + SESSION_TTL_MS)
    ]);
    return { token: token, id: id, cookie: sessionCookie(token, request) };
}

export async function sessionUser(request, env) {
    const token = parseCookies(request.headers.get("Cookie"))[SESSION_COOKIE];
    if (!token || token.length > 200) return null;
    const id = await sha256Base64(token);
    const row = await env.DB.prepare(
        "SELECT u." + USER_COLUMNS.split(", ").join(", u.") + ", s.id AS session_id " +
        "FROM sessions s JOIN users u ON u.id = s.user_id " +
        "WHERE s.id = ? AND s.expires_at > ?"
    ).bind(id, Date.now()).first();
    if (!row) return null;
    if (row.state === "blocked") {
        await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(id).run();
        return null;
    }
    return { user: row, sessionId: id };
}

export async function requireUser(request, env) {
    const session = await sessionUser(request, env);
    if (!session) fail(401, "Требуется вход в аккаунт.");
    return session;
}

export async function requireAdmin(request, env) {
    const session = await requireUser(request, env);
    if (session.user.role !== "admin") {
        fail(403, "Недостаточно прав. Действие доступно только администратору.");
    }
    return session;
}

/* Редактор контента: администратор или редактор.
   Управление пользователями остаётся только за администратором. */
export function canManageContent(user) {
    return !!user && (user.role === "admin" || user.role === "editor");
}

export async function requireEditor(request, env) {
    const session = await requireUser(request, env);
    if (!canManageContent(session.user)) {
        fail(403, "Недостаточно прав. Раздел доступен администратору и редактору.");
    }
    return session;
}

export async function deleteSessionsForUser(env, userId, exceptSessionId) {
    if (exceptSessionId) {
        await env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?")
            .bind(userId, exceptSessionId).run();
    } else {
        await env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(userId).run();
    }
}

export async function deleteSession(env, sessionId) {
    await env.DB.prepare("DELETE FROM sessions WHERE id = ?").bind(sessionId).run();
}
