const prisma = require('../config/prisma');

const getDashboard = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    // Durée aujourd'hui
    const todayEntries = await prisma.timeEntry.aggregate({
      where: { userId: req.userId, startTime: { gte: today } },
      _sum: { duration: true }
    });

    // Durée cette semaine
    const weekEntries = await prisma.timeEntry.aggregate({
      where: { userId: req.userId, startTime: { gte: weekStart } },
      _sum: { duration: true }
    });

    // Timer actif
    const activeTimer = await prisma.timeEntry.findFirst({
      where: { userId: req.userId, endTime: null },
      include: { projet: true }
    });

    // Durée par projet
    const byProject = await prisma.timeEntry.groupBy({
      by: ['projetId'],
      where: { userId: req.userId },
      _sum: { duration: true }
    });

    // Activité récente
    const recentEntries = await prisma.timeEntry.findMany({
      where: { userId: req.userId },
      include: { projet: true },
      orderBy: { startTime: 'desc' },
      take: 5
    });

    res.json({
      todayDuration: todayEntries._sum.duration || 0,
      weekDuration: weekEntries._sum.duration || 0,
      activeTimer,
      byProject,
      recentEntries
    });

  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error });
  }
};

module.exports = { getDashboard };