import React, { useEffect, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Modal
} from '../../../shared/ui-components';
import {
  Building2,
  ChevronRight,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Users,
  X,
  ShieldAlert
} from 'lucide-react';
import { isAdmin, authHeader } from '../../../shared/utils/auth';

const API_BASE = 'http://localhost:4000';

async function apiFetch(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await res.json() : {};
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function statusBadge(status) {
  return status === 'ACTIVE'
    ? { label: 'Active', variant: 'success' }
    : { label: 'Inactive', variant: 'default' };
}

/* ─── Inline styled select (no wrapper component dependency) ─── */
const selectCls =
  'flex h-10 w-full appearance-none rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:opacity-50';

/* ─── Department Form ─── */
function DepartmentForm({ dept, departments, employees, onCancel, onSubmit, loading }) {
  const [form, setForm] = useState({
    name:     dept?.name     || '',
    parentId: dept?.parentId || '',
    headId:   dept?.headId   || '',
    status:   dept?.status   || 'ACTIVE'
  });
  const [error, setError] = useState('');

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Department name is required.'); return; }
    try {
      await onSubmit({
        name:     form.name.trim(),
        parentId: form.parentId || null,
        headId:   form.headId   || null,
        status:   form.status
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Filter out current dept from parent options (avoid self-reference)
  const availableParents = departments.filter((d) => d.id !== dept?.id);

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert className="w-full">{error}</Alert>}

      <Input
        label="Department Name *"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="e.g. Engineering"
        required
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Parent Department */}
        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-sm font-medium text-gray-700">Parent Department</label>
          <select
            className={selectCls}
            value={form.parentId}
            onChange={(e) => update('parentId', e.target.value)}
          >
            <option value="">None (top-level)</option>
            {availableParents.length === 0 ? (
              <option disabled>No departments found</option>
            ) : (
              availableParents.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))
            )}
          </select>
        </div>

        {/* Department Head */}
        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-sm font-medium text-gray-700">Department Head</label>
          <select
            className={selectCls}
            value={form.headId}
            onChange={(e) => update('headId', e.target.value)}
          >
            <option value="">No head assigned</option>
            {employees.length === 0 ? (
              <option disabled>No employees found — add employees first</option>
            ) : (
              employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.email})
                </option>
              ))
            )}
          </select>
          {employees.length === 0 && (
            <p className="text-xs text-amber-600">
              No employees loaded. Add employees in the Employee Directory tab first.
            </p>
          )}
        </div>
      </div>

      {dept && (
        <div className="flex flex-col space-y-1.5 w-full">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <select
            className={selectCls}
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : dept ? 'Update Department' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirmModal({ dept, onCancel, onConfirm, loading, error }) {
  return (
    <div className="space-y-4">
      {error && <Alert className="w-full">{error}</Alert>}
      <p className="text-sm text-gray-600">
        Are you sure you want to delete <strong>{dept?.name}</strong>? This action cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Delete Department'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function DepartmentsTab() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees]   = useState([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [deptError, setDeptError]   = useState('');
  const [empError, setEmpError]     = useState('');
  const [search, setSearch]         = useState('');

  const [modalMode, setModalMode]   = useState(null); // 'create' | 'edit' | 'delete'
  const [activeDept, setActiveDept] = useState(null);
  const [isSaving, setIsSaving]     = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Load departments and employees independently so one failure doesn't block the other
  const loadDepartments = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/api/organization/departments`);
      setDepartments(data.departments || []);
      setDeptError('');
    } catch (err) {
      setDeptError(`Could not load departments: ${err.message}`);
    }
  };

  const loadEmployees = async () => {
    try {
      const data = await apiFetch(`${API_BASE}/api/organization/employees`);
      setEmployees(data.employees || []);
      setEmpError('');
    } catch (err) {
      setEmpError(`Could not load employees for head assignment: ${err.message}`);
    }
  };

  const load = async () => {
    setIsLoading(true);
    await Promise.all([loadDepartments(), loadEmployees()]);
    setIsLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = departments.filter((d) =>
    !search ||
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.headName || '').toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => {
    setModalMode(null);
    setActiveDept(null);
    setDeleteError('');
  };

  const handleCreate = async (payload) => {
    setIsSaving(true);
    try {
      await apiFetch(`${API_BASE}/api/organization/departments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      await loadDepartments();
      closeModal();
    } catch (err) {
      throw err; // bubble to form
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdate = async (payload) => {
    setIsSaving(true);
    try {
      await apiFetch(`${API_BASE}/api/organization/departments/${activeDept.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      await loadDepartments();
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
      const res = await fetch(`${API_BASE}/api/organization/departments/${activeDept.id}`, {
        method: 'DELETE',
        headers: { ...authHeader() }
      });
      if (res.status === 204) { await loadDepartments(); closeModal(); return; }
      const data = await res.json();
      setDeleteError(data.error || 'Failed to delete department.');
    } catch (err) {
      setDeleteError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const admin = isAdmin();

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments…"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={load} className="h-10 gap-2" disabled={isLoading}>
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          {admin && (
            <Button className="flex items-center gap-2" onClick={() => setModalMode('create')}>
              <Plus size={16} /> Add Department
            </Button>
          )}
        </div>
      </div>

      {!admin && (
         <Alert className="w-full bg-blue-50 text-blue-800 border-blue-200 flex items-center gap-2">
           <ShieldAlert size={16} className="text-blue-600" />
           Viewing in read-only mode. Only administrators can modify departments.
         </Alert>
      )}

      {deptError && <Alert className="w-full">{deptError}</Alert>}
      {empError && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
          ⚠️ {empError}
        </div>
      )}

      {isLoading ? (
        <Card className="p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={18} /> Loading departments…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-gray-400">
          <Building2 size={36} className="mx-auto mb-2 opacity-40" />
          <p className="font-medium">
            {search ? 'No departments match your search.' : 'No departments yet.'}
          </p>
          {!search && admin && (
            <Button className="mt-3" onClick={() => setModalMode('create')}>
              <Plus size={16} className="mr-2" /> Create First Department
            </Button>
          )}
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-medium">Department</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Head</th>
                <th className="px-4 py-3 font-medium text-center">Employees</th>
                <th className="px-4 py-3 font-medium text-center">Assets</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((dept) => {
                const badge = statusBadge(dept.status);
                return (
                  <tr key={dept.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                          <Building2 size={15} className="text-brand-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{dept.name}</p>
                          {dept.childCount > 0 && (
                            <p className="text-xs text-gray-400">
                              {dept.childCount} sub-dept{dept.childCount !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {dept.parentName ? (
                        <span className="flex items-center gap-1 text-xs">
                          <ChevronRight size={12} className="text-gray-400" /> {dept.parentName}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Top-level</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-gray-600">
                      {dept.headName ? (
                        <div>
                          <p className="text-sm font-medium text-gray-800">{dept.headName}</p>
                          <p className="text-xs text-gray-400">{dept.headEmail}</p>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs">Not assigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center gap-1 text-gray-600">
                        <Users size={13} className="text-gray-400" /> {dept.employeeCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-gray-600">{dept.assetCount}</td>
                    <td className="px-4 py-4">
                      <Badge variant={badge.variant}>{badge.label}</Badge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      {admin && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setActiveDept(dept); setModalMode('edit'); }}
                            className="h-8 w-8 flex items-center justify-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-brand-600 transition-colors"
                            title="Edit"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => { setActiveDept(dept); setModalMode('delete'); }}
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
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} of {departments.length} department{departments.length !== 1 ? 's' : ''}
          </div>
        </Card>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="Add Department" className="max-w-lg">
        <DepartmentForm
          departments={departments}
          employees={employees}
          onCancel={closeModal}
          onSubmit={handleCreate}
          loading={isSaving}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title="Edit Department" className="max-w-lg">
        <DepartmentForm
          dept={activeDept}
          departments={departments}
          employees={employees}
          onCancel={closeModal}
          onSubmit={handleUpdate}
          loading={isSaving}
        />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Delete Department" className="max-w-md">
        <DeleteConfirmModal
          dept={activeDept}
          onCancel={closeModal}
          onConfirm={handleDelete}
          loading={isSaving}
          error={deleteError}
        />
      </Modal>
    </div>
  );
}
