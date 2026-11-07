/* REST API сайта. */

import {
    fail,
    json,
    readJson,
    assertSameOrigin,
    validateName,
    validatePassword,
    normalizeEmail,
    validEmail,
    cleanText,
    makePassword,
    verifyPassword,
    findUserByEmail,
    findUserById,
    countUsers,
    adminCount,
    publicUser,
    createSession,
    sessionUser,
    requireUser,
    requireAdmin,
    deleteSession,
    deleteSessionsForUser,
    clearSessionCookie,
    ROLES,
    STATES,
    STATUS_PRESETS,
    ROLE_IDS,
    STATE_IDS,
    USER_COLUMNS
} from "./auth.js";
import { discordStart, discordCallback } from "./discord.js";
import {
    listNews,
    getNews,
    listStaff,
    listDocuments,
    listVacancies,
    createAppeal,
    myAppeals,
    listAppeals,
    updateAppeal,
    deleteAppeal,
    createApplication,
    myApplications,
    listApplications,
    updateApplication,
    deleteApplication,
    adminListStaff,
    createStaff,
    updateStaff,
    deleteStaff,
    reorderStaff,
    adminListNews,
    createNews,
    updateNews,
    deleteNews,
    adminListDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    adminListVacancies,
    createVacancy,
    updateVacancy,
    deleteVacancy,
    contentStats
} from "./content.js";

function has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

export async function handleApi(request, env, url) {
    const path = url.pathname;
    const method = request.method.toUpperCase();

    if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS") {
        assertSameOrigin(request);
    }

    if (path === "/api/config" && method === "GET") {
        return json({
            discord: !!(env.DISCORD_CLIENT_ID && env.DISCORD_CLIENT_SECRET),
            roles: ROLES,
            states: STATES,
            statusPresets: STATUS_PRESETS
        });
    }

    if (path === "/api/auth/register" && method === "POST") return register(request, env);
    if (path === "/api/auth/login" && method === "POST") return login(request, env);
    if (path === "/api/auth/logout" && method === "POST") return logout(request, env);
    if (path === "/api/auth/discord/start" && method === "GET") return discordStart(request, env, url);
    if (path === "/api/auth/discord/callback" && method === "GET") return discordCallback(request, env, url);

    if (path === "/api/me" && method === "GET") return me(request, env);
    if (path === "/api/me" && method === "PATCH") return updateMe(request, env);
    if (path === "/api/me/password" && method === "POST") return changePassword(request, env);
    if (path === "/api/me/avatar" && method === "POST") return uploadAvatar(request, env);
    if (path === "/api/me/avatar" && method === "DELETE") return deleteAvatar(request, env);
    if (path === "/api/me/discord/unlink" && method === "POST") return unlinkDiscord(request, env);

    if (path === "/api/users" && method === "GET") return listUsers(request, env);

    const userMatch = path.match(/^\/api\/users\/([A-Za-z0-9_-]{1,64})$/);
    if (userMatch && method === "PATCH") return updateUser(request, env, userMatch[1]);
    if (userMatch && method === "DELETE") return removeUser(request, env, userMatch[1]);

    const avatarMatch = path.match(/^\/api\/avatar\/([A-Za-z0-9_-]{1,64})$/);
    if (avatarMatch && method === "GET") return getAvatar(env, avatarMatch[1]);

    /* ---------- публичный контент ---------- */
    if (path === "/api/news" && method === "GET") return listNews(env, url);
    if (path === "/api/staff" && method === "GET") return listStaff(env);
    if (path === "/api/documents" && method === "GET") return listDocuments(env, url);
    if (path === "/api/vacancies" && method === "GET") return listVacancies(env, url);
    if (path === "/api/appeals" && method === "POST") return createAppeal(request, env);
    if (path === "/api/applications" && method === "POST") return createApplication(request, env);
    if (path === "/api/me/appeals" && method === "GET") return myAppeals(request, env);
    if (path === "/api/me/applications" && method === "GET") return myApplications(request, env);

    const newsMatch = path.match(/^\/api\/news\/([A-Za-z0-9_-]{1,64})$/);
    if (newsMatch && method === "GET") return getNews(env, newsMatch[1]);

    /* ---------- админ-панель ---------- */
    if (path === "/api/admin/stats" && method === "GET") return contentStats(request, env);

    if (path === "/api/admin/staff" && method === "GET") return adminListStaff(request, env);
    if (path === "/api/admin/staff" && method === "POST") return createStaff(request, env);
    if (path === "/api/admin/staff/reorder" && method === "POST") return reorderStaff(request, env);

    const staffMatch = path.match(/^\/api\/admin\/staff\/([A-Za-z0-9_-]{1,64})$/);
    if (staffMatch && method === "PATCH") return updateStaff(request, env, staffMatch[1]);
    if (staffMatch && method === "DELETE") return deleteStaff(request, env, staffMatch[1]);

    if (path === "/api/admin/news" && method === "GET") return adminListNews(request, env);
    if (path === "/api/admin/news" && method === "POST") return createNews(request, env);

    const adminNewsMatch = path.match(/^\/api\/admin\/news\/([A-Za-z0-9_-]{1,64})$/);
    if (adminNewsMatch && method === "PATCH") return updateNews(request, env, adminNewsMatch[1]);
    if (adminNewsMatch && method === "DELETE") return deleteNews(request, env, adminNewsMatch[1]);

    if (path === "/api/admin/documents" && method === "GET") return adminListDocuments(request, env);
    if (path === "/api/admin/documents" && method === "POST") return createDocument(request, env);

    const documentMatch = path.match(/^\/api\/admin\/documents\/([A-Za-z0-9_-]{1,64})$/);
    if (documentMatch && method === "PATCH") return updateDocument(request, env, documentMatch[1]);
    if (documentMatch && method === "DELETE") return deleteDocument(request, env, documentMatch[1]);

    if (path === "/api/admin/vacancies" && method === "GET") return adminListVacancies(request, env);
    if (path === "/api/admin/vacancies" && method === "POST") return createVacancy(request, env);

    const vacancyMatch = path.match(/^\/api\/admin\/vacancies\/([A-Za-z0-9_-]{1,64})$/);
    if (vacancyMatch && method === "PATCH") return updateVacancy(request, env, vacancyMatch[1]);
    if (vacancyMatch && method === "DELETE") return deleteVacancy(request, env, vacancyMatch[1]);

    if (path === "/api/admin/appeals" && method === "GET") return listAppeals(request, env, url);

    const appealMatch = path.match(/^\/api\/admin\/appeals\/([A-Za-z0-9_-]{1,64})$/);
    if (appealMatch && method === "PATCH") return updateAppeal(request, env, appealMatch[1]);
    if (appealMatch && method === "DELETE") return deleteAppeal(request, env, appealMatch[1]);

    if (path === "/api/admin/applications" && method === "GET") return listApplications(request, env, url);

    const applicationMatch = path.match(/^\/api\/admin\/applications\/([A-Za-z0-9_-]{1,64})$/);
    if (applicationMatch && method === "PATCH") return updateApplication(request, env, applicationMatch[1]);
    if (applicationMatch && method === "DELETE") return deleteApplication(request, env, applicationMatch[1]);

    fail(404, "Не найдено.");
}

