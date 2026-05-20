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

// Estado temporal del quiz en curso
let quizState = {
    tables: [],
    length: 10,
    questions: [],
    currentIndex: 0,
    score: 0,
    tableBreakdown: {},
    isActive: false,
    waiting: false
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

function updateStartButton() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox');
    let selectedCount = 0;
    
    checkboxes.forEach(cb => {
        const label = cb.closest('.checkbox-label');
        const num = parseInt(cb.value);
        const color = TABLE_COLORS[num-1];
        
        if (cb.checked) {
            selectedCount++;
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

    const btn = document.getElementById('btn-start-quiz');
    if (selectedCount > 0) {
        btn.removeAttribute('disabled');
    } else {
        btn.setAttribute('disabled', 'true');
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
// LÓGICA VISTA 2: EJECUCIÓN DEL QUIZ
// ==========================================
function startQuiz() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox:checked');
    quizState.tables = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    const lengthRadio = document.querySelector('input[name="quiz-length"]:checked');
    quizState.length = parseInt(lengthRadio.value);
    
    quizState.questions = generateQuestions(quizState.tables, quizState.length);
    quizState.currentIndex = 0;
    quizState.score = 0;
    quizState.tableBreakdown = {};
    quizState.tables.forEach(t => quizState.tableBreakdown[t] = { q: 0, c: 0 });
    quizState.isActive = true;
    quizState.waiting = false;

    navTo('quiz-active');
    renderQuestion();
}

function generateQuestions(tables, count) {
    let questions = [];
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

    const optionsContainer = document.getElementById('quiz-options');
    optionsContainer.innerHTML = '';
    
    q.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn p-5 sm:p-8 text-4xl sm:text-5xl font-display bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl border-4 border-slate-700 hover:border-blue-500/50 transition-all btn-press shadow-md flex items-center justify-center';
        btn.innerText = opt;
        btn.onclick = () => handleAnswer(opt, btn);
        optionsContainer.appendChild(btn);
    });

    const feedback = document.getElementById('quiz-feedback');
    feedback.style.opacity = '0';
}

function handleAnswer(selectedAnswer, btnElement) {
    if (quizState.waiting) return; 
    quizState.waiting = true;

    const q = quizState.questions[quizState.currentIndex];
    const correctAnswer = q.a * q.b;
    const isCorrect = (selectedAnswer === correctAnswer);
    const feedback = document.getElementById('quiz-feedback');
    
    updateStat(q.a, q.b, isCorrect);
    quizState.tableBreakdown[q.a].q++;

    const allBtns = document.querySelectorAll('.quiz-option-btn');
    allBtns.forEach(b => {
        b.disabled = true;
        b.classList.remove('hover:bg-slate-700', 'hover:border-blue-500/50', 'btn-press');
        b.classList.add('cursor-default', 'opacity-60');
    });

    if (isCorrect) {
        quizState.score++;
        quizState.tableBreakdown[q.a].c++;
        
        btnElement.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-200', 'opacity-60');
        btnElement.classList.add('bg-green-600', 'border-green-500', 'text-white', 'scale-105', 'shadow-lg', 'opacity-100');
        
        feedback.innerHTML = '<span class="text-green-400 bg-green-900/30 border border-green-800/50 px-4 py-2 rounded-full">✓ ¡Correcto!</span>';
        feedback.style.opacity = '1';
        
        setTimeout(() => {
            quizState.currentIndex++;
            quizState.waiting = false;
            renderQuestion();
        }, 800);

    } else {
        btnElement.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-200', 'opacity-60');
        btnElement.classList.add('bg-red-600', 'border-red-500', 'text-white', 'scale-95', 'opacity-100');
        
        allBtns.forEach(b => {
            if (parseInt(b.innerText) === correctAnswer) {
                b.classList.remove('bg-slate-800', 'border-slate-700', 'text-slate-200', 'opacity-60');
                b.classList.add('bg-green-600', 'border-green-500', 'text-white', 'scale-105', 'shadow-md', 'opacity-100');
            }
        });

        feedback.innerHTML = `<span class="text-red-400 bg-red-900/30 border border-red-800/50 px-4 py-2 rounded-full">✗ Era ${correctAnswer}</span>`;
        feedback.style.opacity = '1';

        setTimeout(() => {
            quizState.currentIndex++;
            quizState.waiting = false;
            renderQuestion();
        }, 1200);
    }
}

function finishQuiz() {
    quizState.isActive = false;
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
    
    document.getElementById('result-score').innerText = `${score} / ${total}`;
    
    let icon = '🏆';
    let msg = '';
    
    if (pct === 100) {
        icon = '🌟'; msg = '¡Perfecto!';
    } else if (pct >= 80) {
        icon = '🎖️'; msg = '¡Excelente!';
    } else if (pct >= 50) {
        icon = '👍'; msg = '¡Buen trabajo!';
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
                    <td class="p-5 text-center text-red-400 font-bold text-lg">${errores}</td>
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
// ARRANQUE
// ==========================================
window.addEventListener('DOMContentLoaded', init);
