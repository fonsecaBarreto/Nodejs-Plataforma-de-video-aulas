const Router = require("express").Router()
const admin = require("../api/admin")
const {index,create,remove,genToken,validateToken,updatestudents,tester,
  updatePassword,indexTopPoints,updateSelf,subscription,payment}= require("../api/student");


Router.post("/pagamento",payment);

/* public */
Router.post("/tester",tester)
Router.post("/signin",genToken);
Router.post("/subscribe",subscription)
/* users*/
Router.post("/auth",validateToken,(req,res)=>{res.json(req.user)}) 
Router.put("/update",validateToken,updateSelf)
Router.put("/updatepassword",validateToken,updatePassword)

Router.put("/autoupdate",admin.validateToken,updatestudents) 
Router.get("/ranking",validateToken,indexTopPoints) 

/* private admins*/

Router.route("/")
  .get(admin.validateToken,index)
  .post(admin.validateToken,create)
Router.route("/:id")
  .put(admin.validateToken, create)
  .delete(admin.validateToken,remove)

/*  */
module.exports = Router;