
const AWS = require("../../config/aws.js")
const s3 = new AWS.S3()
class UploadImage{
  static handle(buffer,name){
    return new Promise(async (resolve,reject)=>{
      await s3.upload({
          Bucket:process.env.AWS_BUCKET,
          Body:buffer,
          ContentType: 'image/webp',
          Key:name,
          ACL:"public-read"
      }).promise()
        .then(response=>{resolve(response.Location)})
        .catch(err=>{reject()}) 
  })
  }
}
class DeleteImage{
  static handle(Bucket,Key){
    return new Promise(async (resolve,reject)=>{
      s3.deleteObject({Bucket,Key}, function(err, data) {
        if (err)  return reject(err);
        else  return resolve()
      });
   })
  }
}
class GetImage{
  static handle(Bucket,Key){
    return new Promise(async (resolve,reject)=>{
      s3.getObject({Bucket}, function(err, data) {
        if (err)  return reject(err);
        else  return resolve(data)
      });
   })
  }
}


module.exports = {UploadImage,DeleteImage, GetImage}