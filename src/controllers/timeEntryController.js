const prisma = require('../config/prisma');

const getTimeEntries = async (req, res) => {
  try {
    const entries = await prisma.timeEntry.findMany({
  where: { userId: req.userId },
  include: { 
    projet: true, 
    tache: true  
  },
  orderBy: { startTime: 'desc' }
});
    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const startTimer = async (req, res) => {
  try {
    const { description, projetId, tacheId } = req.body;
    const entry = await prisma.timeEntry.create({
      data: {
        description,
        startTime: new Date(),
        userId: req.userId,
        projetId: projetId ? parseInt(projetId) : null,
        tacheId: tacheId ? parseInt(tacheId) : null
      }
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const stopTimer = async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await prisma.timeEntry.findUnique({
      where: { id: parseInt(id) }
    });
    if (!entry) return res.status(404).json({ message: 'Entrée non trouvée' });

    const endTime = new Date();
    const duration = Math.floor((endTime - new Date(entry.startTime)) / 1000);

    const updated = await prisma.timeEntry.update({
      where: { id: parseInt(id) },
      data: { endTime, duration }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const createManualEntry = async (req, res) => {
  try {
    const { description, startTime, endTime, projetId, tacheId } = req.body;
    const duration = Math.floor((new Date(endTime) - new Date(startTime)) / 1000);
    const entry = await prisma.timeEntry.create({
      data: {
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        userId: req.userId,
        projetId: projetId ? parseInt(projetId) : null,
        tacheId: tacheId ? parseInt(tacheId) : null
      }
    });
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const updateEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, projetId, tacheId } = req.body;
    const updated = await prisma.timeEntry.update({
      where: { id: parseInt(id) },
      data: { description, projetId: projetId ? parseInt(projetId) : null, tacheId: tacheId ? parseInt(tacheId) : null }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const deleteEntry = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.timeEntry.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Entrée supprimée' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { getTimeEntries, startTimer, stopTimer, createManualEntry, updateEntry, deleteEntry };