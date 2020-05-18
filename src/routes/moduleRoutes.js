const Router = require("express").Router()
const {index,create,remove,getJsonTree,indexById} = require("../api/module");
const {validateToken} = require( "../api/admin");
const student = require("../api/student");

Router.get("/jsontree",validateToken, getJsonTree);
Router.route("/")
  .get(index)
  .post(validateToken,create)
Router.route("/:id")
  .get( indexById)
  .put(validateToken,create)
  .delete(validateToken,remove)
module.exports = Router;