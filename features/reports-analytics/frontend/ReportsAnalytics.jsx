import React, { useMemo, useState } from 'react';
import { BarChart3, Download, Filter, LineChart, PieChart, TrendingUp, Wrench, AlertTriangle, ArrowUpRight, Printer } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Select } from '../../../shared/ui-components';
import { formatCurrency } from '../../../shared/utils/formatters';

const periodOptions = [
  { label: 'Last 30 Days', value: '30d' },
  { label: 'Last Quarter', value: 'quarter' },
  { label: 'Year to Date', value: 'ytd' },
];

const departmentOptions = [
  { label: 'All Departments', value: 'all' },
  { label: 'IT', value: 'it' },
  { label: 'Facilities', value: 'facilities' },
  { label: 'Fleet', value: 'fleet' },
];

const reportSets = {
  '30d': {
    totalAssets: 12450,
    utilization: 78,
    maintenancePending: 142,
    criticalAlerts: 3,
    utilizationSeries: [62, 65, 67, 68, 70, 72, 74, 76, 79, 80, 78, 81],
    maintenanceSeries: [18, 16, 17, 19, 22, 26, 24, 23, 28, 30, 31, 33],
    retirementRows: [
      { assetId: 'AST-9921', category: 'HVAC Unit', location: 'Roof North', cost: 45000, status: 'Critical (12 Days)' },
      { assetId: 'VEH-044', category: 'Service Van', location: 'Depot A', cost: 38500, status: 'Warning (45 Days)' },
      { assetId: 'IT-LPT-88', category: 'Workstation', location: 'Office 3B', cost: 1200, status: 'Scheduled (80 Days)' },
    ],
  },
  quarter: {
    totalAssets: 12880,
    utilization: 81,
    maintenancePending: 176,
    criticalAlerts: 5,
    utilizationSeries: [64, 66, 68, 69, 71, 73, 76, 78, 79, 81, 82, 83],
    maintenanceSeries: [20, 21, 22, 26, 28, 29, 31, 32, 33, 36, 39, 41],
    retirementRows: [
      { assetId: 'AST-1133', category: 'Backup Generator', location: 'Plant 2', cost: 78000, status: 'Critical (9 Days)' },
      { assetId: 'VEH-107', category: 'Delivery Truck', location: 'Depot B', cost: 52000, status: 'Warning (38 Days)' },
      { assetId: 'IT-LPT-20', category: 'Laptop Fleet', location: 'IT Storage', cost: 980, status: 'Scheduled (77 Days)' },
    ],
  },
  ytd: {
    totalAssets: 13200,
    utilization: 84,
    maintenancePending: 208,
    criticalAlerts: 7,
    utilizationSeries: [66, 67, 70, 71, 73, 75, 77, 80, 82, 84, 85, 86],
    maintenanceSeries: [22, 23, 25, 28, 31, 35, 36, 37, 40, 43, 45, 48],
    retirementRows: [
      { assetId: 'AST-0412', category: 'Chiller', location: 'HQ Roof', cost: 91000, status: 'Critical (5 Days)' },
      { assetId: 'VEH-210', category: 'Pool Sedan', location: 'Fleet Lot', cost: 27500, status: 'Warning (30 Days)' },
      { assetId: 'IT-MON-12', category: 'Monitors', location: 'Storage C', cost: 180, status: 'Scheduled (68 Days)' },
    ],
  },
};

const utilizationLabels = ['HVAC', 'Lifts', 'Pumps', 'Gen.', 'Mowers', 'Proj.'];
const utilizationBars = [92, 76, 63, 58, 44, 38];

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

