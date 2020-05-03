const Router = require("express").Router()
const {index,create,remove,indexById,indexByPath,concatViews,vote} = require("../api/post")
const {image} = require("../api/Image");
const {validateToken} = require("../api/admin");
Router.post("/image",validateToken,image)

Router.get("/path/:path",indexByPath)
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