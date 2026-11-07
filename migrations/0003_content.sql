-- Контент сайта: состав, новости, обращения, документы, вакансии и заявки.
-- Все текстовые поля хранятся в UTF-8. Значения по умолчанию заданы для новых записей.
-- Миграция безопасна для повторного запуска: используются IF NOT EXISTS.

/* ---------- Состав (руководство и военнослужащие) ---------- */
CREATE TABLE IF NOT EXISTS staff (
    id TEXT PRIMARY KEY,
    full_name TEXT NOT NULL,
    rank TEXT NOT NULL DEFAULT '',
    position TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    photo_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_staff_order ON staff(display_order, created_at);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);

/* ---------- Новости ---------- */
CREATE TABLE IF NOT EXISTS news (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Общее',
    image_url TEXT,
    status TEXT NOT NULL DEFAULT 'draft', -- draft | published
    author_id TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_news_status ON news(status, created_at);
CREATE INDEX IF NOT EXISTS idx_news_category ON news(category);

/* ---------- Обращения граждан ---------- */
CREATE TABLE IF NOT EXISTS appeals (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    text TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new', -- new | in_progress | answered | rejected
    answer TEXT,
    answered_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_appeals_user ON appeals(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON appeals(status, created_at);

/* ---------- Документы ---------- */
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    file_url TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Общее',
    description TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);

/* ---------- Вакансии ---------- */
CREATE TABLE IF NOT EXISTS vacancies (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    description TEXT,
    requirements TEXT,
    status TEXT NOT NULL DEFAULT 'open', -- open | closed
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_vacancies_status ON vacancies(status, display_order);

/* ---------- Заявки на трудоустройство ---------- */
CREATE TABLE IF NOT EXISTS applications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    discord TEXT,
    vacancy_id TEXT,
    position TEXT NOT NULL,
    about TEXT,
    status TEXT NOT NULL DEFAULT 'new', -- new | reviewed | invited | rejected
    answer TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status, created_at);
