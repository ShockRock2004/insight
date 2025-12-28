document.addEventListener('DOMContentLoaded', () => {
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskList = document.getElementById('task-list');
    const progress = document.getElementById('progress');
    const numbers = document.getElementById('numbers');
    const emptyState = document.getElementById('empty-state');

    let tasks = [];

    // Load tasks from local storage on startup (Optional, keeps data persistent)
    // const storedTasks = JSON.parse(localStorage.getItem('tasks'));
    // if(storedTasks) { tasks = storedTasks; updateUI(); }

    const updateStats = () => {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        const percentage = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

        progress.style.width = `${percentage}%`;
        numbers.innerText = `${completedTasks}/${totalTasks}`;

        // Toggle Empty State
        if (totalTasks === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
        }

        if (completedTasks === totalTasks && totalTasks > 0) {
            triggerConfetti();
        }
    };

    const addTask = (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (text) {
            tasks.push({ text: text, completed: false });
            taskInput.value = '';
            renderTasks();
            updateStats();
        }
    };

    const toggleTask = (index) => {
        tasks[index].completed = !tasks[index].completed;
        renderTasks();
        updateStats();
    };

    const deleteTask = (index) => {
        tasks.splice(index, 1);
        renderTasks();
        updateStats();
    };

    const renderTasks = () => {
        taskList.innerHTML = '';
        
        // Re-append empty state (hidden or shown based on CSS/Stats)
        taskList.appendChild(emptyState);

        tasks.forEach((task, index) => {
            const li = document.createElement('li');
            if (task.completed) li.classList.add('completed');

            li.innerHTML = `
                <div class="task-wrapper" onclick="toggleTask(${index})">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                    <span>${task.text}</span>
                </div>
                <button class="delete-btn" onclick="deleteTask(${index})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            `;
            
            // Attach event listeners dynamically to avoid inline HTML onclick issues
            const checkboxDiv = li.querySelector('.task-wrapper');
            checkboxDiv.addEventListener('click', (e) => {
                // Prevent double triggering if clicking directly on checkbox input
                if(e.target.tagName !== 'INPUT') {
                    toggleTask(index);
                }
            });
            
            const checkboxInput = li.querySelector('input');
            checkboxInput.addEventListener('change', () => toggleTask(index));

            const delBtn = li.querySelector('.delete-btn');
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent toggling when deleting
                deleteTask(index);
            });

            taskList.appendChild(li);
        });
    };

    const triggerConfetti = () => {
        confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#38ADA9', '#0A3D62', '#ffffff'] // January Theme Colors
        });
    };

    addTaskBtn.addEventListener('click', addTask);
    
    // Initial Render
    updateStats();
});