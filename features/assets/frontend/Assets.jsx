import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Select } from '../../../shared/ui-components';
import { Boxes, CheckCircle2, Clock3, Filter, Loader2, MoreHorizontal, Search } from 'lucide-react';

const API_BASE = 'http://localhost:4000';

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

const categoryOptions = [
  { label: 'All Categories', value: 'ALL' }
];

const sortOptions = [
  { label: 'Recently Updated', value: 'updated_desc' },
  { label: 'Tag A-Z', value: 'tag_asc' },
  { label: 'Tag Z-A', value: 'tag_desc' },
  { label: 'Location A-Z', value: 'location_asc' }
];

export function Assets() {
  const [summary, setSummary] = useState(null);
  const [assets, setAssets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('updated_desc');
  const [selectedAssetIds, setSelectedAssetIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadAssets() {
      try {
        const response = await fetch(`${API_BASE}/api/assets`);
        const contentType = response.headers.get('content-type') || '';

        if (!contentType.includes('application/json')) {
          const fallbackText = await response.text();
          throw new Error(fallbackText.includes('Cannot GET') ? 'Assets API route is not available' : 'Unexpected non-JSON response from assets API');
        }

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load assets');
        }

        if (mounted) {
          setSummary(data.metrics);
          setAssets(data.assets);
          const seenCategories = new Set(data.assets.map((asset) => asset.category));
          categoryOptions.splice(1, categoryOptions.length - 1, ...Array.from(seenCategories).sort().map((category) => ({
            label: category,
            value: category
          })));
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError.message);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    loadAssets();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredAssets = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    const filtered = assets.filter((asset) => {
      const matchesSearch = !query || [asset.tag, asset.name, asset.category, asset.location, asset.allocatedTo, asset.status]
        .filter(Boolean)
        .some((field) => field.toLowerCase().includes(query));

      const matchesCategory = categoryFilter === 'ALL' || asset.category === categoryFilter;
      const matchesStatus = statusFilter === 'ALL' || asset.status === statusFilter;

      return matchesSearch && matchesCategory && matchesStatus;
    });

    const sorted = [...filtered];

    switch (sortBy) {
      case 'tag_asc':
        sorted.sort((a, b) => a.tag.localeCompare(b.tag));
        break;
      case 'tag_desc':
        sorted.sort((a, b) => b.tag.localeCompare(a.tag));
        break;
      case 'location_asc':
        sorted.sort((a, b) => a.location.localeCompare(b.location));
        break;
      default:
        sorted.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        break;
    }

    return sorted;
  }, [assets, searchTerm, categoryFilter, statusFilter, sortBy]);

  const metrics = summary
    ? [
        { label: 'Total Assets', value: summary.totalAssets, Icon: Boxes },
        { label: 'Available', value: summary.availableAssets, Icon: CheckCircle2 },
        { label: 'Allocated', value: summary.allocatedAssets, Icon: Search },
        { label: 'Maintenance', value: summary.maintenanceAssets, Icon: Clock3 }
      ]
    : [];

  const allSelected = filteredAssets.length > 0 && selectedAssetIds.length === filteredAssets.length;

  const toggleAssetSelection = (assetId) => {
    setSelectedAssetIds((current) => {
      if (current.includes(assetId)) {
        return current.filter((id) => id !== assetId);
      }

      return [...current, assetId];
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedAssetIds([]);
      return;
    }

    setSelectedAssetIds(filteredAssets.map((asset) => asset.id));
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setSortBy('updated_desc');
    setSelectedAssetIds([]);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Asset Directory</h1>
          <p className="text-sm text-gray-500">Manage, filter, and track all registered enterprise assets.</p>
        </div>
        <Button className="flex items-center gap-2">
          <Boxes size={16} />
          Register Asset
        </Button>
      </div>

      {error && <Alert className="w-full">{error}</Alert>}

      {isLoading ? (
        <Card className="p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={18} />
          Loading assets...
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metrics.map((metric) => {
              const Icon = metric.Icon;

              return (
                <Card key={metric.label} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{metric.label}</span>
                    <Icon size={16} className="text-gray-400" />
                  </div>
                  <div className="mt-2 text-3xl font-bold text-gray-900">{metric.value}</div>
                </Card>
              );
            })}
          </div>

          <Card className="p-4 space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Asset Tag / Serial"
                  className="h-10 w-full rounded-md border border-gray-300 bg-white pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                options={categoryOptions}
              />

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

              <Button variant="outline" onClick={clearFilters} className="h-10 gap-2 whitespace-nowrap">
                <Filter size={16} />
                More Filters
              </Button>
            </div>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-sm text-gray-500">
              <div>
                Showing {filteredAssets.length} of {assets.length} entries
                {selectedAssetIds.length > 0 ? ` · ${selectedAssetIds.length} selected` : ''}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 px-3 text-xs">Export</Button>
                <Button variant="outline" className="h-9 px-3 text-xs">Refresh</Button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-medium w-10">
                      <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-500" />
                    </th>
                    <th className="px-4 py-3 font-medium">Asset Tag</th>
                    <th className="px-4 py-3 font-medium">Asset Name</th>
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredAssets.length > 0 ? filteredAssets.map((asset) => {
                    const badge = statusBadge(asset.status);
                    const isSelected = selectedAssetIds.includes(asset.id);

                    return (
                      <tr key={asset.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAssetSelection(asset.id)}
                            className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-500"
                          />
                        </td>
                        <td className="px-4 py-4 font-medium text-gray-900">{asset.tag}</td>
                        <td className="px-4 py-4 text-gray-600">{asset.name}</td>
                        <td className="px-4 py-4 text-gray-600">{asset.category}</td>
                        <td className="px-4 py-4 text-gray-600">{asset.location}</td>
                        <td className="px-4 py-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                        <td className="px-4 py-4 text-right">
                          <button className="inline-flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50">
                            <MoreHorizontal size={14} />
                            Actions
                          </button>
                        </td>
                      </tr>
                    );
                  }) : (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                        No assets match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-500">
              <span>Showing 1 to {filteredAssets.length} of {filteredAssets.length} entries</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="h-9 px-3 text-xs">Previous</Button>
                <Button variant="outline" className="h-9 px-3 text-xs">Next</Button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

export default Assets;
