import React from 'react';

export default function ResourceBooking({ form, resources, categories, isLoadingResources, isSubmitting, onChange, onSubmit }) {
  return (
    <form id="booking-form" onSubmit={onSubmit} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">New booking</h2>
          <p className="mt-1 text-sm text-slate-500">Select a resource, then reserve an available time slot.</p>
        </div>
        <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-900">Protected schedule</span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Resource category
          <select value={form.categoryId} onChange={onChange('categoryId')} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
            <option value="">All categories</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Bookable resource
          <select value={form.selectedAsset} onChange={onChange('selectedAsset')} required disabled={isLoadingResources} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50">
            <option value="">{isLoadingResources ? 'Loading resources...' : 'Select a resource'}</option>
            {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name} ({resource.tag}){resource.location ? ` — ${resource.location}` : ''}</option>)}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Booking date
          <input type="date" value={form.date} onChange={onChange('date')} required className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Purpose
          <input type="text" value={form.purpose} onChange={onChange('purpose')} maxLength="160" placeholder="e.g. Client project review" className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Start time
          <input type="time" value={form.startTime} onChange={onChange('startTime')} required className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          End time
          <input type="time" value={form.endTime} onChange={onChange('endTime')} required className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </label>
      </div>

      <button type="submit" disabled={isSubmitting} className="mt-6 rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? 'Creating booking...' : 'Confirm booking'}
      </button>
    </form>
  );
}
