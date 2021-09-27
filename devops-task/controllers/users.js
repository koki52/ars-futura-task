const { User: model, sequelize } = require('../models');

async function findAll(req, res) {
  res.json(await model.findAll());
}

module.exports = {
  findAll
};
