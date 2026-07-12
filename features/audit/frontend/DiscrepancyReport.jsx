import React from 'react';

export default function DiscrepancyReport({ items }) {
  const discrepancies = items.filter((item) => item.verification === 'MISSING' || item.verification === 'DAMAGED');
  if (!discrepancies.length) return null;
  return <section className="rounded-lg border border-amber-200 bg-warning p-4 text-white shadow-sm"><h2 className="font-semibold">Discrepancy report · {discrepancies.length}</h2><p className="mt-1 text-sm">Review these assets before closing the cycle.</p><div className="mt-3 flex flex-wrap gap-2">{discrepancies.map((item) => <span key={item.id} className="rounded bg-white/20 px-2 py-1 text-xs font-medium">{item.asset?.tag || 'Unknown'} · {item.verification}</span>)}</div></section>;
}
