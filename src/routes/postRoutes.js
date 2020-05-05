const Router = require("express").Router()
const {index,create,remove,indexById,indexByPath,indexByViews,vote} = require("../api/post")
const {validateToken} = require("../api/admin");

Router.get("/path/:path",indexByPath)
Router.get("/views",indexByViews)


Router.put("/vote/:path",vote)
/* Router.put("/view/:path",concatViews) */

Router.route("/")
  .get(index)
  .post(validateToken, create)
Router.route("/:id")
  .get(indexById)
  .put(validateToken,create)
  .delete(validateToken,remove)


module.exports = Router;