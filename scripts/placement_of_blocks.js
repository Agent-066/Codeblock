
var id_list = [];
var cur_i = 0;
var id_cur = [cur_i];

//Позже доработаю id кнопок
var but_in_id = 0;
var but_out_id = 0;
var blk_input_id = 0;

function to_sz(t){
  let safeRect = safe.getBoundingClientRect();
  let c_t = t.cloneNode(true);
  c_t.setAttribute("style", `top: ${safe.scrollTop + safeRect.height/2}px; left: ${safe.scrollLeft + safeRect.width/2}px`)
  c_t.classList.remove("movable");
  c_t.classList.add("movable");
  c_t.removeAttribute("onclick");
  safe.append(c_t);

  let out_t = c_t.querySelectorAll(".out");
  if (out_t.length > 0){
    for (let i of out_t){
      i.setAttribute("data-id", "out_" + but_out_id);
      i.setAttribute("id", "out_" + but_out_id);
      // Используем onlick вместо setAttribute
      i.onclick = function(e){
        e.stopPropagation();
        pin_out(this);
      };
      but_out_id += 1;
    }
  }

  let selects = c_t.querySelectorAll("select");
  selects.forEach(select => {
    select.onclick = function(e){
        e.stopPropagation();
    };
    select.onmousedown = function(e){
      e.stopPropagation();
    };

    select.addEventListener("change", function(){
      let type = this.value;

      let block = this.closest(".movable");
      let block_info = blocks.find(itm => itm.id == block.id);
      block_info.data.select = type;
      if (block_info.type == "variable"){
        variables.forEach(v => {
          if (v.id_block == block.id) v.type = type;
        });
        update_datalist();
        let varName_input = block.querySelector('input[name="Var"]');
        if (varName_input) varName = varName_input;
        else varName = null
        if (varName){
          let g_blocks = blocks.filter(b => b.type === 'get' && b.data.varname === varName);
          g_blocks.forEach(itm => {
            if (itm.output.length > 0){
              itm.output[0].type = type;
              let out_el = document.getElementById(itm.output[0].id);
              if (out_el) out_el.setAttribute("_type", type);
            }
            update_connected(itm.id, type);
          });
        }
      }
      if (block_info.output.length > 0){
        block_info.output[0].type = type;
        let out = block.querySelector(".out");
        if (out) out.setAttribute("_type", type);
      }

      if (block_info.type != "variable"){
        block_info.output[0].type = type;
        let out = block.querySelector(".out");
        if (out) out.setAttribute("_type", type);
      }
    })
  });

  let in_t = c_t.querySelectorAll(".in")
  in_t.forEach(itm => {
    if (itm.getAttribute("_type") == "") itm.setAttribute("flag_ch", true);
    itm.setAttribute("onclick", "pin_in(this)");
    itm.setAttribute("id", "in_" + but_in_id);
    but_in_id += 1;
  })
        
  let b_t = c_t.querySelector(".delete-button_x")
  b_t.className = "delete-button";
  b_t.setAttribute("onclick", "delete_block(this)");

  c_t.id = id_cur[0];

  if (cur_i == id_cur[0]){
    id_list.push(id_cur[0]);
    id_cur.pop();
    cur_i += 1;
    id_cur.push(cur_i);
  }
  else{
    id_list.push(id_cur[0]);
    id_cur.shift();
  }

  add_to_blocks(c_t);

  let inputs = c_t.querySelectorAll("input");
  inputs.forEach(input => {
    input.onclick = function(e){
      e.stopPropagation();
    }
    input.onmousedown = function(e){
      e.stopPropagation();
    }

    input.setAttribute("id", "input_" + blk_input_id);
    blk_input_id += 1;

    input.addEventListener("input", funct_input)
  })

  if (c_t.getAttribute('block_type') == 'sum' || c_t.getAttribute('block_type') == 'multiplication' ||
      c_t.getAttribute('block_type') == 'subtraction' || c_t.getAttribute('block_type') == 'division' ||
      c_t.getAttribute('block_type') == 'or' || c_t.getAttribute('block_type') == 'and'
    ){

    let add_b = c_t.querySelector('.add');
    if (add_b){
        add_b.onclick = function(e){
            e.stopPropagation();
            add_inputs(c_t);
        };
    }
  }

  if (c_t.getAttribute("block_type") === "const"){
    let select = c_t.querySelector('.const-type-select');
    let container = c_t.querySelector('.const-input-container');
    let out_bt = c_t.querySelector('.out');

    function update_const(type){
      container.innerHTML = '';
      let n_input;
      if (type === 'Boolean'){
        n_input = document.createElement('input');
        n_input.type = 'checkbox';
        n_input.style.width = '20px';
        n_input.style.height = '20px';
      }
      else{
        n_input = document.createElement('input');
        n_input.type = 'text';
        n_input.style.width = '60px';
        n_input.placeholder = type === 'String' ? 'text' : 'number';
      }
      n_input.id = 'input_' + blk_input_id++;
      n_input.onclick = e => e.stopPropagation();
      n_input.onmousedown = e => e.stopPropagation();
      n_input.addEventListener('input', funct_input);
      if (type === 'Boolean'){
        n_input.addEventListener('change', funct_input);
      }
      container.appendChild(n_input);

      out_bt.setAttribute('_type', type);
      block_Info = blocks.find(b => b.id == c_t.id);
      if (block_Info){
        block_Info.output[0].type = type;
        block_Info.data.type = type;
      }
    }
    select.onchange = function(){
      update_const(this.value);
      update_connected(block.id, this.value);
    };
    update_const('Integer');
    
  }
}

