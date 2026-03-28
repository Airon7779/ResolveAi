// script.js - ResolveAi - Código completo e funcional

let users = []
let currentUser = null
let adminMode = false
let currentQuestionIndex = 0
let diagnosticAnswers = []
let practiceSession = {
    correct: 0,
    total: 0,
    startTime: 0,
    currentTimer: null,
    consecutiveErrors: {}
}
let currentPracticeQuestion = null
let currentReviewQuestions = []
let rankingFilter = 'all'

// ======================== DADOS INICIAIS ========================
const DIAGNOSTIC_QUESTIONS = [
    { id: 1, text: "Quanto é 34 + 67?", options: ["91", "101", "81", "97"], answer: "101", topic: "operacoesBasicas" },
    { id: 2, text: "Qual o resultado de 85 - 39?", options: ["46", "44", "56", "36"], answer: "46", topic: "operacoesBasicas" },
    { id: 3, text: "1/3 + 1/6 é igual a:", options: ["1/2", "2/3", "1/4", "5/6"], answer: "1/2", topic: "fracoes" },
    { id: 4, text: "Simplifique 8/12:", options: ["2/3", "4/6", "3/4", "1/2"], answer: "2/3", topic: "fracoes" },
    { id: 5, text: "30% de 200 é:", options: ["60", "50", "70", "40"], answer: "60", topic: "porcentagem" },
    { id: 6, text: "Qual é 15% de 80?", options: ["12", "10", "18", "14"], answer: "12", topic: "porcentagem" },
    { id: 7, text: "x + 12 = 35. Qual o valor de x?", options: ["23", "47", "25", "13"], answer: "23", topic: "equacoes1grau" },
    { id: 8, text: "Resolva: 4x - 8 = 20", options: ["x = 7", "x = 5", "x = 9", "x = 3"], answer: "x = 7", topic: "equacoes1grau" }
]

// ======================== INICIALIZAÇÃO ========================
function initApp() {
    // Tailwind
    tailwind.config = {
        content: [],
        theme: {
            extend: {
                colors: {
                    primary: '#6366f1',
                    accent: '#a855f7'
                }
            }
        }
    }
    
    // Carregar dados do localStorage
    const savedUsers = localStorage.getItem('resolveai_users')
    if (savedUsers) {
        users = JSON.parse(savedUsers)
    } else {
        // Seed de usuários de demonstração
        users = [
            {
                username: "Lucas6",
                password: "123",
                series: "6º ano",
                isAdmin: false,
                level: "Intermediário",
                points: 1240,
                currentCombo: 1.85,
                maxCombo: 4.2,
                sequence: 8,
                weeklyPoints: 310,
                weeklyCorrect: 28,
                weeklyStreak: 4,
                lastReset: Date.now() - 86400000 * 3,
                diagnosticDone: true,
                difficulties: ["fracoes"],
                history: [
                    { date: "2026-03-27", topic: "equacoes1grau", correct: true, time: 42 },
                    { date: "2026-03-27", topic: "porcentagem", correct: false, time: 68 }
                ],
                doubts: []
            },
            {
                username: "Mariana9",
                password: "123",
                series: "9º ano",
                isAdmin: false,
                level: "Avançado",
                points: 2890,
                currentCombo: 2.1,
                maxCombo: 5.75,
                sequence: 14,
                weeklyPoints: 580,
                weeklyCorrect: 41,
                weeklyStreak: 7,
                lastReset: Date.now() - 86400000 * 1,
                diagnosticDone: true,
                difficulties: ["porcentagem"],
                history: [],
                doubts: [{ date: "2026-03-25", text: "Como calcular porcentagem composta?" }]
            },
            {
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
                doubts: []
            }
        ]
        saveUsers()
    }
    
    // Verificar se há usuário logado
    const savedCurrent = localStorage.getItem('resolveai_current')
    if (savedCurrent) {
        currentUser = JSON.parse(savedCurrent)
        checkWeeklyReset()
        if (currentUser.diagnosticDone) {
            showScreen('screen-dashboard')
            renderHeader()
        } else {
            showScreen('screen-diagnostic')
            startDiagnostic()
        }
    } else {
        showScreen('screen-login')
    }
    
    console.log('%c✅ ResolveAi carregado com sucesso!', 'color:#a855f7; font-size:13px; font-weight:bold')
}

