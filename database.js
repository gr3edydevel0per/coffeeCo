const mariadb = require('mariadb');

async function executeQuery(sql) {
   try {
      const connection = await mariadb.createConnection({
         host: '127.0.0.1',
         user: 'greedydev',
         password: 'root',
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