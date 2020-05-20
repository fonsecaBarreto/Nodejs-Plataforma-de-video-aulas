const Router = require("express").Router()
const {index,create,remove,indexById,closeCase,indexByStudent} = require("../api/exercisereply");
const {validateToken} = require( "../api/admin")
const student = require("../api/student")



Router.post("/send/:exercise",student.validateToken,create)

/* admins routess */
Router.get("/student/:student",validateToken,indexByStudent)
Router.post("/correct/:id",validateToken,closeCase)
Router.route("/")
  .get(validateToken,index)
Router.route("/:id")
  .get(validateToken,indexById)
  .delete(validateToken,remove)

module.exports = Router;