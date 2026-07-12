import React, { useState } from 'react';

export default function RaiseRequestForm({ assets, isSubmitting, onSubmit, onCancel }) {
  const [form, setForm] = useState({ assetId: '', priority: 'MEDIUM', issueDescription: '' });
  const change = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const submit = (event) => {
    event.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={submit} className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4"><div><h2 className="text-lg font-semibold text-slate-900">Raise maintenance issue</h2><p className="mt-1 text-sm text-slate-500">Create a ticket for an asset requiring inspection or repair.</p></div><button type="button" onClick={onCancel} className="text-sm text-slate-500 hover:text-slate-800">Close</button></div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">Asset<select required value={form.assetId} onChange={change('assetId')} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="">Select an asset</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.tag} — {asset.name}</option>)}</select></label>
        <label className="text-sm font-medium text-slate-700">Priority<select value={form.priority} onChange={change('priority')} className="mt-1 h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm"><option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="CRITICAL">Critical</option></select></label>
        <label className="text-sm font-medium text-slate-700 md:col-span-2">Issue description<textarea required value={form.issueDescription} onChange={change('issueDescription')} rows="4" placeholder="Describe the fault, impact, and observed condition..." className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm" /></label>
      </div>
      <button disabled={isSubmitting} className="mt-5 rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:opacity-60">{isSubmitting ? 'Submitting...' : 'Submit request'}</button>
    </form>
  );
}
