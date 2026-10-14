import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  KanbanSquare,
  Calendar,
  CalendarDays,
  Video,
  Bell,
  MessageSquare,
  BarChart3,
  X,
  UserCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navSections = [
  {
    title: 'Workspace',
    items: [
      { name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { name: 'Teams', path: '/teams', icon: Users },
      { name: 'Projects', path: '/projects', icon: Briefcase },
      { name: 'Kanban Tasks', path: '/kanban', icon: KanbanSquare },
    ],
  },
  {
    title: 'Schedules',
    items: [
      { name: 'Personal Calendar', path: '/personal-calendar', icon: Calendar },
      { name: 'Shared Calendar', path: '/shared-calendar', icon: CalendarDays },
      { name: 'Meetings', path: '/meetings', icon: Video },
    ],
  },
  {
    title: 'Collaboration',
    items: [
      { name: 'Discussions & News', path: '/discussions', icon: MessageSquare },
      { name: 'Reminders & Alerts', path: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'Analytics & Insights',
    items: [
      { name: 'Reports & Progress', path: '/reports', icon: BarChart3 },
    ],
  },
];

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col pt-16 lg:pt-0`}
      >
        {/* Mobile Header with close button */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-slate-100 lg:hidden">
          <span className="text-sm font-bold text-slate-800">Navigation</span>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                {section.title}
              </p>
              <div className="space-y-0.5 mt-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) onClose();
                      }}
                      className={({ isActive }) =>
                        `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-brand-50 text-brand-700 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 mr-3 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin Section if applicable */}
          {user?.role === 'ADMIN' && (
            <div className="pt-2 border-t border-slate-100 space-y-1">
              <p className="px-3 text-[11px] font-semibold text-amber-600 uppercase tracking-wider">
                System Administration
              </p>
              <NavLink
                to="/admin/users"
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    isActive
                      ? 'bg-amber-50 text-amber-800 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                  }`
                }
              >
                <UserCheck className="w-4 h-4 mr-3 shrink-0 text-amber-600" />
                <span className="truncate">Manage Users</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="px-2 py-1.5 rounded-lg bg-white border border-slate-200/60 shadow-2xs">
            <p className="text-[11px] text-slate-500 font-medium">SyncSphere Core</p>
            <p className="text-[10px] text-slate-400">PostgreSQL + Express + React</p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
