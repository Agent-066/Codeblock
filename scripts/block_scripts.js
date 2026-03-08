variables = [];
blocks = [];

safe = document.querySelector(".safe-zone");

ERRORS = new Set();

safe.scrollTop = 2000;
safe.scrollLeft = 1400;

f_S = false;
startX = 0;
startY = 0;
start_Sc_left = safe.scrollLeft;
start_Sc_top = safe.scrollTop;

safe_mousedown = function(e){
    if (!e.target.closest(".safe-zone") || e.target.closest(".movable") || e.target.closest("circle")) return;
    f_S = true;

    startX = e.clientX;
    startY = e.clientY;
    start_Sc_left = safe.scrollLeft;
    start_Sc_top = safe.scrollTop;

    safe.addEventListener("mousemove", safe_mousemove);

    e.preventDefault()
}

safe_mousemove = function(e){
    if (!f_S) return;
    dX = e.clientX - startX;
    dY = e.clientY - startY;

    safe.scrollLeft = start_Sc_left - dX;
    safe.scrollTop = start_Sc_top - dY;

    safe.addEventListener("mouseup", safe_mouseup);
    safe.addEventListener("mouseleave", safe_mouseleave);
}

safe_mouseup = function(){
    if (f_S){
        f_S = false;
        safe.removeEventListener("mousemove", safe_mousemove)
    }
}

safe_mouseleave = function(){
    if (f_S){
        f_S = false;
        safe.removeEventListener("mousemove", safe_mousemove)
    }
}

safe.addEventListener("mousedown", safe_mousedown);

function clear_console(){
    consoleout = document.querySelector("#output-messages");
    if (!console) return;
    Array.from(consoleout.children).forEach(itm => {
        itm.remove();
    })
}

function printToConsole(value){
    cons_el = document.getElementById('output-console');
    msg_el = document.getElementById('output-messages');
    if (!cons_el || !msg_el) return;

    console.log(value)
    cons_el.style.display = 'block';
    line = document.createElement('div');
    line.textContent = String(value);
    line.style.borderBottom = '1px solid #333';
    line.style.padding = '2px 0';
    msg_el.appendChild(line);
    msg_el.scrollTop = msg_el.scrollHeight;
}

function clearOutputConsole(){
    msg_el = document.getElementById('output-messages');
    if (msg_el) msg_el.innerHTML = '';
    cons_el = document.getElementById('output-console');
    if (cons_el && msg_el.children.length === 0){
        cons_el.style.display = 'none';
    }
}

// Кнопка очистки
document.addEventListener('DOMContentLoaded', () => {
    const clear_b = document.getElementById('clear-output');
    if (clear_b){
        clear_b.addEventListener('click', clearOutputConsole);
    }
});

function show_ERR(message, blk_id = null){
    console.warn(message);
    if (blk_id){
        blk_el = document.getElementById(blk_id);
        if (blk_el){
            blk_el.classList.add('block-error');
            ERRORS.add(blk_id);
        }
    }

    ERR_cons = document.getElementById('error-console');
    ERR_msg = document.getElementById('error-messages');
    if (ERR_cons && ERR_msg){
        ERR_cons.style.display = 'block';
        msg_oformlenie = document.createElement('div');
        msg_oformlenie.textContent = `• ${message}`;
        msg_oformlenie.style.marginBottom = '4px';
        msg_oformlenie.style.paddingBottom = '2px';
        msg_oformlenie.style.borderBottom = '1px solid #444';
        ERR_msg.appendChild(msg_oformlenie);
        ERR_msg.scrollTop = ERR_msg.scrollHeight;
    }
}

function clear_ERR(){
    ERRORS.forEach(blk_id => {
        blk_el = document.getElementById(blk_id);
        if (blk_el) blk_el.classList.remove('block-error');
    });
    ERRORS.clear();

    ERR_cons = document.getElementById('error-console');
    ERR_msg = document.getElementById('error-messages');
    if (ERR_cons && ERR_msg){
        ERR_msg.innerHTML = '';
        ERR_cons.style.display = 'none';
    }
}

function compatible(s_type, t_type){
    if (t_type == '') return true;
    if (s_type == 'Exec' || t_type == 'Exec') return s_type == t_type;
    if ((s_type == 'Integer' || s_type == 'Float') && (t_type == "Integer" || t_type == 'Float')) return true;
    
    if ((s_type == 'Boolean' && (t_type == "Integer" || t_type == 'Float')) ||
        (t_type == 'Boolean' && (s_type == 'Integer' || s_type == 'Float'))) return true;

    return s_type == t_type;
}

