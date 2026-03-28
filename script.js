"use strict";

const config = {
    gateCode: "20102010",
    storageKey: "resolveai_data"
};

const appData = {
    users: JSON.parse(localStorage.getItem(config.storageKey)) || [],
    currentUser: null,
    questions: [
        { id: 1, type: "basico", tema: "Operações", q: "Quanto é 125 + 377?", a: 502, options: [492, 502, 512, 482] },
        { id: 2, type: "basico", tema: "Frações", q: "Qual o dobro de 1/4?", a: "1/2", options: ["1/2", "1/8", "2/8", "1/4"] },
        { id: 3, type: "intermediario", tema: "Porcentagem", q: "Quanto é 15% de 200?", a: 30, options: [20, 30, 45, 15] },
        { id: 4, type: "avancado", tema: "Equação", q: "Se 2x + 4 = 12, qual o valor de x?", a: 4, options: [2, 4, 6, 8] },
        { id: 5, type: "intermediario", tema: "Operações", q: "Quanto é 15 x 6?", a: 90, options: [80, 75, 90, 95] }
    ]
};

// --- CORE CONTROLLER ---
const ctrl = {
    init() {
        const session = sessionStorage.getItem("resolveai_user");
        if (session) {
            const user = appData.users.find(u => u.name === session);
            if (user) {
                appData.currentUser = user;
                this.checkWeeklyReset();
                ui.renderApp();
            }
        }
    },

    save() {
        if (appData.currentUser && !appData.currentUser.isAdmin) {
            const index = appData.users.findIndex(u => u.name === appData.currentUser.name);
            appData.users[index] = { ...appData.currentUser };
        }
        localStorage.setItem(config.storageKey, JSON.stringify(appData.users));
    },

    handleAuth() {
        const name = document.getElementById('auth-user').value.trim();
        const pass = document.getElementById('auth-pass').value;
        const grade = document.getElementById('auth-grade').value;
        const isSignup = !document.getElementById('signup-only').classList.contains('hidden');

        if (!name || !pass) return ui.notify("Preencha os campos!");

        if (isSignup) {
            if (!grade) return ui.notify("Selecione a série!");
            if (appData.users.find(u => u.name === name)) return ui.notify("Usuário já existe!");

            const newUser = {
                name, pass, grade,
                points: 0, level: "Iniciante",
                completedDiag: false,
                mistakes: [], history: [],
                streak: 0, maxStreak: 0, multiplier: 1.0,
                weeklyPoints: 0, weeklyCorrect: 0, weeklyStreak: 0,
                lastReset: Date.now(),
                doubts: [], isAdmin: false
            };
            appData.users.push(newUser);
            appData.currentUser = newUser;
        } else {
            const user = appData.users.find(u => u.name === name && u.pass === pass);
            if (!user) return ui.notify("Credenciais inválidas!");
            appData.currentUser = user;
        }

        sessionStorage.setItem("resolveai_user", appData.currentUser.name);
        this.save();
        ui.renderApp();
    },

    checkWeeklyReset() {
        const now = Date.now();
        const week = 7 * 24 * 60 * 60 * 1000;
        if (now - appData.currentUser.lastReset > week) {
            appData.currentUser.weeklyPoints = 0;
            appData.currentUser.weeklyCorrect = 0;
            appData.currentUser.weeklyStreak = 0;
            appData.currentUser.lastReset = now;
            this.save();
        }
    },

    startPractice() {
        ui.showScreen('screen-practice');
        this.nextQuestion();
    },

    startReview() {
        const filter = appData.currentUser.mistakes;
        if (filter.length === 0) return ui.notify("Nada para revisar ainda! 😎");
        ui.showScreen('screen-practice');
        this.nextQuestion(true);
    },

    currentQ: null,
    consecutiveErrors: 0,

    nextQuestion(isReview = false) {
        document.getElementById('feedback-panel').classList.add('hidden');
        document.getElementById('help-area').classList.add('hidden');
        
        let pool = appData.questions;
        if (isReview) {
            pool = appData.questions.filter(q => appData.currentUser.mistakes.includes(q.tema));
        }

        this.currentQ = pool[Math.floor(Math.random() * pool.length)];
        ui.renderQuestion(this.currentQ);
    },

    handleAnswer(choice) {
        const correct = choice == this.currentQ.a;
        const user = appData.currentUser;

        if (correct) {
            const base = 10;
            const gain = Math.round(base * user.multiplier);
            user.points += gain;
            user.weeklyPoints += gain;
            user.weeklyCorrect++;
            user.streak++;
            user.multiplier = Math.min(2.0, user.multiplier + 0.05);
            if (user.streak > user.maxStreak) user.maxStreak = user.streak;
            
            this.consecutiveErrors = 0;
            ui.showFeedback(true, `Boa! +${gain} pontos. 😎`);
        } else {
            user.streak = 0;
            user.multiplier = 1.0;
            this.consecutiveErrors++;
            
            if (!user.mistakes.includes(this.currentQ.tema)) {
                user.mistakes.push(this.currentQ.tema);
            }

            if (this.consecutiveErrors >= 3) {
                ui.notify("Dificuldade detectada! Que tal revisar?");
            }
            ui.showFeedback(false, `Quase lá... essa foi difícil! 😅`);
        }
        
        user.history.push(`${correct ? '✅' : '❌'} ${this.currentQ.tema}`);
        if (user.history.length > 5) user.history.shift();
        this.save();
    },

    showRanking() {
        ui.showScreen('screen-ranking');
        const list = appData.users
            .filter(u => u.grade === appData.currentUser.grade && !u.isAdmin)
            .sort((a, b) => b.points - a.points);
        
        const myRank = list.findIndex(u => u.name === appData.currentUser.name) + 1;
        ui.renderRanking(list.slice(0, 10), myRank);
    },

    verifyGate() {
        const code = document.getElementById('gate-code').value;
        if (code === config.gateCode) {
            ui.closeModal();
            document.getElementById('signup-only').classList.add('hidden');
            ui.notify("Código aceito. Faça login ou cadastre o admin.");
            // Libera cadastro admin
            window.isGateOpen = true; 
        } else {
            ui.notify("Código incorreto!");
        }
    },

    deleteUser(name) {
        if (confirm(`Excluir ${name}?`)) {
            appData.users = appData.users.filter(u => u.name !== name);
            this.save();
            ui.renderAdmin();
        }
    },

    logout() {
        sessionStorage.clear();
        location.reload();
    }
};

