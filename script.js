// Get elements
const toggleModalBtn = document.getElementById('toggle-modal');
const modal = document.querySelector('.modal');
const addTaskBtn = document.getElementById('add-new-task');
const closeModalBtn = document.getElementById('close-modal');
const taskTitleInput = document.getElementById('task-title');
const taskDescriptionInput = document.getElementById('task-description');
const taskPriorityInput = document.getElementById('task-priority');
const columns = Array.from(document.querySelectorAll('.task-column'));

// Theme toggle
const themeToggleBtn = document.getElementById('theme-toggle');

// About modal elements
const aboutLink = document.getElementById('about-link');
const aboutModal = document.querySelector('.about-modal');
const closeAboutBtn = document.getElementById('close-about');
const aboutBg = aboutModal.querySelector('.bg');

let currentEditTaskId = null;

// Function to update counts and metrics
function updateMetrics() {
    let totalCards = 0;
    let completed = 0;
    columns.forEach(col => {
        const count = col.querySelectorAll('.task').length;
        col.querySelector('.count').textContent = count;
        totalCards += count;
        if (col.id === 'done') completed = count;
    });
    document.getElementById('total-cards').textContent = totalCards;
    document.getElementById('completed-count').textContent = completed;
    document.getElementById('wip-health').textContent =
        columns.filter(col => col.id !== 'done')
            .reduce((sum, col) => sum + col.querySelectorAll('.task').length, 0);
}

function saveTasks() {
    const tasks = [];
    columns.forEach(col => {
        col.querySelectorAll('.task').forEach(taskEl => {
            let priority = 'low';
            if (taskEl.classList.contains('medium')) priority = 'medium';
            if (taskEl.classList.contains('high')) priority = 'high';
            
            tasks.push({
                id: taskEl.id,
                title: taskEl.querySelector('h2').textContent,
                description: taskEl.querySelector('p').textContent,
                priority: priority,
                columnId: col.id
            });
        });
    });
    localStorage.setItem('kanbanTasks', JSON.stringify(tasks));
}

function loadTasks() {
    const saved = localStorage.getItem('kanbanTasks');
    if (saved) {
        document.querySelectorAll('.task').forEach(t => t.remove());
        const tasks = JSON.parse(saved);
        tasks.forEach(taskData => {
            const task = document.createElement('div');
            task.className = `task ${taskData.priority}`;
            task.draggable = true;
            task.id = taskData.id;
            task.innerHTML = `
                <h2>${taskData.title}</h2>
                <p>${taskData.description}</p>
                <div class="task-actions">
                    <button class="edit-btn">Edit</button>
                    <button class="delete-btn">Delete</button>
                </div>
            `;
            attachTaskEvents(task);
            const targetCol = document.getElementById(taskData.columnId);
            if(targetCol) targetCol.appendChild(task);
        });
    }
}

// Function to attach task events
function attachTaskEvents(task) {
    task.addEventListener('dragstart', () => {
        task.classList.add('dragging');
    });

    task.addEventListener('dragend', () => {
        task.classList.remove('dragging');
    });

    const deleteButton = task.querySelector('.delete-btn');
    if (deleteButton) {
        deleteButton.addEventListener('click', () => {
            task.remove();
            updateMetrics();
            saveTasks();
        });
    }

    const editButton = task.querySelector('.edit-btn');
    if (editButton) {
        editButton.addEventListener('click', () => {
            currentEditTaskId = task.id;
            document.getElementById('modal-title').textContent = 'Edit Task';
            taskTitleInput.value = task.querySelector('h2').textContent;
            taskDescriptionInput.value = task.querySelector('p').textContent;
            
            let priority = 'low';
            if (task.classList.contains('medium')) priority = 'medium';
            if (task.classList.contains('high')) priority = 'high';
            taskPriorityInput.value = priority;
            
            modal.classList.add('active');
        });
    }
}

// Toggle modal visibility (existing)
toggleModalBtn.addEventListener('click', () => {
    currentEditTaskId = null;
    document.getElementById('modal-title').textContent = 'Add Task';
    taskTitleInput.value = '';
    taskDescriptionInput.value = '';
    taskPriorityInput.value = 'low';
    modal.classList.add('active');
});

// Close modal
closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
});

// Add or Edit task
addTaskBtn.addEventListener('click', () => {
    const title = taskTitleInput.value.trim();
    const description = taskDescriptionInput.value.trim();
    const priority = taskPriorityInput.value;

    if (!title || !description) return;

    if (currentEditTaskId) {
        const task = document.getElementById(currentEditTaskId);
        task.querySelector('h2').textContent = title;
        task.querySelector('p').textContent = description;
        task.classList.remove('low', 'medium', 'high');
        task.classList.add(priority);
    } else {
        const task = document.createElement('div');
        task.className = `task ${priority}`;
        task.draggable = true;
        task.id = `task-${Date.now()}`;
        task.innerHTML = `
            <h2>${title}</h2>
            <p>${description}</p>
            <div class="task-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        `;
        attachTaskEvents(task);
        document.getElementById('todo').appendChild(task);
    }

    taskTitleInput.value = '';
    taskDescriptionInput.value = '';
    taskPriorityInput.value = 'low';
    currentEditTaskId = null;
    modal.classList.remove('active');
    updateMetrics();
    saveTasks();
});

// Handle existing tasks
document.querySelectorAll('.task').forEach(task => {
    attachTaskEvents(task);
});

// Drag-and-drop functionality (updated for dynamic columns)
function setupDragDrop() {
    columns.forEach(column => {
        column.addEventListener('dragover', e => e.preventDefault());
        column.addEventListener('dragenter', e => {
            e.preventDefault();
            column.classList.add('hover-over');
        });
        column.addEventListener('dragleave', () => column.classList.remove('hover-over'));
        column.addEventListener('drop', e => {
            e.preventDefault();
            column.classList.remove('hover-over');
            const dragging = document.querySelector('.task.dragging');
            if (dragging) {
                column.appendChild(dragging);
                updateMetrics();
                saveTasks();
            }
        });
    });
}

document.addEventListener('dragstart', (e) => {
    if (e.target.classList.contains('task')) {
        e.dataTransfer.setData('text/plain', e.target.id);
    }
});

document.addEventListener('dragend', (e) => {
    // Handled by CSS class .dragging
});

// Theme toggle functionality
function loadTheme() {
    const theme = localStorage.getItem('theme') || 'dark';
    if (theme === 'light') {
        document.body.classList.add('light-mode');
        themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    } else {
        document.body.classList.remove('light-mode');
        themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    }
    setTimeout(() => lucide.createIcons(), 0);
}

themeToggleBtn.addEventListener('click', () => {
    const isLight = document.body.classList.contains('light-mode');
    if (isLight) {
        document.body.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
        themeToggleBtn.innerHTML = '<i data-lucide="sun"></i>';
    } else {
        document.body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
        themeToggleBtn.innerHTML = '<i data-lucide="moon"></i>';
    }
    setTimeout(() => lucide.createIcons(), 0);
});

// Initial setup
loadTasks();
loadTheme();
updateMetrics();
setupDragDrop();

// About modal functionality
aboutLink.addEventListener('click', (e) => {
    e.preventDefault();
    aboutModal.classList.add('show');
});

closeAboutBtn.addEventListener('click', () => {
    aboutModal.classList.remove('show');
});

aboutBg.addEventListener('click', () => {
    aboutModal.classList.remove('show');
});

// Close about modal on Escape key
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        aboutModal.classList.remove('show');
        modal.classList.remove('active');
    }
});