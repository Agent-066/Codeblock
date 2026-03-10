// Функция сбора всех данных проекта
function collectProjectData() {
    console.log("Собираю данные для сохранения...");
    
    // === ВАЖНО: Обновляем позиции блоков перед сохранением ===
    const blockElements = document.querySelectorAll('.safe-zone .movable');
    
    // Для каждого блока в DOM обновляем его style в массиве blocks
    blockElements.forEach(el => {
        const blockIndex = blocks.findIndex(b => b.id == el.id);
        if (blockIndex !== -1) {
            // Сохраняем позицию в блок
            blocks[blockIndex].style = {
                left: el.style.left,
                top: el.style.top
            };
        }
    });
    
    // Сохраняем данные переменных
    const variablesData = variables.map(v => ({
        id_block: v.id_block,
        name: v.name,
        type: v.type,
        value: v.value
    }));
    
    // Сохраняем все ID счетчики
    const nextIds = {
        cur_i: cur_i,
        id_cur: id_cur,
        but_in_id: but_in_id,
        but_out_id: but_out_id,
        blk_input_id: blk_input_id
    };
    
    // Создаем полный объект проекта
    const projectData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        blocks: blocks,        // blocks уже содержит обновленные style
        variables: variablesData,
        nextIds: nextIds
    };
    
    console.log("Данные собраны:", projectData);
    return projectData;
}

