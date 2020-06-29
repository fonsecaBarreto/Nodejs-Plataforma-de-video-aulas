const Router = require("express").Router();
const {create,index,remove,vote} = require("../api/interaction")
const {validateToken} = require("../api/student");
Router.put("/vote/:id",validateToken,vote)
Router.route("/")
  .get(validateToken,index)
  .post(validateToken,create)
Router.route("/:id")
  .get(validateToken,index)
  .delete(validateToken,remove)

module.exports = Router