function downloadTextFile(content, fileName, type = 'text/plain') {
  const blob = new Blob([content], { type });
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

  const data = reportSets[period];

  const filteredDepartmentLabel = useMemo(() => departmentOptions.find((option) => option.value === department)?.label || 'All Departments', [department]);

  const handleExportPdf = () => {
    window.print();
  };

  const handleFilterData = () => {
    setShowFilters((current) => !current);
  };

  const handleQuickExport = () => {
    const rows = data.retirementRows
      .map((row) => `${row.assetId},${row.category},${row.location},${formatCurrency(row.cost)},${row.status}`)
      .join('\n');
    downloadTextFile(`Asset ID,Category,Location,Est. Replacement Cost,Status\n${rows}`, 'assetflow-retirement-assets.csv', 'text/csv;charset=utf-8;');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-gray-50 to-brand-50/40 p-6 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 shadow-sm">
            <BarChart3 size={14} /> Reports & Analytics
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-gray-950 lg:text-4xl">Reports & Analytics</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-600">Overview of asset utilization, maintenance health, and lifecycle risk.</p>
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
        <MetricCard
          label="Total Active Assets"
          value={data.totalAssets.toLocaleString()}
          hint={`${filteredDepartmentLabel} · ${periodOptions.find((option) => option.value === period)?.label}`}
          icon={PieChart}
          trend="+2.4% vs last month"
        />
        <MetricCard
          label="Avg. Utilization Rate"
          value={`${data.utilization}%`}
          hint="Average across tracked departments"
          icon={TrendingUp}
          trend="+5.1% vs last month"
          accent="brand"
        />
        <MetricCard
          label="Maintenance Pending"
          value={data.maintenancePending.toLocaleString()}
          hint="Open maintenance requests and inspections"
          icon={Wrench}
          trend="-12 tasks vs last month"
          accent="warning"
        />
        <MetricCard
          label="Critical Alerts"
          value={data.criticalAlerts.toLocaleString()}
          hint="Requires immediate action"
          icon={AlertTriangle}
          trend="Escalated items"
          accent="danger"
        />
      </div>

      {showFilters ? (
        <Card className="border-brand-200 bg-brand-50/50 shadow-sm">
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2 lg:grid-cols-3">
            <Select
              label="Time Period"
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              options={periodOptions}
            />
            <Select
              label="Department"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
              options={departmentOptions}
            />
            <div className="rounded-2xl border border-dashed border-brand-200 bg-white p-4 text-sm text-gray-600">
              <p className="font-medium text-gray-900">Current filter</p>
              <p className="mt-2">{periodOptions.find((option) => option.value === period)?.label} · {filteredDepartmentLabel}</p>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-200 bg-white/80">
            <div>
              <CardTitle className="text-base">Asset Utilization (Most-used vs. Idle)</CardTitle>
              <p className="text-sm text-gray-500">How often the highest-value asset groups are being used</p>
            </div>
            <Badge variant="default">{periodOptions.find((option) => option.value === period)?.label}</Badge>
          </CardHeader>
          <CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between gap-3 text-xs text-gray-500">
              <span>100%</span>
              <span>Highly Utilized</span>
            </div>
            <div className="space-y-3">
              {utilizationLabels.map((label, index) => (
                <div key={label} className="grid grid-cols-[72px_minmax(0,1fr)_48px] items-center gap-3">
                  <span className="text-sm text-gray-700">{label}</span>
                  <div className="h-4 rounded-full bg-gray-100">
                    <div className="h-4 rounded-full bg-brand-700" style={{ width: `${utilizationBars[index]}%` }} />
                  </div>
                  <span className="text-right text-sm font-medium text-gray-900">{utilizationBars[index]}%</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-brand-700" /> Highly Utilized</span>
              <span className="inline-flex items-center gap-2"><span className="h-3 w-3 rounded-sm bg-gray-300" /> Mostly Idle</span>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 border-b border-gray-200">
              <div>
                <CardTitle className="text-base">Maintenance Frequency</CardTitle>
                <p className="text-sm text-gray-500">Work orders closed per week</p>
              </div>
              <Badge variant="brand">{filteredDepartmentLabel}</Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <Sparkline values={data.maintenanceSeries} />
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
                  <p className="text-xs text-gray-500">Peak groups still have room for balancing</p>
                </div>
                <ArrowUpRight className="text-green-600" size={18} />
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-gray-50 p-4">
                <div>
                  <p className="text-sm font-medium text-gray-900">Maintenance backlog</p>
                  <p className="text-xs text-gray-500">Pending requests trending lower week over week</p>
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
            <p className="text-sm text-gray-500">Expected end-of-life within 90 days</p>
          </div>
          <Button variant="ghost" onClick={handleQuickExport}>
            <Download size={16} className="mr-2" /> View All
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
                {data.retirementRows.map((row, index) => {
                  const statusVariant = index === 0 ? 'danger' : index === 1 ? 'warning' : 'default';

                  return (
                    <tr key={row.assetId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium text-gray-900">{row.assetId}</td>
                      <td className="px-6 py-4 text-gray-700">{row.category}</td>
                      <td className="px-6 py-4 text-gray-700">{row.location}</td>
                      <td className="px-6 py-4 text-gray-700">{formatCurrency(row.cost)}</td>
                      <td className="px-6 py-4"><Badge variant={statusVariant}>{row.status}</Badge></td>
                      <td className="px-6 py-4 text-right">
                        <Button size="sm" variant={index === 2 ? 'outline' : 'ghost'}>
                          {index === 2 ? 'Review' : 'Initiate Procurement'}
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
