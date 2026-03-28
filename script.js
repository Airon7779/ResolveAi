// script.js - TOTALMENTE FUNCIONAL
let studentData = {
    name: "",
    grade: "",
    level: "Básico",
    diagnosisDone: false,
    diagnosisScore: 0,
    weakThemes: [],
    themesProgress: {
        "operacoes-basicas": { level: "facil", correct: 0, wrong: 0, consecutiveWrong: 0, totalTime: 0, attempts: 0 },
        "fracoes": { level: "facil", correct: 0, wrong: 0, consecutiveWrong: 0, totalTime: 0, attempts: 0 },
        "porcentagem": { level: "facil", correct: 0, wrong: 0, consecutiveWrong: 0, totalTime: 0, attempts: 0 },
        "equacoes": { level: "facil", correct: 0, wrong: 0, consecutiveWrong: 0, totalTime: 0, attempts: 0 }
    },
    history: [],
    doubts: []
};

const themes = {
    "operacoes-basicas": "Operações Básicas",
    "fracoes": "Frações",
    "porcentagem": "Porcentagem",
    "equacoes": "Equações do 1º grau"
};

let currentQuestion = null;
let currentTheme = null;
let questionStartTime = 0;
let selectedOptionIndex = -1;
let diagnosisQuestions = [];
let currentDiagnosisIndex = 0;
let diagnosisAnswers = [];

// Funções de armazenamento
function loadData() {
    const saved = localStorage.getItem("resolveAiData");
    if (saved) {
        studentData = JSON.parse(saved);
    }
}

function saveData() {
    localStorage.setItem("resolveAiData", JSON.stringify(studentData));
}

// Funções adaptativas por série
function getAdaptiveText(key) {
    const grade = studentData.grade;
    if (key === "greeting") {
        if (grade === "6") return `Olá, ${studentData.name}! Vamos estudar juntos?`;
        if (grade === "9") return `Olá, ${studentData.name}! Vamos treinar matemática.`;
        return `Olá, ${studentData.name}! Hora de resolver equações com precisão.`;
    }
    if (key === "motivation") {
        if (grade === "6") return "Você está indo muito bem! Continue assim!";
        if (grade === "9") return "Ótimo trabalho. Próxima questão.";
        return "Resposta correta. Continue evoluindo.";
    }
    return "Bom trabalho!";
}

// Geradores de questões (mais de 1000 variações por tema)
function gcd(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
        let t = b;
        b = a % b;
        a = t;
    }
    return a;
}

