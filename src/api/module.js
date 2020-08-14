"use strict";
const conn = require("../config/sqlConnection")
const {isNull,isString,BuildError,isObject} = require("../api/validation");
const QUERY_SELECT = ["id","name","parentId","description","picture","notation",
"archived","restrict","path","video","access","views","votes","attachment","videosource","audiogroup"];

class Module{
  constructor({id,name,parentId,description,picture,notation,archived,restrict,path,video,access,views,votes,attachment,videosource,audiogroup}){
    this.id=id;
    this.name =name;
    this.parentId=parentId;
    this.description=description;
    this.picture=picture;
    this.notation=notation;
    this.archived=archived;
    this.restrict=restrict;
    this.video= video;
    this.access=access;
    this.views = views;
    this.votes = votes;
    this.attachment=attachment;
    this.path=path;
    this.videosource = videosource;
    this.audiogroup = audiogroup
  }
  async getSubordinates(){this.subordinates = await getPath(this.id);}
  async archive(){
    console.log(this.id)
    const exists = await conn("modules").where({id:this.id}).select(['id',"archived"]).first();
    if(exists == undefined) throw "Módulo invalido";
    const module = await conn("modules").update({archived:!exists.archived}).where({id:this.id}).returning(QUERY_SELECT)
    return module
  }
  async exercisesCount(){
    var result = await conn("exercises").where({module:this.id}).count().first();
    return result && result.count ? Number(result.count) : 0
  }
  async exercisesRepliedCount(student){
    var replied = 0;
    var notRevised = 0;
    var exercises = await conn("exercises").where({module:this.id}).select(["id"]);
    if(exercises.length){
      await Promise.all(exercises.map(async ee=>{
        try{
          const val = await conn("exercisesreplies").where({exercise:ee.id,student});
          if(val.length) replied+=1;
        }catch(err){}

        try{
          const resp = await conn("exercisesreplies").where({exercise:ee.id,student,revised:false,closed:true})
          if(resp.length)notRevised+=1;
        }catch(err){}

      }));
    }
    return {replied,notRevised} ;
  }
  async childsModulesCount(){
    var result = await conn("modules").where({parentId:this.id}).count().first();
    return result && result.count ? Number(result.count) : 0
  }
}


async function validateBody({id,name,parentId,description,picture,notation,restrict,video,attachment,videosource,audiogroup}){
 
  const errors = [];
  if(!isNull(id) && isNaN(id)) errors.push(BuildError("Id invalido", "id"));
  if(!isNull(notation) && isNaN(notation)) errors.push(BuildError("Numeração invalida", "notation"));
  if(!isNull(picture) && !isObject(picture)) errors.push(BuildError("Formato de imagem inapropriado", "id"));
  if(isNull(name) || !isString(name)) errors.push(BuildError("Nome iválido","name"));
  if(isNull(description) || !isString(description)) errors.push(BuildError("Descrição iválida","description"));
  if(!isNull(parentId) && isNaN(parentId)) errors.push(BuildError("Modulo parente invalido", "parentId"));
  if(!isNull(restrict) && !isObject(restrict)) errors.push(BuildError("Formato de restrinção Incorreto", "restrict"));
  if(!isNull(video) && !isString(video)) errors.push(BuildError("Formato de video Incorreto", "video"));
  if(!isNull(attachment) && !isObject(attachment)) errors.push(BuildError("Erro ao Carregar Anexo", "attachment"));
  if(!isNull(audiogroup) && isNaN(audiogroup)) errors.push(BuildError("AudioGroup Invalido", "audiogroup"));

  if(!isNull(videosource)){
    if (!isObject(videosource)) return [...errors, BuildError("Video source incompleto","videosource")];
    if(!videosource.location || !Array.isArray(videosource.location) || videosource.location.length === 0) return [...errors, BuildError("Video source deve ser um arranjo","videosource")];

    const videosourceLocationParams= ["src","type","resolution"];

    for(const loc of videosource.location){
      for (const params of videosourceLocationParams){
        if(!loc[params]) return [...errors, BuildError("Parametros pendentes em video source","videosource")];
      }

    }
  }

  return errors
}
//finish creation and remove ....
class ModuleController{
  constructor(){}
  find = async ({id,path,parentId,archived},limit=999,offset=0,select=QUERY_SELECT)=>{ // get from db and instace Module Class
    var query = id ? {id} :{}
    query = path     !== undefined ? {...query,path}     : {...query}
    query = parentId !== undefined ? {...query,parentId} : {...query}
    query = archived !== undefined ? {...query,archived} : {...query}
    var modules = await conn("modules").where(query).select(select)
    .offset(offset)
    .limit(limit)
    .orderBy('notation', 'cresc');
    modules = await Promise.all(modules.map(async m=>{return new Module({...m});}))
    return modules
  }
  index= async (req,res)=>{
    try{
      var modules = await this.find({id:req.params.id});
      modules = await Promise.all(modules.map(async m=>{await m.getSubordinates();return m}))
      res.json(modules)
    }catch(err){return res.status(500).send(err)}
  }
  indexPrime = async(req,res) =>{
    try{
      var modules = await this.find({parentId:null,archived:false},999,0,
      ["id","name","description","picture","notation","restrict","path"]);
      modules = modules.filter(m=>{
       /*  m.picture =  m.picture && m.picture.lg ?{lg:m.picture.lg} :  null; */
        if(m.restrict == null) return m
        else if(m.restrict != null && m.restrict.id == null) return m
        else if(m.restrict != null && m.restrict.id != null && m.restrict.id == req.user.id)return m;
      }) 
      res.json(modules)

    }catch(err){return res.status(500).send(err)}
  }
  indexModuleChilds = async (req,res)=>{
    try{
      var module = (await this.find({path:req.params.module},999,0,["id","name","description"]))[0];
      var children = (await this.find({parentId:module.id,archived:false},999,0,["id","name","notation","archived","restrict","path"]));
      const {name,description} = {...module};
      await Promise.all(children.map(async m=>{
        m.exercisesAmount = await m.exercisesCount() // numero dos exercisios
        const {replied,notRevised} = await m.exercisesRepliedCount(req.user.id) // respondidos
        m.exercisesReplied = replied
        m.exercisesNotRevised = notRevised 
      }))
      res.json({name,description,children})
    }catch(err){res.status(500).send(err)}

  }
  indexModuleExercises = async (req,res) =>{
    try{
      const admin = req.admin;
      const {id,name,description,video,picture,attachment,videosource,notation,parentId} = await conn("modules")
      .where({path:req.params.module}).select(["id","picture","name","description","video","videosource","attachment","notation","parentId"]).first();
      
      const query =  (admin != undefined) ? {module:id} : {module:id,archived:false} // se nao for um admin nao encontrar os arquivados
      const exercises = await conn("exercises").where({...query})
      .orderBy("notation","cresc")
  
      if(exercises && exercises.length){
        await Promise.all(exercises.map(async e=>{
          try{
            //find replies for ir
            const reply = await conn("exercisesreplies").where({student:req.user.id,exercise:e.id}).first()
            if(reply) e.reply = reply
          
          }catch(err){}
        }))
      }
      var before = null, after= null
      console.log(notation)
      console.log(parentId)
      if(notation){
          before = await conn('modules').where({parentId,notation:notation-1}).select(["path"]).first()
          after =  await conn('modules').where({parentId,notation:notation+1}).select(["path"]).first()

      }
      res.json({id,name,description,video,picture,attachment,videosource,before,after,children:[...exercises]})

    }catch(err){res.status(500).send(err)}
  }
  archive = (req,res)=>{
     this.find({id:req.params.id})
    .then(async modules=>{
      var module = modules[0];
      module = await module.archive();
      res.json(module)
    }).catch(err=>res.status(500).send(err)) 
  }

