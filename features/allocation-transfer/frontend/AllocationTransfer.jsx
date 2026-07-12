import React, { useState, useEffect } from "react";
import { 
  Tabs, TabsList, TabsTrigger, TabsContent,
  Button, Card, CardHeader, CardTitle, CardDescription, CardContent,
  Badge, Modal, Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Input
} from "../../../shared/ui-components";
import { authHeader, isManagerOrAbove } from "../../../shared/utils/auth";

export default function AllocationTransfer() {
  const [activeTab, setActiveTab] = useState("active");
  const [allocations, setAllocations] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [availableAssets, setAvailableAssets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAssetForTransfer, setSelectedAssetForTransfer] = useState(null);

  // Forms state
  const [assignForm, setAssignForm] = useState({ asset: "", assignee: "" });
  const [transferForm, setTransferForm] = useState({ toAssignee: "", reason: "" });

  const isManager = isManagerOrAbove();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allocRes, transferRes, empRes, assetsRes] = await Promise.all([
        fetch("http://localhost:4000/api/allocations/allocations", { headers: authHeader() }),
        fetch("http://localhost:4000/api/allocations/transfers", { headers: authHeader() }),
        fetch("http://localhost:4000/api/organization/employees", { headers: authHeader() }),
        fetch("http://localhost:4000/api/assets", { headers: authHeader() })
      ]);

      if (!allocRes.ok) throw new Error("API not ok");

      const allocData = await allocRes.json();
      const transferData = await transferRes.json();
      const empData = await empRes.json();
      const assetsData = assetsRes.ok ? await assetsRes.json() : { assets: [] };

      setEmployees(empData.employees || []);
      setAvailableAssets((assetsData.assets || []).filter(a => a.status === 'AVAILABLE'));

      setAllocations(allocData.data.map(a => ({
        id: a.id,
        asset: a.asset.name,
        assetId: a.assetId,
        assignee: a.employee.name,
        assignedDate: a.allocatedDate.split('T')[0],
        returnDate: a.actualReturnDate ? a.actualReturnDate.split('T')[0] : null,
        status: a.status === 'ACTIVE' ? 'Active' : 'Returned'
      })));

      setTransfers(transferData.data.map(t => ({
        id: t.id,
        asset: t.asset.name,
        from: t.fromEmployee.name,
        to: t.toEmployee.name,
        requestDate: t.createdAt.split('T')[0],
        status: t.status === 'REQUESTED' ? 'Pending' : t.status === 'APPROVED' ? 'Approved' : 'Rejected'
      })));
    } catch (error) {
      console.warn("Failed to fetch from API", error);
      setAllocations([]);
      setTransfers([]);
    }
    setLoading(false);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignForm.asset || !assignForm.assignee) return;
    
    try {
      await fetch("http://localhost:4000/api/allocations/allocations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ assetId: assignForm.asset, employeeId: assignForm.assignee })
      });
      fetchData();
      setIsAssignModalOpen(false);
      setAssignForm({ asset: "", assignee: "" });
    } catch (err) {
      console.error(err);
    }
  };

  const handleReturnAllocation = async (id) => {
    try {
      await fetch(`http://localhost:4000/api/allocations/allocations/${id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const openTransferModal = (allocation) => {
    setSelectedAssetForTransfer(allocation);
    setIsTransferModalOpen(true);
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferForm.toAssignee || !selectedAssetForTransfer) return;
    
    try {
      await fetch("http://localhost:4000/api/allocations/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ assetId: selectedAssetForTransfer.assetId, toEmployeeId: transferForm.toAssignee, reason: transferForm.reason })
      });
      fetchData();
      setIsTransferModalOpen(false);
      setTransferForm({ toAssignee: "", reason: "" });
      setActiveTab("transfers");
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferAction = async (id, action) => {
    try {
      const endpoint = action === "Approved" ? "approve" : "reject";
      await fetch(`http://localhost:4000/api/allocations/transfers/${id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() }
      });
      fetchData();
    } catch (e) {
      console.error(e);
    }
  };

  const activeAllocations = allocations.filter(a => a.status === "Active");
  const historyAllocations = allocations.filter(a => a.status === "Returned");

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Allocations & Transfers</h1>
          <p className="text-gray-500 mt-2 text-lg">Manage asset assignments, track lifecycle history, and process peer-to-peer transfers.</p>
        </div>
        <Button onClick={() => setIsAssignModalOpen(true)} className="shadow-lg hover:shadow-xl transition-all">
          <span className="mr-2">+</span> Assign New Asset
        </Button>
      </div>

      <Tabs value={activeTab} className="w-full">
        <TabsList className="mb-6 p-1 bg-gray-100/80 backdrop-blur-md rounded-xl inline-flex space-x-1">
          <TabsTrigger value="active" isActive={activeTab === 'active'} onClick={() => setActiveTab('active')} className="rounded-lg px-6 py-2.5 data-[state=active]:shadow-sm">
            Active Allocations
            <Badge variant="brand" className="ml-2 bg-brand-200 text-brand-900 border-none">{activeAllocations.length}</Badge>
          </TabsTrigger>
          {isManager && (
            <TabsTrigger value="history" isActive={activeTab === 'history'} onClick={() => setActiveTab('history')} className="rounded-lg px-6 py-2.5">
              History
            </TabsTrigger>
          )}
          <TabsTrigger value="transfers" isActive={activeTab === 'transfers'} onClick={() => setActiveTab('transfers')} className="rounded-lg px-6 py-2.5">
            Transfer Requests
            {transfers.filter(t => t.status === 'Pending').length > 0 && (
              <Badge variant="warning" className="ml-2">{transfers.filter(t => t.status === 'Pending').length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" isActive={activeTab === 'active'}>
          <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl ring-1 ring-gray-200/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle>Current Assignments</CardTitle>
              <CardDescription>Assets currently assigned to employees.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Asset Name</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeAllocations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-gray-500">No active allocations found.</TableCell>
                    </TableRow>
                  )}
                  {activeAllocations.map(alloc => (
                    <TableRow key={alloc.id} className="group transition-colors hover:bg-brand-50/30">
                      <TableCell className="font-semibold text-gray-900 pl-6">{alloc.asset}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium shadow-sm">
                            {alloc.assignee.charAt(0)}
                          </div>
                          <span className="font-medium text-gray-700">{alloc.assignee}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-500">{alloc.assignedDate}</TableCell>
                      <TableCell><Badge variant="success" className="bg-emerald-100 text-emerald-800">Active</Badge></TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="outline" size="sm" onClick={() => openTransferModal(alloc)} className="h-8 bg-white">Transfer</Button>
                          <Button variant="danger" size="sm" onClick={() => handleReturnAllocation(alloc.id)} className="h-8">Return</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {isManager && (
          <TabsContent value="history" isActive={activeTab === 'history'}>
            <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl ring-1 ring-gray-200/50 rounded-2xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                <CardTitle>Allocation History</CardTitle>
                <CardDescription>Log of returned and past asset allocations.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">Asset Name</TableHead>
                      <TableHead>Assignee</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Return Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {historyAllocations.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-12 text-gray-500">No history found.</TableCell>
                      </TableRow>
                    )}
                    {historyAllocations.map(alloc => (
                      <TableRow key={alloc.id} className="text-gray-500">
                        <TableCell className="font-medium text-gray-700 pl-6">{alloc.asset}</TableCell>
                        <TableCell>{alloc.assignee}</TableCell>
                        <TableCell>{alloc.assignedDate}</TableCell>
                        <TableCell>{alloc.returnDate}</TableCell>
                        <TableCell><Badge variant="default">Returned</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="transfers" isActive={activeTab === 'transfers'}>
          <Card className="border-none shadow-xl bg-white/50 backdrop-blur-xl ring-1 ring-gray-200/50 rounded-2xl overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b border-gray-100">
              <CardTitle>Transfer Requests</CardTitle>
              <CardDescription>Review and manage pending asset transfer requests between employees.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-6">Asset</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Request Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right pr-6">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-gray-500">No transfer requests found.</TableCell>
                    </TableRow>
                  )}
                  {transfers.map(transfer => (
                    <TableRow key={transfer.id} className="group hover:bg-gray-50/50">
                      <TableCell className="font-semibold text-gray-900 pl-6">{transfer.asset}</TableCell>
                      <TableCell className="text-gray-600">{transfer.from}</TableCell>
                      <TableCell className="font-medium text-brand-700">{transfer.to}</TableCell>
                      <TableCell className="text-gray-500">{transfer.requestDate}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={transfer.status === 'Pending' ? 'warning' : transfer.status === 'Approved' ? 'success' : 'danger'}
                        >
                          {transfer.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        {transfer.status === 'Pending' && isManager && (
                          <div className="flex justify-end space-x-2">
                            <Button variant="outline" size="sm" onClick={() => handleTransferAction(transfer.id, "Rejected")} className="h-8 hover:bg-red-50 hover:text-red-600 hover:border-red-200">Reject</Button>
                            <Button variant="primary" size="sm" onClick={() => handleTransferAction(transfer.id, "Approved")} className="h-8 bg-brand-600">Approve</Button>
                          </div>
                        )}
                        {transfer.status === 'Pending' && !isManager && (
                          <span className="text-xs text-gray-500 italic">Awaiting Approval</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Assign Modal */}
      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign New Asset">
        <form onSubmit={handleAssignSubmit} className="space-y-5">
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Select Asset</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={assignForm.asset}
              onChange={(e) => setAssignForm({...assignForm, asset: e.target.value})}
              required
            >
              <option value="">-- Choose Asset --</option>
              {availableAssets.map(a => <option key={a.id} value={a.id}>{a.tag} - {a.name}</option>)}
            </select>
          </div>
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Select Assignee</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={assignForm.assignee}
              onChange={(e) => setAssignForm({...assignForm, assignee: e.target.value})}
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>Cancel</Button>
            <Button type="submit" className="shadow-md">Confirm Assignment</Button>
          </div>
        </form>
      </Modal>

      {/* Request Transfer Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Request Asset Transfer">
        <form onSubmit={handleTransferSubmit} className="space-y-5">
          <div className="p-4 bg-brand-50 rounded-lg border border-brand-100 flex flex-col space-y-1">
            <span className="text-xs font-semibold text-brand-600 uppercase tracking-wider">Asset to Transfer</span>
            <span className="text-lg font-bold text-gray-900">{selectedAssetForTransfer?.asset}</span>
            <span className="text-sm text-gray-600">Currently assigned to: {selectedAssetForTransfer?.assignee}</span>
          </div>
          
          <div className="flex flex-col space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Transfer To (New Assignee)</label>
            <select
              className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              value={transferForm.toAssignee}
              onChange={(e) => setTransferForm({...transferForm, toAssignee: e.target.value})}
              required
            >
              <option value="">-- Choose Employee --</option>
              {employees.filter(e => e.name !== selectedAssetForTransfer?.assignee).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>
          <Input 
            label="Reason for Transfer (Optional)"
            placeholder="e.g. Team change" 
            value={transferForm.reason}
            onChange={(e) => setTransferForm({...transferForm, reason: e.target.value})}
            className="bg-gray-50"
          />
          <div className="pt-4 flex justify-end space-x-3">
            <Button type="button" variant="ghost" onClick={() => setIsTransferModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary" className="shadow-md">Submit Request</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
