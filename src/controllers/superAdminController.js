const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

const checkSuperAdmin = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  return user?.role === 'SUPER_ADMIN';
};

const getAllEquipes = async (req, res) => {
  try {
    if (!await checkSuperAdmin(req.userId)) 
      return res.status(403).json({ message: 'Accès refusé' });

    const equipes = await prisma.equipe.findMany({
      include: {
        members: { select: { id: true, name: true, email: true, role: true } },
        projets: true,
        _count: { select: { members: true, projets: true } }
      }
    });
    res.json(equipes);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const createAdminAccount = async (req, res) => {
  try {
    if (!await checkSuperAdmin(req.userId))
      return res.status(403).json({ message: 'Accès refusé' });

    const { email, password, name, equipeName } = req.body;

    // Vérifier email existant
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return res.status(400).json({ message: 'Email déjà utilisé' });

    // Créer équipe
    const equipe = await prisma.equipe.create({
      data: { name: equipeName }
    });

    // Créer admin
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
        equipeId: equipe.id
      }
    });

    // Lier admin à l'équipe
    await prisma.equipe.update({
      where: { id: equipe.id },
      data: { members: { connect: { id: user.id } } }
    });

    res.status(201).json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      equipe: { id: equipe.id, name: equipe.name }
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const deleteEquipe = async (req, res) => {
  try {
    if (!await checkSuperAdmin(req.userId))
      return res.status(403).json({ message: 'Accès refusé' });

    const { id } = req.params;
    await prisma.equipe.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Équipe supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const getGlobalStats = async (req, res) => {
  try {
    if (!await checkSuperAdmin(req.userId))
      return res.status(403).json({ message: 'Accès refusé' });

    const [equipes, users, projets, timeEntries] = await Promise.all([
      prisma.equipe.count(),
      prisma.user.count(),
      prisma.projet.count(),
      prisma.timeEntry.aggregate({ _sum: { duration: true } })
    ]);

    res.json({
      totalEquipes: equipes,
      totalUsers: users,
      totalProjets: projets,
      totalDuration: timeEntries._sum.duration || 0
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { getAllEquipes, createAdminAccount, deleteEquipe, getGlobalStats };