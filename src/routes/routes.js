const Admin = require("./adminRoutes"),
      User = require("./userRoutes"),
      Category = require("./categoryRoutes"),
      Post = require("./postRoutes"),
      Exercises = require("./exercisesRoutes"),
      EmailSignature = require("./EmailRoutes"),
      {image} = require("../api/Image");
const facebook = require("../api/facebook");

module.exports = app =>{
  app.post("/image",image)
  app.get("/oauth",facebook.facebookcallback)
  app.use("/admins",Admin)
  app.use("/users",User)
  app.use("/categories",Category)
  app.use("/posts",Post)
  app.use("/exercises",Exercises)
  app.use("/emailsignature",EmailSignature)
  app.use((req,res,next)=>next(404))
  app.use((error,req,res,next)=>{
    if(!isNaN(error))return res.sendStatus(error)
    if(typeof(error == Array)){
      if(typeof error[1] == 'object')  return res.status(error[0]).json({errors:error[1]})
      if(typeof error[1] == "string") return res.status(error[0]).json({errors:[{msg:error[1]}]})
    } 
    res.status(500).send(error) 
  })
}