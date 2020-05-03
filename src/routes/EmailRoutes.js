const Router = require("express").Router()
const {index,create,remove,indexById} = require("../api/emailSignature");
const {validateToken} = require( "../api/admin")
Router.route("/")
  .get(validateToken,index)
  .post(create)
Router.route("/:id")
  .get(validateToken,indexById)
  .delete(validateToken,remove)
module.exports = Router;