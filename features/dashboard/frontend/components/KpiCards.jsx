import React from 'react';
import { Card } from '../../../../shared/ui-components';

export default function KpiCards({ metrics }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {metrics.map((metric) => {
        const Icon = metric.Icon;

        return (
          <Card key={metric.label} className={`p-4 flex flex-col gap-2 ${metric.cardClass || ''}`}>
            <div className="flex justify-between items-center gap-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{metric.label}</span>
              <Icon size={16} className={metric.iconClass} />
            </div>
            <span className="text-3xl font-bold text-gray-900">{metric.value}</span>
            {metric.helperText && <span className="text-xs text-gray-500">{metric.helperText}</span>}
          </Card>
        );
      })}
    </div>
  );
}
