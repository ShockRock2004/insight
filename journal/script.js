document.addEventListener('DOMContentLoaded', () => {
    new JournalApp();
});

class JournalApp {
    constructor() {
        // --- 1. CORE STORAGE SETUP ---
        this.STORAGE_KEY = "journal_entries";
        
        // Load data immediately
        const stored = localStorage.getItem(this.STORAGE_KEY);
        this.entries = stored ? JSON.parse(stored) : [];
        
        this.viewState = { type: 'home', year: null, month: null };
        this.currentEditingDate = null;
        
        // Gemini Config (Preserved)
        this.backendUrl = "http://localhost:3000/analyze";

        this.init();
    }

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
    }

    // --- 2. DATA PERSISTENCE HELPER ---
    saveToStorage() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.entries));
        console.log("Journal Saved."); // Debug confirmation
    }

    cacheDOM() {
        this.dom = {
            headerTitle: document.getElementById('headerTitle'),
            backBtn: document.getElementById('backButton'),
            views: {
                home: document.getElementById('homeView'),
                months: document.getElementById('monthsView'),
                days: document.getElementById('daysView')
            },
            grids: {
                years: document.getElementById('yearsGrid'),
                months: document.getElementById('monthsGrid'),
                days: document.getElementById('daysList')
            },
            hero: {
                card: document.getElementById('newEntryCard'),
                picker: document.getElementById('heroDatePicker')
            },
            editor: {
                modal: document.getElementById('entryModal'),
                dateDisplay: document.getElementById('editorDateDisplay'),
                textarea: document.getElementById('entryContent'),
                saveBtn: document.getElementById('saveEntryBtn'),
                deleteBtn: document.getElementById('deleteEntryBtn'),
                closeBtn: document.getElementById('closeEditorBtn')
            },
            ai: {
                btn: document.getElementById('aiTriggerBtn'),
                modal: document.getElementById('aiModal'),
                content: document.getElementById('aiResultContent'),
                closeBtn: document.getElementById('closeAiBtn')
            }
        };
    }

    bindEvents() {
        // Date Picker
        if (this.dom.hero.card && this.dom.hero.picker) {
            this.dom.hero.card.addEventListener('click', (e) => {
                if (e.target === this.dom.hero.picker) return;
                if ('showPicker' in HTMLInputElement.prototype) {
                    this.dom.hero.picker.showPicker();
                } else {
                    this.dom.hero.picker.click();
                }
            });

            this.dom.hero.picker.addEventListener('change', (e) => {
                if(e.target.value) {
                    this.openEditor(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Navigation
        if (this.dom.backBtn) {
            this.dom.backBtn.addEventListener('click', () => this.navigateBack());
        }

        // Editor Controls
        this.dom.editor.closeBtn.addEventListener('click', () => this.closeEditor());
        this.dom.editor.saveBtn.addEventListener('click', () => this.saveEntry());
        this.dom.editor.deleteBtn.addEventListener('click', () => this.deleteCurrentEntry());

        // --- AUTOSAVE IMPLEMENTATION ---
        // Save whenever the user types
        this.dom.editor.textarea.addEventListener('input', () => {
            if(this.currentEditingDate) {
                this.updateEntryData(this.currentEditingDate, this.dom.editor.textarea.value);
            }
        });

        // AI Controls
        this.dom.ai.btn.addEventListener('click', () => this.triggerAI());
        this.dom.ai.closeBtn.addEventListener('click', () => this.dom.ai.modal.classList.remove('open'));
    }

    getEntry(date) {
        return this.entries.find(e => e.date === date);
    }

    getMonthName(monthIndex) { 
        const date = new Date(2000, monthIndex, 1);
        return date.toLocaleString('default', { month: 'long' });
    }

    navigateBack() {
        if (this.viewState.type === 'days') {
            this.setView('months', this.viewState.year);
        } else if (this.viewState.type === 'months') {
            this.setView('home');
        }
    }

    setView(type, year = null, month = null) {
        this.viewState = { type, year, month };
        
        Object.values(this.dom.views).forEach(el => el.classList.remove('active'));
        this.dom.backBtn.style.display = type === 'home' ? 'none' : 'flex';

        if (type === 'home') {
            this.dom.headerTitle.innerText = "Journal App";
            this.dom.views.home.classList.add('active');
            this.renderYears();
        } 
        else if (type === 'months') {
            this.dom.headerTitle.innerText = `${year} Archives`;
            this.dom.views.months.classList.add('active');
            this.renderMonths(year);
        } 
        else if (type === 'days') {
            this.dom.headerTitle.innerText = `${this.getMonthName(month)} ${year}`;
            this.dom.views.days.classList.add('active');
            this.renderDays(year, month);
        }
    }

    // --- Rendering ---
    renderYears() {
        this.dom.grids.years.innerHTML = '';
        const years = [...new Set(this.entries.map(e => e.date.split('-')[0]))].sort((a,b) => b-a);
        
        years.forEach(year => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="card-title">${year}</div>
                <div class="card-sub">${this.entries.filter(e => e.date.startsWith(year)).length} Entries</div>
                <button class="card-delete"><i class="fa-solid fa-trash"></i></button>
            `;
            
            card.addEventListener('click', (e) => {
                if(!e.target.closest('.card-delete')) this.setView('months', year);
            });

            card.querySelector('.card-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`Delete all entries from ${year}?`)) {
                    this.entries = this.entries.filter(ent => !ent.date.startsWith(year));
                    this.saveToStorage(); // PERSIST DELETE
                    this.renderYears();
                }
            });

            this.dom.grids.years.appendChild(card);
        });
    }

    renderMonths(year) {
        this.dom.grids.months.innerHTML = '';
        const entriesInYear = this.entries.filter(e => e.date.startsWith(year));
        const months = [...new Set(entriesInYear.map(e => parseInt(e.date.split('-')[1]) - 1))].sort((a,b) => a-b);

        months.forEach(monthIdx => {
            const card = document.createElement('div');
            card.className = 'item-card month-card';
            const count = entriesInYear.filter(e => parseInt(e.date.split('-')[1]) - 1 === monthIdx).length;
            
            card.innerHTML = `
                <div class="card-title">${this.getMonthName(monthIdx)}</div>
                <div class="card-sub">${count} Entries</div>
                <button class="card-delete"><i class="fa-solid fa-trash"></i></button>
            `;

            card.addEventListener('click', (e) => {
                if(!e.target.closest('.card-delete')) this.setView('days', year, monthIdx);
            });

            card.querySelector('.card-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm(`Delete ${this.getMonthName(monthIdx)} ${year}?`)) {
                    const prefix = `${year}-${String(monthIdx+1).padStart(2,'0')}`;
                    this.entries = this.entries.filter(ent => !ent.date.startsWith(prefix));
                    this.saveToStorage(); // PERSIST DELETE
                    this.renderMonths(year);
                }
            });

            this.dom.grids.months.appendChild(card);
        });
    }

    renderDays(year, month) {
        this.dom.grids.days.innerHTML = '';
        const prefix = `${year}-${String(month+1).padStart(2,'0')}`;
        const days = this.entries.filter(e => e.date.startsWith(prefix)).sort((a,b) => b.date.localeCompare(a.date));

        days.forEach(entry => {
            const card = document.createElement('div');
            card.className = 'day-card';
            card.innerHTML = `
                <div class="day-header">
                    <span class="day-date">${entry.date}</span>
                    <button class="card-delete"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="day-preview">${entry.content}</div>
            `;

            card.addEventListener('click', (e) => {
                if(!e.target.closest('.card-delete')) this.openEditor(entry.date);
            });

            card.querySelector('.card-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                if(confirm('Delete this entry?')) {
                    this.entries = this.entries.filter(e => e.date !== entry.date);
                    this.saveToStorage(); // PERSIST DELETE
                    this.renderDays(year, month);
                }
            });

            this.dom.grids.days.appendChild(card);
        });
    }

    // --- Editor Logic ---
    openEditor(date) {
        this.currentEditingDate = date;
        const entry = this.getEntry(date);
        
        this.dom.editor.dateDisplay.innerText = date;
        this.dom.editor.textarea.value = entry ? entry.content : '';
        this.dom.editor.modal.classList.add('open');
        this.dom.editor.textarea.focus();
    }

    closeEditor() {
        // Final save on close to be safe
        if(this.currentEditingDate && this.dom.editor.textarea.value.trim() !== "") {
            this.updateEntryData(this.currentEditingDate, this.dom.editor.textarea.value);
        }
        this.dom.editor.modal.classList.remove('open');
        this.currentEditingDate = null;
        
        // Refresh Current View
        if(this.viewState.type === 'home') this.renderYears();
        else if(this.viewState.type === 'months') this.renderMonths(this.viewState.year);
        else if(this.viewState.type === 'days') this.renderDays(this.viewState.year, this.viewState.month);
    }

    // Helper to update state and storage without closing modal
    updateEntryData(date, content) {
        const existingIdx = this.entries.findIndex(e => e.date === date);
        if(existingIdx > -1) {
            this.entries[existingIdx].content = content;
        } else {
            this.entries.push({ date: date, content: content, id: Date.now() });
        }
        this.saveToStorage();
    }

    // Button click handler
    saveEntry() {
        const content = this.dom.editor.textarea.value.trim();
        if(content) {
            this.updateEntryData(this.currentEditingDate, content);
            this.closeEditor();
        }
    }

    deleteCurrentEntry() {
        if(confirm("Delete this entry?")) {
            this.entries = this.entries.filter(e => e.date !== this.currentEditingDate);
            this.saveToStorage();
            this.dom.editor.modal.classList.remove('open');
            this.render(); 
        }
    }

    // --- AI Integration ---
    async triggerAI() {
        this.dom.ai.modal.classList.add('open');
        this.dom.ai.content.innerHTML = `
            <div class="loading-spinner">
                <i class="fa-solid fa-circle-notch fa-spin"></i>
                <p>Consulting Gemini...</p>
            </div>
        `;

        if(this.entries.length === 0) {
            this.dom.ai.content.innerHTML = "<p>No entries found. Write something first!</p>";
            return;
        }

        const sortedEntries = [...this.entries].sort((a,b) => a.date.localeCompare(b.date));
        let promptText = "Analyze the following journal entries chronologically. Return result in Markdown.\n\nDATA:\n";
        
        sortedEntries.forEach(e => {
            promptText += `[Date: ${e.date}] Content: ${e.content}\n`;
        });

        try {
            const response = await fetch(this.backendUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ journals: promptText })
            });

            if (!response.ok) throw new Error("Backend server unavailable");
            const data = await response.json();
            
            if(data.result) {
                this.dom.ai.content.innerHTML = marked.parse(data.result);
            } else {
                throw new Error("Invalid response");
            }

        } catch (error) {
            console.error(error);
            this.dom.ai.content.innerHTML = `<p style="color:#ff6b6b">Error: ${error.message}</p>`;
        }
    }
}