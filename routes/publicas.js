const express = require("express");
const router = express.Router();
const mysql = require("mysql");

var pool = mysql.createPool({
  connectionLimit: 20,
  host: "localhost",
  user: "root",
  password: "youtube12",
  database: "blog_viajes",
});

router.get("/", function (peticion, respuesta) {
  pool.getConnection(function (err, connection) {
    let consulta;
    let search = "";
    let limit;
    const busqueda = peticion.query.busqueda ? peticion.query.busqueda : "";
    if (busqueda != "") {
      search = `
      WHERE 
      titulo LIKE '%${busqueda}%' OR
      resumen LIKE '%${busqueda}%' OR
      contenido LIKE '%${busqueda}%'
      `;
      limit = "";
    } else {
      limit = `
      LIMIT 5
      `;
    }
    console.log(search);
    consulta = `
      SELECT 
      titulo, resumen, fecha_hora, pseudonimo, votos
      FROM publicaciones
      INNER JOIN autores
      ON publicaciones.autor_id = autores.id
      ${search}
      ORDER BY fecha_hora DESC
      ${limit}
    `;
    connection.query(consulta, function (error, filas, campos) {
      if (!filas || filas.length === 0) {
        peticion.flash("aviso", "No se encontraron publicaciones");
      }
      respuesta.render("index", {
        publicaciones: filas,
        busqueda: busqueda,
        aviso: peticion.flash("aviso"),
      });
    });
    connection.release();
  });
});

router.get("/registro", function (peticion, respuesta) {
  respuesta.render("registro", {
    mensaje: peticion.flash("mensaje"),
    aprobacion: peticion.flash("aprobacion"),
  });
});

router.post("/procesar_registro", function (peticion, respuesta) {
  pool.getConnection(function (err, connection) {
    const email = peticion.body.email.toLowerCase().trim();
    const pseudonimo = peticion.body.pseudonimo.trim();
    const contrasena = peticion.body.password;

    const consultaEmail = `
      SELECT *
      FROM autores
      WHERE email = ${connection.escape(email)}
    `;

    connection.query(consultaEmail, function (error, filas, campos) {
      if (filas.length > 0) {
        peticion.flash("mensaje", "Email duplicado");
        respuesta.redirect("/registro");
      } else {
        const consultaPseudonimo = `
          SELECT *
          FROM autores
          WHERE pseudonimo = ${connection.escape(pseudonimo)}
        `;

        connection.query(consultaPseudonimo, function (error, filas, campos) {
          if (filas.length > 0) {
            peticion.flash("mensaje", "Pseudonimo duplicado");
            respuesta.redirect("/registro");
          } else {
            const consulta = `
                                INSERT INTO
                                autores
                                (email, contrasena, pseudonimo)
                                VALUES (
                                  ${connection.escape(email)},
                                  ${connection.escape(contrasena)},
                                  ${connection.escape(pseudonimo)}
                                )
                              `;
            connection.query(consulta, function (error, filas, campos) {
              peticion.flash("aprobacion", "Usuario registrado");
              respuesta.redirect("/registro");
            });
          }
        });
      }
    });
    connection.release();
  });
});

router.get("/isesion", function (peticion, respuesta) {
  respuesta.render("isesion", { mensaje: peticion.flash("mensaje") });
});

router.post("/procesar_inicio", function (peticion, respuesta) {
  pool.getConnection(function (err, connection) {
    const consulta = `
      SELECT *
      FROM autores
      WHERE
      email = ${connection.escape(peticion.body.email)} AND
      contrasena = ${connection.escape(peticion.body.password)}
    `;

    connection.query(consulta, function (error, filas, columnas) {
      if (filas.length > 0) {
        peticion.session.usuario = filas[0];
        respuesta.redirect("admin/index");
      } else {
        peticion.flash("mensaje", "Datos inválidos");
        respuesta.redirect("/isesion");
      }
    });
    connection.release();
  });
});
module.exports = router;
