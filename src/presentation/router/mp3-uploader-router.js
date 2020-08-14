//valdiate if admin, dont forget
const UploadMp3 = require('../controller/mp3-uploader/upload-mp3')
const uploadMp3 = new UploadMp3()
const { validateToken } = require("../../api/admin")
module.exports = app =>{
  app.post('/uploadmp3/:f?',validateToken,async (req,res)=>{
    const {statusCode, body} = await uploadMp3.handle(req,res)
    res.status(statusCode).json(body)
  })
}