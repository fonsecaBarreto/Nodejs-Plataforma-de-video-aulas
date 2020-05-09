const Router = require("express").Router();
const {index,indexByEmail,create,remove,genToken,validateToken} = require("../api/admin")

if(process.env.NODE_ENV == "dev"){
  Router.post("/signup", create) 
}
Router.get("/email/:email",indexByEmail)
Router.post("/signin",genToken)
Router.post("/auth",validateToken,(req,res)=>{ res.json(req.admin)})
Router.route("/")
  .get(validateToken,index)
  .post(validateToken,create)
Router.route("/:id")
  .put(validateToken,create)
  .delete(validateToken, remove)
module.exports = Router;