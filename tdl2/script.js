document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    // App Container
    const appContainer = document.getElementById('app-container');

    // Views
    const homeView = document.getElementById('home-view');
    const listView = document.getElementById('list-view');

    // Home Elements
    const listsGrid = document.getElementById('lists-grid');
    const addListBtn = document.getElementById('add-list-btn');

    // List Elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const progress = document.getElementById('progress');
    const numbers = document.getElementById('numbers');
    const emptyState = document.getElementById('empty-state');
    const listTitle = document.getElementById('list-title');
    const backHomeBtn = document.getElementById('back-home-btn');
    const deleteListBtn = document.getElementById('delete-list-btn');

    // Modal Elements
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalInput = document.getElementById('modal-input');
    const modalContent = document.getElementById('modal-content');
    const modalCancelBtn = document.getElementById('modal-cancel-btn');
    const modalConfirmBtn = document.getElementById('modal-confirm-btn');

    // --- 1. CORE STORAGE SETUP ---
    const STORAGE_KEY = "tdl2_app_data";
    
    let appData = {
        lists: {},
        activeListId: null
    };

    let modalCallback = null;

    // --- 2. INITIALIZATION ---
    function init() {
        const storedApp = localStorage.getItem(STORAGE_KEY);
        if (storedApp) {
            try {
                appData = JSON.parse(storedApp);
                if (!appData.lists) appData.lists = {};
            } catch (e) {
                console.error("Data corruption", e);
                appData = { lists: {}, activeListId: null };
            }
        }
        renderApp();
    }

    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    }

    // --- 3. MODAL LOGIC (CUSTOM) ---
    function openModal(title, placeholder, confirmText, initialValue, callback) {
        modalTitle.innerText = title;
        modalConfirmBtn.innerText = confirmText;
        modalCallback = callback;

        if (placeholder === null) {
            // Confirmation mode (no input)
            modalInput.style.display = 'none';
        } else {
            // Input mode
            modalInput.style.display = 'block';
            modalInput.placeholder = placeholder;
            modalInput.value = initialValue || '';
        }

        modalOverlay.classList.remove('hidden');
        setTimeout(() => modalOverlay.classList.add('active'), 10);
        
        if (placeholder !== null) {
            setTimeout(() => modalInput.focus(), 50);
        }
    }

    function closeModal() {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
            modalInput.value = '';
            modalCallback = null;
        }, 300);
    }

    function confirmModal() {
        if (modalCallback) {
            const val = modalInput.value.trim();
            modalCallback(modalInput.style.display !== 'none' ? val : true);
        }
        closeModal();
    }

    // Modal Events
    modalCancelBtn.addEventListener('click', closeModal);
    modalConfirmBtn.addEventListener('click', confirmModal);
    
    modalInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') confirmModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
            closeModal();
        }
    });

    // --- 4. VIEW LOGIC ---
    function renderApp() {
        if (appData.activeListId && appData.lists[appData.activeListId]) {
            showListView();
        } else {
            showHomeView();
        }
    }

    function showHomeView() {
        // Toggle Styles: Enable "Home Mode" (Wide, Transparent Container)
        appContainer.classList.add('home-mode');
        
        listView.classList.add('hidden');
        homeView.classList.remove('hidden');
        appData.activeListId = null;
        saveData();
        renderLists();
    }

    function showListView() {
        // Toggle Styles: Disable "Home Mode" (Return to Narrow Glass Container)
        appContainer.classList.remove('home-mode');

        homeView.classList.add('hidden');
        listView.classList.remove('hidden');
        renderCurrentList();
    }

    // --- 5. HOME SCREEN LOGIC (GRID CARDS) ---
    function renderLists() {
        listsGrid.innerHTML = '';
        const listIds = Object.keys(appData.lists);

        if (listIds.length === 0) {
            listsGrid.innerHTML = '<div class="empty-state" style="grid-column: span 2"><p>No lists yet. Add one!</p></div>';
            return;
        }

        listIds.forEach(id => {
            const list = appData.lists[id];
            const total = list.tasks.length;
            const active = list.tasks.filter(t => !t.completed).length;
            const completed = total - active;
            
            // Progress Calculation
            const percent = total === 0 ? 0 : (completed / total) * 100;
            
            const div = document.createElement('div');
            div.className = 'dashboard-card';
            
            // MODIFIED: ICON (Checklist style)
            div.innerHTML = `
                <div class="card-top">
                    <i class="fa-solid fa-list-check card-icon-small"></i>
                    <span class="card-title-home">${list.name}</span>
                </div>
                
                <div class="mini-progress-track">
                    <div class="mini-progress-fill" style="width: ${percent}%"></div>
                </div>
            `;
            
            div.addEventListener('click', () => {
                appData.activeListId = id;
                saveData();
                showListView();
            });

            listsGrid.appendChild(div);
        });
    }

    function promptNewList() {
        openModal(
            "Create New List", 
            "List Name (e.g., Groceries)", 
            "Create", 
            "",
            (name) => {
                if (name) {
                    const id = Date.now().toString();
                    appData.lists[id] = { name: name, tasks: [] };
                    saveData();
                    renderLists();
                }
            }
        );
    }

    // --- 6. TASK LIST LOGIC ---
    function renderCurrentList() {
        const listId = appData.activeListId;
        const list = appData.lists[listId];
        
        if (!list) {
            showHomeView();
            return;
        }

        listTitle.innerText = list.name;
        
        taskList.innerHTML = '';
        if(emptyState) {
            emptyState.style.display = list.tasks.length === 0 ? 'flex' : 'none';
            if (list.tasks.length === 0) taskList.appendChild(emptyState);
        }

        list.tasks.forEach(task => renderTaskItem(task));
        updateStats();
    }

    function renderTaskItem(task) {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        li.innerHTML = `
            <div class="task-wrapper">
                <label class="custom-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="checkmark-bg"></span>
                    <svg class="checkmark-svg" viewBox="0 0 24 24">
                        <path d="M20 6L9 17L4 12"></path>
                    </svg>
                </label>
                <span class="task-text">${task.text}</span>
            </div>
            <button class="delete-btn">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const textSpan = li.querySelector('.task-text');
        textSpan.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            toggleTask(task.id);
        });

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        taskList.appendChild(li);
    }

    function addTask(e) {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text || !appData.activeListId) return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };

        appData.lists[appData.activeListId].tasks.push(newTask);
        saveData();
        renderCurrentList();
        
        taskInput.value = '';
    }

    function deleteTask(taskId) {
        if (!appData.activeListId) return;
        const list = appData.lists[appData.activeListId];
        list.tasks = list.tasks.filter(t => t.id !== taskId);
        saveData();
        renderCurrentList();
    }

    function toggleTask(taskId) {
        if (!appData.activeListId) return;
        const list = appData.lists[appData.activeListId];
        const task = list.tasks.find(t => t.id === taskId);
        
        if (task) {
            task.completed = !task.completed;
            saveData();
            renderCurrentList();

            const allCompleted = list.tasks.length > 0 && list.tasks.every(t => t.completed);
            if (task.completed && allCompleted) {
                triggerConfetti();
            }
        }
    }

    function updateStats() {
        if (!appData.activeListId) return;
        const list = appData.lists[appData.activeListId];
        
        const total = list.tasks.length;
        const completed = list.tasks.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : (completed / total) * 100;

        if (progress) progress.style.width = `${percent}%`;
        if (numbers) numbers.innerText = `${completed} / ${total}`;
    }

    function promptRenameList() {
        if (!appData.activeListId) return;
        const currentName = appData.lists[appData.activeListId].name;
        
        openModal(
            "Rename List", 
            "New Name", 
            "Save", 
            currentName,
            (newName) => {
                if (newName) {
                    appData.lists[appData.activeListId].name = newName.trim();
                    saveData();
                    renderCurrentList();
                }
            }
        );
    }

    function promptDeleteList() {
        if (!appData.activeListId) return;
        
        openModal(
            "Delete List?", 
            null, // No input placeholder = confirmation mode
            "Delete", 
            null,
            (confirmed) => {
                if (confirmed) {
                    delete appData.lists[appData.activeListId];
                    showHomeView();
                }
            }
        );
    }

    function triggerConfetti() {
        const colors = ['#38ADA9', '#0A3D62', '#ffffff'];
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors,
            disableForReducedMotion: true,
            gravity: 0.8,
            scalar: 0.9,
            ticks: 300
        });
    }

    // --- 7. BINDINGS ---
    if(addListBtn) addListBtn.addEventListener('click', promptNewList);
    if(addTaskBtn) addTaskBtn.addEventListener('click', addTask);
    if(backHomeBtn) backHomeBtn.addEventListener('click', showHomeView);
    if(listTitle) listTitle.addEventListener('click', promptRenameList);
    if(deleteListBtn) deleteListBtn.addEventListener('click', promptDeleteList);
    
    init();
});