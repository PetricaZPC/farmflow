import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

function TaskManager({ fieldId, tasks, setFieldTasks }) {
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDate, setNewTaskDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const addTask = () => {
    if (!newTaskText.trim()) return;

    setFieldTasks((prev) => ({
      ...prev,
      [fieldId]: [
        ...(prev[fieldId] || []),
        {
          id: uuidv4(),
          text: newTaskText,
          dueDate: newTaskDate,
          completed: false,
          createdAt: new Date().toISOString(),
        },
      ],
    }));

    setNewTaskText("");
    setNewTaskDate(new Date().toISOString().split("T")[0]);
  };

  const toggleTaskCompletion = (taskId) => {
    setFieldTasks((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).map((task) =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      ),
    }));
  };

  const removeTask = (taskId) => {
    setFieldTasks((prev) => ({
      ...prev,
      [fieldId]: (prev[fieldId] || []).filter((task) => task.id !== taskId),
    }));
  };

  return (
    <div className="tasks-tab">
      <h3>Field Tasks</h3>
      <ul
        className="task-list"
        style={{
          listStyleType: "none",
          padding: 0,
          margin: "10px 0",
        }}
      >
        {(tasks || []).map((task) => (
          <li
            key={task.id}
            style={{
              padding: "8px",
              borderBottom: "1px solid #eee",
              display: "flex",
              alignItems: "center",
              textDecoration: task.completed ? "line-through" : "none",
              color: task.completed ? "#888" : "inherit",
            }}
          >
            <input
              type="checkbox"
              checked={task.completed}
              onChange={() => toggleTaskCompletion(task.id)}
              style={{ marginRight: "8px" }}
            />
            <span style={{ flex: 1 }}>{task.text}</span>
            <span
              style={{ fontSize: "0.8rem", color: "#666", margin: "0 10px" }}
            >
              {task.dueDate}
            </span>
            <button
              onClick={() => removeTask(task.id)}
              style={{
                background: "none",
                border: "none",
                color: "#f44336",
                cursor: "pointer",
                fontSize: "1.2rem",
              }}
            >
              ✕
            </button>
          </li>
        ))}
      </ul>

      <div style={{ display: "flex", marginTop: "10px" }}>
        <input
          type="text"
          placeholder="New task"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          style={{ flex: 1, marginRight: "5px", padding: "8px" }}
        />
        <input
          type="date"
          value={newTaskDate}
          onChange={(e) => setNewTaskDate(e.target.value)}
          style={{ width: "130px", marginRight: "5px", padding: "8px" }}
        />
        <button
          onClick={addTask}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            border: "none",
            borderRadius: "4px",
            padding: "8px 12px",
            cursor: "pointer",
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default TaskManager;
