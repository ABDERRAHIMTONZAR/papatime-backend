const prisma = require('../config/prisma');

const getProjects = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    
    let projects;
    if (user.role === 'ADMIN') {
      projects = await prisma.projet.findMany({
        where: { equipeId: user.equipeId },
        include: {
          timeEntries: { select: { duration: true } },
          taches: {
            include: {
              timeEntries: { select: { duration: true } }
            }
          },
          createdBy: { select: { name: true, email: true } }
        }
      });
    } else {
      projects = await prisma.projet.findMany({
        where: { equipeId: user.equipeId },
        include: {
          timeEntries: { 
            where: { userId: req.userId },
            select: { duration: true } 
          },
          taches: true,
          createdBy: { select: { name: true, email: true } }
        }
      });
    }

    const projectsWithTotal = projects.map(p => ({
      ...p,
      totalDuration: p.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    }));

    res.json(projectsWithTotal);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const createProject = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const { name, description, color } = req.body;
    const project = await prisma.projet.create({
      data: { 
        name, 
        description, 
        color, 
        userId: req.userId,
        equipeId: user.equipeId
      }
    });
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;
    const project = await prisma.projet.update({
      where: { id: parseInt(id) },
      data: { name, description, color }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const deleteProject = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const { id } = req.params;
    await prisma.projet.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };