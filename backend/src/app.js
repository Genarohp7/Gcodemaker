const express = require("express");
const cors = require("cors");

const indexRoutes = require("./routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "25mb" }));

app.use("/", indexRoutes);

module.exports = app;
