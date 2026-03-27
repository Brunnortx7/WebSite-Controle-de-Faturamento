let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let fixedCosts = parseFloat(localStorage.getItem('fixedCosts')) || 0;
let financeChart = null;

// DOM Elements
const transactionForm = document.getElementById('transaction-form');
const transactionsBody = document.getElementById('transactions-body');
const totalIncomeEl = document.getElementById('total-income');
const totalExpenseEl = document.getElementById('total-expense');
const currentBalanceEl = document.getElementById('current-balance');
const breakevenPointEl = document.getElementById('breakeven-point');
const transactionModal = document.getElementById('transaction-modal');
const toastEl = document.getElementById('toast');
const currentDateEl = document.getElementById('current-date');
const fixedCostsInput = document.getElementById('fixed-costs');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    setCurrentDate();
    fixedCostsInput.value = fixedCosts;

    transactionForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveTransaction();
    });

    window.onclick = (event) => {
        if (event.target == transactionModal) {
            hideTransactionForm();
        }
    };
});

function setCurrentDate() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    currentDateEl.textContent = now.toLocaleDateString('pt-BR', options);
}

// UI Functions
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

function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, 3000);
}

// Data Functions
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

function formatCurrency(value) {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Dashboard Updates
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
        const dateFormatted = new Date(t.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

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

// Chart Logic
function updateChart() {
    const canvas = document.getElementById('financeChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Aggregate transactions by date
    const dataByDate = {};
    transactions.forEach(t => {
        if (!dataByDate[t.date]) {
            dataByDate[t.date] = { income: 0, expense: 0 };
        }
        dataByDate[t.date][t.type] += t.amount;
    });

    const sortedDates = Object.keys(dataByDate).sort((a, b) => new Date(a) - new Date(b));

    // Build cumulative series
    let cumulativeIncome = 0;
    let cumulativeExpense = fixedCosts; // expense line always starts at fixedCosts
    let incomeData = [];
    let expenseData = [];
    let labels = [];

    // Initial anchor point (one day before first transaction, or "Início")
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

    // --- FIX: Compute breakevenPoint using correct linear interpolation ---
    // breakevenPoint stores { index: fractional x-axis index, y: interpolated y value }
    let breakevenPoint = null;

    for (let i = 0; i < incomeData.length - 1; i++) {
        const inc0 = incomeData[i],  inc1 = incomeData[i + 1];
        const exp0 = expenseData[i], exp1 = expenseData[i + 1];

        // diff[i] = income[i] - expense[i]; crossing happens when sign changes
        const diff0 = inc0 - exp0;
        const diff1 = inc1 - exp1;

        if (diff0 === 0) {
            // Exact crossing at point i
            breakevenPoint = { index: i, y: inc0 };
            break;
        }

        if (diff0 * diff1 < 0) {
            // Lines cross between i and i+1 — linear interpolation
            // t is the fractional step within this segment where diff = 0
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

    // --- FIX: breakevenPlugin uses getPixelForDecimal for fractional x positions ---
    const breakevenPlugin = {
        id: 'breakevenPlugin',
        afterDatasetsDraw(chart) {
            if (!breakevenPoint) return;

            const { ctx, scales: { x, y } } = chart;

            // getPixelForDecimal maps a 0-1 fraction of the axis width to a pixel.
            // We need to convert our fractional label index to that 0-1 range.
            // For a category scale with N labels, label i maps to fraction i/(N-1).
            const n = labels.length;
            const fraction = n > 1 ? breakevenPoint.index / (n - 1) : 0;
            const xPixel = x.getPixelForDecimal(fraction);
            const yPixel = y.getPixelForValue(breakevenPoint.y);

            ctx.save();

            // Outer glow ring
            ctx.beginPath();
            ctx.arc(xPixel, yPixel, 16, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.20)';
            ctx.fill();

            // Mid ring
            ctx.beginPath();
            ctx.arc(xPixel, yPixel, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'rgba(59, 130, 246, 0.40)';
            ctx.fill();

            // Core circle
            ctx.beginPath();
            ctx.arc(xPixel, yPixel, 6, 0, 2 * Math.PI);
            ctx.fillStyle = breakevenColor;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.fill();
            ctx.stroke();

            // Vertical dashed drop line to x-axis
            ctx.save();
            ctx.setLineDash([4, 4]);
            ctx.strokeStyle = 'rgba(59, 130, 246, 0.45)';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(xPixel, yPixel + 6);
            ctx.lineTo(xPixel, y.bottom);
            ctx.stroke();
            ctx.restore();

            // Label background + text
            const label = 'Ponto de Equilíbrio';
            ctx.font = 'bold 12px Inter, sans-serif';
            const textWidth = ctx.measureText(label).width;
            const padding = 8;
            const boxH = 22;
            const boxY = yPixel - 16 - boxH;
            let boxX = xPixel - textWidth / 2 - padding;

            // Keep label inside chart area
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