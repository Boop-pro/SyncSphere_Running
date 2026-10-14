import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';

const COLUMNS = [
  { id: 'TO_DO', title: 'To Do' },
  { id: 'IN_PROGRESS', title: 'In Progress' },
  { id: 'COMPLETED', title: 'Completed' },
];

const KanbanBoard = ({ tasks, onStatusChange, onSelectTask }) => {
  const [activeTask, setActiveTask] = useState(null);

  // Configure sensors with 5px threshold so clicking on a card opens the modal without accidental dragging
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => String(t.id) === String(active.id));
    setActiveTask(task || null);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the task being dragged
    const draggedTask = tasks.find((t) => String(t.id) === String(activeId));
    if (!draggedTask) return;

    let targetStatus = null;

    // Check if dropped directly onto a column container
    if (['TO_DO', 'IN_PROGRESS', 'COMPLETED'].includes(overId)) {
      targetStatus = overId;
    } else {
      // Dropped onto another card: determine that card's column/status
      const targetCard = tasks.find((t) => String(t.id) === String(overId));
      if (targetCard) {
        targetStatus = targetCard.status;
      }
    }

    if (targetStatus && targetStatus !== draggedTask.status) {
      onStatusChange(draggedTask.id, targetStatus);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <KanbanColumn
              key={col.id}
              column={col}
              tasks={colTasks}
              onSelectTask={onSelectTask}
            />
          );
        })}
      </div>

      {/* Drag Overlay for smooth visual feedback */}
      <DragOverlay>
        {activeTask ? (
          <div className="rotate-2 scale-105 shadow-xl">
            <KanbanCard task={activeTask} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
