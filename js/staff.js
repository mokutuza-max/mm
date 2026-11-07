/* Состав Министерства: карточки из D1 в порядке display_order. */

(function () {
    "use strict";

    const list = document.getElementById("staffList");
    const search = document.getElementById("staffSearch");
    const department = document.getElementById("staffDepartment");
    const count = document.getElementById("staffCount");
    if (!list) return;

    let staff = [];

    function filtered() {
        const needle = search ? search.value.trim().toLowerCase() : "";
        const dept = department ? department.value : "";
        return staff.filter(function (person) {
            if (dept && (person.department || "") !== dept) return false;
            if (!needle) return true;
            return [person.full_name, person.rank, person.position, person.department]
                .join(" ").toLowerCase().includes(needle);
        });
    }

    function card(person, index) {
        const name = person.full_name || "Вакантная должность";
        return '<article class="staffcard rv" data-index="' + index + '" tabindex="0" role="button" ' +
            'aria-label="Подробнее: ' + Site.esc(name) + '">' +
            '<div class="staffcard-photo">' +
            Site.photoHtml(person.photo_url, name, "НЕТ ФОТО") +
            "</div>" +
            '<div class="staffcard-body">' +
            (person.rank ? '<span class="rank">' + Site.esc(person.rank) + "</span>" : "") +
            "<h3>" + Site.esc(name) + "</h3>" +
            '<p class="pos">' + Site.esc(person.position) + "</p>" +
            (person.department ? '<p class="dept">' + Site.esc(person.department) + "</p>" : "") +
            '<button class="btn sm" type="button">Подробнее</button>' +
            "</div></article>";
    }

    function render() {
        const items = filtered();
        if (count) count.textContent = "Показано: " + items.length + " из " + staff.length;
        if (!items.length) {
            list.innerHTML = '<div class="empty">' +
                (staff.length ? "Никого не найдено по заданным условиям." : "Состав пока не опубликован.") +
                "</div>";
            return;
        }

        const groups = [];
        const map = new Map();
        items.forEach(function (person) {
            const key = person.department || "Состав Министерства";
            if (!map.has(key)) {
                map.set(key, []);
                groups.push(key);
            }
            map.get(key).push(person);
        });

        list.innerHTML = groups.map(function (group) {
            return '<section class="staffgroup"><h2 class="staffgroup-title">' + Site.esc(group) + "</h2>" +
                '<div class="staffgrid">' +
                map.get(group).map(function (person) {
                    return card(person, staff.indexOf(person));
                }).join("") +
                "</div></section>";
        }).join("");

        Site.reveal(list);
    }

    function openPerson(person) {
        const name = person.full_name || "Вакантная должность";
        const modal = Site.modal(
            '<div class="dt"><div class="ph">' + Site.photoHtml(person.photo_url, name, "НЕТ ФОТО") + "</div>" +
            "<div><h2>" + Site.esc(name) + "</h2>" +
            '<p class="pos">' + Site.esc(person.position) + "</p>" +
            (person.rank ? "<p><b>Воинское звание:</b> " + Site.esc(person.rank) + "</p>" : "") +
            (person.department ? "<p><b>Подразделение:</b> " + Site.esc(person.department) + "</p>" : "") +
            "</div></div>" +
            '<p class="note">Данные карточки обновляются в панели управления Министерства.</p>'
        );
        modal.classList.add("staff-modal");
    }

    list.addEventListener("click", function (event) {
        const cardElement = event.target.closest(".staffcard");
        if (!cardElement) return;
        const person = staff[Number(cardElement.dataset.index)];
        if (person) openPerson(person);
    });

    list.addEventListener("keydown", function (event) {
        if (event.key !== "Enter" && event.key !== " ") return;
        const cardElement = event.target.closest(".staffcard");
        if (!cardElement) return;
        event.preventDefault();
        const person = staff[Number(cardElement.dataset.index)];
        if (person) openPerson(person);
    });

    if (search) search.addEventListener("input", render);
    if (department) {
        department.addEventListener("change", render);
    }

    (async function load() {
        try {
            const data = await Site.api("/api/staff");
            staff = (data && data.staff) || [];
            if (department) {
                const departments = [];
                staff.forEach(function (person) {
                    if (person.department && !departments.includes(person.department)) {
                        departments.push(person.department);
                    }
                });
                department.innerHTML = '<option value="">Все подразделения</option>' +
                    departments.map(function (name) {
                        return '<option value="' + Site.esc(name) + '">' + Site.esc(name) + "</option>";
                    }).join("");
            }
            render();
        } catch (error) {
            list.innerHTML = '<div class="empty">Не удалось загрузить состав. ' +
                Site.esc(error.message) + "</div>";
        }
    })();
})();
