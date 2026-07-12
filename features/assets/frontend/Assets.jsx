import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Modal, Select } from '../../../shared/ui-components';
import {
  Boxes,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  Filter,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  SlidersHorizontal,
  X
} from 'lucide-react';
import AssetDetail from './AssetDetail';
import RegisterAssetForm from './RegisterAssetForm';
import { isManagerOrAbove } from '../../../shared/utils/auth';

const API_BASE = 'http://localhost:4000';
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

function formatDate(value) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

function statusBadge(status) {
  switch (status) {
    case 'AVAILABLE':
      return { label: 'Available', variant: 'success' };
    case 'ALLOCATED':
      return { label: 'Allocated', variant: 'info' };
    case 'UNDER_MAINTENANCE':
      return { label: 'Maintenance', variant: 'warning' };
    case 'RESERVED':
      return { label: 'Reserved', variant: 'brand' };
    case 'LOST':
      return { label: 'Lost', variant: 'danger' };
    case 'RETIRED':
      return { label: 'Retired', variant: 'default' };
    case 'DISPOSED':
      return { label: 'Disposed', variant: 'default' };
    default:
      return { label: status, variant: 'default' };
  }
}

const statusOptions = [
  { label: 'All Statuses', value: 'ALL' },
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Allocated', value: 'ALLOCATED' },
  { label: 'Maintenance', value: 'UNDER_MAINTENANCE' },
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Lost', value: 'LOST' },
  { label: 'Retired', value: 'RETIRED' },
  { label: 'Disposed', value: 'DISPOSED' }
];

const sortOptions = [
  { label: 'Recently Updated', value: 'updated_desc' },
  { label: 'Tag A–Z', value: 'tag_asc' },
  { label: 'Tag Z–A', value: 'tag_desc' },
  { label: 'Name A–Z', value: 'name_asc' },
  { label: 'Name Z–A', value: 'name_desc' },
  { label: 'Location A–Z', value: 'location_asc' },
  { label: 'Cost ↑', value: 'cost_asc' },
  { label: 'Cost ↓', value: 'cost_desc' }
];

const bookableOptions = [
  { label: 'All', value: 'ALL' },
  { label: 'Bookable', value: 'YES' },
  { label: 'Not Bookable', value: 'NO' }
];

