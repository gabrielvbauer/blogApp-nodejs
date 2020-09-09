const express = require("express");
const app = express();
const handlebars = require("express-handlebars");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const admin = require("./routes/admin");
const usuarios = require("./routes/usuario");
const path = require("path");
const session = require("express-session");
const flash = require("connect-flash");
const passport = require("passport");
const eAdmin = require("./helpers/eAdmin");
require("./models/Categoria");
require("./models/Postagem");
const Categoria = mongoose.model("categorias");
const Postagem = mongoose.model("postagens");
require("./config/auth")(passport);

const db = require("./config/db");

//Configurações
//--Sessao
app.use(
  session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

//--Middleware
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg");
  res.locals.error_msg = req.flash("error_msg");
  res.locals.error = req.flash("error");
  res.locals.user = req.user || null;
  res.locals.eAdmin = eAdmin || null;
  next();
});

//--BodyParser
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(bodyParser.json());

const urlencodedParse = bodyParser.urlencoded({ extended: false });

//--HandleBars
app.engine(
  "handlebars",
  handlebars({
    defaultLayout: "main",
  })
);
app.set("view engine", "handlebars");

//--Mongoose
mongoose.Promise = global.Promise;
mongoose
  .connect(db.mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Successfully connected to MongoDB"))
  .catch((err) => console.log(`An error has occurred: ${err}`));

//Public
app.use(express.static(path.join(__dirname, "/public")));

app.use((req, res, next) => {
  next();
});

//Rotas
app.get("/", (req, res) => {
  Categoria.find()
    .sort({ date: "DESC" })
    .then((categorias) => {
      Postagem.find()
        .sort({ data: "DESC" })
        .then((postagens) => {
          res.render("user/index", {
            categorias: categorias.map((categoria) => categoria.toJSON()),
            postagens: postagens.map((postagem) => postagem.toJSON()),
          });
        });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao listar as categorias");
    });
});

app.get("/postagem/:slug", (req, res) => {
  Postagem.findOne({ slug: req.params.slug })
    .populate("categoria")
    .lean()
    .then((postagem) => {
      if (postagem) {
        const post = {
          titulo: postagem.titulo,
          data: postagem.data,
          categoria: postagem.categoria,
          conteudo: postagem.conteudo,
        };
        res.render("postagem/index", post);
      } else {
        req.flash("error_msg", "Esta postagem não existe");
        res.redirect("/");
      }
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro interno");
      res.redirect("/");
    });
});

app.get("/categorias", (req, res) => {
  Categoria.find()
    .populate("categoria")
    .lean()
    .then((categorias) => {
      res.render("categorias/index", {
        categorias: categorias,
      });
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro ao listar as categorias");
      res.redirect("/");
    });
});

app.get("/categorias/:slug", (req, res) => {
  Categoria.findOne({ slug: req.params.slug })
    .populate("categoria")
    .lean()
    .then((categoria) => {
      if (categoria) {
        Postagem.find({ categoria: categoria._id })
          .lean()
          .then((postagens) => {
            res.render("categorias/postagens", { postagens: postagens, categoria: categoria });
          })
          .catch((err) => {
            req.flash("error_msg", "Houve um erro ao listar os posts");
            res.redirect("/");
          });
      } else {
        req.flash("error_msg", "Essa categoria não existe");
        res.redirect("/");
      }
    })
    .catch((err) => {
      req.flash("error_msg", "Houve um erro interno");
      res.redirect("/");
    });
});

app.use("/admin", urlencodedParse, admin);
app.use("/usuarios", urlencodedParse, usuarios);

//Outros
const PORT = process.env.PORT || 8082;
app.listen(PORT, () => console.log(`Server running on PORT: ${PORT}`));
