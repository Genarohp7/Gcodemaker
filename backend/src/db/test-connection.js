require("dotenv").config();

const { pool } = require("./index");

async function testConnection() {
  try {
    const result = await pool.query("SELECT NOW() AS current_time");
    console.log("Conexion a PostgreSQL exitosa");
    console.log(result.rows[0]);
  } catch (error) {
    console.error("Error al conectar con PostgreSQL");
    console.error(error);
  } finally {
    await pool.end();
  }
}

testConnection();
