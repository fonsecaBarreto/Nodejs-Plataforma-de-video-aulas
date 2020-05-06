const bp = require("body-parser"), cors = require("cors")
module.exports = app =>{
  app.use(cors())
  app.use(bp.json());
  app.use(bp.urlencoded({extended:false}))
}