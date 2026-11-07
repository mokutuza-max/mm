/*
 * Контент сайта: состав, новости, документы, обращения, вакансии и заявки.
 * Все запросы к D1 используют .bind() — конкатенация пользовательских данных в SQL запрещена.
 */

import {
    fail,
    json,
    readJson,
    cleanText,
    sessionUser,
    requireUser,
    requireEditor
} from "./auth.js";

const NEWS_STATUSES = new Set(["draft", "published"]);
const APPEAL_STATUSES = new Set(["new", "in_progress", "answered", "rejected"]);
const APPLICATION_STATUSES = new Set(["new", "reviewed", "invited", "rejected"]);
const VACANCY_STATUSES = new Set(["open", "closed"]);

/* До 700 000 символов Base64 — примерно 500 КБ исходного изображения.
   Это ниже лимита размера строки D1 и достаточно для карточек и лент. */
const MAX_IMAGE_CHARS = 700000;
const MAX_CONTENT_CHARS = 20000;

function has(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
}

function requiredLine(value, max, message) {
    const text = cleanText(value, max);
    if (!text) fail(400, message);
    return text;
}

function optionalLine(value, max) {
    const text = cleanText(value, max);
    return text ? text : null;
}

function requiredMultiline(value, max, message) {
    const text = String(value == null ? "" : value)
        .replace(/\r\n?/g, "\n")
        .trim()
        .slice(0, max);
    if (!text) fail(400, message);
    return text;
}

function optionalMultiline(value, max) {
    const text = String(value == null ? "" : value)
        .replace(/\r\n?/g, "\n")
        .trim()
        .slice(0, max);
    return text ? text : null;
}

function parseLimit(value, fallback) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(100, Math.max(1, number));
}

function parseOrder(value, fallback) {
    const number = Number.parseInt(value, 10);
    if (!Number.isFinite(number)) return fallback;
    return Math.min(1000000, Math.max(0, number));
}

