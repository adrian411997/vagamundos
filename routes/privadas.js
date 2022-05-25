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
router.get("/admin/index", function (peticion, respuesta) {
  pool.getConnection(function (err, connection) {
    const consulta = `
      SELECT * 
      FROM publicaciones
      WHERE 
      autor_id = ${connection.escape(peticion.session.usuario.id)}
    `;
    connection.query(consulta, function (error, filas, columnas) {
      peticion.flash("sinpublicaciones", "No realizaste ninguna publicacion"),
        respuesta.render("admin/index", {
          nombre: peticion.session.usuario,
          publicaciones: filas,
          sinpublicaciones: peticion.flash("sinpublicaciones"),
        });
    });
  });
});

router.get("/proceso_cerrar", function (peticion, respuesta) {
  peticion.session.destroy();
  respuesta.redirect("/");
});

router.get("/admin/agregar", (req, res) => {
  res.render("admin/agregar", {
    mensaje: req.flash("mensaje"),
    nombre: req.session.usuario,
  });
});
router.post("/admin/procesar_agregar", (req, res) => {
  pool.getConnection((err, connection) => {
    const date = new Date();
    const fecha = `${date.getFullYear()}-${
      date.getMonth() + 1
    }-${date.getDate()}`;
    const publicar = `
    INSERT INTO
    publicaciones
    (titulo,resumen,contenido,autor_id, fecha_hora)
    VALUES (
    ${connection.escape(req.body.titulo)},
    ${connection.escape(req.body.resumen)},
    ${connection.escape(req.body.contenido)},
    ${connection.escape(req.session.usuario.id)},
    ${connection.escape(fecha)}
    )
    `;
    connection.query(publicar, (error, filas, campos) => {
      req.flash("mensaje", "Publicacion agregada");
      res.redirect("/admin/index");
    });
    connection.release();
  });
});
router.get("/admin/editar/:id", (req, res) => {
  pool.getConnection((err, connection) => {
    const editar = `
    SELECT * FROM publicaciones
    WHERE 
    id = ${connection.escape(req.params.id)}
       AND
      autor_id = ${connection.escape(req.session.usuario.id)}
    `;
    connection.query(editar, (error, filas, campos) => {
      if (filas.length > 0) {
        res.render("admin/editar", {
          publicacion: filas[0],
          nombre: req.session.usuario,
          mensaje: req.flash("mensaje"),
        });
      } else {
        req.flash("mensaje", "operacion no permitida");
        res.redirect("/admin/index");
      }
    });
    connection.release();
  });
});
router.post("/admin/procesar_editar", (req, res) => {
  pool.getConnection((err, connection) => {
    const actualizar = `
    UPDATE publicaciones
    SET
    titulo = ${connection.escape(req.body.titulo)},
    resumen = ${connection.escape(req.body.resumen)},
    contenido = ${connection.escape(req.body.contenido)}
    WHERE
    id = ${connection.escape(req.body.id)}
    AND
    autor_id= ${connection.escape(req.session.usuario.id)}
    `;
    connection.query(actualizar, (error, filas, campos) => {
      if (filas && filas.changedRows > 0) {
        req.flash("mensaje", "Publicacion editada");
      } else {
        req.flash("mensaje", "publicacion no editada");
      }
      res.redirect("/admin/index");
    });
    connection.release();
  });
});
router.get("/admin/procesar_eliminar/:id", (peticion, respuesta) => {
  pool.getConnection((err, connection) => {
    const eraser = `
      DELETE 
      FROM
      publicaciones 
      WHERE 
      id = ${connection.escape(peticion.params.id)}
      AND
      autor_id = ${connection.escape(peticion.session.usuario.id)}
    `;
    connection.query(eraser, (error, filas, campos) => {
      if (filas && filas.affectedRow > 0) {
        peticion.flash("mensaje", "Publicacion eliminada");
      } else {
        peticion.flash("mensaje", "Publicacion no eliminada");
      }
      respuesta.redirect("/admin/index");
    });
    connection.release();
  });
});
router.get("/admin/editarPerfil", (req, res) => {
  res.render("admin/perfil-edit", {
    nombre: req.session.usuario,
    mensaje: req.flash("mensaje"),
  });
});

router.post("/admin/procesar_perfil/:id", (req, res) => {
  pool.getConnection((error, connection) => {
    let update;
    const newEmail = req.body.newEmail ? req.body.newEmail : "";
    const newName = req.body.newName ? req.body.newName : "";
    if (newEmail != "") {
      update = `
        UPDATE autores
        SET 
        email = ${connection.escape(newEmail)}
        WHERE
        id = ${connection.escape(req.params.id)}
      `;
      connection.query(update, function (error, filas, columnas) {
        if (filas && filas.changedRows > 0) {
          req.flash("mensaje", "Perfil editado");
        } else {
          req.flash("mensaje", "Perfil no editado");
        }
        res.redirect("/admin/editarPerfil");
      });
    }
    if (newName != "") {
      update = `
        UPDATE autores
        SET 
        pseudonimo = ${connection.escape(newName)}
        WHERE
        id = ${connection.escape(req.params.id)}
      `;
      connection.query(update, function (error, filas, columnas) {
        if (filas && filas.changedRows > 0) {
          req.flash(
            "mensaje",
            "Perfil editado. Los cambios serán visibles al inicar sesion la proxima vez"
          );
        } else {
          req.flash("mensaje", "Perfil no editado");
        }
        res.redirect("/admin/editarPerfil");
      });
    }
    connection.release();
  });
});
module.exports = router;