// Функция сохранения в файл
function saveProject() {
    try {
        // === СНАЧАЛА СОБИРАЕМ ДАННЫЕ ===
        const projectData = collectProjectData();
        
        // Сохраняем в localStorage как бэкап
        localStorage.setItem('blueprint_autosave', JSON.stringify(projectData));
        
        // === ТЕПЕРЬ СОХРАНЯЕМ В ФАЙЛ ===
        const jsonString = JSON.stringify(projectData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `blueprint_${new Date().toISOString().slice(0,19).replace(/:/g, '-')}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        // Показываем сообщение
        if (typeof printToConsole === 'function') {
            printToConsole('✅ Проект успешно сохранен!');
        } else {
            console.log('✅ Проект успешно сохранен!');
        }
        
    } catch (e) {
        console.error('Ошибка сохранения:', e);
        if (typeof show_ERR === 'function') {
            show_ERR('Ошибка при сохранении: ' + e.message);
        }
    }
}

// Функция загрузки из файла
function loadProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const projectData = JSON.parse(event.target.result);
                console.log("Загружаю проект:", projectData);
                
                // Очищаем текущий проект
                clearProject();
                
                // Восстанавливаем ID счетчики
                if (projectData.nextIds) {
                    cur_i = projectData.nextIds.cur_i || 0;
                    id_cur = projectData.nextIds.id_cur || [cur_i];
                    but_in_id = projectData.nextIds.but_in_id || 0;
                    but_out_id = projectData.nextIds.but_out_id || 0;
                    blk_input_id = projectData.nextIds.blk_input_id || 0;
                }
                
                // Восстанавливаем переменные
                if (projectData.variables) {
                    projectData.variables.forEach(v => {
                        variables.push({
                            id_block: v.id_block,
                            name: v.name,
                            type: v.type,
                            value: v.value
                        });
                    });
                }
                
                // Восстанавливаем блоки
                if (projectData.blocks) {
                    restoreBlocks(projectData.blocks);
                }
                
                // Обновляем datalist
                if (typeof update_datalist === 'function') {
                    update_datalist();
                }
                
                if (typeof printToConsole === 'function') {
                    printToConsole('✅ Проект успешно загружен!');
                }
                console.log('Проект загружен');
                
            } catch (e) {
                console.error('Ошибка загрузки:', e);
                if (typeof show_ERR === 'function') {
                    show_ERR('Ошибка при загрузке: ' + e.message);
                }
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

// Очистка текущего проекта
function clearProject() {
    // Удаляем все блоки из DOM
    document.querySelectorAll('.safe-zone .movable').forEach(el => el.remove());
    
    // Удаляем все линии из SVG
    document.querySelectorAll('.safe-zone svg path').forEach(el => el.remove());
    
    // Очищаем массивы
    blocks.length = 0;
    variables.length = 0;
    
    // Очищаем ошибки и консоль
    if (typeof clear_ERR === 'function') clear_ERR();
    if (typeof clearOutputConsole === 'function') clearOutputConsole();
}

// Восстановление блоков
function restoreBlocks(blocksData) {
    console.log("Восстанавливаю блоки:", blocksData);
    
    const safe = document.querySelector('.safe-zone');
    if (!safe) return;
    
    blocksData.forEach(blockData => {
        // Ищем шаблон в боковой панели
        const template = document.querySelector(`.side-panel .block[block_type="${blockData.type}"]`);
        if (!template) {
            console.warn(`Шаблон для типа ${blockData.type} не найден`);
            return;
        }
        
        // Клонируем шаблон
        const clone = template.cloneNode(true);
        clone.id = blockData.id;
        clone.classList.add('movable');
        
        // Восстанавливаем позицию из style
        if (blockData.style) {
            clone.style.left = blockData.style.left || '100px';
            clone.style.top = blockData.style.top || '100px';
        } else {
            clone.style.left = '100px';
            clone.style.top = '100px';
        }
        
        // Восстанавливаем пины (входы)
        const inPins = clone.querySelectorAll('.in');
        blockData.input.forEach((inpData, index) => {
            if (inPins[index]) {
                const pin = inPins[index];
                pin.id = inpData.id;
                pin.setAttribute('_type', inpData.type || '');
                
                // Устанавливаем flag_ch если тип пустой
                if (!inpData.type) {
                    pin.setAttribute('flag_ch', 'true');
                } else {
                    pin.removeAttribute('flag_ch');
                }
            }
        });
        
        // Восстанавливаем пины (выходы)
        const outPins = clone.querySelectorAll('.out');
        blockData.output.forEach((outData, index) => {
            if (outPins[index]) {
                outPins[index].id = outData.id;
                outPins[index].setAttribute('_type', outData.type || '');
            }
        });
        
        // Восстанавливаем select для variable блока
        if (blockData.type === 'variable' && blockData.data) {
            const select = clone.querySelector('select');
            if (select && blockData.data.select) {
                select.value = blockData.data.select;
            }
            
            const nameInput = clone.querySelector('input[name="Var"]');
            if (nameInput && blockData.data.varname) {
                nameInput.value = blockData.data.varname;
            }
        }
        
        // Восстанавливаем const блок
        if (blockData.type === 'const' && blockData.data) {
            const select = clone.querySelector('.const-type-select');
            if (select && blockData.data.type) {
                select.value = blockData.data.type;
            }
            
            const container = clone.querySelector('.const-input-container');
            if (container) {
                const input = container.querySelector('input');
                if (input && blockData.data.value !== null) {
                    input.value = blockData.data.value;
                }
            }
        }
        
        // Восстанавливаем input поля для математических блоков
        if (Array.isArray(blockData.data)) {
            const inputs = clone.querySelectorAll('.column:nth-child(2) input');
            inputs.forEach((input, idx) => {
                if (blockData.data[idx] !== undefined) {
                    input.value = blockData.data[idx];
                }
                // Генерируем новый ID для input
                input.id = 'input_' + (blk_input_id++);
            });
        }
        
        // Восстанавливаем set/get блоки
        if ((blockData.type === 'set' || blockData.type === 'get') && blockData.data) {
            const input = clone.querySelector('input');
            if (input && blockData.data.varname) {
                input.value = blockData.data.varname;
            }
        }
        
        // Генерируем ID для всех input полей
        clone.querySelectorAll('input').forEach(input => {
            if (!input.id || !input.id.startsWith('input_')) {
                input.id = 'input_' + (blk_input_id++);
            }
        });
        
        // Добавляем в DOM
        safe.appendChild(clone);
        
        // Настраиваем обработчики
        setupBlockHandlers(clone);
        
        // Добавляем в массив blocks
        blocks.push({
            id: blockData.id,
            type: blockData.type,
            Exec: blockData.Exec || [],
            input: blockData.input.map(inp => ({
                id: inp.id,
                type: inp.type,
                connection: inp.connection.map(conn => ({
                    from: conn.from,
                    to: conn.to,
                    from_block: conn.from_block,
                    to_block: conn.to_block,
                    route: conn.route || []
                }))
            })),
            output: blockData.output.map(out => ({
                id: out.id,
                type: out.type,
                connection: out.connection.map(conn => ({
                    from: conn.from,
                    to: conn.to,
                    from_block: conn.from_block,
                    to_block: conn.to_block,
                    route: conn.route || []
                }))
            })),
            data: blockData.data,
            style: blockData.style // Сохраняем style для будущих сохранений
        });
    });
    
    // Восстанавливаем соединения
    setTimeout(() => {
        drawConnections();
    }, 100);
}

// Функция для отрисовки всех соединений
function drawConnections() {
    console.log("Отрисовываю соединения...");
    
    // Получаем SVG элемент
    const svg = document.querySelector('.safe-zone svg');
    if (!svg) return;
    
    // Удаляем все существующие path
    document.querySelectorAll('.safe-zone svg path[conn_block]').forEach(p => p.remove());
    
    // Перебираем все блоки и их выходы
    blocks.forEach(block => {
        block.output.forEach(out => {
            out.connection.forEach(conn => {
                const fromEl = document.getElementById(conn.from);
                const toEl = document.getElementById(conn.to);
                
                if (fromEl && toEl) {
                    const svgRect = svg.getBoundingClientRect();
                    const outRect = fromEl.getBoundingClientRect();
                    const inRect = toEl.getBoundingClientRect();
                    
                    const x1 = outRect.left + outRect.width/2 - svgRect.left;
                    const y1 = outRect.top + outRect.height/2 - svgRect.top;
                    const x2 = inRect.left + inRect.width/2 - svgRect.left;
                    const y2 = inRect.top + inRect.height/2 - svgRect.top;
                    
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    const routePoints = conn.route || [];
                    
                    // Создаем путь
                    let d;
                    if (routePoints.length === 0) {
                        const dx = Math.abs(x2 - x1) * 0.5;
                        d = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;
                    } else {
                        d = `M ${x1} ${y1}`;
                        const points = [{x: x1, y: y1}, ...routePoints, {x: x2, y: y2}];
                        
                        for (let i = 0; i < points.length - 1; i++) {
                            const p1 = points[i];
                            const p2 = points[i + 1];
                            const dx = Math.abs(p2.x - p1.x) * 0.4;
                            d += ` C ${p1.x + dx} ${p1.y}, ${p2.x - dx} ${p2.y}, ${p2.x} ${p2.y}`;
                        }
                    }
                    
                    path.setAttribute("d", d);
                    path.setAttribute("stroke-width", 2);
                    path.setAttribute("stroke", "white");
                    path.setAttribute("fill", "none");
                    path.setAttribute("conn_block", block.id + " " + conn.to_block);
                    path.setAttribute("conn_but", conn.from + " " + conn.to);
                    
                    if (routePoints.length > 0) {
                        path.setAttribute("data-route", JSON.stringify(routePoints));
                    }
                    
                    svg.appendChild(path);
                }
            });
        });
    });
    
    console.log("Соединения отрисованы");
}

// Настройка обработчиков блока
function setupBlockHandlers(el) {
    // Удаление
    const deleteBtn = el.querySelector('.delete-button, .delete-button_x');
    if (deleteBtn && typeof delete_block === 'function') {
        deleteBtn.onclick = function(e) { 
            e.stopPropagation();
            delete_block(this); 
        };
    }
    
    // Выходные пины
    if (typeof pin_out === 'function') {
        el.querySelectorAll('.out').forEach(btn => {
            btn.onclick = function(e) {
                e.stopPropagation();
                pin_out(this);
            };
        });
    }
    
    // Входные пины
    if (typeof pin_in === 'function') {
        el.querySelectorAll('.in').forEach(btn => {
            btn.onclick = function(e) { 
                e.stopPropagation();
                pin_in(this); 
            };
        });
    }
    
    // Кнопка добавления
    const addBtn = el.querySelector('.add');
    if (addBtn && typeof add_inputs === 'function') {
        addBtn.onclick = function(e) {
            e.stopPropagation();
            add_inputs(el);
        };
    }
    
    // Input поля
    if (typeof funct_input === 'function') {
        el.querySelectorAll('input').forEach(input => {
            input.onclick = e => e.stopPropagation();
            input.onmousedown = e => e.stopPropagation();
            input.addEventListener('input', funct_input);
        });
    }
    
    // Select
    el.querySelectorAll('select').forEach(select => {
        select.onclick = e => e.stopPropagation();
        select.onmousedown = e => e.stopPropagation();
        select.addEventListener('change', function(e) {
            e.stopPropagation();
            // Триггерим событие change для обновления данных
            const event = new Event('input', { bubbles: true });
            this.dispatchEvent(event);
        });
    });
}

// Автосохранение
function enableAutosave(interval = 30000) {
    setInterval(() => {
        try {
            const projectData = collectProjectData();
            localStorage.setItem('blueprint_autosave', JSON.stringify(projectData));
            console.log('Автосохранение выполнено');
        } catch (e) {
            console.error('Ошибка автосохранения:', e);
        }
    }, interval);
}

// Загрузка из автосохранения
function loadAutosave() {
    const autosave = localStorage.getItem('blueprint_autosave');
    if (!autosave) {
        if (typeof show_ERR === 'function') {
            show_ERR('Нет автосохранения');
        }
        return;
    }
    
    try {
        const projectData = JSON.parse(autosave);
        
        if (confirm('Загрузить последнее автосохранение?')) {
            clearProject();
            
            // Восстанавливаем ID счетчики
            if (projectData.nextIds) {
                cur_i = projectData.nextIds.cur_i || 0;
                id_cur = projectData.nextIds.id_cur || [cur_i];
                but_in_id = projectData.nextIds.but_in_id || 0;
                but_out_id = projectData.nextIds.but_out_id || 0;
                blk_input_id = projectData.nextIds.blk_input_id || 0;
            }
            
            // Восстанавливаем переменные
            if (projectData.variables) {
                projectData.variables.forEach(v => {
                    variables.push({
                        id_block: v.id_block,
                        name: v.name,
                        type: v.type,
                        value: v.value
                    });
                });
            }
            
            // Восстанавливаем блоки
            if (projectData.blocks) {
                restoreBlocks(projectData.blocks);
            }
            
            if (typeof update_datalist === 'function') {
                update_datalist();
            }
            
            if (typeof printToConsole === 'function') {
                printToConsole('✅ Автосохранение загружено');
            }
        }
    } catch (e) {
        console.error('Ошибка загрузки автосохранения:', e);
        if (typeof show_ERR === 'function') {
            show_ERR('Ошибка загрузки автосохранения');
        }
    }
}

// Добавляем кнопки в интерфейс
function addSaveLoadButtons() {
    const card = document.querySelector('.card');
    if (!card) return;
    
    // Проверяем, не добавлены ли уже кнопки
    if (document.querySelector('#save-btn')) return;
    
    const saveBtn = document.createElement('button');
    saveBtn.id = 'save-btn';
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
    
    card.appendChild(saveBtn);
    card.appendChild(loadBtn);
    card.appendChild(autosaveBtn);
}

// Запускаем добавление кнопок после загрузки страницы
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        addSaveLoadButtons();
        enableAutosave(30000);
        
        // Проверяем наличие автосохранения при загрузке
        const autosave = localStorage.getItem('blueprint_autosave');
        if (autosave) {
            try {
                const data = JSON.parse(autosave);
                const timestamp = new Date(data.timestamp).toLocaleString();
                console.log(`📁 Есть автосохранение от ${timestamp}`);
            } catch (e) {
                console.log('Автосохранение повреждено');
            }
        }
    });
} else {
    addSaveLoadButtons();
    enableAutosave(30000);
}