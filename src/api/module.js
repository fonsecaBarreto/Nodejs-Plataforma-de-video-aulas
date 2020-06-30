const conn = require("../config/sqlConnection")
const {isNull,isString,BuildError,isObject} = require("../api/validation");
const querySelect = ["id","name","parentId","description","picture","notation",
"archived","restrict","path","video","access","views","votes","attachment"];

/*  */
async function archive(req,res,next){
  try{
    const {archived} = {...req.body}
    
    const id = req.params.id;
    const errors =[];
    if(archive == null || archive == undefined || (typeof archived != "boolean")) errors.push(new BuildError("Defina uma valor Válido Para 'Arquivado'","archived"))
    if(errors.length) throw [422,errors]
    var moduleExists = await conn("modules").where({id}).select('id');
    if(!moduleExists && !moduleExists.length) throw (404,"Módulo invalido");
    const module = await conn("modules").update({archived}).where({id}).returning(querySelect)
    return res.json(module)
  }catch(err){next(err)}
}
async function index(req,res,next){
  try{
    var modules = await conn("modules")
    .select(querySelect)
    .orderBy('notation', 'cresc')
    if(modules.length){
      modules = await Promise.all(modules.map(async c=>{
        c.subordinates = await getPath(c.id);return c;
      })) 
    }
    res.json(modules)
  }catch(err){next(err)}
}

async function indexModuleChilds(req,res,next){
  try{
    const {id,name,description} = await conn("modules").where({path:req.params.module}).select(["id","name","description"]).first();

    var modules = await conn("modules").where({parentId:id,archived:false})
    .select(["id","name","path","description","picture","notation"])
    .orderBy('notation', 'cresc');

    modules = await Promise.all(modules.map(async m =>{
      try{
        var exercisesCount = await conn("exercises").where({module:m.id}).count().first();
        m.exercisesAmount = Number(exercisesCount.count)
      }catch(err){next(err)}
      try{
        var exercises = await conn("exercises").where({module:m.id}).select(["id"]);
        var replied = 0
        var notRevised = 0;
        await Promise.all(exercises.map(async ee=>{
          await conn("exercisesreplies").where({exercise:ee.id})
          .then(resp=>{if(resp.length)replied+=1})
          
          await conn("exercisesreplies").where({exercise:ee.id,revised:false,closed:true})
          .then(resp=>{if(resp.length)notRevised+=1})
        }))
        m.exercisesReplied = replied
        m.exercisesNotRevised = notRevised
      }catch(err){next(err)}


      return m;
    }))
    res.json({name,description,children:[...modules]})
    //exercises conuyt
  }catch(err){next(err)}
}
async function indexModuleExercises(req,res,next){
  try{
    const admin = req.admin;
    const {id,name,description,video,picture,attachment} = await conn("modules").where({path:req.params.module}).select(["id","picture","name","description","video","attachment"]).first();
    const query =  (admin != undefined) ? {module:id} : {module:id,archived:false}
    const exercises = await conn("exercises").where({...query})
    .orderBy("notation","cresc")

    if(exercises && exercises.length){
      await Promise.all(exercises.map(async e=>{
        try{
          const reply = await conn("exercisesreplies").where({student:req.user.id,exercise:e.id}).first()
          if(reply) e.reply = reply
        
        }catch(err){}
      }))
    }
  
    res.json({name,description,video,picture,attachment,children:[...exercises]})
  }catch(err){next(err)}
}
async function indexPrime(req,res,next){
  try{
    const user = req.user;
    if(!user)throw 403;
    var modules = await conn("modules")
    .where({parentId:null,archived:false})
    .select(querySelect)
    .orderBy('notation', 'cresc')


    //filter
    modules = modules.filter(m=>{
      if(m.restrict == null) return m
      if(m.restrict != null && m.restrict.id == null) return m
      else if(m.restrict != null && m.restrict.id != null && m.restrict.id == user.id)return m;
    })
 
/* 
    */
    

    res.json(modules)
  }catch(err){next(err)}
}

async function indexById(req,res,next){
  try{
    const module = await conn("modules").where({id:req.params.id}).select(["id","name","parentId","description","picture"]).first();
    if(!module) throw [422, "Modulo Inexistente"];
    module.subordinates= await getPath(module.id);
    res.json(module)
  }catch(err){next(err)}
} 
/*  */
async function create(req,res,next){
  try{
    const {name,parentId,description,picture,notation,restrict,video,attachment} = {...req.body}
    const id = req.params.id
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
  
    if(errors.length) throw [422,errors]
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

      const modules = await conn('modules').insert({name,parentId,path,description,picture,notation,restrict,video,attachment}).returning(querySelect);
      return res.json(modules)
    }else{
      const modules = await conn("modules").update({name,parentId,path,description,picture,notation,restrict,video,attachment}).where({id}).returning(querySelect);
      return res.json(modules)
    }
    
  }catch(err){next(err)}
}
async function remove(req,res,next){
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
/*  */
const toTree = async(modules,tree)=>{
  if(!tree) tree = await modules.filter(c=>(!c.parentId));
  tree = await Promise.all(tree.map(async parent=>{
      parent.childrens = await toTree(modules,modules.filter(node=>node.parentId == parent.id))
      return parent;
  }) ) 
  return tree;
}
async function getJsonTree(req,res,next){
  try{
    const modules = await conn("modules")
    .select(querySelect)
    .orderBy('notation', 'cresc')
    var tree = await toTree(modules);
    res.json(tree); 
  }catch(err){next(err)}
}
/*  */
async function getName(id){
  try{
    const category = await conn("modules").where({id}).select(["name"]).first();
    if(!category || !category.name) return null;
    return category.name
  }catch(err){return null}
} 
/*  */
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
  path = await assemblePath(modules,id)
  return path
} 
module.exports = {index,create,remove,indexById,getJsonTree,getName,indexPrime,indexModuleChilds,indexModuleExercises,archive}