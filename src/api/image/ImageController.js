'use restrict'

const multer = require("multer")
const {UploadImage, DeleteImage, GetImage} = require("./UploadImage")
 
const upload = multer({storage:multer.memoryStorage()});
const sharp = require("sharp");

const SU_FIX = ["lg","md","sm"];
const SCALE = .3;
const DIR = 'temp/uploads/'

class ProcessImage {
   static async resize(file,{w=720,h=.56}){

    const preName = `icm-${file.originalname.split(".")[0]}_${Date.now()}`;
    const payload = {key:preName,buffers:{}};
    await Promise.all(SU_FIX.map(async (s,i)=>{
        let width = Math.floor(w*(1-SCALE*i));
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
}
class ImageController {
 
  async get (req,res){
    GetImage.handle("mathewslins-website-uploads")
    .then(data=>res.json(data))
    .catch(_=>res.status(500).send("algo errado"))
  }
  async delete(req,res){
    console.log("trying to delete")
    DeleteImage.handle("mathewslins-website-uploads",req.params.key)
    .then(_=>res.json("deletado com sucesso"))
    .catch(_=>res.status(500).send("algo errado"))
  }
  async post(req,res){
   
    upload.single("image")(req,res,async (err)=>{
      try{
        if(err) return res.status(500).send(err)
        if(req.file === undefined) return res.status(400).send("bad request");
        const w= req.query.w || 1080, h = req.query.h || .75, f = req.query.f || '';
        const payload = await ProcessImage.resize(req.file,{w,h});

        await Promise.all(Object.keys(payload.buffers).map(async sfix=>{
            let buf = payload.buffers[sfix];
            let key = `images/${f}${payload.key}/${sfix}.webp`
            await UploadImage.handle(buf,key)
            .then(resp=>{payload[sfix]=resp})
            .catch(err=>{next([500,err])})
            
        }))  
          
        delete payload.buffers;
        res.json(payload)
      }catch(err){res.status(500).send(err)}
    })
  }
}


module.exports = new ImageController()



/* if(process.env.NODE_ENV=="dev"){
  await localStorage(buf,`${dir}${key}`)
  .then(resp=>{payload[sfix]=`http://${req.headers.host}/files/${key}`})
  .catch(err=> next([500,err])) */