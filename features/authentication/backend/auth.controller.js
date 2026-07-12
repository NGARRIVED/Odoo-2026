const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../../shared/database');

const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
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
    res.status(500).json({ error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
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
    res.status(500).json({ error: error.message });
  }
};

module.exports = { signup, login };
