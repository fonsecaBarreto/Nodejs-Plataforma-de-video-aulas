const Router = require("express").Router()
/* const {} = require("../api/ingresso"); */


/*  make here routes to studente aget the exerciseses */
Router.post("/",(req,res,next)=>{
  console.log("post")
  res.json({...req.body})
})

module.exports = Router;