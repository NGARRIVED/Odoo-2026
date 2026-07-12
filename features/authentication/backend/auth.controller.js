const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../../shared/database');

function isProvided(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function isPrismaAuthError(error) {
  return Boolean(error && (error.code === 'P1000' || /Authentication failed against database server/i.test(error.message)));
}

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!isProvided(name) || !isProvided(email) || !isProvided(password)) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }
    
    // Check if user already exists
    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        passwordHash,
        role: "EMPLOYEE" // As per architecture, only EMPLOYEE at signup
      }
    });

    res.status(201).json({ 
      message: "Employee created successfully", 
      employee: { id: employee.id, name: employee.name, email: employee.email, role: employee.role } 
    });
  } catch (error) {
    if (isPrismaAuthError(error)) {
      return res.status(500).json({
        error: 'Database authentication failed. Check DATABASE_URL in .env and verify the PostgreSQL username/password.'
      });
    }

    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!isProvided(email) || !isProvided(password)) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const employee = await prisma.employee.findUnique({ where: { email } });
    if (!employee) return res.status(404).json({ error: "Employee not found" });

    const isValid = await bcrypt.compare(password, employee.passwordHash);
    if (!isValid) return res.status(401).json({ error: "Invalid credentials" });

    const token = jwt.sign(
      { employeeId: employee.id, role: employee.role }, 
      process.env.JWT_SECRET || 'supersecret', 
      { expiresIn: '1d' }
    );
    
    res.json({ 
      message: "Login successful", 
      token, 
      user: { id: employee.id, name: employee.name, role: employee.role } 
    });
  } catch (error) {
    if (isPrismaAuthError(error)) {
      return res.status(500).json({
        error: 'Database authentication failed. Check DATABASE_URL in .env and verify the PostgreSQL username/password.'
      });
    }

    res.status(500).json({ error: error.message });
  }
};

module.exports = { signup, login };
