const prisma = require('../../../shared/database');

async function listAllocations(req, res) {
  try {
    const { status, employeeId, assetId } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (employeeId) where.employeeId = employeeId;
    if (assetId) where.assetId = assetId;

    const allocations = await prisma.allocation.findMany({
      where,
      include: {
        asset: true,
        employee: true,
        department: true,
      },
      orderBy: { allocatedDate: 'desc' }
    });

    res.json({ success: true, data: allocations });
  } catch (error) {
    console.error('List Allocations Error:', error);
    res.status(500).json({ success: false, message: 'Failed to list allocations' });
  }
}

async function allocateAsset(req, res) {
  try {
    const { assetId, employeeId, departmentId, expectedReturnDate, conditionNotes } = req.body;

    if (!assetId || (!employeeId && !departmentId)) {
      return res.status(400).json({ success: false, message: 'Asset ID and Employee/Department ID are required' });
    }

    const allocation = await prisma.$transaction(async (tx) => {
      // Check asset status
      const asset = await tx.asset.findUnique({ where: { id: assetId } });
      if (!asset) {
        throw new Error('Asset not found');
      }
      if (asset.status !== 'AVAILABLE') {
        throw new Error('Asset is not AVAILABLE for allocation');
      }

      // Create allocation
      const newAlloc = await tx.allocation.create({
        data: {
          assetId,
          employeeId,
          departmentId,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          conditionNotes,
          status: 'ACTIVE'
        },
        include: { asset: true, employee: true }
      });

      // Update asset status
      await tx.asset.update({
        where: { id: assetId },
        data: { status: 'ALLOCATED' }
      });

      return newAlloc;
    });

    res.status(201).json({ success: true, data: allocation });
  } catch (error) {
    console.error('Allocate Asset Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to allocate asset' });
  }
}

async function returnAsset(req, res) {
  try {
    const { id } = req.params;
    const { conditionNotes } = req.body;

    const allocation = await prisma.$transaction(async (tx) => {
      const alloc = await tx.allocation.findUnique({ where: { id } });
      if (!alloc) {
        throw new Error('Allocation not found');
      }
      if (alloc.status !== 'ACTIVE') {
        throw new Error('Allocation is not ACTIVE');
      }

      // Update allocation
      const updatedAlloc = await tx.allocation.update({
        where: { id },
        data: {
          status: 'RETURNED',
          actualReturnDate: new Date(),
          conditionNotes: conditionNotes || alloc.conditionNotes,
        }
      });

      // Update asset status
      await tx.asset.update({
        where: { id: alloc.assetId },
        data: { status: 'AVAILABLE' }
      });

      return updatedAlloc;
    });

    res.json({ success: true, data: allocation });
  } catch (error) {
    console.error('Return Asset Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to return asset' });
  }
}

module.exports = {
  listAllocations,
  allocateAsset,
  returnAsset
};