// --- UI / VIEW ---
const ui = {
    showScreen(id) {
        document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
        document.getElementById(id).classList.remove('hidden');
    },

    switchAuth(mode) {
        document.getElementById('signup-only').classList.toggle('hidden', mode === 'login');
        document.getElementById('tab-login').classList.toggle('active', mode === 'login');
        document.getElementById('tab-signup').classList.toggle('active', mode === 'signup');
    },

    renderApp() {
        const user = appData.currentUser;
        if (user.isAdmin) return this.renderAdmin();
        if (!user.completedDiag) return this.renderDiag();
        
        this.showScreen('screen-dash');
        document.getElementById('nav-user-display').innerText = user.name;
        document.getElementById('dash-points').innerText = user.points;
        document.getElementById('dash-level').innerText = user.level;
        document.getElementById('dash-combo').innerText = user.multiplier.toFixed(2) + 'x';
        
        const adapt = { "6": "Vamos explicar passo a passo!", "9": "Direto ao ponto!", "1": "Aplicação técnica necessária." };
        document.getElementById('dash-welcome').innerText = `Olá, ${user.name}! 👋`;
        document.getElementById('dash-advice').innerText = adapt[user.grade] || "";
        
        const hist = document.getElementById('dash-history');
        hist.innerHTML = user.history.map(h => `<li>${h}</li>`).join('');
    },

    renderDiag() {
        this.showScreen('screen-diag');
        let step = 0;
        const next = () => {
            if (step >= appData.questions.length) {
                appData.currentUser.completedDiag = true;
                appData.currentUser.level = "Nível 1";
                ctrl.save();
                return this.renderApp();
            }
            const q = appData.questions[step];
            document.getElementById('diag-progress').style.width = `${(step / 5) * 100}%`;
            document.getElementById('diag-area').innerHTML = `
                <h4>${q.q}</h4>
                ${q.options.map(o => `<button class="option-btn" onclick="this.disabled=true; window.diagStep()">${o}</button>`).join('')}
            `;
            step++;
        };
        window.diagStep = next;
        next();
    },

    renderQuestion(q) {
        document.getElementById('practice-multiplier').innerText = appData.currentUser.multiplier.toFixed(2) + 'x';
        document.getElementById('question-card').innerHTML = `
            <small>${q.tema}</small>
            <h3>${q.q}</h3>
            <div class="options">
                ${q.options.map(o => `<button class="option-btn" onclick="ctrl.handleAnswer('${o}')">${o}</button>`).join('')}
            </div>
            <button class="btn-link" onclick="ui.showHelp()">💡 Não entendi</button>
        `;
    },

    showHelp() {
        const q = ctrl.currentQ;
        const area = document.getElementById('help-area');
        area.classList.remove('hidden');
        area.innerHTML = `
            <h5>Ajuda Rápida</h5>
            <p><strong>Conceito:</strong> ${q.tema} é fundamental para matemática.</p>
            <p><strong>Dica:</strong> Tente simplificar os números antes de calcular.</p>
            <hr>
            <p>Ainda com dúvida?</p>
            <input type="text" id="doubt-text" placeholder="Escreva sua dúvida...">
            <button class="btn-sm" onclick="ui.saveDoubt()">Enviar para Admin</button>
        `;
    },

    saveDoubt() {
        const txt = document.getElementById('doubt-text').value;
        if (txt) {
            appData.currentUser.doubts.push(txt);
            ctrl.save();
            this.notify("Dúvida salva!");
        }
    },

    showFeedback(isCorrect, msg) {
        const panel = document.getElementById('feedback-panel');
        const content = document.getElementById('feedback-content');
        panel.classList.remove('hidden');
        content.innerHTML = `<h3 style="color:${isCorrect ? 'var(--success)' : 'var(--error)'}">${msg}</h3>`;
    },

    renderRanking(list, myPos) {
        const container = document.getElementById('ranking-container');
        container.innerHTML = list.map((u, i) => `
            <div class="rank-item ${u.name === appData.currentUser.name ? 'rank-me' : ''}">
                ${i+1}º ${u.name} - ${u.points} pts
            </div>
        `).join('') + `<hr><p>Sua posição: ${myPos}º</p>`;
    },

    renderAdmin() {
        this.showScreen('screen-admin');
        const students = appData.users.filter(u => !u.isAdmin);
        document.getElementById('admin-stats').innerHTML = `
            Total Alunos: ${students.length} | Dificuldade Comum: ${students[0]?.mistakes[0] || 'Nenhuma'}
        `;
        const tbody = document.querySelector('#admin-table tbody');
        tbody.innerHTML = students.map(u => `
            <tr>
                <td>${u.name}</td>
                <td>${u.grade}º</td>
                <td>${u.points}</td>
                <td>
                    <button class="btn-sm" onclick="alert('Dúvidas: ${u.doubts.join(' | ')}')">Dúvidas</button>
                    <button class="btn-sm" style="color:red" onclick="ctrl.deleteUser('${u.name}')">Remover</button>
                </td>
            </tr>
        `).join('');
    },

    openAdminGate() { document.getElementById('modal-gate').classList.remove('hidden'); },
    closeModal() { document.getElementById('modal-gate').classList.add('hidden'); },
    notify(msg) { alert(msg); } // Simplificado para brevidade, mas poderia ser um toast
};

// Start
ctrl.init();