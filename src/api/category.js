const conn = require("../config/sqlConnection")
const {isNull,isString,BuildError} = require("../api/validation");

async function getName(id){
  try{
    const category = await conn("categories").where({id}).select(["name"]).first();
    if(!category || !category.name) return null;
    return category.name
  }catch(err){return null}
} 

async function assemblePath(categories,categoryId,path=[]){
  if(path.length == 0)path.push(categoryId)
   await Promise.all(categories.map(async c=>{
    if(categoryId == c.parentId){ // check if they have childs
      path.push(c.id);
      path = await assemblePath(categories,c.id,path)

    }
  }))
  return path
}
const getPath = async (categoryId) =>{
  var categories = await conn("categories");
  path = await assemblePath(categories,categoryId)
  return path
}

async function index(req,res,next){
  try{
    var categories = await conn("categories").select(["id","name","parentId","path"]);
    categories = await Promise.all(categories.map(async c=>{
      c.subordinates = await getPath(c.id);return c;
    }))
    res.json(categories)
  }catch(err){next(err)}
}
async function indexById(req,res,next){
  try{
    const category = await conn("categories").where({id:req.params.id}).select(["id","name","parentId"]);
    if(!category.length) throw [422, "Categoria Inexistente"];
    category[0].subordinates= await getPath(category[0].id);
    res.json(category[0])
  }catch(err){next(err)}
}
async function create(req,res,next){
  try{
    const {name,parentId} = {...req.body}
    const id = req.params.id
    const errors = [];
    if(isNull(name)) errors.push(BuildError("Nome ivalido","name"));
    if(!isNull(parentId) && isNaN(parentId)) errors.push(BuildError("Categories parente invalida", "parentId"));
    if(!isNull(id) && isNaN(id)) errors.push(BuildError("Id invalido", "parentId"));
    if(errors.length) throw [422,errors]

    
    if(parentId != undefined && parentId != null) { // if aprent Exists
      const parentExists = await conn("categories").where({id:parentId});
      if(!parentExists.length) throw [422, "Categoria Pai desconhecida"];
      if(!isNull(id) && id == parentId) throw [422, "Categorias não podem ser subordinadas a elas mesmas"];

      if(id !=null){ // means you are updating
        var subordinates = await getPath(id)
        if( subordinates.includes(parentId)) throw [422, "Categorias não podem ser Redigida a um Subordinado"];
      }  
    }
    const path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-')
      .replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
      
    if(id == undefined  || id == null){

      const sameName = await conn("categories").where({name}); // if post check is anme already exists
       if(sameName.length) throw [422, "categoria ja Registrada"];
      const categoria = await conn('categories').insert({name,parentId,path}).returning(["id",'name',"parentId"]);
      return res.json(categoria)
    }else{

      const categoria = await conn("categories").update({name,parentId,path}).where({id}).returning(["id","name","parentId"]);
      return res.json(categoria)
    }
    
  }catch(err){next(err)}
}
async function remove(req,res,next){
  try{
    const childs = await conn("categories").where({parentId:req.params.id});
    if(childs.length) throw [422,"Existem categorias dependentes, apague-as primeiro"];

    const postChilds = await (conn("posts")).where({category:req.params.id});
    if(postChilds.length) throw [422, "Existem artigos dependentes, apague-os primeiro"]
    const rows = await conn("categories").del().where({id:req.params.id})

    if( !rows || rows == undefined || rows === null) throw 406;
    res.sendStatus(204)
  }catch(err){next(err)}
}
const toTree = async(categories,tree)=>{
  if(!tree) tree = await categories.filter(c=>(!c.parentId));
  tree = await Promise.all(tree.map(async parent=>{
      parent.childrens = await toTree(categories,categories.filter(node=>node.parentId == parent.id))
      return parent;
  }) ) 
  return tree;
}
async function getJsonTree(req,res,next){
  try{
    const categories = await conn("categories").select(["id","name","parentId"]);
    var tree = await toTree(categories);
    res.json(tree); 
  }catch(err){next(err)}
}

module.exports = {index,create,remove,indexById,getJsonTree,getName}