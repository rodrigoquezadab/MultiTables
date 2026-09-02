tailwind.config = {
    darkMode: 'class',
    theme: {
        extend: {
            fontFamily: {
                display: ['"Fredoka One"', 'cursive'],
                body: ['Nunito', 'sans-serif'],
            },
            colors: {
                brand: {
                    50: '#f0f9ff',
                    100: '#e0f2fe',
                    500: '#0ea5e9',
                    600: '#0284c7',
                }
            }
        }
    }
}

// ==========================================
// CONFIGURACIÓN Y CONSTANTES DE DISEÑO (DARK MODE)
// ==========================================
const TABLE_COLORS = [
    { bg: 'bg-red-900/40', text: 'text-red-400', border: 'border-red-800/60', hex: '#f87171' },     // 1
    { bg: 'bg-orange-900/40', text: 'text-orange-400', border: 'border-orange-800/60', hex: '#fb923c' }, // 2
    { bg: 'bg-amber-900/40', text: 'text-amber-400', border: 'border-amber-800/60', hex: '#fbbf24' },   // 3
    { bg: 'bg-lime-900/40', text: 'text-lime-400', border: 'border-lime-800/60', hex: '#a3e635' },     // 4
    { bg: 'bg-green-900/40', text: 'text-green-400', border: 'border-green-800/60', hex: '#4ade80' },   // 5
    { bg: 'bg-emerald-900/40', text: 'text-emerald-400', border: 'border-emerald-800/60', hex: '#34d399' }, // 6
    { bg: 'bg-teal-900/40', text: 'text-teal-400', border: 'border-teal-800/60', hex: '#2dd4bf' },     // 7
    { bg: 'bg-cyan-900/40', text: 'text-cyan-400', border: 'border-cyan-800/60', hex: '#22d3ee' },     // 8
    { bg: 'bg-blue-900/40', text: 'text-blue-400', border: 'border-blue-800/60', hex: '#60a5fa' },     // 9
    { bg: 'bg-indigo-900/40', text: 'text-indigo-400', border: 'border-indigo-800/60', hex: '#818cf8' }, // 10
    { bg: 'bg-purple-900/40', text: 'text-purple-400', border: 'border-purple-800/60', hex: '#c084fc' }, // 11
    { bg: 'bg-pink-900/40', text: 'text-pink-400', border: 'border-pink-800/60', hex: '#f472b6' }      // 12
];

// ==========================================
// ESTADO DE LA APLICACIÓN
// ==========================================
let currentView = 'estudio';
let stats = {}; // Historial desde localStorage
let currentModalTable = null; // Tabla abierta en el modal de errores

// Estado temporal del quiz en curso
let quizState = {
    tables: [],
    length: 10,
    mode: 'input', // 'input' (Escribir respuesta) o 'options' (4 alternativas)
    pool: 'all',   // 'all' (Todas) o 'errors' (Solo fallos frecuentes)
    questions: [],
    currentIndex: 0,
    score: 0,
    errorsCount: 0,
    tableBreakdown: {},
    isActive: false,
    waiting: false,
    currentInputValue: '',
    startTime: null,
    endTime: null,
    timerInterval: null,
    questionStartTime: null,
    questionTimes: [],
    totalPoints: 0
};

// ==========================================
// INICIALIZACIÓN Y NAVEGACIÓN
// ==========================================
function init() {
    loadStats();
    renderEstudioMenu();
    renderQuizCheckboxes();
    navTo('estudio');
}

function navTo(view) {
    // Detener temporizador si salimos de la pantalla activa del quiz
    if (currentView === 'quiz-active' && view !== 'quiz-active') {
        stopTimer();
        quizState.isActive = false;
    }

    // Ocultar todas las secciones
    document.querySelectorAll('.view-section').forEach(el => {
        el.classList.add('hidden');
        el.classList.remove('fade-in');
    });
    
    // Mostrar la sección objetivo con animación
    const target = document.getElementById(`view-${view}`);
    if (target) {
        target.classList.remove('hidden');
        target.classList.add('fade-in');
    }

    // Actualizar estilos del menú superior
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.className = 'nav-btn px-4 py-2 rounded-xl font-bold text-sm sm:text-base transition-colors text-slate-300 hover:bg-slate-800 shadow-sm border border-transparent';
    });

    // Determinar qué botón del menú activar
    let activeNavId = '';
    if (view === 'estudio') activeNavId = 'nav-estudio';
    else if (view.startsWith('quiz')) activeNavId = 'nav-quiz';
    else if (view === 'estadisticas') activeNavId = 'nav-estadisticas';

    if (activeNavId) {
        const activeBtn = document.getElementById(activeNavId);
        activeBtn.className = 'nav-btn px-4 py-2 rounded-xl font-bold text-sm sm:text-base transition-colors bg-blue-900/40 text-blue-300 hover:bg-blue-800/50 shadow-sm border border-blue-800/50';
    }

    // Lógica específica al entrar a ciertas vistas
    if (view === 'estudio') {
        showEstudioMenu();
    } else if (view === 'estadisticas') {
        renderStats();
    } else if (view === 'quiz-config') {
        updateStartButton();
        updateErrorPoolInfo();
    }

    currentView = view;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==========================================
