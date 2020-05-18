const Router = require("express").Router()
const admin = require("../api/admin")

const {index,create,remove,genToken,validateToken} = require("../api/student");

Router.post("/auth",validateToken,(req,res)=>{res.json(req.user)}) 
Router.post("/signin",genToken);// generate token // validate 
/* private */
Router.route("/")
  .get(admin.validateToken,index)
  .post(admin.validateToken,create)
Router.route("/:id")
  .put(admin.validateToken, create)
  .delete(admin.validateToken,remove)
/*  */
module.exports = Router;