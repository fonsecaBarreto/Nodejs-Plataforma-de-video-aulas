const express = require("express");
const midlewares = require("./src/config/midlewares");
const routes = require("./src/routes/routes");


class App {
  constructor(port, nodeEnv){
    this.PORT = port
    this.nodeEnv = nodeEnv
    this.express = express()
    this.midlewares = midlewares
    this.routes = routes
  }
  run(){
    this.midlewares(this.express)
    this.express.get("/",(_,res)=>{ res.json({version:"1.4",status:"ok"}) })
    this.routes(this.express)
    this.express.listen(this.PORT,() =>{
      console.log("Server running on port: " + this.PORT)
      console.log(this.nodeEnv)
    })
  }
  getApp(){ return this.express}
}

module.exports = { App }