// ======================== SALVAMENTO ========================
function saveUsers() {
    localStorage.setItem('resolveai_users', JSON.stringify(users))
}

function saveCurrentUser() {
    if (currentUser) {
        // Atualizar usuário no array
        const index = users.findIndex(u => u.username === currentUser.username)
        if (index !== -1) users[index] = currentUser
        localStorage.setItem('resolveai_current', JSON.stringify(currentUser))
        saveUsers()
    }
}

// ======================== LOGIN ========================
function handleLogin(e) {
    e.preventDefault()
    
    const username = document.getElementById('login-username').value.trim()
    const password = document.getElementById('login-password').value
    const series = document.getElementById('login-series').value
    
    // Buscar usuário
    let user = users.find(u => u.username.toLowerCase() === username.toLowerCase())
    
    if (user) {
        if (user.password !== password) {
            alert('Senha incorreta!')
            return
        }
    } else {
        // Criar novo usuário
        user = {
            username: username,
            password: password,
            series: series,
            isAdmin: false,
            level: "Básico",
            points: 0,
            currentCombo: 1.0,
            maxCombo: 1.0,
            sequence: 0,
            weeklyPoints: 0,
            weeklyCorrect: 0,
            weeklyStreak: 0,
            lastReset: Date.now(),
            diagnosticDone: false,
            difficulties: [],
            history: [],
            doubts: []
        }
        users.push(user)
        saveUsers()
    }
    
    currentUser = user
    localStorage.setItem('resolveai_current', JSON.stringify(currentUser))
    
    checkWeeklyReset()
    
    if (!currentUser.diagnosticDone) {
        showScreen('screen-diagnostic')
        startDiagnostic()
    } else {
        showScreen('screen-dashboard')
        renderHeader()
    }
    
    // Limpar formulário
    e.target.reset()
}

// ======================== ADMIN ========================
function showAdminLoginModal() {
    document.getElementById('modal-admin-code').classList.remove('hidden')
    document.getElementById('admin-code-input').focus()
}

function hideAdminCodeModal() {
    document.getElementById('modal-admin-code').classList.add('hidden')
}

function verifyAdminCode() {
    const code = document.getElementById('admin-code-input').value
    if (code === "20102010") {
        hideAdminCodeModal()
        adminMode = true
        currentUser = null
        renderHeader()
        showScreen('screen-admin')
        renderAdminPanel()
    } else {
        alert('Código inválido!')
    }
}

function showAdminScreen() {
    if (!adminMode) return
    showScreen('screen-admin')
    renderAdminPanel()
}

function exitAdmin() {
    adminMode = false
    renderHeader()
    showScreen('screen-login')
}

function addNewAdmin() {
    const name = prompt("Nome do novo administrador:")
    if (!name) return
    const pass = prompt("Senha do novo administrador:")
    if (!pass) return
    
    const newAdmin = {
        username: name,
        password: pass,
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
        doubts: []
    }
    users.push(newAdmin)
    saveUsers()
    renderAdminPanel()
    alert(`Administrador ${name} criado com sucesso!`)
}

function deleteUser(username) {
    if (confirm(`Remover o aluno ${username}?`)) {
        users = users.filter(u => u.username !== username)
        saveUsers()
        renderAdminPanel()
    }
}

