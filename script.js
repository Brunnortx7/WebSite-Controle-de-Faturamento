let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let fixedCosts = parseFloat(localStorage.getItem('fixedCosts')) || 0;
let financeChart = null;
let tacografos = JSON.parse(localStorage.getItem('tacografos')) || [];
let abastecimentos = JSON.parse(localStorage.getItem('abastecimentos')) || [];
let editingTacografoId = null;
let editingAbastecimentoId = null;
let currentPage = 'dashboard';

const transactionForm = document.getElementById('transaction-form');
const transactionsBody = document.getElementById('transactions-body');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const currentBalanceEl = document.getElementById('current-balance');
const breakevenPointEl = document.getElementById('breakeven-point');
const transactionModal = document.getElementById('transaction-modal');
const tacografoModal = document.getElementById('tacografo-modal');
const abastecimentoModal = document.getElementById('abastecimento-modal');
const toastEl = document.getElementById('toast');
const currentDateEl = document.getElementById('current-date');
const fixedCostsInput = document.getElementById('fixed-costs');
const tacografoForm = document.getElementById('tacografo-form');
const abastecimentoForm = document.getElementById('abastecimento-form');
const pageTitleEl = document.getElementById('page-title');

document.addEventListener('DOMContentLoaded', () => {
    setCurrentDate();
    fixedCostsInput.value = fixedCosts;
    renderTacografo();
    renderAbastecimento();
    updateDashboard();

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTransaction();
    });

    tacografoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTacografo();
    });

    abastecimentoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveAbastecimento();
    });

    window.onclick = (event) => {
        if (event.target == transactionModal) {
            hideTransactionForm();
        }
        if (event.target == tacografoModal) {
            hideTacografoForm();
        }
        if (event.target == abastecimentoModal) {
            hideAbastecimentoForm();
        }
    };
});

function navigateTo(page, event) {
    event.preventDefault();
    
    const sections = document.querySelectorAll('.view-section');
    const navItems = document.querySelectorAll('.nav-item');
    
    sections.forEach(section => section.classList.remove('active'));
    navItems.forEach(item => item.classList.remove('active'));
    
    currentPage = page;
    
    if (page === 'dashboard') {
        document.getElementById('dashboard-view').classList.add('active');
        pageTitleEl.textContent = 'Dashboard Financeiro';
        updateDashboard();
    } else if (page === 'tacografo') {
        document.getElementById('tacografo-view').classList.add('active');
        pageTitleEl.textContent = 'Controle de Tacógrafo';
        renderTacografo();
    } else if (page === 'abastecimento') {
        document.getElementById('abastecimento-view').classList.add('active');
        pageTitleEl.textContent = 'Controle de Abastecimento';
        renderAbastecimento();
    }
    
    event.target.closest('.nav-item').classList.add('active');
}

function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('pt-BR', options);
}

function showTransactionForm(id = null) {
    const modalTitle = document.getElementById('modal-title');
    const saveBtn = document.getElementById('save-btn');

    if (id) {
        const t = transactions.find(item => item.id === id);
        if (t) {
            document.getElementById('transaction-id').value = t.id;
            document.getElementById('description').value = t.description;
            document.getElementById('amount').value = t.amount;
            document.getElementById('type').value = t.type;
            document.getElementById('date').value = t.date;
            modalTitle.textContent = 'Editar Lançamento';
            saveBtn.textContent = 'Atualizar Lançamento';
        }
    } else {
        transactionForm.reset();
        document.getElementById('transaction-id').value = '';
        document.getElementById('date').valueAsDate = new Date();
        modalTitle.textContent = 'Novo Lançamento';
        saveBtn.textContent = 'Salvar Lançamento';
    }

    transactionModal.classList.add('active');
}

function hideTransactionForm() {
    transactionModal.classList.remove('active');
    transactionForm.reset();
}

