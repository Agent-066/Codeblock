      var safe_zone = document.querySelector(".safe-zone");
      var id_list = [];
      var cur_i = 0;
      var id_cur = [cur_i];

      //Позже доработаю id кнопок
      var but_in_id = 0;
      var but_out_id = 0;
      var blk_input_id = 0;

      function to_sz(t){
        let c_t = t.cloneNode(true);
        c_t.classList.remove("movable");
        c_t.classList.add("movable");
        c_t.removeAttribute("onclick");
        safe_zone.append(c_t);

        let out_t = c_t.querySelectorAll(".out");
        if (out_t.length > 0) {
          for (let i of out_t) {
            i.setAttribute("data-id", "out_" + but_out_id);
            i.setAttribute("id", "out_" + but_out_id);
            // Используем onlick вместо setAttribute
            i.onclick = function(e) {
              e.stopPropagation();
              pin_out(this);
            };
            but_out_id += 1;
          }
        }

        let selects = c_t.querySelectorAll("select");
        selects.forEach(select => {
          select.onclick = function(e) {
            e.stopPropagation();
          };
          select.onmousedown = function(e) {
            e.stopPropagation();
          };

          select.addEventListener("change", function(){
            type = this.value;
            block = this.closest(".movable");
            block_info = blocks.find(itm => itm.id == block.id);

            block_info.data.select = type;
            variables.find(itm => itm.id_block == block.id).type = type;
            block_info.output[0].type = type;
            out = block.querySelector(".out");
            out.setAttribute("_type", type)
          })
        });

        let in_t = c_t.querySelectorAll(".in")
        in_t.forEach(itm => {
            if (itm.getAttribute("_type") == "") itm.setAttribute("flag_ch", true);
            itm.setAttribute("onclick", "pin_in(this)");
            itm.setAttribute("id", "in_" + but_in_id);
            but_in_id += 1;
        }); 
        
        let b_t = c_t.querySelector(".delete-button_x")
        b_t.className = "delete-button";
        b_t.setAttribute("onclick", "delete_block(this)");

        c_t.id = id_cur[0];

        if (cur_i == id_cur[0]) {
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

        if (c_t.getAttribute("block_type") == "variable"){variables.push({id_block: c_t.id, name: null, type: "Boolean", value: null})}

        let inputs = c_t.querySelectorAll("input");
        inputs.forEach(input => {
          input.onclick = function(e) {
            e.stopPropagation();
          };
          input.onmousedown = function(e) {
            e.stopPropagation();
          };

          input.setAttribute("id", "input_" + blk_input_id);
          blk_input_id += 1;

          input.addEventListener("input", function(e){
            i_block = blocks.find(itm => itm.id == e.target.closest(".movable").id)

            if (i_block.data.input !== undefined){
              i_block.data.input = e.target.value;
            }
            if (i_block.data.varname !== undefined){
              i_block.data.varname = e.target.value;
              if (i_block.type == "variable") {
              variable = variables.find(itm => itm.id_block == i_block.id)
                if (variable){
                  variable.name = i_block.data.varname;
                  update_datalist();
                }
              }
            }
            if (i_block.type == "get"){
              let block = document.getElementById(i_block.id)
              
              let flag = false;
              variables.forEach(itm => {
                if (itm.name == e.target.value) {
                  flag = true;
                  block.querySelector(".out").setAttribute("_type", itm.type)
                  i_block.output[0].type = itm.type;
                  return;
                }
              });
            }
          });
        });
      }