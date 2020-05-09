const conn = require("../config/sqlConnection");
const {isNull, BuildError, isObject} = require("./validation")

async function index(req,res,next){
  try{
    const list = await conn("editor_choices").select("content").first()
    if(list)res.json(list)
    throw 422
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
    console.log(errors)
    if(errors.length) throw [422,errors];
    var seven = favorites.filter( (f,i)=>(i<7));
    
    const result   = await conn("websiteconfigs").where({ref:"favorites"})
    if(result.length){
      console.log("updating")
      const result = await conn("websiteconfigs").where({ref:"favorites"}).update({content:JSON.stringify([...seven])}).returning("*")
      res.json(result)
    }else{
      console.log("creating new")
      const result = await conn("websiteconfigs").insert({ref:"favorites",content:JSON.stringify([...seven])}).returning("*")
      res.json(result)
    }


    res.sendStatus(200)
  }catch(err){next(err)}
}

module.exports = {index,create}