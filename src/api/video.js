const multer = require("multer")

const AWS = require("../config/aws.js")
const s3 = new AWS.S3()
const uploadToAws = (buffer,name)=>{
    return new Promise(async (resolve,reject)=>{
        await s3.upload({
            Bucket:process.env.AWS_BUCKET,
            Body:buffer,
            ContentType: 'video/mp4',
            Key:name,
            ACL:"public-read"
        }).promise()
          .then(response=>{resolve(response.Location)})
          .catch(err=>{reject()}) 
    })
}

  
const upload = multer({storage:multer.memoryStorage(),limits: { fileSize: 99999999 }});
async function video( req, res, next){
  console.log("video")
  upload.single("video")(req,res,async (err)=>{
    try{
        if(err || req.file==undefined) throw [422, err];
        console.log(req.file)
        await uploadToAws(req.file.buffer,req.file.originalname)
        .then(resp=>{res.json(resp) })
        .catch(err=>{next([500,err])})  

    }catch(err){next(err)}
  })
} 

module.exports = {video};