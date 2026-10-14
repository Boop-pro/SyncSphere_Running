import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Calendar, MessageSquare, Paperclip, GripVertical } from 'lucide-react';

const priorityBadges = {
  HIGH: 'bg-rose-50 text-rose-700 border-rose-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const KanbanCard = ({ task, onSelectTask }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: String(task.id),
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs hover:shadow-xs transition-shadow space-y-2.5 group cursor-pointer relative"
      onClick={() => onSelectTask && onSelectTask(task)}
    >
      {/* Top Header: Priority badge & Drag Handle */}
      <div className="flex items-center justify-between">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
            priorityBadges[task.priority] || priorityBadges.MEDIUM
          }`}
        >
          {task.priority}
        </span>

        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          onClick={(e) => e.stopPropagation()}
          className="text-slate-300 hover:text-slate-600 p-1 cursor-grab active:cursor-grabbing rounded focus:outline-none"
          aria-label="Drag task"
        >
          <GripVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Title */}
      <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">
        {task.title}
      </h4>

      {/* Description Snippet */}
      {task.desc && (
        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {task.desc}
        </p>
      )}

      {/* Footer Info: Due Date, Comments, Attachments & Assignees */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center space-x-2.5">
          <span className="flex items-center text-[11px]">
            <Calendar className="w-3 h-3 mr-1 text-slate-400" />
            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
          </span>

          {task.comments?.length > 0 && (
            <span className="flex items-center text-[11px]">
              <MessageSquare className="w-3 h-3 mr-0.5" />
              {task.comments.length}
            </span>
          )}

          {task.files?.length > 0 && (
            <span className="flex items-center text-[11px]">
              <Paperclip className="w-3 h-3 mr-0.5" />
              {task.files.length}
            </span>
          )}
        </div>

        {/* Assignee Avatars */}
        {task.assignees?.length > 0 && (
          <div className="flex -space-x-1.5 overflow-hidden">
            {task.assignees.slice(0, 3).map((a) => (
              <div
                key={a.id}
                title={a.user?.fullName}
                className="w-5 h-5 rounded-full bg-brand-100 text-brand-700 font-bold text-[9px] flex items-center justify-center border border-white"
              >
                {a.user?.fullName?.charAt(0) || 'U'}
              </div>
            ))}
            {task.assignees.length > 3 && (
              <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-600 font-bold text-[9px] flex items-center justify-center border border-white">
                +{task.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanCard;
