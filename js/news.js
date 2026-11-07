/* Лента новостей: категории и поиск на клиенте. */

(function () {
    "use strict";

    const list = document.getElementById("newsList");
    const categoriesHost = document.getElementById("newsCategories");
    const search = document.getElementById("newsSearch");
    if (!list) return;

    let news = [];
    let category = new URLSearchParams(location.search).get("category") || "";
    let query = "";

    function categories() {
        const unique = [];
        news.forEach(function (item) {
            if (item.category && !unique.includes(item.category)) unique.push(item.category);
        });
        return unique;
    }

    function renderChips() {
        if (!categoriesHost) return;
        const items = [{ value: "", label: "Все" }].concat(categories().map(function (name) {
            return { value: name, label: name };
        }));
        categoriesHost.innerHTML = items.map(function (item) {
            return '<button class="chip' + (item.value === category ? " on" : "") + '" type="button" ' +
                'data-category="' + Site.esc(item.value) + '">' + Site.esc(item.label) + "</button>";
        }).join("");
    }

    function filtered() {
        const needle = query.trim().toLowerCase();
        return news.filter(function (item) {
            if (category && item.category !== category) return false;
            if (!needle) return true;
            return (item.title + " " + item.content + " " + item.category).toLowerCase().includes(needle);
        });
    }

    function render() {
        renderChips();
        const items = filtered();
        list.innerHTML = items.length
            ? items.map(Site.newsCard).join("")
            : '<div class="empty">' + (news.length
                ? "Новостей по заданным условиям не найдено."
                : "Пока нет опубликованных новостей.") + "</div>";
        Site.reveal(list);
    }

    if (categoriesHost) {
        categoriesHost.addEventListener("click", function (event) {
            const button = event.target.closest("[data-category]");
            if (!button) return;
            category = button.dataset.category;
            const url = new URL(location.href);
            if (category) url.searchParams.set("category", category);
            else url.searchParams.delete("category");
            history.replaceState({}, "", url.pathname + (url.search ? url.search : ""));
            render();
        });
    }

    if (search) {
        search.addEventListener("input", function () {
            query = search.value;
            render();
        });
    }

    (async function load() {
        try {
            const data = await Site.api("/api/news?limit=100");
            news = (data && data.news) || [];
            render();
        } catch (error) {
            list.innerHTML = '<div class="empty">Не удалось загрузить новости. ' +
                Site.esc(error.message) + "</div>";
        }
    })();
})();
