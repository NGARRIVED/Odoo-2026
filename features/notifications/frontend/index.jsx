import React, { useEffect, useState } from 'react';
import { Bell, Check, CheckCircle2, Circle } from 'lucide-react';

const API_BASE = 'http://localhost:4000';

export function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = () => {
    const token = localStorage.getItem('assetflow_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const loadNotifications = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/notifications`, { headers: authHeaders() });
      if (!response.ok) throw new Error('Failed to load notifications.');
      const data = await response.json();
      setNotifications(data.notifications);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await fetch(`${API_BASE}/api/notifications/${id}/read`, { method: 'PATCH', headers: authHeaders() });
      setNotifications(current => current.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch(`${API_BASE}/api/notifications/mark-all-read`, { method: 'PATCH', headers: authHeaders() });
      setNotifications(current => current.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading notifications...</div>;
  if (error) return <div className="p-8"><div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div></div>;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6 bg-slate-50">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brand-100 text-brand-700 rounded-lg"><Bell size={24} /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Notifications</h1>
            <p className="text-sm text-slate-600">You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 rounded-md bg-white border border-gray-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 shadow-sm">
            <Check size={16} /> Mark all as read
          </button>
        )}
      </header>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-500">You're all caught up! No notifications to show.</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {notifications.map((notification) => (
              <li key={notification.id} className={`p-4 hover:bg-slate-50 transition-colors flex items-start gap-4 ${!notification.isRead ? 'bg-brand-50/30' : ''}`}>
                <div className="mt-1">
                  {!notification.isRead ? (
                    <button onClick={() => markAsRead(notification.id)} title="Mark as read" className="text-brand-600 hover:text-brand-800"><Circle size={12} className="fill-current" /></button>
                  ) : (
                    <CheckCircle2 size={16} className="text-slate-300" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className={`text-sm ${!notification.isRead ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                      {notification.message}
                    </p>
                    <span className="text-xs text-slate-400 whitespace-nowrap ml-4">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {notification.type.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default Notifications;
