import React from 'react';
import { getTokenPayload, isManagerOrAbove } from '../../../shared/utils/auth';
import { Trash2 } from 'lucide-react';

const START_HOUR = 8;
const END_HOUR = 18;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);

function formatHour(hour) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric' }).format(new Date(2020, 0, 1, hour));
}

function formatTime(value) {
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(new Date(value));
}

function minutesFromStart(value) {
  const date = new Date(value);
  return ((date.getHours() - START_HOUR) * 60) + date.getMinutes();
}

export default function BookingCalendar({ selectedResource, selectedDate, schedule, isLoading, onCancelBooking }) {
  const currentUserId = getTokenPayload()?.employeeId;
  const isManager = isManagerOrAbove();

  if (!selectedResource) {
    return (
      <section className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Booking calendar</h2>
        <p className="mt-3 rounded-md bg-slate-50 p-4 text-sm text-slate-600">Choose a resource to view its availability calendar.</p>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-gray-100 bg-white shadow-sm">
      <div className="flex flex-col gap-2 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Booking calendar</h2>
          <p className="text-sm text-slate-500">{selectedResource.name} · {selectedResource.location || 'Location not specified'}</p>
        </div>
        <span className="text-sm font-medium text-brand-900">{selectedDate}</span>
      </div>

      <div className="overflow-x-auto p-5">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-[76px_1fr]">
            <div />
            <div className="pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Daily availability</div>
          </div>
          <div className="relative grid grid-cols-[76px_1fr]">
            <div className="relative h-[600px] border-r border-slate-200">
              {HOURS.map((hour) => (
                <span key={hour} className="absolute right-3 -translate-y-1/2 text-xs text-slate-500" style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }}>
                  {formatHour(hour)}
                </span>
              ))}
            </div>
            <div className="relative h-[600px] overflow-hidden rounded-r-md border-y border-r border-slate-200 bg-white">
              {HOURS.slice(0, -1).map((hour) => (
                <div key={hour} className="absolute left-0 right-0 border-t border-slate-100" style={{ top: `${((hour - START_HOUR) / (END_HOUR - START_HOUR)) * 100}%` }} />
              ))}

              {isLoading ? (
                <p className="p-5 text-sm text-slate-500">Loading schedule...</p>
              ) : schedule.length === 0 ? (
                <div className="flex h-full items-center justify-center p-5 text-center text-sm text-slate-500">No bookings for this date. The resource is fully available.</div>
              ) : schedule.map((booking) => {
                const totalMinutes = (END_HOUR - START_HOUR) * 60;
                const top = Math.max(0, minutesFromStart(booking.startTime));
                const duration = Math.max(30, (new Date(booking.endTime) - new Date(booking.startTime)) / 60000);
                const bottom = Math.min(totalMinutes, top + duration);

                if (bottom <= 0 || top >= totalMinutes) return null;

                const canCancel = booking.bookedById === currentUserId || isManager;

                return (
                  <article key={booking.id} className="absolute left-3 right-3 overflow-hidden rounded-md border-l-4 border-brand-500 bg-brand-100 p-3 text-sm shadow-sm flex justify-between items-start group" style={{ top: `${(top / totalMinutes) * 100}%`, height: `${Math.max(8, ((bottom - Math.max(0, top)) / totalMinutes) * 100)}%` }}>
                    <div>
                      <p className="font-semibold text-slate-900">{booking.purpose || 'Reserved resource'}</p>
                      <p className="mt-1 text-xs text-slate-600">{formatTime(booking.startTime)} – {formatTime(booking.endTime)}</p>
                    </div>
                    {canCancel && onCancelBooking && (
                      <button 
                        onClick={() => onCancelBooking(booking.id)}
                        className="text-red-500 hover:bg-red-50 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Cancel Booking"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
