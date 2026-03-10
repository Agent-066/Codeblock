var flag_1 = false;
var flag_2 = false;
      
var t_1 = null;
var t_2 = null;

var block_1 = null;
var block_2 = null;

var TEMP_path = null;
var TEMP_circle = null;

// Массив для хранения точек маршрута
var route_points = [];

// Функция для создания кривой Безье
function createRoutePath(x1, y1, x2, y2, points = []) {
  if (points.length === 0) {
    var dx = Math.abs(x2 - x1) * 0.5;
    var cp1x = x1 + dx;
    var cp1y = y1;
    var cp2x = x2 - dx;
    var cp2y = y2;
    return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
  } else {
    let path = `M ${x1} ${y1}`;
    let allPoints = [{x: x1, y: y1}, ...points, {x: x2, y: y2}];
    
    for (let i = 0; i < allPoints.length - 1; i++) {
      let p1 = allPoints[i];
      let p2 = allPoints[i + 1];
      
      let dx = Math.abs(p2.x - p1.x) * 0.4;
      let cp1x = p1.x + dx;
      let cp1y = p1.y;
      let cp2x = p2.x - dx;
      let cp2y = p2.y;
      
      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    
    return path;
  }
}

function pin_out(t) {
  if (TEMP_path) {
    TEMP_path.remove();
    TEMP_path = null;
  }
  if (TEMP_circle) {
    TEMP_circle.remove();
    TEMP_circle = null;
  }

  flag_1 = true;
  t_1 = t;
  
  // Очищаем маршрут при начале нового соединения
  route_points = [];

  block_1 = blocks.find(itm => itm.id == t_1.closest(".movable").id);
  te = block_1.output.find(itm => itm.id == t_1.id);
  if (te.type == "Exec" && te.connection.length != 0) {
    if (svg.querySelector("path[conn_but~=" + t_1.id + "]")) svg.querySelector("path[conn_but~=" + t_1.id + "]").remove();
    delete_connection(false, [t_1.id]);
    block_1.Exec.splice(block_1.Exec.findIndex(itm => itm == te.connection[0].to_block), 1);
  }

  TEMP_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svgRect = svg.getBoundingClientRect();
  outRect = t_1.getBoundingClientRect();
  startX = outRect.left + outRect.width/2 - svgRect.left;
  startY = outRect.top + outRect.height/2 - svgRect.top;
  
  TEMP_path.setAttribute("d", createRoutePath(startX, startY, startX, startY));
  TEMP_path.setAttribute("stroke-width", 2);
  TEMP_path.setAttribute("stroke", "white");
  TEMP_path.setAttribute("fill", "none");
  TEMP_path.setAttribute("stroke-dasharray", "5,5");
  svg.append(TEMP_path);

  TEMP_circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  TEMP_circle.setAttribute("fill", "white");
  TEMP_circle.setAttribute("cx", startX);
  TEMP_circle.setAttribute("cy", startY);
  TEMP_circle.setAttribute("r", 5);
  svg.append(TEMP_circle);
  
  // Добавляем класс для safe-zone
  safe.classList.add('connecting-mode');
}

document.addEventListener("mousemove", function(e) {
  if (flag_1 && TEMP_path && TEMP_circle) {
    var svgRect = svg.getBoundingClientRect();
    var mouseX = e.clientX - svgRect.left;
    var mouseY = e.clientY - svgRect.top;
    
    var d = TEMP_path.getAttribute("d");
    var parts = d.split(" ");
    var x1 = parseFloat(parts[1]);
    var y1 = parseFloat(parts[2]);
    
    TEMP_path.setAttribute("d", createRoutePath(x1, y1, mouseX, mouseY, route_points));
    TEMP_circle.setAttribute("cx", mouseX);
    TEMP_circle.setAttribute("cy", mouseY);
  }
});

// используем правый клик для добавления точек
safe.addEventListener('contextmenu', function(e) {
  e.preventDefault();
  if (flag_1 && !e.target.closest('.movable') && !e.target.closest('.in') && !e.target.closest('.out')) {
    
    var svgRect = svg.getBoundingClientRect();
    var clickX = e.clientX - svgRect.left;
    var clickY = e.clientY - svgRect.top;
    
    // Добавляем точку в маршрут
    route_points.push({x: clickX, y: clickY});
    
    // Визуальный отклик - большая зеленая точка
    var point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    point.setAttribute("fill", "#00ff00");
    point.setAttribute("cx", clickX);
    point.setAttribute("cy", clickY);
    point.setAttribute("r", 8);
    point.setAttribute("class", "route-point");
    point.setAttribute("data-temp", "true");
    svg.appendChild(point);
    
    // Анимация появления
    setTimeout(() => {
      if (point.parentNode) {
        point.setAttribute("r", "5");
        point.setAttribute("fill", "white");
      }
    }, 150);
    
    setTimeout(() => {
      if (point.parentNode) point.remove();
    }, 400);
    
    console.log('Добавлена точка маршрута:', clickX, clickY); // Для отладки
  }
});
Ы
function pin_in(t){
  if (flag_1){
    t_2 = t;
    block_2 = blocks.find(itm => itm.id == t_2.closest(".movable").id);
    t_2_b = block_2.input.find(itm => itm.id == t_2.id);
    block_1 = blocks.find(itm => itm.id == t_1.closest(".movable").id);
    t_1_b = block_1.output.find(itm => itm.id == t_1.id);

    if (!compatible(t_1_b.type, t_2_b.type)){
      show_ERR(`Несовместимые типы: ${t_1_b.type} и ${t_2_b.type}`, block_2.id);
      if (TEMP_path) TEMP_path.remove(); TEMP_path = null; 
      if (TEMP_circle) TEMP_circle.remove(); TEMP_circle = null; 
      document.querySelectorAll('.route-point[data-temp="true"]').forEach(p => p.remove());
      flag_1 = false;
      safe.classList.remove('connecting-mode');
      return;
    }

    if (t_2_b.type == ""){
      t_2_b.type = t_1_b.type;
      t_2.setAttribute("_type", t_1_b.type);
    }

    var pathsToRemove = svg.querySelectorAll(`path[conn_but~="${t_2.id}"]`);
    pathsToRemove.forEach(p => p.remove());
    delete_connection([t_2.id], false);

    if (block_1.id == block_2.id){
      if (TEMP_path) { TEMP_path.remove(); TEMP_path = null; }
      if (TEMP_circle) { TEMP_circle.remove(); TEMP_circle = null; }
      document.querySelectorAll('.route-point[data-temp="true"]').forEach(p => p.remove());
      flag_1 = false;
      safe.classList.remove('connecting-mode');
      return;
    }

    t_1_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id});
    t_2_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id});
    if (t_1_b.type == "Exec") block_1.Exec.push(block_2.id);

    // Сохраняем маршрут
    var connectionData = {
      from: t_1.id, 
      to: t_2.id, 
      from_block: block_1.id, 
      to_block: block_2.id,
      route: route_points.slice()
    };
    
    var lastConnIndex = t_1_b.connection.length - 1;
    if (lastConnIndex >= 0) {
      t_1_b.connection[lastConnIndex].route = route_points.slice();
      t_2_b.connection[t_2_b.connection.length - 1].route = route_points.slice();
    }

    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var svgRect = svg.getBoundingClientRect();
    var outRect = t_1.getBoundingClientRect();
    var inRect = t_2.getBoundingClientRect();

    var x1 = outRect.left + outRect.width/2 - svgRect.left;
    var y1 = outRect.top + outRect.height/2 - svgRect.top;
    var x2 = inRect.left + inRect.width/2 - svgRect.left;
    var y2 = inRect.top + inRect.height/2 - svgRect.top;

    path.setAttribute("d", createRoutePath(x1, y1, x2, y2, route_points));
    path.setAttribute("stroke-width", 2);
    path.setAttribute("stroke", "white");
    path.setAttribute("fill", "none");
    path.setAttribute("conn_block", block_1.id + " " + block_2.id);
    path.setAttribute("conn_but", t_1.id + " " + t_2.id);
    
    if (route_points.length > 0) {
      path.setAttribute("data-route", JSON.stringify(route_points));
    }
    
    svg.append(path);

    if (TEMP_path) TEMP_path.remove(); TEMP_path = null;
    if (TEMP_circle) TEMP_circle.remove(); TEMP_circle = null;
    document.querySelectorAll('.route-point[data-temp="true"]').forEach(p => p.remove());
    
    route_points = [];
    flag_1 = false;
    safe.classList.remove('connecting-mode');
  }
  else{
    t_2 = t;
    block_2 = blocks.find(itm => itm.id == t_2.closest(".movable").id);
    t_2_b = block_2.input.find(itm => itm.id == t_2.id);
      
    let conns = t_2_b ? t_2_b.connection.slice() : [];
    conns.forEach(conn => {
      let s_block = blocks.find(b => b.id == conn.from_block);
      if (s_block){
        let s_out = s_block.output.find(out => out.id == conn.from);
        if (s_out) {
          s_out.connection = s_out.connection.filter(c => c.to != t_2.id);
          if (s_out.type == "Exec") s_block.Exec = s_block.Exec.filter(id => id != block_2.id);
        }
      }
      let path = svg.querySelector(`path[conn_but~="${conn.from}"][conn_but~="${t_2.id}"]`);
      if (path) path.remove();
    });

    if (t_2_b) t_2_b.connection = [];

    if (t_2.getAttribute("flag_ch") == "true"){
      t_2.setAttribute("_type", "");
      if (t_2_b) t_2_b.type = "";
    }
  }
}