//Кидаем в to_sz()

variables = [];
blocks = [];

function compatible(s_type, t_type){
    if (t_type == '') return true;
    if (s_type == 'Exec' || t_type == 'Exec') return s_type == t_type;
    if ((s_type == 'Integer' || s_type == 'Float') && (t_type == "Integer" || t_type == 'Float')) return true;
    
    if ((s_type == 'Boolean' && (t_type == "Integer" || t_type == 'Float')) ||
        (t_type == 'Boolean' && (s_type == 'Integer' || s_type == 'Float'))) return true;

    return s_type == t_type;
}

function add_inputs(blockEl) {
    let block = blocks.find(b => b.id == blockEl.id);
    if (!block || block.type != 'sum' && block.type != 'multiplication') return;
    let left_col = blockEl.querySelector('.three_columns .column:first-child');
    let right_col = blockEl.querySelector('.three_columns .column:nth-child(2)');
    let add = blockEl.querySelector('.add');
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
    inp.onclick = function(e) { e.stopPropagation(); };
    inp.onmousedown = function(e) { e.stopPropagation(); };
    inp.addEventListener('input', funct_input);
    right_col.appendChild(inp);

    if (!Array.isArray(block.data)) block.data = [];
    block.data.push(null);
    block.input.push({ id: in_b.id, type: 'Integer', connection: [] });
}

function delete_connection(in_ids, out_ids) {
    if (in_ids === false && out_ids === false) return;

    const inList = Array.isArray(in_ids) ? in_ids : [];
    const outList = Array.isArray(out_ids) ? out_ids : [];

    blocks.forEach(block => {
        block.input.forEach(inp => {
            if (inp.connection) {
                inp.connection = inp.connection.filter(conn => !inList.includes(conn.to));
            }
        });

        block.output.forEach(out => {
            if (out.connection) {
                out.connection = out.connection.filter(conn => !outList.includes(conn.from));
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

    switch(type) {
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
    if (id_to == undefined) {console.error("Не подсоединен блок c id " + id_from); return;}

    block = blocks.find(itm => itm.id == id_to);

    functions[block.type]?.(id_to);
}

function reverse_go_to(blockId, visited = new Set()) {
    if (visited.has(blockId)) {
        console.warn('Обнаружен цикл в графе данных для блока с id', blockId);
        return null;
    }
    visited.add(blockId);

    const block = blocks.find(b => b.id == blockId);
    if (!block) return null;

    const inputValues = [];
    for (const inp of block.input) {
        if (inp.type === 'Exec') continue;

        if (inp.connection.length === 0) {
            inputValues.push(undefined);
            continue;
        }

        const conn = inp.connection[0];
        const sourceBlockId = conn.from_block;
        const sourceOutId = conn.from;

        const sourceValue = reverse_go_to(sourceBlockId, visited);
        if (sourceValue === undefined) {
            console.error('Не удалось вычислить значение для блока с id', sourceBlockId);
            inputValues.push(undefined);
        } else {
            const sourceBlock = blocks.find(b => b.id == sourceBlockId);
            const out = sourceBlock.output.find(o => o.id == sourceOutId);
            if (out && functions[sourceBlock.type]) {
                const val = functions[sourceBlock.type](sourceBlockId, sourceValue, out.type);
                inputValues.push(val);
            } else {
                inputValues.push(undefined);
            }
        }
    }
    return inputValues;
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
    if (!varName) {
        showError('Имя переменной не задано в блоке Set', _block.id);
        return;
    }

    let variable = variables.find(itm => itm.name == varName);
    if (!variable) {
        showError(`Переменная "${varName}" не найдена`, _block.id);
        return;
    }

    let inputValues = reverse_go_to(id, new Set());
    let val_val = inputValues[0]; // значение с data-пина
    if (val_val === undefined) {
        showError('Не подано значение на вход блока Set', _block.id);
        return;
    }

    let conv_val;
    switch (variable.type) {
        case "Integer":
            conv_val = parseInt(val_val);
            if (isNaN(conv_val)) {
                showError(`Не удалось преобразовать "${val_val}" к Integer`, _block.id);
                return;
            }
            break;
        case "Float":
            conv_val = parseFloat(val_val);
            if (isNaN(conv_val)) {
                showError(`Не удалось преобразовать "${val_val}" к Float`, _block.id);
                return;
            }
            break;
        case "String":
            conv_val = String(val_val);
            break;
        case "Boolean":
            if (typeof val_val === "boolean") {
                conv_val = val_val;
            } else if (typeof val_val === "string") {
                let lower = val_val.toLowerCase();
                conv_val = lower === "true" || lower === "1";
            } else if (typeof val_val === "number") {
                conv_val = val_val !== 0;
            } else {
                conv_val = false;
            }
            break;
        default:
            conv_val = val_val;
    }

    variable.value = conv_val;

    // Продолжить выполнение по Exec выходу
    if (_block.Exec && _block.Exec.length > 0) {
        go_to(_block.Exec[0], id);
    }
},

    cout: (id) => {
        block_info = blocks.find(itm => itm.id == id);
        _block = document.getElementById(block_info.id);

        value = reverse_go_to(id, new Set())[0];

        _block.querySelector("input").setAttribute("value", value);
        console.log(value)
    },

    get: (id) => {
        block = blocks.find(itm => itm.id == id);
        Name = block.data.varname;
        info = variables.find(itm => itm.name == Name);

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
        for (let i = 0; i < values.length; i++) {
            let val = values[i];
            if (val === undefined) {
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

        for (let i = 0; i < values.length; i++) {
            let val = values[i];
            if (val === undefined) {
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