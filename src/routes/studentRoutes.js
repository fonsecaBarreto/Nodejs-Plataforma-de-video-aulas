const Router = require("express").Router()
const admin = require("../api/admin")
const {index,create,remove,genToken,validateToken,generatestudents,
  updatePassword,indexTopPoints,updateSelf}
   = require("../api/student");
/* public */
Router.post("/signin",genToken);
/* users*/
Router.post("/auth",validateToken,(req,res)=>{res.json(req.user)}) 
Router.put("/update",validateToken,updateSelf)
Router.put("/updatepassword",validateToken,updatePassword)

/* Router.post("/autocreate",generatestudents) */
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