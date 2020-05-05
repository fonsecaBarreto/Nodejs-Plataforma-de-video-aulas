const bp = require("body-parser"), cors = require("cors")
module.exports = app =>{
  app.use(cors())
  app.use(bp.json());
  app.use(bp.urlencoded({extended:false}))
  if(process.env.NODE_ENV != "dev"){
    console.log("running https")
    app.use(require('force-https'))
  }
}