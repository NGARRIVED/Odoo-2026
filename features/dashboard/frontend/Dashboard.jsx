import React, { useEffect, useState } from "react";
import { Button, Card, Badge, Alert } from "../../../shared/ui-components";
import {
  ArrowRightLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  Loader2,
  Plus,
  RefreshCw,
  Wrench,
  Package,
  Users,
  Boxes
} from "lucide-react";

import KpiCards from "./components/KpiCards";
import OverdueBanner from "./components/OverdueBanner";
import QuickActions from "./components/QuickActions";

const API_BASE = "http://localhost:4000";

function formatDateTime(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatBadge(status) {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", variant: "success" };
    case "RETURNED":
      return { label: "Returned", variant: "default" };
    case "OVERDUE":
      return { label: "Overdue", variant: "danger" };
    case "REQUESTED":
      return { label: "Requested", variant: "info" };
    case "UPCOMING":
      return { label: "Upcoming", variant: "info" };
    case "ONGOING":
      return { label: "Ongoing", variant: "warning" };
    case "PENDING":
      return { label: "Pending", variant: "warning" };
    case "IN_PROGRESS":
      return { label: "In Progress", variant: "warning" };
    default:
      return { label: status, variant: "default" };
  }
}

export function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const response = await fetch(`${API_BASE}/api/dashboard`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to load dashboard data");
        }

        if (isMounted) {
          setSummary(data);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  const metrics = summary
    ? [
        {
          label: "Available",
          value: summary.metrics.availableAssets,
          Icon: CheckCircle2,
          iconClass: "text-brand-700",
          cardClass: "border-l-4 border-l-brand-500"
        },
        {
          label: "Allocated",
          value: summary.metrics.allocatedAssets,
          Icon: Package,
          iconClass: "text-gray-400"
        },
        {
          label: "Maintenance",
          value: summary.metrics.maintenanceAssets,
          Icon: Wrench,
          iconClass: "text-brand-800",
          cardClass: "border-l-4 border-l-brand-800"
        },
        {
          label: "Active Bookings",
          value: summary.metrics.activeBookings,
          Icon: CalendarDays,
          iconClass: "text-gray-400"
        },
        {
          label: "Pending Transfers",
          value: summary.metrics.pendingTransfers,
          Icon: ArrowRightLeft,
          iconClass: "text-gray-400"
        },
        {
          label: "Upcoming Returns",
          value: summary.metrics.upcomingReturns,
          Icon: RefreshCw,
          iconClass: "text-gray-400"
        },
        {
          label: "Employees",
          value: summary.metrics.totalEmployees,
          Icon: Users,
          iconClass: "text-gray-400"
        },
        {
          label: "Total Assets",
          value: summary.metrics.totalAssets,
          Icon: Boxes,
          iconClass: "text-gray-400"
        }
      ]
    : [];

  const recentAllocations = summary?.recentAllocations || [];
  const recentActivity = summary?.recentActivity || [];
  const overdueItems = summary?.overdueItems || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">
            Real-time status of enterprise assets and resources.
            {summary?.generatedAt && <span> Updated {summary.generatedAt}.</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" className="flex items-center gap-2">
            <Plus size={16} />
            Register Asset
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarDays size={16} />
            Book Resource
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Clock size={16} />
            Maintenance
          </Button>
        </div>
      </div>

      {error && <Alert className="w-full">{error}</Alert>}

      {isLoading ? (
        <Card className="p-6 flex items-center gap-3 text-gray-600">
          <Loader2 className="animate-spin" size={18} />
          Loading dashboard data...
        </Card>
      ) : (
        <>
          <OverdueBanner count={summary?.overview?.overdueAssets || 0} items={overdueItems} />

          <KpiCards metrics={metrics} />
        </>
      )}

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Allocations</h2>
            <button className="text-sm text-brand-700 font-medium hover:underline">View All</button>
          </div>
          
          <Card className="overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Asset ID</th>
                  <th className="px-6 py-4 font-medium">Type</th>
                  <th className="px-6 py-4 font-medium">Assignee</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentAllocations.length > 0 ? recentAllocations.map((allocation) => {
                  const badge = formatBadge(allocation.status);

                  return (
                    <tr key={allocation.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{allocation.assetTag}</td>
                      <td className="px-6 py-4 text-gray-600">{allocation.assetType}</td>
                      <td className="px-6 py-4 text-gray-600">{allocation.assignee}</td>
                      <td className="px-6 py-4"><Badge variant={badge.variant}>{badge.label}</Badge></td>
                      <td className="px-6 py-4 text-right text-gray-500">{formatDateTime(allocation.date)}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                      No recent allocations yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          
          <Card className="p-6">
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-linear-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              {recentActivity.length > 0 ? recentActivity.map((entry, index) => (
                <div
                  key={entry.id}
                  className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group"
                >
                  <div className={`flex items-center justify-center w-4 h-4 rounded-full border-2 border-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-1/2 z-10 ${index === 0 ? 'bg-brand-900' : index === 1 ? 'bg-brand-700' : index === 2 ? 'bg-brand-500' : 'bg-gray-400'}`} />
                  <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] pl-6 md:pl-0 md:group-odd:text-right md:group-even:text-left">
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-900 text-sm">{entry.title}</span>
                      <span className="text-gray-500 text-xs mt-1">{entry.description}</span>
                      <span className="text-gray-400 text-xs mt-1">{formatDateTime(entry.timestamp)} by {entry.actor}</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500">No activity has been recorded yet.</div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <QuickActions />
        </div>
      </div>
    </div>
  );
}
