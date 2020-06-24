const bp = require("body-parser"), cors = require("cors"), 
 compression = require("compression");

 //json2xls = require('json2xls'),
module.exports = app =>{
  app.use(cors())
  app.use(bp.json());
  app.use(bp.urlencoded({extended:false}))
  app.use(compression())
}