function viewUserDetails(username) {
    const user = users.find(u => u.username === username)
    if (!user) return
    
    let html = `
        <div class="grid grid-cols-2 gap-6">
            <div><strong>Nome:</strong> ${user.username}</div>
            <div><strong>Série:</strong> ${user.series}</div>
            <div><strong>Nível:</strong> ${user.level}</div>
            <div><strong>Pontos:</strong> ${user.points}</div>
            <div><strong>Combo atual:</strong> ${user.currentCombo.toFixed(2)}x</div>
            <div><strong>Maior combo:</strong> ${user.maxCombo.toFixed(2)}x</div>
        </div>
        <div class="mt-8">
            <h4 class="font-semibold mb-3">Dúvidas enviadas</h4>
            \( {user.doubts.length ? `<ul class="space-y-3 text-sm"> \){user.doubts.map(d => `<li class="bg-[#25253f] p-4 rounded-2xl">📌 ${d.date} - ${d.text}</li>`).join('')}</ul>` : '<p class="text-gray-400">Nenhuma dúvida enviada.</p>'}
        </div>
        <div class="mt-8">
            <h4 class="font-semibold mb-3">Histórico recente</h4>
            \( {user.history.length ? `<ul class="space-y-2 text-sm"> \){user.history.slice(0, 5).map(h => `<li class="flex justify-between"><span>\( {h.topic}</span><span class=" \){h.correct ? 'text-emerald-400' : 'text-red-400'}">${h.correct ? '✅' : '❌'} ${h.time}s</span></li>`).join('')}</ul>` : '<p class="text-gray-400">Sem histórico.</p>'}
        </div>
    `
    document.getElementById('details-content').innerHTML = html
    document.getElementById('modal-user-details').classList.remove('hidden')
}

function hideUserDetailsModal() {
    document.getElementById('modal-user-details').classList.add('hidden')
}

function renderAdminPanel() {
    // Total alunos
    const totalStudents = users.filter(u => !u.isAdmin).length
    document.getElementById('admin-total-students').textContent = totalStudents
    
    // Dificuldades mais comuns
    let allDiff = []
    users.forEach(u => {
        if (u.difficulties) allDiff = allDiff.concat(u.difficulties)
    })
    const freq = {}
    allDiff.forEach(t => freq[t] = (freq[t] || 0) + 1)
    const topDiff = Object.keys(freq).sort((a, b) => freq[b] - freq[a]).slice(0, 4)
    document.getElementById('admin-main-difficulties').innerHTML = topDiff.map(t => `<span class="px-4 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-3xl">${t}</span>`).join('')
    
    // Dúvidas pendentes
    let totalDoubts = 0
    users.forEach(u => totalDoubts += u.doubts ? u.doubts.length : 0)
    document.getElementById('admin-pending-doubts').textContent = totalDoubts
    
    // Tabela
    let html = ''
    users.forEach(user => {
        if (user.isAdmin) return
        const diffText = user.difficulties && user.difficulties.length ? user.difficulties.join(', ') : '—'
        html += `
        <tr class="hover:bg-[#25253f]">
            <td class="px-8 py-5 font-medium">${user.username}</td>
            <td class="px-8 py-5">${user.series}</td>
            <td class="px-8 py-5">${user.level}</td>
            <td class="px-8 py-5 text-right font-bold">${user.points}</td>
            <td class="px-8 py-5 text-center text-xs">${diffText}</td>
            <td class="px-8 py-5">
                <div class="flex gap-3 justify-end">
                    <button onclick="viewUserDetails('${user.username}')" class="text-xs bg-blue-600 px-5 py-2 rounded-2xl">Detalhes</button>
                    <button onclick="viewDoubtsAdmin('${user.username}')" class="text-xs bg-purple-600 px-5 py-2 rounded-2xl">Dúvidas</button>
                    <button onclick="deleteUser('${user.username}')" class="text-xs bg-red-600 px-5 py-2 rounded-2xl">Remover</button>
                </div>
            </td>
        </tr>`
    })
    document.getElementById('admin-users-table').innerHTML = html || `<tr><td colspan="6" class="text-center py-12 text-gray-400">Nenhum aluno cadastrado ainda.</td></tr>`
}

