import React from 'react';

const TaskList = ({ tasks, onTaskSelect }) => (
  <div className="space-y-4">
    {tasks.map((task) => (
      <div key={task.id} className="p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium">{task.clientName}</h3>
            <p className="text-sm text-gray-600">Type: {task.type}</p>
            <p className="text-sm text-gray-600">Phone: {task.clientPhone}</p>
          </div>
          <button
            onClick={() => onTaskSelect(task)}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded hover:bg-blue-200"
          >
            Process
          </button>
        </div>
      </div>
    ))}
  </div>
);

export default TaskList;