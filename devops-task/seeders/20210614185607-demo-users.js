'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const users = [];
    for(let i = 0; i < 50; i ++) {
      users.push({
        email: `${Math.random().toString(36).substr(2, 5)}@arsfutura.co`,
        password: Math.random().toString(36).substr(2, 5),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await queryInterface.bulkInsert('Users', users);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', null, {});
  },
};
