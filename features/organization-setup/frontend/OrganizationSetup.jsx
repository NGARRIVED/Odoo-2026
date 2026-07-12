import React, { useState, useEffect } from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Card
} from '../../../shared/ui-components';
import { Building2, Boxes, Users, Activity } from 'lucide-react';
import DepartmentsTab from './DepartmentsTab';
import EmployeeDirectoryTab from './EmployeeDirectoryTab';
import CategoriesTab from './CategoriesTab';

const API_BASE = 'http://localhost:4000';

const tabs = [
  { key: 'departments', label: 'Departments', Icon: Building2 },
  { key: 'employees',   label: 'Employee Directory', Icon: Users },
  { key: 'categories',  label: 'Asset Categories', Icon: Boxes }
];

export function OrganizationSetup() {
  const [activeTab, setActiveTab] = useState('departments');
  const [stats, setStats] = useState({ departments: 0, employees: 0, categories: 0 });

  useEffect(() => {
    // Fire and forget simple stats check
    Promise.all([
      fetch(`${API_BASE}/api/organization/departments`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/api/organization/employees`).then(r => r.json()).catch(() => ({})),
      fetch(`${API_BASE}/api/organization/categories`).then(r => r.json()).catch(() => ({}))
    ]).then(([dRes, eRes, cRes]) => {
      setStats({
        departments: dRes.departments?.length || 0,
        employees: eRes.total || 0,
        categories: cRes.categories?.length || 0
      });
    });
  }, []);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organization Setup</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage departments, employees, and asset categories for your organization.
        </p>
      </div>

      {/* At a glance stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex items-center gap-4 border-l-4 border-brand-500">
          <div className="h-12 w-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Departments</p>
            <p className="text-2xl font-bold text-gray-900">{stats.departments}</p>
          </div>
        </Card>
        
        <Card className="p-4 flex items-center gap-4 border-l-4 border-blue-500">
          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Employees</p>
            <p className="text-2xl font-bold text-gray-900">{stats.employees}</p>
          </div>
        </Card>

        <Card className="p-4 flex items-center gap-4 border-l-4 border-amber-500">
          <div className="h-12 w-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
            <Boxes size={20} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Asset Categories</p>
            <p className="text-2xl font-bold text-gray-900">{stats.categories}</p>
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs>
        <TabsList className="mb-6">
          {tabs.map(({ key, label, Icon }) => (
            <TabsTrigger
              key={key}
              isActive={activeTab === key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-2"
            >
              <Icon size={15} />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent isActive={activeTab === 'departments'}>
          <DepartmentsTab />
        </TabsContent>

        <TabsContent isActive={activeTab === 'employees'}>
          <EmployeeDirectoryTab />
        </TabsContent>

        <TabsContent isActive={activeTab === 'categories'}>
          <CategoriesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default OrganizationSetup;
