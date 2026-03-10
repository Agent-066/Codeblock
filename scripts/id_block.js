var flag_1 = false;
var flag_2 = false;
      
var t_1 = null;
var t_2 = null;

var block_1 = null;
var block_2 = null;

var TEMP_path = null; // ИЗМЕНЕНО: TEMP_line -> TEMP_path
var TEMP_circle = null;

// НОВАЯ ФУНКЦИЯ: для создания кривой Безье
function createBezierPath(x1, y1, x2, y2) {
  var dx = Math.abs(x2 - x1) * 0.5;
  var cp1x = x1 + dx;
  var cp1y = y1;
  var cp2x = x2 - dx;
  var cp2y = y2;
  return `M ${x1} ${y1} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x2} ${y2}`;
}

function pin_out(t) {
  if (TEMP_path) { // ИЗМЕНЕНО: TEMP_line -> TEMP_path
    TEMP_path.remove();
    TEMP_path = null;
  }
  if (TEMP_circle) {
    TEMP_circle.remove();
    TEMP_circle = null;
  }

  flag_1 = true;
  t_1 = t;

  block_1 = blocks.find(itm => itm.id == t_1.closest(".movable").id);
  te = block_1.output.find(itm => itm.id == t_1.id);
  if (te.type == "Exec" && te.connection.length != 0) {
    // ИЗМЕНЕНО: line -> path
    if (svg.querySelector("path[conn_but~=" + t_1.id + "]")) svg.querySelector("path[conn_but~=" + t_1.id + "]").remove();
    delete_connection(false, [t_1.id]);
    block_1.Exec.splice(block_1.Exec.findIndex(itm => itm == te.connection[0].to_block), 1);
  }

  // ИЗМЕНЕНО: line -> path
  TEMP_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  svgRect = svg.getBoundingClientRect();
  outRect = t_1.getBoundingClientRect();
  startX = outRect.left + outRect.width/2 - svgRect.left;
  startY = outRect.top + outRect.height/2 - svgRect.top;
  
  // ИЗМЕНЕНО: используем createBezierPath вместо x1,x2,y1,y2
  TEMP_path.setAttribute("d", createBezierPath(startX, startY, startX, startY));
  TEMP_path.setAttribute("stroke-width", 2);
  TEMP_path.setAttribute("stroke", "white");
  TEMP_path.setAttribute("fill", "none"); // ДОБАВЛЕНО: для path нужно fill="none"
  svg.append(TEMP_path);

  TEMP_circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  TEMP_circle.setAttribute("fill", "white");
  TEMP_circle.setAttribute("cx", startX);
  TEMP_circle.setAttribute("cy", startY);
  TEMP_circle.setAttribute("r", 5);
  svg.append(TEMP_circle);
}

document.addEventListener("mousemove", function(e) {
  if (flag_1 && TEMP_path && TEMP_circle) { // ИЗМЕНЕНО: TEMP_line -> TEMP_path
    var svgRect = svg.getBoundingClientRect();
    // ИЗМЕНЕНО: получаем начальную точку из path
    var d = TEMP_path.getAttribute("d");
    var parts = d.split(" ");
    var x1 = parseFloat(parts[1]);
    var y1 = parseFloat(parts[2]);
    var x2 = e.clientX - svgRect.left;
    var y2 = e.clientY - svgRect.top;
    
    // ИЗМЕНЕНО: используем createBezierPath
    TEMP_path.setAttribute("d", createBezierPath(x1, y1, x2, y2));
    TEMP_circle.setAttribute("cx", x2);
    TEMP_circle.setAttribute("cy", y2);
  }
});

document.addEventListener("mouseup", function(e){
  if (flag_1){
    var targetIn = e.target.closest(".in");
    if (!targetIn){
      if (TEMP_path){ // ИЗМЕНЕНО: TEMP_line -> TEMP_path
        TEMP_path.remove();
        TEMP_path = null;
      }
      if (TEMP_circle){
        TEMP_circle.remove();
        TEMP_circle = null;
      }
      flag_1 = false;
    }
  }
});

function pin_in(t){
  if (flag_1){
    t_2 = t;
    block_2 = blocks.find(itm => itm.id == t_2.closest(".movable").id);
    t_2_b = block_2.input.find(itm => itm.id == t_2.id);
    block_1 = blocks.find(itm => itm.id == t_1.closest(".movable").id);
    t_1_b = block_1.output.find(itm => itm.id == t_1.id);

    if (!compatible(t_1_b.type, t_2_b.type)){
      show_ERR(`Несовместимые типы: ${t_1_b.type} и ${t_2_b.type}`, block_2.id);
      if (TEMP_path) TEMP_path.remove(); TEMP_path = null; // ИЗМЕНЕНО: TEMP_line -> TEMP_path
      if (TEMP_circle) TEMP_circle.remove(); TEMP_circle = null; 
      flag_1 = false;
      return;
    }

    if (t_2_b.type == ""){
      t_2_b.type = t_1_b.type;
      t_2.setAttribute("_type", t_1_b.type);
    }

    // ИЗМЕНЕНО: line -> path
    var pathsToRemove = svg.querySelectorAll(`path[conn_but~="${t_2.id}"]`);
    pathsToRemove.forEach(p => p.remove());
    delete_connection([t_2.id], false);

    if (block_1.id == block_2.id){
      if (TEMP_path) { TEMP_path.remove(); TEMP_path = null; } // ИЗМЕНЕНО: TEMP_line -> TEMP_path
      if (TEMP_circle) { TEMP_circle.remove(); TEMP_circle = null; }
      flag_1 = false;
      return;
    }

    t_1_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id});
    t_2_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id});
    if (t_1_b.type == "Exec") block_1.Exec.push(block_2.id);

    // ИЗМЕНЕНО: line -> path
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    var svgRect = svg.getBoundingClientRect();
    var outRect = t_1.getBoundingClientRect();
    var inRect = t_2.getBoundingClientRect();

    var x1 = outRect.left + outRect.width/2 - svgRect.left;
    var y1 = outRect.top + outRect.height/2 - svgRect.top;
    var x2 = inRect.left + inRect.width/2 - svgRect.left;
    var y2 = inRect.top + inRect.height/2 - svgRect.top;

    // ИЗМЕНЕНО: используем createBezierPath
    path.setAttribute("d", createBezierPath(x1, y1, x2, y2));
    path.setAttribute("stroke-width", 2);
    path.setAttribute("stroke", "white");
    path.setAttribute("fill", "none"); // ДОБАВЛЕНО: для path нужно fill="none"
    path.setAttribute("conn_block", block_1.id + " " + block_2.id);
    path.setAttribute("conn_but", t_1.id + " " + t_2.id);
    svg.append(path);

    if (TEMP_path) TEMP_path.remove(); TEMP_path = null; // ИЗМЕНЕНО: TEMP_line -> TEMP_path
    if (TEMP_circle) TEMP_circle.remove(); TEMP_circle = null;
    flag_1 = false;
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
      // ИЗМЕНЕНО: line -> path
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