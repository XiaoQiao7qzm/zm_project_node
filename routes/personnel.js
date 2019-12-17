const express = require('express');
const router = express.Router();
const personnelController = require('../controllers/personnel')

/* GET home page. */
router.get('/perlist', personnelController.perlist.bind(personnelController))
router.post('/addPersonnel', personnelController.addPersonnel.bind(personnelController))
router.delete('/deletePersonnel', personnelController.deletePersonnel.bind(personnelController))
router.delete('/deleteBatchPersonnel', personnelController.deleteBatchPersonnel.bind(personnelController))
router.post('/upfilePersonnel', personnelController.upfilePersonnel.bind(personnelController))
router.put('/updatePersonnel', personnelController.updatePersonnel.bind(personnelController))



module.exports = router;
