const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { type } = require("os");
require("../models/Usuario");
const Usuario = mongoose.model("usuarios");
const bcrytpt = require("bcryptjs");
const passport = require("passport");

router.get("/registro", (req, res) => {
  res.render("usuarios/registro");
});

router.post("/registro", (req, res) => {
  let errors = validarRegistro(req.body);
  if (errors.length > 0) {
    res.render("usuarios/registro", { errors: errors });
  } else {
    Usuario.findOne({ email: req.body.email })
      .then((usuario) => {
        if (usuario) {
          req.flash("error_msg", "Já existe uma conta com esse email");
          res.redirect("/usuarios/registro");
        } else {
          const novoUsuario = new Usuario({
            nome: req.body.nome,
            email: req.body.email,
            senha: req.body.senha,
          });

          bcrytpt.genSalt(10, (err, salt) => {
            bcrytpt.hash(novoUsuario.senha, salt, (err, hash) => {
              if (err) {
                req.flash("error_msg", "Houve um erro durante o salvamento do usuário");
                res.redirect("/");
              } else {
                novoUsuario.senha = hash;
                novoUsuario
                  .save()
                  .then(() => {
                    req.flash("success_msg", "Usuario cadastrado com sucesso");
                    res.redirect("/");
                  })
                  .catch((err) => {
                    req.flash("error_msg", "Houve um erro ao criar o usuário");
                    res.redirect("/usuarios/registro");
                  });
              }
            });
          });
        }
      })
      .catch((err) => {
        req.flash("error_msg", "Houve um erro interno");
        res.redirect("/");
      });
  }
});

router.get("/login", (req, res) => {
  if (req.user) {
    req.flash("success_msg", "Você já está logado");
    res.redirect("/");
  } else {
    res.render("usuarios/login");
  }
});

router.post("/login", (req, res, next) => {
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/usuarios/login",
    failureFlash: true,
  })(req, res, next);
});

router.get("/logout", (req, res) => {
  req.logout();
  req.flash("success_msg", "Deslogado com sucesso");
  res.redirect("/");
});

function validarRegistro(value) {
  let errors = [];

  if (!value.nome || typeof value.nome == undefined || value.nome == null) {
    errors.push({ texto: "Nome inválido" });
  }
  if (!value.email || typeof value.email == undefined || value.email == null) {
    errors.push({ texto: "Email inválido" });
  }
  if (!value.senha || typeof value.senha == undefined || value.senha == null) {
    errors.push({ texto: "Senha inválida" });
  }
  if (!value.senha2 || typeof value.senha2 == undefined || value.senha2 == null || value.senha2 != value.senha) {
    errors.push({ texto: "As senhas não coincidem" });
  }
  if (value.senha.length < 4) {
    errors.push({ texto: "Senha muito curta" });
  }

  return errors;
}

module.exports = router;