function imageUrl(value, label) {
    const url = String(value == null ? "" : value).trim();
    if (!url) return null;
    if (url.length > MAX_IMAGE_CHARS) {
        fail(413, label + ": изображение слишком большое. Уменьшите файл или укажите ссылку.");
    }
    if (/^data:image\/(?:png|jpe?g|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(url)) {
        return url;
    }
    if (url.startsWith("//")) fail(400, label + ": укажите ссылку с http:// или https://.");
    if (url.length <= 2048 && /^https?:\/\/[^\s"'<>]+$/i.test(url)) {
        return url;
    }
    if (url.length <= 2048 && /^\/?[A-Za-z0-9._\-\/%]+\.(?:png|jpe?g|webp|gif|svg)$/i.test(url)) {
        return url;
    }
    fail(400, label + ": укажите ссылку http(s)://…, путь к файлу или Base64-изображение.");
}

function fileUrl(value, label) {
    const url = String(value == null ? "" : value).trim();
    if (!url) fail(400, label + ": укажите ссылку на файл.");
    if (url.length > 2048) fail(400, label + ": ссылка слишком длинная.");
    if (url.startsWith("//")) fail(400, label + ": укажите ссылку с http:// или https://.");
    if (/^https?:\/\/[^\s"'<>]+$/i.test(url)) return url;
    if (/^\/?[A-Za-z0-9._\-\/%?=&+#]+$/.test(url) && !url.includes("..")) return url;
    fail(400, label + ": укажите ссылку http(s)://… или путь к файлу на сайте.");
}

function emailValue(value) {
    const email = cleanText(value, 254).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        fail(400, "Укажите корректный e-mail.");
    }
    return email;
}

function rows(result) {
    return (result && result.results) || [];
}

async function selectOne(env, sql, ...params) {
    const statement = env.DB.prepare(sql);
    return (params.length ? await statement.bind(...params).first() : await statement.first()) || null;
}

async function selectAll(env, sql, ...params) {
    const statement = env.DB.prepare(sql);
    const result = params.length ? await statement.bind(...params).all() : await statement.all();
    return rows(result);
}

/* ---------- публичные данные ---------- */

export async function listNews(env, url) {
    const limit = parseLimit(url.searchParams.get("limit"), 50);
    const category = cleanText(url.searchParams.get("category"), 60);
    const query = cleanText(url.searchParams.get("q"), 80);

    let sql = "SELECT id, title, content, category, image_url, status, created_at, updated_at " +
        "FROM news WHERE status = 'published'";
    const params = [];
    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }
    if (query) {
        sql += " AND (title LIKE ? OR content LIKE ?)";
        params.push("%" + query + "%", "%" + query + "%");
    }
    sql += " ORDER BY created_at DESC LIMIT ?";
    params.push(limit);

    return json({ news: await selectAll(env, sql, ...params) });
}

export async function getNews(env, id) {
    const row = await selectOne(env,
        "SELECT id, title, content, category, image_url, status, created_at, updated_at " +
        "FROM news WHERE id = ? AND status = 'published'", id);
    if (!row) fail(404, "Новость не найдена.");
    return json({ item: row });
}

export async function listStaff(env) {
    return json({
        staff: await selectAll(env,
            "SELECT id, full_name, rank, position, department, photo_url, display_order " +
            "FROM staff ORDER BY display_order ASC, created_at ASC")
    });
}

export async function listDocuments(env, url) {
    const category = cleanText(url.searchParams.get("category"), 60);
    const params = [];
    let sql = "SELECT id, title, file_url, category, description, created_at " +
        "FROM documents WHERE 1 = 1";
    if (category) {
        sql += " AND category = ?";
        params.push(category);
    }
    sql += " ORDER BY category ASC, created_at DESC";
    return json({ documents: await selectAll(env, sql, ...params) });
}

export async function listVacancies(env, url) {
    const includeClosed = url.searchParams.get("all") === "1";
    const sql = "SELECT id, title, department, description, requirements, status, display_order " +
        "FROM vacancies " + (includeClosed ? "" : "WHERE status = 'open' ") +
        "ORDER BY display_order ASC, created_at ASC";
    return json({ vacancies: await selectAll(env, sql) });
}

/* ---------- обращения граждан ---------- */

export async function createAppeal(request, env) {
    const body = await readJson(request);
    const session = await sessionUser(request, env);
    const user = session ? session.user : null;

    const name = requiredLine(body.name || (user && user.name), 120, "Укажите ФИО или имя.");
    const email = emailValue(body.email || (user && user.email));
    const subject = requiredLine(body.subject, 200, "Укажите тему обращения.");
    const text = requiredMultiline(body.text, 10000, "Введите текст обращения.");
    const id = crypto.randomUUID();
    const now = Date.now();

    await env.DB.prepare(
        "INSERT INTO appeals (id, user_id, name, email, subject, text, status, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, 'new', ?, ?)"
    ).bind(id, user ? user.id : null, name, email, subject, text, now, now).run();

    return json({ ok: true, ticket: id }, 201);
}

export async function myAppeals(request, env) {
    const session = await requireUser(request, env);
    const items = await selectAll(env,
        "SELECT id, subject, text, status, answer, answered_at, created_at " +
        "FROM appeals WHERE user_id = ? ORDER BY created_at DESC",
        session.user.id);
    return json({ appeals: items });
}

export async function listAppeals(request, env, url) {
    await requireEditor(request, env);
    const status = url.searchParams.get("status") || "";
    const params = [];
    let sql = "SELECT id, user_id, name, email, subject, text, status, answer, answered_at, created_at " +
        "FROM appeals";
    if (APPEAL_STATUSES.has(status)) {
        sql += " WHERE status = ?";
        params.push(status);
    }
    sql += " ORDER BY created_at DESC LIMIT 300";
    return json({ appeals: await selectAll(env, sql, ...params) });
}

export async function updateAppeal(request, env, id) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const current = await selectOne(env, "SELECT * FROM appeals WHERE id = ?", id);
    if (!current) fail(404, "Обращение не найдено.");

    const status = has(body, "status") ? String(body.status) : current.status;
    if (!APPEAL_STATUSES.has(status)) fail(400, "Неизвестный статус обращения.");

    const answer = has(body, "answer") ? optionalMultiline(body.answer, 10000) : current.answer;
    const answeredAt = answer ? (current.answer === answer ? current.answered_at : Date.now()) : null;
    const now = Date.now();

    await env.DB.prepare(
        "UPDATE appeals SET status = ?, answer = ?, answered_at = ?, updated_at = ? WHERE id = ?"
    ).bind(status, answer, answeredAt, now, id).run();

    return json({
        item: await selectOne(env, "SELECT * FROM appeals WHERE id = ?", id)
    });
}

export async function deleteAppeal(request, env, id) {
    await requireEditor(request, env);
    const current = await selectOne(env, "SELECT id FROM appeals WHERE id = ?", id);
    if (!current) fail(404, "Обращение не найдено.");
    await env.DB.prepare("DELETE FROM appeals WHERE id = ?").bind(id).run();
    return json({ ok: true });
}

/* ---------- заявки на трудоустройство ---------- */

export async function createApplication(request, env) {
    const body = await readJson(request);
    const session = await sessionUser(request, env);
    const user = session ? session.user : null;

    const fullName = requiredLine(body.full_name || (user && user.name), 120, "Укажите ФИО.");
    const email = emailValue(body.email || (user && user.email));
    const discord = optionalLine(body.discord, 80);
    const vacancyId = optionalLine(body.vacancy_id, 64);
    const position = requiredLine(body.position, 160, "Выберите или укажите должность.");
    const about = optionalMultiline(body.about, 5000);

    let vacancyCheck = null;
    if (vacancyId) {
        vacancyCheck = await selectOne(env, "SELECT id FROM vacancies WHERE id = ?", vacancyId);
        if (!vacancyCheck) fail(400, "Выбранная вакансия не найдена.");
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
        "INSERT INTO applications " +
        "(id, user_id, full_name, email, discord, vacancy_id, position, about, status, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)"
    ).bind(id, user ? user.id : null, fullName, email, discord,
        vacancyCheck ? vacancyCheck.id : null, position, about, now, now).run();

    return json({ ok: true, ticket: id }, 201);
}

export async function myApplications(request, env) {
    const session = await requireUser(request, env);
    const items = await selectAll(env,
        "SELECT id, position, about, status, answer, created_at " +
        "FROM applications WHERE user_id = ? ORDER BY created_at DESC",
        session.user.id);
    return json({ applications: items });
}

export async function listApplications(request, env, url) {
    await requireEditor(request, env);
    const status = url.searchParams.get("status") || "";
    const params = [];
    let sql = "SELECT id, user_id, full_name, email, discord, vacancy_id, position, about, status, answer, created_at " +
        "FROM applications";
    if (APPLICATION_STATUSES.has(status)) {
        sql += " WHERE status = ?";
        params.push(status);
    }
    sql += " ORDER BY created_at DESC LIMIT 300";
    return json({ applications: await selectAll(env, sql, ...params) });
}

export async function updateApplication(request, env, id) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const current = await selectOne(env, "SELECT * FROM applications WHERE id = ?", id);
    if (!current) fail(404, "Заявка не найдена.");

    const status = has(body, "status") ? String(body.status) : current.status;
    if (!APPLICATION_STATUSES.has(status)) fail(400, "Неизвестный статус заявки.");
    const answer = has(body, "answer") ? optionalMultiline(body.answer, 5000) : current.answer;

    await env.DB.prepare(
        "UPDATE applications SET status = ?, answer = ?, updated_at = ? WHERE id = ?"
    ).bind(status, answer, Date.now(), id).run();

    return json({
        item: await selectOne(env, "SELECT * FROM applications WHERE id = ?", id)
    });
}

export async function deleteApplication(request, env, id) {
    await requireEditor(request, env);
    const current = await selectOne(env, "SELECT id FROM applications WHERE id = ?", id);
    if (!current) fail(404, "Заявка не найдена.");
    await env.DB.prepare("DELETE FROM applications WHERE id = ?").bind(id).run();
    return json({ ok: true });
}

/* ---------- администрирование состава ---------- */

export async function adminListStaff(request, env) {
    await requireEditor(request, env);
    return json({
        staff: await selectAll(env,
            "SELECT id, full_name, rank, position, department, photo_url, display_order, created_at, updated_at " +
            "FROM staff ORDER BY display_order ASC, created_at ASC")
    });
}

export async function createStaff(request, env) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const fullName = requiredLine(body.full_name, 120, "Укажите ФИО.");
    const rank = cleanText(body.rank, 80);
    const position = requiredLine(body.position, 160, "Укажите должность.");
    const department = cleanText(body.department, 120);
    const photo = imageUrl(body.photo_url, "Фото");

    let order;
    if (has(body, "display_order")) {
        order = parseOrder(body.display_order, 0);
    } else {
        const row = await selectOne(env, "SELECT COALESCE(MAX(display_order), 0) + 10 AS next FROM staff");
        order = row ? Number(row.next) || 10 : 10;
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
        "INSERT INTO staff (id, full_name, rank, position, department, photo_url, display_order, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, fullName, rank, position, department, photo, order, now, now).run();

    return json({
        item: await selectOne(env, "SELECT * FROM staff WHERE id = ?", id)
    }, 201);
}

export async function updateStaff(request, env, id) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const current = await selectOne(env, "SELECT * FROM staff WHERE id = ?", id);
    if (!current) fail(404, "Сотрудник не найден.");

    const fullName = has(body, "full_name")
        ? requiredLine(body.full_name, 120, "Укажите ФИО.")
        : current.full_name;
    const rank = has(body, "rank") ? cleanText(body.rank, 80) : current.rank;
    const position = has(body, "position")
        ? requiredLine(body.position, 160, "Укажите должность.")
        : current.position;
    const department = has(body, "department") ? cleanText(body.department, 120) : current.department;
    const photo = has(body, "photo_url") ? imageUrl(body.photo_url, "Фото") : current.photo_url;
    const order = has(body, "display_order")
        ? parseOrder(body.display_order, current.display_order)
        : current.display_order;

    await env.DB.prepare(
        "UPDATE staff SET full_name = ?, rank = ?, position = ?, department = ?, photo_url = ?, " +
        "display_order = ?, updated_at = ? WHERE id = ?"
    ).bind(fullName, rank, position, department, photo, order, Date.now(), id).run();

    return json({
        item: await selectOne(env, "SELECT * FROM staff WHERE id = ?", id)
    });
}

export async function deleteStaff(request, env, id) {
    await requireEditor(request, env);
    const current = await selectOne(env, "SELECT id FROM staff WHERE id = ?", id);
    if (!current) fail(404, "Сотрудник не найден.");
    await env.DB.prepare("DELETE FROM staff WHERE id = ?").bind(id).run();
    return json({ ok: true });
}

export async function reorderStaff(request, env) {
    await requireEditor(request, env);
    const body = await readJson(request);
    if (!Array.isArray(body.ids) || !body.ids.length || body.ids.length > 500) {
        fail(400, "Передайте список идентификаторов в правильном порядке.");
    }

    const ids = body.ids.map(function (value) {
        const id = String(value == null ? "" : value).trim();
        if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) fail(400, "Некорректный идентификатор сотрудника.");
        return id;
    });

    const existing = await selectAll(env, "SELECT id FROM staff");
    const known = new Set(existing.map(function (row) { return row.id; }));
    ids.forEach(function (id) {
        if (!known.has(id)) fail(404, "Сотрудник не найден: " + id);
    });
    if (new Set(ids).size !== ids.length) {
        fail(400, "Список сотрудников содержит повторяющиеся идентификаторы.");
    }

    const now = Date.now();
    const statements = ids.map(function (id, index) {
        return env.DB.prepare(
            "UPDATE staff SET display_order = ?, updated_at = ? WHERE id = ?"
        ).bind((index + 1) * 10, now, id);
    });
    await env.DB.batch(statements);

    return json({
        staff: await selectAll(env,
            "SELECT id, full_name, rank, position, department, photo_url, display_order, created_at, updated_at " +
            "FROM staff ORDER BY display_order ASC, created_at ASC")
    });
}

