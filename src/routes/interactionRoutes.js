const Router = require("express").Router();
const {create,index,fresh,remove,vote} = require("../api/interaction")
const {validateToken} = require("../api/student");
Router.put("/vote/:id",validateToken,vote)
Router.get("/fresh",fresh)
Router.route("/")
  .all(validateToken)
  .get(index)
  .post(create)
Router.route("/:id")
  .all(validateToken)
  .get(index)
  .delete(remove)

module.exports = Router