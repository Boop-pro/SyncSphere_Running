import React, { useState } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Info,
  Briefcase,
  Trash2,
  Plus
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import notificationApi from '../services/notificationApi';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';

const typeIcons = {
  TASK_ASSIGNMENT: Briefcase,
  TASK_REMINDER: Clock,
  MEETING_REMINDER: Calendar,
  DEADLINE_ALERT: AlertTriangle,
  OVERDUE_ALERT: AlertTriangle,
  PROJECT_UPDATE: Info,
  ANNOUNCEMENT: Bell,
};

const typeBadges = {
  TASK_ASSIGNMENT: 'bg-blue-50 text-blue-700 border-blue-200',
  TASK_REMINDER: 'bg-amber-50 text-amber-700 border-amber-200',
  MEETING_REMINDER: 'bg-purple-50 text-purple-700 border-purple-200',
  DEADLINE_ALERT: 'bg-rose-50 text-rose-700 border-rose-200',
  OVERDUE_ALERT: 'bg-red-50 text-red-700 border-red-200',
  PROJECT_UPDATE: 'bg-slate-100 text-slate-700 border-slate-200',
  ANNOUNCEMENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const NotificationsPage = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    fetchNotifications 
  } = useNotifications();

  // Create custom reminder modal
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalSuccess, setModalSuccess] = useState('');

  const handleConfigureReminder = async (e) => {
    e.preventDefault();
    if (!reminderTime) return;

    setIsSubmitting(true);
    try {
      await notificationApi.createReminder({
        triggerTime: reminderTime,
      });
      setModalSuccess('Reminder configured.');
      setReminderTime('');
      setIsReminderModalOpen(false);
      await fetchNotifications();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Reminders & Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Task reminders, meeting alerts, deadline warnings, and overdue task alerts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsReminderModalOpen(true)}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1 text-slate-500" />
            Set Reminder
          </button>

          {notifications.length > 0 && (
            <button
              onClick={markAllAsRead}
              className="inline-flex items-center px-3.5 py-1.5 text-xs font-semibold text-brand-700 bg-brand-50 border border-brand-200 rounded-lg hover:bg-brand-100 transition-colors shadow-2xs"
            >
              <CheckCheck className="w-4 h-4 mr-1.5" />
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      {loading ? (
        <LoadingSpinner size="lg" text="Retrieving alerts..." />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up!"
          description="You have no notifications or reminders at this time. Meeting alerts, task assignments, and deadline warnings will appear here."
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-2xs overflow-hidden">
          {notifications.map((item) => {
            const Icon = typeIcons[item.type] || Info;
            const badgeStyle = typeBadges[item.type] || 'bg-slate-100 text-slate-700';

            return (
              <div
                key={item.id}
                onClick={() => !item.read && markAsRead(item.id)}
                className={`p-4 flex items-start space-x-3.5 transition-colors cursor-pointer group ${
                  item.read ? 'bg-white hover:bg-slate-50/50' : 'bg-brand-50/35 hover:bg-brand-50/60'
                }`}
              >
                <div
                  className={`p-2 rounded-lg shrink-0 ${
                    item.read ? 'bg-slate-100 text-slate-500' : 'bg-brand-100 text-brand-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${badgeStyle}`}
                    >
                      {item.type?.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(item.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <p
                    className={`text-sm leading-snug ${
                      item.read ? 'text-slate-700' : 'text-slate-900 font-semibold'
                    }`}
                  >
                    {item.message}
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {!item.read && (
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-600 mt-1" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(item.id);
                    }}
                    className="p-1 text-slate-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Dismiss notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Set Reminder Modal */}
      <Modal
        isOpen={isReminderModalOpen}
        onClose={() => setIsReminderModalOpen(false)}
        title="Configure Reminder Trigger"
      >
        <form onSubmit={handleConfigureReminder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Trigger Date & Time
            </label>
            <input
              type="datetime-local"
              required
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              The automated background scheduler will convert this reminder into an in-app notification when the trigger time expires.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={() => setIsReminderModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Set Reminder'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NotificationsPage;
