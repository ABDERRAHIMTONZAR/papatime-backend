const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {
  getAllEquipes,
  createAdminAccount,
  deleteEquipe,
  getGlobalStats
} = require('../controllers/superAdminController');

router.get('/equipes', auth, getAllEquipes);
router.post('/admins', auth, createAdminAccount);
router.delete('/equipes/:id', auth, deleteEquipe);
router.get('/stats', auth, getGlobalStats);

module.exports = router;