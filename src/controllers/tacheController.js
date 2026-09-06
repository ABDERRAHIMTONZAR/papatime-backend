const prisma = require('../config/prisma');

const getTaches = async (req, res) => {
  try {
    const { projetId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    let taches;
    if (user.role === 'ADMIN') {
      // Admin voit toutes les tâches
      taches = await prisma.tache.findMany({
        where: { projetId: parseInt(projetId) },
        include: {
          timeEntries: { select: { duration: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
          equipe: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Employee voit seulement tâches de son équipe
      taches = await prisma.tache.findMany({
        where: { 
          projetId: parseInt(projetId),
          OR: [
            { equipeId: user.equipeId }, // tâche assignée à son équipe
            { equipeId: null }           // tâche non assignée
          ]
        },
        include: {
          timeEntries: { 
            where: { userId: req.userId },
            select: { duration: true } 
          },
          assignedTo: { select: { id: true, name: true, email: true } },
          equipe: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

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
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    const { projetId } = req.params;
    const { name, description, assignedId } = req.body;
    
    const tache = await prisma.tache.create({
      data: { 
        name, 
        description, 
        projetId: parseInt(projetId),
        assignedId: assignedId ? parseInt(assignedId) : null,
        equipeId: user.equipeId // ← automatiquement l'équipe de l'admin !
      }
    });
    res.status(201).json(tache);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

const updateTache = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, assignedId, equipeId } = req.body;
    const tache = await prisma.tache.update({
      where: { id: parseInt(id) },
      data: { 
        name, 
        description, 
        assignedId: assignedId ? parseInt(assignedId) : null,
        equipeId: equipeId ? parseInt(equipeId) : null
      }
    });
    res.json(tache);
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

module.exports = { getTaches, createTache, updateTache, deleteTache };