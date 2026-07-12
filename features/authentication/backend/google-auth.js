const jwt = require('jsonwebtoken');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '7d' }
  );
};

const handleGoogleLogin = async (req, res, prisma) => {
  try {
    const { email, name, googleId, picture } = req.body;

    if (!email || !googleId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find or create user
    let user = await prisma.employee.findUnique({ where: { email } });

    if (!user) {
      user = await prisma.employee.create({
        data: {
          email,
          name,
          googleId,
          avatar: picture,
          role: 'EMPLOYEE',
          status: 'ACTIVE'
        }
      });
    } else if (!user.googleId) {
      await prisma.employee.update({
        where: { id: user.id },
        data: { googleId }
      });
    }

    const token = generateToken(user);
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { handleGoogleLogin, generateToken };