function funct_input(e){
  let el = e.target.closest(".movable");
  if (!el) return;
  let i_block = blocks.find(itm => itm.id == el.id);
  if (!i_block) return;

  if (i_block.type == "sum" || i_block.type == 'multiplication' ||
      i_block.type == 'subtraction' || i_block.type == 'division' ||
      i_block.type == 'modulo' || i_block.type == 'operation_more' ||
      i_block.type == 'operation_less' || i_block.type == 'operation_equal' ||
      i_block.type == 'operation_not_equal' || i_block.type == "operation_more_equal" ||
      i_block.type == 'operation_less_equal'|| i_block.type == "or" || i_block.type == "and" ||
      i_block.type == 'invert') 
  {
    let inputs = el.querySelectorAll('input');
    let index = Array.from(inputs).indexOf(e.target);
    if (index != -1){
      i_block.data[index] = e.target.value;
    }
  }
  else if (i_block.type == "set"){
    i_block.data.varname = e.target.value;
  }
  else if (i_block.type == "const"){
    if (e.target.type == 'checkbox'){
      i_block.data.value = false;
      i_block.data.value = e.target.checked;
    }
    else i_block.data.value = e.target.value;
  }
  else if (i_block.type == "variable"){
    input_ = e.target.value;
    i_block.data.varname = input_;
    raw_n = input_.split(',').map(s => s.trim()).filter(s => s.length > 0);
    b_id = i_block.id;
    select_type = i_block.data.select;
    
    const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
    
    valid_names = [];
    errors = [];
    
    raw_n.forEach(name => {
      if (!regex.test(name)){
        errors.push(`Имя "${name}" содержит недопустимые символы или начинается с цифры`);
      }
      else{
        let vari = variables.find(v => v.name === name && v.id_block !== b_id);
        if (vari){
          errors.push(`Имя "${name}" уже используется в другом блоке`);
        }
        else{
          valid_names.push(name);
        }
      }
    });
    
    if (errors.length > 0){
      el.style.border = "2px solid red";
      el.title = errors.join('; ');
      errors.forEach(err => show_ERR(err, b_id));
    }
    else{
      el.style.border = "";
      el.title = "";
    }
    
    variables = variables.filter(v => {
      if (v.id_block !== b_id) return true;
      return valid_names.includes(v.name);
    });
    
    valid_names.forEach(name => {
      let vari = variables.find(v => v.id_block === b_id && v.name === name);
      if (!vari){
        variables.push({
          id_block: b_id,
          name: name,
          type: select_type,
          value: null
        });
      }
      else{
        vari.type = select_type;
      }
    });
    
    update_datalist();
  }
  else {
    if (i_block.data.input != undefined){
      i_block.data.input = e.target.value;
    }
    if (i_block.data.varname != undefined){
      i_block.data.varname = e.target.value;
      if (i_block.type == "variable"){
        let variable = variables.find(itm => itm.id_block == i_block.id);
        if (variable){
          variable.name = i_block.data.varname;
          update_datalist();
        }
      }
    }
    if (i_block.type === "get"){
      let block = document.getElementById(i_block.id);
      let f_var = variables.find(itm => itm.name == e.target.value);
      if (f_var){
        let new_type = f_var.type;
        let out_btn = block.querySelector(".out");
        if (out_btn) out_btn.setAttribute("_type", new_type);
        i_block.data.varname = f_var.name;
        i_block.output[0].type = new_type;
        update_connected(i_block.id, new_type);
      }
      return;
    }
  }
}

document.querySelectorAll(".side-panel .block").forEach(block => {
  block.addEventListener("click", function(e){
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'OPTION'){
      return;
    }
    to_sz(this);
    });
});

function update_connected(blockId, new_type){
  let s_block = blocks.find(b => b.id == blockId);
  if (!s_block) return;

  let out_pin = s_block.output[0];
  if (!out_pin || !out_pin.connection) return;

  let connections = out_pin.connection.slice();
  connections.forEach(conn => {
    let tar_blk_id = conn.to_block;
    let tar_in_id = conn.to;

    let tar_blk = blocks.find(b => b.id == tar_blk_id);
    if (!tar_blk) return;
    let tar_inp = tar_blk.input.find(inp => inp.id == tar_in_id);
    if (!tar_inp) return;
    let tar_in_el = document.getElementById(tar_in_id);
    if (!tar_in_el) return;

    let is_dyn = tar_in_el.getAttribute("flag_ch") === "true";

    if (is_dyn){
      tar_inp.type = new_type;
      tar_in_el.setAttribute("_type", new_type);
    }
    else{
      if (!compatible(new_type, tar_inp.type)){
        let line = document.querySelector(`line[conn_but~="${out_pin.id}"][conn_but~="${tar_in_id}"]`);
        if (line) line.remove();

        out_pin.connection = out_pin.connection.filter(c => c.to != tar_in_id);
        tar_inp.connection = tar_inp.connection.filter(c => c.from != out_pin.id);

        if (out_pin.type === 'Exec') s_block.Exec = s_block.Exec.filter(id => id != tar_blk_id);
          show_ERR(`Тип выхода блока изменился на ${new_type}, что несовместимо с фиксированным типом входа ${tar_inp.type}. Соединение разорвано.`, tar_blk_id);
      }
    }
  });
}