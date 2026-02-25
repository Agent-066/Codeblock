let el = null;
let safe = document.querySelector('.safe-zone');
let svg = safe.querySelector('svg'); // ссылка на SVG
let f_D = false;
let X = 0;
let Y = 0;

function updateLinesForBlock(block) {
    let blockId = block.id;
    let lines = svg.querySelectorAll('line[connection~="' + blockId + '"]');
    lines.forEach(function(line) {
        let conn = line.getAttribute('connection').split(' ');
        if (conn.length !== 2) return;
        let [fromId, toId] = conn;
        let fromBlock = document.getElementById(fromId);
        let toBlock = document.getElementById(toId);
        if (!fromBlock || !toBlock) return;

        let outEl = fromBlock.querySelector('.out');
        if (!outEl) return;

        let inEl = Array.from(toBlock.querySelectorAll('.in')).find(el => el.getAttribute('data') === fromId);
        if (!inEl) return;

        let svgRect = svg.getBoundingClientRect();
        let outRect = outEl.getBoundingClientRect();
        let inRect = inEl.getBoundingClientRect();

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