function viewDoubtsAdmin(username) {
    const user = users.find(u => u.username === username)
    if (!user || !user.doubts.length) {
        alert('Nenhuma dúvida enviada por este aluno.')
        return
    }
    let str = user.doubts.map(d => `• ${d.date} → ${d.text}`).join('\n')
    alert(`Dúvidas de \( {username}:\n\n \){str}`)
}

// ======================== DIAGNÓSTICO ========================
function startDiagnostic() {
    currentQuestionIndex = 0
    diagnosticAnswers = []
    showDiagnosticQuestion()
}

function showDiagnosticQuestion() {
    const q = DIAGNOSTIC_QUESTIONS[currentQuestionIndex]
    document.getElementById('q-current').textContent = currentQuestionIndex + 1
    document.getElementById('q-total').textContent = DIAGNOSTIC_QUESTIONS.length
    document.getElementById('diagnostic-question').textContent = q.text
    
    const container = document.getElementById('diagnostic-options')
    container.innerHTML = ''
    
    q.options.forEach(opt => {
        const btn = document.createElement('button')
        btn.className = "bg-[#25253f] hover:bg-indigo-500/10 border border-[#3a3a5a] rounded-2xl py-6 text-xl font-medium transition"
        btn.textContent = opt
        btn.onclick = () => answerDiagnostic(opt, q.answer, q.topic)
        container.appendChild(btn)
    })
}

function answerDiagnostic(selected, correct, topic) {
    diagnosticAnswers.push({
        correct: selected === correct,
        topic: topic
    })
    
    currentQuestionIndex++
    
    if (currentQuestionIndex >= DIAGNOSTIC_QUESTIONS.length) {
        finishDiagnostic()
    } else {
        showDiagnosticQuestion()
    }
}

function finishDiagnostic() {
    const correctCount = diagnosticAnswers.filter(a => a.correct).length
    const score = Math.round((correctCount / DIAGNOSTIC_QUESTIONS.length) * 100)
    
    let level = 'Básico'
    if (score >= 80) level = 'Avançado'
    else if (score >= 50) level = 'Intermediário'
    
    // Dificuldades
    const wrongTopics = diagnosticAnswers
        .filter(a => !a.correct)
        .map(a => a.topic)
        .filter((t, i, arr) => arr.indexOf(t) === i)
    
    currentUser.level = level
    currentUser.difficulties = wrongTopics
    currentUser.diagnosticDone = true
    
    saveCurrentUser()
    
    // Mostrar resultado
    document.getElementById('diagnostic-result').innerHTML = `
        Diagnóstico concluído!<br>
        <span class="text-4xl font-bold text-emerald-400">${score}%</span> • Nível: ${level}
    `
    document.getElementById('diagnostic-result').classList.remove('hidden')
    
    setTimeout(() => {
        showScreen('screen-dashboard')
        renderHeader()
    }, 2200)
}

function skipDiagnostic() {
    if (confirm('Tem certeza? O diagnóstico ajuda o sistema a te conhecer melhor.')) {
        currentUser.diagnosticDone = true
        currentUser.level = 'Básico'
        currentUser.difficulties = ['operacoesBasicas']
        saveCurrentUser()
        showScreen('screen-dashboard')
        renderHeader()
    }
}

// ======================== DASHBOARD ========================
function renderHeader() {
    const header = document.getElementById('header')
    const info = document.getElementById('user-header-info')
    
    if (adminMode) {
        header.classList.remove('hidden')
        document.getElementById('admin-header-btn').classList.remove('hidden')
        info.classList.add('hidden')
        return
    }
    
    if (!currentUser) return
    
    header.classList.remove('hidden')
    info.classList.remove('hidden')
    document.getElementById('admin-header-btn').classList.add('hidden')
    
    document.getElementById('header-name').textContent = currentUser.username
    document.getElementById('header-series').innerHTML = `<span class="px-2.5 py-0.5 text-[10px] bg-indigo-500 rounded-lg">${currentUser.series}</span>`
    document.getElementById('header-points').textContent = currentUser.points
    document.getElementById('header-combo').innerHTML = `${currentUser.currentCombo.toFixed(2)}x <span class="text-xs">🔥</span>`
}

