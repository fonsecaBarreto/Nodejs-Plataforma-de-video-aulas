const Router = require("express").Router()
const {index,create,remove,indexById,indexByPath,indexByViews,indexByDate,indexEditorChoice,indexByCategory,vote,indexRecommended} = require("../api/post")
const editor = require("../api/editor")
const {validateToken} = require("../api/admin");


//blog --- >
Router.get("/path/:path",indexByPath) // post from path
Router.get("/recommended/:path",indexRecommended) // recommended posts by path(category)

Router.get("/category/:path",indexByCategory) // posts from chosen category
Router.get("/date",indexByDate)  // feed
Router.get("/views",indexByViews) // most popular
Router.get("/favorites",indexEditorChoice)


//Router.put("/vote/:path",vote)

//ge the ids
Router.route("/editor")
  .get(validateToken, editor.index)
  .put(validateToken, editor.create)

Router.route("/")
  .get(index)
  .post(validateToken, create)
Router.route("/:id")
  .get(indexById)
  .put(validateToken,create)
  .delete(validateToken,remove)

module.exports = Router;