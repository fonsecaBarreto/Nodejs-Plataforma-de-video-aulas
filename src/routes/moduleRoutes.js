const Router = require("express").Router()
const moduleController = require("../api/module") 
const admin = require( "../api/admin");
const student = require("../api/student"); 
/* student */
Router.get("/indexModuleChilds/:module",student.validateToken,moduleController.indexModuleChilds)
Router.get("/prime",student.validateToken, moduleController.indexPrime)
Router.get("/exercises/:module",student.validateToken,moduleController.indexModuleExercises)

/* admin */

Router.get("/exercisesbyModule/:module",admin.validateToken,moduleController.indexModuleExercises)
Router.put("/archive/:id",admin.validateToken,moduleController.archive);

Router.route("/")
  .all(admin.validateToken) 
  .get(moduleController.index)
  .post(moduleController.create)
Router.route("/:id")
  .all(admin.validateToken)
  .get(moduleController.index)
  .put(moduleController.create)
  .delete(moduleController.remove)

module.exports = Router;