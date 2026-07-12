import React, { useEffect, useState } from 'react';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle, Package } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const API_BASE = 'http://localhost:4000';

export function ReportsAnalytics() {
  const [summary, setSummary] = useState(null);
  const [statusData, setStatusData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const authHeaders = () => {
    const token = localStorage.getItem('assetflow_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [sumRes, statRes, catRes] = await Promise.all([
          fetch(`${API_BASE}/api/reports/summary`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/reports/assets-by-status`, { headers: authHeaders() }),
          fetch(`${API_BASE}/api/reports/assets-by-category`, { headers: authHeaders() })
        ]);

        if (!sumRes.ok || !statRes.ok || !catRes.ok) {
          throw new Error('Failed to load reports data. Ensure you have the right permissions.');
        }

        const [sum, stat, cat] = await Promise.all([sumRes.json(), statRes.json(), catRes.json()]);

        if (isMounted) {
          setSummary(sum);
          setStatusData(stat.data);
          setCategoryData(cat.data);
        }
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, []);

  if (loading) return <div className="p-8 text-center text-slate-500">Loading analytics...</div>;
  if (error) return <div className="p-8"><div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 bg-slate-50">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
        <p className="mt-1 text-sm text-slate-600">High-level overview of your organization's assets and activities.</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-blue-50 text-blue-600 p-3 rounded-md"><Package size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Assets</p>
            <p className="text-2xl font-bold text-slate-900">{summary.totalAssets}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-emerald-50 text-emerald-600 p-3 rounded-md"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Available Assets</p>
            <p className="text-2xl font-bold text-slate-900">{summary.availableAssets}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-purple-50 text-purple-600 p-3 rounded-md"><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Active Allocations</p>
            <p className="text-2xl font-bold text-slate-900">{summary.activeAllocations}</p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm flex items-center gap-4">
          <div className="bg-orange-50 text-orange-600 p-3 rounded-md"><AlertCircle size={24} /></div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Maint.</p>
            <p className="text-2xl font-bold text-slate-900">{summary.pendingMaintenance}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-slate-400" /> Assets by Status</h2>
          <div className="flex-1 min-h-[300px]">
            {statusData.length === 0 ? <p className="text-sm text-slate-500">No data available.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#64748b'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <Tooltip formatter={(value) => [value, 'Assets']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm flex flex-col">
          <h2 className="text-base font-semibold text-slate-900 mb-6 flex items-center gap-2"><BarChart3 size={18} className="text-slate-400" /> Assets by Category</h2>
          <div className="flex-1 min-h-[300px]">
            {categoryData.length === 0 ? <p className="text-sm text-slate-500">No data available.</p> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{ fill: '#f1f5f9' }} />
                  <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]}>
                    {categoryData.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill="#10b981" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsAnalytics;
