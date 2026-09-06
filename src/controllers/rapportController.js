const prisma = require('../config/prisma');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const generateRapport = async (req, res) => {
  try {
    const { projetId } = req.params;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (user.role !== 'ADMIN') return res.status(403).json({ message: 'Accès refusé' });

    // Récupérer données du projet
    const projet = await prisma.projet.findUnique({
      where: { id: parseInt(projetId) },
      include: {
        taches: {
          include: {
            timeEntries: { select: { duration: true, startTime: true } },
            assignedTo: { select: { name: true, email: true } },
            equipe: { select: { name: true } }
          }
        },
        timeEntries: {
          include: {
            user: { select: { name: true, email: true } }
          }
        }
      }
    });

    if (!projet) return res.status(404).json({ message: 'Projet non trouvé' });

    // Calculer stats
    const totalDuration = projet.timeEntries.reduce((sum, e) => sum + e.duration, 0);
    const tachesStats = projet.taches.map(t => ({
      nom: t.name,
      equipe: t.equipe?.name || 'Non assigné',
      membre: t.assignedTo?.name || t.assignedTo?.email || 'Non assigné',
      duree: t.timeEntries.reduce((sum, e) => sum + e.duration, 0)
    }));

    const membreStats = {};
    projet.timeEntries.forEach(e => {
      const key = e.user.name || e.user.email;
      if (!membreStats[key]) membreStats[key] = 0;
      membreStats[key] += e.duration;
    });

    // Construire prompt
    const prompt = `
Tu es un assistant analytique pour une entreprise de coaching fitness appelée Papa in Shape.
Analyse ce projet et génère un rapport détaillé en français.

PROJET : ${projet.name}
Description : ${projet.description || 'Aucune description'}
Temps total : ${Math.floor(totalDuration / 3600)}h ${Math.floor((totalDuration % 3600) / 60)}m

TÂCHES :
${tachesStats.map(t => `- ${t.nom} (${t.equipe} / ${t.membre}) : ${Math.floor(t.duree / 3600)}h ${Math.floor((t.duree % 3600) / 60)}m`).join('\n')}

TEMPS PAR MEMBRE :
${Object.entries(membreStats).map(([nom, dur]) => `- ${nom} : ${Math.floor(dur / 3600)}h ${Math.floor((dur % 3600) / 60)}m`).join('\n')}

Génère un rapport avec :
1. Résumé exécutif
2. Analyse des tâches (quelle tâche prend le plus de temps et pourquoi)
3. Performance par membre
4. Points d'attention et risques
5. Recommandations concrètes pour améliorer la productivité
6. Estimation de fin du projet si la tendance continue

Sois précis, professionnel et actionnable.
    `;

    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'openai/gpt-oss-120b',
      temperature: 0.7,
      max_tokens: 3000 
    });

    const rapport = completion.choices[0]?.message?.content;

    res.json({ 
      projet: projet.name,
      rapport,
      stats: {
        totalDuration,
        tachesCount: projet.taches.length,
        membresCount: Object.keys(membreStats).length
      }
    });

  } catch (error) {
    console.error('Rapport error:', error);
    res.status(500).json({ message: 'Erreur génération rapport', error: error.message });
  }
};

module.exports = { generateRapport };