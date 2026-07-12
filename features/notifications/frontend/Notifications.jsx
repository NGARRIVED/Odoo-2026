import React, { useMemo, useState } from 'react';
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

const initialNotifications = [
  {
    id: 'notif-1',
    type: 'critical',
    category: 'critical',
    title: 'Server Rack Cooling Failure',
    message:
      'Temperature threshold exceeded on Rack A4, Data Center 2. Immediate maintenance required to prevent hardware damage.',
    asset: 'Asset: SR-2049',
    timestamp: '2026-07-12T10:42:00',
    unread: true,
    icon: 'critical',
    tag: 'Critical',
    tagVariant: 'danger',
  },
  {
    id: 'notif-2',
    type: 'approval',
    category: 'approval',
    title: 'Asset Transfer Request',
    message: "Sarah Jenkins requested transfer of 'MacBook Pro M2' from IT Dept to Marketing.",
    asset: 'Awaiting approval',
    timestamp: '2026-07-12T09:15:00',
    unread: true,
    icon: 'approval',
    tag: 'Pending',
    tagVariant: 'warning',
    request: true,
  },
  {
    id: 'notif-3',
    type: 'booking',
    category: 'booking',
    title: 'Conference Room C Booked',
    message: "Booked by Engineering Team for 'Quarterly Planning'.",
    asset: '14:00 - 16:00 today',
    timestamp: '2026-07-12T08:30:00',
    unread: false,
    icon: 'booking',
    tag: 'Booking',
    tagVariant: 'success',
  },
  {
    id: 'notif-4',
    type: 'maintenance',
    category: 'maintenance',
    title: 'Routine Maintenance Completed',
    message: 'Quarterly HVAC inspection completed for Building A. No issues found.',
    asset: 'Completed smoothly',
    timestamp: '2026-07-11T16:45:00',
    unread: false,
    icon: 'maintenance',
    tag: 'Resolved',
    tagVariant: 'default',
  },
  {
    id: 'notif-5',
    type: 'audit',
    category: 'approval',
    title: 'Audit Discrepancy Escalated',
    message: 'Three unverified assets moved to escalation queue for manual inspection.',
    asset: 'Audit cycle Q3-26',
    timestamp: '2026-07-11T13:10:00',
    unread: true,
    icon: 'security',
    tag: 'Escalated',
    tagVariant: 'danger',
  },
  {
    id: 'notif-6',
    type: 'booking',
    category: 'booking',
    title: 'Training Pod Released',
    message: 'Room B3 is now available again after the dev onboarding workshop.',
    asset: 'Available for booking',
    timestamp: '2026-07-11T11:20:00',
    unread: false,
    icon: 'booking',
    tag: 'Availability',
    tagVariant: 'success',
  },
];

const activitySeed = [
  {
    id: 'log-1',
    group: 'Today',
    icon: 'alert',
    title: 'Critical alert routed to maintenance',
    description: 'Cooling failure on Rack A4 was assigned to Facilities and marked urgent.',
    actor: 'System',
    entity: 'Rack A4 / SR-2049',
    timestamp: '2026-07-12T10:42:00',
    tag: 'Critical',
    tagVariant: 'danger',
  },
  {
    id: 'log-2',
    group: 'Today',
    icon: 'transfer',
    title: 'Transfer approval requested',
    description: 'Sarah Jenkins requested an allocation move from IT to Marketing.',
    actor: 'Sarah Jenkins',
    entity: 'MacBook Pro M2',
    timestamp: '2026-07-12T09:15:00',
    tag: 'Approval',
    tagVariant: 'warning',
  },
  {
    id: 'log-3',
    group: 'Today',
    icon: 'booking',
    title: 'Meeting room booking confirmed',
    description: 'Engineering reserved Conference Room C for quarterly planning.',
    actor: 'Engineering Team',
    entity: 'Conference Room C',
    timestamp: '2026-07-12T08:30:00',
    tag: 'Booking',
    tagVariant: 'success',
  },
  {
    id: 'log-4',
    group: 'Yesterday',
    icon: 'maintenance',
    title: 'Quarterly HVAC maintenance completed',
    description: 'Inspection closed with no issues and the work order marked resolved.',
    actor: 'Facilities',
    entity: 'Building A',
    timestamp: '2026-07-11T16:45:00',
    tag: 'Resolved',
    tagVariant: 'default',
  },
  {
    id: 'log-5',
    group: 'Yesterday',
    icon: 'audit',
    title: 'Audit discrepancy escalated',
    description: 'Three missing items moved into the escalation queue for review.',
    actor: 'Audit Team',
    entity: 'Q3-26 cycle',
    timestamp: '2026-07-11T13:10:00',
    tag: 'Escalated',
    tagVariant: 'danger',
  },
  {
    id: 'log-6',
    group: 'This Week',
    icon: 'system',
    title: 'Mass notification digest sent',
    description: 'A daily digest was sent to department heads and asset managers.',
    actor: 'Notifications Service',
    entity: 'Digest job',
    timestamp: '2026-07-09T08:00:00',
    tag: 'System',
    tagVariant: 'brand',
  },
];

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

