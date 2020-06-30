const sharp = require("sharp");
const multer = require("multer")
const fs = require("fs");
const suFixs = ["lg","md","sm"];
const scale = .28;
async function resize(file,{w=720,h=.56}){
    const preName = `${file.originalname.split(".")[0]}_${Date.now()}`;
    const payload = {key:preName,buffers:{}};
    await Promise.all(suFixs.map(async (s,i)=>{
        let width = Math.floor(w*(1-scale*i));
        let height = Math.floor((width*h));

        let data = await sharp(file.buffer)
            .resize({width,height})
            .toFormat("webp")
            .webp({quality:80})
            .toBuffer()
        payload.buffers[s]=data;
    }));
    return payload;
}
function localStorage(buffer,name){
    return new Promise((resolve,reject)=>{
        fs.writeFile(`${name}`,buffer,"base64",function(err){
            if (err) reject()
            resolve()
        });  
    })    
}
const AWS = require("../config/aws.js")
const s3 = new AWS.S3()
const uploadToAws = (buffer,name)=>{

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
const upload = multer({storage:multer.memoryStorage()});

const image =async (req,res,next)=>{

    upload.single("image")(req,res,async (err)=>{
        try{
            if(err || req.file==undefined) return next([422, err]);
            const w= req.query.w || 1080, h = req.query.h || .75;
            const payload = await resize(req.file,{w,h});
            const dir = "temp/uploads/"
        
            await Promise.all(Object.keys(payload.buffers).map(async sfix=>{
                let buf = payload.buffers[sfix];
                let key = `${payload.key}-${sfix}.webp`

                if(process.env.NODE_ENV=="dev"){
                    await localStorage(buf,`${dir}${key}`)
                    .then(resp=>{payload[sfix]=`http://${req.headers.host}/files/${key}`})
                    .catch(err=> next([500,err]))
                }else{
                    await uploadToAws(buf,key)
                    .then(resp=>{payload[sfix]=resp})
                    .catch(err=>{next([500,err])})
                }
            })) 
            

            delete payload.buffers;
            res.json(payload)
        }catch(err){next(err)}
    })
}
module.exports = {resize,localStorage,uploadToAws,image};