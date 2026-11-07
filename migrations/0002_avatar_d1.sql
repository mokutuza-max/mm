-- Хранение фото профиля в D1 для случая, когда бакет R2 не подключён.

ALTER TABLE users ADD COLUMN avatar_data BLOB;
ALTER TABLE users ADD COLUMN avatar_mime TEXT;
