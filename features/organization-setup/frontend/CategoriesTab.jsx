import React, { useEffect, useState } from 'react';
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
import {
  Boxes,
  Loader2,
  Pencil,
  Plus,
  Search,
  Tag,
  Trash2,
  X,
  ShieldAlert
} from 'lucide-react';
import { isAdmin, authHeader } from '../../../shared/utils/auth';

const API_BASE = 'http://localhost:4000';

/* ─── Category Form ─── */
function CategoryForm({ category, onCancel, onSubmit, loading }) {
  const [form, setForm] = useState({
    name: category?.name || '',
    description: category?.description || ''
  });
  const [error, setError] = useState('');

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Category name is required.'); return; }
    try {
      await onSubmit({
        name: form.name.trim(),
        description: form.description.trim() || null
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert className="w-full">{error}</Alert>}
      <Input
        label="Category Name *"
        value={form.name}
        onChange={(e) => update('name', e.target.value)}
        placeholder="e.g. IT Equipment"
        required
      />
      <div className="flex flex-col space-y-1.5">
        <label className="text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Optional description of this asset category…"
          rows={3}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving…' : category ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
}

/* ─── Delete Confirm ─── */
function DeleteConfirmModal({ category, onCancel, onConfirm, loading, error }) {
  return (
    <div className="space-y-4">
      {error && <Alert className="w-full">{error}</Alert>}
      <p className="text-sm text-gray-600">
        Are you sure you want to delete the category <strong>{category?.name}</strong>?
        This cannot be undone.
      </p>
      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="danger" onClick={onConfirm} disabled={loading}>
          {loading ? 'Deleting…' : 'Delete Category'}
        </Button>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [modalMode, setModalMode] = useState(null);
  const [activeCategory, setActiveCategory] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const load = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch(`${API_BASE}/api/organization/categories`);
      setCategories(data.categories || []);
      setError('');
    } catch (err) {
      setError(`Could not load categories: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = categories.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const closeModal = () => { setModalMode(null); setActiveCategory(null); setDeleteError(''); };

  const handleCreate = async (payload) => {
    setIsSaving(true);
    try {
      await apiFetch(`${API_BASE}/api/organization/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      await load();
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
      await apiFetch(`${API_BASE}/api/organization/categories/${activeCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeader() },
        body: JSON.stringify(payload)
      });
      await load();
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
      const res = await fetch(`${API_BASE}/api/organization/categories/${activeCategory.id}`, {
        method: 'DELETE',
        headers: { ...authHeader() }
      });
      if (res.status === 204) { await load(); closeModal(); return; }
      const data = await res.json();
      setDeleteError(data.error || 'Failed to delete category.');
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
            placeholder="Search categories…"
            className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>
        {admin && (
          <Button className="flex items-center gap-2 shrink-0" onClick={() => setModalMode('create')}>
            <Plus size={16} /> Add Category
          </Button>
        )}
      </div>

      {!admin && (
        <Alert className="w-full bg-blue-50 text-blue-800 border-blue-200 flex items-center gap-2">
          <ShieldAlert size={16} className="text-blue-600" />
          Viewing in read-only mode. Only administrators can modify asset categories.
        </Alert>
      )}

      {error && <Alert className="w-full">{error}</Alert>}

      {isLoading ? (
        <Card className="p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={18} /> Loading categories…
        </Card>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-gray-400">
          <Tag size={36} className="mx-auto mb-2 opacity-40" />
          <p className="font-medium">{search ? 'No categories match your search.' : 'No asset categories yet.'}</p>
          {!search && admin && (
            <Button className="mt-3" onClick={() => setModalMode('create')}>
              <Plus size={16} className="mr-2" /> Create First Category
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cat) => (
            <Card key={cat.id} className="p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                    <Tag size={18} className="text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{cat.name}</p>
                    {cat.description && (
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">{cat.description}</p>
                    )}
                  </div>
                </div>
                {admin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => { setActiveCategory(cat); setModalMode('edit'); }}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-brand-600 transition-colors"
                      title="Edit"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => { setActiveCategory(cat); setModalMode('delete'); }}
                      className="h-8 w-8 flex items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                <Boxes size={14} className="text-gray-400" />
                <span className="text-sm text-gray-600">
                  <span className="font-semibold text-gray-900">{cat.assetCount}</span> asset{cat.assetCount !== 1 ? 's' : ''}
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {cat.assetCount > 0 ? (
                    <Badge variant="info">{cat.assetCount} linked</Badge>
                  ) : (
                    <Badge variant="default">Unused</Badge>
                  )}
                </span>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filtered.length > 0 && (
        <p className="text-xs text-gray-400 text-right">
          Showing {filtered.length} of {categories.length} categories
        </p>
      )}

      {/* Create Modal */}
      <Modal isOpen={modalMode === 'create'} onClose={closeModal} title="Add Asset Category" className="max-w-md">
        <CategoryForm onCancel={closeModal} onSubmit={handleCreate} loading={isSaving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={modalMode === 'edit'} onClose={closeModal} title="Edit Asset Category" className="max-w-md">
        <CategoryForm category={activeCategory} onCancel={closeModal} onSubmit={handleUpdate} loading={isSaving} />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={modalMode === 'delete'} onClose={closeModal} title="Delete Category" className="max-w-md">
        <DeleteConfirmModal
          category={activeCategory}
          onCancel={closeModal}
          onConfirm={handleDelete}
          loading={isSaving}
          error={deleteError}
        />
      </Modal>
    </div>
  );
}
