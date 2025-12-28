document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Elements ---
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const progress = document.getElementById('progress');
    const numbers = document.getElementById('numbers');
    const emptyState = document.getElementById('empty-state'); // Ensure this ID exists in your HTML

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

        // Toggle Empty State
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

    function toggleTask(id) {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = !task.completed;
            saveData();
            // Re-render to update checkbox visual state
            renderAllTasks(); 
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
        // Re-append empty state if needed (or handle via CSS display toggling)
        if(emptyState) taskList.appendChild(emptyState);
        
        tasks.forEach(task => renderTask(task));
        updateStats();
    }

    function renderTask(task) {
        const li = document.createElement('li');
        if (task.completed) li.classList.add('completed');

        li.innerHTML = `
            <div class="task-wrapper">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span>${task.text}</span>
            </div>
            <button class="delete-btn">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;

        // Event Listeners
        const checkbox = li.querySelector('input');
        checkbox.addEventListener('change', () => toggleTask(task.id));

        const span = li.querySelector('span');
        span.addEventListener('click', () => {
            checkbox.checked = !checkbox.checked;
            toggleTask(task.id);
        });

        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTask(task.id);
        });

        taskList.appendChild(li);
        
        // Trigger simple animation
        li.style.animation = 'slideUp 0.3s ease forwards';
    }

    // --- 6. BINDINGS ---
    if(addTaskBtn) addTaskBtn.addEventListener('click', addTask);
    
    // Start App
    init();
});