/* ---------- регистрация и вход ---------- */

async function register(request, env) {
    const body = await readJson(request);
    const name = validateName(body.name);
    const email = normalizeEmail(body.email);
    if (!validEmail(email)) fail(400, "Укажите корректный e-mail.");
    validatePassword(body.password);

    if (await findUserByEmail(env, email)) {
        fail(409, "Аккаунт с таким e-mail уже зарегистрирован.");
    }

    const first = (await countUsers(env)) === 0;
    const password = await makePassword(body.password);
    const id = crypto.randomUUID();
    const now = Date.now();

    try {
        await env.DB.prepare(
            "INSERT INTO users (id, name, email, password_hash, password_salt, password_iterations, " +
            "role, status, state, created_at, last_login) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        ).bind(
            id, name, email, password.hash, password.salt, password.iterations,
            first ? "admin" : "user",
            first ? "Основатель" : "Не назначен",
            "active", now, null
        ).run();
    } catch (error) {
        if (/UNIQUE/i.test(String(error && error.message))) {
            fail(409, "Аккаунт с таким e-mail уже зарегистрирован.");
        }
        throw error;
    }

    const row = await findUserById(env, id);
    const session = await createSession(env, id, request);
    return json({ user: publicUser(row) }, 201, { "set-cookie": session.cookie });
}

async function login(request, env) {
    const body = await readJson(request);
    const email = normalizeEmail(body.email);
    const password = String(body.password == null ? "" : body.password);
    if (!email || !password) fail(400, "Введите e-mail и пароль.");

    const row = await findUserByEmail(env, email);
    const ok = row ? await verifyPassword(password, row) : false;
    if (!row || !ok) fail(401, "Неверный e-mail или пароль.");
    if (row.state === "blocked") fail(403, "Аккаунт заблокирован администратором.");
    if (row.state === "pending") fail(403, "Аккаунт ожидает подтверждения администратором.");

    const now = Date.now();
    await env.DB.prepare("UPDATE users SET last_login = ? WHERE id = ?").bind(now, row.id).run();
    row.last_login = now;

    const session = await createSession(env, row.id, request);
    return json({ user: publicUser(row) }, 200, { "set-cookie": session.cookie });
}

