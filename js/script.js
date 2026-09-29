/* ============================================================
   MONEY MATTERS - CLIENT JAVASCRIPT
   Pure Vanilla ES6 JavaScript (No External Libraries / Frameworks)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
    // Application State
    const state = {
        transactions: [],
        filterType: 'all',
        filterCategory: 'all',
        searchQuery: '',
        sortBy: 'newest',
        activeType: 'income',
        editingId: null,
        deletingId: null,
        isServerConnected: true
    };

    // Category Options Definition
    const CATEGORIES = {
        income: ["Scholarship", "Allowance", "Salary", "Freelance", "Other"],
        expense: ["Food", "Travel", "Education", "Shopping", "Entertainment", "Bills", "Health", "Other"]
    };

    // DOM Elements
    const elements = {
        // Summaries
        totalIncome: document.getElementById('total-income'),
        totalExpenses: document.getElementById('total-expenses'),
        remainingBalance: document.getElementById('remaining-balance'),
        spendingPercentage: document.getElementById('spending-percentage'),
        incomeCountText: document.getElementById('income-count-text'),
        expenseCountText: document.getElementById('expense-count-text'),
        balanceBadge: document.getElementById('balance-badge'),
        balanceFooterText: document.getElementById('balance-footer-text'),
        transactionTotalCount: document.getElementById('transaction-total-count'),
        
        // Category Breakdown
        categoryBarsContainer: document.getElementById('category-bars-container'),
        highestSpendingPill: document.getElementById('highest-spending-pill'),

        // Form
        formTitle: document.getElementById('form-title'),
        transactionForm: document.getElementById('transaction-form'),
        txId: document.getElementById('tx-id'),
        txType: document.getElementById('tx-type'),
        txAmount: document.getElementById('tx-amount'),
        txCategory: document.getElementById('tx-category'),
        txDescription: document.getElementById('tx-description'),
        txDate: document.getElementById('tx-date'),
        btnSubmitTx: document.getElementById('btn-submit-tx'),
        btnCancelEdit: document.getElementById('btn-cancel-edit'),
        tabIncome: document.getElementById('tab-income'),
        tabExpense: document.getElementById('tab-expense'),

        // Form Error Spans
        amountError: document.getElementById('amount-error'),
        categoryError: document.getElementById('category-error'),
        dateError: document.getElementById('date-error'),

        // Table & History
        transactionTbody: document.getElementById('transaction-tbody'),
        emptyState: document.getElementById('empty-state'),
        emptyStateMessage: document.getElementById('empty-state-message'),
        btnEmptyAdd: document.getElementById('btn-empty-add'),

        // Filter Controls
        searchInput: document.getElementById('search-input'),
        searchClearBtn: document.getElementById('search-clear-btn'),
        filterType: document.getElementById('filter-type'),
        filterCategory: document.getElementById('filter-category'),
        sortBy: document.getElementById('sort-by'),
        btnResetFilters: document.getElementById('btn-reset-filters'),
        filterStatusBar: document.getElementById('filter-status-bar'),
        filterStatusText: document.getElementById('filter-status-text'),
        filteredCountBadge: document.getElementById('filtered-count-badge'),

        // Connection & Buttons
        statusDot: document.getElementById('status-dot'),
        statusText: document.getElementById('status-text'),
        btnQuickIncome: document.getElementById('btn-quick-income'),
        btnQuickExpense: document.getElementById('btn-quick-expense'),
        toastContainer: document.getElementById('toast-container'),

        // Modals
        deleteModal: document.getElementById('delete-modal'),
        deleteTxPreview: document.getElementById('delete-tx-preview'),
        btnCloseDeleteModal: document.getElementById('btn-close-delete-modal'),
        btnCancelDelete: document.getElementById('btn-cancel-delete'),
        btnConfirmDelete: document.getElementById('btn-confirm-delete'),

        clearModal: document.getElementById('clear-modal'),
        btnOpenClearModal: document.getElementById('btn-open-clear-modal'),
        btnCloseClearModal: document.getElementById('btn-close-clear-modal'),
        btnCancelClear: document.getElementById('btn-cancel-clear'),
        btnConfirmClear: document.getElementById('btn-confirm-clear')
    };

    // Initialize Application
    init();

    function init() {
        // Default today's date in YYYY-MM-DD
        const today = new Date().toISOString().split('T')[0];
        elements.txDate.value = today;

        // Setup Category Options for Form and Filters
        updateCategoryOptions(state.activeType);
        updateFilterCategoryOptions();

        // Register Event Listeners
        registerEventListeners();

        // Load Transactions from Python Backend
        loadTransactions();
    }

    // Event Listeners Registration
    function registerEventListeners() {
        // Type Tabs (Income / Expense)
        elements.tabIncome.addEventListener('click', () => setFormType('income'));
        elements.tabExpense.addEventListener('click', () => setFormType('expense'));

        // Form Submit
        elements.transactionForm.addEventListener('submit', handleFormSubmit);

        // Form Cancel Edit
        elements.btnCancelEdit.addEventListener('click', resetForm);

        // Quick Add Buttons
        elements.btnQuickIncome.addEventListener('click', () => {
            setFormType('income');
            elements.transactionForm.scrollIntoView({ behavior: 'smooth' });
            elements.txAmount.focus();
        });

        elements.btnQuickExpense.addEventListener('click', () => {
            setFormType('expense');
            elements.transactionForm.scrollIntoView({ behavior: 'smooth' });
            elements.txAmount.focus();
        });

        elements.btnEmptyAdd.addEventListener('click', () => {
            elements.transactionForm.scrollIntoView({ behavior: 'smooth' });
            elements.txAmount.focus();
        });

        // Search & Filters
        elements.searchInput.addEventListener('input', (e) => {
            state.searchQuery = e.target.value.trim();
            elements.searchClearBtn.style.display = state.searchQuery ? 'block' : 'none';
            renderTableAndBars();
        });

        elements.searchClearBtn.addEventListener('click', () => {
            elements.searchInput.value = '';
            state.searchQuery = '';
            elements.searchClearBtn.style.display = 'none';
            renderTableAndBars();
        });

        elements.filterType.addEventListener('change', (e) => {
            state.filterType = e.target.value;
            renderTableAndBars();
        });

        elements.filterCategory.addEventListener('change', (e) => {
            state.filterCategory = e.target.value;
            renderTableAndBars();
        });

        elements.sortBy.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            renderTableAndBars();
        });

        elements.btnResetFilters.addEventListener('click', resetFilters);

        // Delete Modal
        elements.btnCloseDeleteModal.addEventListener('click', closeDeleteModal);
        elements.btnCancelDelete.addEventListener('click', closeDeleteModal);
        elements.btnConfirmDelete.addEventListener('click', executeDelete);

        // Clear All Data Modal
        elements.btnOpenClearModal.addEventListener('click', () => elements.clearModal.classList.add('open'));
        elements.btnCloseClearModal.addEventListener('click', () => elements.clearModal.classList.remove('open'));
        elements.btnCancelClear.addEventListener('click', () => elements.clearModal.classList.remove('open'));
        elements.btnConfirmClear.addEventListener('click', executeClearAll);
    }

    // Toggle Form Type (Income vs Expense)
    function setFormType(type) {
        state.activeType = type;
        elements.txType.value = type;

        if (type === 'income') {
            elements.tabIncome.classList.add('active');
            elements.tabExpense.classList.remove('active');
            if (!state.editingId) elements.btnSubmitTx.textContent = 'Add Income';
        } else {
            elements.tabExpense.classList.add('active');
            elements.tabIncome.classList.remove('active');
            if (!state.editingId) elements.btnSubmitTx.textContent = 'Add Expense';
        }

        updateCategoryOptions(type);
    }

    // Update Form Category Options
    function updateCategoryOptions(type) {
        const categories = CATEGORIES[type] || [];
        elements.txCategory.innerHTML = categories
            .map(cat => `<option value="${cat}">${cat}</option>`)
            .join('');
    }

    // Update Filter Category Options (Combines all unique categories)
    function updateFilterCategoryOptions() {
        const allCats = [...CATEGORIES.income, ...CATEGORIES.expense];
        const uniqueCats = Array.from(new Set(allCats)).sort();

        elements.filterCategory.innerHTML = `<option value="all">All Categories</option>` +
            uniqueCats.map(cat => `<option value="${cat}">${cat}</option>`).join('');
    }

    // Fetch Transactions from Python Backend
    async function loadTransactions() {
        try {
            const res = await fetch('/api/transactions');
            if (!res.ok) throw new Error('Server returned error response');
            
            const result = await res.json();
            if (result.success && Array.isArray(result.data)) {
                state.transactions = result.data;
                updateServerStatus(true);
            } else {
                throw new Error(result.message || 'Failed to parse transactions data');
            }
        } catch (err) {
            console.error('API Error:', err);
            updateServerStatus(false);
            showToast("Unable to connect to Python server. Please ensure python/server.py is running.", "error");
        } finally {
            updateDashboard();
            renderTableAndBars();
        }
    }

    // Update Connection Badge UI
    function updateServerStatus(isOnline) {
        state.isServerConnected = isOnline;
        if (isOnline) {
            elements.statusDot.className = 'status-dot online';
            elements.statusText.textContent = 'Server Connected';
        } else {
            elements.statusDot.className = 'status-dot offline';
            elements.statusText.textContent = 'Server Offline';
        }
    }

    // Handle Form Submit (Add or Update)
    async function handleFormSubmit(e) {
        e.preventDefault();
        clearErrors();

        // Read Inputs
        const type = state.activeType;
        const amountVal = elements.txAmount.value.trim();
        const category = elements.txCategory.value;
        const description = elements.txDescription.value.trim();
        const date = elements.txDate.value;

        // Frontend Validation
        let isValid = true;
        const amount = parseFloat(amountVal);

        if (!amountVal || isNaN(amount) || amount <= 0) {
            showFieldError(elements.txAmount, elements.amountError, "Please enter a valid amount greater than zero.");
            isValid = false;
        }

        if (!category) {
            showFieldError(elements.txCategory, elements.categoryError, "Please select a category.");
            isValid = false;
        }

        if (!date) {
            showFieldError(elements.txDate, elements.dateError, "Please select a valid date.");
            isValid = false;
        }

        if (!isValid) return;

        // Prepare Payload
        const payload = { type, amount, category, description, date };

        try {
            elements.btnSubmitTx.disabled = true;
            elements.btnSubmitTx.textContent = "Processing...";

            let response;
            if (state.editingId) {
                // PUT update request
                response = await fetch(`/api/transactions/${state.editingId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            } else {
                // POST add request
                response = await fetch('/api/transactions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
            }

            const resData = await response.json();
            if (resData.success) {
                showToast(resData.message || "Transaction saved successfully.", "success");
                resetForm();
                await loadTransactions();
            } else {
                showToast(resData.message || "Failed to save transaction.", "error");
            }
        } catch (err) {
            console.error("Save error:", err);
            showToast("Server communication failed. Please check backend connection.", "error");
        } finally {
            elements.btnSubmitTx.disabled = false;
            if (!state.editingId) {
                elements.btnSubmitTx.textContent = state.activeType === 'income' ? 'Add Income' : 'Add Expense';
            }
        }
    }

    // Reset Form Fields
    function resetForm() {
        state.editingId = null;
        elements.txId.value = '';
        elements.transactionForm.reset();
        
        // Restore today's date
        const today = new Date().toISOString().split('T')[0];
        elements.txDate.value = today;

        elements.formTitle.textContent = "Add Transaction";
        elements.btnCancelEdit.style.display = 'none';
        setFormType(state.activeType);
        clearErrors();
    }

    // Validation Error Helpers
    function showFieldError(inputElem, errorSpanElem, msg) {
        inputElem.classList.add('invalid');
        errorSpanElem.textContent = msg;
    }

    function clearErrors() {
        [elements.txAmount, elements.txCategory, elements.txDate].forEach(el => el.classList.remove('invalid'));
        [elements.amountError, elements.categoryError, elements.dateError].forEach(el => el.textContent = '');
    }

    // Update Dashboard Metrics
    function updateDashboard() {
        const txs = state.transactions;

        let totalIncome = 0;
        let totalExpenses = 0;
        let incomeCount = 0;
        let expenseCount = 0;

        txs.forEach(tx => {
            const amt = parseFloat(tx.amount) || 0;
            if (tx.type === 'income') {
                totalIncome += amt;
                incomeCount++;
            } else if (tx.type === 'expense') {
                totalExpenses += amt;
                expenseCount++;
            }
        });

        const remainingBalance = totalIncome - totalExpenses;
        const totalCount = txs.length;

        // Spending percentage calculation (handle 0 income safely)
        let spendingPct = 0;
        if (totalIncome > 0) {
            spendingPct = Math.min(100, Math.max(0, (totalExpenses / totalIncome) * 100));
        }

        // Render Summary Values
        elements.totalIncome.textContent = formatCurrency(totalIncome);
        elements.totalExpenses.textContent = formatCurrency(totalExpenses);
        elements.remainingBalance.textContent = formatCurrency(remainingBalance);
        elements.incomeCountText.textContent = `${incomeCount} income record${incomeCount === 1 ? '' : 's'}`;
        elements.expenseCountText.textContent = `${expenseCount} expense record${expenseCount === 1 ? '' : 's'}`;
        elements.transactionTotalCount.textContent = `${totalCount} total transaction${totalCount === 1 ? '' : 's'}`;

        // Spending Percentage Display
        if (totalIncome === 0 && totalExpenses > 0) {
            elements.spendingPercentage.textContent = "100%+";
        } else {
            elements.spendingPercentage.textContent = `${spendingPct.toFixed(1)}%`;
        }

        // Balance Badge Customization
        if (remainingBalance < 0) {
            elements.balanceBadge.textContent = "DEFICIT";
            elements.balanceBadge.className = "card-badge badge-expense";
            elements.balanceFooterText.textContent = "Expenses exceed total income";
        } else {
            elements.balanceBadge.textContent = "AVAILABLE";
            elements.balanceBadge.className = "card-badge badge-balance";
            elements.balanceFooterText.textContent = "Potential Savings";
        }
    }

    // Render Table & Category Progress Bars based on Active Filters
    function renderTableAndBars() {
        renderCategoryBars();
        renderTransactionTable();
    }

    // Render Category Spending Analysis Bars
    function renderCategoryBars() {
        const expenseTxs = state.transactions.filter(t => t.type === 'expense');

        if (expenseTxs.length === 0) {
            elements.categoryBarsContainer.innerHTML = `
                <div class="empty-state-sm">
                    <p>No expenses recorded yet to analyze.</p>
                </div>`;
            elements.highestSpendingPill.textContent = "Highest: None";
            return;
        }

        // Group expenses by category
        const categoryTotals = {};
        let totalExpenseSum = 0;

        expenseTxs.forEach(tx => {
            const cat = tx.category || 'Other';
            const amt = parseFloat(tx.amount) || 0;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
            totalExpenseSum += amt;
        });

        // Find max spending category
        let highestCat = '';
        let highestAmt = 0;

        Object.entries(categoryTotals).forEach(([cat, amt]) => {
            if (amt > highestAmt) {
                highestAmt = amt;
                highestCat = cat;
            }
        });

        elements.highestSpendingPill.textContent = `Highest: ${highestCat} (${formatCurrency(highestAmt)})`;

        // Sort categories by amount descending
        const sortedCats = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

        elements.categoryBarsContainer.innerHTML = sortedCats.map(([cat, amt]) => {
            const percentage = totalExpenseSum > 0 ? ((amt / totalExpenseSum) * 100).toFixed(1) : 0;
            return `
                <div class="category-bar-item">
                    <div class="bar-meta">
                        <span class="bar-name">${escapeHtml(cat)}</span>
                        <span class="bar-amount">${formatCurrency(amt)} <small style="color: var(--text-muted); font-weight: normal;">(${percentage}%)</small></span>
                    </div>
                    <div class="bar-track">
                        <div class="bar-fill" style="width: ${percentage}%;"></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Render Filtered & Sorted Transaction Table
    function renderTransactionTable() {
        let list = [...state.transactions];

        // 1. Type Filter
        if (state.filterType !== 'all') {
            list = list.filter(t => t.type === state.filterType);
        }

        // 2. Category Filter
        if (state.filterCategory !== 'all') {
            list = list.filter(t => t.category === state.filterCategory);
        }

        // 3. Search Query
        if (state.searchQuery) {
            const query = state.searchQuery.toLowerCase();
            list = list.filter(t => 
                (t.description && t.description.toLowerCase().includes(query)) ||
                (t.category && t.category.toLowerCase().includes(query)) ||
                (t.type && t.type.toLowerCase().includes(query))
            );
        }

        // 4. Sorting
        list.sort((a, b) => {
            if (state.sortBy === 'newest') {
                return new Date(b.date) - new Date(a.date) || b.id - a.id;
            } else if (state.sortBy === 'oldest') {
                return new Date(a.date) - new Date(b.date) || a.id - b.id;
            } else if (state.sortBy === 'highest') {
                return parseFloat(b.amount) - parseFloat(a.amount);
            } else if (state.sortBy === 'lowest') {
                return parseFloat(a.amount) - parseFloat(b.amount);
            }
            return 0;
        });

        // Toggle Filter Status Bar
        const isFiltered = state.filterType !== 'all' || state.filterCategory !== 'all' || state.searchQuery !== '';
        if (isFiltered) {
            elements.filterStatusBar.style.display = 'flex';
            elements.filterStatusText.textContent = `Showing filtered results (${list.length} of ${state.transactions.length} transactions)`;
            elements.filteredCountBadge.textContent = `${list.length} found`;
        } else {
            elements.filterStatusBar.style.display = 'none';
        }

        // Empty state vs Table rendering
        if (list.length === 0) {
            elements.transactionTbody.innerHTML = '';
            elements.emptyState.style.display = 'flex';

            if (isFiltered) {
                elements.emptyStateMessage.textContent = "No transactions match your current search or filter criteria.";
            } else {
                elements.emptyStateMessage.textContent = "Add your first income or expense to start tracking your financial journey.";
            }
            return;
        }

        elements.emptyState.style.display = 'none';

        elements.transactionTbody.innerHTML = list.map(tx => {
            const isIncome = tx.type === 'income';
            const amountFormatted = (isIncome ? '+' : '-') + formatCurrency(tx.amount);
            const amountClass = isIncome ? 'tx-amount-income' : 'tx-amount-expense';
            const badgeClass = isIncome ? 'badge-income' : 'badge-expense';

            return `
                <tr>
                    <td>${formatDate(tx.date)}</td>
                    <td><span class="card-badge ${badgeClass}">${tx.type.toUpperCase()}</span></td>
                    <td><strong>${escapeHtml(tx.category)}</strong></td>
                    <td>${escapeHtml(tx.description || '-')}</td>
                    <td class="text-right ${amountClass}">${amountFormatted}</td>
                    <td class="text-center">
                        <div class="action-buttons">
                            <button type="button" class="btn-icon" data-action="edit" data-id="${tx.id}" title="Edit Transaction">✏️ Edit</button>
                            <button type="button" class="btn-icon btn-icon-delete" data-action="delete" data-id="${tx.id}" title="Delete Transaction">🗑️ Delete</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        // Delegate Action Buttons (Edit / Delete)
        elements.transactionTbody.querySelectorAll('button[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.getAttribute('data-action');
                const id = parseInt(e.currentTarget.getAttribute('data-id'), 10);

                if (action === 'edit') {
                    prepareEdit(id);
                } else if (action === 'delete') {
                    confirmDelete(id);
                }
            });
        });
    }

    // Prepare Edit Form
    function prepareEdit(id) {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return;

        state.editingId = id;
        elements.txId.value = tx.id;
        setFormType(tx.type);

        elements.txAmount.value = tx.amount;
        elements.txCategory.value = tx.category;
        elements.txDescription.value = tx.description || '';
        elements.txDate.value = tx.date;

        elements.formTitle.textContent = `Edit Transaction #${id}`;
        elements.btnSubmitTx.textContent = "Update Transaction";
        elements.btnCancelEdit.style.display = 'inline-flex';

        elements.transactionForm.scrollIntoView({ behavior: 'smooth' });
        elements.txAmount.focus();
    }

    // Open Delete Confirmation Modal
    function confirmDelete(id) {
        const tx = state.transactions.find(t => t.id === id);
        if (!tx) return;

        state.deletingId = id;
        elements.deleteTxPreview.innerHTML = `
            <strong>${tx.type.toUpperCase()}</strong>: ${formatCurrency(tx.amount)} &bull; ${escapeHtml(tx.category)} (${escapeHtml(tx.description || 'No description')}) on ${formatDate(tx.date)}
        `;
        elements.deleteModal.classList.add('open');
    }

    function closeDeleteModal() {
        state.deletingId = null;
        elements.deleteModal.classList.remove('open');
    }

    // Execute Delete Request
    async function executeDelete() {
        if (!state.deletingId) return;

        try {
            const res = await fetch(`/api/transactions/${state.deletingId}`, {
                method: 'DELETE'
            });
            const result = await res.json();

            if (result.success) {
                showToast("Transaction deleted successfully.", "success");
                closeDeleteModal();
                await loadTransactions();
            } else {
                showToast(result.message || "Failed to delete transaction.", "error");
            }
        } catch (err) {
            console.error("Delete error:", err);
            showToast("Server error during deletion.", "error");
        }
    }

    // Execute Clear All Request
    async function executeClearAll() {
        try {
            const res = await fetch('/api/transactions/clear', {
                method: 'POST'
            });
            const result = await res.json();

            if (result.success) {
                showToast("All data cleared successfully.", "success");
                elements.clearModal.classList.remove('open');
                await loadTransactions();
            } else {
                showToast(result.message || "Failed to clear data.", "error");
            }
        } catch (err) {
            console.error("Clear error:", err);
            showToast("Server error during data clear.", "error");
        }
    }

    // Reset Filter Controls
    function resetFilters() {
        state.filterType = 'all';
        state.filterCategory = 'all';
        state.searchQuery = '';
        state.sortBy = 'newest';

        elements.filterType.value = 'all';
        elements.filterCategory.value = 'all';
        elements.searchInput.value = '';
        elements.sortBy.value = 'newest';
        elements.searchClearBtn.style.display = 'none';

        renderTableAndBars();
    }

    // Utility: Format Currency to Indian Rupee (₹)
    function formatCurrency(amount) {
        const num = parseFloat(amount) || 0;
        return '₹' + num.toLocaleString('en-IN', {
            maximumFractionDigits: 2,
            minimumFractionDigits: num % 1 === 0 ? 0 : 2
        });
    }

    // Utility: Format Date string YYYY-MM-DD -> 29 Sep 2026
    function formatDate(dateStr) {
        if (!dateStr) return '';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;

        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const year = parts[0];
        const monthIndex = parseInt(parts[1], 10) - 1;
        const day = parseInt(parts[2], 10);

        if (monthIndex < 0 || monthIndex >= 12) return dateStr;
        return `${day} ${months[monthIndex]} ${year}`;
    }

    // Utility: Escape HTML text to prevent XSS
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Utility: Pure JS Toast Notification
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? '✅' : '⚠️';
        toast.innerHTML = `<span>${icon}</span> <span>${escapeHtml(message)}</span>`;

        elements.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3500);
    }
});
