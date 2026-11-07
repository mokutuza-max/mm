/* Главная: последние три опубликованные новости. */

(function () {
    "use strict";

    const host = document.getElementById("latestNews");
    if (!host) return;

    (async function load() {
        try {
            const data = await Site.api("/api/news?limit=3");
            const news = (data && data.news) || [];
            if (!news.length) {
                host.innerHTML = '<div class="empty">Пока нет опубликованных новостей.</div>';
                return;
            }
            host.innerHTML = news.map(Site.newsCard).join("");
            Site.reveal(host);
        } catch (error) {
            host.innerHTML = '<div class="empty">Не удалось загрузить новости. ' +
                Site.esc(error.message) + "</div>";
        }
    })();
})();
