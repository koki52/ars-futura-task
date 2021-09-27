const dotenv = require('dotenv');
dotenv.config({ path: `.env.${process.env.ENVIRONMENT || 'development'}` });

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "postgres",
    seederStorage: 'sequelize',
  }
};