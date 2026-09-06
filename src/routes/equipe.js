const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { createEquipe, getEquipe, getEquipes, createInvitation, deleteInvitation ,getInvitations, verifyInvitation, getMembresStats,updateEquipe } = require('../controllers/equipeController');


router.post('/', auth, createEquipe);
router.get('/', auth, getEquipe);
router.post('/invitations', auth, createInvitation);
router.get('/invitations', auth, getInvitations);
router.get('/invitations/:code', verifyInvitation); 
router.get('/membres/stats', auth, getMembresStats);
router.get('/all', auth, getEquipes);  
router.put('/', auth, updateEquipe);
router.delete('/invitations/:id', auth, deleteInvitation);
module.exports = router;