function add_inputs(blk_el){
    let block = blocks.find(b => b.id == blk_el.id);

    if (!block || block.type != 'sum' && block.type != 'multiplication' &&
        block.type != 'subtraction' && block.type != 'division')
        { return; }

    let left_col = blk_el.querySelector('.three_columns .column:first-child');
    let right_col = blk_el.querySelector('.three_columns .column:nth-child(2)');
    let add = blk_el.querySelector('.add');
    if (!left_col || !right_col || !add) return;

    let in_b = document.createElement('button');
    in_b.className = 'in';
    in_b.setAttribute('_type', 'Integer');
    in_b.setAttribute('onclick', 'pin_in(this)');
    in_b.id = 'in_' + but_in_id++;
    left_col.insertBefore(in_b, add);

    let inp = document.createElement('input');
    inp.style.width = '50px';
    inp.style.margin = '1.4px';
    inp.id = 'input_' + blk_input_id++;
    inp.onclick = function(e){ e.stopPropagation(); };
    inp.onmousedown = function(e){ e.stopPropagation(); };
    inp.addEventListener('input', funct_input);
    right_col.appendChild(inp);

    if (!Array.isArray(block.data)) block.data = [];
    block.data.push(null);
    block.input.push({ id: in_b.id, type: 'Integer', connection: [] });
}

function delete_connection(in_ids, out_ids){
    if (in_ids === false && out_ids === false) return;
    out_list = Array.isArray(out_ids) ? out_ids : [];
    in_list = Array.isArray(in_ids) ? in_ids : [];

    blocks.forEach(block => {
        block.input.forEach(inp => {
            if (inp.connection){
                inp.connection = inp.connection.filter(conn => !in_list.includes(conn.to));
            }
        });
        block.output.forEach(out => {
            if (out.connection){
                out.connection = out.connection.filter(conn => !out_list.includes(conn.from));
            }
        });
    });
}

function delete_block(t){
    let block = t.parentElement.parentElement;
    i = Number(block.id);

    block_info = blocks.find(itm => itm.id == i);

    id_list.splice(id_list.indexOf(i), 1)
    id_cur.unshift(i);

    let lines_remove = svg.querySelectorAll('line[conn_block~="' + i + '"]');
    for (l of lines_remove) l.remove();

    in_ids = [];
    out_ids = [];
    ins = block.querySelectorAll(".in");
    outs = block.querySelectorAll(".out");
    for (itm of ins) in_ids.push(itm.id);
    for (itm of outs) out_ids.push(itm.id);

    delete_connection(in_ids, out_ids);

    if (block_info.type == "variable") variables = variables.filter(v => v.id_block != i);

    blocks.forEach(itm_0 => {
        flag = itm_0.Exec.find(itm_1 => itm_1 == i);
        if (flag){
            itm_0.Exec.splice(itm_0.Exec.findIndex(itm_2 => itm_2 == i), 1);
        }
    })

    blocks.splice(i, 1);

    block.remove();
}

function add_to_blocks(th){
    in_id = [];
    out_id = [];
    all_in = th.querySelectorAll(".in");
    all_out = th.querySelectorAll(".out");
    all_inputs = th.querySelectorAll("input");

    for (i of all_in){in_id.push({id: i.id, type: i.getAttribute("_type"), connection: []})};

    for (i of all_out){out_id.push({id: i.id, type: i.getAttribute("_type"), connection: []})};

    type = th.getAttribute("block_type");
    data = null;

    switch(type){
        case "event":
            data = {};
            break;
        case "variable":
            data = {varname: null, select: "Boolean"};
            break;
        case "set":
            data = {input: null};
            break;
        case "get":
            data = {varname: null};
            break;
        case "sum":
            data = [];
            break;
        case "branch":
            data = {};
            break;
        case "cout":
            data = {};
            break;
        case "const":
            data = {type: "Integer", value: null};
            break;
        case "multiplication":
            data = []
            break;
        case 'subtraction':
            data = []
            break;
        case 'division':
            data = []
            break;
        case 'modulo':
            data = []
            break;
        case 'operation_more':
            data = []
            break;
        case 'operation_less':
            data = []
            break;
        case 'operation_equal':
            data = []
            break;
        case 'operation_not_equal':
            data = []
            break;
    }

    blocks.push({
        id: th.id,
        type: type,
        Exec: [],
        input: in_id,
        output: out_id,
        data: data
    })
}

function go_to(id_to, id_from){
    if (id_to == undefined){show_ERR(`Не подсоединен блок c id ${id_from}`, id_from); return;}

    block = blocks.find(itm => itm.id == id_to);

    functions[block.type]?.(id_to);
}