function showTacografoForm(id = null) {
    const modalTitle = document.getElementById('tacografo-modal-title');
    editingTacografoId = id;

    if (id) {
        const t = tacografos.find(item => item.id === id);
        if (t) {
            document.getElementById('tacografo-data').value = t.data || '';
            document.getElementById('tacografo-placa').value = t.placa || '';
            document.getElementById('tacografo-motorista').value = t.motorista || '';
            document.getElementById('tacografo-km-inicial').value = t.kmInicial || '';
            document.getElementById('tacografo-km-final').value = t.kmFinal || '';
            document.getElementById('tacografo-inoperante').checked = t.inoperante || false;
            modalTitle.textContent = 'Editar Registro de Tacógrafo';
            updateTacografoFieldsState();
        }
    } else {
        tacografoForm.reset();
        document.getElementById('tacografo-data').valueAsDate = new Date();
        document.getElementById('tacografo-inoperante').checked = false;
        modalTitle.textContent = 'Novo Registro de Tacógrafo';
        updateTacografoFieldsState();
    }

    tacografoModal.classList.add('active');
}

function hideTacografoForm() {
    tacografoModal.classList.remove('active');
    tacografoForm.reset();
    editingTacografoId = null;
}

function showAbastecimentoForm(id = null) {
    const modalTitle = document.getElementById('abastecimento-modal-title');
    editingAbastecimentoId = id;

    if (id) {
        const a = abastecimentos.find(item => item.id === id);
        if (a) {
            document.getElementById('abastecimento-data').value = a.data || '';
            document.getElementById('abastecimento-placa').value = a.placa || '';
            document.getElementById('abastecimento-quilometragem').value = a.quilometragem || '';
            document.getElementById('abastecimento-litros').value = a.litros || '';
            document.getElementById('abastecimento-valor').value = a.valor || '';
            modalTitle.textContent = 'Editar Registro de Abastecimento';
        }
    } else {
        abastecimentoForm.reset();
        document.getElementById('abastecimento-data').valueAsDate = new Date();
        modalTitle.textContent = 'Novo Registro de Abastecimento';
    }

    abastecimentoModal.classList.add('active');
}

function hideAbastecimentoForm() {
    abastecimentoModal.classList.remove('active');
    abastecimentoForm.reset();
    editingAbastecimentoId = null;
}

function toggleTacografoInoperante() {
    const inoperante = document.getElementById('tacografo-inoperante').checked;
    updateTacografoFieldsState();
}

function updateTacografoFieldsState() {
    const inoperante = document.getElementById('tacografo-inoperante').checked;
    const kmInicialInput = document.getElementById('tacografo-km-inicial');
    const kmFinalInput = document.getElementById('tacografo-km-final');

    if (inoperante) {
        kmInicialInput.disabled = true;
        kmFinalInput.disabled = true;
        kmInicialInput.value = '';
        kmFinalInput.value = '';
    } else {
        kmInicialInput.disabled = false;
        kmFinalInput.disabled = false;
    }
}

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

function saveTransaction() {
    const id = document.getElementById('transaction-id').value;
    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const type = document.getElementById('type').value;
    const date = document.getElementById('date').value;

    if (!description || isNaN(amount) || !type || !date) {
        showToast('Por favor, preencha todos os campos corretamente.');
        return;
    }

    if (id) {
        const index = transactions.findIndex(t => t.id == id);
        if (index !== -1) {
            transactions[index] = { id: parseInt(id), description, amount, type, date };
            showToast('Lançamento atualizado!');
        }
    } else {
        const transaction = { id: Date.now(), description, amount, type, date };
        transactions.push(transaction);
        showToast('Lançamento adicionado!');
    }

    saveTransactions();
    updateDashboard();
    hideTransactionForm();
}

