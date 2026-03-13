(function(){
    const Main = {
        // ПЕРЕМЕННЫЕ
        //Данные блоков и переменных
        variables: [],
        blocks: [],
        id_list: [],
        cur_i: 0,
        id_cur: [0],
        but_in_id: 0,
        but_out_id: 0,
        blk_input_id: 0,

        //Перетаскивания safe-zone
        f_S: false,
        startX: 0,
        startY: 0,
        start_Sc_left: 0,
        start_Sc_top: 0,

        //Соединения (пины)
        flag_1: false,
        flag_2: false,
        t_1: null,
        t_2: null,
        block_1: null,
        block_2: null,
        TEMP_path: null,
        TEMP_circle: null,
        route_points: [],

        //Перемещения блоков
        el: null,
        f_D: false,
        X: 0,
        Y: 0,

        //Ошибки
        ERRORS: new Set(),

        //DOM элементы
        safe: null,
        svg: null,
    };

    // ---ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ---
    function toBoolean(val){
        if (typeof val === 'string'){
            let lower = val.trim().toLowerCase();
            if (lower === '' || lower === 'false' || lower === '0') return false;
            return true;
        }
        if (typeof val === 'number') return val !== 0;
        if (typeof val === 'boolean') return val;
        return false;
    }

    function show_ERR(message, blk_id = null){
        console.warn(message);
        if (blk_id){
            let blk_el = document.getElementById(blk_id);
            if (blk_el){
                blk_el.classList.add('block-error');
                Main.ERRORS.add(blk_id);
            }
        }

        let ERR_cons = document.getElementById('error-console');
        let ERR_msg = document.getElementById('error-messages');
        if (ERR_cons && ERR_msg){
            ERR_cons.style.display = 'block';
            let msg_oformlenie = document.createElement('div');
            msg_oformlenie.textContent = `• ${message}`;
            msg_oformlenie.style.marginBottom = '4px';
            msg_oformlenie.style.paddingBottom = '2px';
            msg_oformlenie.style.borderBottom = '1px solid #444';
            ERR_msg.appendChild(msg_oformlenie);
            ERR_msg.scrollTop = ERR_msg.scrollHeight;
        }
    }

    function clear_ERR(){
        Main.ERRORS.forEach(blk_id => {
            let blk_el = document.getElementById(blk_id);
            if (blk_el) blk_el.classList.remove('block-error');
        });
        Main.ERRORS.clear();

        let ERR_cons = document.getElementById('error-console');
        let ERR_msg = document.getElementById('error-messages');
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
        if (s_type == 'Array' && t_type == 'Array') return true;
        if (s_type == 'Array' || t_type == 'Array') return false;
        return s_type == t_type;
    }

    function update_set_get_element(blockId) {
        let block = Main.blocks.find(b => b.id == blockId);
        let tpye = block.type;
        if (!block || !(tpye === 'get_element' || tpye === 'set_element')) return;
        
        let arrayInput = block.input.find(inp => inp.type === 'Array');
        if (!arrayInput) return;

        let elementType = null;

        if (arrayInput.connection.length > 0) {

            let conn = arrayInput.connection[0];
            let sourceBlock = Main.blocks.find(b => b.id == conn.from_block);
            let sourceOut = sourceBlock.output.find(o => o.id == conn.from);
            if (sourceOut && sourceOut.type === 'Array') {
                if (sourceBlock.type === 'get') {
                    let varName = sourceBlock.data.varname;
                    let variable = Main.variables.find(v => v.name == varName);
                    if (variable) elementType = variable.elementType;
                }
                else if (sourceBlock.type === 'make_array') {
                    elementType = sourceBlock.data.elementType || 'Integer';
                }
                else if (sourceBlock.type === 'set_element' || sourceBlock.type === 'append' ||
                         sourceBlock.type === 'remove_index' || sourceBlock.type === 'get_element') {
                    console.warn('Не удалось точно определить тип элемента, используется Integer');
                    elementType = 'Integer';
                }
            }
        }
        else if (block.data.array) {
            let varName = block.data.array;
            let variable = Main.variables.find(v => v.name == varName && v.type === 'Array');
            if (variable) elementType = variable.elementType;
        }

        if (tpye === 'get_element') temp = block.output[0];
        else temp = block.input[2];

        if (elementType) {
            let Pin = temp;
            if (Pin.type !== elementType) {
                Pin.type = elementType;
                let outEl = document.getElementById(Pin.id);
                if (outEl) outEl.setAttribute('_type', elementType);
                update_connected(block.id, elementType);
            }
        }
    }


    function createRoutePath(x1, y1, x2, y2, points = []){
        if (points.length === 0){
            let dx = Math.max(50, Math.abs(x2 - x1) * 0.5);
            return `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
        }
else{
            let path = `M ${x1} ${y1}`;
            let allPoints = [{x: x1, y: y1}, ...points, {x: x2, y: y2}];
            for (let i = 0; i < allPoints.length - 1; i++){
                let p1 = allPoints[i];
                let p2 = allPoints[i + 1];
                let dx = Math.abs(p2.x - p1.x) * 0.4;
                path += ` C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
            }
            return path;
        }
    }

    function updateLinesForBlock(block){
        let blockId = block.id;
        let paths = Main.svg.querySelectorAll('path[conn_block~="' + blockId + '"]');
        paths.forEach(function(path){
            let conn = path.getAttribute('conn_but').split(' ');
            if (conn.length !== 2) return;
            let [from_id, to_id] = conn;
            let out_el = document.getElementById(from_id);
            let in_el = document.getElementById(to_id);
            if (!out_el || !in_el) return;

            let svgRect = Main.svg.getBoundingClientRect();
            let outRect = out_el.getBoundingClientRect();
            let inRect = in_el.getBoundingClientRect();

            let x1 = outRect.left + outRect.width/2 - svgRect.left;
            let y1 = outRect.top + outRect.height/2 - svgRect.top;
            let x2 = inRect.left + inRect.width/2 - svgRect.left;
            let y2 = inRect.top + inRect.height/2 - svgRect.top;
            let routePoints = [];
            let routeData = path.getAttribute('data-route');
            if (routeData){
                try {
                    routePoints = JSON.parse(routeData);
                } catch(e){}
            }
            path.setAttribute('d', createRoutePath(x1, y1, x2, y2, routePoints));
        });
    }

    function funct_input(e){
        let el = e.target.closest(".movable");
        if (!el) return;
        let i_block = Main.blocks.find(itm => itm.id == el.id);
        if (!i_block) return;

        if (["sum","multiplication","subtraction","division","modulo",
             "operation_more","operation_less","operation_equal","operation_not_equal",
             "operation_more_equal","operation_less_equal","or","and","invert"].includes(i_block.type)){
            let inputs = el.querySelectorAll('input');
            let index = Array.from(inputs).indexOf(e.target);
            if (index != -1) i_block.data[index] = e.target.value;
        }
        else if(i_block.type == "set"){
            i_block.data.varname = e.target.value;
            let varName = e.target.value;
            let variable = Main.variables.find(v => v.name === varName);
            if (variable) {
                let inPins = el.querySelectorAll('.in');
                if (inPins.length >= 2) {
                    let valuePin = inPins[1];
                    valuePin.setAttribute('_type', variable.type);
                    i_block.input[1].type = variable.type;
                }
            }
        }
        else if(i_block.type == "const"){
            if (e.target.type == 'checkbox') i_block.data.value = e.target.checked;
            else i_block.data.value = e.target.value;
        }
        else if(i_block.type == "variable"){
            let input_ = e.target.value;
            i_block.data.varname = input_;
            let raw_n = input_.split(',').map(s => s.trim()).filter(s => s.length > 0);
            let b_id = i_block.id;
            let select_type = i_block.data.select;
            let structure = i_block.data.structure.split(" ") || " Single";
            structure = structure[structure.length - 1]
            let actualType = structure === "Array" ? "Array" : select_type;
            let elementType = structure === "Array" ? select_type : null;

            console.log(structure)

            const regex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
            let valid_names = [];
            let errors = [];

        raw_n.forEach(name => {
            if (!regex.test(name)){
                errors.push(`Имя "${name}" содержит недопустимые символы или начинается с цифры`);
            }
            else{
                let vari = Main.variables.find(v => v.name === name && v.id_block !== b_id);
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

        // Удаляем старые переменные этого блока
        Main.variables = Main.variables.filter(v => v.id_block !== b_id);

        // Создаём новые
        valid_names.forEach(name => {
            Main.variables.push({
                id_block: b_id,
                name: name,
                type: actualType,
                elementType: elementType,
                value: structure === "Array" ? [] : null
            });
            });

            update_datalist();

            // Обновляем блоки Get, которые ссылаются на эти переменные
            valid_names.forEach(name => {
                let g_blocks = Main.blocks.filter(b => b.type === 'get' && b.data.varname === name);
                g_blocks.forEach(itm => {
                    if (itm.output.length > 0){
                        itm.output[0].type = actualType;
                        let out_el = document.getElementById(itm.output[0].id);
                        if (out_el) out_el.setAttribute("_type", actualType);
                    }
                    update_connected(itm.id, actualType);
                });
            });
        }
        else if (i_block.type === "make_array") {
            let inputs = el.querySelectorAll('.column:nth-child(2) input');
            let values = [];
            inputs.forEach(inp => values.push(inp.value));
            i_block.data.values = values;
        }
        else if (i_block.type === "get_element" || i_block.type === "set_element") {
            let input = e.target;
            let placeholder = input.placeholder;
            if (placeholder === "array") {
                i_block.data.array = input.value;
                update_set_get_element(i_block.id);
            } else if (placeholder === "index") {
                i_block.data.index = input.value;
            }
        }
        else if (i_block.type === "for_loop") {
            let input_ = e.target.value;
            switch(e.target.placeholder){
                case 'start': i_block.data.startIndex = Number(input_); break;
                case 'end': i_block.data.endIndex = Number(input_); break;
                case 'step': i_block.data.step = Number(input_); break;
            }
        }
        else{
            if (i_block.data.input != undefined) i_block.data.input = e.target.value;
            if (i_block.data.varname != undefined){
                i_block.data.varname = e.target.value;
                if (i_block.type == "variable"){
                    let variable = Main.variables.find(itm => itm.id_block == i_block.id);
                    if (variable){
                        variable.name = i_block.data.varname;
                        update_datalist();
                    }
                }
            }
            if (i_block.type === "get"){
                let block = document.getElementById(i_block.id);
                let f_var = Main.variables.find(itm => itm.name == e.target.value);
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

    function update_connected(blockId, new_type){
        let s_block = Main.blocks.find(b => b.id == blockId);
        if (!s_block) return;
        let out_pin = s_block.output[0];
        if (!out_pin || !out_pin.connection) return;
        let connections = out_pin.connection.slice();
        connections.forEach(conn => {
            let tar_blk_id = conn.to_block;
            let tar_in_id = conn.to;
            let tar_blk = Main.blocks.find(b => b.id == tar_blk_id);
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
                    let line = Main.svg.querySelector(`path[conn_but~="${out_pin.id}"][conn_but~="${tar_in_id}"]`);
                    if (line) line.remove();
                    out_pin.connection = out_pin.connection.filter(c => c.to != tar_in_id);
                    tar_inp.connection = tar_inp.connection.filter(c => c.from != out_pin.id);
                    if (out_pin.type === 'Exec') s_block.Exec = s_block.Exec.filter(id => id != tar_blk_id);
                    show_ERR(`Тип выхода блока изменился на ${new_type}, что несовместимо с фиксированным типом входа ${tar_inp.type}. Соединение разорвано.`, tar_blk_id);
                }
            }
        });
    }

    function add_to_blocks(th){
        let in_id = [];
        let out_id = [];
        let all_in = th.querySelectorAll(".in");
        let all_out = th.querySelectorAll(".out");

        for (let i of all_in){
            in_id.push({id: i.id, type: i.getAttribute("_type"), connection: []});
        }
        for (let i of all_out){
            out_id.push({id: i.id, type: i.getAttribute("_type"), connection: []});
        }

        let type = th.getAttribute("block_type");
        let data = null;

        switch(type){
            case "event": data = {}; break;
            case "variable": data = { varname: null, select: "Boolean", structure: "Single" }; break;
            case "set": data = {input: null}; break;
            case "get": data = {varname: null}; break;
            case "branch": data = {}; break;
            case "cout": data = {}; break;
            case "const": data = {type: "Integer", value: null}; break;
            case "sum": case "multiplication": case "subtraction": case "division":
            case "modulo": case "operation_more": case "operation_less":
            case "operation_more_equal": case "operation_less_equal":
            case "operation_equal": case "operation_not_equal":
            case "or": case "and": data = []; break;
            case "for_loop": data = { startIndex: null, endIndex: null, step: 1, currentIndex: 0 }; break;
            case "while_loop": data = { condition: null }; break;
            case "get_element": data = { array: null, index: null }; break;
            case "set_element": data = { array: null, index: null, value: null }; break;
            case "array_length": data = { array: null }; break;
            case "make_array": data = { values: [], elementType: "Integer" }; break;
            case "append": data = { array: null, element: null }; break;
            case "remove_index": data = { array: null, index: null }; break;
        }

        Main.blocks.push({
            id: th.id,
            type: type,
            Exec: [],
            input: in_id,
            output: out_id,
            data: data
        });
    }

    function delete_connection(in_ids, out_ids){
        if (in_ids === false && out_ids === false) return;
        let out_list = Array.isArray(out_ids) ? out_ids : [];
        let in_list = Array.isArray(in_ids) ? in_ids : [];

        Main.blocks.forEach(block => {
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
        let i = Number(block.id);

        let block_info = Main.blocks.find(itm => itm.id == i);

        Main.id_list.splice(Main.id_list.indexOf(i), 1);
        Main.id_cur.unshift(i);

        let lines_remove = Main.svg.querySelectorAll('path[conn_block~="' + i + '"]');
        for (let l of lines_remove) l.remove();

        let in_ids = [];
        let out_ids = [];
        let ins = block.querySelectorAll(".in");
        let outs = block.querySelectorAll(".out");
        for (let itm of ins) in_ids.push(itm.id);
        for (let itm of outs) out_ids.push(itm.id);

        delete_connection(in_ids, out_ids);

        if (block_info && block_info.type == "variable"){
            Main.variables = Main.variables.filter(v => v.id_block != i);
            update_datalist();
        }

        Main.blocks.forEach(blk => {
            let flag = blk.Exec.findIndex(id => id == i);
            if (flag !== -1) blk.Exec.splice(flag, 1);
        });

        let blockIndex = Main.blocks.findIndex(b => b.id == i);
        if (blockIndex !== -1) Main.blocks.splice(blockIndex, 1);

        block.remove();
    }

    function go_to(id_to, id_from){
        if (id_to == undefined){
            show_ERR(`Не подсоединен блок c id ${id_from}`, id_from);
            return;
        }
        let block = Main.blocks.find(itm => itm.id == id_to);
        functions[block.type]?.(id_to);
    }

    function reverse_go_to(blockId, path = new Set(), cache = new Map()){
        if (cache.has(blockId)){
            return cache.get(blockId);
        }

        if (path.has(blockId)){
            show_ERR(`Обнаружен цикл в графе данных для блока с id ${blockId}`, blockId);
            return undefined;
        }
        path.add(blockId);

        console.log(path)

        const block = Main.blocks.find(b => b.id == blockId);
        if (!block){
            path.delete(blockId);
            return null;
        }

        const inp_values = [];
        for (let inp of block.input) {
            if (inp.type === 'Exec') continue;
            if (inp.connection.length === 0) {
                inp_values.push(undefined);
                continue;
            }
            const conn = inp.connection[0];
            const s_blk_id = conn.from_block;
            const s_out_id = conn.from;

            let s_value = reverse_go_to(s_blk_id, path, cache);

            if (s_value === undefined) {
                console.error('Не удалось вычислить значение для блока с id', s_blk_id);
                inp_values.push(undefined);
            } else {
                const s_blk = Main.blocks.find(b => b.id == s_blk_id);
                const out = s_blk.output.find(o => o.id == s_out_id);
                if (out && functions[s_blk.type]){
                    const val = functions[s_blk.type](s_blk_id, s_value);
                    inp_values.push(val);
                    }
                else{
                    inp_values.push(undefined);
                }
            }
        }

    path.delete(blockId);

    cache.set(blockId, inp_values);
    return inp_values;
}

    // ---ФУНКЦИИ БЛОКОВ---
    const functions = {
        event: (id) => {
            let block = Main.blocks.find(itm => itm.id == id);
            go_to(block.Exec[0], id);
        },
        set: (id) => {
            let _block = Main.blocks.find(itm => itm.id == id);
            if (!_block) return;
            let varName = _block.data.varname;
            if (!varName){
                show_ERR(`Имя переменной не задано в блоке Set`, _block.id);
                return;
            }
            let variable = Main.variables.find(itm => itm.name == varName);
            if (!variable){
                show_ERR(`Переменная "${varName}" не найдена`, _block.id);
                return;
            }
            let inp_values = reverse_go_to(id, new Set(), new Map());
            let val_val = inp_values[0];
            if (val_val === undefined){
                show_ERR('Не подано значение на вход блока Set', _block.id);
                return;
            }
            let conv_val;
            switch (variable.type){
                case "Integer": conv_val = parseInt(val_val); if (isNaN(conv_val)){ show_ERR(`Не удалось преобразовать "${val_val}" к Integer`, _block.id); return; } break;
                case "Float": conv_val = parseFloat(val_val); if (isNaN(conv_val)){ show_ERR(`Не удалось преобразовать "${val_val}" к Float`, _block.id); return; } break;
                case "String": conv_val = String(val_val); break;
                case "Boolean": conv_val = toBoolean(val_val); break;
                default: conv_val = val_val;
            }
            variable.value = conv_val;
            if (_block.Exec && _block.Exec.length > 0) go_to(_block.Exec[0], id);
        },
        cout: (id) => {
            let block_info = Main.blocks.find(itm => itm.id == id);
            if (!block_info) return;
            let value = reverse_go_to(id, new Set(), new Map())[0];
            printToConsole(value);
        },
        get: (id) => {
            let block = Main.blocks.find(itm => itm.id == id);
            let Name = block.data.varname;
            let info = Main.variables.find(itm => itm.name == Name);
            if (!info){
                show_ERR(`Переменная "${Name}" не найдена`, block.id);
                return null;
            }
            return info ? info.value : null;
        },
        const: (id) => {
            let block = Main.blocks.find(itm => itm.id == id);
            let val = block.data.value;
            let type = block.data.type;
            if (type === 'Integer') return parseInt(val) || 0;
            if (type === 'Float') return parseFloat(val) || 0.0;
            if (type === 'Boolean') return !!val;
            return String(val);
        },
        sum: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data || [];
            let t = 0;
            for (let i = 0; i < values.length; i++){
                let val = values[i];
                if (val === undefined) val = parseFloat(data[i]) || 0;
                else val = parseFloat(val);
                if (!isNaN(val)) t += val;
            }
            return t;
        },
        multiplication: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data || [];
            let t = 1;
            for (let i = 0; i < values.length; i++){
                let val = values[i];
                if (val === undefined) val = parseFloat(data[i]);
                else val = parseFloat(val);
                if (!isNaN(val)) t *= val;
            }
            return t;
        },
        division: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data || [];
            let t = null;
            if (values[0] !== undefined) t = values[0];
            else if (data[0]) t = data[0];
            if (t === null){
                show_ERR(`Не указано делимое в блоке с id ${block.id}`, block.id);
                return null;
            }
            for (let i = 1; i < values.length; i++){
                let val = values[i];
                if (val === undefined) val = parseFloat(data[i]);
                else val = parseFloat(val);
                if (val === 0){
                    show_ERR(`Деление на ноль в блоке Division (id: ${id})`, id);
                    return Infinity;
                }
                if (!isNaN(val) && val !== 0) t /= val;
                else if (isNaN(val)) t = NaN;
            }
            return t;
        },
        subtraction: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data || [];
            let t = null;
            if (values[0] !== undefined) t = values[0];
            else if (data[0]) t = data[0];
            for (let i = 1; i < values.length; i++){
                let val = values[i];
                if (val === undefined) val = parseFloat(data[i]) || 0;
                else val = parseFloat(val);
                if (!isNaN(val)) t -= val;
            }
            return t;
        },
        modulo: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data || [];
            if (values.length < 2) return NaN;
            let a = values[0], b = values[1];
            if (a === undefined) a = parseFloat(data[0]);
            else a = parseFloat(a);
            if (b === undefined) b = parseFloat(data[1]);
            else b = parseFloat(b);
            if (isNaN(a) || isNaN(b) || b === 0) return NaN;
            return a % b;
        },
        operation_less: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data;
            let a = values[0] !== undefined ? values[0] : data[0];
            let b = values[1] !== undefined ? values[1] : data[1];
            if (a == null || b == null) return false;
            a = parseFloat(a); b = parseFloat(b);
            return !isNaN(a) && !isNaN(b) && a < b;
        },
        operation_less_equal: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data;
            let a = values[0] !== undefined ? values[0] : data[0];
            let b = values[1] !== undefined ? values[1] : data[1];
            if (a == null || b == null) return false;
            a = parseFloat(a); b = parseFloat(b);
            return !isNaN(a) && !isNaN(b) && a <= b;
        },
        operation_equal: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data;
            let a = values[0] !== undefined ? values[0] : data[0];
            let b = values[1] !== undefined ? values[1] : data[1];
            if (a == null || b == null) return false;
            a = parseFloat(a); b = parseFloat(b);
            return a == b;
        },
        operation_not_equal: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data;
            let a = values[0] !== undefined ? values[0] : data[0];
            let b = values[1] !== undefined ? values[1] : data[1];
            if (a == null || b == null) return false;
            a = parseFloat(a); b = parseFloat(b);
            return a != b;
        },
        operation_more: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data;
            let a = values[0] !== undefined ? values[0] : data[0];
            let b = values[1] !== undefined ? values[1] : data[1];
            if (a == null || b == null) return false;
            a = parseFloat(a); b = parseFloat(b);
            return !isNaN(a) && !isNaN(b) && a > b;
        },
        operation_more_equal: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data;
            let a = values[0] !== undefined ? values[0] : data[0];
            let b = values[1] !== undefined ? values[1] : data[1];
            if (a == null || b == null) return false;
            a = parseFloat(a); b = parseFloat(b);
            return !isNaN(a) && !isNaN(b) && a >= b;
        },
        or: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data || [];
            for (let i = 0; i < values.length; i++){
                let val = values[i] !== undefined ? values[i] : data[i];
                if (toBoolean(val)) return true;
            }
            return false;
        },
        and: (id, values) => {
            let block = Main.blocks.find(b => b.id == id);
            let data = block.data || [];
            for (let i = 0; i < values.length; i++){
                let val = values[i] !== undefined ? values[i] : data[i];
                if (!toBoolean(val)) return false;
            }
            return true;
        },
        invert: (id, values) => !values[0],
        branch: (id) => {
            let block = Main.blocks.find(b => b.id == id);
            if (!block) return;
            let inputs = reverse_go_to(id, new Set(), new Map());
            let RC = (inputs && inputs.length > 0) ? inputs[0] : false;
            let C = Boolean(RC);
            let out = C ? block.output[0] : block.output[1];
            if (out.connection && out.connection.length > 0){
                let next_id = out.connection[0].to_block;
                go_to(next_id, id);
            }
        },
        for_loop: function(id, values){
            if (arguments.length === 1){
                // Вызов по Exec
                let block = Main.blocks.find(b => b.id == id);
                let vals = reverse_go_to(id, new Set(), new Map());
                let start = vals[0] !== undefined ? parseInt(vals[0]) : (block.data.startIndex !== null ? parseInt(block.data.startIndex) : 0);
                let end = vals[1] !== undefined ? parseInt(vals[1]) : (block.data.endIndex !== null ? parseInt(block.data.endIndex) : 0);
                let step = vals[2] !== undefined ? parseInt(vals[2]) : (block.data.step !== null ? parseInt(block.data.step) : 1);
                if (isNaN(start)) start = 0;
                if (isNaN(end)) end = 0;
                if (isNaN(step) || step === 0) step = 1;

                let outLoopBody = block.output[1];
                let outCompleted = block.output[2];
                
                const iter_limit = 10000;
                let cur_it = 0;

                for (let i = start; (step > 0 ? i <= end : i >= end); i += step){
                    if (cur_it >= iter_limit) {show_ERR(`Превышен лимит итераций (${iter_limit}) в цикле for. Возможно, условие никогда не станет ложным.`, id); break;}
                    cur_it += 1;
                    console.log(cur_it)
                    block.data.currentIndex = i;
                    if (outLoopBody.connection.length > 0){
                        go_to(outLoopBody.connection[0].to_block, id);
                    }
                }
                block.data.currentIndex = null;
                if (outCompleted.connection.length > 0){
                    go_to(outCompleted.connection[0].to_block, id);
                }
            }
            else{
                let block = Main.blocks.find(b => b.id == id);
                return block.data.currentIndex;
            }
        },

        while_loop: function(id, values){
            if (arguments.length === 1){
                let block = Main.blocks.find(b => b.id == id);
                let outLoopBody = block.output[0]; // loop body
                let outCompleted = block.output[1]; // completed
                let condVals = reverse_go_to(id, new Set(), new Map());
                let condition = toBoolean(condVals[0]);

                const iter_limit = 10000;
                let cur_it = 0

                while (condition){
                    if (outLoopBody.connection.length > 0) go_to(outLoopBody.connection[0].to_block, id);
                    if (cur_it >= iter_limit) {show_ERR(`Превышен лимит итераций (${iter_limit}) в цикле while. Возможно, условие никогда не станет ложным.`, id); break;}
                    cur_it += 1;

                    condVals = reverse_go_to(id, new Set(), new Map());
                    condition = toBoolean(condVals[0]);
                }
                if (outCompleted.connection.length > 0) go_to(outCompleted.connection[0].to_block, id);
            }   
            else return null;
        },

        get_element: function(id, values){
            let arr = values[0];
            let idx = parseInt(values[1]);
            if (!Array.isArray(arr)){
                show_ERR(`Первый вход Get Element должен быть массивом`, id);
                return undefined;
            }
            if (isNaN(idx) || idx < 0 || idx >= arr.length){
                show_ERR(`Индекс ${idx} вне диапазона массива`, id);
                return undefined;
            }
            return arr[idx];
        },

        set_element: function(id, values){
            let arr = values[0];
            let idx = parseInt(values[1]);
            let val = values[2];
            if (!Array.isArray(arr)){
                show_ERR(`Первый вход Set Element должен быть массивом`, id);
                return arr;
            }
            if (isNaN(idx) || idx < 0 || idx >= arr.length){
                show_ERR(`Индекс ${idx} вне диапазона массива`, id);
                return arr;
            }
            arr[idx] = val;
            return arr; // возвращаем тот же массив (изменённый)
        },

        array_length: function(id, values){
            let arr = values[0];
            if (!Array.isArray(arr)){
                show_ERR(`Вход Array Length должен быть массивом`, id);
                return 0;
            }
            return arr.length;
        },

        make_array: function(id, values){
            // values - массив значений входов
            return values.slice(); // копируем
        },

        append: function(id, values){
            let arr = values[0];
            let elem = values[1];
            if (!Array.isArray(arr)){
                show_ERR(`Первый вход Append должен быть массивом`, id);
                return arr;
            }
            arr.push(elem);
            return arr;
        },

        remove_index: function(id, values){
            let arr = values[0];
            let idx = parseInt(values[1]);
            if (!Array.isArray(arr)){
                show_ERR(`Первый вход Remove Index должен быть массивом`, id);
                return arr;
            }
            if (isNaN(idx) || idx < 0 || idx >= arr.length){
                show_ERR(`Индекс ${idx} вне диапазона массива`, id);
                return arr;
            }
            arr.splice(idx, 1);
            return arr;
        }
    };

    // ---РАБОТА С ПИНАМИ---
    function pin_out(t){
        if (Main.TEMP_path){ Main.TEMP_path.remove(); Main.TEMP_path = null; }
        if (Main.TEMP_circle){ Main.TEMP_circle.remove(); Main.TEMP_circle = null; }

        Main.flag_1 = true;
        Main.t_1 = t;
        Main.route_points = [];

        Main.block_1 = Main.blocks.find(itm => itm.id == t.closest(".movable").id);
        let te = Main.block_1.output.find(itm => itm.id == t.id);
        if (te.type == "Exec" && te.connection.length != 0){
            if (Main.svg.querySelector("path[conn_but~=" + t.id + "]")) Main.svg.querySelector("path[conn_but~=" + t.id + "]").remove();
            delete_connection(false, [t.id]);
            Main.block_1.Exec.splice(Main.block_1.Exec.findIndex(itm => itm == te.connection[0].to_block), 1);
        }

        Main.TEMP_path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        let svgRect = Main.svg.getBoundingClientRect();
        let outRect = t.getBoundingClientRect();
        let startX = outRect.left + outRect.width/2 - svgRect.left;
        let startY = outRect.top + outRect.height/2 - svgRect.top;

        Main.TEMP_path.setAttribute("d", createRoutePath(startX, startY, startX, startY));
        Main.TEMP_path.setAttribute("stroke-width", 2);
        Main.TEMP_path.setAttribute("stroke", "white");
        Main.TEMP_path.setAttribute("fill", "none");
        Main.TEMP_path.setAttribute("stroke-dasharray", "5,5");
        Main.svg.append(Main.TEMP_path);

        Main.TEMP_circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        Main.TEMP_circle.setAttribute("fill", "white");
        Main.TEMP_circle.setAttribute("cx", startX);
        Main.TEMP_circle.setAttribute("cy", startY);
        Main.TEMP_circle.setAttribute("r", 5);
        Main.svg.append(Main.TEMP_circle);

        Main.safe.classList.add('connecting-mode');
    }

    function pin_in(t){
        if (Main.flag_1){
            Main.t_2 = t;
            Main.block_2 = Main.blocks.find(itm => itm.id == t.closest(".movable").id);
            let t_2_b = Main.block_2.input.find(itm => itm.id == t.id);
            Main.block_1 = Main.blocks.find(itm => itm.id == Main.t_1.closest(".movable").id);
            let t_1_b = Main.block_1.output.find(itm => itm.id == Main.t_1.id);

            if (!compatible(t_1_b.type, t_2_b.type)){
                show_ERR(`Несовместимые типы: ${t_1_b.type} и ${t_2_b.type}`, Main.block_2.id);
                return;
            }

            if (t_2_b.type == ""){
                t_2_b.type = t_1_b.type;
                t.setAttribute("_type", t_1_b.type);
            }

            let pathsToRemove = Main.svg.querySelectorAll(`path[conn_but~="${t.id}"]`);
            pathsToRemove.forEach(p => p.remove());
            delete_connection([t.id], false);

            if (Main.block_1.id == Main.block_2.id){
                if (Main.TEMP_path){ Main.TEMP_path.remove(); Main.TEMP_path = null; }
                if (Main.TEMP_circle){ Main.TEMP_circle.remove(); Main.TEMP_circle = null; }
                document.querySelectorAll('.route-point[data-temp="true"]').forEach(p => p.remove());
                Main.flag_1 = false;
                Main.safe.classList.remove('connecting-mode');
                return;
            }

            t_1_b.connection.push({from: Main.t_1.id, to: t.id, from_block: Main.block_1.id, to_block: Main.block_2.id, route: Main.route_points.slice()});
            t_2_b.connection.push({from: Main.t_1.id, to: t.id, from_block: Main.block_1.id, to_block: Main.block_2.id, route: Main.route_points.slice()});
            if (t_1_b.type == "Exec") Main.block_1.Exec.push(Main.block_2.id);

            let path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            let svgRect = Main.svg.getBoundingClientRect();
            let outRect = Main.t_1.getBoundingClientRect();
            let inRect = t.getBoundingClientRect();

            let x1 = outRect.left + outRect.width/2 - svgRect.left;
            let y1 = outRect.top + outRect.height/2 - svgRect.top;
            let x2 = inRect.left + inRect.width/2 - svgRect.left;
            let y2 = inRect.top + inRect.height/2 - svgRect.top;

            path.setAttribute("d", createRoutePath(x1, y1, x2, y2, Main.route_points));
            path.setAttribute("stroke-width", 2);
            path.setAttribute("stroke", "white");
            path.setAttribute("fill", "none");
            path.setAttribute("conn_block", Main.block_1.id + " " + Main.block_2.id);
            path.setAttribute("conn_but", Main.t_1.id + " " + t.id);
            if (Main.route_points.length > 0){
                path.setAttribute("data-route", JSON.stringify(Main.route_points));
            }
            Main.svg.append(path);

            if (Main.TEMP_path) Main.TEMP_path.remove(); Main.TEMP_path = null;
            if (Main.TEMP_circle) Main.TEMP_circle.remove(); Main.TEMP_circle = null;
            document.querySelectorAll('.route-point[data-temp="true"]').forEach(p => p.remove());

            Main.route_points = [];
            Main.flag_1 = false;
            Main.safe.classList.remove('connecting-mode');
            
            if (Main.block_2.type === 'get_element' || Main.block_2.type === 'set_element') {
                let targetIn = Main.block_2.input.find(inp => inp.id == t.id);
                if (targetIn && targetIn.type === 'Array') {
                    update_set_get_element(Main.block_2.id);
                }
            }
        }
        else{
            Main.t_2 = t;
            Main.block_2 = Main.blocks.find(itm => itm.id == t.closest(".movable").id);
            let t_2_b = Main.block_2.input.find(itm => itm.id == t.id);
            let conns = t_2_b ? t_2_b.connection.slice() : [];
            conns.forEach(conn => {
                let s_block = Main.blocks.find(b => b.id == conn.from_block);
                if (s_block){
                    let s_out = s_block.output.find(out => out.id == conn.from);
                    if (s_out){
                        s_out.connection = s_out.connection.filter(c => c.to != t.id);
                        if (s_out.type == "Exec") s_block.Exec = s_block.Exec.filter(id => id != Main.block_2.id);
                    }
                }
                let path = Main.svg.querySelector(`path[conn_but~="${conn.from}"][conn_but~="${t.id}"]`);
                if (path) path.remove();
            });
            if (t_2_b) t_2_b.connection = [];
            if (t.getAttribute("flag_ch") == "true"){
                t.setAttribute("_type", "");
                if (t_2_b) t_2_b.type = "";
            }
            if (t_2_b.type === "Array" && (block_2.type === 'set_element' || block_2.type === 'get_elements')){
                if (block_2.type === 'set_element'){
                    
                }
                else{

                }
            }
        }
    }

    // ---ПЕРЕМЕЩЕНИЕ БЛОКОВ---
    document.addEventListener('mousedown', function(e){
        let movable = e.target.closest(".movable");
        if (!movable) return;
        Main.el = movable;

        let elRect = Main.el.getBoundingClientRect();

        Main.f_D = true;
        Main.X = e.clientX - elRect.left;
        Main.Y = e.clientY - elRect.top;
        Main.el.style.cursor = 'grabbing';
        e.preventDefault();
    });

    document.addEventListener('mousemove', function(e){
        if (!Main.f_D || !Main.el) return;

        let Xi = e.clientX - Main.X + Main.safe.scrollLeft;
        let Yi = e.clientY - Main.Y + Main.safe.scrollTop;

        let safeRect = Main.safe.getBoundingClientRect();
        let elRect = Main.el.getBoundingClientRect();

        let cardRect = document.querySelector(".card").getBoundingClientRect();

        Xi = Math.max(safeRect.left, Math.min(safeRect.width  + Main.safe.scrollLeft + safeRect.left - elRect.width, Xi)) - 10 - safeRect.left;
        Yi = Math.max(safeRect.top, Math.min(safeRect.height + Main.safe.scrollTop + safeRect.top - elRect.height, Yi)) - 10 - cardRect.height;

        Main.el.style.left = Xi + 'px';
        Main.el.style.top = Yi + 'px';

        updateLinesForBlock(Main.el);
    });

    document.addEventListener('mousemove', function(e){
        if (Main.flag_1 && Main.TEMP_path && Main.TEMP_circle){
            let svgRect = Main.svg.getBoundingClientRect();
            let mouseX = e.clientX - svgRect.left;
            let mouseY = e.clientY - svgRect.top;

            // Получаем начальную точку из текущего атрибута d
            let d = Main.TEMP_path.getAttribute("d");
            let parts = d.split(" ");
            let x1 = parseFloat(parts[1]);
            let y1 = parseFloat(parts[2]);

            // Обновляем путь и кружок
            Main.TEMP_path.setAttribute("d", createRoutePath(x1, y1, mouseX, mouseY, Main.route_points));
            Main.TEMP_circle.setAttribute("cx", mouseX);
            Main.TEMP_circle.setAttribute("cy", mouseY);
        }
    });

    // Отмена соединения по двойному клику вне входных пинов
    document.addEventListener("dblclick", function(e){
        if (Main.flag_1){
            let targetIn = e.target.closest(".in");
            if (!targetIn){
                if (Main.TEMP_path){
                    Main.TEMP_path.remove();
                    Main.TEMP_path = null;
                }
                if (Main.TEMP_circle){
                    Main.TEMP_circle.remove();
                    Main.TEMP_circle = null;
                }
                document.querySelectorAll('.route-point[data-temp="true"]').forEach(p => p.remove());
                Main.flag_1 = false;
                Main.route_points = [];
                Main.safe.classList.remove('connecting-mode');
            }
        }
    });

    document.addEventListener('mouseup', function(){
        if (Main.el) Main.el.style.cursor = 'move';
        Main.f_D = false;
    });

    document.addEventListener('mouseleave', function(){
        if (Main.el) Main.el.style.cursor = 'move';
        Main.f_D = false;
    });

    // ---ПЕРЕДВИЖЕНИЕ ПО SAFE-ZONE---
    function safe_mousedown(e){
        if (document.activeElement && !e.target.closest('input, select, button')){
            document.activeElement.blur();
        }
        if (!e.target.closest(".safe-zone") || e.target.closest(".movable") || e.target.closest("circle")) return;
        Main.f_S = true;

        Main.startX = e.clientX;
        Main.startY = e.clientY;
        Main.start_Sc_left = Main.safe.scrollLeft;
        Main.start_Sc_top = Main.safe.scrollTop;

        Main.safe.addEventListener("mousemove", safe_mousemove);
        e.preventDefault();
    }

        function safe_mousemove(e){
            if (!Main.f_S) return;
            let dX = e.clientX - Main.startX;
            let dY = e.clientY - Main.startY;

         Main.safe.scrollLeft = Main.start_Sc_left - dX;
            Main.safe.scrollTop = Main.start_Sc_top - dY;

            Main.safe.addEventListener("mouseup", safe_mouseup);
            Main.safe.addEventListener("mouseleave", safe_mouseleave);
        }

        function safe_mouseup(){
            if (Main.f_S){
                Main.f_S = false;
                Main.safe.removeEventListener("mousemove", safe_mousemove);
            }
        }

        function safe_mouseleave(){
            if (Main.f_S){
                Main.f_S = false;
                Main.safe.removeEventListener("mousemove", safe_mousemove);
            }
        }

        // ---КОНСОЛЬ ВЫВОДА---
        function printToConsole(value){
            let cons_el = document.getElementById('output-console');
            let msg_el = document.getElementById('output-messages');
            if (!cons_el || !msg_el) return;

            console.log(value);
            cons_el.style.display = 'block';
            let line = document.createElement('div');
            line.textContent = String(value);
            line.style.borderBottom = '1px solid #333';
            line.style.padding = '2px 0';
            msg_el.appendChild(line);
            msg_el.scrollTop = msg_el.scrollHeight;
        }

        function clearOutputConsole(){
            let msg_el = document.getElementById('output-messages');
            if (msg_el) msg_el.innerHTML = '';
            let cons_el = document.getElementById('output-console');
            if (cons_el && msg_el.children.length === 0){
                cons_el.style.display = 'none';
            }
        }

    // ---СОЗДАНИЕ БЛОКОВ---
    function to_sz(t){
        let safeRect = Main.safe.getBoundingClientRect();
        let c_t = t.cloneNode(true);
        c_t.setAttribute("style", `top: ${Main.safe.scrollTop + safeRect.height/2}px; left: ${Main.safe.scrollLeft + safeRect.width/2}px`);
        c_t.classList.remove("movable");
        c_t.classList.add("movable");
        c_t.removeAttribute("onclick");
        Main.safe.append(c_t);

        let out_t = c_t.querySelectorAll(".out");
        for (let i of out_t){
            i.setAttribute("data-id", "out_" + Main.but_out_id);
            i.setAttribute("id", "out_" + Main.but_out_id);
            i.onclick = function(e){ e.stopPropagation(); pin_out(this); };
            Main.but_out_id += 1;
        }

        let selects = c_t.querySelectorAll("select");
        selects.forEach((select, index) => {
            select.onclick = e => e.stopPropagation();
            select.onmousedown = e => e.stopPropagation();
            select.addEventListener("change", function(){
                console.log(index)
                if (index === 0){
            let type = this.value;
            let block = this.closest(".movable");
            let block_info = Main.blocks.find(itm => itm.id == block.id);
            block_info.data.select = type;
    
            if (block_info.type == "variable") {
                let nameInput = block.querySelector('input[name="Var"]');
                if (nameInput){
                    let event = new Event('input', { bubbles: true });
                    nameInput.dispatchEvent(event);
                }
            }
            else{
                if (block_info.output.length > 0){
                    block_info.output[0].type = type;
                    let out = block.querySelector(".out");
                    if (out) out.setAttribute("_type", type);
                }
            }
                 }
                else if (index === 1) {
                    let struct = this.value;
                    console.log(struct)
                    let block = this.closest(".movable");
                    let block_info = Main.blocks.find(itm => itm.id == block.id);
                    block_info.data.structure = struct;
                    let nameInput = block.querySelector('input[name="Var"]');
                    if (nameInput) {
                        let event = new Event('input', { bubbles: true });
                        nameInput.dispatchEvent(event);
                    }
                }
            })
        })

        let in_t = c_t.querySelectorAll(".in");
        in_t.forEach(itm => {
            if (itm.getAttribute("_type") == "") itm.setAttribute("flag_ch", true);
            itm.setAttribute("onclick", "pin_in(this)");
            itm.setAttribute("id", "in_" + Main.but_in_id);
            Main.but_in_id += 1;
        });

        let b_t = c_t.querySelector(".delete-button_x");
        b_t.className = "delete-button";
        b_t.setAttribute("onclick", "delete_block(this)");

        c_t.id = Main.id_cur[0];

        if (Main.cur_i == Main.id_cur[0]){
            Main.id_list.push(Main.id_cur[0]);
            Main.id_cur.pop();
            Main.cur_i += 1;
            Main.id_cur.push(Main.cur_i);
        }
        else{
            Main.id_list.push(Main.id_cur[0]);
            Main.id_cur.shift();
        }

        add_to_blocks(c_t);

        let inputs = c_t.querySelectorAll("input");
        inputs.forEach(input => {
            if (c_t.getAttribute('block_type') === "Sum" || 
                c_t.getAttribute('block_type') === 'multiplication' ||
                c_t.getAttribute('block_type') === 'division' ||
                c_t.getAttribute('block_type') === 'subtraction' ||
                c_t.getAttribute('block_type') === 'modulo' ||
                c_t.getAttribute('block_type') === 'for_loop'
                ) input.type = 'number';
            input.onclick = e => e.stopPropagation();
            input.onmousedown = e => e.stopPropagation();
            input.setAttribute("id", "input_" + Main.blk_input_id);
            Main.blk_input_id += 1;
            input.addEventListener("input", funct_input);
        });

        
        if (c_t.getAttribute('block_type') === 'remove_index' ||
            c_t.getAttribute('block_type') === 'get_element' ||
            c_t.getAttribute('block_type') === 'set_element') inputs[1].type = 'number';

        if (['sum','multiplication','subtraction','division','or','and','make_array'].includes(c_t.getAttribute('block_type'))){
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
                    n_input.style.width = '60px';
                    if (type === 'String'){
                        n_input.placeholder = 'text'
                        n_input.type = 'text'
                    }
                    else{
                        n_input.placeholder = 'number'
                        n_input.type = 'number';
                    }
                }
                n_input.id = 'input_' + Main.blk_input_id++;
                n_input.onclick = e => e.stopPropagation();
                n_input.onmousedown = e => e.stopPropagation();
                n_input.addEventListener('input', funct_input);
                if (type === 'Boolean') n_input.addEventListener('change', funct_input);
                container.appendChild(n_input);

                out_bt.setAttribute('_type', type);
                let block_Info = Main.blocks.find(b => b.id == c_t.id);
                if (block_Info){
                    block_Info.output[0].type = type;
                    block_Info.data.type = type;
                }
            }
            select.onchange = function(){
                update_const(this.value);
                update_connected(this.parentNode.parentNode.parentNode.id, this.value);
            };
            update_const('Integer');
        }

        if (c_t.getAttribute('block_type') === 'get_element' || c_t.getAttribute('block_type') === 'set_element') {
            let arrayInput = Array.from(c_t.querySelectorAll('input')).find(inp => inp.placeholder === 'array');
            if (arrayInput) {
                arrayInput.setAttribute('list', 'global_datalist');
            }
        }
    }

    function add_inputs(blk_el){
        let block = Main.blocks.find(b => b.id == blk_el.id);
        if (!block || !['sum','multiplication','subtraction','division','or','and','make_array'].includes(block.type)) return;

        let left_col = blk_el.querySelector('.three_columns .column:first-child');
        let right_col = blk_el.querySelector('.three_columns .column:nth-child(2)');
        let add = blk_el.querySelector('.add');
        if (!left_col || !right_col || !add) return;

        let in_b = document.createElement('button');
        in_b.className = 'in';
        in_b.setAttribute('_type', (block.type === 'or' || block.type === 'and') ? 'Boolean' : (block.type === 'make_array' ? '' : 'Integer'));
        in_b.setAttribute('onclick', 'pin_in(this)');
        in_b.id = 'in_' + Main.but_in_id++;
        left_col.insertBefore(in_b, add);

        if (block.type !== 'make_array'){
            let inp = document.createElement('input');
            inp.style.margin = '1.4px';
            inp.id = 'input_' + Main.blk_input_id++;
            inp.onclick = e => e.stopPropagation();
            inp.onmousedown = e => e.stopPropagation();
            inp.addEventListener('input', funct_input);
            right_col.appendChild(inp);
        }
        if (!Array.isArray(block.data)) block.data = [];
        block.data.push(null);
        block.input.push({ id: in_b.id, type: (block.type === 'or' || block.type === 'and') ? 'Boolean' : (block.type === 'make_array' ? '' : 'Integer'), connection: [] });
    }

    // ---СОХРАНЕНИЕ/ЗАГРУЗКА---
    function collectProjectData(){
        const blockElements = document.querySelectorAll('.safe-zone .movable');
        blockElements.forEach(el => {
            const blockIndex = Main.blocks.findIndex(b => b.id == el.id);
            if (blockIndex !== -1){
                Main.blocks[blockIndex].style = { left: el.style.left, top: el.style.top };
            }
        });

        const variablesData = Main.variables.map(v => ({ ...v }));
        const nextIds = {
            cur_i: Main.cur_i,
            id_cur: Main.id_cur,
            but_in_id: Main.but_in_id,
            but_out_id: Main.but_out_id,
            blk_input_id: Main.blk_input_id
        };

        return {
            version: "1.0",
            timestamp: new Date().toISOString(),
            blocks: Main.blocks,
            variables: variablesData,
            nextIds: nextIds
        };
    }

    function saveProject(){
        try {
            const projectData = collectProjectData();
            localStorage.setItem('blueprint_autosave', JSON.stringify(projectData));

            const jsonString = JSON.stringify(projectData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blueprint_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
            a.click();
            URL.revokeObjectURL(url);
            printToConsole('✅ Проект успешно сохранен!');
        } catch (e){
            console.error('Ошибка сохранения:', e);
            show_ERR('Ошибка при сохранении: ' + e.message);
        }
    }

    function loadProject(){
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = function(e){
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = function(event){
                try {
                    const projectData = JSON.parse(event.target.result);
                    clearProject();

                    if (projectData.nextIds){
                        Main.cur_i = projectData.nextIds.cur_i || 0;
                        Main.id_cur = projectData.nextIds.id_cur || [Main.cur_i];
                        Main.but_in_id = projectData.nextIds.but_in_id || 0;
                        Main.but_out_id = projectData.nextIds.but_out_id || 0;
                        Main.blk_input_id = projectData.nextIds.blk_input_id || 0;
                    }

                    if (projectData.variables){
                        projectData.variables.forEach(v => {
                            Main.variables.push({ ...v });
                        });
                    }

                    if (projectData.blocks){
                        restoreBlocks(projectData.blocks);
                    }

                    update_datalist();
                    printToConsole('✅ Проект успешно загружен!');
                } catch (e){
                    console.error('Ошибка загрузки:', e);
                    show_ERR('Ошибка при загрузке: ' + e.message);
                }
            };
            reader.readAsText(file);
        };
        input.click();
    }

    function clearProject(){
        document.querySelectorAll('.safe-zone .movable').forEach(el => el.remove());
        document.querySelectorAll('.safe-zone svg path').forEach(el => el.remove());
        Main.blocks.length = 0;
        Main.variables.length = 0;
        clear_ERR();
        clearOutputConsole();
    }

    function restoreBlocks(blocksData){
        blocksData.forEach(blockData => {
            const template = document.querySelector(`.side-panel .block[block_type="${blockData.type}"]`);
            if (!template){
                console.warn(`Шаблон для типа ${blockData.type} не найден`);
                return;
            }
            const clone = template.cloneNode(true);
            clone.id = blockData.id;
            clone.classList.add('movable');
            clone.style.left = blockData.style?.left || '100px';
            clone.style.top = blockData.style?.top || '100px';

            const inPins = clone.querySelectorAll('.in');
            blockData.input.forEach((inpData, index) => {
                if (inPins[index]){
                    inPins[index].id = inpData.id;
                    inPins[index].setAttribute('_type', inpData.type || '');
                    if (!inpData.type) inPins[index].setAttribute('flag_ch', 'true');
                    else inPins[index].removeAttribute('flag_ch');
                }
            });

            const outPins = clone.querySelectorAll('.out');
            blockData.output.forEach((outData, index) => {
                if (outPins[index]){
                    outPins[index].id = outData.id;
                    outPins[index].setAttribute('_type', outData.type || '');
                }
            });

            if (blockData.type === 'variable' && blockData.data){
                const selectType = clone.querySelector('select');
                const selectStruct = clone.querySelectorAll('select')[1];
                if (selectType && blockData.data.select) selectType.value = blockData.data.select;
                if (selectStruct && blockData.data.structure) selectStruct.value = blockData.data.structure;
                const nameInput = clone.querySelector('input[name="Var"]');
                if (nameInput && blockData.data.varname) nameInput.value = blockData.data.varname;
                if (nameInput) {
                    let event = new Event('input', { bubbles: true });
                    nameInput.dispatchEvent(event);
                }
            }

            if (blockData.type === 'const' && blockData.data){
                const select = clone.querySelector('.const-type-select');
                if (select && blockData.data.type) select.value = blockData.data.type;
                const container = clone.querySelector('.const-input-container');
                if (container){
                    const input = container.querySelector('input');
                    if (input && blockData.data.value !== null) input.value = blockData.data.value;
                }
            }

            if (Array.isArray(blockData.data)){
                const inputs = clone.querySelectorAll('.column:nth-child(2) input');
                inputs.forEach((input, idx) => {
                    if (blockData.data[idx] !== undefined) input.value = blockData.data[idx];
                    input.id = 'input_' + (Main.blk_input_id++);
                });
            }

            if ((blockData.type === 'set' || blockData.type === 'get') && blockData.data){
                const input = clone.querySelector('input');
                if (input && blockData.data.varname) input.value = blockData.data.varname;
            }

            clone.querySelectorAll('input').forEach(input => {
                if (!input.id || !input.id.startsWith('input_')) input.id = 'input_' + (Main.blk_input_id++);
            });

            if (blockData.type === 'for_loop' && blockData.data) {
                let inputs = clone.querySelectorAll('.column:nth-child(2) input');
                if (inputs[0]) inputs[0].value = blockData.data.startIndex || '';
                if (inputs[1]) inputs[1].value = blockData.data.endIndex || '';
                if (inputs[2]) inputs[2].value = blockData.data.step || '1';
            }

            Main.safe.appendChild(clone);
            setupBlockHandlers(clone);

            if (blockData.type === 'make_array' && Array.isArray(blockData.data)) {
                let currentInputs = clone.querySelectorAll('.column:nth-child(2) input').length;
                let needed = blockData.data.length;
                for (let i = currentInputs; i < needed; i++) {
                    add_inputs(clone);
                }
                let inputs = clone.querySelectorAll('.column:nth-child(2) input');
                inputs.forEach((input, idx) => {
                if (idx < blockData.data.length) {
                    input.value = blockData.data[idx];
                }
            });
        }

            Main.blocks.push({
                id: blockData.id,
                type: blockData.type,
                Exec: blockData.Exec || [],
                input: blockData.input.map(inp => ({ ...inp, connection: inp.connection.map(c => ({ ...c })) })),
                output: blockData.output.map(out => ({ ...out, connection: out.connection.map(c => ({ ...c })) })),
                data: blockData.data,
                style: blockData.style
            });
        });

        setTimeout(() => drawConnections(), 100);
    }

    function drawConnections(){
        document.querySelectorAll('.safe-zone svg path[conn_block]').forEach(p => p.remove());
        Main.blocks.forEach(block => {
            block.output.forEach(out => {
                out.connection.forEach(conn => {
                    const fromEl = document.getElementById(conn.from);
                    const toEl = document.getElementById(conn.to);
                    if (fromEl && toEl){
                        const svgRect = Main.svg.getBoundingClientRect();
                        const outRect = fromEl.getBoundingClientRect();
                        const inRect = toEl.getBoundingClientRect();

                        const x1 = outRect.left + outRect.width/2 - svgRect.left;
                        const y1 = outRect.top + outRect.height/2 - svgRect.top;
                        const x2 = inRect.left + inRect.width/2 - svgRect.left;
                        const y2 = inRect.top + inRect.height/2 - svgRect.top;

                        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                        const routePoints = conn.route || [];
                        path.setAttribute("d", createRoutePath(x1, y1, x2, y2, routePoints));
                        path.setAttribute("stroke-width", 2);
                        path.setAttribute("stroke", "white");
                        path.setAttribute("fill", "none");
                        path.setAttribute("conn_block", block.id + " " + conn.to_block);
                        path.setAttribute("conn_but", conn.from + " " + conn.to);
                        if (routePoints.length > 0) path.setAttribute("data-route", JSON.stringify(routePoints));
                        Main.svg.appendChild(path);
                    }
                });
            });
        });
    }   

    function setupBlockHandlers(el){
        const deleteBtn = el.querySelector('.delete-button, .delete-button_x');
        if (deleteBtn) deleteBtn.onclick = function(e){ e.stopPropagation(); delete_block(this); };

        el.querySelectorAll('.out').forEach(btn => {
            btn.onclick = function(e){ e.stopPropagation(); pin_out(this); };
        });

        el.querySelectorAll('.in').forEach(btn => {
            btn.onclick = function(e){ e.stopPropagation(); pin_in(this); };
        });

        const addBtn = el.querySelector('.add');
        if (addBtn) addBtn.onclick = function(e){ e.stopPropagation(); add_inputs(el); };

        el.querySelectorAll('input').forEach(input => {
            input.onclick = e => e.stopPropagation();
            input.onmousedown = e => e.stopPropagation();
            input.addEventListener('input', funct_input);
        });

        el.querySelectorAll('select').forEach(select => {
            select.onclick = e => e.stopPropagation();
            select.onmousedown = e => e.stopPropagation();
            select.addEventListener('change', function(e){
                e.stopPropagation();
                const event = new Event('input', { bubbles: true });
                this.dispatchEvent(event);
            });
        });
    }

    function enableAutosave(interval = 30000){
        setInterval(() => {
            try {
                const projectData = collectProjectData();
                localStorage.setItem('blueprint_autosave', JSON.stringify(projectData));
            } catch (e){
                console.error('Ошибка автосохранения:', e);
            }
        }, interval);
    }

    function loadAutosave(){
        const autosave = localStorage.getItem('blueprint_autosave');
        if (!autosave){ show_ERR('Нет автосохранения'); return; }
        try {
            const projectData = JSON.parse(autosave);
            if (confirm('Загрузить последнее автосохранение?')){
                clearProject();
                if (projectData.nextIds){
                    Main.cur_i = projectData.nextIds.cur_i || 0;
                    Main.id_cur = projectData.nextIds.id_cur || [Main.cur_i];
                    Main.but_in_id = projectData.nextIds.but_in_id || 0;
                    Main.but_out_id = projectData.nextIds.but_out_id || 0;
                    Main.blk_input_id = projectData.nextIds.blk_input_id || 0;
                }
                if (projectData.variables) projectData.variables.forEach(v => Main.variables.push({ ...v }));
                if (projectData.blocks) restoreBlocks(projectData.blocks);
                update_datalist();
                printToConsole('✅ Автосохранение загружено');
            }
        } catch (e){
            console.error('Ошибка загрузки автосохранения:', e);
            show_ERR('Ошибка загрузки автосохранения');
        }
    }

    // ---ИНИЦИАЛИЗАЦИЯ---
    function init(){
        Main.safe = document.querySelector(".safe-zone");
        Main.svg = Main.safe.querySelector('svg');

        //Начальный скролл
        Main.safe.scrollTop = 2000;
        Main.safe.scrollLeft = 1400;

        //Обработчики рабочей области
        Main.safe.addEventListener("mousedown", safe_mousedown);

        //Кнопка очистки вывода
        document.getElementById('clear-output')?.addEventListener('click', clearOutputConsole);

        //Кнопка сетки
        document.getElementById('grid-toggle-btn')?.addEventListener('click', function(){
            Main.safe.classList.toggle('no-grid');
            this.textContent = Main.safe.classList.contains('no-grid') ? '⊟' : '⊞';
        });

        //Обновление фона сетки
        Main.safe.addEventListener('scroll', function(){
            Main.safe.style.backgroundPosition = `-${Main.safe.scrollLeft}px -${Main.safe.scrollTop}px`;
        });

        //Клик по блокам в боковой панели
        document.querySelectorAll(".side-panel .block").forEach(block => {
            block.addEventListener("click", function(e){
                if (e.target.tagName === 'BUTTON' || e.target.tagName === 'SELECT' || e.target.tagName === 'INPUT' || e.target.tagName === 'OPTION') return;
                to_sz(this);
            });
        });

        //Кнопки сохранения/загрузки
        addSaveLoadButtons();
        enableAutosave(30000);

        //Проверка автосохранения при загрузке
        const autosave = localStorage.getItem('blueprint_autosave');
        if (autosave){
            try {
                const data = JSON.parse(autosave);
                const timestamp = new Date(data.timestamp).toLocaleString();
                console.log(`📁 Есть автосохранение от ${timestamp}`);
            } catch (e){}
        }

        //Обработчик правого клика для добавления точек маршрута
        Main.safe.addEventListener('contextmenu', function(e){
            e.preventDefault();
            if (Main.flag_1 && !e.target.closest('.movable') && !e.target.closest('.in') && !e.target.closest('.out')){
                let svgRect = Main.svg.getBoundingClientRect();
                let clickX = e.clientX - svgRect.left;
                let clickY = e.clientY - svgRect.top;
                Main.route_points.push({x: clickX, y: clickY});

                let point = document.createElementNS("http://www.w3.org/2000/svg", "circle");
                point.setAttribute("fill", "#00ff00");
                point.setAttribute("cx", clickX);
                point.setAttribute("cy", clickY);
                point.setAttribute("r", 8);
                point.setAttribute("class", "route-point");
                point.setAttribute("data-temp", "true");
                Main.svg.appendChild(point);

                setTimeout(() => { if (point.parentNode){ point.setAttribute("r", "5"); point.setAttribute("fill", "white"); } }, 150);
                setTimeout(() => { if (point.parentNode) point.remove(); }, 400);
            }
        });
    }

    function addSaveLoadButtons(){
    const card = document.querySelector('.card');
    if (!card || document.querySelector('#save-btn')) return;

        const saveBtn = document.createElement('button');
        saveBtn.id = 'save-btn';
        saveBtn.width = "50%";
        saveBtn.className = 'contact-button';
        saveBtn.style.background = '#4CAF50';
        saveBtn.innerHTML = '💾 Сохранить';
        saveBtn.onclick = saveProject;

        const loadBtn = document.createElement('button');
        loadBtn.id = 'load-btn';
        loadBtn.className = 'contact-button';
        loadBtn.style.background = '#FF9800';
        loadBtn.innerHTML = '📂 Загрузить';
        loadBtn.onclick = loadProject;

        const autosaveBtn = document.createElement('button');
        autosaveBtn.id = 'autosave-btn';
        autosaveBtn.className = 'contact-button';
        autosaveBtn.style.background = '#2196F3';
        autosaveBtn.innerHTML = '↺ Автосохранение';
        autosaveBtn.onclick = loadAutosave;

        const startBtn = document.createElement('button');
        startBtn.id = 'start-btn';
        startBtn.className = 'contact-button';
        startBtn.style.background = '#28a745';
        startBtn.innerHTML = '▶ Старт';
        startBtn.onclick = function(){
        const eventBlock = Main.blocks.find(b => b.type === 'event');
        if (eventBlock){
            START(eventBlock.id);
        }
        else{
                show_ERR('Нет блока Event для запуска');
            }
        };

        const clearOutputBtn = document.createElement('button');
        clearOutputBtn.id = 'clear-output-btn';
        clearOutputBtn.className = 'contact-button';
        clearOutputBtn.style.background = '#dc3545';
        clearOutputBtn.innerHTML = '🗑 Очистить консоль ошибок';
        clearOutputBtn.onclick = function(){
            clear_ERR();
        };

        card.appendChild(saveBtn);
        card.appendChild(loadBtn);
        card.appendChild(autosaveBtn);
        card.appendChild(startBtn);
        card.appendChild(clearOutputBtn);
    }

    function update_datalist(){
        let datalist = document.getElementById('global_datalist');
        if (!datalist) return;
        datalist.innerHTML = '';
        Main.variables.forEach(variable => {
            if (variable.name){
                let option = document.createElement('option');
                option.value = variable.name;
                datalist.appendChild(option);
            }
        });
    }

    function START(th){
        clearOutputConsole();
        clear_ERR();
        functions["event"]?.(th);
    }

    // ---ЭКСПОРТ В ГЛОБАЛЬНУЮ ОБЛАСТЬ---
    window.Main = Main;
    window.pin_in = pin_in;
    window.pin_out = pin_out;
    window.delete_block = delete_block;
    window.START = START;
    window.update_datalist = update_datalist;
    window.add_inputs = add_inputs;
    window.funct_input = funct_input;
    window.printToConsole = printToConsole;
    window.clearOutputConsole = clearOutputConsole;
    window.show_ERR = show_ERR;
    window.clear_ERR = clear_ERR;

    if (document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', init);
    }
    else{
        init();
    }
})();