  async create(req,res,next){
    try{
      console.log("creaing")
      const id = req.params.id
      const errors = await validateBody({...req.body,id})
      const {name,parentId,description,picture,notation,restrict,video,attachment,videosource, audiogroup} = req.body
      console.log(audiogroup)
      if(errors.length) throw [422,errors];

      if(parentId != undefined && parentId != null) { // if aprent Exists
        const parentExists = await conn("modules").where({id:parentId});
        if(!parentExists.length) throw [422, "Modulo Pai desconhecida"];
        if(!isNull(id) && id == parentId) throw [422, "Modulo não podem ser subordinadas a elas mesmas"];
        if(id !=null){ // means you are updating
          var subordinates = await getPath(id)
          if( subordinates.includes(parentId)) throw [422, "Modulo não podem ser Redigida a um Subordinado"];
        }  
      }
      const path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-')
        .replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
    
    
      if(id == undefined  || id == null){
     
        const sameName = await conn("modules").where({name}); // if post check is anme already exists
        if(sameName.length) throw [422, "Modulo ja Registrada"];
  
        const modules = await conn('modules').insert({name,parentId,path,description,picture,notation,restrict,video,attachment,videosource,audiogroup}).returning(QUERY_SELECT);
        return res.json(modules)
      }else{
        const modules = await conn("modules").update({name,parentId,path,description,picture,notation,restrict,video,attachment,videosource,audiogroup}).where({id}).returning(QUERY_SELECT);
        return res.json(modules)
      }
      
    }catch(err){next(err)}
  }
  async remove(req,res,next){
    try{
      const childs = await conn("modules").where({parentId:req.params.id});
      if(childs.length) throw [422,"Existem modules dependentes, apague-as primeiro"];
      const postChilds = await (conn("exercises")).where({module:req.params.id});
      if(postChilds.length) throw [422, "Existem Exercision dependentes, apague-os primeiro"];
      const rows = await conn("modules").del().where({id:req.params.id})
      if( !rows || rows == undefined || rows === null) throw 406;
      res.sendStatus(204)
    }catch(err){next(err)}
  } 

 
}

async function assemblePath(modules,id,path=[]){
  if(path.length == 0)path.push(id)
   await Promise.all(modules.map(async c=>{
    if(id == c.parentId){ // check if they have childs
      path.push(c.id);
      path = await assemblePath(modules,c.id,path)
    }
  }))
  return path
}
const getPath = async (id) =>{ //get the subodinates path
  var modules = await conn("modules");
  var path = await assemblePath(modules,id)
  return path
} 
module.exports = new ModuleController();
