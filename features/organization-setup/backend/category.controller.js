const prisma = require('../../../shared/database');

// ─── 1. List Categories ───────────────────────────────────────────────────────

/**
 * GET /categories
 * Returns all asset categories ordered by name, each with an assetCount.
 */
const listCategories = async (req, res) => {
  try {
    const categories = await prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    const mapped = categories.map((cat) => ({
      id:           cat.id,
      name:         cat.name,
      description:  cat.description,
      customFields: cat.customFields,
      assetCount:   cat._count.assets,
      createdAt:    cat.createdAt,
    }));

    return res.status(200).json({ categories: mapped });
  } catch (error) {
    console.error('[listCategories]', error);
    return res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};

// ─── 2. Get Category ──────────────────────────────────────────────────────────

/**
 * GET /categories/:id
 * Returns a single category with its 10 most recent assets.
 */
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.assetCategory.findUnique({
      where: { id },
      include: {
        assets: {
          select: {
            id:     true,
            tag:    true,
            name:   true,
            status: true,
          },
          orderBy: { id: 'desc' },
          take: 10,
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: `Category with id '${id}' not found.` });
    }

    return res.status(200).json({ category });
  } catch (error) {
    console.error('[getCategory]', error);
    return res.status(500).json({ error: 'Failed to fetch category.' });
  }
};

// ─── 3. Create Category ───────────────────────────────────────────────────────

/**
 * POST /categories
 * Body: { name (required), description?, customFields? }
 * Returns 201 with the newly created category.
 */
const createCategory = async (req, res) => {
  try {
    const { name, description, customFields } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Field "name" is required.' });
    }

    const trimmedName = name.trim();

    // Uniqueness check
    const existing = await prisma.assetCategory.findUnique({
      where: { name: trimmedName },
    });

    if (existing) {
      return res
        .status(409)
        .json({ error: `A category named '${trimmedName}' already exists.` });
    }

    const category = await prisma.assetCategory.create({
      data: {
        name:         trimmedName,
        description:  description  ?? null,
        customFields: customFields ?? undefined,
      },
    });

    return res.status(201).json({ category });
  } catch (error) {
    console.error('[createCategory]', error);
    return res.status(500).json({ error: 'Failed to create category.' });
  }
};

// ─── 4. Update Category ───────────────────────────────────────────────────────

/**
 * PATCH /categories/:id
 * Body: { name?, description?, customFields? }
 * Checks name uniqueness (excluding the current record) when name changes.
 */
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, customFields } = req.body;

    // Verify the category exists
    const existing = await prisma.assetCategory.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: `Category with id '${id}' not found.` });
    }

    // Build the update payload
    const data = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Field "name" must be a non-empty string.' });
      }
      const trimmedName = name.trim();

      if (trimmedName !== existing.name) {
        // Check uniqueness only when the name is actually changing
        const conflict = await prisma.assetCategory.findUnique({
          where: { name: trimmedName },
        });
        if (conflict) {
          return res
            .status(409)
            .json({ error: `A category named '${trimmedName}' already exists.` });
        }
      }

      data.name = trimmedName;
    }

    if (description !== undefined) data.description  = description;
    if (customFields !== undefined) data.customFields = customFields;

    const category = await prisma.assetCategory.update({
      where: { id },
      data,
    });

    return res.status(200).json({ category });
  } catch (error) {
    console.error('[updateCategory]', error);
    return res.status(500).json({ error: 'Failed to update category.' });
  }
};

// ─── 5. Delete Category ───────────────────────────────────────────────────────

/**
 * DELETE /categories/:id
 * Refuses deletion (400) if the category has associated assets.
 * Returns 204 No Content on success.
 */
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Verify the category exists
    const category = await prisma.assetCategory.findUnique({
      where: { id },
      include: {
        _count: { select: { assets: true } },
      },
    });

    if (!category) {
      return res.status(404).json({ error: `Category with id '${id}' not found.` });
    }

    const assetCount = category._count.assets;

    if (assetCount > 0) {
      return res.status(400).json({
        error: `Cannot delete category '${category.name}' because it still has ${assetCount} asset${assetCount === 1 ? '' : 's'} assigned to it. Reassign or remove the assets first.`,
        assetCount,
      });
    }

    await prisma.assetCategory.delete({ where: { id } });

    return res.status(204).send();
  } catch (error) {
    console.error('[deleteCategory]', error);
    return res.status(500).json({ error: 'Failed to delete category.' });
  }
};

// ─── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory,
};
