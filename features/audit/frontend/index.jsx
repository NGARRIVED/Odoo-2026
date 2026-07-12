import React, { useEffect, useMemo, useState } from 'react';
import AuditChecklist from './AuditChecklist';
import DiscrepancyReport from './DiscrepancyReport';

const API_BASE = 'http://localhost:4000';
const verificationOptions = [
  { value: 'VERIFIED', label: 'Verified', activeClass: 'bg-success text-white' },
  { value: 'MISSING', label: 'Missing', activeClass: 'bg-alert text-white shadow-sm' },
  { value: 'DAMAGED', label: 'Damaged', activeClass: 'bg-warning text-white' }
];

function formatDeadline(value) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
}

async function readApiResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  return { error: text || `Request failed with status ${response.status}.` };
}

export function Audit() {
  const [activeCycle, setActiveCycle] = useState(null);
  const [auditItems, setAuditItems] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isClosed, setIsClosed] = useState(false);

  const authHeaders = () => {
    const token = localStorage.getItem('assetflow_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    let isMounted = true;

    async function loadActiveCycle() {
      try {
        const response = await fetch(`${API_BASE}/api/audits/active`, { headers: authHeaders() });
        const data = await readApiResponse(response);
        if (!response.ok) throw new Error(data.error || 'Failed to load the active audit cycle.');
        if (isMounted && data.cycle) {
          setActiveCycle(data.cycle);
          setAuditItems(data.cycle.items || []);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadActiveCycle();
    return () => { isMounted = false; };
  }, []);

  const hasDiscrepancies = useMemo(
    () => auditItems.some((item) => item.verification === 'MISSING' || item.verification === 'DAMAGED'),
    [auditItems]
  );

  const handleItemVerification = async (itemId, verification) => {
    setError('');
    setUpdatingItemId(itemId);

    try {
      const response = await fetch(`${API_BASE}/api/audits/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders() },
        body: JSON.stringify({ verification })
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to update audit item.');

      setAuditItems((current) => current.map((item) => item.id === itemId ? data.item : item));
    } catch (updateError) {
      setError(updateError.message);
    } finally {
      setUpdatingItemId('');
    }
  };

  const handleCloseCycle = async () => {
    if (!activeCycle || !window.confirm('Close this audit cycle and sync missing assets to the ledger?')) return;

    setError('');
    setIsClosing(true);
    try {
      const response = await fetch(`${API_BASE}/api/audits/${activeCycle.id}/close`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(data.error || 'Failed to close the audit cycle.');

      setActiveCycle(data.cycle);
      setIsClosed(true);
    } catch (closeError) {
      setError(closeError.message);
    } finally {
      setIsClosing(false);
    }
  };

  if (isLoading) {
    return <div className="rounded-lg border border-gray-100 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading audit cycle...</div>;
  }

  if (!activeCycle) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Asset Audit</h1>
        {error && <p className="mt-4 rounded-md bg-alert p-3 text-sm text-white">{error}</p>}
        {!error && <p className="mt-3 text-sm text-slate-600">There is no open audit cycle at this time.</p>}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-5 bg-slate-50">
      <section className="flex flex-col gap-4 rounded-lg bg-brand-900 p-5 text-white shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">{isClosed ? 'Cycle Closed' : activeCycle.name}</h1>
          <p className="mt-1 text-sm text-slate-200">Deadline: {formatDeadline(activeCycle.endDate)}</p>
        </div>
        {!isClosed && (
          <button type="button" onClick={handleCloseCycle} disabled={isClosing} className="rounded-md bg-success px-4 py-2 text-sm font-bold text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60">
            {isClosing ? 'Closing cycle...' : 'Close Cycle & Sync Ledger'}
          </button>
        )}
      </section>

      {error && <div className="rounded-md bg-alert p-3 text-sm text-white" role="alert">{error}</div>}
      {isClosed && <div className="rounded-md bg-success p-3 text-sm text-white" role="status">Cycle Closed. Missing assets have been synchronized to the ledger as lost.</div>}
      {!isClosed && hasDiscrepancies && <DiscrepancyReport items={auditItems} />}
      <AuditChecklist items={auditItems} disabled={isClosed} updatingItemId={updatingItemId} onVerify={handleItemVerification} />
    </div>
  );
}

export default Audit;
