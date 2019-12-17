var express = require('express')
var router = express.Router()

const userController = require('../controllers/users')

/* GET users listing. */
router.post('/register', userController.register.bind(userController))
router.post('/login', userController.login.bind(userController))
router.get('/svgCaptcha', userController.svgCaptcha.bind(userController))
router.get('/getUserInfo', userController.getUserInfo.bind(userController))
router.post('/uploadHead', userController.uploadHead.bind(userController))
router.post('/exit', userController.exit.bind(userController))



module.exports = router;