const conditionOptions = [
  { label: 'All Conditions', value: 'ALL' },
  { label: 'New', value: 'New' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Damaged', value: 'Damaged' }
];

/* ─── More Filters Drawer ─── */
function MoreFiltersPanel({ open, onClose, filters, setFilters, categories, onApply, onClear }) {
  const [local, setLocal] = useState(filters);

  useEffect(() => {
    setLocal(filters);
  }, [filters, open]);

  if (!open) return null;

  const update = (key, value) => setLocal((prev) => ({ ...prev, [key]: value }));

  const categoryOpts = [
    { label: 'All Categories', value: 'ALL' },
    ...categories.map((c) => ({ label: c.name, value: c.name }))
  ];

  return (
    <div className="fixed inset-0 z-40 flex" aria-modal="true">
      {/* backdrop */}
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      {/* panel */}
      <div className="relative w-80 bg-white h-full shadow-xl overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <SlidersHorizontal size={16} /> Advanced Filters
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Category
            </label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={local.category}
              onChange={(e) => update('category', e.target.value)}
            >
              {categoryOpts.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={local.status}
              onChange={(e) => update('status', e.target.value)}
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Condition
            </label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={local.condition}
              onChange={(e) => update('condition', e.target.value)}
            >
              {conditionOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Bookable */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Bookable
            </label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={local.bookable}
              onChange={(e) => update('bookable', e.target.value)}
            >
              {bookableOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          {/* Location keyword */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Location contains
            </label>
            <input
              type="text"
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="e.g. Floor 2"
              value={local.location}
              onChange={(e) => update('location', e.target.value)}
            />
          </div>

          {/* Acquisition date range */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Acquisition Date Range
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={local.dateFrom}
                onChange={(e) => update('dateFrom', e.target.value)}
              />
              <span className="self-center text-gray-400 text-sm">–</span>
              <input
                type="date"
                className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                value={local.dateTo}
                onChange={(e) => update('dateTo', e.target.value)}
              />
            </div>
          </div>

          {/* Assigned / Unassigned */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Assignment
            </label>
            <select
              className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={local.assignment}
              onChange={(e) => update('assignment', e.target.value)}
            >
              <option value="ALL">All</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNASSIGNED">Unassigned</option>
            </select>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-5 py-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const cleared = { category: 'ALL', status: 'ALL', condition: 'ALL', bookable: 'ALL', location: '', dateFrom: '', dateTo: '', assignment: 'ALL' };
              setLocal(cleared);
              setFilters(cleared);
              onClear();
              onClose();
            }}
          >
            Clear All
          </Button>
          <Button
            className="flex-1"
            onClick={() => {
              setFilters(local);
              onApply(local);
              onClose();
            }}
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Export helper ─── */
function exportToCSV(assets) {
  const headers = ['Tag', 'Name', 'Category', 'Status', 'Location', 'Condition', 'Serial Number', 'Assigned To', 'Bookable', 'Updated At'];
  const rows = assets.map((a) => [
    a.tag,
    a.name,
    a.category,
    a.status,
    a.location,
    a.condition,
    a.serialNumber || '',
    a.allocatedTo || 'Unassigned',
    a.isBookable ? 'Yes' : 'No',
    a.updatedAt ? formatDate(a.updatedAt) : ''
  ]);

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `assets-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

/* ─── Main Assets Component ─── */
export function Assets() {
  const isManager = isManagerOrAbove();
  const [summary, setSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated_desc');

  // Advanced filters
  const defaultAdvanced = { category: 'ALL', status: 'ALL', condition: 'ALL', bookable: 'ALL', location: '', dateFrom: '', dateTo: '', assignment: 'ALL' };
  const [advancedFilters, setAdvancedFilters] = useState(defaultAdvanced);
  const [appliedAdvanced, setAppliedAdvanced] = useState(defaultAdvanced);
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [activeAsset, setActiveAsset] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReloading, setIsReloading] = useState(false);
  const [error, setError] = useState('');

  const loadAssets = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsReloading(true);
      } else {
        setIsLoading(true);
      }

        const token = localStorage.getItem('assetflow_token');
        const response = await fetch(`${API_BASE}/api/assets`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('application/json')) {
        const fallbackText = await response.text();
        throw new Error(
          fallbackText.includes('Cannot GET')
            ? 'Assets API route is not available'
            : 'Unexpected non-JSON response from assets API'
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load assets');
      }

      setSummary(data.metrics);
      setAssets(data.assets);
      setCategories(data.categories || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setIsLoading(false);
      setIsReloading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter, sortBy, appliedAdvanced]);

  const filteredAssets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = assets.filter((asset) => {
      const matchesSearch =
        !query ||
        [asset.tag, asset.name, asset.category, asset.location, asset.allocatedTo, asset.status, asset.serialNumber]
          .filter(Boolean)
          .some((field) => field.toLowerCase().includes(query));

      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;

      // Advanced filters
      const matchesCategory = appliedAdvanced.category === 'ALL' || asset.category === appliedAdvanced.category;
      const matchesAdvStatus = appliedAdvanced.status === 'ALL' || asset.status === appliedAdvanced.status;
      const matchesCondition = appliedAdvanced.condition === 'ALL' || asset.condition === appliedAdvanced.condition;
      const matchesBookable =
        appliedAdvanced.bookable === 'ALL' ||
        (appliedAdvanced.bookable === 'YES' && asset.isBookable) ||
        (appliedAdvanced.bookable === 'NO' && !asset.isBookable);
      const matchesLocation =
        !appliedAdvanced.location ||
        (asset.location || '').toLowerCase().includes(appliedAdvanced.location.toLowerCase());
      const matchesDateFrom =
        !appliedAdvanced.dateFrom ||
        (asset.acquisitionDate && new Date(asset.acquisitionDate) >= new Date(appliedAdvanced.dateFrom));
      const matchesDateTo =
        !appliedAdvanced.dateTo ||
        (asset.acquisitionDate && new Date(asset.acquisitionDate) <= new Date(appliedAdvanced.dateTo));
      const matchesAssignment =
        appliedAdvanced.assignment === 'ALL' ||
        (appliedAdvanced.assignment === 'ASSIGNED' && asset.allocatedTo) ||
        (appliedAdvanced.assignment === 'UNASSIGNED' && !asset.allocatedTo);

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesAdvStatus &&
        matchesCondition &&
        matchesBookable &&
        matchesLocation &&
        matchesDateFrom &&
        matchesDateTo &&
        matchesAssignment
      );
    });

    const sorted = [...filtered];

    switch (sortBy) {
      case 'tag_asc':
        sorted.sort((a, b) => a.tag.localeCompare(b.tag));
        break;
      case 'tag_desc':
        sorted.sort((a, b) => b.tag.localeCompare(a.tag));
        break;
      case 'name_asc':
        sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name_desc':
        sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'location_asc':
        sorted.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
        break;
      case 'cost_asc':
        sorted.sort((a, b) => Number(a.acquisitionCost || 0) - Number(b.acquisitionCost || 0));
        break;
      case 'cost_desc':
        sorted.sort((a, b) => Number(b.acquisitionCost || 0) - Number(a.acquisitionCost || 0));
        break;
      default:
        sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
    }

    return sorted;
  }, [assets, searchTerm, statusFilter, sortBy, appliedAdvanced]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredAssets.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagedAssets = filteredAssets.slice((safePage - 1) * pageSize, safePage * pageSize);

  const metrics = summary
    ? [
        { label: 'Total Assets', value: summary.totalAssets, Icon: Boxes, color: 'text-brand-600 bg-brand-50' },
        { label: 'Available', value: summary.availableAssets, Icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
        { label: 'Allocated', value: summary.allocatedAssets, Icon: Search, color: 'text-blue-600 bg-blue-50' },
        { label: 'Maintenance', value: summary.maintenanceAssets, Icon: Clock3, color: 'text-amber-600 bg-amber-50' }
      ]
    : [];

  const allSelected = pagedAssets.length > 0 && pagedAssets.every((a) => selectedAssetIds.includes(a.id));
  const someSelected = selectedAssetIds.length > 0;

  const toggleAssetSelection = (assetId) => {
    setSelectedAssetIds((current) =>
      current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId]
    );
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedAssetIds((prev) => prev.filter((id) => !pagedAssets.some((a) => a.id === id)));
    } else {
      const pageIds = pagedAssets.map((a) => a.id);
      setSelectedAssetIds((prev) => [...new Set([...prev, ...pageIds])]);
    }
  };

  const hasActiveAdvancedFilters =
    appliedAdvanced.category !== 'ALL' ||
    appliedAdvanced.status !== 'ALL' ||
    appliedAdvanced.condition !== 'ALL' ||
    appliedAdvanced.bookable !== 'ALL' ||
    appliedAdvanced.location ||
    appliedAdvanced.dateFrom ||
    appliedAdvanced.dateTo ||
    appliedAdvanced.assignment !== 'ALL';

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('ALL');
    setSortBy('updated_desc');
    setAdvancedFilters(defaultAdvanced);
    setAppliedAdvanced(defaultAdvanced);
    setSelectedAssetIds([]);
    setPage(1);
  };

  const openCreateModal = () => {
    setActiveAsset(null);
    setModalMode('create');
    setIsCreateModalOpen(true);
  };

  const openDetailModal = (asset) => {
    setActiveAsset(asset);
    setModalMode('detail');
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setActiveAsset(null);
    setModalMode(null);
  };

  const handleCreateAsset = async (payload) => {
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) throw new Error(result.error || 'Failed to create asset');

      await loadAssets(true);
      closeModals();
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateAsset = async (payload, assetId = activeAsset?.id) => {
    if (!assetId) return;
    setIsSaving(true);
    try {
      const response = await fetch(`${API_BASE}/api/assets/${assetId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const contentType = response.headers.get('content-type') || '';
      const result = contentType.includes('application/json')
        ? await response.json()
        : { error: await response.text() };

      if (!response.ok) throw new Error(result.error || 'Failed to update asset');

      await loadAssets(true);
      closeModals();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetireAsset = async (asset) => {
    await handleUpdateAsset({ status: 'RETIRED' }, asset.id);
  };

  const handleExport = () => {
    const toExport = someSelected
      ? filteredAssets.filter((a) => selectedAssetIds.includes(a.id))
      : filteredAssets;
    exportToCSV(toExport);
  };

  /* ─── Render ─── */
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Directory</h1>
          <p className="text-sm text-gray-500">Manage, filter, and track all registered enterprise assets.</p>
        </div>
        {isManager && (
          <Button className="flex items-center gap-2" onClick={openCreateModal}>
            <Plus size={16} />
            Register Asset
          </Button>
        )}
      </div>

      {error && <Alert className="w-full">{error}</Alert>}

      {isLoading ? (
        <Card className="p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={18} />
          Loading assets...
        </Card>
      ) : (
        <>
          {/* Metric cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.Icon;
              return (
                <Card key={metric.label} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {metric.label}
                    </span>
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${metric.color}`}>
                      <Icon size={16} />
                    </div>
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{metric.value}</div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4 space-y-4">
            {/* Search & filters row */}
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto_auto_auto]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by tag, name, serial, location…"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={statusOptions}
              />

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                options={sortOptions}
              />

              <Button
                variant={hasActiveAdvancedFilters ? 'default' : 'outline'}
                onClick={() => setIsFilterPanelOpen(true)}
                className="h-10 gap-2 whitespace-nowrap"
              >
                <SlidersHorizontal size={16} />
                More Filters
                {hasActiveAdvancedFilters && (
                  <span className="ml-1 h-5 w-5 rounded-full bg-white text-brand-900 text-xs font-bold flex items-center justify-center">
                    ✓
                  </span>
                )}
              </Button>

              {(searchTerm || statusFilter !== 'ALL' || hasActiveAdvancedFilters) && (
                <Button variant="outline" onClick={clearAllFilters} className="h-10 gap-2 whitespace-nowrap text-gray-500">
                  <X size={14} />
                  Clear
                </Button>
              )}
            </div>

            {/* Results info + actions */}
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-gray-500">
              <div>
                Showing {filteredAssets.length === 0 ? 0 : (safePage - 1) * pageSize + 1}–
                {Math.min(safePage * pageSize, filteredAssets.length)} of {filteredAssets.length} assets
                {someSelected ? ` · ${selectedAssetIds.length} selected` : ''}
                {hasActiveAdvancedFilters && (
                  <span className="ml-2 text-xs text-brand-600 font-medium">· Advanced filters active</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {/* Page size picker */}
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="h-9 rounded-md border border-gray-300 bg-white px-2 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n} / page</option>
                  ))}
                </select>

                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs gap-1.5"
                  onClick={handleExport}
                  title={someSelected ? `Export ${selectedAssetIds.length} selected` : 'Export all filtered assets'}
                >
                  <Download size={14} />
                  {someSelected ? `Export (${selectedAssetIds.length})` : 'Export CSV'}
                </Button>

                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs gap-1.5"
                  onClick={() => loadAssets(true)}
                  disabled={isReloading}
                >
                  <RefreshCw size={14} className={isReloading ? 'animate-spin' : ''} />
                  {isReloading ? 'Refreshing…' : 'Refresh'}
                </Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-500"
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Asset Tag</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Assigned To</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {pagedAssets.length > 0 ? (
                    pagedAssets.map((asset) => {
                      const badge = statusBadge(asset.status);
                      const isSelected = selectedAssetIds.includes(asset.id);

                      return (
                        <tr
                          key={asset.id}
                          className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-brand-50' : ''}`}
                        >
                          <td className="px-4 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleAssetSelection(asset.id)}
                              className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-500"
                            />
                          </td>
                          <td className="px-4 py-4 font-medium text-gray-900">
                            <button
                              onClick={() => openDetailModal(asset)}
                              className="hover:text-brand-600 hover:underline transition-colors text-left"
                            >
                              {asset.tag}
                            </button>
                          </td>
                          <td className="px-4 py-4 text-gray-600">{asset.name}</td>
                          <td className="px-4 py-4 text-gray-600">{asset.category}</td>
                          <td className="px-4 py-4 text-gray-600">{asset.location}</td>
                          <td className="px-4 py-4">
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </td>
                          <td className="px-4 py-4 text-gray-600">
                            {asset.allocatedTo || (
                              <span className="text-gray-400 italic">Unassigned</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-right">
                            <button
                              onClick={() => openDetailModal(asset)}
                              className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                            >
                              <MoreHorizontal size={14} />
                              {isManager ? 'Manage' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                        <Search size={32} className="mx-auto mb-2 opacity-40" />
                        <p className="font-medium">No assets match your search.</p>
                        {(searchTerm || statusFilter !== 'ALL' || hasActiveAdvancedFilters) && (
                          <button
                            onClick={clearAllFilters}
                            className="mt-2 text-sm text-brand-600 hover:underline"
                          >
                            Clear all filters
                          </button>
                        )}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-500">
              <span>
                Page {safePage} of {totalPages}
                {filteredAssets.length > 0
                  ? ` · ${filteredAssets.length} total`
                  : ''}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 flex items-center justify-center"
                  onClick={() => setPage(1)}
                  disabled={safePage === 1}
                  title="First page"
                >
                  «
                </Button>
                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs gap-1"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage === 1}
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>

                {/* Page number pills */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (safePage <= 3) {
                    pageNum = i + 1;
                  } else if (safePage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = safePage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === safePage ? 'default' : 'outline'}
                      className="h-9 w-9 p-0 text-xs"
                      onClick={() => setPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  className="h-9 px-3 text-xs gap-1"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage === totalPages}
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
                <Button
                  variant="outline"
                  className="h-9 w-9 p-0 flex items-center justify-center"
                  onClick={() => setPage(totalPages)}
                  disabled={safePage === totalPages}
                  title="Last page"
                >
                  »
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* Advanced filters panel */}
      <MoreFiltersPanel
        open={isFilterPanelOpen}
        onClose={() => setIsFilterPanelOpen(false)}
        filters={advancedFilters}
        setFilters={setAdvancedFilters}
        categories={categories}
        onApply={(filters) => setAppliedAdvanced(filters)}
        onClear={() => setAppliedAdvanced(defaultAdvanced)}
      />

      {/* Create modal */}
      <Modal isOpen={isCreateModalOpen} onClose={closeModals} title="Register Asset" className="max-w-3xl">
        <RegisterAssetForm
          categories={categories}
          loading={isSaving}
          submitLabel="Create Asset"
          onCancel={closeModals}
          onSubmit={handleCreateAsset}
        />
      </Modal>

      {/* Detail / Edit modal */}
      <Modal
        isOpen={modalMode === 'detail' || modalMode === 'edit'}
        onClose={closeModals}
        title={modalMode === 'edit' ? 'Edit Asset' : 'Asset Details'}
        className="max-w-3xl"
      >
        {modalMode === 'detail' && activeAsset ? (
          <AssetDetail
            asset={activeAsset}
            onClose={closeModals}
            onEdit={(asset) => {
              setActiveAsset(asset);
              setModalMode('edit');
            }}
            onRetire={handleRetireAsset}
            isManager={isManager}
          />
        ) : modalMode === 'edit' && activeAsset ? (
          <RegisterAssetForm
            asset={activeAsset}
            categories={categories}
            loading={isSaving}
            submitLabel="Update Asset"
            onCancel={closeModals}
            onSubmit={(payload) => handleUpdateAsset(payload, activeAsset.id)}
          />
        ) : null}
      </Modal>
    </div>
  );
}

export default Assets;