async function logout(request, env) {
    const session = await sessionUser(request, env);
    if (session) await deleteSession(env, session.sessionId);
    return json({ ok: true }, 200, { "set-cookie": clearSessionCookie(request) });
}

/* ---------- профиль ---------- */

async function me(request, env) {
    const session = await sessionUser(request, env);
    return json({ user: session ? publicUser(session.user) : null });
}

async function updateMe(request, env) {
    const session = await requireUser(request, env);
    const body = await readJson(request);
    const name = validateName(body.name);
    await env.DB.prepare("UPDATE users SET name = ?, updated_at = ? WHERE id = ?")
        .bind(name, Date.now(), session.user.id).run();
    const row = await findUserById(env, session.user.id);
    return json({ user: publicUser(row) });
}

async function changePassword(request, env) {
    const session = await requireUser(request, env);
    const body = await readJson(request);
    const current = String(body.currentPassword == null ? "" : body.currentPassword);
    if (!(await verifyPassword(current, session.user))) {
        fail(400, "Текущий пароль указан неверно.");
    }
    validatePassword(body.newPassword);
    const password = await makePassword(body.newPassword);
    const now = Date.now();
    await env.DB.batch([
        env.DB.prepare(
            "UPDATE users SET password_hash = ?, password_salt = ?, password_iterations = ?, updated_at = ? WHERE id = ?"
        ).bind(password.hash, password.salt, password.iterations, now, session.user.id),
        env.DB.prepare("DELETE FROM sessions WHERE user_id = ? AND id <> ?")
            .bind(session.user.id, session.sessionId)
    ]);
    return json({ ok: true });
}

/* ---------- аватар ---------- */

function detectImageType(bytes) {
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg";
    }
    if (bytes.length >= 8 &&
        bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
        bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
        return "image/png";
    }
    if (bytes.length >= 12 &&
        bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) {
        return "image/webp";
    }
    return null;
}

const D1_AVATAR_LIMIT = 1024 * 1024;

function toBytes(value) {
    if (!value) return null;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    if (Array.isArray(value)) return new Uint8Array(value);
    return null;
}

async function uploadAvatar(request, env) {
    const session = await requireUser(request, env);
    const type = request.headers.get("content-type") || "";
    if (!type.startsWith("multipart/form-data")) fail(415, "Ожидается загрузка файла.");

    let form;
    try {
        form = await request.formData();
    } catch (e) {
        fail(400, "Не удалось прочитать файл.");
    }
    const file = form.get("avatar");
    if (!file || typeof file === "string") fail(400, "Выберите файл изображения.");
    if (file.size > 2 * 1024 * 1024) fail(413, "Файл слишком большой (максимум 2 МБ).");

    const bytes = new Uint8Array(await file.arrayBuffer());
    const imageType = detectImageType(bytes);
    if (!imageType) fail(415, "Файл должен быть изображением JPG, PNG или WebP.");

    const now = Date.now();

    /* Если бакет R2 не подключён, фото хранится прямо в базе D1. */
    if (env.AVATARS) {
        const key = "avatars/" + session.user.id;
        await env.AVATARS.put(key, bytes, {
            httpMetadata: {
                contentType: imageType,
                cacheControl: "public, max-age=31536000, immutable"
            }
        });
        await env.DB.prepare(
            "UPDATE users SET avatar_key = ?, avatar_data = NULL, avatar_mime = ?, avatar_updated_at = ?, " +
            "updated_at = ? WHERE id = ?"
        ).bind(key, imageType, now, now, session.user.id).run();
    } else {
        if (bytes.length > D1_AVATAR_LIMIT) {
            fail(413, "Файл слишком большой. Загрузите изображение меньшего размера.");
        }
        await env.DB.prepare(
            "UPDATE users SET avatar_key = NULL, avatar_data = ?, avatar_mime = ?, avatar_updated_at = ?, " +
            "updated_at = ? WHERE id = ?"
        ).bind(bytes, imageType, now, now, session.user.id).run();
    }

    const row = await findUserById(env, session.user.id);
    return json({ user: publicUser(row) });
}

async function deleteAvatar(request, env) {
    const session = await requireUser(request, env);
    if (env.AVATARS && session.user.avatar_key) {
        try { await env.AVATARS.delete(session.user.avatar_key); } catch (e) { /* ignore */ }
    }
    await env.DB.prepare(
        "UPDATE users SET avatar_key = NULL, avatar_data = NULL, avatar_mime = NULL, " +
        "avatar_updated_at = NULL, updated_at = ? WHERE id = ?"
    ).bind(Date.now(), session.user.id).run();
    const row = await findUserById(env, session.user.id);
    return json({ user: publicUser(row) });
}