// GESTIÓN DE ALMACENAMIENTO (LocalStorage)
// ==========================================
function loadStats() {
    const saved = localStorage.getItem('multiplicar_stats');
    if (saved) {
        try {
            stats = JSON.parse(saved);
        } catch (e) {
            console.error("Error leyendo localStorage", e);
            stats = {};
        }
    } else {
        stats = {};
    }
}

function saveStats() {
    localStorage.setItem('multiplicar_stats', JSON.stringify(stats));
}

function updateStat(table, multiplier, isCorrect) {
    if (!stats[table]) stats[table] = {};
    if (!stats[table][multiplier]) stats[table][multiplier] = { aciertos: 0, errores: 0 };
    
    if (isCorrect) {
        stats[table][multiplier].aciertos++;
    } else {
        stats[table][multiplier].errores++;
    }
    saveStats();
}

function resetStats() {
    if (confirm("¿Estás seguro de que quieres borrar todo tu progreso histórico? Esta acción no se puede deshacer.")) {
        stats = {};
        saveStats();
        renderStats();
        updateErrorPoolInfo();
        updateStartButton();
    }
}

// ==========================================
// LÓGICA VISTA 1: ESTUDIO
// ==========================================
function renderEstudioMenu() {
    const grid = document.getElementById('tables-grid');
    grid.innerHTML = '';
    
    for (let i = 1; i <= 12; i++) {
        const color = TABLE_COLORS[i-1];
        const card = document.createElement('div');
        card.className = `bg-slate-800 ${color.text} border-2 ${color.border} rounded-2xl p-6 text-center cursor-pointer card-hover flex flex-col justify-center items-center h-32 sm:h-40 shadow-md relative overflow-hidden`;
        card.onclick = () => showTableDetail(i);
        
        // Fondo sutil decorativo
        const bgCircle = document.createElement('div');
        bgCircle.className = `absolute -bottom-4 -right-4 w-20 h-20 rounded-full ${color.bg} opacity-50`;
        card.appendChild(bgCircle);

        const content = document.createElement('div');
        content.className = 'relative z-10';
        content.innerHTML = `
            <div class="text-sm font-bold opacity-80 mb-1 uppercase tracking-wider text-slate-400">Tabla del</div>
            <div class="text-5xl sm:text-6xl font-display drop-shadow-sm">${i}</div>
        `;
        card.appendChild(content);
        
        grid.appendChild(card);
    }
}

function showTableDetail(num) {
    const menu = document.getElementById('estudio-menu');
    const detail = document.getElementById('estudio-detail');
    const container = document.getElementById('table-content-container');
    const color = TABLE_COLORS[num-1];

    // Set dynamic border color based on table
    container.className = `bg-slate-800 rounded-3xl shadow-xl p-6 sm:p-8 max-w-md mx-auto border-t-8 border-t-[${color.hex}] border-x border-b border-slate-700`;
    container.style.borderTopColor = color.hex;

    let html = `
        <div class="text-center mb-8 relative">
            <div class="absolute inset-0 flex items-center justify-center opacity-5 font-display text-9xl -z-10 -mt-8 text-white">${num}</div>
            <h3 class="text-5xl font-display ${color.text} drop-shadow-sm">Tabla del ${num}</h3>
        </div>
        <div class="space-y-2 text-xl sm:text-2xl font-bold text-slate-300">
    `;

    for (let i = 1; i <= 12; i++) {
        html += `
            <div class="flex justify-between items-center p-3 sm:p-4 hover:bg-slate-700/50 rounded-xl transition-colors border-b border-slate-700/50 last:border-0 group cursor-default">
                <span class="w-1/3 text-right text-slate-400 group-hover:text-white transition-colors">${num}</span>
                <span class="w-1/3 text-center text-slate-600">×</span>
                <span class="w-1/3 text-left text-slate-400 group-hover:text-white transition-colors">${i}</span>
                <span class="w-8 text-center text-slate-600">=</span>
                <span class="w-1/3 text-left ${color.text} font-display text-3xl drop-shadow-sm">${num * i}</span>
            </div>
        `;
    }
    html += `</div>`;

    container.innerHTML = html;
    menu.classList.add('hidden');
    detail.classList.remove('hidden');
    detail.classList.remove('fade-in');
    void detail.offsetWidth; // Forzar reflow para reiniciar animación
    detail.classList.add('fade-in');
}

function showEstudioMenu() {
    document.getElementById('estudio-detail').classList.add('hidden');
    const menu = document.getElementById('estudio-menu');
    menu.classList.remove('hidden');
    menu.classList.add('fade-in');
}

// ==========================================
// LÓGICA VISTA 2: CONFIGURACIÓN DEL QUIZ
// ==========================================
function renderQuizCheckboxes() {
    const container = document.getElementById('quiz-tables-checkboxes');
    container.innerHTML = '';
    
    for (let i = 1; i <= 12; i++) {
        if (i === 1 || i === 10) continue; // Evitar las tablas del 1 y del 10 en el quiz
        const color = TABLE_COLORS[i-1];
        const label = document.createElement('label');
        label.className = `flex flex-col items-center justify-center py-4 px-2 border-2 rounded-2xl cursor-pointer transition-all checkbox-label border-slate-700 bg-slate-800 hover:bg-slate-700 shadow-sm`;
        label.innerHTML = `
            <input type="checkbox" value="${i}" class="sr-only quiz-checkbox" onchange="updateStartButton()">
            <span class="text-3xl font-display ${color.text}">${i}</span>
        `;
        container.appendChild(label);
    }
}

