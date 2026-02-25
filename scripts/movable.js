let el = null
let safe = document.querySelector(".safe-zone")
let svg = safe.querySelector('svg')
let f_D = false;
let X = 0;
let Y = 0;

function updateLinesForBlock(block) {
    let blockId = block.id;
    let lines = svg.querySelectorAll('line[conn_block~="' + blockId + '"]');
    lines.forEach(function(line) {
        let conn = line.getAttribute('conn_but').split(' ');
        if (conn.length !== 2) return;
        let [from_id, to_id] = conn;
        let out_el = document.getElementById(from_id);
        let in_el = document.getElementById(to_id);
        if (!out_el || !in_el) return;

        let svgRect = svg.getBoundingClientRect();
        let outRect = out_el.getBoundingClientRect();
        let inRect = in_el.getBoundingClientRect();

        line.setAttribute('x1', outRect.left + outRect.width/2 - svgRect.left);
        line.setAttribute('y1', outRect.top + outRect.height/2 - svgRect.top);
        line.setAttribute('x2', inRect.left + inRect.width/2 - svgRect.left);
        line.setAttribute('y2', inRect.top + inRect.height/2 - svgRect.top);
    });
}

document.addEventListener('mousedown', function(e) {
    let movable = e.target.closest(".movable");
    if (!movable) return;
    el = movable;
    el.style.cursor = 'move';
    f_D = true;
    X = e.clientX - el.offsetLeft;
    Y = e.clientY - el.offsetTop;
    el.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', function(e) {
    if (!f_D || !el) return;
    let Xi = e.clientX - X;
    let Yi = e.clientY - Y;
    Xi = Math.max(safe.offsetLeft, Math.min(safe.clientWidth + safe.offsetLeft - el.clientWidth, Xi));
    Yi = Math.max(safe.offsetTop, Math.min(safe.clientHeight + safe.offsetTop - el.clientHeight, Yi));
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