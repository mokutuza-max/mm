const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();

// Настройка сессий
app.use(session({ secret: 'mo-kfo-secret-key', resave: false, saveUninitialized: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Открываем публичный доступ к стилям, скриптам и картинкам сайта
app.use('/css', express.static(path.join(__dirname, 'css')));
app.use('/img', express.static(path.join(__dirname, 'img')));
app.use('/audio', express.static(path.join(__dirname, 'audio')));
app.use(express.static(__dirname, { index: false })); 

// Функция-фильтр: Проверка авторизации
function checkAuth(req, res, next) {
    if (req.session.user) {
        next(); // Пользователь авторизован, пропускаем дальше
    } else {
        res.sendFile(path.join(__dirname, 'login.html')); // Если нет — отдаем страницу входа
    }
}

// Защищаем главные страницы сайта
app.get('/', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/index.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/sostav.html', checkAuth, (req, res) => res.sendFile(path.join(__dirname, 'sostav.html')));

// Обработчик самой формы регистрации при клике "Войти"
app.post('/api/login', (req, res) => {
    const { name, email } = req.body;
    if (name && email) {
        req.session.user = { name, email }; // Сохраняем сессию
        return res.json({ success: true });
    }
    res.json({ success: false, error: 'Заполните все поля!' });
});

// Запуск сервера на порту 3000
app.listen(3000, () => console.log('Сервер запущен на http://localhost:3000'));