// ==========================================
// GESTIÓN DEL BANCO DE FALLOS
// ==========================================
function getErrorsForTables(tables) {
    let list = [];
    if (!tables || tables.length === 0) return list;

    tables.forEach(t => {
        if (stats[t]) {
            for (let m in stats[t]) {
                const errs = stats[t][m].errores || 0;
                if (errs > 0) {
                    list.push({
                        a: t,
                        b: parseInt(m, 10),
                        errors: errs,
                        correct: stats[t][m].aciertos || 0
                    });
                }
            }
        }
    });

    // Ordenar de mayor a menor cantidad de errores
    list.sort((x, y) => y.errors - x.errors);
    return list;
}

function updateErrorPoolInfo() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox:checked');
    const selectedTables = Array.from(checkboxes).map(cb => parseInt(cb.value));
    const errors = getErrorsForTables(selectedTables);
    const counterBadge = document.getElementById('quiz-errors-counter-badge');
    const errorsDesc = document.getElementById('quiz-pool-errors-desc');

    if (counterBadge) {
        if (errors.length === 0) {
            counterBadge.className = 'text-xs bg-slate-700 text-slate-400 border border-slate-600 px-3 py-1 rounded-full font-bold';
            counterBadge.innerText = '0 fallos disponibles';
            if (errorsDesc) errorsDesc.innerText = 'Sin fallos registrados en las tablas seleccionadas. ¡Buen trabajo!';
        } else {
            counterBadge.className = 'text-xs bg-red-950/70 text-red-300 border border-red-700/60 px-3 py-1 rounded-full font-bold';
            counterBadge.innerText = `${errors.length} ${errors.length === 1 ? 'fallo disponible' : 'fallos disponibles'}`;
            if (errorsDesc) errorsDesc.innerText = `Juega exclusivamente con las ${errors.length} multiplicaciones en las que has fallado.`;
        }
    }

    return errors;
}

function handlePoolTypeChange() {
    updateStartButton();
}

function updateStartButton() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox');
    let selectedCount = 0;
    const selectedTables = [];
    
    checkboxes.forEach(cb => {
        const label = cb.closest('.checkbox-label');
        const num = parseInt(cb.value);
        const color = TABLE_COLORS[num-1];
        
        if (cb.checked) {
            selectedCount++;
            selectedTables.push(num);
            label.classList.remove('bg-slate-800', 'border-slate-700');
            // In dark mode we use the bg string and a border match
            label.className = `flex flex-col items-center justify-center py-4 px-2 border-2 rounded-2xl cursor-pointer transition-all checkbox-label ${color.bg} ${color.border} shadow-sm`;
            label.style.borderColor = color.hex;
            label.style.boxShadow = `0 0 0 2px #1e293b, 0 0 0 4px ${color.hex}`;
            label.style.transform = 'scale(1.05)';
        } else {
            label.className = `flex flex-col items-center justify-center py-4 px-2 border-2 rounded-2xl cursor-pointer transition-all checkbox-label border-slate-700 bg-slate-800 hover:bg-slate-700 shadow-sm`;
            label.style.borderColor = '';
            label.style.boxShadow = 'none';
            label.style.transform = 'scale(1)';
        }
    });

    const errors = updateErrorPoolInfo();
    const poolRadio = document.querySelector('input[name="quiz-pool"]:checked');
    const poolType = poolRadio ? poolRadio.value : 'all';
    const btn = document.getElementById('btn-start-quiz');

    if (selectedCount === 0) {
        btn.setAttribute('disabled', 'true');
        btn.innerText = '¡Empezar a Jugar!';
    } else if (poolType === 'errors') {
        if (errors.length === 0) {
            btn.setAttribute('disabled', 'true');
            btn.innerText = 'Sin fallos en estas tablas';
        } else {
            btn.removeAttribute('disabled');
            btn.innerText = `¡Repasar ${errors.length} ${errors.length === 1 ? 'Fallo' : 'Fallos'}!`;
        }
    } else {
        btn.removeAttribute('disabled');
        btn.innerText = '¡Empezar a Jugar!';
    }
}

function selectAllTables() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox');
    let allChecked = Array.from(checkboxes).every(cb => cb.checked);
    
    checkboxes.forEach(cb => {
        cb.checked = !allChecked;
    });
    updateStartButton();
}

function selectSmartTables() {
    let tableErrorRates = [];
    for (let i = 1; i <= 12; i++) {
        if (i === 1 || i === 10) continue; // Omitir 1 y 10 para la selección inteligente
        let totalQuestions = 0;
        let totalErrors = 0;
        
        if (stats[i]) {
            for (let m in stats[i]) {
                totalQuestions += stats[i][m].aciertos + stats[i][m].errores;
                totalErrors += stats[i][m].errores;
            }
        }
        
        const errorRate = totalQuestions > 0 ? (totalErrors / totalQuestions) : 0.5; 
        tableErrorRates.push({ table: i, rate: errorRate + (Math.random() * 0.01) });
    }

    tableErrorRates.sort((a, b) => b.rate - a.rate);
    const tablesToSelect = tableErrorRates.slice(0, 3).map(s => s.table);
    
    document.querySelectorAll('.quiz-checkbox').forEach(cb => {
        cb.checked = tablesToSelect.includes(parseInt(cb.value));
    });
    
    updateStartButton();
}