/* ---------- администрирование новостей ---------- */

export async function adminListNews(request, env) {
    await requireEditor(request, env);
    return json({
        news: await selectAll(env,
            "SELECT id, title, content, category, image_url, status, author_id, created_at, updated_at " +
            "FROM news ORDER BY created_at DESC")
    });
}

export async function createNews(request, env) {
    const session = await requireEditor(request, env);
    const body = await readJson(request);
    const title = requiredLine(body.title, 200, "Укажите заголовок новости.");
    const content = requiredMultiline(body.content, MAX_CONTENT_CHARS, "Введите текст новости.");
    const category = cleanText(body.category, 60) || "Общее";
    const image = imageUrl(body.image_url, "Изображение");
    const status = NEWS_STATUSES.has(body.status) ? body.status : "draft";

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
        "INSERT INTO news (id, title, content, category, image_url, status, author_id, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, title, content, category, image, status, session.user.id, now, now).run();

    return json({
        item: await selectOne(env, "SELECT * FROM news WHERE id = ?", id)
    }, 201);
}

export async function updateNews(request, env, id) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const current = await selectOne(env, "SELECT * FROM news WHERE id = ?", id);
    if (!current) fail(404, "Новость не найдена.");

    const title = has(body, "title")
        ? requiredLine(body.title, 200, "Укажите заголовок новости.")
        : current.title;
    const content = has(body, "content")
        ? requiredMultiline(body.content, MAX_CONTENT_CHARS, "Введите текст новости.")
        : current.content;
    const category = has(body, "category") ? (cleanText(body.category, 60) || "Общее") : current.category;
    const image = has(body, "image_url") ? imageUrl(body.image_url, "Изображение") : current.image_url;
    let status = current.status;
    if (has(body, "status")) {
        if (!NEWS_STATUSES.has(body.status)) fail(400, "Неизвестный статус новости.");
        status = body.status;
    }

    await env.DB.prepare(
        "UPDATE news SET title = ?, content = ?, category = ?, image_url = ?, status = ?, updated_at = ? WHERE id = ?"
    ).bind(title, content, category, image, status, Date.now(), id).run();

    return json({
        item: await selectOne(env, "SELECT * FROM news WHERE id = ?", id)
    });
}