async function getAvatar(env, id) {
    const notFound = function () {
        return new Response("Не найдено", { status: 404, headers: { "cache-control": "no-store" } });
    };
    const row = await env.DB.prepare(
        "SELECT avatar_key, avatar_data, avatar_mime FROM users WHERE id = ?"
    ).bind(id).first();
    if (!row) return notFound();

    if (env.AVATARS && row.avatar_key) {
        const object = await env.AVATARS.get(row.avatar_key);
        if (object) {
            const headers = new Headers({
                "content-type": (object.httpMetadata && object.httpMetadata.contentType) || "image/jpeg",
                "cache-control": "public, max-age=31536000, immutable",
                "x-content-type-options": "nosniff"
            });
            if (object.httpEtag) headers.set("etag", object.httpEtag);
            return new Response(object.body, { headers: headers });
        }
    }

    const bytes = toBytes(row.avatar_data);
    if (!bytes || !bytes.length) return notFound();

    return new Response(bytes, {
        headers: {
            "content-type": row.avatar_mime || "image/jpeg",
            "content-length": String(bytes.length),
            "cache-control": "public, max-age=31536000, immutable",
            "x-content-type-options": "nosniff"
        }
    });
}

/* ---------- Discord ---------- */

async function unlinkDiscord(request, env) {
    const session = await requireUser(request, env);
    await env.DB.prepare(
        "UPDATE users SET discord_id = NULL, discord_username = NULL, discord_global_name = NULL, updated_at = ? WHERE id = ?"
    ).bind(Date.now(), session.user.id).run();
    const row = await findUserById(env, session.user.id);
    return json({ user: publicUser(row) });
}

/* ---------- администрирование ---------- */

async function listUsers(request, env) {
    await requireAdmin(request, env);
    const result = await env.DB.prepare(
        "SELECT " + USER_COLUMNS + " FROM users ORDER BY created_at ASC"
    ).all();
    return json({ users: (result.results || []).map(publicUser) });
}

async function updateUser(request, env, id) {
    const session = await requireAdmin(request, env);
    const target = await findUserById(env, id);
    if (!target) fail(404, "Пользователь не найден.");
    const body = await readJson(request);

    const patch = {};
    if (has(body, "role")) {
        if (!ROLE_IDS.has(body.role)) fail(400, "Неизвестная роль.");
        patch.role = body.role;
    }
    if (has(body, "status")) patch.status = cleanText(body.status, 80);
    if (has(body, "state")) {
        if (!STATE_IDS.has(body.state)) fail(400, "Неизвестное состояние аккаунта.");
        patch.state = body.state;
    }
    if (!Object.keys(patch).length) fail(400, "Нет данных для изменения.");

    if (target.id === session.user.id) {
        if (patch.role && patch.role !== "admin") {
            fail(400, "Нельзя снять права администратора с самого себя.");
        }
        if (patch.state && patch.state !== "active") {
            fail(400, "Нельзя изменить состояние собственного аккаунта.");
        }
    }

    const admins = await adminCount(env);
    if (target.role === "admin" && patch.role && patch.role !== "admin" && admins <= 1) {
        fail(400, "Нельзя снять права с последнего администратора.");
    }
    if (target.role === "admin" && patch.state === "blocked" && admins <= 1) {
        fail(400, "Нельзя заблокировать последнего администратора.");
    }

    const role = patch.role || target.role;
    const status = has(patch, "status") ? patch.status : target.status;
    const state = patch.state || target.state;

    await env.DB.prepare(
        "UPDATE users SET role = ?, status = ?, state = ?, updated_at = ? WHERE id = ?"
    ).bind(role, status, state, Date.now(), target.id).run();

    if (state !== "active" && target.id !== session.user.id) {
        await deleteSessionsForUser(env, target.id);
    }

    return json({ user: publicUser(await findUserById(env, target.id)) });
}

async function removeUser(request, env, id) {
    const session = await requireAdmin(request, env);
    if (id === session.user.id) fail(400, "Нельзя удалить собственный аккаунт.");
    const target = await findUserById(env, id);
    if (!target) fail(404, "Пользователь не найден.");
    if (target.role === "admin" && (await adminCount(env)) <= 1) {
        fail(400, "Нельзя удалить последнего администратора.");
    }

    if (env.AVATARS && target.avatar_key) {
        try { await env.AVATARS.delete(target.avatar_key); } catch (e) { /* ignore */ }
    }
    await env.DB.batch([
        env.DB.prepare("DELETE FROM sessions WHERE user_id = ?").bind(target.id),
        env.DB.prepare("DELETE FROM users WHERE id = ?").bind(target.id)
    ]);
    return json({ ok: true });
}
