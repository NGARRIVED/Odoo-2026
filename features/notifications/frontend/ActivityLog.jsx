import React from 'react';
import { Badge } from '../../../shared/ui-components';
import {
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldAlert,
  Wrench,
  CircleCheck,
  TriangleAlert,
  Bell,
} from 'lucide-react';
import { formatDate } from '../../../shared/utils/formatters';

const iconMap = {
  transfer: ArrowRightLeft,
  booking: CalendarDays,
  maintenance: Wrench,
  audit: CircleCheck,
  alert: TriangleAlert,
  system: Bell,
  note: FileText,
  approval: CheckCircle2,
  security: ShieldAlert,
};

function formatClock(value) {
  return new Date(value).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function ActivityLog({ logs = [], onLoadMore, visibleCount, totalCount }) {
  const groupedLogs = logs.reduce((groups, log) => {
    const bucket = log.group || 'Today';
    if (!groups[bucket]) {
      groups[bucket] = [];
    }

    groups[bucket].push(log);
    return groups;
  }, {});

  const groupOrder = ['Today', 'Yesterday', 'This Week', 'Earlier'];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Activity Log</h3>
          <p className="text-sm text-gray-500">Recent system events, approvals, and operational updates.</p>
        </div>
        {typeof onLoadMore === 'function' && (
          <button
            type="button"
            onClick={onLoadMore}
            className="text-sm font-medium text-brand-700 hover:text-brand-900"
          >
            Load more events
          </button>
        )}
      </div>

      <div className="space-y-4">
        {groupOrder.map((group) => {
          const items = groupedLogs[group] || [];

          if (items.length === 0) {
            return null;
          }

          return (
            <div key={group} className="space-y-3">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">{group}</span>
                {group === 'Today' && visibleCount && totalCount ? (
                  <span className="text-xs text-gray-500">Showing {visibleCount} of {totalCount} events</span>
                ) : null}
              </div>

              <div className="space-y-3">
                {items.map((log) => {
                  const Icon = iconMap[log.icon] || Clock3;

                  return (
                    <article
                      key={log.id}
                      className="flex gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 text-gray-700">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-gray-900">{log.title}</h4>
                          {log.tag ? <Badge variant={log.tagVariant || 'default'}>{log.tag}</Badge> : null}
                        </div>
                        <p className="text-sm text-gray-600">{log.description}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                          <span>{log.actor}</span>
                          <span>•</span>
                          <span>{log.entity}</span>
                          <span>•</span>
                          <span>{formatDate(log.timestamp)}</span>
                          <span>•</span>
                          <span>{formatClock(log.timestamp)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
