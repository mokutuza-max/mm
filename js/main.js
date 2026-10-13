
// Этот файл является примером.
// Вы можете добавить сюда JavaScript-код для интерактивности,
// анимаций, валидации форм и т.д.

document.addEventListener('DOMContentLoaded', function() {
    console.log('Сайт загружен!');

    // Пример: плавный скроллинг к якорям
    const smoothScrollLinks = document.querySelectorAll('a[href^="#"]');
    smoothScrollLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Пример: добавление класса к активному пункту меню (если нужно)
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        if (link.href === window.location.href) {
            link.classList.add('active');
        }
    });

    // Здесь могут быть другие скрипты, например, для открытия/закрытия модальных окон,
    // слайдеров, анимаций при прокрутке и т.д.
});

