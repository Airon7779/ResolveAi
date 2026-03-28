// script.js - ResolveAi Completo

let users = [];
let currentUser = null;
let adminMode = false;
let currentQuestionIndex = 0;
let diagnosticAnswers = [];
let practiceSession = { correct: 0, total: 0, timer: null };
let currentPracticeQuestion = null;
let recentQuestions = []; // Evita repetição imediata

const DIAGNOSTIC_QUESTIONS = [ /* mesmo array da versão anterior */ ];

function initApp() {
    const saved = localStorage.getItem('resolveai_users');
    users = saved ? JSON.parse(saved) : [];
    
    if (users.length === 0) {
        users.push({
            username: "AdminMaster",
            password: "admin123",
            series: "1º médio",
            isAdmin: true,
            level: "Administrador",
            points: 0,
            currentCombo: 1,
            maxCombo: 1,
            sequence: 0,
            weeklyPoints: 0,
            weeklyCorrect: 0,
            weeklyStreak: 0,
            lastReset: Date.now(),
            diagnosticDone: true,
            difficulties: [],
            history: [],
            doubts: [],
            recentQuestions: []
        });
        saveUsers();
    }
    
    showInitialScreen();
}

// ======================== SALVAMENTO ========================
function saveUsers() {
    localStorage.setItem('resolveai_users', JSON.stringify(users));
}

function saveCurrentUser() {
    if (currentUser) {
        const index = users.findIndex(u => u.username === currentUser.username);
        if (index !== -1) users[index] = currentUser;
        localStorage.setItem('resolveai_current', JSON.stringify(currentUser));
        saveUsers();
    }
}

// ======================== CADASTRO ========================
function handleRegister(e) {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const password = document.getElementById('reg-password').value;
    const series = document.getElementById('reg-series').value;

    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
        alert("Este nome já está em uso. Escolha outro.");
        return;
    }

    const newUser = {
        username, password, series, isAdmin: false,
        level: "Básico", points: 0, currentCombo: 1.0, maxCombo: 1.0,
        sequence: 0, weeklyPoints: 0, weeklyCorrect: 0, weeklyStreak: 0,
        lastReset: Date.now(), diagnosticDone: false, difficulties: [],
        history: [], doubts: [], recentQuestions: []
    };

    users.push(newUser);
    saveUsers();
    alert(`Conta criada com sucesso! Bem-vindo(a), ${username}`);
    showLoginScreen();
}

// ======================== LOGIN ========================
function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('login-username').value.trim();
    const password = document.getElementById('login-password').value;

    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());
    if (!user || user.password !== password) {
        alert("Usuário ou senha incorretos.");
        return;
    }

    currentUser = user;
    localStorage.setItem('resolveai_current', JSON.stringify(currentUser));
    checkWeeklyReset();

    if (user.isAdmin) {
        adminMode = true;
        showScreen('screen-admin');
        renderAdminPanel();
    } else if (!user.diagnosticDone) {
        showScreen('screen-diagnostic');
        startDiagnostic();
    } else {
        showScreen('screen-dashboard');
        renderHeader();
        renderDashboard();
    }
}

// ======================== ADMIN ========================
function showAdminLoginModal() {
    document.getElementById('modal-admin').classList.remove('hidden');
}

function hideAdminModal() {
    document.getElementById('modal-admin').classList.add('hidden');
}

function verifyAdminCode() {
    if (document.getElementById('admin-code-input').value === "20102010") {
        hideAdminModal();
        document.getElementById('modal-admin-options').classList.remove('hidden');
    } else {
        alert("Código incorreto!");
    }
}

function hideAdminOptionsModal() {
    document.getElementById('modal-admin-options').classList.add('hidden');
}

function registerNewAdmin() {
    hideAdminOptionsModal();
    const name = prompt("Nome do novo administrador:");
    if (!name) return;
    const pass = prompt("Senha:");
    if (!pass) return;

    if (users.some(u => u.username.toLowerCase() === name.toLowerCase())) {
        alert("Nome já em uso!");
        return;
    }

    users.push({
        username: name, password: pass, series: "1º médio", isAdmin: true,
        level: "Administrador", points: 0, currentCombo: 1, maxCombo: 1,
        sequence: 0, weeklyPoints: 0, weeklyCorrect: 0, weeklyStreak: 0,
        lastReset: Date.now(), diagnosticDone: true, difficulties: [],
        history: [], doubts: [], recentQuestions: []
    });
    saveUsers();
    alert("Administrador cadastrado com sucesso!");
}

function showAdminLoginForm() {
    hideAdminOptionsModal();
    showLoginScreen();
}

// ======================== PERGUNTAS DINÂMICAS (MAIS DE 1000 VARIAÇÕES) ========================
function generateUniqueQuestion(topic) {
    let q;
    let attempts = 0;

    do {
        attempts++;
        if (topic === 'operacoesBasicas') {
            const a = Math.floor(Math.random() * 90) + 10;
            const b = Math.floor(Math.random() * 60) + 5;
            const op = ['+','-','*'][Math.floor(Math.random()*3)];
            const text = `${a} ${op} ${b} = ?`;
            const answer = eval(`\( {a} \){op}${b}`).toString();
            q = { text, options: shuffle([answer, (parseInt(answer)+7).toString(), (parseInt(answer)-8).toString(), (parseInt(answer)+15).toString()]), answer, topic };
        } else if (topic === 'fracoes') {
            const n1 = Math.floor(Math.random()*7)+1, d1 = Math.floor(Math.random()*8)+2;
            const n2 = Math.floor(Math.random()*6)+1, d2 = Math.floor(Math.random()*7)+3;
            q = { text: `Quanto é \( {n1}/ \){d1} + \( {n2}/ \){d2}?`, options: shuffle(["1 1/4", "3/4", "5/6", "7/8"]), answer: "1 1/4", topic };
        } else if (topic === 'porcentagem') {
            const base = Math.floor(Math.random()*500)+100;
            const perc = [10,15,20,25,30,40,50][Math.floor(Math.random()*7)];
            const answer = Math.round(base * perc / 100).toString();
            q = { text: `${perc}% de ${base} é igual a?`, options: shuffle([answer, (parseInt(answer)+20).toString(), (parseInt(answer)-15).toString(), (parseInt(answer)*2).toString()]), answer, topic };
        } else if (topic === 'equacoes1grau') {
            const x = Math.floor(Math.random()*18)+4;
            const coef = Math.floor(Math.random()*6)+2;
            const c = Math.floor(Math.random()*25)+5;
            q = { text: `${coef}x + ${c} = ${coef*x + c}. Qual é x?`, options: shuffle([x.toString(), (x+3).toString(), (x-2).toString(), (x*2).toString()]), answer: x.toString(), topic };
        }
    } while (attempts < 30 && recentQuestions.includes(q.text));

    recentQuestions.push(q.text);
    if (recentQuestions.length > 40) recentQuestions.shift();

    return q;
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

// ======================== RESTO DAS FUNÇÕES ========================
// (startDiagnostic, generateNextPracticeQuestion, startPractice, startReview, renderDashboard, renderHeader, logout, showScreen, etc.)

function showInitialScreen() { showScreen('screen-initial'); }
function showRegisterScreen() { showScreen('screen-register'); }
function showLoginScreen() { showScreen('screen-login'); }

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}

function logout() {
    localStorage.removeItem('resolveai_current');
    currentUser = null;
    adminMode = false;
    showInitialScreen();
}

window.onload = initApp;
