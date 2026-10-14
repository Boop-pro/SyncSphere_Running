import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

const columnStyles = {
  TO_DO: {
    border: 'border-slate-300',
    indicator: 'bg-slate-400',
  },
  IN_PROGRESS: {
    border: 'border-blue-400',
    indicator: 'bg-blue-500',
  },
  COMPLETED: {
    border: 'border-emerald-400',
    indicator: 'bg-emerald-500',
  },
};

const KanbanColumn = ({ column, tasks, onSelectTask }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const taskIds = tasks.map((t) => String(t.id));
  const styleConfig = columnStyles[column.id] || columnStyles.TO_DO;

  return (
    <div
      ref={setNodeRef}
      className={`rounded-2xl p-4 flex flex-col min-h-[550px] transition-colors border ${
        isOver
          ? 'bg-brand-50/70 border-brand-300 ring-2 ring-brand-200'
          : 'bg-slate-100/70 border-slate-200/80'
      }`}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200/80">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${styleConfig.indicator}`} />
          <h3 className="text-sm font-bold text-slate-800 tracking-tight">
            {column.title}
          </h3>
        </div>
        <span className="px-2 py-0.5 text-xs font-bold bg-white text-slate-600 rounded-full border border-slate-200 shadow-2xs">
          {tasks.length}
        </span>
      </div>

      {/* Cards List inside SortableContext */}
      <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
        <div className="space-y-3 flex-1 overflow-y-auto">
          {tasks.map((task) => (
            <KanbanCard
              key={task.id}
              task={task}
              onSelectTask={onSelectTask}
            />
          ))}

          {tasks.length === 0 && (
            <div className="h-32 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-xs text-slate-400 font-medium">
              Drop tasks here
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

export default KanbanColumn;