export async function deleteNews(request, env, id) {
    await requireEditor(request, env);
    const current = await selectOne(env, "SELECT id FROM news WHERE id = ?", id);
    if (!current) fail(404, "Новость не найдена.");
    await env.DB.prepare("DELETE FROM news WHERE id = ?").bind(id).run();
    return json({ ok: true });
}

/* ---------- администрирование документов ---------- */

export async function adminListDocuments(request, env) {
    await requireEditor(request, env);
    return json({
        documents: await selectAll(env,
            "SELECT id, title, file_url, category, description, created_at, updated_at " +
            "FROM documents ORDER BY category ASC, created_at DESC")
    });
}

export async function createDocument(request, env) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const title = requiredLine(body.title, 200, "Укажите название документа.");
    const url = fileUrl(body.file_url, "Файл");
    const category = cleanText(body.category, 60) || "Общее";
    const description = optionalMultiline(body.description, 1000);

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
        "INSERT INTO documents (id, title, file_url, category, description, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, title, url, category, description, now, now).run();

    return json({
        item: await selectOne(env, "SELECT * FROM documents WHERE id = ?", id)
    }, 201);
}

export async function updateDocument(request, env, id) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const current = await selectOne(env, "SELECT * FROM documents WHERE id = ?", id);
    if (!current) fail(404, "Документ не найден.");

    const title = has(body, "title")
        ? requiredLine(body.title, 200, "Укажите название документа.")
        : current.title;
    const url = has(body, "file_url") ? fileUrl(body.file_url, "Файл") : current.file_url;
    const category = has(body, "category") ? (cleanText(body.category, 60) || "Общее") : current.category;
    const description = has(body, "description")
        ? optionalMultiline(body.description, 1000)
        : current.description;

    await env.DB.prepare(
        "UPDATE documents SET title = ?, file_url = ?, category = ?, description = ?, updated_at = ? WHERE id = ?"
    ).bind(title, url, category, description, Date.now(), id).run();

    return json({
        item: await selectOne(env, "SELECT * FROM documents WHERE id = ?", id)
    });
}

