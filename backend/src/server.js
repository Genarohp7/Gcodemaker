require("dotenv").config();

const app = require("./app");
const env = require("./config/env");

const PORT = env.port;

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
