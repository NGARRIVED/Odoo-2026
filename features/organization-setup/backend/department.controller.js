const prisma = require('../../../shared/database');

// ─── List Departments ─────────────────────────────────────────────────────────

/**
 * GET /departments
 * Fetch all departments with employee/asset counts, head info, and hierarchy info.
 */
const listDepartments = async (req, res) => {
  try {
    const departments = await prisma.department.findMany({
      include: {
        head: {
          select: { name: true, email: true },
        },
        parent: {
          select: { name: true },
        },
        _count: {
          select: {
            employees: true,
            assets: true,
            children: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const mapped = departments.map((dept) => ({
      id: dept.id,
      name: dept.name,
      status: dept.status,
      parentId: dept.parentId ?? null,
      parentName: dept.parent?.name ?? null,
      headId: dept.headId ?? null,
      headName: dept.head?.name ?? null,
      headEmail: dept.head?.email ?? null,
      employeeCount: dept._count.employees,
      assetCount: dept._count.assets,
      childCount: dept._count.children,
      createdAt: dept.createdAt,
    }));

    return res.status(200).json({ departments: mapped });
  } catch (error) {
    console.error('[listDepartments]', error);
    return res.status(500).json({ error: 'Failed to fetch departments.' });
  }
};

// ─── Get Department ───────────────────────────────────────────────────────────

/**
 * GET /departments/:id
 * Fetch a single department with full detail: head, parent, children, employees, asset count.
 */
const getDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        head: {
          select: { name: true, email: true, role: true },
        },
        parent: {
          select: { name: true },
        },
        children: {
          select: { id: true, name: true, status: true },
          orderBy: { name: 'asc' },
        },
        employees: {
          select: { id: true, name: true, email: true, role: true, status: true },
          orderBy: { name: 'asc' },
        },
        _count: {
          select: { assets: true },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    return res.status(200).json({ department });
  } catch (error) {
    console.error('[getDepartment]', error);
    return res.status(500).json({ error: 'Failed to fetch department.' });
  }
};

// ─── Create Department ────────────────────────────────────────────────────────

/**
 * POST /departments
 * Create a new department.
 * Body: { name, parentId?, headId?, status? }
 */
const createDepartment = async (req, res) => {
  const { name, parentId, headId, status } = req.body;

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'Department name is required.' });
  }

  try {
    // Validate headId if provided
    if (headId) {
      const employee = await prisma.employee.findUnique({ where: { id: headId } });
      if (!employee) {
        return res.status(400).json({ error: `Employee with id "${headId}" not found.` });
      }
    }

    // Validate parentId if provided
    if (parentId) {
      const parentDept = await prisma.department.findUnique({ where: { id: parentId } });
      if (!parentDept) {
        return res.status(400).json({ error: `Parent department with id "${parentId}" not found.` });
      }
    }

    const data = {
      name: name.trim(),
    };
    if (parentId) data.parent = { connect: { id: parentId } };
    if (headId) data.head = { connect: { id: headId } };
    if (status) data.status = status;

    const department = await prisma.department.create({
      data,
      include: {
        head: { select: { name: true, email: true, role: true } },
        parent: { select: { name: true } },
      },
    });

    return res.status(201).json({ department });
  } catch (error) {
    console.error('[createDepartment]', error);
    return res.status(500).json({ error: 'Failed to create department.' });
  }
};

// ─── Update Department ────────────────────────────────────────────────────────

/**
 * PATCH /departments/:id
 * Update an existing department.
 * Body: { name?, parentId?, headId?, status? }
 */
const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const { name, parentId, headId, status } = req.body;

  try {
    // Ensure the department exists
    const existing = await prisma.department.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    // Validate headId if provided (allow null to clear)
    if (headId !== undefined && headId !== null) {
      const employee = await prisma.employee.findUnique({ where: { id: headId } });
      if (!employee) {
        return res.status(400).json({ error: `Employee with id "${headId}" not found.` });
      }
    }

    // Validate parentId if provided (allow null to clear)
    if (parentId !== undefined && parentId !== null) {
      if (parentId === id) {
        return res.status(400).json({ error: 'A department cannot be its own parent.' });
      }
      const parentDept = await prisma.department.findUnique({ where: { id: parentId } });
      if (!parentDept) {
        return res.status(400).json({ error: `Parent department with id "${parentId}" not found.` });
      }
    }

    // Build the data object — support explicit null to clear optional relations
    const data = {};
    if (name !== undefined) data.name = name.trim();
    if (status !== undefined) data.status = status;
    
    if (parentId !== undefined) {
      if (parentId) data.parent = { connect: { id: parentId } };
      else data.parent = { disconnect: true };
    }
    
    if (headId !== undefined) {
      if (headId) data.head = { connect: { id: headId } };
      else data.head = { disconnect: true };
    }

    const department = await prisma.department.update({
      where: { id },
      data,
      include: {
        head: { select: { name: true, email: true, role: true } },
        parent: { select: { name: true } },
        children: { select: { id: true, name: true, status: true } },
        employees: { select: { id: true, name: true, email: true, role: true, status: true } },
        _count: { select: { assets: true } },
      },
    });

    return res.status(200).json({ department });
  } catch (error) {
    console.error('[updateDepartment]', error);
    return res.status(500).json({ error: 'Failed to update department.' });
  }
};

// ─── Delete Department ────────────────────────────────────────────────────────

/**
 * DELETE /departments/:id
 * Delete a department only if it has no employees and no child departments.
 */
const deleteDepartment = async (req, res) => {
  const { id } = req.params;

  try {
    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: { employees: true, children: true },
        },
      },
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found.' });
    }

    const { employees: employeeCount, children: childCount } = department._count;

    if (employeeCount > 0 && childCount > 0) {
      return res.status(400).json({
        error: `Cannot delete department "${department.name}". It has ${employeeCount} employee(s) and ${childCount} child department(s). Reassign or remove them first.`,
      });
    }

    if (employeeCount > 0) {
      return res.status(400).json({
        error: `Cannot delete department "${department.name}". It still has ${employeeCount} employee(s). Reassign them to another department first.`,
      });
    }

    if (childCount > 0) {
      return res.status(400).json({
        error: `Cannot delete department "${department.name}". It has ${childCount} child department(s). Remove or reassign them first.`,
      });
    }

    await prisma.department.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error('[deleteDepartment]', error);
    return res.status(500).json({ error: 'Failed to delete department.' });
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  listDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
