import React from 'react';
import { Button, Card } from '../../../../shared/ui-components';
import { AlertTriangle, ArrowRight } from 'lucide-react';

export default function OverdueBanner({ count, items }) {
  if (!count) {
    return (
      <Card className="bg-gray-50 border-gray-200 p-4 flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <div className="mt-0.5 rounded-full bg-brand-50 p-2 text-brand-900">
            <ArrowRight size={16} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-brand-900">No overdue assets</h3>
            <p className="text-sm text-gray-600 mt-1">Everything currently checked out is within its expected return window.</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="bg-brand-50 border-brand-200 p-4 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-3">
          <AlertTriangle className="text-brand-900 mt-0.5 shrink-0" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-brand-900">Overdue Alert</h3>
            <p className="text-sm text-gray-600 mt-1">
              {count} asset{count === 1 ? '' : 's'} are past their return date. Immediate action is required.
            </p>
          </div>
        </div>
        <Button variant="outline" className="border-brand-200 text-brand-900 hover:bg-brand-50">
          View Assets
        </Button>
      </div>

      {items.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="rounded-md border border-gray-200 bg-white p-3">
              <div className="flex items-center justify-between gap-3">
                <span className="font-semibold text-gray-900">{item.assetTag}</span>
                <span className="text-xs text-brand-900 font-medium">{item.overdueLabel}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">{item.assetType} · {item.assignee}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
