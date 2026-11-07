/* Список документов, сгруппированный по категориям. */

(function () {
    "use strict";

    const list = document.getElementById("docList");
    const search = document.getElementById("docSearch");
    const count = document.getElementById("docCount");
    if (!list) return;

    let documents = [];

    function extension(url) {
        const clean = String(url || "").split("#")[0].split("?")[0];
        const match = clean.match(/\.([A-Za-z0-9]{1,6})$/);
        return match ? match[1].toUpperCase() : "FILE";
    }

    function row(documentItem) {
        const external = /^https?:\/\//i.test(documentItem.file_url);
        const attributes = external
            ? ' target="_blank" rel="noopener noreferrer"'
            : ' download';
        return '<article class="docrow rv">' +
            '<span class="docicon">' + Site.esc(extension(documentItem.file_url)) + "</span>" +
            '<div class="docinfo"><h3>' + Site.esc(documentItem.title) + "</h3>" +
            (documentItem.description ? "<p>" + Site.esc(documentItem.description) + "</p>" : "") +
            '<p class="docmeta">' + Site.esc(documentItem.category || "Общее") + " · " +
            Site.esc(Site.formatDate(documentItem.created_at)) + "</p></div>" +
            '<a class="btn sm" href="' + Site.esc(documentItem.file_url) + '"' + attributes + ">Открыть</a>" +
            "</article>";
    }

    function render() {
        const needle = search ? search.value.trim().toLowerCase() : "";
        const items = documents.filter(function (documentItem) {
            if (!needle) return true;
            return (documentItem.title + " " + (documentItem.category || "") + " " +
                (documentItem.description || "")).toLowerCase().includes(needle);
        });
        if (count) count.textContent = "Показано: " + items.length + " из " + documents.length;
        if (!items.length) {
            list.innerHTML = '<div class="empty">' + (documents.length
                ? "Документы не найдены."
                : "Документы пока не опубликованы.") + "</div>";
            return;
        }
        const groups = [];
        const map = new Map();
        items.forEach(function (documentItem) {
            const key = documentItem.category || "Общее";
            if (!map.has(key)) {
                map.set(key, []);
                groups.push(key);
            }
            map.get(key).push(documentItem);
        });
        list.innerHTML = groups.map(function (group) {
            return '<section class="docgroup"><h2>' + Site.esc(group) + "</h2>" +
                map.get(group).map(row).join("") + "</section>";
        }).join("");
        Site.reveal(list);
    }

    if (search) search.addEventListener("input", render);

    (async function load() {
        try {
            const data = await Site.api("/api/documents");
            documents = (data && data.documents) || [];
            render();
        } catch (error) {
            list.innerHTML = '<div class="empty">Не удалось загрузить документы. ' +
                Site.esc(error.message) + "</div>";
        }
    })();
})();
