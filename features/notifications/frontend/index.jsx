import React from 'react';
import { AppLayout } from '../../../shared/ui-components';

export function Notifications() {
  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold">Notifications Component</h2>
        <p className="text-gray-500 mt-2">This is a placeholder for the Notifications feature.</p>
      </div>
    </AppLayout>
  );
}