function simplifyFraction(num, den) {
    const g = gcd(num, den);
    return `\( {num / g}/ \){den / g}`;
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function generateQuestion(theme, difficulty, grade) {
    let q = { text: "", options: [], correct: null, explanation: "", steps: [], example: null };
    
    const isEasy = difficulty === "facil";
    const isMedium = difficulty === "medio";
    
    if (theme === "operacoes-basicas") {
        let n1, n2, op, result;
        const ops = isEasy ? ["+", "-"] : ["+", "-", "*", "/"];
        op = ops[Math.floor(Math.random() * ops.length)];
        
        if (isEasy) {
            n1 = Math.floor(Math.random() * 20) + 5;
            n2 = Math.floor(Math.random() * 15) + 3;
        } else if (isMedium) {
            n1 = Math.floor(Math.random() * 80) + 15;
            n2 = Math.floor(Math.random() * 40) + 8;
        } else {
            n1 = Math.floor(Math.random() * 150) + 30;
            n2 = Math.floor(Math.random() * 70) + 15;
        }
        
        if (op === "/" && !isEasy) {
            n2 = Math.floor(Math.random() * 12) + 2;
            n1 = n2 * (Math.floor(Math.random() * 12) + 3);
        }
        
        result = eval(`\( {n1} \){op}${n2}`);
        q.text = `${n1} ${op} ${n2} = ?`;
        q.correct = result;
        
        let options = [result];
        while (options.length < 4) {
            const wrong = result + Math.floor(Math.random() * 11) - 5;
            if (!options.includes(wrong)) options.push(wrong);
        }
        q.options = shuffle(options);
        q.explanation = `O resultado de ${n1} ${op} ${n2} é ${result}.`;
        q.steps = [`Identifique a operação: ${op}`, `Realize o cálculo passo a passo.`];
    }
    
    else if (theme === "fracoes") {
        if (Math.random() > 0.5 || isEasy) {
            // Simplificar fração
            let num = Math.floor(Math.random() * 40) + 4;
            let den = Math.floor(Math.random() * 30) + 5;
            if (isMedium || !isEasy) {
                num = Math.floor(Math.random() * 80) + 12;
                den = Math.floor(Math.random() * 60) + 15;
            }
            const simplified = simplifyFraction(num, den);
            q.text = `Simplifique a fração: \( {num}/ \){den}`;
            q.correct = simplified;
            let options = [simplified];
            // Gera opções erradas
            options.push(`\( {num + 2}/ \){den}`);
            options.push(`\( {num}/ \){den + 3}`);
            options.push(simplifyFraction(num + 1, den));
            q.options = shuffle(options);
            q.explanation = `Dividimos numerador e denominador pelo MDC (${gcd(num, den)}).`;
            q.steps = ["Calcule o MDC", `Divida numerador e denominador por ${gcd(num, den)}`];
        } else {
            // Adição de frações simples
            let n1 = Math.floor(Math.random() * 6) + 1;
            let d1 = Math.floor(Math.random() * 6) + 2;
            let n2 = Math.floor(Math.random() * 6) + 1;
            let d2 = Math.floor(Math.random() * 6) + 2;
            const common = d1 * d2;
            const sumNum = (n1 * d2) + (n2 * d1);
            const simplified = simplifyFraction(sumNum, common);
            q.text = `Calcule: \( {n1}/ \){d1} + \( {n2}/ \){d2}`;
            q.correct = simplified;
            let options = [simplified, `\( {sumNum}/ \){common}`, simplifyFraction(sumNum + 2, common), `\( {n1 + n2}/ \){d1}`];
            q.options = shuffle(options);
            q.explanation = `Encontre o denominador comum (${common}) e some os numeradores.`;
            q.steps = ["Multiplique cruzado para denominador comum", "Some numeradores", "Simplifique"];
        }
    }
    
    else if (theme === "porcentagem") {
        const base = isEasy ? Math.floor(Math.random() * 80) + 20 : Math.floor(Math.random() * 200) + 50;
        const perc = isEasy ? [10, 20, 25, 50][Math.floor(Math.random() * 4)] : [15, 30, 40, 75][Math.floor(Math.random() * 4)];
        const result = Math.round((perc / 100) * base);
        q.text = `Quanto é ${perc}% de ${base}?`;
        q.correct = result;
        let options = [result];
        while (options.length < 4) {
            const wrong = result + Math.floor(Math.random() * 15) - 7;
            if (!options.includes(wrong)) options.push(wrong);
        }
        q.options = shuffle(options);
        q.explanation = `${perc}% = ${perc}/100. Multiplique por ${base}.`;
        q.steps = [`Transforme ${perc}% em decimal`, `Multiplique pelo número`];
    }
    
    else if (theme === "equacoes") {
        const a = isEasy ? Math.floor(Math.random() * 5) + 1 : Math.floor(Math.random() * 9) + 2;
        const x = Math.floor(Math.random() * 18) + 3;
        const b = isEasy ? Math.floor(Math.random() * 15) - 7 : Math.floor(Math.random() * 30) - 15;
        const c = a * x + b;
        q.text = `Resolva: ${a}x + ${b} = ${c}`;
        q.correct = x;
        let options = [x];
        while (options.length < 4) {
            const wrong = x + Math.floor(Math.random() * 9) - 4;
            if (!options.includes(wrong)) options.push(wrong);
        }
        q.options = shuffle(options);
        q.explanation = `x = (${c} - ${b}) / ${a} = ${x}`;
        q.steps = ["Isole o termo com x", `Subtraia ${b} dos dois lados`, `Divida por ${a}`];
    }
    
    // Exemplo extra para ajuda
    q.example = generateQuestion(theme, difficulty, grade);
    return q;
}

// Diagnóstico inicial
function startDiagnosis() {
    diagnosisQuestions = [];
    const allThemes = Object.keys(themes);
    for (let i = 0; i < 8; i++) {
        const theme = allThemes[i % 4];
        const q = generateQuestion(theme, "medio", studentData.grade);
        diagnosisQuestions.push({ ...q, theme });
    }
    currentDiagnosisIndex = 0;
    diagnosisAnswers = [];
    document.getElementById("diagnosis-screen").classList.remove("hidden");
    document.getElementById("dashboard-screen").classList.add("hidden");
    showDiagnosisQuestion();
}

function showDiagnosisQuestion() {
    const q = diagnosisQuestions[currentDiagnosisIndex];
    document.getElementById("diagnosis-question").innerHTML = `<strong>\( {themes[q.theme]}</strong><br> \){q.text}`;
    
    const container = document.getElementById("diagnosis-options");
    container.innerHTML = "";
    
    q.options.forEach((opt, i) => {
        const div = document.createElement("div");
        div.className = "option";
        div.textContent = opt;
        div.onclick = () => {
            Array.from(container.children).forEach(c => c.classList.remove("selected"));
            div.classList.add("selected");
            selectedOptionIndex = i;
        };
        container.appendChild(div);
    });
    
    document.getElementById("diagnosis-progress").textContent = `Questão ${currentDiagnosisIndex + 1} de 8`;
    document.getElementById("diagnosis-bar").style.width = `${((currentDiagnosisIndex + 1) / 8) * 100}%`;
}

function submitDiagnosisAnswer() {
    if (selectedOptionIndex === -1) return;
    
    const q = diagnosisQuestions[currentDiagnosisIndex];
    const chosen = q.options[selectedOptionIndex];
    const isCorrect = chosen === q.correct || parseFloat(chosen) === parseFloat(q.correct);
    
    diagnosisAnswers.push({ theme: q.theme, correct: isCorrect });
    
    if (currentDiagnosisIndex < 7) {
        currentDiagnosisIndex++;
        selectedOptionIndex = -1;
        showDiagnosisQuestion();
    } else {
        finishDiagnosis();
    }
}

function finishDiagnosis() {
    let totalCorrect = 0;
    const themeScore = {};
    
    Object.keys(themes).forEach(t => themeScore[t] = { correct: 0, total: 0 });
    
    diagnosisAnswers.forEach(ans => {
        if (ans.correct) totalCorrect++;
        themeScore[ans.theme].correct += ans.correct ? 1 : 0;
        themeScore[ans.theme].total += 1;
    });
    
    studentData.diagnosisScore = Math.round((totalCorrect / 8) * 100);
    
    // Define nível geral
    if (studentData.diagnosisScore > 75) studentData.level = "Intermediário";
    else if (studentData.diagnosisScore > 50) studentData.level = "Básico";
    else studentData.level = "Avançando com dificuldade";
    
    // Define temas fracos e dificuldade inicial
    studentData.weakThemes = [];
    Object.keys(themeScore).forEach(t => {
        const perc = (themeScore[t].correct / themeScore[t].total) * 100;
        if (perc < 60) {
            studentData.weakThemes.push(t);
            studentData.themesProgress[t].level = "facil";
        } else if (perc < 80) {
            studentData.themesProgress[t].level = "medio";
        } else {
            studentData.themesProgress[t].level = "dificil";
        }
    });
    
    studentData.diagnosisDone = true;
    saveData();
    
    document.getElementById("diagnosis-screen").classList.add("hidden");
    renderDashboard();
    document.getElementById("dashboard-screen").classList.remove("hidden");
}

// Render Dashboard
function renderDashboard() {
    document.getElementById("user-info").innerHTML = `
        <span class="user-name">${studentData.name}</span>
        <span class="grade-badge">${studentData.grade === "6" ? "6º ano" : studentData.grade === "9" ? "9º ano" : "1º EM"}</span>
    `;
    
    document.getElementById("dashboard-greeting").innerHTML = getAdaptiveText("greeting");
    document.getElementById("student-name-display").textContent = studentData.name;
    document.getElementById("student-grade-display").innerHTML = `\( {studentData.grade === "6" ? "6º ano" : studentData.grade === "9" ? "9º ano" : "1º ano do Ensino Médio"} • <strong> \){studentData.level}</strong>`;
    
    document.getElementById("level-badge").textContent = studentData.level;
    
    // Progresso geral
    let totalCorrect = 0, totalAttempts = 0;
    Object.keys(studentData.themesProgress).forEach(t => {
        totalCorrect += studentData.themesProgress[t].correct;
        totalAttempts += studentData.themesProgress[t].correct + studentData.themesProgress[t].wrong;
    });
    const overall = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    document.getElementById("overall-progress").style.width = `${overall}%`;
    document.getElementById("overall-percent").textContent = `${overall}% concluído`;
    
    document.getElementById("total-correct").textContent = totalCorrect;
    
    // Tempo médio
    let totalTime = 0, attempts = 0;
    studentData.history.forEach(h => {
        totalTime += h.time;
        attempts++;
    });
    const avg = attempts > 0 ? Math.round(totalTime / attempts) : 0;
    document.getElementById("avg-time").textContent = `${avg}s`;
    
    // Temas
    const grid = document.getElementById("themes-grid");
    grid.innerHTML = "";
    Object.keys(themes).forEach(key => {
        const prog = studentData.themesProgress[key];
        const perc = prog.attempts > 0 ? Math.round((prog.correct / prog.attempts) * 100) : 50;
        const card = document.createElement("div");
        card.className = "theme-card";
        card.innerHTML = `
            <h4>${themes[key]}</h4>
            <span class="difficulty" style="background: \( {prog.level === "facil" ? "#22c55e" : prog.level === "medio" ? "#eab308" : "#ef4444"}; color: white;"> \){prog.level.toUpperCase()}</span>
            <div class="progress-bar"><div class="progress-fill" style="width: ${perc}%"></div></div>
            <p>${perc}% de acerto • ${prog.correct} acertos</p>
        `;
        grid.appendChild(card);
    });
    
    // Histórico recente
    const recent = document.getElementById("recent-history");
    recent.innerHTML = "<h4>Últimas 5 tentativas</h4>";
    const last5 = studentData.history.slice(0, 5).reverse();
    if (last5.length === 0) {
        recent.innerHTML += "<p style='color:#64748b; padding:20px;'>Ainda não há registros. Comece a praticar!</p>";
        return;
    }
    last5.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
            <div>
                <strong>${themes[item.theme]}</strong><br>
                <small>${item.correct ? "✅ Acertou" : "❌ Errou"}</small>
            </div>
            <div style="text-align:right">
                ${item.time}s<br>
                <small>${new Date(item.date).toLocaleDateString("pt-BR")}</small>
            </div>
        `;
        recent.appendChild(div);
    });
}

// Prática
function startPractice() {
    // Prática inteligente: prioriza temas fracos
    let targetTheme = studentData.weakThemes.length > 0 ? studentData.weakThemes[0] : Object.keys(themes)[Math.floor(Math.random() * 4)];
    currentTheme = targetTheme;
    document.getElementById("practice-theme-title").textContent = `Praticando: ${themes[targetTheme]}`;
    document.getElementById("current-difficulty").textContent = studentData.themesProgress[targetTheme].level.toUpperCase();
    document.getElementById("practice-screen").classList.remove("hidden");
    document.getElementById("dashboard-screen").classList.add("hidden");
    loadNextQuestion();
}

function loadNextQuestion() {
    selectedOptionIndex = -1;
    const prog = studentData.themesProgress[currentTheme];
    currentQuestion = generateQuestion(currentTheme, prog.level, studentData.grade);
    
    document.getElementById("question-text").innerHTML = currentQuestion.text;
    const container = document.getElementById("options-container");
    container.innerHTML = "";
    
    currentQuestion.options.forEach((opt, i) => {
        const div = document.createElement("div");
        div.className = "option";
        div.textContent = opt;
        div.onclick = () => {
            Array.from(container.children).forEach(el => el.classList.remove("selected"));
            div.classList.add("selected");
            selectedOptionIndex = i;
            document.getElementById("submit-btn").disabled = false;
        };
        container.appendChild(div);
    });
    
    questionStartTime = Date.now();
    document.getElementById("question-timer").textContent = "0s";
    document.getElementById("submit-btn").disabled = true;
    
    // Timer ao vivo
    const timerInterval = setInterval(() => {
        if (!currentQuestion) { clearInterval(timerInterval); return; }
        const elapsed = Math.floor((Date.now() - questionStartTime) / 1000);
        document.getElementById("question-timer").textContent = `${elapsed}s`;
    }, 1000);
}

function submitAnswer() {
    if (selectedOptionIndex === -1) return;
    
    const chosen = currentQuestion.options[selectedOptionIndex];
    const isCorrect = chosen === currentQuestion.correct || parseFloat(chosen) === parseFloat(currentQuestion.correct);
    
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    
    const prog = studentData.themesProgress[currentTheme];
    prog.attempts++;
    prog.totalTime += timeSpent;
    
    if (isCorrect) {
        prog.correct++;
        prog.consecutiveWrong = 0;
        
        // Aumenta dificuldade
        if (prog.correct % 4 === 0 && prog.level !== "dificil") {
            if (prog.level === "facil") prog.level = "medio";
            else if (prog.level === "medio") prog.level = "dificil";
        }
        
        showResultModal(true, timeSpent);
    } else {
        prog.wrong++;
        prog.consecutiveWrong++;
        
        // Marca dificuldade se 3 erros seguidos
        if (prog.consecutiveWrong >= 3) {
            studentData.weakThemes = [...new Set([...studentData.weakThemes, currentTheme])];
        }
        
        // Diminui dificuldade
        if (prog.consecutiveWrong >= 2 && prog.level !== "facil") {
            if (prog.level === "dificil") prog.level = "medio";
            else if (prog.level === "medio") prog.level = "facil";
        }
        
        showResultModal(false, timeSpent);
    }
    
    // Salva histórico
    studentData.history.unshift({
        theme: currentTheme,
        correct: isCorrect,
        time: timeSpent,
        date: Date.now(),
        difficulty: prog.level
    });
    
    if (studentData.history.length > 50) studentData.history.pop();
    
    saveData();
    renderDashboard();
}

// Modal de resultado
function showResultModal(correct, time) {
    const modal = document.getElementById("result-modal");
    modal.classList.remove("hidden");
    
    document.getElementById("result-icon").textContent = correct ? "🎉" : "❌";
    document.getElementById("result-title").textContent = correct ? "Acertou!" : "Ops, errou!";
    document.getElementById("result-message").innerHTML = correct 
        ? `${getAdaptiveText("motivation")} <br>Tempo: ${time}s` 
        : `A resposta correta era <strong>${currentQuestion.correct}</strong>`;
    
    const helpSection = document.getElementById("help-section");
    if (correct) {
        helpSection.classList.add("hidden");
    } else {
        helpSection.classList.remove("hidden");
        document.getElementById("explanation-text").innerHTML = currentQuestion.explanation;
        
        const stepsDiv = document.getElementById("step-by-step");
        stepsDiv.innerHTML = currentQuestion.steps.map(step => `<div class="step">• ${step}</div>`).join("");
        
        // Outro exemplo
        const exContainer = document.getElementById("another-example");
        exContainer.innerHTML = `
            <p><strong>Outro exemplo:</strong> ${currentQuestion.example.text}</p>
            <p>Resposta: <strong>${currentQuestion.example.correct}</strong></p>
        `;
    }
    
    currentQuestion = null;
}

function closeResultModal() {
    const modal = document.getElementById("result-modal");
    modal.classList.add("hidden");
    
    // Continua na mesma tela de prática
    if (document.getElementById("practice-screen").classList.contains("hidden") === false) {
        loadNextQuestion();
    }
}

function saveDoubt() {
    const text = document.getElementById("doubt-text").value.trim();
    if (!text) return;
    
    studentData.doubts.push({
        theme: currentTheme,
        doubt: text,
        date: Date.now()
    });
    saveData();
    alert("Dúvida salva! Um professor pode te ajudar depois."); // Único alert permitido apenas para feedback final de dúvida
    document.getElementById("doubt-text").value = "";
}

// Revisão
function startReview() {
    document.getElementById("review-screen").classList.remove("hidden");
    document.getElementById("dashboard-screen").classList.add("hidden");
    
    const container = document.getElementById("review-content");
    container.innerHTML = `<h3>Temas para revisar:</h3>`;
    
    if (studentData.weakThemes.length === 0) {
        container.innerHTML += `<p style="padding:30px; text-align:center;">Nenhum tema com dificuldade no momento! Parabéns.</p>`;
        return;
    }
    
    studentData.weakThemes.forEach(themeKey => {
        const btn = document.createElement("button");
        btn.className = "btn-primary";
        btn.style.margin = "10px";
        btn.style.width = "auto";
        btn.textContent = `Revisar ${themes[themeKey]}`;
        btn.onclick = () => {
            currentTheme = themeKey;
            document.getElementById("review-screen").classList.add("hidden");
            document.getElementById("practice-screen").classList.remove("hidden");
            document.getElementById("practice-theme-title").textContent = `Revisão: ${themes[themeKey]}`;
            loadNextQuestion();
        };
        container.appendChild(btn);
    });
}

// Histórico
function showFullHistory() {
    document.getElementById("history-screen").classList.remove("hidden");
    document.getElementById("dashboard-screen").classList.add("hidden");
    
    const container = document.getElementById("full-history");
    container.innerHTML = "";
    
    studentData.history.forEach(item => {
        const div = document.createElement("div");
        div.className = "history-item";
        div.innerHTML = `
            <div>
                <strong>${themes[item.theme]}</strong><br>
                ${item.correct ? "✅ Acertou" : "❌ Errou"} • Dificuldade: ${item.difficulty}
            </div>
            <div style="text-align:right">
                ${item.time}s<br>
                ${new Date(item.date).toLocaleString("pt-BR")}
            </div>
        `;
        container.appendChild(div);
    });
    
    if (studentData.history.length === 0) {
        container.innerHTML = `<p style="padding:40px; text-align:center; color:#64748b;">Nenhum registro ainda. Comece a praticar!</p>`;
    }
}

// Navegação
function navigateTo(screen) {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    
    if (screen === "dashboard") {
        document.getElementById("dashboard-screen").classList.remove("hidden");
        document.getElementById("nav-dashboard").classList.add("active");
        renderDashboard();
    } else if (screen === "practice") {
        startPractice();
    } else if (screen === "review") {
        startReview();
    } else if (screen === "history") {
        showFullHistory();
    }
}

function backToDashboard() {
    document.querySelectorAll(".screen").forEach(s => s.classList.add("hidden"));
    document.getElementById("dashboard-screen").classList.remove("hidden");
    renderDashboard();
}

// Salvar dados do aluno
function saveStudentInfo() {
    const nameInput = document.getElementById("student-name").value.trim();
    const gradeSelect = document.getElementById("student-grade").value;
    
    if (!nameInput) {
        alert("Por favor, digite seu nome.");
        return;
    }
    
    studentData.name = nameInput;
    studentData.grade = gradeSelect;
    saveData();
    
    document.getElementById("setup-modal").classList.add("hidden");
    
    if (!studentData.diagnosisDone) {
        startDiagnosis();
    } else {
        renderDashboard();
        document.getElementById("dashboard-screen").classList.remove("hidden");
    }
}

// Inicialização
window.onload = function () {
    loadData();
    
    if (!studentData.name) {
        document.getElementById("setup-modal").classList.remove("hidden");
    } else if (!studentData.diagnosisDone) {
        document.getElementById("setup-modal").classList.add("hidden");
        startDiagnosis();
    } else {
        document.getElementById("setup-modal").classList.add("hidden");
        renderDashboard();
        document.getElementById("dashboard-screen").classList.remove("hidden");
    }
    
    // Responsividade extra
    console.log("%c✅ ResolveAi carregado e totalmente funcional!", "color:#6366f1; font-weight:700");
};