function renderDashboard() {
    // Welcome adaptativo
    let welcomeText = `Olá, ${currentUser.username}!`
    let subtitle = 'O que vamos resolver hoje?'
    
    if (currentUser.series === '6º ano') {
        welcomeText = `Oi, ${currentUser.username}! 👋`
        subtitle = 'Vamos praticar matemática de um jeito divertido?'
    } else if (currentUser.series === '1º médio') {
        subtitle = 'Exercícios adaptados para o ensino médio.'
    }
    
    document.getElementById('dashboard-welcome').textContent = welcomeText
    document.getElementById('dashboard-subtitle').textContent = subtitle
    
    // Stats
    document.getElementById('dash-level').innerHTML = `${currentUser.level} <span class="text-2xl">📊</span>`
    
    const diffContainer = document.getElementById('dash-difficulties')
    diffContainer.innerHTML = currentUser.difficulties.length 
        ? currentUser.difficulties.map(d => `<span class="inline-block bg-red-400/10 text-red-400 text-xs px-4 py-1 rounded-3xl">${d}</span>`).join('')
        : `<span class="text-emerald-400">Nenhuma dificuldade registrada 🎉</span>`
    
    document.getElementById('dash-points').textContent = currentUser.points
    document.getElementById('dash-combo').textContent = currentUser.currentCombo.toFixed(2) + 'x'
    document.getElementById('dash-maxcombo').textContent = currentUser.maxCombo.toFixed(2) + 'x'
    document.getElementById('dash-weekly-points').textContent = currentUser.weeklyPoints
    document.getElementById('dash-weekly-correct').textContent = currentUser.weeklyCorrect
    
    // Histórico recente
    const histContainer = document.getElementById('recent-history')
    histContainer.innerHTML = ''
    
    if (currentUser.history && currentUser.history.length) {
        currentUser.history.slice(0, 4).forEach(item => {
            const div = document.createElement('div')
            div.className = 'bg-[#1a1a38] rounded-2xl px-6 py-4 flex justify-between items-center'
            div.innerHTML = `
                <div class="flex items-center gap-4">
                    <span class="text-2xl">${item.correct ? '✅' : '❌'}</span>
                    <div>
                        <div class="font-medium">${item.topic}</div>
                        <div class="text-xs text-gray-400">${item.date}</div>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-xs text-gray-400">${item.time}s</div>
                    <div class="text-emerald-400 text-lg">${item.correct ? '+10' : '0'}</div>
                </div>
            `
            histContainer.appendChild(div)
        })
    } else {
        histContainer.innerHTML = `<div class="text-center py-12 text-gray-400">Ainda não há exercícios realizados.</div>`
    }
}

// ======================== COMBO E PONTOS ========================
function applyCombo(correct) {
    if (correct) {
        currentUser.sequence++
        currentUser.currentCombo = Math.min(5.0, currentUser.currentCombo + 0.05)
        currentUser.maxCombo = Math.max(currentUser.maxCombo, currentUser.currentCombo)
        currentUser.points += Math.round(10 * currentUser.currentCombo)
        currentUser.weeklyPoints += Math.round(10 * currentUser.currentCombo)
        currentUser.weeklyCorrect++
    } else {
        currentUser.sequence = 0
        currentUser.currentCombo = 1.0
    }
    saveCurrentUser()
}

// ======================== EXERCÍCIOS ========================
function startPractice() {
    showScreen('screen-practice')
    practiceSession.startTime = Date.now()
    practiceSession.correct = 0
    practiceSession.total = 0
    practiceSession.consecutiveErrors = {}
    generateNextPracticeQuestion()
}

