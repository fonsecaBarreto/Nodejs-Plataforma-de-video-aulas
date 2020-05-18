const Router = require("express").Router()
const {index,create,remove,indexById,indexByModule} = require("../api/exercises");
const {validateToken} = require( "../api/admin")
const student  = require("../api/student")

/*  make here routes to studente aget the exerciseses */
Router.route("/all",student.validateToken,index)
Router.route("/bymodule/:",student.validateToken,indexByModule)


/*  admins  */
Router.route("/")
  .get(validateToken,index)
  .post(validateToken, create)
Router.route("/:id")
  .get(validateToken, indexById)
  .put(validateToken, create)
  .delete(validateToken,remove)
module.exports = Router;