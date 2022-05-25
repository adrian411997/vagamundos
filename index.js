const express = require("express");
const aplicacion = express();
const bodyParser = require("body-parser");
const session = require("express-session");
const flash = require("express-flash");

const middleware = require("./routes/middleware");
const privadas = require("./routes/privadas");
const publicas = require("./routes/publicas");

aplicacion.use(bodyParser.json());
aplicacion.use(bodyParser.urlencoded({ extended: true }));
aplicacion.set("view engine", "ejs");
aplicacion.use(
  session({
    secret: "token-muy-secreto",
    resave: true,
    saveUninitialized: true,
  })
);
aplicacion.use(flash());
aplicacion.use(express.static("public"));

aplicacion.use(middleware);
aplicacion.use(privadas);
aplicacion.use(publicas);

aplicacion.listen(8080, function () {
  console.log("Servidor iniciado");
});