function reverse_go_to(blockId, visited = new Set()){
    if (visited.has(blockId)){
        show_ERR(`Обнаружен цикл в графе данных для блока с id ${blockId}`, blockId);
        return null;
    }
    visited.add(blockId);

    const block = blocks.find(b => b.id == blockId);
    if (!block) return null;

    const inp_values = [];
    for (inp of block.input){
        if (inp.type === 'Exec') continue;

        if (inp.connection.length === 0){
            inp_values.push(undefined);
            continue;
        }

        const conn = inp.connection[0];
        const s_blk_id = conn.from_block;
        const s_out_id = conn.from;

        const s_value = reverse_go_to(s_blk_id, visited);
        if (s_value === undefined){
            console.error('Не удалось вычислить значение для блока с id', s_blk_id);
            inp_values.push(undefined);
        }
        else{
            const s_blk = blocks.find(b => b.id == s_blk_id);
            const out = s_blk.output.find(o => o.id == s_out_id);
            if (out && functions[s_blk.type]){
                const val = functions[s_blk.type](s_blk_id, s_value, out.type);
                inp_values.push(val);
            }
            else{
                inp_values.push(undefined);
            }
        }
    }
    return inp_values;
}

functions = {
    event: (id) => {
        block = blocks.find(itm => itm.id == id);

        go_to(block.Exec[0], id);
    },
    
    variable: (id) => {
        block = blocks.find(itm => itm.id == id);
        info = variables.find(itm => itm.id_block == id)

        return info ? info.name : null;
    },

    set: (id) => {
        let _block = blocks.find(itm => itm.id == id);
        if (!_block) return;

        let varName = _block.data.varname;
        if (!varName){
            show_ERR(`Имя переменной не задано в блоке Set`, _block.id);
            return;
        }

        let variable = variables.find(itm => itm.name == varName);
        if (!variable){
            show_ERR(`Переменная "${varName}" не найдена`, _block.id);
            return;
        }

        let inp_values = reverse_go_to(id, new Set());
        let val_val = inp_values[0]; 
        if (val_val === undefined){
            show_ERR('Не подано значение на вход блока Set', _block.id);
            return;
        }

        let conv_val;
        switch (variable.type){
            case "Integer":
                conv_val = parseInt(val_val);
                if (isNaN(conv_val)){
                    show_ERR(`Не удалось преобразовать "${val_val}" к Integer`, _block.id);
                    return;
                }
                break;
            case "Float":
                conv_val = parseFloat(val_val);
                if (isNaN(conv_val)){
                    show_ERR(`Не удалось преобразовать "${val_val}" к Float`, _block.id);
                    return;
                }
                break;
            case "String":
                conv_val = String(val_val);
                break;
            case "Boolean":
                if (typeof val_val === "boolean"){
                    conv_val = val_val;
                }
                else if (typeof val_val === "string"){
                    let lower = val_val.toLowerCase();
                    conv_val = lower === "true" || lower === "1";
                }
                else if (typeof val_val === "number"){
                    conv_val = val_val !== 0;
                }
                else{
                    conv_val = false;
                }
                break;
            default:
                conv_val = val_val;
        }

        variable.value = conv_val;

        if (_block.Exec && _block.Exec.length > 0){
            go_to(_block.Exec[0], id);
        }
    },

    cout: (id) => {
        block_info = blocks.find(itm => itm.id == id);
        if (!block_info) return;

        let value = reverse_go_to(id, new Set())[0];
        printToConsole(value);
    },

    get: (id) => {
        block = blocks.find(itm => itm.id == id);
        Name = block.data.varname;
        info = variables.find(itm => itm.name == Name);
        if (!info){
            show_ERR(`Переменная "${Name}" не найдена`, block.id);
            return null;
        }

        return info ? info.value : null;
    },

    const: (id) => {
        let block = blocks.find(itm => itm.id == id);
        let val = block.data.value;
        let type = block.data.type;
        if (type === 'Integer') return parseInt(val) || 0;
        if (type === 'Float') return parseFloat(val) || 0.0;
        if (type === 'Boolean') return !!val;
        return String(val);
    },

    sum: (id, values) => {
        block = blocks.find(b => b.id == id);
        data = block.data || [];
        let t = 0;
        for (let i = 0; i < values.length; i++){
            let val = values[i];
            if (val === undefined){
                if (data !== undefined){
                    val = parseFloat(data[i]);
                }
                else val = 0;
            }
            else val = parseFloat(val);
            if (isNaN(val)) t += 0;
            else t += val;
        }
        return t;
    },

    multiplication: (id, values) => {
        block = blocks.find(b => b.id == id);
        data = block.data || [];
        let t = 1;

        for (let i = 0; i < values.length; i++){
            let val = values[i];
            if (val === undefined){
                if (data !== undefined){
                    val = parseFloat(data[i]);
                }
                else val = NaN;
            }
            else val = parseFloat(val); 
            if (!isNaN(val)) t *= val;
            else t *= 1;
        }
        return t; 
    },

    division: (id, values) => {
        let block = blocks.find(b => b.id == id);
        let data = block.data || [];
        let t = null;


        if (values[0] !== undefined){
            t = values[0];
        }
        else if (data[0]){
            t = data[0];
        }

        if (t === null) {
            show_ERR(`Не указано делимое в блоке с id ${block.id}`, block.id)
            return null;
        }

        for (let i = 1; i < values.length; i++){
            let val = values[i];
            if (val === undefined){
                if (data !== undefined){
                    val = parseFloat(data[i]);
                }
                else val = NaN;
            }
            else val = parseFloat(val);
            if (!isNaN(val) && val !== 0) t /= val;
        }
        return t;
    },

    subtraction: (id, values) => {
        block = blocks.find(b => b.id == id);
        data = block.data || [];
        let t = null;

        if (values[0] !== undefined){
            t = values[0];
        }
        else if (data[0]){
            t = data[0];
        }
        for (let i = 1; i < values.length; i++){
            let val = values[i];
            if (val === undefined){
                if (data !== undefined){
                    val = parseFloat(data[i]);
                }
                else val = 0;
            }
            else val = parseFloat(val);
            if (isNaN(val)) t -= 0;
            else t -= val;
        }
        return t;
    },

    modulo: (id, values) => {
        block = blocks.find(b => b.id == id);
        data = block.data || [];
        if (values.length < 2) return NaN;
        let a = values[0];
        let b = values[1];
        if (a === undefined){
            if (data !== undefined){
                a = parseFloat(data[0]);
            }
            else a = NaN;
        }
        else a = parseFloat(a);
        if (b === undefined){
            if (data !== undefined){
                b = parseFloat(data[1]);
            }
            else b = NaN;
        }
        else b = parseFloat(b);
        if (isNaN(a) || isNaN(b) || b === 0) return NaN;
        return a % b;
    },

    operation_less: (id, values) => {
        let block = blocks.find(b => b.id == id);
        let data_blk = block.data;

        let temp_0 = null;
        let temp_1 = null;

        if (values[0] !== undefined && values[1] !== undefined){
            temp_0 = values[0];
            temp_1 = values[1];
        }
        else if (data_blk[0] !== undefined && data_blk[1] !== undefined){
            temp_0 = data_blk[0];
            temp_1 = data_blk[1];
        }
        else{
            return false;
        }
        
        let a = parseFloat(temp_0);
        let b = parseFloat(temp_1);
        return !isNaN(a) && !isNaN(b) && a < b;
    },

    operation_equal: (id, values) => {
        let block = blocks.find(b => b.id == id);
        let data_blk = block.data;

        let temp_0 = null;
        let temp_1 = null;

        if (values[0] !== undefined && values[1] !== undefined){
            temp_0 = values[0];
            temp_1 = values[1];
        }
        else if (data_blk[0] !== undefined && data_blk[1] !== undefined){
            temp_0 = data_blk[0];
            temp_1 = data_blk[1];
        }
        else{
            return false;
        }

        let a = parseFloat(temp_0);
        let b = parseFloat(temp_1);
        return a == b;
    },

    operation_not_equal: (id, values) => {
        let block = blocks.find(b => b.id == id);
        let data_blk = block.data;

        let temp_0 = null;
        let temp_1 = null;

        if (values[0] !== undefined && values[1] !== undefined){
            temp_0 = values[0];
            temp_1 = values[1];
        }
        else if (data_blk[0] !== undefined && data_blk[1] !== undefined){
            temp_0 = data_blk[0];
            temp_1 = data_blk[1];
        }
        else{
            return false;
        }

        let a = parseFloat(temp_0);
        let b = parseFloat(temp_1);
        return a != b;
    },

    operation_more: (id, values) => {
        let block = blocks.find(b => b.id == id);
        let data_blk = block.data;

        let temp_0 = null;
        let temp_1 = null;

        if (values[0] !== undefined && values[1] !== undefined){
            temp_0 = values[0];
            temp_1 = values[1];
        }
        else if (data_blk[0] !== undefined && data_blk[1] !== undefined){
            temp_0 = data_blk[0];
            temp_1 = data_blk[1];
        }
        else{
            return false;
        }

        let a = parseFloat(temp_0);
        let b = parseFloat(temp_1);
        return !isNaN(a) && !isNaN(b) && a > b;
    },

    branch: (id) => {
        block = blocks.find(b => b.id == id);
        if (!block) return;

        inputs = reverse_go_to(id, new Set());
        if (inputs && inputs.length > 0) RC = inputs[0];
        else RC = false;

        C = Boolean(RC);

        if (C) out = block.output[0];
        else out = block.output[1];

        if (out.connection && out.connection.length > 0){
            next_id = out.connection[0].to_block;
            go_to(next_id, id);
        }
    }
}