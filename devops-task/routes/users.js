const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users');

router.get('/all', usersController.findAll);

module.exports = router;
