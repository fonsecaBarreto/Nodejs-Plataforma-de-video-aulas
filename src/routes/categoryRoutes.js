const Router = require("express").Router()
const {index,create,remove,indexById,getJsonTree} = require("../api/category");
const {validateToken} = require( "../api/admin")
Router.get("/jsontree",getJsonTree);
Router.route("/")
  .get(index)
  .post(validateToken,create)
Router.route("/:id")
  .get(indexById)
  .put(validateToken,create)
  .delete(validateToken,remove)
module.exports = Router;