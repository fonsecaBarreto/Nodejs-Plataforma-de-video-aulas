const Admin = require("./adminRoutes"),
      Category = require("./categoryRoutes"),
      Post = require("./postRoutes"),
      Exercises = require("./exercisesRoutes"),
      EmailSignature = require("./EmailRoutes"),

      students_routes = require("./studentRoutes"),
      modules_router = require("./moduleRoutes"),
      exercises_router = require("./exercisesRoutes"),
      reply_router = require("./replyRoutes"),
      {image} = require("../api/Image"),
      {video} = require("../api/video"),
      ingresso_router = require("./ingressoRoutes"),
      interaction_router = require("./interactionRoutes");

const adminAPi = require("../api/admin");
const studentAPi = require("../api/student");
module.exports = app =>{
  /* app.post("/video", video)adminAPi.validateToken, */
  app.post("/image", image)
  app.post("/profilepic",studentAPi.validateToken,image)

  app.use("/interactions",interaction_router);
  app.use("/ingresso",ingresso_router)
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
    console.log(error)
    if(!isNaN(error)){return res.sendStatus(error);}
    if(Array.isArray(error)){
      if(typeof error[1] == 'object')  return res.status(error[0]).json({errors:error[1]})
      if(typeof error[1] == "string") return res.status(error[0]).json({errors:[{msg:error[1]}]})
      if(typeof error[1] == 'undefined') { return res.status(error[0]).json({errors:[{msg:'Server Error'}]})}
    } 
    res.status(500).send(error) 
  })
}