// ==========================================
// CONTROL DEL CRONÓMETRO
// ==========================================
function startTimer() {
    stopTimer();
    quizState.startTime = performance.now();
    quizState.questionStartTime = performance.now();
    updateTimerText(0);

    quizState.timerInterval = setInterval(() => {
        if (!quizState.isActive || !quizState.startTime) return;
        const elapsedSec = (performance.now() - quizState.startTime) / 1000;
        updateTimerText(elapsedSec);
    }, 100);
}

function stopTimer() {
    if (quizState.timerInterval) {
        clearInterval(quizState.timerInterval);
        quizState.timerInterval = null;
    }
}

function formatTime(seconds) {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

function updateTimerText(elapsedSec) {
    const el = document.getElementById('quiz-timer-text');
    if (el) el.innerText = formatTime(elapsedSec);
}

// ==========================================
// CONTROL DE ENTRADA DIRECTA (NUMPAD & TECLADO)
// ==========================================
function numpadPress(key) {
    if (!quizState.isActive || quizState.waiting || quizState.mode !== 'input') return;

    if (key === 'clear') {
        quizState.currentInputValue = '';
    } else if (key === 'backspace') {
        quizState.currentInputValue = quizState.currentInputValue.slice(0, -1);
    } else if (/^[0-9]$/.test(key)) {
        if (quizState.currentInputValue.length < 4) {
            quizState.currentInputValue += key;
        }
    }
    updateInputDisplay();
}

function updateInputDisplay() {
    const valEl = document.getElementById('quiz-input-value');
    if (valEl) {
        valEl.innerText = quizState.currentInputValue;
    }
}

function submitInputAnswer() {
    if (!quizState.isActive || quizState.waiting || quizState.mode !== 'input') return;

    if (quizState.currentInputValue.trim() === '') {
        const box = document.getElementById('quiz-input-display-box');
        box.classList.add('border-amber-400');
        setTimeout(() => box.classList.remove('border-amber-400'), 300);
        return;
    }

    const answerNum = parseInt(quizState.currentInputValue, 10);
    processAnswer(answerNum);
}

// ==========================================
// LÓGICA VISTA 2: EJECUCIÓN DEL QUIZ
// ==========================================
function startQuiz() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox:checked');
    quizState.tables = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const lengthRadio = document.querySelector('input[name="quiz-length"]:checked');
    quizState.length = parseInt(lengthRadio ? lengthRadio.value : 10);

    const modeRadio = document.querySelector('input[name="quiz-mode"]:checked');
    quizState.mode = modeRadio ? modeRadio.value : 'input';

    const poolRadio = document.querySelector('input[name="quiz-pool"]:checked');
    quizState.pool = poolRadio ? poolRadio.value : 'all';
    
    quizState.questions = generateQuestions(quizState.tables, quizState.length, quizState.pool === 'errors');

    if (quizState.questions.length === 0) {
        alert("No hay operaciones disponibles para la configuración seleccionada.");
        return;
    }

    quizState.currentIndex = 0;
    quizState.score = 0;
    quizState.errorsCount = 0;
    quizState.totalPoints = 0;
    quizState.questionTimes = [];
    quizState.currentInputValue = '';
    quizState.tableBreakdown = {};
    quizState.tables.forEach(t => quizState.tableBreakdown[t] = { q: 0, c: 0 });
    quizState.isActive = true;
    quizState.waiting = false;

    // Configurar visibilidad según el modo de juego
    const optionsContainer = document.getElementById('quiz-options');
    const inputContainer = document.getElementById('quiz-input-container');
    if (quizState.mode === 'input') {
        optionsContainer.classList.add('hidden');
        inputContainer.classList.remove('hidden');
    } else {
        optionsContainer.classList.remove('hidden');
        inputContainer.classList.add('hidden');
    }

    navTo('quiz-active');
    startTimer();
    renderQuestion();
}