function generateNextPracticeQuestion() {
    // Priorizar dificuldades
    let topic = null
    if (currentUser.difficulties && currentUser.difficulties.length) {
        topic = currentUser.difficulties[Math.floor(Math.random() * currentUser.difficulties.length)]
    } else {
        const topics = ['operacoesBasicas', 'fracoes', 'porcentagem', 'equacoes1grau']
        topic = topics[Math.floor(Math.random() * topics.length)]
    }
    
    currentPracticeQuestion = generateQuestionByTopic(topic)
    
    document.getElementById('practice-topic-badge').textContent = topic
    document.getElementById('practice-question-text').innerHTML = `<span class="text-indigo-300">Q:</span> ${currentPracticeQuestion.text}`
    document.getElementById('practice-q-number').textContent = practiceSession.total + 1
    
    const container = document.getElementById('practice-options')
    container.innerHTML = ''
    
    currentPracticeQuestion.options.forEach(opt => {
        const btn = document.createElement('button')
        btn.className = 'bg-[#25253f] hover:bg-white/5 border border-[#3a3a5a] rounded-3xl py-8 text-2xl font-medium'
        btn.textContent = opt
        btn.onclick = () => handlePracticeAnswer(opt)
        container.appendChild(btn)
    })
    
    // Timer
    if (practiceSession.currentTimer) clearInterval(practiceSession.currentTimer)
    let seconds = 0
    practiceSession.currentTimer = setInterval(() => {
        seconds++
        document.getElementById('practice-timer').textContent = `\( {String(Math.floor(seconds/60)).padStart(2,'0')}: \){String(seconds%60).padStart(2,'0')}`
    }, 1000)
}

function generateQuestionByTopic(topic) {
    const lang = currentUser.series
    let text = ''
    let options = []
    let answer = ''
    
    if (topic === 'operacoesBasicas') {
        const a = Math.floor(Math.random() * 40) + 10
        const b = Math.floor(Math.random() * 30) + 5
        text = lang === '6º ano' ? `Quanto é ${a} + \( {b}?` : ` \){a} + ${b} = ?`
        answer = (a + b).toString()
        options = [answer, (a + b + 5).toString(), (a + b - 8).toString(), (a - b).toString()]
    } else if (topic === 'fracoes') {
        text = lang === '6º ano' ? 'Qual é 3/4 + 1/2?' : 'Calcule: 3/4 + 1/2'
        answer = '5/4'
        options = ['5/4', '1', '3/4', '7/4']
    } else if (topic === 'porcentagem') {
        text = lang === '6º ano' ? 'Qual é 25% de 120?' : '25% de 120 é:'
        answer = '30'
        options = ['30', '25', '35', '20']
    } else if (topic === 'equacoes1grau') {
        const x = Math.floor(Math.random() * 15) + 3
        text = lang === '1º médio' ? `Resolva a equação: 3x + 6 = ${3 * x + 6}` : `3x + 6 = ${3 * x + 6}. Qual é x?`
        answer = x.toString()
        options = [answer, (x + 4).toString(), (x - 3).toString(), (x * 2).toString()]
    }
    
    // Embaralhar
    options.sort(() => Math.random() - 0.5)
    return { text, options, answer, topic }
}

