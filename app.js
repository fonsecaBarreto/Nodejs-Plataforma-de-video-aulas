require("dotenv").config()
const express = require("express");
const midlewares = require("./src/config/midlewares");
const routes = require("./src/routes/routes");
/*  */
const PORT = process.env.PORT || 9000;
const app = express();
app.use("/files",express.static(__dirname+"/temp/uploads"))
app.get("/",(req,res)=>{
  res.json({version:"v 1.3.0",status:"ok",msg:"Curiosity Killed The Cat"})
})
midlewares(app);
routes(app);
app.listen(PORT,()=>{
  console.log("WORKING FINE ON PORT: " + PORT)
  console.log(process.env.NODE_ENV)
})