function deleteTransaction(id) {
    if (confirm('Tem certeza que deseja excluir este lançamento?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveTransactions();
        updateDashboard();
        showToast('Lançamento removido.');
    }
}

function saveTacografo() {
    const data = document.getElementById('tacografo-data').value;
    const placa = document.getElementById('tacografo-placa').value;
    const motorista = document.getElementById('tacografo-motorista').value;
    const kmInicial = document.getElementById('tacografo-km-inicial').value;
    const kmFinal = document.getElementById('tacografo-km-final').value;
    const inoperante = document.getElementById('tacografo-inoperante').checked;

    if (!data || !placa || !motorista) {
        showToast('Por favor, preencha os campos obrigatórios (Data, Placa, Motorista).');
        return;
    }

    if (!inoperante) {
        if (!kmInicial || !kmFinal) {
            showToast('Por favor, preencha KM Inicial e KM Final ou marque "Tacografo inoperante".');
            return;
        }
        const kmInicialNum = parseFloat(kmInicial);
        const kmFinalNum = parseFloat(kmFinal);
        if (isNaN(kmInicialNum) || isNaN(kmFinalNum) || kmFinalNum <= kmInicialNum) {
            showToast('KM Final deve ser maior que KM Inicial.');
            return;
        }
    }

    if (editingTacografoId) {
        const index = tacografos.findIndex(t => t.id === editingTacografoId);
        if (index !== -1) {
            tacografos[index] = {
                id: editingTacografoId,
                data,
                placa,
                motorista,
                kmInicial: inoperante ? '' : kmInicial,
                kmFinal: inoperante ? '' : kmFinal,
                inoperante
            };
            showToast('Registro de tacógrafo atualizado!');
        }
    } else {
        const tacografo = {
            id: Date.now(),
            data,
            placa,
            motorista,
            kmInicial: inoperante ? '' : kmInicial,
            kmFinal: inoperante ? '' : kmFinal,
            inoperante
        };
        tacografos.push(tacografo);
        showToast('Registro de tacógrafo adicionado!');
    }

    saveTacografos();
    renderTacografo();
    hideTacografoForm();
}

function deleteTacografo(id) {
    if (confirm('Tem certeza que deseja excluir este registro de tacógrafo?')) {
        tacografos = tacografos.filter(t => t.id !== id);
        saveTacografos();
        renderTacografo();
        showToast('Registro de tacógrafo removido.');
    }
}

function saveAbastecimento() {
    const data = document.getElementById('abastecimento-data').value;
    const placa = document.getElementById('abastecimento-placa').value;
    const quilometragem = document.getElementById('abastecimento-quilometragem').value;
    const litros = document.getElementById('abastecimento-litros').value;
    const valor = document.getElementById('abastecimento-valor').value;

    if (!data || !placa || !quilometragem || !litros || !valor) {
        showToast('Por favor, preencha todos os campos obrigatórios.');
        return;
    }

    const quilometragemNum = parseFloat(quilometragem);
    const litrosNum = parseFloat(litros);
    const valorNum = parseFloat(valor);

    if (isNaN(quilometragemNum) || isNaN(litrosNum) || isNaN(valorNum)) {
        showToast('Quilometragem, Litros e Valor devem ser números válidos.');
        return;
    }

    if (litrosNum <= 0 || valorNum <= 0) {
        showToast('Litros e Valor devem ser maiores que zero.');
        return;
    }

    if (editingAbastecimentoId) {
        const index = abastecimentos.findIndex(a => a.id === editingAbastecimentoId);
        if (index !== -1) {
            abastecimentos[index] = {
                id: editingAbastecimentoId,
                data,
                placa,
                quilometragem,
                litros,
                valor
            };
            showToast('Registro de abastecimento atualizado!');
        }
    } else {
        const abastecimento = {
            id: Date.now(),
            data,
            placa,
            quilometragem,
            litros,
            valor
        };
        abastecimentos.push(abastecimento);
        showToast('Registro de abastecimento adicionado!');
    }

    saveAbastecimentos();
    renderAbastecimento();
    hideAbastecimentoForm();
}

function deleteAbastecimento(id) {
    if (confirm('Tem certeza que deseja excluir este registro de abastecimento?')) {
        abastecimentos = abastecimentos.filter(a => a.id !== id);
        saveAbastecimentos();
        renderAbastecimento();
        showToast('Registro de abastecimento removido.');
    }
}

function saveFixedCosts() {
    const value = parseFloat(fixedCostsInput.value) || 0;
    fixedCosts = value;
    localStorage.setItem('fixedCosts', fixedCosts);
    updateDashboard();
    showToast('Custos fixos definidos!');
}

function saveTransactions() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

function saveTacografos() {
    localStorage.setItem('tacografos', JSON.stringify(tacografos));
}

function saveAbastecimentos() {
    localStorage.setItem('abastecimentos', JSON.stringify(abastecimentos));
}

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00Z');
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function updateDashboard() {
    renderTransactions();
    calculateTotals();
    updateChart();
}

function renderTransactions() {
    transactionsBody.innerHTML = '';
    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentTransactions = sortedTransactions.slice(0, 10);

    recentTransactions.forEach(t => {
        const row = document.createElement('tr');
        const dateFormatted = formatDate(t.date);

        row.innerHTML = `
            <td>${dateFormatted}</td>
            <td>${t.description}</td>
            <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Faturamento' : 'Despesa'}</span></td>
            <td style="font-weight: 600; color: ${t.type === 'income' ? 'var(--income-color)' : 'var(--expense-color)'}">
                ${t.type === 'income' ? '+' : '-'} ${formatCurrency(t.amount)}
            </td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="showTransactionForm(${t.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="deleteTransaction(${t.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        `;
        transactionsBody.appendChild(row);
    });

    if (transactions.length === 0) {
        transactionsBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum lançamento encontrado.</td></tr>';
    }
}

function renderTacografo() {
    const body = document.getElementById('tacografo-body');
    body.innerHTML = '';

    if (tacografos.length === 0) {
        body.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum registro de tacógrafo encontrado.</td></tr>';
        return;
    }

    tacografos.forEach(t => {
        const row = document.createElement('tr');
        const kmRodado = (t.inoperante || !t.kmInicial || !t.kmFinal) ? '-' : (parseFloat(t.kmFinal) - parseFloat(t.kmInicial)).toFixed(2);
        const status = t.inoperante ? 'Inoperante' : 'Operante';
        const dateFormatted = formatDate(t.data);

        row.innerHTML = `
            <td>${dateFormatted}</td>
            <td>${t.placa}</td>
            <td>${t.motorista}</td>
            <td>${t.kmInicial || '-'}</td>
            <td>${t.kmFinal || '-'}</td>
            <td>${kmRodado}</td>
            <td>${status}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="showTacografoForm(${t.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="deleteTacografo(${t.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
}

function renderAbastecimento() {
    const body = document.getElementById('abastecimento-body');
    body.innerHTML = '';

    if (abastecimentos.length === 0) {
        body.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-muted);">Nenhum registro de abastecimento encontrado.</td></tr>';
        return;
    }

    abastecimentos.forEach(a => {
        const row = document.createElement('tr');
        const dateFormatted = formatDate(a.data);

        row.innerHTML = `
            <td>${dateFormatted}</td>
            <td>${a.placa}</td>
            <td>${a.quilometragem}</td>
            <td>${parseFloat(a.litros).toFixed(2)}</td>
            <td>${formatCurrency(parseFloat(a.valor))}</td>
            <td>
                <div class="action-btns">
                    <button class="btn-edit" onclick="showAbastecimentoForm(${a.id})" title="Editar">✏️</button>
                    <button class="btn-delete" onclick="deleteAbastecimento(${a.id})" title="Excluir">🗑️</button>
                </div>
            </td>
        `;
        body.appendChild(row);
    });
}

function calculateTotals() {
    const totals = transactions.reduce((acc, t) => {
        if (t.type === 'income') acc.income += t.amount;
        else acc.expense += t.amount;
        return acc;
    }, { income: 0, expense: 0 });

    const totalExpensesWithFixed = totals.expense + fixedCosts;
    const balance = totals.income - totalExpensesWithFixed;

    totalIncomeEl.textContent = formatCurrency(totals.income);
    totalExpenseEl.textContent = formatCurrency(totalExpensesWithFixed);
    currentBalanceEl.textContent = formatCurrency(balance);
    breakevenPointEl.textContent = formatCurrency(totalExpensesWithFixed);
}

function updateChart() {
    const canvas = document.getElementById('financeChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const dataByDate = {};
    transactions.forEach(t => {
        if (!dataByDate[t.date]) {
            dataByDate[t.date] = { income: 0, expense: 0 };
        }
        dataByDate[t.date][t.type] += t.amount;
    });

    const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));

    let cumulativeIncome = 0;
    let cumulativeExpense = fixedCosts;
    let incomeData = [];
    let expenseData = [];
    let labels = [];

    if (sortedDates.length > 0) {
        const firstDate = new Date(sortedDates[0] + 'T00:00:00Z');
        const prevDate = new Date(firstDate);
        prevDate.setUTCDate(firstDate.getUTCDate() - 1);
        labels.push(prevDate.toLocaleDateString('pt-BR', { timeZone: 'UTC' }));
    } else {
        labels.push('Início');
    }
    incomeData.push(0);
    expenseData.push(fixedCosts);

    sortedDates.forEach(date => {
        cumulativeIncome += dataByDate[date].income;
        cumulativeExpense += dataByDate[date].expense;
        labels.push(new Date(date + 'T00:00:00Z').toLocaleDateString('pt-BR', { timeZone: 'UTC' }));
        incomeData.push(cumulativeIncome);
        expenseData.push(cumulativeExpense);
    });

    let breakevenPoint = null;

    for (let i = 0; i < incomeData.length - 1; i++) {
        const inc0 = incomeData[i],  inc1 = incomeData[i + 1];
        const exp0 = expenseData[i], exp1 = expenseData[i + 1];

        const diff0 = inc0 - exp0;
        const diff1 = inc1 - exp1;

        if (diff0 === 0) {
            breakevenPoint = { index: i, y: inc0 };
            break;
        }

        if (diff0 * diff1 < 0) {
            const t = diff0 / (diff0 - diff1);
            const yIntersect = inc0 + t * (inc1 - inc0);
            breakevenPoint = { index: i + t, y: yIntersect };
            break;
        }
    }

    if (financeChart) {
        financeChart.destroy();
        financeChart = null;
    }

    const incomeColor  = '#10b981';
    const expenseColor = '#ef4444';
    const breakevenColor = '#3b82f6';

    const breakevenPlugin = {
        id: 'breakevenPlugin',
        afterDatasetsDraw(chart) {
            if (!breakevenPoint) return;

            const { ctx, scales: { x, y } } = chart;

            const n = labels.length;
            const fraction = n > 1 ? breakevenPoint.index / (n - 1) : 0;
            const xPixel = x.getPixelForDecimal(fraction);
            const yPixel = y.getPixelForValue(breakevenPoint.y);

            ctx.save();

            ctx.beginPath();
            ctx.arc(xPixel, yPixel, 16, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.20)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(xPixel, yPixel, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.40)';
            ctx.fill();

            ctx.beginPath();
            ctx.arc(xPixel, yPixel, 6, 0, 2 * Math.PI);
            ctx.fillStyle = breakevenColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.fill();
            ctx.stroke();

            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(xPixel, yPixel + 6);
            ctx.lineTo(xPixel, y.bottom);
            ctx.stroke();
            ctx.restore();

            const label = 'Ponto de Equilíbrio';
            ctx.font = 'bold 12px Inter, sans-serif';
            const textWidth = ctx.measureText(label).width;
            const padding = 8;
            const boxH = 22;
            const boxY = yPixel - 16 - boxH;
            let boxX = xPixel - textWidth / 2 - padding;

            boxX = Math.max(x.left, Math.min(boxX, x.right - textWidth - padding * 2));

            ctx.fillStyle = breakevenColor;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, textWidth + padding * 2, boxH, 4);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, boxX + padding, boxY + boxH / 2);

            ctx.restore();
        }
    };

    financeChart = new Chart(ctx, {
        type: 'line',
        plugins: [breakevenPlugin],
        data: {
            labels,
            datasets: [
                {
                    label: 'Faturamento (Receitas)',
                    data: incomeData,
                    borderColor: incomeColor,
                    backgroundColor: 'rgba(16, 185, 129, 0.08)',
                    fill: true,
                    tension: 0,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: incomeColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                },
                {
                    label: 'Gastos (Despesas)',
                    data: expenseData,
                    borderColor: expenseColor,
                    backgroundColor: 'rgba(239, 68, 68, 0.08)',
                    fill: true,
                    tension: 0,
                    borderWidth: 3,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: expenseColor,
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 400
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label(context) {
                            let label = context.dataset.label || '';
                            if (label) label += ': ';
                            if (context.parsed.y !== null) {
                                label += formatCurrency(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (value) => 'R$ ' + value.toLocaleString('pt-BR')
                    },
                    grid: { color: '#f1f5f9' }
                },
                x: {
                    grid: { display: false }
                }
            }
        }
    });
}