function handlePracticeAnswer(selected) {
    clearInterval(practiceSession.currentTimer)
    
    const correct = selected === currentPracticeQuestion.answer
    const timeSpent = Math.floor((Date.now() - practiceSession.startTime) / 1000)
    
    // Registrar histórico
    currentUser.history.unshift({
        date: new Date().toISOString().slice(0, 10),
        topic: currentPracticeQuestion.topic,
        correct: correct,
        time: timeSpent
    })
    if (currentUser.history.length > 12) currentUser.history.pop()
    
    applyCombo(correct)
    
    // Marcar erro consecutivo
    if (!correct) {
        practiceSession.consecutiveErrors[currentPracticeQuestion.topic] = (practiceSession.consecutiveErrors[currentPracticeQuestion.topic] || 0) + 1
        if (practiceSession.consecutiveErrors[currentPracticeQuestion.topic] >= 3 && !currentUser.difficulties.includes(currentPracticeQuestion.topic)) {
            currentUser.difficulties.push(currentPracticeQuestion.topic)
        }
    } else {
        practiceSession.consecutiveErrors[currentPracticeQuestion.topic] = 0
    }
    
    saveCurrentUser()
    
    // Feedback visual
    const buttons = document.querySelectorAll('#practice-options button')
    buttons.forEach(btn => {
        if (btn.textContent === currentPracticeQuestion.answer) btn.classList.add('correct')
        else if (btn.textContent === selected) btn.classList.add('wrong')
        btn.onclick = null
    })
    
    practiceSession.total++
    if (correct) practiceSession.correct++
    
    setTimeout(() => {
        generateNextPracticeQuestion()
    }, 1400)
}

function exitPractice() {
    clearInterval(practiceSession.currentTimer)
    showScreen('screen-dashboard')
    renderDashboard()
}

// ======================== REVISÃO ========================
function startReview() {
    showScreen('screen-review')
    
    if (!currentUser.difficulties || currentUser.difficulties.length === 0) {
        document.getElementById('review-content').innerHTML = `
            <div class="text-center py-20">
                <div class="text-6xl mb-6">🎉</div>
                <h3 class="text-2xl font-bold">Parabéns!</h3>
                <p class="text-gray-400 mt-4">Você não tem temas para revisar no momento.</p>
                <button onclick="showScreen('screen-dashboard')" class="mt-8 px-10 py-4 bg-emerald-500 rounded-3xl">Voltar ao Dashboard</button>
            </div>`
        return
    }
    
    // Gerar 6 questões de revisão
    currentReviewQuestions = []
    for (let i = 0; i < 6; i++) {
        const topic = currentUser.difficulties[Math.floor(Math.random() * currentUser.difficulties.length)]
        currentReviewQuestions.push(generateQuestionByTopic(topic))
    }
    
    let html = `<div class="space-y-8">`
    currentReviewQuestions.forEach((q, i) => {
        html += `
        <div class="border border-[#3a3a5a] rounded-3xl p-7">
            <div class="flex justify-between mb-6"><span class="font-medium">Questão \( {i+1}</span><span class="text-xs uppercase"> \){q.topic}</span></div>
            <p class="text-xl mb-8">${q.text}</p>
            <div class="grid grid-cols-2 gap-3" id="review-opt-${i}"></div>
        </div>`
    })
    html += `</div>`
    document.getElementById('review-content').innerHTML = html
    
    // Preencher opções
    currentReviewQuestions.forEach((q, i) => {
        const container = document.getElementById(`review-opt-${i}`)
        q.options.forEach(opt => {
            const btn = document.createElement('button')
            btn.className = 'py-5 rounded-2xl border border-[#3a3a5a] hover:border-purple-400 text-base'
            btn.textContent = opt
            btn.onclick = () => {
                if (opt === q.answer) {
                    btn.classList.add('bg-emerald-500', 'text-white')
                    applyCombo(true)
                } else {
                    btn.classList.add('bg-red-500', 'text-white')
                    applyCombo(false)
                }
                // Desabilitar as outras
                Array.from(container.children).forEach(b => b.onclick = null)
            }
            container.appendChild(btn)
        })
    })
}

function exitReview() {
    showScreen('screen-dashboard')
    renderDashboard()
}

// ======================== AJUDA ========================
function toggleHelp() {
    const area = document.getElementById('help-area')
    area.classList.toggle('hidden')
    document.getElementById('help-content').innerHTML = ''
}

function showHelpExplanation() {
    const content = document.getElementById('help-content')
    content.innerHTML = `<strong>Explicação simples:</strong><br><br>\( {currentPracticeQuestion ? `O resultado correto é <span class="font-bold"> \){currentPracticeQuestion.answer}</span>.` : 'Escolha a alternativa que resolve o problema.'}`
}