function generateQuestions(tables, count, onlyErrors = false) {
    let questions = [];

    // MODO SOLO FALLOS FRECUENTES
    if (onlyErrors) {
        const errorList = getErrorsForTables(tables);
        if (errorList.length === 0) return [];

        for (let i = 0; i < count; i++) {
            // Ciclar las combinaciones con fallos (las de mayor error salen primero)
            const item = errorList[i % errorList.length];
            const correctResult = item.a * item.b;
            questions.push({
                a: item.a,
                b: item.b,
                options: generateOptions(correctResult)
            });
        }

        // Mezclar aleatoriamente las preguntas generadas para dinamismo
        for (let i = questions.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [questions[i], questions[j]] = [questions[j], questions[i]];
        }

        return questions;
    }

    // MODO NORMAL (Ponderado con probabilidad de repetición de fallos)
    let pool = [];
    tables.forEach(t => {
        if (t === 1 || t === 10) return; // Por seguridad, omitir tabla del 1 y del 10
        
        for (let multiplier = 1; multiplier <= 12; multiplier++) {
            if (multiplier === 1 || multiplier === 10) continue; // Omitir multiplicación por 1 y por 10
            
            let weight = 1; 
            if (stats[t] && stats[t][multiplier]) {
                const s = stats[t][multiplier];
                const total = s.aciertos + s.errores;
                if (total > 0) {
                    weight = 1 + (s.errores / (total + 1)) * 3; 
                }
            }
            pool.push({ a: t, b: multiplier, weight: weight });
        }
    });

    for (let i = 0; i < count; i++) {
        let totalWeight = pool.reduce((sum, item) => sum + item.weight, 0);
        if (totalWeight === 0) continue; // Evitar errores si el pool está vacío
        let random = Math.random() * totalWeight;
        let currentWeight = 0;
        let selectedQuestion = null;
        
        for (let j = 0; j < pool.length; j++) {
            currentWeight += pool[j].weight;
            if (random <= currentWeight) {
                selectedQuestion = pool[j];
                break;
            }
        }

        const correctResult = selectedQuestion.a * selectedQuestion.b;
        questions.push({ 
            a: selectedQuestion.a, 
            b: selectedQuestion.b, 
            options: generateOptions(correctResult) 
        });
    }

    return questions;
}


function generateOptions(correctAnswer) {
    let options = new Set([correctAnswer]);
    
    while(options.size < 4) {
        let variation = Math.floor(Math.random() * 11) - 5; 
        if (variation === 0) variation = 1; 
        
        let distractor = correctAnswer + variation;
        
        if (distractor < 1) distractor = correctAnswer + Math.abs(variation) + 1;
        
        if (Math.random() > 0.7 && correctAnswer > 12) {
             let base = Math.floor(Math.sqrt(correctAnswer));
             distractor = base * (base + (Math.random() > 0.5 ? 1 : -1));
             if(distractor < 1 || distractor === correctAnswer) distractor = correctAnswer + 2;
        }

        options.add(distractor);
    }

    let arr = Array.from(options);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

function renderQuestion() {
    if (quizState.currentIndex >= quizState.length) {
        finishQuiz();
        return;
    }

    const q = quizState.questions[quizState.currentIndex];
    const progress = ((quizState.currentIndex) / quizState.length) * 100;
    
    document.getElementById('quiz-progress-text').innerText = `Pregunta ${quizState.currentIndex + 1} de ${quizState.length}`;
    document.getElementById('quiz-progress-bar').style.width = `${progress}%`;
    
    const displayStr = Math.random() > 0.5 ? `${q.a} × ${q.b}` : `${q.b} × ${q.a}`;
    
    const questionEl = document.getElementById('quiz-question');
    questionEl.innerText = `${displayStr} = ?`;
    
    questionEl.classList.remove('fade-in');
    void questionEl.offsetWidth;
    questionEl.classList.add('fade-in');

    const feedback = document.getElementById('quiz-feedback');
    feedback.style.opacity = '0';

    // Configurar vista según modo
    if (quizState.mode === 'options') {
        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';
        
        q.options.forEach((opt) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option-btn p-5 sm:p-8 text-4xl sm:text-5xl font-display bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border-4 border-slate-700 hover:border-blue-500/50 transition-all btn-press shadow-md flex items-center justify-center';
            btn.innerText = opt;
            btn.onclick = () => handleAnswer(opt, btn);
            optionsContainer.appendChild(btn);
        });
    } else {
        // Modo Entrada Directa
        quizState.currentInputValue = '';
        updateInputDisplay();

        const box = document.getElementById('quiz-input-display-box');
        box.className = 'w-full max-w-xs bg-slate-900/90 border-2 border-blue-500/60 rounded-2xl py-3 px-6 text-center text-4xl sm:text-5xl font-display text-blue-300 flex items-center justify-center min-h-[72px] shadow-inner tracking-wider transition-colors';

        const submitBtn = document.getElementById('btn-submit-answer');
        if (submitBtn) submitBtn.removeAttribute('disabled');
    }

    quizState.questionStartTime = performance.now();
}

function handleAnswer(selectedAnswer, btnElement) {
    processAnswer(selectedAnswer, btnElement);
}

