const Validator = require("fastest-validator");
const conn = require("../config/sqlConnection");
const v = new Validator(
  { messages:{required:"'{field}' deve conter um valor válido "}}
);
const schema = {
  content:  {type:"string"},
  student:  {type:"number"},
  module:   {type:"number", convert:true, optional:true},
  parentId: {type:"number", convert:true, optional:true},
};

const check = v.compile(schema);
const queryArray = ["id","content","parentId","module","student","votes","views","path","created_at"]
function save(data){
  return new Promise(async(resolve,reject)=>{
    var errors =  check(data) ;if(errors === true) errors =[];
    if(errors.length) reject({status:422,errors})
    var {content,student,module,parentId} = {...data};
    if(module != null){ // verify module
      try{
        const moduleExists = await conn("modules").select(["id","name"]).where({id:module})
        if(!moduleExists.length) reject({status:400,errors:{field:"module",message:"Módulo não existe"}})
      }catch(err){reject({status:500,errors:err})} 
    }
    if(parentId != null){ //verify parentId
      try{
         const parentExists = await conn("interactions").select(["id"]).where({id:parentId})
         if(!parentExists.length) reject ({status:400,errors:{field:"parentId",message:"publicação não existe"}})
       }catch(err){reject({status:500,errors:err})}
     } 
     /* insert */
      try{
        const path = Date.now()+"_"+student+(parentId != null? parentId: "")+"-"+(module!=null?module:"00");
        data = await conn("interactions").insert({content,student,module,parentId,path,votesregisters:{votes:[]}}).returning(queryArray);
        
        try{
          const st = await conn('students').select(["name","email"]).where({id:data[0].student}).first()
          data[0].student=st
        }catch(err) {}
      
        resolve(data)
      }catch(err){reject({status:500,errors:err})}
  })
}
function find(offset=0,limit=99,student = null,module=null,path=null,sort="created_at"){
   return new Promise(async(resolve,reject)=>{
      var query = {}
      query = student == null ? {...query} : {...query,student};
      query = module == null ? {...query,module:null} : {...query,module};
      query = path == null ? {...query,parentId:null} : {...query,path}
      console.log(query)
      try{
        var data = await conn("interactions").select(queryArray)
        .where(query).orderBy(sort, 'desc').offset(offset).limit(limit)
        


        data = await Promise.all(data.map(async inte=>{ //capture responses
          const {id,student,views} = {...inte};
          try{ // catch the student
            const st = await conn('students').select(["name","email"]).where({id:student}).first()
            const {count} = await conn("interactions").where({parentId:id}).count().first();
          
            inte.childs =count || 0;
            inte.student=st
          }catch(err) {}


          if(path != null){
            try{ await conn("interactions").update({views:views+1}).where({path})}catch(err){}


            var childs = []
            try{
              childs = await conn("interactions").select(queryArray)
              .where({parentId:id})
              .orderBy("created_at", 'desc')

              childs = await Promise.all(childs.map(async c=>{
                try{ // catch the student
                  const st = await conn('students').select(["name","email"]).where({id:c.student}).first()
                  c.student=st
                }catch(err) {}
                return c
              }))
              
              inte.childs = childs;
            }catch(err){}
          }
          
          return inte;
          })
        )
       
        resolve(data)
      }catch(err){reject({status:500,errors:err})} 
  }) 
}
async function fresh(req,res,next){
   try{
    var data = await find(0,99,null);
    return res.json(data)
  }catch(err){return res.status(err.status).send(err.errors)} 
}
async function index(req,res,next){
  const student = req.query.s, module= req.query.m,offset = req.query.o,limit = req.query.l
  const id = req.params.id
   try{
    var data = await find(offset,limit,student,module,id);
    return res.json(data)
  }catch(err){return res.status(err.status).send(err.errors)} 
}

async function create(req,res,next){
  const student = req.user.id || null;
  try{
    var data = await save({...req.body,student})
    res.json(data)
  } catch(err){return res.status(err.status).send(err.errors)}
}
async function remove(req,res,next){
  const id = req.params.id
  try{
    const interaction = await conn('interactions').where({id}).select(["student"]).first()
    if(!interaction) return res.status(422).send("interação Inexistente");
    if(interaction.student != req.user.id) return res.status(401).send("Acão Negada")
    try{
      const childs = await conn("interactions").where({parentId:id}).del()
    }catch(err){return res.status(500).send(err)}
    try{
      const rows =await conn("interactions").where({id}).del()
      if(rows == undefined || rows == null || rows === 0 ) return res.sendStatus(406);
      return res.sendStatus(204)
    }catch(err){res.status(500).send(err)}
  }catch(err){res.status(500).send(err)}
}
async function vote(req,res,next){
  const id = req.params.id
  try{
    var interaction = await conn("interactions").select(["votes","votesregisters"]).where({id});
    if(!interaction.length) return res.status(422).send("modulo inexistente")
    var {votes,votesregisters} = {...interaction[0]};
    const up = await new Promise(async (res)=>{
      await Promise.all(votesregisters.votes.map(async reg=>{
        if(reg.student == req.user.id)res(false);
      }))
      res(true)
    })
  
    var votes = up ? votes+1 : votes-1;
    if(up === true){
       votesregisters.votes = [...votesregisters.votes,{date:Date.now(),student:req.user.id}];
    } else{
      votesregisters.votes =  votesregisters.votes.filter(reg=>{
        reg.student != req.user.id
      })
    }
   
  
    try{
      interaction = await conn("interactions").where({id}).update({votes,votesregisters}).returning([...queryArray,"votesregisters"])
      
      try{ 
        const st = await conn('students').select(["name","email"]).where({id:interaction[0].student}).first()
        interaction[0].student=st
      }catch(err) {}
      res.json(interaction)
    }catch(err){return res.status(500).send(err)}   



  }catch(err){return res.status(500).send(err)}
   
}
module.exports={create,index,fresh,remove,vote}