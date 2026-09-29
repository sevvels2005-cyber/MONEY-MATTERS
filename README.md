# 💰 Money Matters — Personal Finance Management Application

> **Track. Understand. Manage.**

A professional, reliable, visually appealing, and beginner-understandable Personal Finance Management Application built strictly using **HTML, CSS, JavaScript, Python, Git, and GitHub**, with local data persistence powered by a **local JSON file**.

---

## 📌 Real-Life Motivation

> *"I receive scholarship money, but I was not clearly aware of where my money was being spent. I also found it difficult to understand how much I could save. So I decided to build a personal finance management system that could help me track my income, expenses, categories, and remaining balance."*

This project was built to address this real-world personal finance scenario, providing immediate visibility into income sources, daily expense habits, category distributions, and available savings.

---

## 🛠️ Technology Stack

This application strictly follows the allowed core technology stack without any external libraries, frameworks, CDNs, or third-party databases:

* **HTML5**: Semantic webpage layout and accessibility structure.
* **CSS3**: Pure custom visual design, responsive grid/flexbox, dark dashboard styling, horizontal category bars, modal dialogs, and toast notifications.
* **JavaScript (ES6)**: Form handling, input validation, financial calculations, live filtering, dynamic DOM rendering, and API communication.
* **Python 3 (Standard Library)**: Built-in `http.server` HTTP backend, request routing, data validation, and JSON file handling.
* **Local JSON (`data/transactions.json`)**: Lightweight local storage for persistent financial records.
* **Git & GitHub**: Version control and code hosting.

---

## 🏗️ Architecture

```text
               USER INTERFACE
                     │
                     v
                HTML5 + CSS3
                     │
                     v
             JAVASCRIPT (ES6)
                     │
                     v
         PYTHON LOCAL HTTP SERVER
            (python/server.py)
                     │
                     v
           BACKEND VALIDATION
                     │
                     v
          data/transactions.json
                     │
                     v
         UPDATED JSON RESPONSE
                     │
                     v
          JAVASCRIPT CALCULATIONS
                     │
                     v
        DYNAMIC DASHBOARD REFRESH
```

---

## 📂 Project Structure

```text
money-matters/
│
├── index.html              # Main single-page application structure
│
├── css/
│   └── style.css           # Complete custom dashboard styling & responsive layout
│
├── js/
│   └── script.js           # Client logic, UI rendering, calculations & fetch calls
│
├── python/
│   └── server.py           # Pure Python standard library local web & API server
│
├── data/
│   └── transactions.json   # Local persistent JSON storage file
│
├── README.md               # Comprehensive project documentation & interview guide
└── .gitignore              # Git ignore rules for temporary files
```

---

## ✨ Features

1. **Income Tracking**: Record scholarship, allowance, salary, freelance, or other income entries with amount, date, and description.
2. **Expense Tracking**: Log expenses categorized under Food, Travel, Education, Shopping, Entertainment, Bills, Health, or Other.
3. **Dynamic Dashboard Metrics**:
   * **Total Income**: Sum of all recorded income transactions (`sum(income)`).
   * **Total Expenses**: Sum of all recorded expense transactions (`sum(expenses)`).
   * **Remaining Balance**: Available funds calculated dynamically (`Total Income - Total Expenses`).
   * **Spending Percentage**: Real-time spending rate (`(Expenses / Income) * 100`).
   * **Transaction Count**: Count of active transaction records.
4. **Category Spending Breakdown**:
   * Visual progress bars representing expense totals by category.
   * Highlight indicator showing the category with the highest spending (e.g., *Highest: Food — ₹1,500*).
5. **Transaction History & Controls**:
   * Filter records by Type (*Income*, *Expense*, *All*).
   * Filter by Category (*Food*, *Travel*, *Scholarship*, etc.).
   * Live search by description, category, or type.
   * Sort by *Newest First*, *Oldest First*, *Highest Amount*, or *Lowest Amount*.
6. **Data Editing & Deletion**:
   * Edit existing records with form auto-population.
   * Delete records safely with custom confirmation dialogs.
   * Reset/Clear all data with a safety confirmation modal.
7. **Input Validation & Security**:
   * Rejects zero, negative, or invalid non-numeric amounts.
   * Sanitizes all user inputs to prevent unsafe HTML injection (XSS).
   * Performs dual-layer validation on both JavaScript frontend and Python backend.
8. **Data Persistence**:
   * All records persist in `data/transactions.json`. Stopping or restarting the Python server preserves all saved financial records.

---

## 🚀 How to Run the Application

### Prerequisites
* Python 3.x installed on your computer.
* Any modern web browser (Chrome, Edge, Firefox, Safari).

### Steps

1. **Clone or Navigate to Project Directory**:
   ```bash
   cd money-matters
   ```

2. **Start the Python Server**:
   ```bash
   python python/server.py
   ```

3. **Open the Application**:
   Open your web browser and visit:
   ```text
   http://localhost:8000/
   ```

---

## 🧪 Real-World Test Scenario (Scholarship Example)

To test the application:

1. **Add Income**:
   * **Type**: Income
   * **Amount**: `5000`
   * **Category**: Scholarship
   * **Description**: Monthly scholarship money
   * **Date**: Current Date

2. **Add Expenses**:
   * **Expense 1**: `₹1500` under **Food** (*Monthly food expense*)
   * **Expense 2**: `₹800` under **Travel** (*Commute expense*)
   * **Expense 3**: `₹700` under **Shopping** (*Personal shopping*)

3. **Verify Dashboard Output**:
   * **Total Income**: `₹5,000`
   * **Total Expenses**: `₹3,000`
   * **Remaining Balance**: `₹2,000`
   * **Spending Percentage**: `60.0%`
   * **Highest Category**: `Food — ₹1,500`

4. **Verify Restart Persistence**:
   * Stop the Python server (`Ctrl + C`).
   * Restart `python python/server.py` and refresh the browser.
   * Verify that all records and calculations remain intact.

---

## ⚠️ Limitations & Future Improvements

### Current Limitations
* Single-user local application.
* No direct bank API or payment gateway connection (intentional privacy design).
* Local storage in JSON file.

### Future Improvements
* Multi-user authentication & user profiles.
* Database server migration (e.g., PostgreSQL / SQLite).
* Monthly budgeting targets with threshold alert notifications.
* CSV export & import for transaction history.

---

## 📄 License

Developed by **Sevvel** as a Personal Finance Management project.
