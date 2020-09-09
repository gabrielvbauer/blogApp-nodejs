const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
require("../models/Categoria");
const Categoria = mongoose.model("categorias");
require("../models/Postagem");
const Postagem = mongoose.model("postagens");
const { eAdmin } = require("../helpers/eAdmin");

router.get("/", eAdmin, (req, res) => {
  res.render("admin/index");
});

router.get("/posts", eAdmin, (req, res) => {
  res.render("admin/posts");
});

router.get("/categorias", eAdmin, (req, res) => {
  Categoria.find()
    .sort({ date: "DESC" })
    .then((categorias) => {
      res.render("admin/categorias", {
        categorias: categorias.map((categoria) => categoria.toJSON()),
      });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao listar as categorias");
      res.redirect("/admin");
    });
});

router.get("/categorias/adicionar-categoria", eAdmin, (req, res) => {
  res.render("admin/adicionarCategoria");
});

router.post("/categorias/nova", eAdmin, (req, res) => {
  let errors = validarFormulario(req.body);

  if (errors.length > 0) {
    res.render("admin/adicionarCategoria", { errors: errors });
  } else {
    const novaCategoria = {
      nome: req.body.nome,
      slug: req.body.slug,
    };

    new Categoria(novaCategoria)
      .save()
      .then(() => {
        req.flash("success_msg", `Categoria ${req.body.nome} criada com sucesso`);
        res.redirect("/admin/categorias");
      })
      .catch((err) => {
        req.flash("success_msg", `Houve um erro ao criar a categoria ${req.body.nome}: ${err}`);
        res.redirect("/admin/categorias");
      });
  }
});

router.get("/categorias/edit/:id", eAdmin, (req, res) => {
  Categoria.findOne({ _id: req.params.id })
    .lean()
    .then((categoria) => {
      res.render("admin/editCategorias", { categoria: categoria });
    })
    .catch((err) => {
      req.flash("error_msg", "Essa categoria não existe.");
      res.redirect("/admin/categorias");
    });
});

router.post("/categorias/edit", eAdmin, (req, res) => {
  Categoria.findOne({ _id: req.body.id })
    .then((categoria) => {
      let errors = validarFormulario(req.body);
      if (errors.length > 0) {
        res.render("/admin/editCategorias", { errors: errors });
      } else {
        categoria.nome = req.body.nome;
        categoria.slug = req.body.slug;

        categoria
          .save()
          .then(() => {
            req.flash("success_msg", "Categoria atualizada com sucesso.");
            res.redirect("/admin/categorias");
          })
          .catch((err) => {
            req.flash("error_msg", "Houve um erro ao salvar a edição da categoria.");
            res.redirect("/admin/categorias");
          });
      }
    })

    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao editar a categoria.");
      res.redirect("/admin/categorias");
    });
});

router.post("/categorias/deletar", eAdmin, (req, res) => {
  Categoria.remove({ _id: req.body.id })
    .then(() => {
      req.flash("success_msg", "Categoria deletada.");
      res.redirect("/admin/categorias");
    })
    .catch((err) => {
      req.flash("error_msg", "Não foi possível deletar a categoria.");
      res.redirect("/admin/categorias");
    });
});

router.get("/postagens", eAdmin, (req, res) => {
  Postagem.find()
    .populate("categoria")
    .sort({ data: "Desc" })
    .then((postagens) => {
      res.render("admin/postagens", {
        postagens: postagens.map((postagem) => postagem.toJSON()),
      });
    })
    .catch((err) => {
      req.flash("error_msg", `Houve um erro ao listar as postagens`);
      res.redirect("/admin");
    });
});

router.get("/postagens/adicionar-postagem", eAdmin, (req, res) => {
  Categoria.find()
    .lean()
    .then((categorias) => {
      res.render("admin/adicionarPostagem", { categorias: categorias });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao carregar o formulário");
      res.redirect("/admin");
    });
});

