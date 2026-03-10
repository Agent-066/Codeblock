let el = null
var safe = document.querySelector(".safe-zone")
let svg = safe.querySelector('svg')
let f_D = false;
let X = 0;
let Y = 0;

function updateLinesForBlock(block) {
    let blockId = block.id;
    let paths = svg.querySelectorAll('path[conn_block~="' + blockId + '"]');
    paths.forEach(function(path) {
        let conn = path.getAttribute('conn_but').split(' ');
        if (conn.length !== 2) return;
        let [from_id, to_id] = conn;
        let out_el = document.getElementById(from_id);
        let in_el = document.getElementById(to_id);
        if (!out_el || !in_el) return;

        let svgRect = svg.getBoundingClientRect();
        let outRect = out_el.getBoundingClientRect();
        let inRect = in_el.getBoundingClientRect();

        let x1 = outRect.left + outRect.width/2 - svgRect.left;
        let y1 = outRect.top + outRect.height/2 - svgRect.top;
        let x2 = inRect.left + inRect.width/2 - svgRect.left;
        let y2 = inRect.top + inRect.height/2 - svgRect.top;
        let routePoints = [];
        let routeData = path.getAttribute('data-route');
        if (routeData) {
            try {
                routePoints = JSON.parse(routeData);
            } catch(e) {
                console.warn('Ошибка парсинга маршрута', e);
            }
        }
        
        path.setAttribute('d', createRoutePath(x1, y1, x2, y2, routePoints));
    });
}

document.addEventListener('mousedown', function(e) {
    let movable = e.target.closest(".movable");
    if (!movable) return;
    el = movable;

    let elRect = el.getBoundingClientRect();

    f_D = true;
    X = e.clientX - elRect.left;
    Y = e.clientY - elRect.top;
    el.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
    if (!f_D || !el) return;

    let Xi = e.clientX - X + safe.scrollLeft;
    let Yi = e.clientY - Y + safe.scrollTop;

    let safeRect = safe.getBoundingClientRect();
    let elRect = el.getBoundingClientRect();

    cardRect = document.querySelector(".card").getBoundingClientRect();

    Xi = Math.max(safeRect.left, Math.min(safeRect.width  + safe.scrollLeft + safeRect.left - elRect.width, Xi)) - 10 - safeRect.left;
    Yi = Math.max(safeRect.top, Math.min(safeRect.height + safe.scrollTop + safeRect.top - elRect.height, Yi)) - 10 - cardRect.height;

    el.style.left = Xi + 'px';
    el.style.top = Yi + 'px';

    updateLinesForBlock(el);
});

document.addEventListener('mouseup', function() {
    if (el) el.style.cursor = 'move';
    f_D = false;
});

document.addEventListener('mouseleave', function() {
    if (el) el.style.cursor = 'move';
    f_D = false;
});