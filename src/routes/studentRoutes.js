const Router = require("express").Router()
const admin = require("../api/admin")
const {index,create,remove,genToken,validateToken,
  updatePassword,indexRanking,updateSelf}= require("../api/student");
const {payment} = require("../api/subscription")
//asass webhook
Router.post("/pagamento",payment);

/* public */
Router.post("/signin",genToken);

/* users*/
Router.post("/auth",validateToken,(req,res)=>{res.json(req.user)}) 
Router.put("/update",validateToken,updateSelf)
Router.put("/updatepassword",validateToken,updatePassword)


Router.get("/ranking",validateToken,indexRanking) 

/* private admins*/
Router.route("/")
  .get(admin.validateToken,index)
  .post(create)
Router.route("/:id")
  .all(admin.validateToken)
  .get(index)
  .put(create)
  .delete(remove)
/*  */
module.exports = Router;