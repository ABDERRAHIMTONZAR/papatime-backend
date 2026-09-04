const prisma = require('../config/prisma');

const getTaches = async (req, res) => {
  try {
    const projetId = parseInt(req.params.projetId);
    console.log('Fetching taches for projetId:', projetId); // debug

    const taches = await prisma.tache.findMany({
      where: { projetId },
      include: {
        timeEntries: { select: { duration: true } }
      }
    });

    const tachesWithTotal = taches.map(t => ({
      ...t,
      totalDuration: t.timeEntries.reduce((sum, e) => sum + (e.duration || 0), 0)
    }));

    res.json(tachesWithTotal);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const createTache = async (req, res) => {
  try {
    const { projetId } = req.params;
    const { name, description } = req.body;
    const tache = await prisma.tache.create({
      data: { name, description, projetId: parseInt(projetId) }
    });
    res.status(201).json(tache);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const deleteTache = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tache.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Tâche supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { getTaches, createTache, deleteTache };