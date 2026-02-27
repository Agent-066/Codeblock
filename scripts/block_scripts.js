//Кидаем в to_sz()

blocks = [];

function delete_connection(in_ids, out_ids){
    from = 'from';
    to = 'to';

    if (out_ids == false && in_ids == false) return;
    else{
        if (out_ids == false) out_ids = in_ids; from = to;
        if (in_ids == false) in_ids = out_ids; to = from;
    }

    blocks.forEach(itm_0 => {
        itm_0.input.forEach(itm_1 => {
            if (itm_1.connection){
                itm_1.connection = itm_1.connection.filter(c => !in_ids.includes(c[to]))
            }
        })

        itm_0.output.forEach(itm_1 => {
            if (itm_1.connection){
                itm_1.connection = itm_1.connection.filter(c => !out_ids.includes(c[from]))
            }
        })
    });
}

function delete_block(t){
    let block = t.closest(".movable");
    i = Number(block.id);

    id_list.splice(id_list.indexOf(i), 1)
    id_cur.unshift(i);

    let lines_remove = svg.querySelectorAll('line[conn_block~="' + i + '"]');
    for (l of lines_remove) l.remove();
        
    ind = blocks.findIndex(itm => itm.id == i);
    if (ind == -1) return;

    in_ids = [];
    out_ids = [];
    ins = block.querySelectorAll(".in");
    outs = block.querySelectorAll(".out");
    for (itm of ins) in_ids.push(itm.id);
    for (itm of outs) out_ids.push(itm.id);

    delete_connection(in_ids, out_ids);

    blocks.splice(i, 1);

    block.remove();
}

function add_to_blocks(th){
    in_id = [];
    out_id = [];
    all_in = th.querySelectorAll(".in");
    all_out = th.querySelectorAll(".out");

    for (i of all_in){in_id.push({id: i.id, type: i.getAttribute("_type"), connection: []})};

    for (i of all_out){out_id.push({id: i.id, type: i.getAttribute("_type"), connection: []})};

    type = th.getAttribute("block_type");
    data = null;

    switch(type) {
        case "event":
            data = {};
            break;
        case "variable":
            data = {varname: null};
            break;
        case "assignment_operation":
            data = {input: null};
            break;
        case "get":
            data = {varname: null};
            break;
        case "sum":
            data = {input_0: null, input_1: null};
            break;
        case "branch":
            data = {};
            break;
        case "cout":
            data = {};
            break;
        case "const":
            data = {value: null};
            break;
    }

    blocks.push({
        id: th.id,
        type: type,
        ExecOut: [],
        input: in_id,
        output: out_id,
        data: data
    })
}

function go_to(id){

}

//Здесь всё начинается
function event(th){
    movable = th.closest(".movable");
    if (!movable) return;
    
    blocks.find(itm => itm.id == movable.id)

    go_to(id);
}
//Задаём переменную и её тип
function variable(th){
    
}
//Задаём значение переменной
function set(th){
    
}
//Вывод
function cout(th){
    
}
//Получить данные переменной
function get(th){
    
}