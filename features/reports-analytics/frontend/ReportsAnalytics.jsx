import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, BarChart3, Download, Filter, LineChart, PieChart, TrendingUp, Wrench, ArrowUpRight, Printer } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Select } from '../../../shared/ui-components';
import { formatCurrency } from '../../../shared/utils/formatters';

const API_BASE = 'http://localhost:4000/api';

const periodOptions = [
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Quarter', value: 'quarter' },
  { label: 'Year to Date', value: 'ytd' },
];

function MetricCard({ label, value, hint, icon: Icon, trend, accent = 'brand' }) {
  return (
    <Card className="border-gray-200 shadow-sm">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
            <div className="mt-3 text-3xl font-semibold text-gray-950">{value}</div>
            <p className="mt-2 text-sm text-gray-500">{hint}</p>
            {trend ? <p className="mt-2 text-xs font-medium text-green-600">{trend}</p> : null}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent === 'danger' ? 'bg-red-50 text-red-600' : accent === 'warning' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-700'}`}>
            <Icon size={18} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Sparkline({ values }) {
  const width = 260;
  const height = 72;
  const step = values.length > 1 ? width / (values.length - 1) : width;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = index * step;
      const normalized = (value - min) / range;
      const y = height - normalized * (height - 12) - 6;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full">
      <polyline fill="none" stroke="#2563eb" strokeWidth="2.5" points={points} />
      <polyline fill="rgba(37,99,235,0.12)" stroke="none" points={`0,${height} ${points} ${width},${height}`} />
    </svg>
  );
}

function downloadCsv(rows, fileName) {
  const escapeValue = (value) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  const csvRows = [
    ['Asset ID', 'Category', 'Location', 'Est. Replacement Cost', 'Status', 'Action'].join(','),
    ...rows.map((row) => [
      row.assetId,
      row.category,
      row.location,
      row.cost,
      row.status,
      row.action
    ].map(escapeValue).join(','))
  ];

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsAnalytics() {
  const [period, setPeriod] = useState('30d');
  const [department, setDepartment] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [summaryCards, setSummaryCards] = useState([]);
  const [utilizationBreakdown, setUtilizationBreakdown] = useState([]);
  const [maintenanceSeries, setMaintenanceSeries] = useState({ labels: [], values: [] });
  const [retirementRows, setRetirementRows] = useState([]);
  const [departments, setDepartments] = useState([{ label: 'All Departments', value: 'all' }]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadSummary = async (periodValue = period, departmentValue = department) => {
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({ period: periodValue, department: departmentValue });
      const response = await fetch(`${API_BASE}/reports/summary?${params.toString()}`);
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || 'Failed to load reports summary');
      }

      setSummaryCards(payload.summaryCards || []);
      setUtilizationBreakdown(payload.utilizationBreakdown || []);
      setMaintenanceSeries(payload.maintenanceSeries || { labels: [], values: [] });
      setRetirementRows(payload.retirementRows || []);
      setDepartments([{ label: 'All Departments', value: 'all' }, ...(payload.departments || [])]);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const selectedDepartmentLabel = useMemo(() => {
    return departments.find((item) => item.value === department)?.label || 'All Departments';
  }, [departments, department]);

  const handleExportPdf = () => {
    window.print();
  };

  const handleFilterData = () => {
    setShowFilters((current) => !current);
  };

  const handleQuickExport = () => {
    downloadCsv(retirementRows, 'assetflow-retirement-assets.csv');
  };

  const renderUtilizationBars = utilizationBreakdown.length > 0
    ? utilizationBreakdown
    : [
        { label: 'No data', utilization: 0, idle: 100 }
      ];

  const periodLabel = periodOptions.find((option) => option.value === period)?.label || 'Last 30 Days';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-brand-50/40 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 shadow-sm">
            <BarChart3 size={14} /> Reports & Analytics
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 lg:text-4xl">Reports & Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">Overview of asset utilization, maintenance health, and lifecycle risk from live database data.</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={handleExportPdf}>
            <Printer size={16} className="mr-2" /> Export PDF
          </Button>
          <Button variant="secondary" onClick={handleFilterData}>
            <Filter size={16} className="mr-2" /> Filter Data
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <MetricCard
            key={card.label}
            label={card.label}
            value={card.value}
            hint={card.hint}
            trend={card.trend}
            icon={
              card.label.includes('Utilization') ? TrendingUp : card.label.includes('Maintenance') ? Wrench : card.label.includes('Critical') ? AlertTriangle : PieChart
            }
            accent={card.label.includes('Maintenance') ? 'warning' : card.label.includes('Critical') ? 'danger' : 'brand'}
          />
        ))}
      </div>

      {showFilters ? (
        <Card className="border-brand-200 bg-brand-50/50 shadow-sm">
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Time Period"
              value={period}
              onChange={(event) => {
                const nextPeriod = event.target.value;
                setPeriod(nextPeriod);
                loadSummary(nextPeriod, department);
              }}
              options={periodOptions}
            />
            <Select
              label="Department"
              value={department}
              onChange={(event) => {
                const nextDepartment = event.target.value;
                setDepartment(nextDepartment);
                loadSummary(period, nextDepartment);
              }}
              options={departments}
            />
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Current filter</p>
              <p className="mt-2">{periodLabel} · {selectedDepartmentLabel}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-200 bg-white/80">
            <div>
              <CardTitle className="text-base">Asset Utilization (Most-used vs. Idle)</CardTitle>
              <p className="text-sm text-gray-500">How often each tracked category is being used</p>
            </div>
            <Badge variant="default">{periodLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            {loading ? (
              <div className="py-8 text-center text-sm text-gray-500">Loading utilization data...</div>
            ) : error ? (
              <div className="py-8 text-center text-sm text-alert">{error}</div>
            ) : (
              <>
                <div className="space-y-3">
                  {renderUtilizationBars.map((item) => (
                    <div key={item.label} className="grid grid-cols-[72px_minmax(0,1fr)_48px] items-center gap-3">
                      <span className="text-sm text-gray-700">{item.label}</span>
                      <div className="h-4 rounded-full bg-gray-100">
                        <div className="h-4 rounded-full bg-brand-700" style={{ width: `${item.utilization}%` }} />
                      </div>
                      <span className="text-right text-sm font-medium text-gray-900">{item.utilization}%</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brand-700" /> Active use</span>
                  <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-gray-300" /> Idle capacity</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-200">
              <div>
                <CardTitle className="text-base">Maintenance Frequency</CardTitle>
                <p className="text-sm text-gray-500">Work orders created in the selected period</p>
              </div>
              <Badge variant="brand">{selectedDepartmentLabel}</Badge>
            </CardHeader>
            <CardContent className="pt-6">
              {loading ? <div className="py-8 text-center text-sm text-gray-500">Loading maintenance trend...</div> : error ? <div className="py-8 text-center text-sm text-alert">{error}</div> : <Sparkline values={maintenanceSeries.values || []} />}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-gray-200">
              <CardTitle className="text-base">Quick Insights</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 pt-6">
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Utilization upside</p>
                  <p className="text-xs text-gray-500">Peak categories still have room for balancing</p>
                </div>
                <ArrowUpRight className="text-green-600" size={18} />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Maintenance backlog</p>
                  <p className="text-xs text-gray-500">Pending requests are coming straight from Prisma counts</p>
                </div>
                <LineChart className="text-brand-700" size={18} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-200 bg-white/80">
          <div>
            <CardTitle className="text-base">Assets Nearing Retirement</CardTitle>
            <p className="text-sm text-gray-500">Oldest assets in the selected scope</p>
          </div>
          <Button variant="ghost" onClick={handleQuickExport}>
            <Download size={16} className="mr-2" /> Export CSV
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-left text-xs uppercase tracking-[0.14em] text-gray-500">
                <tr>
                  <th className="px-6 py-4">Asset ID</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4">Est. Replacement Cost</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {retirementRows.map((row, index) => {
                  const statusVariant = row.status === 'Retired' ? 'default' : index === 0 ? 'danger' : index === 1 ? 'warning' : 'default';

                  return (
                    <tr key={row.assetId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.assetId}</td>
                      <td className="px-6 py-4 text-gray-700">{row.category}</td>
                      <td className="px-6 py-4 text-gray-700">{row.location}</td>
                      <td className="px-6 py-4 text-gray-700">{formatCurrency(row.cost)}</td>
                      <td className="px-6 py-4"><Badge variant={statusVariant}>{row.status}</Badge></td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant={index === 2 ? 'outline' : 'ghost'}>
                          {row.action}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