function showHelpStepByStep() {
    const content = document.getElementById('help-content')
    content.innerHTML = `<strong>Passo a passo:</strong><br><br>1. Leia o enunciado com atenção.<br>2. Identifique as operações necessárias.<br>3. Faça os cálculos com calma.<br>4. Verifique sua resposta.`
}

function showHelpAnotherExample() {
    const content = document.getElementById('help-content')
    content.innerHTML = `<strong>Outro exemplo:</strong><br><br>Se a pergunta fosse 12 + 8, a resposta seria 20.`
}

function submitDoubt() {
    const input = document.getElementById('doubt-input')
    if (!input.value.trim()) return
    
    if (!currentUser.doubts) currentUser.doubts = []
    
    currentUser.doubts.push({
        date: new Date().toISOString().slice(0, 10),
        text: input.value
    })
    
    saveCurrentUser()
    input.value = ''
    alert('✅ Dúvida enviada para o professor! Obrigado.')
    toggleHelp()
}

// ======================== RANKING ========================
function showRanking() {
    showScreen('screen-ranking')
    renderRanking('all')
}

function filterRanking(filter) {
    rankingFilter = filter
    document.querySelectorAll('#screen-ranking button').forEach(b => {
        b.classList.toggle('bg-indigo-600', b.id === `rank-filter-${filter === 'all' ? 'all' : filter.replace('º ano','').replace('º médio','1m')}`)
        b.classList.toggle('bg-[#25253f]', b.id !== `rank-filter-${filter === 'all' ? 'all' : filter.replace('º ano','').replace('º médio','1m')}`)
    })
    renderRanking(filter)
}

function renderRanking(filter) {
    const filtered = users
        .filter(u => !u.isAdmin)
        .filter(u => filter === 'all' || u.series === filter)
        .sort((a, b) => b.points - a.points)
    
    let html = ''
    filtered.slice(0, 10).forEach((u, i) => {
        html += `
        <tr class="border-b border-[#2a2a4a] hover:bg-[#25253f]">
            <td class="px-8 py-5 text-xl font-bold">${i+1}</td>
            <td class="px-8 py-5 font-medium">${u.username}</td>
            <td class="px-8 py-5">${u.series}</td>
            <td class="px-8 py-5 text-right font-bold text-amber-400">${u.points}</td>
        </tr>`
    })
    document.getElementById('ranking-body').innerHTML = html || `<tr><td colspan="4" class="text-center py-10">Nenhum aluno nesta série ainda.</td></tr>`
    
    // Posição do usuário atual
    if (currentUser) {
        const position = filtered.findIndex(u => u.username === currentUser.username) + 1
        document.getElementById('my-position').innerHTML = `
            <div>Sua posição: <span class="text-3xl font-bold">${position || '—'}</span></div>
            <div class="text-sm">Entre ${filtered.length} alunos</div>
        `
    }
}

// ======================== SEMANAL ========================
function checkWeeklyReset() {
    if (!currentUser) return
    const now = Date.now()
    const daysPassed = (now - currentUser.lastReset) / (1000 * 60 * 60 * 24)
    if (daysPassed >= 7) {
        currentUser.weeklyPoints = 0
        currentUser.weeklyCorrect = 0
        currentUser.weeklyStreak = 0
        currentUser.lastReset = now
        saveCurrentUser()
    }
}

// ======================== LOGOUT ========================
function logout() {
    localStorage.removeItem('resolveai_current')
    currentUser = null
    adminMode = false
    showScreen('screen-login')
    document.getElementById('header').classList.add('hidden')
}

// ======================== NAVEGAÇÃO ENTRE TELAS ========================
function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => screen.classList.add('hidden'))
    const target = document.getElementById(id)
    if (target) target.classList.remove('hidden')
    
    if (id === 'screen-dashboard') renderDashboard()
}

// ======================== INICIALIZAÇÃO ========================
window.onload = initApp
