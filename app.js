require("dotenv").config()
const express = require("express");
const midlewares = require("./src/config/midlewares");
const routes = require("./src/routes/routes");
/*  */
const PORT = process.env.PORT || 9000;
const app = express();
app.use("/files",express.static(__dirname+"/temp/uploads"))
midlewares(app);
routes(app);
app.listen(PORT,()=>console.log("WORKING FINE ON" + PORT))