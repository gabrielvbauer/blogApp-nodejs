if (process.env.NODE_ENV == "production") {
  module.exports = {
    mongoURI: "mongodb+srv://gabrieladmin:88771797Aa@cluster0.ilmrz.mongodb.net/Cluste0?retryWrites=true&w=majority",
  };
} else {
  module.exports = { mongoURI: "mongodb://admin:password@localhost/blogapp?authSource=admin" };
}
