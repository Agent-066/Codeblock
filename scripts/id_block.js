var flag_1 = false;
var flag_2 = false;
      
var t_1 = null;
var t_2 = null;

var block_1 = null;
var block_2 = null;

var TEMP_line = null;
var TEMP_circle = null;

function pin_out(t) {
  if (TEMP_line) {
    TEMP_line.remove();
    TEMP_line = null;
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
    if (svg.querySelector("line[conn_but~=" + t_1.id + "]"))svg.querySelector("line[conn_but~=" + t_1.id + "]").remove();
      delete_connection(false, [t_1.id]);
      block_1.Exec.splice(block_1.Exec.findIndex(itm => itm == te.connection[0].to_block), 1);
  }

  TEMP_line = document.createElementNS("http://www.w3.org/2000/svg", "line");
  svgRect = svg.getBoundingClientRect();
  outRect = t_1.getBoundingClientRect();
  startX = outRect.left + outRect.width/2 - svgRect.left;
  startY = outRect.top + outRect.height/2 - svgRect.top;
  TEMP_line.setAttribute("x1", startX);
  TEMP_line.setAttribute("y1", startY);
  TEMP_line.setAttribute("x2", startX);
  TEMP_line.setAttribute("y2", startY);
  TEMP_line.setAttribute("stroke-width", 2);
  TEMP_line.setAttribute("stroke", "white");
  svg.append(TEMP_line);

  TEMP_circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  TEMP_circle.setAttribute("fill", "white");
  TEMP_circle.setAttribute("cx", startX);
  TEMP_circle.setAttribute("cy", startY);
  TEMP_circle.setAttribute("r", 5);
  svg.append(TEMP_circle);
}

document.addEventListener("mousemove", function(e) {
  if (flag_1 && TEMP_line && TEMP_circle) {
    var svgRect = svg.getBoundingClientRect();
    TEMP_line.setAttribute("x2", e.clientX - svgRect.left);
    TEMP_line.setAttribute("y2", e.clientY - svgRect.top);
    TEMP_circle.setAttribute("cx", e.clientX - svgRect.left);
    TEMP_circle.setAttribute("cy", e.clientY - svgRect.top);
  }
});

document.addEventListener("mouseup", function(e){
  if (flag_1){
    var targetIn = e.target.closest(".in");
    if (!targetIn){
      if (TEMP_line){
        TEMP_line.remove();
        TEMP_line = null;
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
      if (TEMP_line) TEMP_line.remove(); TEMP_line = null; 
      if (TEMP_circle) TEMP_circle.remove(); TEMP_circle = null; 
      flag_1 = false;
      return;
    }

    if (t_2_b.type == ""){
      t_2_b.type = t_1_b.type;
      t_2.setAttribute("_type", t_1_b.type);
    }

    var linesToRemove = svg.querySelectorAll(`line[conn_but~="${t_2.id}"]`);
    linesToRemove.forEach(l => l.remove());
    delete_connection([t_2.id], false);

    if (block_1.id == block_2.id){
      if (TEMP_line) { TEMP_line.remove(); TEMP_line = null; }
      if (TEMP_circle) { TEMP_circle.remove(); TEMP_circle = null; }
      flag_1 = false;
      return;
    }

    t_1_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id});
    t_2_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id});
    if (t_1_b.type == "Exec") block_1.Exec.push(block_2.id);

    var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    var svgRect = svg.getBoundingClientRect();
    var outRect = t_1.getBoundingClientRect();
    var inRect = t_2.getBoundingClientRect();

    line.setAttribute("x1", outRect.left + outRect.width/2 - svgRect.left);
    line.setAttribute("y1", outRect.top + outRect.height/2 - svgRect.top);
    line.setAttribute("x2", inRect.left + inRect.width/2 - svgRect.left);
    line.setAttribute("y2", inRect.top + inRect.height/2 - svgRect.top);
    line.setAttribute("stroke-width", 2);
    line.setAttribute("stroke", "white");
    line.setAttribute("conn_block", block_1.id + " " + block_2.id);
    line.setAttribute("conn_but", t_1.id + " " + t_2.id);
    svg.append(line);

    if (TEMP_line) TEMP_line.remove(); TEMP_line = null;
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
      let line = svg.querySelector(`line[conn_but~="${conn.from}"][conn_but~="${t_2.id}"]`);
      if (line) line.remove();
    });

    if (t_2_b) t_2_b.connection = [];

    if (t_2.getAttribute("flag_ch") == "true"){
      t_2.setAttribute("_type", "");
      if (t_2_b) t_2_b.type = "";
    }
  }
}