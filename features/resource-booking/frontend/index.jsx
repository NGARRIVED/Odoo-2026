import React, { useEffect, useMemo, useState } from 'react';
import BookingCalendar from './BookingCalendar';
import ResourceBookingForm from './ResourceBooking';

const API_BASE = 'http://localhost:4000';

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      return await response.json();
    } catch {
      return { error: `Request failed with status ${response.status}.` };
    }
  }

  const text = await response.text();
  if (!text) {
    return { error: `Request failed with status ${response.status}.` };
  }

  return { error: text };
}

export function ResourceBooking() {
  const [form, setForm] = useState({ categoryId: '', selectedAsset: '', date: today(), startTime: '', endTime: '', purpose: '' });
  const [resources, setResources] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoadingResources, setIsLoadingResources] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isLoadingBookings, setIsLoadingBookings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancellingId, setIsCancellingId] = useState('');

  const authHeaders = () => {
    const token = localStorage.getItem('assetflow_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const requireAuth = (message = 'Please log in to view bookings.') => {
    const token = localStorage.getItem('assetflow_token');
    if (!token) {
      throw new Error(message);
    }
  };

  const categories = useMemo(() => {
    const uniqueCategories = new Map(resources.filter((resource) => resource.category).map((resource) => [resource.category.id, resource.category]));
    return [...uniqueCategories.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [resources]);

  const visibleResources = useMemo(() => resources.filter((resource) => !form.categoryId || resource.category?.id === form.categoryId), [resources, form.categoryId]);
  const selectedResource = useMemo(() => resources.find((resource) => resource.id === form.selectedAsset), [resources, form.selectedAsset]);

  const updateForm = (field) => (event) => {
    const value = event.target.value;
    setError('');
    setSuccess('');
    setForm((current) => {
      const next = { ...current, [field]: value };
      if (field === 'categoryId' && current.selectedAsset) {
        const currentResource = resources.find((resource) => resource.id === current.selectedAsset);
        if (value && currentResource?.category?.id !== value) next.selectedAsset = '';
      }
      return next;
    });
  };

  const loadBookings = async () => {
    try {
      requireAuth();
      const response = await fetch(`${API_BASE}/api/bookings`, { headers: authHeaders() });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to load bookings.');
      setBookings(data.bookings || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoadingBookings(false);
    }
  };

  const loadSchedule = async () => {
    if (!form.selectedAsset || !form.date) {
      setSchedule([]);
      return;
    }

    setIsLoadingSchedule(true);
    try {
      requireAuth();
      const response = await fetch(`${API_BASE}/api/bookings/resources/${form.selectedAsset}/schedule?date=${encodeURIComponent(form.date)}`, { headers: authHeaders() });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to load this schedule.');
      setSchedule(data.bookings);
    } catch (loadError) {
      setSchedule([]);
      setError(loadError.message);
    } finally {
      setIsLoadingSchedule(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadResources() {
      try {
        requireAuth();
        const response = await fetch(`${API_BASE}/api/bookings/resources`, { headers: authHeaders() });
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.error || 'Failed to load bookable resources.');
        if (isMounted) setResources(data.resources);
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setIsLoadingResources(false);
      }
    }
    loadResources();
    loadBookings();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => { loadSchedule(); }, [form.selectedAsset, form.date]);

  const submitBooking = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!form.selectedAsset || !form.date || !form.startTime || !form.endTime) {
      setError('Select a resource, date, start time, and end time.');
      return;
    }

    setIsSubmitting(true);
    try {
      requireAuth();
      const response = await fetch(`${API_BASE}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ assetId: form.selectedAsset, purpose: form.purpose, startTime: new Date(`${form.date}T${form.startTime}`).toISOString(), endTime: new Date(`${form.date}T${form.endTime}`).toISOString() })
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to create booking.');

      setSuccess('Booking confirmed and added to the calendar.');
      setForm((current) => ({ ...current, startTime: '', endTime: '', purpose: '' }));
      await Promise.all([loadSchedule(), loadBookings()]);
    } catch (bookingError) {
      setError(bookingError.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelBooking = async (bookingId) => {
    setError('');
    setSuccess('');
    setIsCancellingId(bookingId);

    try {
      requireAuth();
      const response = await fetch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() }
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to cancel booking.');
      setSuccess('Booking cancelled successfully.');
      await Promise.all([loadSchedule(), loadBookings()]);
    } catch (cancelError) {
      setError(cancelError.message);
    } finally {
      setIsCancellingId('');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-slate-50">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Resource Booking</h1>
          <p className="mt-1 text-sm text-slate-600">Plan rooms, fleet vehicles, and shared equipment without scheduling conflicts.</p>
        </div>
        <a href="#booking-form" className="rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800">+ New Booking</a>
      </header>

      {error && <div className="rounded-md bg-alert p-4 text-sm text-white shadow-sm" role="alert">{error}</div>}
      {success && <div className="rounded-md bg-success p-4 text-sm text-white shadow-sm" role="status">{success}</div>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <BookingCalendar selectedResource={selectedResource} selectedDate={form.date} schedule={schedule} isLoading={isLoadingSchedule} />
        <div className="space-y-4">
          <ResourceBookingForm form={form} resources={visibleResources} categories={categories} isLoadingResources={isLoadingResources} isSubmitting={isSubmitting} onChange={updateForm} onSubmit={submitBooking} />
          <section className="rounded-lg border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Your bookings</h2>
              <span className="text-xs font-medium text-slate-500">{bookings.length} item(s)</span>
            </div>
            {isLoadingBookings ? (
              <p className="mt-4 text-sm text-slate-500">Loading your bookings...</p>
            ) : bookings.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">No bookings yet. Create one from the form to get started.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {bookings.map((booking) => (
                  <li key={booking.id} className="rounded-md border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{booking.asset?.name || 'Resource'}</p>
                        <p className="text-xs text-slate-500">{booking.asset?.tag || 'Unknown'} • {new Date(booking.startTime).toLocaleString()} to {new Date(booking.endTime).toLocaleString()}</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase text-slate-700">{booking.status}</span>
                    </div>
                    {booking.purpose && <p className="mt-2 text-sm text-slate-600">{booking.purpose}</p>}
                    {booking.status !== 'CANCELLED' && (
                      <button type="button" disabled={isCancellingId === booking.id} onClick={() => cancelBooking(booking.id)} className="mt-3 rounded bg-alert px-2.5 py-1.5 text-xs font-medium text-white hover:bg-red-600 disabled:opacity-60">
                        {isCancellingId === booking.id ? 'Cancelling...' : 'Cancel booking'}
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default ResourceBooking;