router.post("/postagens/nova", eAdmin, (req, res) => {
  let errors = validarFormularioPostagem(req.body);
  if (errors.length > 0) {
    res.render("admin/adicionarPostagem", { errors: errors });
  } else {
    const novaPostagem = {
      titulo: req.body.titulo,
      slug: req.body.slug,
      descricao: req.body.descricao,
      conteudo: req.body.conteudo,
      categoria: req.body.categoria,
    };

    new Postagem(novaPostagem)
      .save()
      .then(() => {
        req.flash("success_msg", "Postagem criada com sucesso");
        res.redirect("/admin/postagens");
      })
      .catch((err) => {
        req.flash("error_msg", `Houve um erro na criação da postagem: ${err}`);
        res.redirect("/admin/postagens");
      });
  }
});

router.get("/postagens/edit/:id", eAdmin, (req, res) => {
  Postagem.findOne({ _id: req.params.id })
    .lean()
    .populate("categoria")
    .then((postagem) => {
      Categoria.find()
        .lean()
        .then((categorias) => {
          res.render("admin/editPostagem", { categorias: categorias, postagem: postagem });
        })
        .catch((err) => {
          req.flash("error_msg", "Houve um erro ao listar as categorias");
          res.redirect("/admin/postagens");
        });
    })
    .catch((err) => {
      req.flash("error_msg", "Essa postagem não existe.");
      res.redirect("/admin/postagens");
    });
});

router.post("/postagem/edit", eAdmin, (req, res) => {
  Postagem.findOne({ _id: req.body.id }).then((postagem) => {
    let errors = validarFormularioPostagem(req.body);
    if (errors.length > 0) {
      res.render("admin/editPostagem", { errors: errors });
    } else {
      (postagem.titulo = req.body.titulo),
        (postagem.slug = req.body.slug),
        (postagem.descricao = req.body.descricao),
        (postagem.conteudo = req.body.conteudo),
        (postagem.categoria = req.body.categoria),
        (postagem.data = Date.now());

      postagem
        .save()
        .then(() => {
          req.flash("success_msg", "Postagem atualizada com sucesso.");
          res.redirect("/admin/postagens");
        })
        .catch((err) => {
          console.log(err);
          req.flash("error_msg", "Houve um erro ao atualizar a postagem");
          res.redirect("/admin/postagens");
        });
    }
  });
});

router.post("/postagens/deletar", eAdmin, (req, res) => {
  Postagem.remove({ _id: req.body.id })
    .then(() => {
      req.flash("success_msg", "Postagem deletada.");
      res.redirect("/admin/postagens");
    })
    .catch((err) => {
      req.flash("error_msg", "Não foi possível deletar a postagem.");
      res.redirect("/admin/postagens");
    });
});

//
//
//
//
//
//

//
//------VALIDAÇÃO DOS FORMULÁRIOS-------
//

function validarFormulario(value) {
  let errors = [];

  if (!value.nome || typeof value.nome == undefined || value.nome == null) {
    errors.push({ texto: "Nome inválido" });
  }

  if (!value.slug || typeof value.slug == undefined || value.slug == null) {
    errors.push({ texto: "Slug inválido" });
  }

  return errors;
}

function validarFormularioPostagem(value) {
  let errors = [];

  if (!value.titulo || typeof value.titulo == undefined || value.titulo == null) {
    errors.push({ texto: "Título inválido" });
  }

  if (!value.slug || typeof value.slug == undefined || value.slug == null) {
    errors.push({ texto: "Slug inválido" });
  }

  if (!value.descricao || typeof value.descricao == undefined || value.descricao == null) {
    errors.push({ texto: "Descrição inválida" });
  }

  if (!value.conteudo || typeof value.conteudo == undefined || value.conteudo == null) {
    errors.push({ texto: "conteudo inválido" });
  }

  if (value.categoria == 0) {
    errors.push({ texto: "Categoria inválida" });
  }

  return errors;
}

module.exports = router;
