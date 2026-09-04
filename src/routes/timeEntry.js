const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {getTimeEntries,startTimer,stopTimer,createManualEntry,updateEntry,deleteEntry
    
} = require('../controllers/timeEntryController');

router.get('/', auth, getTimeEntries);
router.post('/start', auth, startTimer);
router.put('/stop/:id', auth, stopTimer);
router.post('/manual', auth, createManualEntry);
router.put('/:id', auth, updateEntry);
router.delete('/:id', auth, deleteEntry);

module.exports = router;