const prisma = require('../config/prisma');
const crypto = require('crypto');

const createEquipe = async (req, res) => {
  try {
    console.log('createEquipe called by userId:', req.userId);
    const { name } = req.body;
    console.log('name:', name);
    
    const equipe = await prisma.equipe.create({
      data: { name }
    });
    res.status(201).json(equipe);
  } catch (error) {
    console.error('createEquipe error:', error.message);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  } 
};

const getEquipe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: {
        equipe: {
          include: {
            members: { select: { id: true, name: true, email: true, role: true } },
            projets: true
          }
        }
      }
    });
    res.json(user.equipe);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const createInvitation = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 jours

    const invitation = await prisma.invitation.create({
      data: {
        code,
        equipeId: user.equipeId,
        createdById: req.userId,
        expiresAt,
        role: req.body.role || 'EMPLOYEE'
      }
    });

    res.status(201).json({
      ...invitation,
      link: `${process.env.FRONTEND_URL}/register?code=${code}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const getInvitations = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    const invitations = await prisma.invitation.findMany({
      where: { equipeId: user.equipeId },
      include: {
        usedBy: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(invitations);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const verifyInvitation = async (req, res) => {
  try {
    const { code } = req.params;
    const invitation = await prisma.invitation.findUnique({
      where: { code },
      include: { equipe: true }
    });

    if (!invitation) return res.status(404).json({ message: 'Code invalide' });
    if (invitation.usedAt) return res.status(400).json({ message: 'Code déjà utilisé' });
    if (new Date() > invitation.expiresAt) return res.status(400).json({ message: 'Code expiré' });

    res.json({ 
      valid: true, 
      equipe: invitation.equipe.name,
      role: invitation.role 
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const getMembresStats = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const membres = await prisma.user.findMany({
      where: { equipeId: user.equipeId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        timeEntries: {
          select: { duration: true, startTime: true }
        }
      }
    });

    const membresStats = membres.map(m => ({
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role,
      todayDuration: m.timeEntries
        .filter(e => new Date(e.startTime) >= today)
        .reduce((sum, e) => sum + (e.duration || 0), 0),
      weekDuration: m.timeEntries
        .filter(e => new Date(e.startTime) >= weekStart)
        .reduce((sum, e) => sum + (e.duration || 0), 0),
      totalDuration: m.timeEntries
        .reduce((sum, e) => sum + (e.duration || 0), 0),
    }));

    res.json(membresStats);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};const getEquipes = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const equipes = await prisma.equipe.findMany({
      include: {
        members: { select: { id: true, name: true, email: true, role: true } }
      }
    });
    res.json(equipes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};const updateEquipe = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const { name } = req.body;
    const equipe = await prisma.equipe.update({
      where: { id: user.equipeId },
      data: { name }
    });
    res.json(equipe);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};const deleteInvitation = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const { id } = req.params;
    await prisma.invitation.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Invitation supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { createEquipe, getEquipe, getEquipes, updateEquipe, createInvitation, getInvitations, verifyInvitation, getMembresStats, deleteInvitation };