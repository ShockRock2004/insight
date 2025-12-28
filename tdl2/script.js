document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const progress = document.getElementById('progress');
    const numbers = document.getElementById('numbers');
    const emptyState = document.getElementById('empty-state');

    // --- 1. CORE STORAGE SETUP ---
    const STORAGE_KEY = "tdl2_tasks";
    let tasks = [];

    // --- 2. INITIALIZATION ---
    function init() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                tasks = JSON.parse(stored);
            } catch (e) {
                console.error("Data corruption detected, resetting tasks", e);
                tasks = [];
            }
        }
        renderAllTasks();
        updateStats();
    }

    // --- 3. PERSISTENCE HELPER ---
    function saveData() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
        updateStats();
    }

    // --- 4. CORE LOGIC ---
    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const percent = total === 0 ? 0 : (completed / total) * 100;

        if (progress) progress.style.width = `${percent}%`;
        if (numbers) numbers.innerText = `${completed} / ${total}`;

        if (emptyState) {
            emptyState.style.display = total === 0 ? 'flex' : 'none';
        }
    }

    function addTask(e) {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now(),
            text: text,
            completed: false
        };

        tasks.push(newTask);
        saveData();
        renderTask(newTask);
        
        taskInput.value = '';
    }

    // --- CONFETTI LOGIC ---
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

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveData();
            renderAllTasks();

            // STRICT LOGIC: Only fire if completing the FINAL task
            const allCompleted = tasks.length > 0 && tasks.every(t => t.completed);
            
            if (task.completed && allCompleted) {
                triggerConfetti();
            }
        }
    }

    function deleteTask(id) {
        tasks = tasks.filter(t => t.id !== id);
        saveData();
        renderAllTasks();
    }

    // --- 5. RENDERING ---
    function renderAllTasks() {
        taskList.innerHTML = '';
        if(emptyState) taskList.appendChild(emptyState);
        
        tasks.forEach(task => renderTask(task));
        updateStats();
    }

    function renderTask(task) {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        // Custom SVG Checkbox Structure (REQUIRED for CSS to work)
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

        // Event Listeners
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

    // --- 6. BINDINGS ---
    if(addTaskBtn) addTaskBtn.addEventListener('click', addTask);
    
    // Start App
    init();
});