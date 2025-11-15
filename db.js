// db.js
import sql from 'mssql';
import dotenv from 'dotenv';

dotenv.config(); // 👈 Cargar variables de entorno AQUÍ

const sqlConfig = {
  server: process.env.SQL_SERVER,
  database: process.env.SQL_DATABASE,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  options: {
    encrypt: process.env.SQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.SQL_TRUST_SERVER_CERTIFICATE === 'true'
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool;

export async function getPool() {
  if (pool) return pool;
  // Solo para verificar que sí se cargó:
  console.log('Conectando a SQL Server:', sqlConfig.server, sqlConfig.database);
  pool = await sql.connect(sqlConfig);
  return pool;
}

export { sql };
