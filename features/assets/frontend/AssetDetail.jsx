import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Card } from '../../../shared/ui-components';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../../shared/ui-components';
import {
  AlertTriangle,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  MapPin,
  PencilLine,
  Tag,
  Trash2,
  User,
  Wrench,
  X
} from 'lucide-react';

const API_BASE = 'http://localhost:4000';

function formatDate(value) {
  return value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      }).format(new Date(value))
    : 'N/A';
}

function formatDateTime(value) {
  return value
    ? new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date(value))
    : 'N/A';
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

function allocationStatusBadge(status) {
  switch (status) {
    case 'ACTIVE':
      return { label: 'Active', variant: 'success' };
    case 'RETURNED':
      return { label: 'Returned', variant: 'default' };
    case 'OVERDUE':
      return { label: 'Overdue', variant: 'danger' };
    default:
      return { label: status, variant: 'default' };
  }
}

function maintenanceStatusBadge(status) {
  switch (status) {
    case 'PENDING':
      return { label: 'Pending', variant: 'warning' };
    case 'APPROVED':
      return { label: 'Approved', variant: 'info' };
    case 'REJECTED':
      return { label: 'Rejected', variant: 'danger' };
    case 'TECHNICIAN_ASSIGNED':
      return { label: 'Assigned', variant: 'brand' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', variant: 'warning' };
    case 'RESOLVED':
      return { label: 'Resolved', variant: 'success' };
    default:
      return { label: status, variant: 'default' };
  }
}

function priorityBadge(priority) {
  switch (priority) {
    case 'LOW':
      return { label: 'Low', variant: 'default' };
    case 'MEDIUM':
      return { label: 'Medium', variant: 'info' };
    case 'HIGH':
      return { label: 'High', variant: 'warning' };
    case 'CRITICAL':
      return { label: 'Critical', variant: 'danger' };
    default:
      return { label: priority, variant: 'default' };
  }
}

function bookingStatusBadge(status) {
  switch (status) {
    case 'UPCOMING':
      return { label: 'Upcoming', variant: 'info' };
    case 'ONGOING':
      return { label: 'Ongoing', variant: 'success' };
    case 'COMPLETED':
      return { label: 'Completed', variant: 'default' };
    case 'CANCELLED':
      return { label: 'Cancelled', variant: 'danger' };
    default:
      return { label: status, variant: 'default' };
  }
}

function OverviewTab({ asset, details }) {
  const badge = statusBadge(asset.status);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-gray-500">Location</div>
          <div className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
            <MapPin size={16} className="text-gray-400" />
            {asset.location}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-gray-500">Serial Number</div>
          <div className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
            <Tag size={16} className="text-gray-400" />
            {asset.serialNumber || 'Not assigned'}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-gray-500">Condition</div>
          <div className="mt-1 text-gray-900 font-medium">{asset.condition}</div>
        </Card>
        <Card className="p-4">
          <div className="text-xs uppercase tracking-wider text-gray-500">Bookable</div>
          <div className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
            {asset.isBookable ? (
              <><CheckCircle size={16} className="text-green-500" /> Yes</>
            ) : (
              <><X size={16} className="text-gray-400" /> No</>
            )}
          </div>
        </Card>
        {asset.acquisitionDate && (
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500">Acquisition Date</div>
            <div className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
              <CalendarDays size={16} className="text-gray-400" />
              {formatDate(asset.acquisitionDate)}
            </div>
          </Card>
        )}
        {asset.acquisitionCost && (
          <Card className="p-4">
            <div className="text-xs uppercase tracking-wider text-gray-500">Acquisition Cost</div>
            <div className="mt-1 flex items-center gap-2 text-gray-900 font-medium">
              <DollarSign size={16} className="text-gray-400" />
              {Number(asset.acquisitionCost).toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
            </div>
          </Card>
        )}
        {asset.qrCode && (
          <Card className="p-4 sm:col-span-2">
            <div className="text-xs uppercase tracking-wider text-gray-500">QR Code</div>
            <div className="mt-1 text-gray-900 font-medium font-mono text-sm">{asset.qrCode}</div>
          </Card>
        )}
      </div>

      <Card className="p-4">
        <div className="text-xs uppercase tracking-wider text-gray-500 mb-2">Last Updated</div>
        <div className="flex items-center gap-2 text-gray-700 text-sm">
          <Clock size={14} className="text-gray-400" />
          {formatDateTime(asset.updatedAt)}
        </div>
      </Card>
    </div>
  );
}

function AllocationHistoryTab({ allocations = [] }) {
  if (allocations.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        <User size={32} className="mx-auto mb-2 opacity-40" />
        No allocation history found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {allocations.map((alloc) => {
        const badge = allocationStatusBadge(alloc.status);
        return (
          <Card key={alloc.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center">
                  <User size={16} className="text-brand-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">{alloc.employee?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{alloc.employee?.email || ''}</div>
                </div>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <div>
                <span className="font-medium text-gray-700">Allocated: </span>
                {formatDate(alloc.allocatedDate)}
              </div>
              {alloc.expectedReturnDate && (
                <div>
                  <span className="font-medium text-gray-700">Expected Return: </span>
                  {formatDate(alloc.expectedReturnDate)}
                </div>
              )}
              {alloc.actualReturnDate && (
                <div>
                  <span className="font-medium text-gray-700">Returned: </span>
                  {formatDate(alloc.actualReturnDate)}
                </div>
              )}
              {alloc.conditionNotes && (
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Notes: </span>
                  {alloc.conditionNotes}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function MaintenanceTab({ maintenanceRequests = [] }) {
  if (maintenanceRequests.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        <Wrench size={32} className="mx-auto mb-2 opacity-40" />
        No maintenance history found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {maintenanceRequests.map((req) => {
        const statusB = maintenanceStatusBadge(req.status);
        const priorityB = priorityBadge(req.priority);
        return (
          <Card key={req.id} className="p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{req.issueDescription}</p>
                {req.technicianName && (
                  <p className="text-xs text-gray-500 mt-0.5">Technician: {req.technicianName}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant={priorityB.variant}>{priorityB.label}</Badge>
                <Badge variant={statusB.variant}>{statusB.label}</Badge>
              </div>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex gap-4">
              <span>Raised: {formatDate(req.createdAt)}</span>
              {req.resolvedAt && <span>Resolved: {formatDate(req.resolvedAt)}</span>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function BookingsTab({ bookings = [] }) {
  if (bookings.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400 text-sm">
        <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
        No booking history found.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bookings.map((booking) => {
        const badge = bookingStatusBadge(booking.status);
        return (
          <Card key={booking.id} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                  <BookOpen size={14} className="text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900 text-sm">
                    {booking.bookedBy?.name || 'Unknown'}
                  </div>
                  <div className="text-xs text-gray-500">{booking.purpose || 'No purpose stated'}</div>
                </div>
              </div>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </div>
            <div className="mt-2 text-xs text-gray-500 flex gap-4 flex-wrap">
              <span>Start: {formatDateTime(booking.startTime)}</span>
              <span>End: {formatDateTime(booking.endTime)}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

export default function AssetDetail({ asset, onClose, onEdit, onRetire, isManager = true }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [details, setDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState('');

  useEffect(() => {
    if (!asset?.id) return;

    setIsLoadingDetails(true);
    setDetailError('');

    fetch(`${API_BASE}/api/assets/${asset.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.details) {
          setDetails(data.details);
        }
      })
      .catch((err) => {
        setDetailError('Could not load full asset details.');
      })
      .finally(() => {
        setIsLoadingDetails(false);
      });
  }, [asset?.id]);

  if (!asset) return null;

  const badge = statusBadge(asset.status);

  const allocations = details?.allocations || [];
  const maintenanceRequests = details?.maintenanceRequests || [];
  const bookings = details?.bookings || [];

  return (
    <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-xl font-semibold text-gray-900">{asset.tag}</h3>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{asset.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {asset.category}
            {asset.allocatedTo ? ` · Assigned to ${asset.allocatedTo}` : ' · Unassigned'}
          </p>
        </div>
      </div>

      {detailError && <Alert className="w-full">{detailError}</Alert>}

      {/* Tabs */}
      <Tabs>
        <TabsList className="w-full justify-start">
          <TabsTrigger isActive={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            Overview
          </TabsTrigger>
          <TabsTrigger isActive={activeTab === 'allocations'} onClick={() => setActiveTab('allocations')}>
            Allocations {allocations.length > 0 && `(${allocations.length})`}
          </TabsTrigger>
          <TabsTrigger isActive={activeTab === 'maintenance'} onClick={() => setActiveTab('maintenance')}>
            Maintenance {maintenanceRequests.length > 0 && `(${maintenanceRequests.length})`}
          </TabsTrigger>
          <TabsTrigger isActive={activeTab === 'bookings'} onClick={() => setActiveTab('bookings')}>
            Bookings {bookings.length > 0 && `(${bookings.length})`}
          </TabsTrigger>
        </TabsList>

        {isLoadingDetails ? (
          <div className="flex items-center gap-2 py-6 text-gray-500 text-sm">
            <Loader2 className="animate-spin" size={16} />
            Loading details...
          </div>
        ) : (
          <>
            <TabsContent isActive={activeTab === 'overview'}>
              <OverviewTab asset={asset} details={details} />
            </TabsContent>
            <TabsContent isActive={activeTab === 'allocations'}>
              <AllocationHistoryTab allocations={allocations} />
            </TabsContent>
            <TabsContent isActive={activeTab === 'maintenance'}>
              <MaintenanceTab maintenanceRequests={maintenanceRequests} />
            </TabsContent>
            <TabsContent isActive={activeTab === 'bookings'}>
              <BookingsTab bookings={bookings} />
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Actions */}
      {isManager && (
        <div className="flex flex-col sm:flex-row gap-3 pt-2 border-t border-gray-100">
          <Button className="flex items-center gap-2" onClick={() => onEdit(asset)}>
            <PencilLine size={16} />
            Edit Asset
          </Button>
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => onRetire(asset)}
            disabled={asset.status === 'RETIRED' || asset.status === 'DISPOSED'}
          >
            <Trash2 size={16} />
            Mark as Retired
          </Button>
        </div>
      )}
    </div>
  );
}
