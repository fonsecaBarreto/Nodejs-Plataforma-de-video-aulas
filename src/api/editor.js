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
    var errors = []
    if(isNull(favorites) || !isObject(favorites)|| (isObject(favorites) && favorites.length < 7 ) ) errors.push(BuildError("lista de favoritos deve conter ao menos 7 artigos","favorites"));
    await Promise.all( favorites.map(async f=>{
      let fromdb = await conn("posts").where({id:f}).first();
      if(!fromdb) errors.push(BuildError(`post id:${f} Inexistente`,"favorites"))
    }))
    if(errors.length) throw [422,errors];
     var seven = favorites.filter( (f,i)=>(i<7))
    try{
      const exists  = await conn("editor_choices").where({ref:1}).first()
      if(exists){
        const post = await  conn("editor_choices").update({content:JSON.stringify(seven)}).where({ref:1}).returning(["content"]);
        return res.json(post[0]);
      }
    }catch(err){ 
      const post = await conn("editor_choices").insert({content:JSON.stringify(seven),ref:1,description}).returning(["content"]);
      return res.json(post[0])
    }
  }catch(err){next(err)}
}

module.exports = {index,create}