//Кидаем в to_sz()

variables = [];
blocks = [];

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

    if (block_info.type == "variable"){
        idx = variables.findIndex(itm => itm.name == block_info.varname);
        variables.splice(idx, 1);
    };

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
            data = {input: null};
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
            const outPin = sourceBlock.output.find(o => o.id == sourceOutId);
            if (outPin && functions[sourceBlock.type]) {
                const val = functions[sourceBlock.type](sourceBlockId, sourceValue, outPin.type);
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
        _block = blocks.find(itm => itm.id == id);
        input_value_ = reverse_go_to(id, new Set());

        [Name, value] = input_value_;
        info = variables.find(itm => itm.name == Name);
        if (info) info.value = value;

        go_to(_block.Exec[0], id);
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
        block = blocks.find(itm => itm.id == id);

        block.data.input = Number(block.data.input) //костыль

        return block.data.input;
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
}
}