export default function Notifications() {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [search, setSearch] = useState('');
  const [view, setView] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [visibleCount, setVisibleCount] = useState(4);

  const stats = useMemo(() => ({
    total: 124,
    critical: notifications.filter((item) => item.type === 'critical' || item.tagVariant === 'danger').length + 2,
    approvals: notifications.filter((item) => item.category === 'approval').length + 6,
    bookings: notifications.filter((item) => item.category === 'booking').length + 8,
  }), [notifications]);

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return notifications.filter((notification) => {
      const matchesView = view === 'all' || notification.type === view || notification.category === view;
      const matchesSearch = !query || [notification.title, notification.message, notification.asset].some((field) => field.toLowerCase().includes(query));
      return matchesView && matchesSearch;
    });
  }, [notifications, search, view]);

  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const unreadCount = notifications.filter((notification) => notification.unread).length;

  const setNotificationReadState = (id, unread) => {
    setNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, unread } : notification)));
  };

  const handleApprove = (id) => {
    setNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, unread: false, tag: 'Approved', tagVariant: 'success', message: `${notification.message} Approved by operations.` } : notification)));
  };

  const handleDeny = (id) => {
    setNotifications((current) => current.map((notification) => (notification.id === id ? { ...notification, unread: false, tag: 'Denied', tagVariant: 'danger', message: `${notification.message} Request denied.` } : notification)));
  };

  const handleMarkAllRead = () => {
    setNotifications((current) => current.map((notification) => ({ ...notification, unread: false })));
  };

  const handleExport = () => {
    downloadCsv(
      [
        ...notifications.map((item) => ({
          timestamp: formatTime(item.timestamp),
          type: item.type,
          title: item.title,
          message: item.message,
          asset: item.asset,
          status: item.tag,
          unread: item.unread,
        })),
        ...activitySeed.map((item) => ({
          timestamp: formatTime(item.timestamp),
          type: item.icon,
          title: item.title,
          message: item.description,
          asset: item.entity,
          status: item.tag,
          unread: false,
        })),
      ],
      'assetflow-notification-log.csv'
    );
  };

  const handleLoadMore = () => {
    setVisibleCount((count) => Math.min(count + 3, filteredNotifications.length));
  };

  const summaryCards = [
    { label: 'All Notifications', value: stats.total, hint: `${unreadCount} unread items require attention`, icon: Bell, accent: 'brand' },
    { label: 'Critical Alerts', value: stats.critical, hint: 'Hardware, safety, and service outages', icon: AlertTriangle, accent: 'danger' },
    { label: 'Approvals', value: stats.approvals, hint: 'Transfer, maintenance, and audit actions', icon: ShieldCheck, accent: 'warning' },
    { label: 'Bookings', value: stats.bookings, hint: 'New reservations and room releases', icon: CalendarClock, accent: 'success' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-brand-50/40 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 shadow-sm">
            <Bell size={14} /> Activity Logs & Notifications
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 lg:text-4xl">Activity Logs & Notifications</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">System events, alerts, approvals, and notification history in one place.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <Download size={16} className="mr-2" /> Export Logs
          </Button>
          <Button onClick={handleMarkAllRead}>
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
              {viewOptions.map((option) => {
                const count = option.value === 'all'
                  ? notifications.length
                  : notifications.filter((item) => item.type === option.value || item.category === option.value).length;

                return (
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
                    <Badge variant={view === option.value ? 'brand' : 'default'}>{count}</Badge>
                  </button>
                );
              })}
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
                icon={<Search size={16} />}
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
              {visibleNotifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No notifications match your current filters.</div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {visibleNotifications.map((item) => {
                    const leadingIcon = item.icon === 'critical' ? AlertTriangle : item.icon === 'approval' ? ShieldAlert : item.icon === 'booking' ? CalendarClock : ArrowRightLeft;
                    const Icon = leadingIcon;

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
                              <Button size="sm" onClick={() => handleApprove(item.id)}>
                                Approve
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => handleDeny(item.id)}>
                                Deny
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setNotificationReadState(item.id, false)}>
                                Mark Read
                              </Button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              <Button size="sm" variant="ghost" onClick={() => setNotificationReadState(item.id, false)}>
                                Mark Read
                              </Button>
                              <Button size="sm" variant="outline" onClick={() => setNotificationReadState(item.id, true)}>
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

              {visibleNotifications.length < filteredNotifications.length ? (
                <div className="border-t border-gray-200 p-4 text-center">
                  <Button variant="ghost" onClick={handleLoadMore}>Load More</Button>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="p-6">
            <ActivityLog
              logs={activitySeed}
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
