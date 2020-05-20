const Admin = require("./adminRoutes"),
      Category = require("./categoryRoutes"),
      Post = require("./postRoutes"),
      Exercises = require("./exercisesRoutes"),
      EmailSignature = require("./EmailRoutes"),

      students_routes = require("./studentRoutes"),
      modules_router = require("./moduleRoutes"),
      exercises_router = require("./exercisesRoutes"),
      reply_router = require("./replyRoutes"),
      {image} = require("../api/Image");
const adminAPi = require("../api/admin");
const studentAPi = require("../api/student");
module.exports = app =>{
  app.post("/image",adminAPi.validateToken, image)
  app.post("/profilepic",studentAPi.validateToken,image)

  app.use("/admins",Admin)
  app.use("/categories",Category)
  app.use("/posts",Post)
  app.use("/exercises",Exercises)
  app.use("/emailsignature",EmailSignature)

  app.use("/students",students_routes)
  app.use("/modules",modules_router)
  app.use("/exercises", exercises_router)
  app.use("/exercisesreplies", reply_router)
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