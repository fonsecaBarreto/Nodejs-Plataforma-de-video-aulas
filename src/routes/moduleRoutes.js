const Router = require("express").Router()
const {index,create,remove,getJsonTree,indexById,indexPrime,indexModuleChilds,indexModuleExercises,archive} = require("../api/module");
const {validateToken} = require( "../api/admin");
const student = require("../api/student");




Router.get("/prime",student.validateToken, indexPrime)
Router.get("/indexModuleChilds/:module",student.validateToken, indexModuleChilds)
Router.get("/exercises/:module",student.validateToken,indexModuleExercises)





Router.get("/exercisesbyModule/:module",validateToken,indexModuleExercises)
Router.put("/archive/:id",validateToken,archive)



Router.get("/jsontree",validateToken, getJsonTree);
Router.route("/")
  .get(index,validateToken)
  .post(validateToken,create)
Router.route("/:id")
  .get(indexById,validateToken)
  .put(validateToken,create)
  .delete(validateToken,remove)
module.exports = Router;