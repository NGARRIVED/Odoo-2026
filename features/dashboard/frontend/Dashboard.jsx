import React from "react";
import { Button, Card, Badge } from "../../../shared/ui-components";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ArrowRightLeft, 
  CalendarDays,
  Plus,
  RefreshCw,
  Search
} from "lucide-react";

export function Dashboard() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-500">Real-time status of enterprise assets and resources.</p>
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

      {/* Alert Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start justify-between">
        <div className="flex gap-3">
          <AlertTriangle className="text-red-500 mt-0.5" size={20} />
          <div>
            <h3 className="text-sm font-semibold text-red-800">Overdue Alert</h3>
            <p className="text-sm text-red-700 mt-1">
              3 Assets are past their return date. Immediate action required to avoid operational delays.
            </p>
          </div>
        </div>
        <button className="text-sm font-medium text-red-700 hover:text-red-800 underline">
          View Assets
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 flex flex-col gap-2 border-l-4 border-l-blue-500">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available</span>
            <CheckCircle2 size={16} className="text-blue-500" />
          </div>
          <span className="text-3xl font-bold text-gray-900">1,245</span>
        </Card>
        
        <Card className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Allocated</span>
            <Search size={16} className="text-gray-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">892</span>
        </Card>

        <Card className="p-4 flex flex-col gap-2 border-l-4 border-l-orange-400">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Maintenance</span>
            <Clock size={16} className="text-orange-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">47</span>
        </Card>

        <Card className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Bookings</span>
            <CalendarDays size={16} className="text-gray-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">156</span>
        </Card>

        <Card className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pending Transfers</span>
            <ArrowRightLeft size={16} className="text-gray-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">23</span>
        </Card>

        <Card className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Upcoming Returns</span>
            <RefreshCw size={16} className="text-gray-400" />
          </div>
          <span className="text-3xl font-bold text-gray-900">89</span>
        </Card>
      </div>

      {/* Main Content Two-Column */}
      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* Recent Allocations Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Allocations</h2>
            <button className="text-sm text-blue-600 font-medium hover:underline">View All</button>
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
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">EQ-9021</td>
                  <td className="px-6 py-4 text-gray-600">Heavy Machinery</td>
                  <td className="px-6 py-4 text-gray-600">Site B - Alpha</td>
                  <td className="px-6 py-4"><Badge variant="success">Active</Badge></td>
                  <td className="px-6 py-4 text-right text-gray-500">Oct 24, 09:00</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">IT-4055</td>
                  <td className="px-6 py-4 text-gray-600">Server Rack</td>
                  <td className="px-6 py-4 text-gray-600">Datacenter 1</td>
                  <td className="px-6 py-4"><Badge variant="info">Transferring</Badge></td>
                  <td className="px-6 py-4 text-right text-gray-500">Oct 24, 08:30</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">VH-112</td>
                  <td className="px-6 py-4 text-gray-600">Fleet Vehicle</td>
                  <td className="px-6 py-4 text-gray-600">J. Doe</td>
                  <td className="px-6 py-4"><Badge variant="warning">Maintenance</Badge></td>
                  <td className="px-6 py-4 text-right text-gray-500">Oct 23, 16:45</td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        {/* Recent Activity Timeline */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          
          <Card className="p-6">
            <div className="space-y-8 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-300 before:to-transparent">
              
              {/* Activity Item 1 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-slate-900 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] pl-6 md:pl-0 md:group-odd:text-right">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-sm">Asset Checked Out</span>
                    <span className="text-gray-500 text-xs mt-1">Laptop Pro (IT-802) assigned to M. Smith.</span>
                    <span className="text-gray-400 text-xs mt-1">10 mins ago</span>
                  </div>
                </div>
              </div>

              {/* Activity Item 2 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-orange-400 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] pl-6 md:pl-0 md:group-even:text-right md:group-odd:text-left">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-sm">Maintenance Scheduled</span>
                    <span className="text-gray-500 text-xs mt-1">Generator (EQ-104) flagged for routine check.</span>
                    <span className="text-gray-400 text-xs mt-1">45 mins ago</span>
                  </div>
                </div>
              </div>

              {/* Activity Item 3 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-blue-400 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] pl-6 md:pl-0 md:group-odd:text-right">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-sm">Transfer Completed</span>
                    <span className="text-gray-500 text-xs mt-1">Batch #44 transferred to Warehouse C.</span>
                    <span className="text-gray-400 text-xs mt-1">2 hours ago</span>
                  </div>
                </div>
              </div>

              {/* Activity Item 4 */}
              <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group">
                <div className="flex items-center justify-center w-4 h-4 rounded-full border-2 border-white bg-red-500 text-slate-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow absolute left-0 md:left-1/2 -translate-x-1/2 z-10"></div>
                <div className="w-[calc(100%-2.5rem)] md:w-[calc(50%-2.5rem)] pl-6 md:pl-0 md:group-even:text-right md:group-odd:text-left">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900 text-sm">Alert: Asset Missing</span>
                    <span className="text-gray-500 text-xs mt-1">Projector (AV-09) not found during audit.</span>
                    <span className="text-gray-400 text-xs mt-1">5 hours ago</span>
                  </div>
                </div>
              </div>

            </div>
          </Card>
        </div>

      </div>
    </div>
  );
}
