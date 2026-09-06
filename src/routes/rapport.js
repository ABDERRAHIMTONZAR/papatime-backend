const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { generateRapport } = require('../controllers/rapportController');

router.get('/:projetId', auth, generateRapport);

module.exports = router;