const express = require('express');
const router = express.Router();

const usersController = require('../controllers/users');

router.get('/every', usersController.findAll);

module.exports = router;
