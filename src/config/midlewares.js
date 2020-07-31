const bp = require("body-parser"), cors = require("cors"), 
 compression = require("compression"),morgan = require("morgan");

 //json2xls = require('json2xls'),
module.exports = app =>{
  if(app.get("NODE_ENV") == "development") app.use(morgan("tiny"))
  app.use(cors())
  app.use(bp.json());
  app.use(bp.urlencoded({extended:false,limit:"999999mb"}))
  app.use(compression())
}