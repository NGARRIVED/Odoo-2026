import React, { useEffect, useState } from 'react';
import { Alert, Button, Input, Select } from '../../../shared/ui-components';

const statusOptions = [
  { label: 'Available', value: 'AVAILABLE' },
  { label: 'Allocated', value: 'ALLOCATED' },
  { label: 'Maintenance', value: 'UNDER_MAINTENANCE' },
  { label: 'Reserved', value: 'RESERVED' },
  { label: 'Lost', value: 'LOST' },
  { label: 'Retired', value: 'RETIRED' },
  { label: 'Disposed', value: 'DISPOSED' }
];

const conditionOptions = [
  { label: 'Select condition...', value: '' },
  { label: 'New', value: 'New' },
  { label: 'Good', value: 'Good' },
  { label: 'Fair', value: 'Fair' },
  { label: 'Poor', value: 'Poor' },
  { label: 'Damaged', value: 'Damaged' }
];

export default function RegisterAssetForm({
  asset,
  categories = [],
  onCancel,
  onSubmit,
  loading = false,
  submitLabel = 'Save Asset'
}) {
  const [formData, setFormData] = useState({
    tag: '',
    name: '',
    categoryName: '',
    status: 'AVAILABLE',
    location: '',
    condition: '',
    serialNumber: '',
    acquisitionDate: '',
    acquisitionCost: '',
    isBookable: false,
    qrCode: ''
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!asset) return;

    setFormData({
      tag: asset.tag || '',
      name: asset.name || '',
      categoryName: asset.category || '',
      status: asset.status || 'AVAILABLE',
      location: asset.location === 'Unassigned' ? '' : asset.location || '',
      condition: asset.condition === 'Unknown' ? '' : asset.condition || '',
      serialNumber: asset.serialNumber || '',
      acquisitionDate: asset.acquisitionDate ? String(asset.acquisitionDate).slice(0, 10) : '',
      acquisitionCost: asset.acquisitionCost || '',
      isBookable: Boolean(asset.isBookable),
      qrCode: asset.qrCode || ''
    });
  }, [asset]);

  const updateField = (key, value) => {
    setFormData((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!formData.tag.trim() || !formData.name.trim() || !formData.categoryName.trim()) {
      setError('Tag, name, and category are required.');
      return;
    }

    try {
      await onSubmit({
        ...formData,
        tag: formData.tag.trim(),
        name: formData.name.trim(),
        categoryName: formData.categoryName.trim(),
        location: formData.location.trim(),
        condition: formData.condition.trim(),
        serialNumber: formData.serialNumber.trim(),
        acquisitionCost: formData.acquisitionCost ? String(formData.acquisitionCost).trim() : '',
        qrCode: formData.qrCode.trim()
      });
    } catch (submitError) {
      setError(submitError.message);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert className="w-full">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Asset Tag *"
          value={formData.tag}
          onChange={(e) => updateField('tag', e.target.value)}
          placeholder="AST-1001"
          required
        />
        <Input
          label="Asset Name *"
          value={formData.name}
          onChange={(e) => updateField('name', e.target.value)}
          placeholder="Laptop Pro"
          required
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Category *"
          list="asset-categories"
          value={formData.categoryName}
          onChange={(e) => updateField('categoryName', e.target.value)}
          placeholder="IT Equipment"
          required
        />
        <Input
          label="Location"
          value={formData.location}
          onChange={(e) => updateField('location', e.target.value)}
          placeholder="HQ - Floor 3"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Serial Number"
          value={formData.serialNumber}
          onChange={(e) => updateField('serialNumber', e.target.value)}
          placeholder="SN-001"
        />
        <Select
          label="Condition"
          value={formData.condition}
          onChange={(e) => updateField('condition', e.target.value)}
          options={conditionOptions}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Acquisition Date"
          type="date"
          value={formData.acquisitionDate}
          onChange={(e) => updateField('acquisitionDate', e.target.value)}
        />
        <Input
          label="Acquisition Cost"
          type="number"
          step="0.01"
          min="0"
          value={formData.acquisitionCost}
          onChange={(e) => updateField('acquisitionCost', e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => updateField('status', e.target.value)}
          options={statusOptions}
        />
        <div className="flex items-center gap-3 rounded-md border border-gray-300 px-3 py-2 mt-7 h-10">
          <input
            id="bookable"
            type="checkbox"
            checked={formData.isBookable}
            onChange={(e) => updateField('isBookable', e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-brand-900 focus:ring-brand-500"
          />
          <label htmlFor="bookable" className="text-sm text-gray-700 cursor-pointer select-none">
            Bookable asset
          </label>
        </div>
      </div>

      <Input
        label="QR Code"
        value={formData.qrCode}
        onChange={(e) => updateField('qrCode', e.target.value)}
        placeholder="Optional QR code reference"
      />

      <datalist id="asset-categories">
        {categories.map((category) => (
          <option key={category.id || category.name} value={category.name} />
        ))}
      </datalist>

      <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
