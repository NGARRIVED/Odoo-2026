import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Modal
} from '../../../shared/ui-components';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : {};
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const selectCls =
  'flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  User,
  X,
  ShieldAlert
} from 'lucide-react';
import { isAdmin, authHeader } from '../../../shared/utils/auth';

const API_BASE = 'http://localhost:4000';

const roleOptions = [
  { label: 'All Roles', value: 'ALL' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Asset Manager', value: 'ASSET_MANAGER' },
  { label: 'Department Head', value: 'DEPARTMENT_HEAD' },
  { label: 'Employee', value: 'EMPLOYEE' }
];

const statusFilterOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
];

const formRoleOptions = [
  { label: 'Employee', value: 'EMPLOYEE' },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'Asset Manager', value: 'ASSET_MANAGER' },
  { label: 'Department Head', value: 'DEPARTMENT_HEAD' }
];

const formStatusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Inactive', value: 'INACTIVE' }
];

function roleBadge(role) {
  switch (role) {
    case 'ADMIN': return { label: 'Admin', variant: 'danger' };
    case 'ASSET_MANAGER': return { label: 'Asset Manager', variant: 'brand' };
    case 'DEPARTMENT_HEAD': return { label: 'Dept Head', variant: 'info' };
    default: return { label: 'Employee', variant: 'default' };
  }
}

function statusBadge(status) {
  return status === 'ACTIVE'
    ? { label: 'Active', variant: 'success' }
    : { label: 'Inactive', variant: 'default' };
}

function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

/* ─── Employee Form ─── */
function EmployeeForm({ employee, departments, onCancel, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    role: employee?.role || 'EMPLOYEE',
    status: employee?.status || 'ACTIVE',
    departmentId: employee?.departmentId || '',
    avatar: employee?.avatar || ''
  });
  const [error, setError] = useState('');

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const deptOptions = [
    { label: 'No department', value: '' },
    ...departments.map((d) => ({ label: d.name, value: d.id }))
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim() || !form.email.trim()) {
      setError('Name and email are required.');
      return;
    }
    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        role: form.role,
        status: form.status,
        departmentId: form.departmentId || null,
        avatar: form.avatar.trim() || null
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert className="w-full">{error}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Full Name *"
          value={form.name}
          onChange={(e) => update('name', e.target.value)}
          placeholder="Jane Doe"
          required
        />
        <Input
          label="Email Address *"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          placeholder="jane@company.com"
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-sm font-medium text-gray-700">Role</label>
          <select 
            className={selectCls} 
            value={form.role} 
            onChange={(e) => update('role', e.target.value)}
            disabled={!isAdmin()}
            title={!isAdmin() ? "Only administrators can change roles" : ""}
          >
            <option value="EMPLOYEE">Employee</option>
            <option value="ADMIN">Admin</option>
            <option value="ASSET_MANAGER">Asset Manager</option>
            <option value="DEPARTMENT_HEAD">Department Head</option>
          </select>
        </div>
        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-sm font-medium text-gray-700">Department</label>
          <select className={selectCls} value={form.departmentId} onChange={(e) => update('departmentId', e.target.value)}>
            <option value="">No department</option>
            {departments.length === 0 ? (
              <option disabled>No departments yet</option>
            ) : (
              departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)
            )}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select className={selectCls} value={form.status} onChange={(e) => update('status', e.target.value)}>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
        <Input
          label="Avatar URL"
          value={form.avatar}
          onChange={(e) => update('avatar', e.target.value)}
          placeholder="https://…"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : employee ? 'Update Employee' : 'Create Employee'}
        </Button>
      </div>
    </form>
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirmModal({ employee, onCancel, onConfirm, loading, error }) {
  return (
    <div className="space-y-4">
      {error && <Alert className="w-full">{error}</Alert>}
      <p className="text-sm text-gray-600">
        Are you sure you want to remove <strong>{employee?.name}</strong>? This cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Delete Employee'}
        </Button>
      </div>
    </div>
  );
}

const PAGE_SIZE = 15;

