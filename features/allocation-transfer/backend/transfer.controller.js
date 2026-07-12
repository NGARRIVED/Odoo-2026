const prisma = require('../../../shared/database');

async function listTransfers(req, res) {
  try {
    const { status, fromEmployeeId, toEmployeeId } = req.query;
    const userId = req.user.employeeId;
    const role = req.user.role;

    const where = {};
    if (status) where.status = status;
    
    if (role === 'EMPLOYEE') {
      // Employees can see their own requests (either from or to)
      where.OR = [
        { fromEmployeeId: userId },
        { toEmployeeId: userId }
      ];
    } else {
      if (fromEmployeeId) where.fromEmployeeId = fromEmployeeId;
      if (toEmployeeId) where.toEmployeeId = toEmployeeId;
    }

    const transfers = await prisma.transferRequest.findMany({
      where,
      include: {
        asset: true,
        fromEmployee: true,
        toEmployee: true,
        approvedBy: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: transfers });
  } catch (error) {
    console.error('List Transfers Error:', error);
    res.status(500).json({ success: false, message: 'Failed to list transfers' });
  }
}

async function createTransfer(req, res) {
  try {
    const { assetId, toEmployeeId, reason } = req.body;
    const fromEmployeeId = req.user.employeeId;

    if (!assetId || !toEmployeeId) {
      return res.status(400).json({ success: false, message: 'Asset ID and To Employee ID are required' });
    }

    // Ensure the asset is currently allocated to fromEmployeeId
    const activeAllocation = await prisma.allocation.findFirst({
      where: {
        assetId,
        employeeId: fromEmployeeId,
        status: 'ACTIVE'
      }
    });

    if (!activeAllocation && req.user.role === 'EMPLOYEE') {
      return res.status(403).json({ success: false, message: 'You do not have an active allocation for this asset' });
    }
    
    const transfer = await prisma.transferRequest.create({
      data: {
        assetId,
        fromEmployeeId,
        toEmployeeId,
        reason,
        status: 'REQUESTED'
      },
      include: { asset: true, fromEmployee: true, toEmployee: true }
    });

    res.status(201).json({ success: true, data: transfer });
  } catch (error) {
    console.error('Create Transfer Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to create transfer' });
  }
}

async function approveTransfer(req, res) {
  try {
    const { id } = req.params;
    const approvedById = req.user.employeeId;

    const result = await prisma.$transaction(async (tx) => {
      const transfer = await tx.transferRequest.findUnique({ where: { id } });
      if (!transfer) {
        throw new Error('Transfer request not found');
      }
      if (transfer.status !== 'REQUESTED') {
        throw new Error('Transfer request is not in REQUESTED status');
      }

      // End old allocation
      const oldAllocation = await tx.allocation.findFirst({
        where: {
          assetId: transfer.assetId,
          employeeId: transfer.fromEmployeeId,
          status: 'ACTIVE'
        }
      });

      if (oldAllocation) {
        await tx.allocation.update({
          where: { id: oldAllocation.id },
          data: {
            status: 'RETURNED',
            actualReturnDate: new Date()
          }
        });
      }

      // Ensure asset status is ALLOCATED
      await tx.asset.update({
        where: { id: transfer.assetId },
        data: { status: 'ALLOCATED' }
      });

      // Start new allocation
      const newAllocation = await tx.allocation.create({
        data: {
          assetId: transfer.assetId,
          employeeId: transfer.toEmployeeId,
          status: 'ACTIVE'
        }
      });

      // Update transfer status
      const updatedTransfer = await tx.transferRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById
        },
        include: { asset: true, fromEmployee: true, toEmployee: true }
      });

      return { transfer: updatedTransfer, newAllocation };
    });

    res.json({ success: true, data: result.transfer });
  } catch (error) {
    console.error('Approve Transfer Error:', error);
    res.status(400).json({ success: false, message: error.message || 'Failed to approve transfer' });
  }
}

async function rejectTransfer(req, res) {
  try {
    const { id } = req.params;
    const approvedById = req.user.employeeId;

    const transfer = await prisma.transferRequest.update({
      where: { id, status: 'REQUESTED' },
      data: {
        status: 'REJECTED',
        approvedById
      }
    });

    res.json({ success: true, data: transfer });
  } catch (error) {
    console.error('Reject Transfer Error:', error);
    res.status(400).json({ success: false, message: 'Failed to reject transfer or it was not in REQUESTED status' });
  }
}

module.exports = {
  listTransfers,
  createTransfer,
  approveTransfer,
  rejectTransfer
};