export async function deleteDocument(request, env, id) {
    await requireEditor(request, env);
    const current = await selectOne(env, "SELECT id FROM documents WHERE id = ?", id);
    if (!current) fail(404, "Документ не найден.");
    await env.DB.prepare("DELETE FROM documents WHERE id = ?").bind(id).run();
    return json({ ok: true });
}

/* ---------- администрирование вакансий ---------- */

export async function adminListVacancies(request, env) {
    await requireEditor(request, env);
    return json({
        vacancies: await selectAll(env,
            "SELECT id, title, department, description, requirements, status, display_order, created_at, updated_at " +
            "FROM vacancies ORDER BY display_order ASC, created_at ASC")
    });
}

export async function createVacancy(request, env) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const title = requiredLine(body.title, 160, "Укажите название вакансии.");
    const department = cleanText(body.department, 120);
    const description = optionalMultiline(body.description, 3000);
    const requirements = optionalMultiline(body.requirements, 3000);
    const status = VACANCY_STATUSES.has(body.status) ? body.status : "open";

    let order;
    if (has(body, "display_order")) {
        order = parseOrder(body.display_order, 0);
    } else {
        const row = await selectOne(env,
            "SELECT COALESCE(MAX(display_order), 0) + 10 AS next FROM vacancies");
        order = row ? Number(row.next) || 10 : 10;
    }

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB.prepare(
        "INSERT INTO vacancies (id, title, department, description, requirements, status, display_order, created_at, updated_at) " +
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, title, department, description, requirements, status, order, now, now).run();

    return json({
        item: await selectOne(env, "SELECT * FROM vacancies WHERE id = ?", id)
    }, 201);
}

