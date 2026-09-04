const prisma = require('../config/prisma');

const getProjects = async (req, res) => {
  try {
const projects = await prisma.projet.findMany({
  where: { userId: req.userId },
  include: {
    timeEntries: { select: { duration: true } },
    taches: true
  }
});

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
    const { name, description, color } = req.body;
    const project = await prisma.projet.create({
      data: { name, description, color, userId: req.userId }
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
      where: { id: parseInt(id), userId: req.userId },
      data: { name, description, color }
    });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.projet.delete({
      where: { id: parseInt(id), userId: req.userId }
    });
    res.json({ message: 'Projet supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { getProjects, createProject, updateProject, deleteProject };