function processAnswer(selectedAnswer, btnElement = null) {
    if (quizState.waiting || !quizState.isActive) return; 
    quizState.waiting = true;

    const q = quizState.questions[quizState.currentIndex];
    const correctAnswer = q.a * q.b;
    const isCorrect = (selectedAnswer === correctAnswer);
    const feedback = document.getElementById('quiz-feedback');
    
    // Medir tiempo de esta pregunta
    const now = performance.now();
    const qTime = Math.max(0.1, (now - (quizState.questionStartTime || now)) / 1000);
    quizState.questionTimes.push(qTime);

    updateStat(q.a, q.b, isCorrect);
    quizState.tableBreakdown[q.a].q++;

    if (quizState.mode === 'options') {
        const allBtns = document.querySelectorAll('.quiz-option-btn');
        allBtns.forEach(b => {
            b.disabled = true;
            b.classList.remove('hover:bg-slate-700', 'hover:border-blue-500/50', 'btn-press');
            b.classList.add('cursor-default', 'opacity-60');
        });
    } else {
        const submitBtn = document.getElementById('btn-submit-answer');
        if (submitBtn) submitBtn.setAttribute('disabled', 'true');
    }

    if (isCorrect) {
        quizState.score++;
        quizState.tableBreakdown[q.a].c++;

        // Bono de velocidad: tiempo base objetivo de 5 segundos
        // Si se responde en menos de 5s, se gana bonificación proporcional (hasta 600 pts extra)
        const speedBonus = Math.round(Math.max(0, (5.0 - qTime) * 150));
        const earnedPoints = 1000 + speedBonus;
        quizState.totalPoints += earnedPoints;

        if (quizState.mode === 'options' && btnElement) {
            btnElement.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-200', 'opacity-60');
            btnElement.classList.add('bg-green-600', 'border-green-500', 'text-white', 'scale-105', 'shadow-lg', 'opacity-100');
        } else if (quizState.mode === 'input') {
            const box = document.getElementById('quiz-input-display-box');
            box.className = 'w-full max-w-xs bg-green-950/50 border-2 border-green-500 rounded-2xl py-3 px-6 text-center text-4xl sm:text-5xl font-display text-green-300 flex items-center justify-center min-h-[72px] shadow-lg tracking-wider transition-all scale-105';
        }
        
        feedback.innerHTML = `<span class="text-green-400 bg-green-900/30 border border-green-800/50 px-4 py-1.5 rounded-full text-lg sm:text-xl">✓ ¡Correcto! +${earnedPoints.toLocaleString()} pts (${qTime.toFixed(1)}s)</span>`;
        feedback.style.opacity = '1';
        
        setTimeout(() => {
            quizState.currentIndex++;
            quizState.waiting = false;
            renderQuestion();
        }, 750);

    } else {
        quizState.errorsCount++;
        // Penalización de puntuación
        quizState.totalPoints = Math.max(0, quizState.totalPoints - 250);

        if (quizState.mode === 'options') {
            if (btnElement) {
                btnElement.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-200', 'opacity-60');
                btnElement.classList.add('bg-red-600', 'border-red-500', 'text-white', 'scale-95', 'opacity-100');
            }
            const allBtns = document.querySelectorAll('.quiz-option-btn');
            allBtns.forEach(b => {
                if (parseInt(b.innerText) === correctAnswer) {
                    b.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-200', 'opacity-60');
                    b.classList.add('bg-green-600', 'border-green-500', 'text-white', 'scale-105', 'shadow-md', 'opacity-100');
                }
            });
        } else if (quizState.mode === 'input') {
            const box = document.getElementById('quiz-input-display-box');
            box.className = 'w-full max-w-xs bg-red-950/50 border-2 border-red-500 rounded-2xl py-3 px-6 text-center text-4xl sm:text-5xl font-display text-red-300 flex items-center justify-center min-h-[72px] shadow-lg tracking-wider transition-all scale-95';
        }

        feedback.innerHTML = `<span class="text-red-400 bg-red-900/30 border border-red-800/50 px-4 py-1.5 rounded-full text-lg sm:text-xl">✗ Era ${correctAnswer}</span>`;
        feedback.style.opacity = '1';

        setTimeout(() => {
            quizState.currentIndex++;
            quizState.waiting = false;
            renderQuestion();
        }, 1250);
    }
}

function finishQuiz() {
    quizState.isActive = false;
    stopTimer();
    quizState.endTime = performance.now();
    document.getElementById('quiz-progress-bar').style.width = `100%`;
    
    setTimeout(() => {
        navTo('quiz-results');
        renderResults();
    }, 400);
}

// ==========================================
// LÓGICA VISTA 2: RESULTADOS
// ==========================================
function renderResults() {
    const score = quizState.score;
    const total = quizState.length;
    const pct = Math.round((score / total) * 100);
    
    // Cálculo de tiempos
    const totalSec = Math.max(0.1, ((quizState.endTime || performance.now()) - quizState.startTime) / 1000);
    const avgSec = quizState.questionTimes.length > 0 
        ? (quizState.questionTimes.reduce((a, b) => a + b, 0) / quizState.questionTimes.length)
        : (totalSec / total);

    // Actualizar métricas
    document.getElementById('result-score').innerText = `${score} / ${total}`;
    document.getElementById('result-time').innerText = formatTime(totalSec);
    document.getElementById('result-avg-time').innerHTML = `${avgSec.toFixed(1)}s <span class="text-xs font-normal text-slate-400">/preg</span>`;
    document.getElementById('result-points').innerText = `${quizState.totalPoints.toLocaleString()} pts`;

    // Etiqueta del modo jugado
    const modeBadge = document.getElementById('result-mode-badge');
    if (modeBadge) {
        const modeText = quizState.mode === 'input' 
            ? 'Escribir Respuesta (Entrada Directa)' 
            : '4 Múltiples Opciones';
        const poolText = quizState.pool === 'errors'
            ? '🎯 Repaso de Fallos'
            : '📚 Banco Completo';
        modeBadge.innerText = `${poolText} • ${modeText}`;
    }

    // Comprobar y guardar récord personal
    const recordKey = `multiplicar_best_score_${quizState.mode}_${total}`;
    const previousBest = parseInt(localStorage.getItem(recordKey) || '0', 10);
    const highScoreBadge = document.getElementById('result-high-score-badge');

    if (quizState.totalPoints > previousBest && quizState.totalPoints > 0) {
        localStorage.setItem(recordKey, quizState.totalPoints.toString());
        if (highScoreBadge) highScoreBadge.classList.remove('hidden');
    } else {
        if (highScoreBadge) highScoreBadge.classList.add('hidden');
    }

    let icon = '🏆';
    let msg = '';
    
    if (pct === 100 && avgSec < 2.5) {
        icon = '⚡'; msg = '¡Velocidad Relámpago!';
    } else if (pct === 100) {
        icon = '🌟'; msg = '¡Puntaje Perfecto!';
    } else if (pct >= 80) {
        icon = '🎖️'; msg = '¡Excelente trabajo!';
    } else if (pct >= 50) {
        icon = '👍'; msg = '¡Buen desempeño!';
    } else {
        icon = '💪'; msg = '¡Sigue practicando!';
    }

    document.getElementById('result-icon').innerText = icon;
    document.getElementById('result-message').innerText = msg;

    const breakdownContainer = document.getElementById('result-breakdown');
    breakdownContainer.innerHTML = '';
    
    quizState.tables.forEach(t => {
        const data = quizState.tableBreakdown[t];
        if (data.q > 0) {
            const color = TABLE_COLORS[t-1];
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center py-3 border-b border-slate-700 last:border-0 bg-slate-800 px-4 rounded-xl shadow-sm mb-2';
            div.innerHTML = `
                <div class="flex items-center gap-3">
                    <span class="w-10 h-10 rounded-full ${color.bg} ${color.text} flex items-center justify-center font-display text-xl border border-slate-700">${t}</span>
                    <span class="font-bold text-slate-300">Tabla del ${t}</span>
                </div>
                <div class="font-bold text-lg bg-slate-900/50 px-3 py-1 rounded-lg border border-slate-700/50">
                    <span class="${data.c === data.q ? 'text-green-400' : 'text-slate-300'}">${data.c}</span> 
                    <span class="text-slate-600 font-normal mx-1">/</span> 
                    <span class="text-slate-400">${data.q}</span>
                </div>
            `;
            breakdownContainer.appendChild(div);
        }
    });
}

