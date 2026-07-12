import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  CheckCheck,
  Download,
  Filter,
  Search,
  ShieldAlert,
  ShieldCheck,
  TriangleAlert,
  CalendarClock,
} from 'lucide-react';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
} from '../../../shared/ui-components';
import ActivityLog from './ActivityLog';

const API_BASE = 'http://localhost:4000/api';

const viewOptions = [
  { label: 'All Notifications', value: 'all' },
  { label: 'Critical Alerts', value: 'critical' },
  { label: 'Approvals', value: 'approval' },
  { label: 'Bookings', value: 'booking' },
  { label: 'Maintenance', value: 'maintenance' },
];

const dateOptions = [
  { label: 'Last 7 Days', value: '7d' },
  { label: 'Last 30 Days', value: '30d' },
  { label: 'This Quarter', value: 'quarter' },
];

function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function downloadCsv(rows, fileName) {
  const escapeValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const header = ['Timestamp', 'Type', 'Title', 'Message', 'Asset', 'Status', 'Read'];
  const csvRows = [
    header.join(','),
    ...rows.map((row) => [
      row.timestamp,
      row.type,
      row.title,
      row.message,
      row.asset,
      row.status,
      row.unread ? 'No' : 'Yes',
    ].map(escapeValue).join(',')),
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function SummaryCard({ icon: Icon, label, value, hint, accent = 'brand' }) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
            <div className="mt-2 text-3xl font-semibold text-gray-950">{value}</div>
            <p className="mt-2 text-sm text-gray-500">{hint}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent === 'danger' ? 'bg-red-50 text-red-600' : accent === 'warning' ? 'bg-amber-50 text-amber-600' : accent === 'success' ? 'bg-green-50 text-green-600' : 'bg-brand-50 text-brand-700'}`}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function isWithinRange(timestamp, range) {
  const now = new Date();
  const createdAt = new Date(timestamp);
  const diffDays = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);

  if (range === '7d') return diffDays <= 7;
  if (range === '30d') return diffDays <= 30;
  return diffDays <= 90;
}

function getLeadingIcon(item) {
  if (item.category === 'critical') return AlertTriangle;
  if (item.category === 'approval' || item.request) return ShieldAlert;
  if (item.category === 'booking') return CalendarClock;
  if (item.category === 'maintenance') return ShieldCheck;
  return ArrowRightLeft;
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [stats, setStats] = useState({ total: 0, unread: 0, critical: 0, approvals: 0, bookings: 0, maintenance: 0 });
  const [viewCounts, setViewCounts] = useState({ all: 0, critical: 0, approval: 0, booking: 0, maintenance: 0 });
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [visibleCount, setVisibleCount] = useState(4);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNotifications = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/notifications`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load notifications');
      }

      setNotifications(payload.notifications || []);
      setActivityLogs(payload.activityLogs || []);
      setStats(payload.stats || stats);
      setViewCounts(payload.viewCounts || viewCounts);
      setVisibleCount(4);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesView = view === 'all' || notification.category === view;
      const matchesSearch = !query || [notification.title, notification.message, notification.asset, notification.tag]
        .some((field) => String(field).toLowerCase().includes(query));
      const matchesRange = isWithinRange(notification.timestamp, dateRange);

      return matchesView && matchesSearch && matchesRange;
    });
  }, [notifications, search, view, dateRange]);

  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const unreadCount = stats.unread;

  const exportLogs = () => {
    const rows = [...notifications, ...activityLogs].map((item) => ({
      timestamp: item.timestamp,
      type: item.type || item.category || 'activity',
      title: item.title,
      message: item.message || item.description,
      asset: item.asset || item.entity,
      status: item.tag,
      unread: item.unread || false,
    }));

    downloadCsv(rows, 'assetflow-notification-log.csv');
  };

  const updateReadState = async (id, isRead) => {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isRead })
    });

    loadNotifications();
  };

  const markAllRead = async () => {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    });

    loadNotifications();
  };

  const handleDecision = async (item, decision) => {
    await fetch(`${API_BASE}/notifications/transfer-requests/${item.relatedEntityId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision })
    });

    loadNotifications();
  };

  const handleLoadMore = () => {
    setVisibleCount((count) => Math.min(count + 3, filteredNotifications.length));
  };

  const summaryCards = [
    { label: 'All Notifications', value: stats.total, hint: `${unreadCount} unread items require attention`, icon: Bell, accent: 'brand' },
    { label: 'Critical Alerts', value: stats.critical, hint: 'Hardware, safety, and service outages', icon: AlertTriangle, accent: 'danger' },
    { label: 'Approvals', value: stats.approvals, hint: 'Transfer decisions awaiting action', icon: ShieldAlert, accent: 'warning' },
    { label: 'Bookings', value: stats.bookings, hint: 'New reservations and room releases', icon: CalendarClock, accent: 'success' },
  ];

  const viewOptionsWithCounts = viewOptions.map((option) => ({
    ...option,
    count: viewCounts[option.value] ?? 0
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-brand-50/40 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 shadow-sm">
            <Bell size={14} /> Activity Logs & Notifications
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 lg:text-4xl">Activity Logs & Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">System events, alerts, approvals, and notification history stored in Prisma.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={exportLogs}>
            <Download size={16} className="mr-2" /> Export Logs
          </Button>
          <Button onClick={markAllRead}>
            <CheckCheck size={16} className="mr-2" /> Mark All Read
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Views</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {viewOptionsWithCounts.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    setView(option.value);
                    setVisibleCount(4);
                  }}
                  className={`flex w-full items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors ${view === option.value ? 'border-brand-300 bg-brand-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
                >
                  <span className="text-sm font-medium text-gray-900">{option.label}</span>
                  <Badge variant={view === option.value ? 'brand' : 'default'}>{option.count}</Badge>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Filters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Search logs"
                placeholder="Search logs and events..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                icon={Search}
              />
              <Select
                label="Date Range"
                value={dateRange}
                onChange={(event) => setDateRange(event.target.value)}
                options={dateOptions}
              />
              <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 font-medium text-gray-900">
                  <Filter size={16} /> Smart filters
                </div>
                <p className="mt-2">Use the view presets, search, and date range to isolate critical alerts, approvals, and operational events.</p>
              </div>
            </CardContent>
          </Card>
        </aside>

        <main className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-200 bg-white/80">
              <div>
                <CardTitle className="text-base">All Notifications</CardTitle>
                <p className="text-sm text-gray-500">Showing latest {Math.min(visibleNotifications.length, filteredNotifications.length)} events</p>
              </div>
              <Badge variant="default">{filteredNotifications.length} filtered</Badge>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center text-sm text-gray-500">Loading notifications from the database...</div>
              ) : error ? (
                <div className="p-8 text-center text-sm text-alert">{error}</div>
              ) : visibleNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No notifications match your current filters.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {visibleNotifications.map((item) => {
                    const Icon = getLeadingIcon(item);

                    return (
                      <article key={item.id} className="flex gap-4 border-l-4 border-l-transparent px-6 py-5 transition-colors hover:bg-gray-50/80" style={item.unread ? { borderLeftColor: '#dc2626' } : undefined}>
                        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${item.tagVariant === 'danger' ? 'bg-red-50 text-red-600' : item.tagVariant === 'warning' ? 'bg-amber-50 text-amber-600' : item.tagVariant === 'success' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                          <Icon size={18} />
                        </div>

                        <div className="min-w-0 flex-1 space-y-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="space-y-1">
                              <h3 className="font-semibold text-gray-950">{item.title}</h3>
                              <p className="text-sm text-gray-600">{item.message}</p>
                            </div>
                            <div className="text-right text-xs text-gray-500">{formatTime(item.timestamp)}</div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge variant={item.tagVariant || 'default'}>{item.tag}</Badge>
                            <Badge variant={item.unread ? 'danger' : 'default'}>{item.unread ? 'Unread' : 'Read'}</Badge>
                            <span className="text-xs text-gray-500">{item.asset}</span>
                          </div>

                          {item.request ? (
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" onClick={() => handleDecision(item, 'APPROVED')}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDecision(item, 'REJECTED')}>
                                Deny
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="ghost" onClick={() => updateReadState(item.id, false)}>
                                Mark Read
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => updateReadState(item.id, true)}>
                                Mark Unread
                              </Button>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {!loading && !error && visibleNotifications.length < filteredNotifications.length ? (
                <div className="border-t border-gray-200 p-4 text-center">
                  <Button variant="ghost" onClick={handleLoadMore}>Load More</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="p-6">
            <ActivityLog
              logs={activityLogs}
              onLoadMore={handleLoadMore}
              visibleCount={visibleNotifications.length}
              totalCount={filteredNotifications.length}
            />
          </Card>
        </main>
      </div>
    </div>
  );
}
