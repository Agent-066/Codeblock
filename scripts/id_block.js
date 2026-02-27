
      var flag_1 = false;
      var flag_2 = false;
      
      var t_1 = null;
      var t_2 = null;

      function pin_out(t){
        flag_1 = true;
        flag_3 = true;
        t_1 = t;

        i_line = document.createElementNS("http://www.w3.org/2000/svg", "line");

        let svgRect = svg.getBoundingClientRect();
        let outRect = t_1.getBoundingClientRect();
        startX = outRect.left + outRect.width/2 - svgRect.left;
        startY = outRect.top + outRect.height/2 - svgRect.top;

        i_line.setAttribute("x1", startX);
        i_line.setAttribute("y1", startY);
        i_line.setAttribute("x2", startX);
        i_line.setAttribute("y2", startY);
        i_line.setAttribute("stroke-width", 2);
        i_line.setAttribute("stroke", "white");

        svg.append(i_line);

        circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("fill", "white");
        circle.setAttribute("cx", startX);
        circle.setAttribute("cy", startY);
        circle.setAttribute("r", 5);

        svg.append(circle);

        mouse_move = function(e){
          i_line.setAttribute("x2", e.clientX - svgRect.left);
          i_line.setAttribute("y2", e.clientY - svgRect.top);
          circle.setAttribute("cx", e.clientX - svgRect.left)
          circle.setAttribute("cy", e.clientY - svgRect.top)
        };

        mouse_up = function(e){
          let el = e.target.closest(".in");
          if (!el){
            flag_1 = false;
            flag_2 = false;
            console.log(true);
          }

          document.removeEventListener("mousemove", mouse_move);
          document.removeEventListener("mouseup", mouse_up);
          circle.remove();
          i_line.remove();
        }

        document.addEventListener("mousemove", mouse_move);
        document.addEventListener("mouseup", mouse_up);
      }

      function pin_in(t){
        flag_2 = true;

        t_2 = t;
        
        block_1 = blocks.find(itm => itm.id == t_1.closest(".movable").id);
        block_2 = blocks.find(itm => itm.id == t_2.closest(".movable").id);

        t_1_b = block_1.output.find(itm => itm.id == t_1.id);
        t_2_b = block_2.input.find(itm => itm.id == t_2.id);
        
        flag_conn = false;

        block_2.input.forEach(itm_0 => { 
          itm_0.connection.forEach(itm_1 => {
            if (itm_1.to == t_2.id) {
              flag_conn = true;
            }
          })
        });

        if (flag_conn && !flag_1) {
          delete_connection([t_2.id], false);

          svg.querySelector("line[conn_but~=" + t_2.id + "]").remove();
        }
        if (flag_1){
          if (t_2_b.type != t_1_b.type) return;

          if (flag_conn){
            delete_connection([t_2.id], false);
            
            svg.querySelector("line[conn_but~=" + t_2.id + "]").remove();
          }

          if (block_1.id == block_2.id) return;

          t_1_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id})
          t_2_b.connection.push({from: t_1.id, to: t_2.id, from_block: block_1.id, to_block: block_2.id})
          
          line = document.createElementNS("http://www.w3.org/2000/svg", "line");
          let svgRect = svg.getBoundingClientRect();
          let outRect = t_1.getBoundingClientRect();
          let inRect = t_2.getBoundingClientRect();

          line.setAttribute("x1", outRect.left + outRect.width/2 - svgRect.left);
          line.setAttribute("y1", outRect.top + outRect.height/2 - svgRect.top);
          line.setAttribute("x2", inRect.left + inRect.width/2 - svgRect.left);
          line.setAttribute("y2", inRect.top + inRect.height/2 - svgRect.top);
          line.setAttribute("stroke-width", 2);
          line.setAttribute("stroke", "white");
          line.setAttribute("conn_block", block_1.id + " " + block_2.id);
          line.setAttribute("conn_but", t_1.getAttribute("id") + " " + t_2.getAttribute("id"));

          svg.append(line);

          flag_1 = false;
        }
      }