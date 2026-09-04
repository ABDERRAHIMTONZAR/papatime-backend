const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { getTaches, createTache, deleteTache } = require('../controllers/tacheController');

router.get('/:projetId', auth, getTaches);
router.post('/:projetId', auth, createTache);
router.delete('/:id', auth, deleteTache);

module.exports = router;