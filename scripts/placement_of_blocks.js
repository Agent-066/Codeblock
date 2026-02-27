      var safe_zone = document.querySelector(".safe-zone");
      var id_list = [];
      var cur_i = 0;
      var id_cur = [cur_i];

      //Позже доработаю id кнопок
      var but_in_id = 0;
      var but_out_id = 0;

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
        });

        let inputs = c_t.querySelectorAll("input");
        inputs.forEach(input => {
          input.onclick = function(e) {
            e.stopPropagation();
          };
          input.onmousedown = function(e) {
            e.stopPropagation();
          };
        });

        let in_t = c_t.querySelectorAll(".in")
        if (in_t){
          for (i of in_t){
            i.setAttribute("onclick", "pin_in(this)");
            i.setAttribute("id", "in_" + but_in_id);
            but_in_id += 1;
          }
        }
        
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
      }