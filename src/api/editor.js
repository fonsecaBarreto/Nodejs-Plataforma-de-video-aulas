const conn = require("../config/sqlConnection");
const {isNull, BuildError, isObject} = require("./validation")

async function index(req,res,next){
  try{
    const list = await conn("websiteconfigs").select("content").first()
    if(list) return res.json(list)
    throw 204
  }catch(err){next(err)}
}
const description="favorites posts from editor"
async function create(req,res,next){
  try{
    const {favorites} = {...req.body};
    var errors = [];
    if(isNull(favorites) || !isObject(favorites) ) throw [422,BuildError("lista de favoritos deve conter ao menos 7 artigos","favorites")]
    if(!isNull(favorites) && isObject(favorites) && favorites.length < 7 )  throw [422,BuildError("lista de favoritos deve conter ao menos 7 artigos","favorites")]

    await Promise.all( favorites.map(async f=>{
      let fromdb = await conn("posts").where({id:f}).first();
      if(!fromdb) errors.push(BuildError(`post id:${f} Inexistente`,"favorites"))
    }))
 
    if(errors.length) throw [422,errors];
    var seven = favorites.filter( (f,i)=>(i<7));
    
    const result   = await conn("websiteconfigs").where({ref:"favorites"})
    if(result.length){
    
      const result = await conn("websiteconfigs").where({ref:"favorites"}).update({content:JSON.stringify([...seven])}).returning("*")
      return res.json(result)
    }else{
     
      const result = await conn("websiteconfigs").insert({ref:"favorites",content:JSON.stringify([...seven])}).returning("*")
      return res.json(result)
    }
  }catch(err){next(err)}
}

module.exports = {index,create}