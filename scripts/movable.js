let el = null;
let safe = document.querySelector('.safe-zone');
let f_D = false;
let X = 0;
let Y = 0;
    document.addEventListener('mousedown', function(e) 
{
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

document.addEventListener('mousemove', function(e) 
{
    if (!f_D || !el) return;
    let Xi = e.clientX - X;
    let Yi = e.clientY - Y;
    Xi = Math.max(safe.offsetLeft, Math.min(safe.clientWidth + safe.offsetLeft - el.clientWidth, Xi));
    Yi = Math.max(safe.offsetTop, Math.min(safe.clientHeight + safe.offsetTop - el.clientHeight, Yi));
    el.style.left = Xi + 'px';
    el.style.top = Yi + 'px';
});

document.addEventListener('mouseup', function()
{
    if (el) el.style.cursor = 'move';
    f_D = false;
});

document.addEventListener('mouseleave', function()
{
    if (el) el.style.cursor = 'move';
    f_D = false;
});