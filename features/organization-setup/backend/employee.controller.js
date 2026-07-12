const prisma = require('../../../shared/database');

// ─── 1. List Employees ────────────────────────────────────────────────────────
const listEmployees = async (req, res) => {
  try {
    const { search, role, status, departmentId } = req.query;

    const where = {};

    if (search) {
      where.OR = [
        { name:  { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (role)         where.role         = role;
    if (status)       where.status       = status;
    if (departmentId) where.departmentId = departmentId;

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: { select: { name: true } },
        _count: {
          select: {
            allocations: { where: { status: 'ACTIVE' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const mapped = employees.map((emp) => ({
      id:                emp.id,
      name:              emp.name,
      email:             emp.email,
      role:              emp.role,
      status:            emp.status,
      departmentId:      emp.departmentId,
      departmentName:    emp.department?.name ?? null,
      activeAllocations: emp._count.allocations,
      avatar:            emp.avatar,
      createdAt:         emp.createdAt,
    }));

    return res.status(200).json({ employees: mapped, total: mapped.length });
  } catch (error) {
    console.error('[listEmployees]', error);
    return res.status(500).json({ error: 'Failed to fetch employees.' });
  }
};

// ─── 2. Get Employee ──────────────────────────────────────────────────────────
const getEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        department: true,
        allocations: {
          include: {
            asset: { select: { tag: true, name: true } },
          },
        },
        headOfDept: true,
      },
    });

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    return res.status(200).json({ employee });
  } catch (error) {
    console.error('[getEmployee]', error);
    return res.status(500).json({ error: 'Failed to fetch employee.' });
  }
};

// ─── 3. Create Employee ───────────────────────────────────────────────────────
const createEmployee = async (req, res) => {
  try {
    const { name, email, role, departmentId, status, avatar } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'name and email are required.' });
    }

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'An employee with this email already exists.' });
    }

    const data = { 
      name, 
      email,
      // Default password hash for manually created users (since they bypass signup)
      passwordHash: '$2b$10$defaultPlaceholderHashForManualAccounts123456789'
    };
    if (role)         data.role         = role;
    if (departmentId) {
      data.department = { connect: { id: departmentId } };
    }
    if (status)       data.status       = status;
    if (avatar)       data.avatar       = avatar;

    const employee = await prisma.employee.create({ data });

    return res.status(201).json({ employee });
  } catch (error) {
    console.error('[createEmployee]', error);
    return res.status(500).json({ error: 'Failed to create employee.' });
  }
};

// ─── 4. Update Employee ───────────────────────────────────────────────────────
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, departmentId, status, avatar } = req.body;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    // Check email uniqueness only if email is being changed
    if (email && email !== existing.email) {
      const emailTaken = await prisma.employee.findUnique({ where: { email } });
      if (emailTaken) {
        return res.status(400).json({ error: 'An employee with this email already exists.' });
      }
    }

    const data = {};
    if (name         !== undefined) data.name         = name;
    if (email        !== undefined) data.email        = email;
    if (role         !== undefined) data.role         = role;
    if (departmentId !== undefined) {
      if (departmentId) {
        data.department = { connect: { id: departmentId } };
      } else {
        data.department = { disconnect: true };
      }
    }
    if (status       !== undefined) data.status       = status;
    if (avatar       !== undefined) data.avatar       = avatar;

    const employee = await prisma.employee.update({ where: { id }, data });

    return res.status(200).json({ employee });
  } catch (error) {
    console.error('[updateEmployee]', error);
    return res.status(500).json({ error: 'Failed to update employee.' });
  }
};

// ─── 5. Delete Employee ───────────────────────────────────────────────────────
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found.' });
    }

    const activeAllocations = await prisma.allocation.count({
      where: { employeeId: id, status: 'ACTIVE' },
    });

    if (activeAllocations > 0) {
      return res.status(400).json({
        error: `Cannot delete employee: they have ${activeAllocations} active allocation(s). Please reassign or return assets first.`,
      });
    }

    await prisma.employee.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error('[deleteEmployee]', error);
    return res.status(500).json({ error: 'Failed to delete employee.' });
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────
module.exports = {
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
