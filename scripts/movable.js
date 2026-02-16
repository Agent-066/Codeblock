let el = document.querySelector('.movable');
let safe = document.querySelector('.safe-zone');
let f_D = false;
let X = 0;
let Y = 0;

    el.addEventListener('mousedown', function(e) 
{
    f_D = true;
    X = e.clientX - el.offsetLeft;
    Y = e.clientY - el.offsetTop;
    el.style.cursor = 'grabbing';
    e.preventDefault();
});

document.addEventListener('mousemove', function(e) 
{
    if (!f_D) return;
    let Xi = e.clientX - X;
    let Yi = e.clientY - Y;
    if (Xi )
    Xi = Math.max(safe.offsetLeft, Math.min(safe.clientWidth + safe.offsetLeft - el.clientWidth, Xi));
    Yi = Math.max(safe.offsetTop, Math.min(safe.clientHeight + safe.offsetTop - el.clientHeight, Yi));
    el.style.left = Xi + 'px';
    el.style.top = Yi + 'px';
});

document.addEventListener('mouseup', function()
{
    f_D = false;
    el.style.cursor = 'move';
});

document.addEventListener('mouseleave', function()
{
    f_D = false;
    el.style.cursor = 'move';
});