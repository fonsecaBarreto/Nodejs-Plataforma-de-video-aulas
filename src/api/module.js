const conn = require("../config/sqlConnection")
const {isNull,isString,BuildError,isObject} = require("../api/validation");


/*  */
async function index(req,res,next){
  try{
    var modules = await conn("modules").select(["id","name","parentId","path","description","picture"]);
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
    var modules = await conn("modules").where({parentId:id}).select(["id","name","path","description","picture"]);
    res.json({name,description,children:[...modules]})
  }catch(err){next(err)}
}
async function indexModuleExercises(req,res,next){
  try{
    const {id,name,description} = await conn("modules").where({path:req.params.module}).select(["id","name","description"]).first();
    const exercises = await conn("exercises").where({module:id});
    if(exercises && exercises.length){
      await Promise.all(exercises.map(async e=>{
        try{
          const reply = await conn("exercisesreplies").where({student:req.user.id,exercise:e.id}).first()
          if(reply) e.reply = reply
        }catch(err){}
      }))
    }
    res.json({name,description,children:[...exercises]})
  }catch(err){next(err)}
}
async function indexPrime(req,res,next){
  try{
    var modules = await conn("modules").where({parentId:null}).select(["id","name","path","description","picture"]);
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
    const {name,parentId,description,picture} = {...req.body}
    const id = req.params.id
    const errors = [];
    if(!isNull(id) && isNaN(id)) errors.push(BuildError("Id invalido", "id"));
    if(!isNull(picture) && !isObject(picture)) errors.push(BuildError("Formato de imagem inapropriado", "id"));
    if(isNull(name) || !isString(name)) errors.push(BuildError("Nome iválido","name"));
    if(isNull(description) || !isString(description)) errors.push(BuildError("Descrição iválida","description"));
    if(!isNull(parentId) && isNaN(parentId)) errors.push(BuildError("Modulo parente invalido", "parentId"));
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
      
    console.log(name,description,path)
    if(id == undefined  || id == null){
      console.log(picture)
      const sameName = await conn("modules").where({name}); // if post check is anme already exists
      if(sameName.length) throw [422, "Modulo ja Registrada"];

      const modules = await conn('modules').insert({name,parentId,path,description,picture}).returning(["id",'name',"parentId","description","picture"]);
      return res.json(modules)
    }else{
      const modules = await conn("modules").update({name,parentId,path,description,picture}).where({id}).returning(["id","name","parentId","description","picture"]);
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
    const modules = await conn("modules").select(["id","name","parentId","description","picture"]);
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
module.exports = {index,create,remove,indexById,getJsonTree,getName,indexPrime,indexModuleChilds,indexModuleExercises}