const Router = require("express").Router()
const {index,create,remove,indexById,find} = require("../api/emailSignature");
const {validateToken} = require( "../api/admin")
const {broadAssignController,experimentalRequest,captivatedRequest} = require("../api/mail_api")

Router.post("/subscribe",broadAssignController);


Router.post("/subscribeteste",captivatedRequest);



/* odd */
Router.get("/download",async (req,res,next)=>{
  const emails = await find();
  res.xls('emails.xlsx', emails);
})
Router.route("/")
  .get(validateToken,index)
  .post(create)
Router.route("/:id")
  .get(validateToken,indexById)
  .delete(validateToken,remove)
module.exports = Router;