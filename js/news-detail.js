/* Страница отдельной новости. */

(function () {
    "use strict";

    const title = document.getElementById("newsTitle");
    const meta = document.getElementById("newsMeta");
    const body = document.getElementById("newsBody");
    if (!body) return;

    const id = new URLSearchParams(location.search).get("id") || "";
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
        body.innerHTML = '<div class="empty">Новость не найдена. <a href="novosti.html">Вернуться к ленте</a>.</div>';
        return;
    }

    (async function load() {
        try {
            const data = await Site.api("/api/news/" + encodeURIComponent(id));
            const item = data && data.item;
            if (!item) throw new Error("Новость не найдена.");
            document.title = item.title + " — МО Кутузовского ФО";
            title.textContent = item.title;
            meta.innerHTML = '<span class="badge">' + Site.esc(item.category) + "</span>" +
                '<time class="news-date">' + Site.esc(Site.formatDate(item.created_at, true)) + "</time>";
            body.innerHTML =
                (item.image_url
                    ? '<figure class="article-image"><img src="' + Site.esc(item.image_url) +
                    '" alt="' + Site.esc(item.title) + '"></figure>'
                    : "") +
                '<div class="article-text">' + Site.textHtml(item.content) + "</div>";
        } catch (error) {
            body.innerHTML = '<div class="empty">' + Site.esc(error.message) +
                ' <a href="novosti.html">Вернуться к ленте</a>.</div>';
        }
    })();
})();
