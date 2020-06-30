const Router = require("express").Router()
const admin = require("../api/admin")
const {index,create,remove,genToken,validateToken,
  updatePassword,indexRanking,updateSelf,subscription,payment}= require("../api/student");


Router.post("/pagamento",payment);

/* public */
Router.post("/signin",genToken);
Router.post("/subscribe",subscription)
/* users*/
Router.post("/auth",validateToken,(req,res)=>{res.json(req.user)}) 
Router.put("/update",validateToken,updateSelf)
Router.put("/updatepassword",validateToken,updatePassword)


Router.get("/ranking",validateToken,indexRanking) 

/* private admins*/
Router.route("/")
  .get(admin.validateToken,index)
  .post(admin.validateToken,create)
Router.route("/:id")
  .get(admin.validateToken,index)
  .put(admin.validateToken, create)
  .delete(admin.validateToken,remove)
/*  */
module.exports = Router;