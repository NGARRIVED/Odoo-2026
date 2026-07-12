import React from 'react';
import { Button, Card } from '../../../../shared/ui-components';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function OverdueBanner({ count, items }) {
  const navigate = useNavigate();
  if (!count) {
    return (
      <Card className="bg-emerald-50 border-emerald-200 p-4 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-full bg-emerald-100 p-2 text-emerald-700">
            <ArrowRight size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-emerald-800">No overdue assets</h3>
            <p className="text-sm text-emerald-700 mt-1">Everything currently checked out is within its expected return window.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-red-50 border-red-200 p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Overdue Alert</h3>
            <p className="text-sm text-red-700 mt-1">
              {count} asset{count === 1 ? '' : 's'} are past their return date. Immediate action is required.
            </p>
          </div>
        </div>
        <Button variant="outline" className="border-red-200 text-red-700 hover:bg-red-100" onClick={() => navigate('/allocations')}>
          View Assets
        </Button>
      </div>

      {items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-red-100 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-900">{item.assetTag}</span>
                <span className="text-xs text-red-700 font-medium">{item.overdueLabel}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.assetType} · {item.assignee}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