export async function updateVacancy(request, env, id) {
    await requireEditor(request, env);
    const body = await readJson(request);
    const current = await selectOne(env, "SELECT * FROM vacancies WHERE id = ?", id);
    if (!current) fail(404, "Вакансия не найдена.");

    const title = has(body, "title")
        ? requiredLine(body.title, 160, "Укажите название вакансии.")
        : current.title;
    const department = has(body, "department") ? cleanText(body.department, 120) : current.department;
    const description = has(body, "description")
        ? optionalMultiline(body.description, 3000)
        : current.description;
    const requirements = has(body, "requirements")
        ? optionalMultiline(body.requirements, 3000)
        : current.requirements;
    let status = current.status;
    if (has(body, "status")) {
        if (!VACANCY_STATUSES.has(body.status)) fail(400, "Неизвестный статус вакансии.");
        status = body.status;
    }
    const order = has(body, "display_order")
        ? parseOrder(body.display_order, current.display_order)
        : current.display_order;

    await env.DB.prepare(
        "UPDATE vacancies SET title = ?, department = ?, description = ?, requirements = ?, " +
        "status = ?, display_order = ?, updated_at = ? WHERE id = ?"
    ).bind(title, department, description, requirements, status, order, Date.now(), id).run();

    return json({
        item: await selectOne(env, "SELECT * FROM vacancies WHERE id = ?", id)
    });
}

export async function deleteVacancy(request, env, id) {
    await requireEditor(request, env);
    const current = await selectOne(env, "SELECT id FROM vacancies WHERE id = ?", id);
    if (!current) fail(404, "Вакансия не найдена.");
    await env.DB.prepare("DELETE FROM vacancies WHERE id = ?").bind(id).run();
    return json({ ok: true });
}

/* ---------- сводка ---------- */

export async function contentStats(request, env) {
    const session = await requireEditor(request, env);
    const counts = await Promise.all([
        env.DB.prepare("SELECT COUNT(*) AS n FROM news").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM news WHERE status = 'draft'").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM staff").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM documents").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM appeals WHERE status = 'new'").first(),
        env.DB.prepare("SELECT COUNT(*) AS n FROM applications WHERE status = 'new'").first()
    ]);
    const value = function (index) {
        return counts[index] ? Number(counts[index].n) || 0 : 0;
    };
    const stats = {
        news: value(0),
        drafts: value(1),
        staff: value(2),
        documents: value(3),
        appealsNew: value(4),
        applicationsNew: value(5)
    };
    if (session.user.role === "admin") {
        const users = await env.DB.prepare("SELECT COUNT(*) AS n FROM users").first();
        stats.users = users ? Number(users.n) || 0 : 0;
    }
    return json({ stats: stats });
}
