
// Получаем элементы DOM
const burgerIcon = document.getElementById('burger');
const navMenu = document.querySelector('nav');
const animatedElements = document.querySelectorAll('.rv');
const heroTitleSpans = document.querySelectorAll('.hero h1 span');
const heroButton = document.querySelector('.hero .btn');

// Обработчик для кнопки-бургера
if (burgerIcon && navMenu) {
    burgerIcon.addEventListener('click', () => {
        navMenu.classList.toggle('open'); // Переключаем класс 'open' для показа/скрытия меню
    });
}

// Функция для запуска анимации появления элементов
function animateElements() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('in'); // Добавляем класс 'in' для анимации
                // Если это элемент заголовка, запускаем анимацию букв
                if (entry.target.classList.contains('hero')) {
                    heroTitleSpans.forEach((span, index) => {
                        span.style.setProperty('--d', `${index * 0.09}s`); // Устанавливаем задержку для каждой буквы
                        span.style.animation = 'up .8s forwards'; // Применяем анимацию
                    });
                    // Анимируем кнопку после заголовка
                    if (heroButton) {
                        heroButton.style.animation = 'up .8s 1s forwards';
                    }
                }
            }
        });
    }, { threshold: 0.5 }); // Запускаем анимацию, когда элемент на 50% виден

    // Добавляем элементы для наблюдения
    animatedElements.forEach(el => observer.observe(el));
    if (document.querySelector('.hero')) {
        observer.observe(document.querySelector('.hero'));
    }
}

// Запуск анимации при загрузке страницы
document.addEventListener('DOMContentLoaded', animateElements);

// Пример: если нужно, чтобы при нажатии на закрывающий крестик модального окна оно скрывалось
const closeButton = document.querySelector('.md .x');
const modalWindow = document.querySelector('.md');

if (closeButton && modalWindow) {
    closeButton.addEventListener('click', () => {
        modalWindow.style.display = 'none'; // Скрываем модальное окно
    });

    // Также можно закрыть, кликнув по фону
    modalWindow.addEventListener('click', (event) => {
        if (event.target === modalWindow) {
            modalWindow.style.display = 'none';
        }
    });
}
