
const fs = require("fs");

/* function localStorage(buffer,name){
    return new Promise((resolve,reject)=>{
        fs.writeFile(`${name}`,buffer,"base64",function(err){
            if (err) reject()
            resolve()
        });  
    })    
}
 */
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
                let key = `images/${payload.key}/${sfix}.webp`
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