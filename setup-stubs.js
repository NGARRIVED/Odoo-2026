const fs = require('fs');
const path = require('path');

const features = [
  'dashboard',
  'organization-setup',
  'assets',
  'allocation-transfer',
  'resource-booking',
  'maintenance',
  'audit',
  'reports-analytics',
  'notifications'
];

const componentNames = {
  'dashboard': 'Dashboard',
  'organization-setup': 'OrganizationSetup',
  'assets': 'Assets',
  'allocation-transfer': 'AllocationTransfer',
  'resource-booking': 'ResourceBooking',
  'maintenance': 'Maintenance',
  'audit': 'Audit',
  'reports-analytics': 'ReportsAnalytics',
  'notifications': 'Notifications'
};

features.forEach(feature => {
  const dir = path.join('d:/odoooo/Odoo-2026/features', feature, 'frontend');
  fs.mkdirSync(dir, { recursive: true });
  
  const compName = componentNames[feature];
  const content = `import React from 'react';
import { AppLayout } from '../../../shared/ui-components';

export function ${compName}() {
  return (
    <AppLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold">${compName} Component</h2>
        <p className="text-gray-500 mt-2">This is a placeholder for the ${compName} feature.</p>
      </div>
    </AppLayout>
  );
}
`;
  
  fs.writeFileSync(path.join(dir, 'index.js'), content);
});

const authDir = 'd:/odoooo/Odoo-2026/features/authentication/frontend';
fs.writeFileSync(path.join(authDir, 'ForgotPassword.jsx'), `import React from 'react';\nexport function ForgotPassword() { return <div>Forgot Password Placeholder</div>; }\n`);

const authIndex = path.join(authDir, 'index.js');
let indexContent = fs.readFileSync(authIndex, 'utf8');
if (!indexContent.includes('ForgotPassword')) {
  indexContent += '\nexport * from "./ForgotPassword";';
  fs.writeFileSync(authIndex, indexContent);
}
