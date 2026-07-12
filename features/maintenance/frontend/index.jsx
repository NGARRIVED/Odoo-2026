import React, { useEffect, useState } from 'react';
import RaiseRequestForm from './RaiseRequestForm';

const API_BASE = 'http://localhost:4000';

const columns = [
  { status: 'PENDING', label: 'Pending' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'IN_PROGRESS', label: 'In Progress' },
  { status: 'RESOLVED', label: 'Resolved' }
];

function priorityClass(priority) {
  switch (priority) {
    case 'CRITICAL': return 'bg-red-100 text-red-700';
    case 'HIGH': return 'bg-orange-100 text-orange-700';
    case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-slate-100 text-slate-700';
  }
}

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();

  const text = await response.text();
  return { error: text || `Request failed with status ${response.status}.` };
}

export function Maintenance() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [assets, setAssets] = useState([]);
  const [showRaiseForm, setShowRaiseForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem('assetflow_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    let isMounted = true;

    async function loadRequests() {
      try {
        const [requestsResponse, assetsResponse] = await Promise.all([fetch(`${API_BASE}/api/maintenance`, { headers: authHeaders() }), fetch(`${API_BASE}/api/maintenance/assets`, { headers: authHeaders() })]);
        const [requestsData, assetsData] = await Promise.all([readApiResponse(requestsResponse), readApiResponse(assetsResponse)]);
        if (!requestsResponse.ok) throw new Error(requestsData.error || 'Failed to load maintenance requests.');
        if (!assetsResponse.ok) throw new Error(assetsData.error || 'Failed to load assets.');
        if (isMounted) { setRequests(requestsData.requests); setAssets(assetsData.assets); }
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRequests();
    return () => { isMounted = false; };
  }, []);

  const handleStatusUpdate = async (id, newStatus) => {
    setError('');
    setUpdatingId(id);

    try {
      const response = await fetch(`${API_BASE}/api/maintenance/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ newStatus })
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to update maintenance status.');

      setRequests((current) => current.map((request) => request.id === id ? data.request : request));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingId('');
    }
  };

  const handleCreateRequest = async (form) => {
    setError(''); setIsCreating(true);
    try {
      const response = await fetch(`${API_BASE}/api/maintenance`, { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders() }, body: JSON.stringify(form) });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to create maintenance request.');
      setRequests((current) => [data.request, ...current]);
      setShowRaiseForm(false);
    } catch (createError) { setError(createError.message); } finally { setIsCreating(false); }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-slate-50">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Maintenance Approvals</h1>
          <p className="mt-1 text-sm text-slate-600">Review issues and manage assets through their maintenance lifecycle.</p>
        </div>
        <button type="button" onClick={() => setShowRaiseForm((current) => !current)} className="rounded-md bg-brand-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-800">
          + Raise Issue
        </button>
      </header>

      {error && <div className="rounded-md bg-alert p-4 text-sm text-white shadow-sm" role="alert">{error}</div>}
      {showRaiseForm && <RaiseRequestForm assets={assets} isSubmitting={isCreating} onSubmit={handleCreateRequest} onCancel={() => setShowRaiseForm(false)} />}

      {isLoading ? (
        <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading maintenance requests...</div>
      ) : (
        <section className="flex gap-4 overflow-x-auto pb-3">
          {columns.map((column) => {
            const columnRequests = requests.filter((request) => request.status === column.status);

            return (
              <div key={column.status} className="flex min-w-[250px] flex-1 flex-col gap-3 rounded-lg bg-slate-100 p-3">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-700">{column.label}</h2>
                  <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600">{columnRequests.length}</span>
                </div>

                {columnRequests.length === 0 ? (
                  <p className="rounded bg-white/70 p-3 text-xs text-slate-500">No requests in this stage.</p>
                ) : columnRequests.map((request) => (
                  <article key={request.id} className="rounded border border-gray-200 bg-white p-3 shadow-sm">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-brand-900">{request.asset?.tag || 'Unknown asset'}</p>
                      <span className={`rounded px-2 py-1 text-[10px] font-semibold uppercase ${priorityClass(request.priority)}`}>{request.priority}</span>
                    </div>
                    <p className="mt-1 text-xs font-medium text-slate-800">{request.asset?.name}</p>
                    <p className="mt-2 text-xs leading-5 text-gray-600">{request.issueDescription}</p>
                    <p className="mt-3 text-[11px] text-slate-500">Raised by {request.raisedBy?.name || 'Unknown user'}</p>

                    {request.status === 'PENDING' && (
                      <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                        <button type="button" disabled={updatingId === request.id} onClick={() => handleStatusUpdate(request.id, 'APPROVED')} className="flex-1 rounded bg-success px-2 py-1.5 text-xs font-medium text-white hover:bg-emerald-600 disabled:opacity-60">
                          Approve
                        </button>
                        <button type="button" disabled={updatingId === request.id} onClick={() => handleStatusUpdate(request.id, 'REJECTED')} className="flex-1 rounded bg-gray-200 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 disabled:opacity-60">
                          Reject
                        </button>
                      </div>
                    )}
                  </article>
                ))}
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}

export default Maintenance;
