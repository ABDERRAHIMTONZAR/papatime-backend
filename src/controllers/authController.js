const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/prisma');

const register = async (req, res) => {
  try {
    const { email, password, name, code } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });

    let equipeId = null;
    let role = 'ADMIN'; 
    let invitationId = null;

    if (code) {
      // Avec code → EMPLOYEE dans l'équipe de l'invitation
      const invitation = await prisma.invitation.findUnique({
        where: { code },
        include: { equipe: true }
      });

      if (!invitation) return res.status(400).json({ message: 'Code d\'invitation invalide' });
      if (invitation.usedAt) return res.status(400).json({ message: 'Code déjà utilisé' });
      if (new Date() > invitation.expiresAt) return res.status(400).json({ message: 'Code expiré' });

      equipeId = invitation.equipeId;
      role = invitation.role;
      invitationId = invitation.id;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role, equipeId }
    });

    // Si pas de code → créer équipe automatiquement
    if (!code) {
      const equipe = await prisma.equipe.create({
        data: { 
          name: `Équipe de ${name || email}`,
          members: { connect: { id: user.id } }
        }
      });
      await prisma.user.update({
        where: { id: user.id },
        data: { equipeId: equipe.id }
      });
      equipeId = equipe.id;
    }

    if (invitationId) {
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { usedAt: new Date(), usedById: user.id }
      });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role, equipeId }
    });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Erreur serveur', error }); 
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: 'Utilisateur non trouvé' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Mot de passe incorrect' });

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role, equipeId: user.equipeId } 
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { register, login };