// ==========================================
// LÓGICA VISTA 3: ESTADÍSTICAS
// ==========================================
function renderStats() {
    const tbody = document.getElementById('stats-tbody');
    const emptyState = document.getElementById('stats-empty');
    tbody.innerHTML = '';
    
    let hasData = false;

    for (let i = 1; i <= 12; i++) {
        if (stats[i]) {
            let aciertos = 0; 
            let errores = 0;
            
            for (let m in stats[i]) {
                aciertos += stats[i][m].aciertos;
                errores += stats[i][m].errores;
            }
            
            const totalPreguntas = aciertos + errores;
            
            if (totalPreguntas > 0) {
                hasData = true;
                const pct = Math.round((aciertos / totalPreguntas) * 100);
                const color = TABLE_COLORS[i-1];
                
                let barColor = 'bg-red-500';
                if (pct >= 80) barColor = 'bg-green-500';
                else if (pct >= 50) barColor = 'bg-yellow-500';

                const tr = document.createElement('tr');
                tr.className = 'hover:bg-slate-700/30 transition-colors group';
                tr.innerHTML = `
                    <td class="p-5">
                        <div class="flex items-center gap-3">
                            <span class="inline-block w-10 h-10 rounded-full ${color.bg} ${color.text} border border-slate-700/50 flex items-center justify-center font-display text-xl shadow-sm group-hover:scale-110 transition-transform">${i}</span>
                            <span class="font-bold text-slate-300 hidden sm:inline">Tabla del ${i}</span>
                        </div>
                    </td>
                    <td class="p-5 text-center text-slate-400 font-bold text-lg">${totalPreguntas}</td>
                    <td class="p-5 text-center text-green-400 font-bold text-lg">${aciertos}</td>
                    <td class="p-5 text-center">
                        ${errores > 0 ? `
                            <button onclick="openErrorModal(${i})" class="px-3 py-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 border border-red-900/30 hover:border-red-600 rounded-xl font-bold text-lg transition-all btn-press inline-flex items-center gap-1 shadow-sm" title="Ver desglose de errores">
                                <span>${errores}</span>
                                <span class="text-xs opacity-75">🔍</span>
                            </button>
                        ` : `
                            <span class="text-slate-500 font-bold text-lg">0</span>
                        `}
                    </td>
                    <td class="p-5">
                        <div class="flex items-center gap-4">
                            <div class="w-full bg-slate-700 rounded-full h-3 shadow-inner overflow-hidden">
                                <div class="${barColor} h-3 rounded-full transition-all duration-1000" style="width: ${pct}%"></div>
                            </div>
                            <span class="font-bold text-slate-300 w-12 text-right">${pct}%</span>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            }
        }
    }

    if (!hasData) {
        tbody.parentElement.parentElement.classList.add('hidden');
        emptyState.classList.remove('hidden');
    } else {
        tbody.parentElement.parentElement.classList.remove('hidden');
        emptyState.classList.add('hidden');
    }
}

// ==========================================
// CONTROL DEL MODAL DE ERRORES
// ==========================================
function openErrorModal(tableNum) {
    currentModalTable = tableNum;
    const modal = document.getElementById('error-modal');
    const card = document.getElementById('error-modal-card');
    const title = document.getElementById('error-modal-title');
    const list = document.getElementById('error-modal-list');
    const practiceBtn = document.getElementById('btn-practice-modal-errors');
    
    title.innerText = `Errores registrados en la Tabla del ${tableNum}`;
    list.innerHTML = '';
    
    const tableStats = stats[tableNum];
    let errorsList = [];
    
    if (tableStats) {
        for (let m in tableStats) {
            const errs = tableStats[m].errores || 0;
            if (errs > 0) {
                errorsList.push({ multiplier: parseInt(m), count: errs });
            }
        }
    }
    
    errorsList.sort((a, b) => b.count - a.count);
    
    if (errorsList.length === 0) {
        if (practiceBtn) practiceBtn.classList.add('hidden');
        list.innerHTML = `
            <div class="text-center py-6 text-slate-500">
                <span class="text-4xl block mb-2">🎉</span>
                <p class="font-bold text-slate-300">¡No hay errores registrados!</p>
                <p class="text-sm mt-1">Sigue así, vas excelente en esta tabla.</p>
            </div>
        `;
    } else {
        if (practiceBtn) {
            practiceBtn.classList.remove('hidden');
            practiceBtn.innerHTML = `<span>🎯</span> Practicar ${errorsList.length} ${errorsList.length === 1 ? 'fallo' : 'fallos'}`;
        }
        errorsList.forEach(item => {
            const div = document.createElement('div');
            div.className = 'flex justify-between items-center py-3 bg-slate-900/40 px-4 rounded-xl border border-slate-700/50 shadow-sm';
            div.innerHTML = `
                <div class="font-bold text-lg text-slate-200">
                    <span>${tableNum}</span>
                    <span class="text-slate-500 mx-1">×</span>
                    <span>${item.multiplier}</span>
                    <span class="text-slate-500 mx-1">=</span>
                    <span class="text-blue-400 font-display">${tableNum * item.multiplier}</span>
                </div>
                <div class="bg-red-950/50 border border-red-900/50 text-red-400 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm">
                    <span>❌</span> ${item.count} ${item.count === 1 ? 'error' : 'errores'}
                </div>
            `;
            list.appendChild(div);
        });
    }
    
    modal.classList.remove('hidden');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    modal.classList.add('opacity-100');
    card.classList.remove('scale-95');
    card.classList.add('scale-100');
}

function closeErrorModal() {
    const modal = document.getElementById('error-modal');
    const card = document.getElementById('error-modal-card');
    
    modal.classList.remove('opacity-100');
    modal.classList.add('opacity-0');
    card.classList.remove('scale-100');
    card.classList.add('scale-95');
    
    setTimeout(() => {
        modal.classList.add('hidden');
    }, 300);
}

// ==========================================
// LANZADORES RÁPIDOS DE REPASO DE FALLOS
// ==========================================
function startReviewQuizGlobal() {
    const allTables = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const allErrors = getErrorsForTables(allTables);

    if (allErrors.length === 0) {
        alert("¡Excelente! No tienes ningún fallo registrado en tu historial. ¡Sigue practicando en el modo normal!");
        return;
    }

    // Identificar las tablas que tienen errores
    const tablesWithErrors = [...new Set(allErrors.map(e => e.a))];

    // Marcar esas tablas en los checkboxes
    document.querySelectorAll('.quiz-checkbox').forEach(cb => {
        cb.checked = tablesWithErrors.includes(parseInt(cb.value));
    });

    // Seleccionar radio 'errors'
    const errorsRadio = document.querySelector('input[name="quiz-pool"][value="errors"]');
    if (errorsRadio) errorsRadio.checked = true;

    // Actualizar estados e iniciar
    updateStartButton();
    startQuiz();
}

function startReviewQuizFromModal() {
    if (!currentModalTable) return;
    const tableErrors = getErrorsForTables([currentModalTable]);

    if (tableErrors.length === 0) {
        alert("Esta tabla no tiene errores registrados.");
        return;
    }

    closeErrorModal();

    // Marcar solo esta tabla en los checkboxes
    document.querySelectorAll('.quiz-checkbox').forEach(cb => {
        cb.checked = (parseInt(cb.value) === currentModalTable);
    });

    // Seleccionar radio 'errors'
    const errorsRadio = document.querySelector('input[name="quiz-pool"][value="errors"]');
    if (errorsRadio) errorsRadio.checked = true;

    updateStartButton();
    startQuiz();
}


// ==========================================
// CAPTURA DE TECLADO FÍSICO (DESKTOP & TABLET)
// ==========================================
window.addEventListener('keydown', (e) => {
    if (!quizState.isActive || quizState.mode !== 'input' || currentView !== 'quiz-active') return;

    if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        numpadPress(e.key);
    } else if (e.key === 'Backspace') {
        e.preventDefault();
        numpadPress('backspace');
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        numpadPress('clear');
    } else if (e.key === 'Enter') {
        e.preventDefault();
        submitInputAnswer();
    }
});

// ==========================================
// ARRANQUE
// ==========================================
window.addEventListener('DOMContentLoaded', init);
