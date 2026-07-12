const express = require('express');
const { requireAuth, requireRole } = require('../../authentication/backend/auth.middleware');
const departmentController = require('./department.controller');
const employeeController = require('./employee.controller');
const categoryController = require('./category.controller');

const router = express.Router();

const adminOnly = [requireAuth, requireRole(['ADMIN'])];
const managerPlus = [requireAuth, requireRole(['ADMIN', 'ASSET_MANAGER'])];

// ── Departments ──────────────────────────────────────────────────────────────
router.get('/departments',      departmentController.listDepartments);
router.get('/departments/:id',  departmentController.getDepartment);
router.post('/departments',          ...adminOnly,   departmentController.createDepartment);
router.patch('/departments/:id',     ...adminOnly,   departmentController.updateDepartment);
router.delete('/departments/:id',    ...adminOnly,   departmentController.deleteDepartment);

// ── Employees ────────────────────────────────────────────────────────────────
router.get('/employees',        employeeController.listEmployees);
router.get('/employees/:id',    employeeController.getEmployee);
router.post('/employees',            ...adminOnly,   employeeController.createEmployee);
router.patch('/employees/:id',       ...adminOnly,   employeeController.updateEmployee);
router.delete('/employees/:id',      ...adminOnly,   employeeController.deleteEmployee);

// ── Asset Categories ─────────────────────────────────────────────────────────
router.get('/categories',       categoryController.listCategories);
router.get('/categories/:id',   categoryController.getCategory);
router.post('/categories',           ...adminOnly,   categoryController.createCategory);
router.patch('/categories/:id',      ...adminOnly,   categoryController.updateCategory);
router.delete('/categories/:id',     ...adminOnly,   categoryController.deleteCategory);

module.exports = router;
