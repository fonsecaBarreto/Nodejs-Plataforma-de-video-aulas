const { ServerError, BadRequest, Success } = require('../../../helper/http-helper')
var aws = require('aws-sdk')
const multer = require('multer');
const { invalidParam, missingParam } = require('../../../helper/Errors');
 var s3 = new aws.S3({
  accessKeyId:process.env.AWS_ACCESS_KEY,
  secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
  region:process.env.AWS_REGION
})

function fileFilter (req, file, cb) {
  if(file.mimetype !== 'audio/mpeg'){
    return cb(invalidParam('mp3','Somente Arquivos .mp3'), false);
 }
 cb(null, true);
} 
const upload = multer({storage:multer.memoryStorage(),fileFilter});

class UploadMp3 {
  handle(req,res){
    const f = req.params.f
    return new Promise((resolve,reject)=>{
      upload.single("mp3")(req,res,async (err)=>{
        if(err) resolve(BadRequest(err))
        if(!req.file) resolve(BadRequest(missingParam('mp3')))
        try {
          const response = await s3.upload({
            Bucket:process.env.AWS_BUCKET,
            Body:req.file.buffer,  ContentType: 'audio/mpeg',
            Key:`mp3/${f?f+'/':''}${req.file.originalname}`,
            ACL:"public-read"
          }).promise()
          resolve(Success.content(response.Location))

        } catch(err) { 
          resolve(ServerError.unexpected()) }
      })
    })
    
  }
}
module.exports = UploadMp3