/* ─── Main Component ─── */
export default function EmployeeDirectoryTab() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const [modalMode, setModalMode] = useState(null);
  const [activeEmployee, setActiveEmployee] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const loadEmployees = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/api/organization/employees`);
      setEmployees(data.employees || []);
      setError('');
    } catch (err) {
      setError(`Could not load employees: ${err.message}`);
    }
  };

  const loadDepartments = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/api/organization/departments`);
      setDepartments(data.departments || []);
    } catch (err) {
      console.warn('Could not load departments for filter:', err.message);
    }
  };

  const load = async () => {
    setIsLoading(true);
    await Promise.all([loadEmployees(), loadDepartments()]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);
  useEffect(() => { setPage(1); }, [search, roleFilter, statusFilter, deptFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return employees.filter((e) => {
      const matchSearch = !q || e.name.toLowerCase().includes(q) || e.email.toLowerCase().includes(q);
      const matchRole = roleFilter === 'ALL' || e.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || e.status === statusFilter;
      const matchDept = deptFilter === 'ALL' || e.departmentId === deptFilter;
      return matchSearch && matchRole && matchStatus && matchDept;
    });
  }, [employees, search, roleFilter, statusFilter, deptFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const deptFilterOptions = [
    { label: 'All Departments', value: 'ALL' },
    ...departments.map((d) => ({ label: d.name, value: d.id }))
  ];

  const closeModal = () => { setModalMode(null); setActiveEmployee(null); setDeleteError(''); };

  const handleCreate = async (payload) => {
    setIsSaving(true);
    try {
      await apiFetch(`${API_BASE}/api/organization/employees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      await loadEmployees();
      closeModal();
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setIsSaving(true);
    try {
      await apiFetch(`${API_BASE}/api/organization/employees/${activeEmployee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      await loadEmployees();
      closeModal();
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsSaving(true);
    setDeleteError('');
    try {
      const res = await fetch(`${API_BASE}/api/organization/employees/${activeEmployee.id}`, { 
        method: 'DELETE',
        headers: { ...authHeader() }
      });
      if (res.status === 204) { await loadEmployees(); closeModal(); return; }
      const data = await res.json();
      setDeleteError(data.error || 'Failed to delete employee.');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasFilters = search || roleFilter !== 'ALL' || statusFilter !== 'ALL' || deptFilter !== 'ALL';
  const admin = isAdmin();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 lg:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email…"
              className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {roleOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {statusFilterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {deptFilterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          {hasFilters && (
            <button
              onClick={() => { setSearch(''); setRoleFilter('ALL'); setStatusFilter('ALL'); setDeptFilter('ALL'); }}
              className="h-10 px-3 text-sm text-gray-500 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-1.5"
            >
              <X size={14} /> Clear
            </button>
          )}
        </div>
        {admin && (
          <Button className="flex items-center gap-2 shrink-0" onClick={() => setModalMode('create')}>
            <Plus size={16} /> Add Employee
          </Button>
        )}
      </div>

      {!admin && (
        <Alert className="w-full bg-blue-50 text-blue-800 border-blue-200 flex items-center gap-2">
          <ShieldAlert size={16} className="text-blue-600" />
          Viewing in read-only mode. Only administrators can add or remove employees and change roles.
        </Alert>
      )}

      {error && <Alert className="w-full">{error}</Alert>}

      {isLoading ? (
        <Card className="p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={18} /> Loading employees…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-gray-400">
          <User size={36} className="mx-auto mb-2 opacity-40" />
          <p className="font-medium">{hasFilters ? 'No employees match your filters.' : 'No employees yet.'}</p>
          {!hasFilters && admin && (
            <Button className="mt-3" onClick={() => setModalMode('create')}>
              <Plus size={16} className="mr-2" /> Add First Employee
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Employee</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium text-center">Active Assets</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paged.map((emp) => {
                const rb = roleBadge(emp.role);
                const sb = statusBadge(emp.status);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {emp.avatar ? (
                          <img src={emp.avatar} alt={emp.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">
                            {getInitials(emp.name)}
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          <p className="text-xs text-gray-400">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={rb.variant}>{rb.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {emp.departmentName || <span className="text-gray-400 italic text-xs">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600">{emp.activeAllocations}</td>
                    <td className="px-4 py-3">
                      <Badge variant={sb.variant}>{sb.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {admin && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setActiveEmployee(emp); setModalMode('edit'); }}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-brand-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { setActiveEmployee(emp); setModalMode('delete'); }}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
            <span>
              Showing {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={safePage === 1}
                className="h-7 px-2 flex items-center gap-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={13} /> Prev
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let n;
                if (totalPages <= 5) n = i + 1;
                else if (safePage <= 3) n = i + 1;
                else if (safePage >= totalPages - 2) n = totalPages - 4 + i;
                else n = safePage - 2 + i;
                return (
                  <button
                    key={n}
                    onClick={() => setPage(n)}
                    className={`h-7 w-7 rounded border text-xs ${n === safePage ? 'bg-brand-900 text-white border-brand-900' : 'border-gray-200 hover:bg-gray-50'}`}
                  >
                    {n}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={safePage === totalPages}
                className="h-7 px-2 flex items-center gap-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={13} />
              </button>
            </div>
          </div>
        </Card>
      )}

      {/* Modals */}
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="Add Employee" className="max-w-lg">
        <EmployeeForm departments={departments} onCancel={closeModal} onSubmit={handleCreate} loading={isSaving} />
      </Modal>
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title="Edit Employee" className="max-w-lg">
        <EmployeeForm employee={activeEmployee} departments={departments} onCancel={closeModal} onSubmit={handleUpdate} loading={isSaving} />
      </Modal>
      <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Remove Employee" className="max-w-md">
        <DeleteConfirmModal
          employee={activeEmployee}
          onCancel={closeModal}
          onConfirm={handleDelete}
          loading={isSaving}
          error={deleteError}
        />
      </Modal>
    </div>
  );
}
