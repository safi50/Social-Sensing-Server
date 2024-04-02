
const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');


router.post('/saveSearch', searchController.saveSearch);
router.delete('/deleteSearch', searchController.deleteSearch);
router.put('/updateSearch', searchController.updateSearch);
router.get('/getSearches', searchController.getSearches);

module.exports = router;

