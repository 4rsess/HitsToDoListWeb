document.getElementById("createTaskBtn").addEventListener("click", function () {
    document.getElementById("taskModal").style.display = "block";
});

document.querySelector(".close").addEventListener("click", function () {
    document.getElementById("taskModal").style.display = "none";
});

document.getElementById("closeModal").addEventListener("click", function () {
    document.getElementById("taskDetailsModal").style.display = "none";
});

document.getElementById("submitTaskCreate").addEventListener("click", function () {
    let title = document.getElementById("taskTitle").value;
    let description = document.getElementById("taskDescription").value;
    let deadline = document.getElementById("taskDeadline").value;
    let priority = document.getElementById("taskPriority").value;

    if (!title.trim()) {
        alert("Название задачи обязательно!");
        return;
    }

    let url = new URL("http://localhost:8080/api/ToDoList/taskCreate");
    url.searchParams.append("title", title);
    if (description) url.searchParams.append("description", description);
    if (deadline) url.searchParams.append("deadline", deadline);
    if (priority) url.searchParams.append("priority", priority);

    fetch(url, {
        method: "POST",
        headers: { 
            "accept": "application/json",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({})
    })
    .then(response => response.json())
    .then(data => {
        alert(data.message);
        document.getElementById("taskModal").style.display = "none";
        location.reload();
    })
    .catch(error => console.error("Ошибка:", error));
});

document.getElementById("applyFilters").addEventListener("click", fetchTasks);

function fetchTasks(){
    let status = document.getElementById("filterStatus").value;
    let priority = document.getElementById("filterPriority").value;
    let sortDirection = document.getElementById("sortDirection").value;
    let sortByPriority = document.getElementById("sortByPriority").value;

    let url = new URL("http://localhost:8080/api/ToDoList/taskList");
    if (status) url.searchParams.append("status", status);
    if (priority) url.searchParams.append("priority", priority);
    url.searchParams.append("sortDirection", sortDirection);
    if (sortByPriority) url.searchParams.append("sortByPriority", sortByPriority);

    fetch(url)
    .then (response => response.json())
    .then(tasks => {
        renderTasks(tasks);
    })
    .catch(error => console.error("Ошибка: ", error));
}

function renderTasks(tasks) {
    let tasksField = document.getElementById("tasksField");
    tasksField.innerHTML = "";

    tasks.forEach(task => {
        let taskElement = document.createElement("div");
        taskElement.classList.add("task");
        taskElement.dataset.id = task.id;

        let isCompleted = ["completed", "late"].includes(task.status.toLowerCase());
        let isNotCompleted = task.status.toLowerCase() === "overdue";

        let deadlineDate = task.deadline ? new Date(task.deadline) : null;
        let now = new Date();
        let timeDifference = deadlineDate ? (deadlineDate - now) / (1000 * 60 * 60 * 24) : null;

        if (!isCompleted && deadlineDate) {
            if (timeDifference <= 0) {
                taskElement.style.backgroundColor = "rgba(255, 2, 2, 0.4)";
            } else if (timeDifference < 3) {
                taskElement.style.backgroundColor = "rgba(255, 157, 0, 0.4)";
            }
        }

        taskElement.innerHTML = `
            <input type="checkbox" class="task-checkbox completed" data-id="${task.id}" 
                ${isCompleted ? "checked" : ""} title="Выполнено">Выполнено

            <input type="checkbox" class="task-checkbox not-completed" data-id="${task.id}" 
                ${isNotCompleted ? "checked" : ""} title="Не выполнено">Не выполнено

            <span class="task-title">${task.title}</span>
            <span class="task-status">${task.status}</span>
            <span class="task-priority">${task.priority}</span>
            <span class="task-deadline">Дедлайн: ${task.deadline || "Не указан"}</span>
            <button class="edit-task" data-id="${task.id}">✏</button>
            <button class="delete-task" data-id="${task.id}">🗑</button>
        `;

        taskElement.addEventListener("click", showTaskDetails);
        taskElement.querySelector(".delete-task").addEventListener("click", deleteTask);
        taskElement.querySelector(".edit-task").addEventListener("click", editTask);

        taskElement.querySelector(".completed").addEventListener("change", () => updateTaskStatus(task.id, true));
        taskElement.querySelector(".not-completed").addEventListener("change", () => updateTaskStatus(task.id, false));

        tasksField.appendChild(taskElement);
    });
}



function showTaskDetails(event) {
    let taskId = event.currentTarget.dataset.id;
    fetch(`http://localhost:8080/api/ToDoList/getSpecificTask?id=${taskId}`)
        .then(response => {
            if (!response.ok) throw new Error("Задача не найдена");
            return response.json();
        })
        .then(task => {
            document.getElementById("taskDetailsTitle").textContent = task.title;
            document.getElementById("taskDetailsDescription").textContent = task.description || "Нет описания";
            document.getElementById("taskDetailsDeadline").textContent = task.deadline || "Не указан";
            document.getElementById("taskDetailsStatus").textContent = task.status;
            document.getElementById("taskDetailsPriority").textContent = task.priority;
            document.getElementById("taskDetailsCreated").textContent = task.createDate;
            document.getElementById("taskDetailsUpdated").textContent = task.updateDate;

            document.getElementById("taskDetailsModal").style.display = "block";
        })
        .catch(error => {
            alert("Ошибка: " + error.message);
        });
}

function editTask(event) {
    event.stopPropagation();
    let taskId = event.currentTarget.dataset.id;

    fetch(`http://localhost:8080/api/ToDoList/getSpecificTask?id=${taskId}`)
        .then(response => {
            if (!response.ok) throw new Error("Задача не найдена");
            return response.json();
        })
        .then(task => {
            document.getElementById("editTaskTitle").value = task.title;
            document.getElementById("editTaskDescription").value = task.description || "";
            document.getElementById("editTaskDeadline").value = task.deadline ? task.deadline.replace(" ", "T") : "";
            document.getElementById("editTaskPriority").value = task.priority;

            document.getElementById("saveTaskChanges").dataset.id = taskId;
            document.getElementById("editTaskModal").style.display = "block";
        })
        .catch(error => {
            alert("Ошибка: " + error.message);
        });
}

document.getElementById("closeEditModal").addEventListener("click", () => {
    document.getElementById("editTaskModal").style.display = "none";
});


function deleteTask(event) {
    event.stopPropagation();

    let taskId = event.target.dataset.id;

    if (!confirm("Вы уверены, что хотите удалить задачу?")) {
        return;
    }

    fetch(`http://localhost:8080/api/ToDoList/taskDelete?id=${taskId}`, {
        method: "DELETE",
        headers: { "Accept": "application/json" },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Ошибка ${response.status}: ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        alert(data.message);
        location.reload();
    })
    .catch(error => {
        console.error("Ошибка удаления:", error);
        alert("Ошибка: " + error.message);
    });
}


function updateTaskStatus(taskId, completed) {
    fetch(`http://localhost:8080/api/ToDoList/taskChangeStatus?id=${taskId}&completed=${completed}`, {
        method: "PUT",
        headers: { "Accept": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 200) {
            location.reload();
        } else {
            alert("Ошибка: " + data.message);
        }
    })
    .catch(error => console.error("Ошибка:", error));
}

document.getElementById("saveTaskChanges").addEventListener("click", function () {
    let taskId = this.dataset.id;
    let updatedTitle = document.getElementById("editTaskTitle").value;
    let updatedDescription = document.getElementById("editTaskDescription").value;
    let updatedDeadline = document.getElementById("editTaskDeadline").value;
    let updatedPriority = document.getElementById("editTaskPriority").value;

    fetch(`http://localhost:8080/api/ToDoList/taskEdit?id=${taskId}&title=${encodeURIComponent(updatedTitle)}
        &description=${encodeURIComponent(updatedDescription)}&deadline=${updatedDeadline}&priority=${updatedPriority}`, {
        method: "PUT",
        headers: { "Accept": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 200) {
            alert("Задача обновлена!");
            document.getElementById("editTaskModal").style.display = "none";
            location.reload();
        } else {
            alert("Ошибка: " + data.message);
        }
    })
    .catch(error => console.error("Ошибка:", error));
});

document.addEventListener("DOMContentLoaded", fetchTasks);