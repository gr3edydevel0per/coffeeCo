const mariadb = require('mariadb');
require('dotenv').config();

const dbHost = process.env.DB_HOST;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASS;

// Now you can use dbHost, dbUser, and dbPass in your application

async function executeQuery(sql) {
   try {
      const connection = await mariadb.createConnection({
         host: dbHost,
         user: dbUser,
         password:dbPass,
         database: 'coffeeCo',
         port: 3306 // default port for MariaDB
      });
      const result = await connection.query(sql);
      await connection.end();
      return result;
     
   } catch (error) {
      console.error('Error connecting to MariaDB:', error);
   }
}


module.exports = {
   executeQuery
 };