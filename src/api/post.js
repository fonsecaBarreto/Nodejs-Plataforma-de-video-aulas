const conn = require("../config/sqlConnection");
const {isNull, BuildError} = require("../api/validation")
async function indexByDate(req,res,next){
  try{
    const result= await conn("posts")
    .select(["title","path","publication_date","views","category","votes","picture"])
    .orderBy('publication_date', 'desc')
    .offset(req.query.o || 0)
    .limit(req.query.l || 6)
    console.log(result)
    res.json(result)
  }catch(err){next(err)}
}
async function indexByViews(req,res,next){
  try{
    console.log("aqui")
    const result= await conn("posts")
    .select(["title","path","publication_date","views","category","votes"])
    .orderBy('views', 'desc')
    .limit(req.query.l || 6)

    console.log(result)
    res.json(result)
  }catch(err){next(err)}
}
async function indexByPath(req,res,next){
  try{
    const post =await conn("posts").where({path:req.params.path});
    if(!post.length) throw [422,"post Inexistente"]
    await conn("posts").where({path:req.params.path}).update({views:post[0].views+1})

    res.json(post[0])
  }catch(err){next(err)}
}
async function concatViews(req,res,next){
  try{
     ("concating a view")
    const {views} =await conn("posts").where({path:req.params.path}).select("views").first(); 
    await conn("posts").where({path:req.params.path}).update({views:views+1})
    res.sendStatus(204)
  }catch(err){next(err)}
}
async function vote(req,res,next){
  try{
    const voto =  (req.query.v == undefined || (req.query.v != "up" && req.query.v != "down")) ? "up" : req.query.v;
    var {votes} = await conn("posts").where({path:req.params.path}).select("votes").first(); 
    votes = voto == "up" ? votes+1: votes-1;
    await conn("posts").where({path:req.params.path}).update({votes})
    res.sendStatus(204) 
  }catch(err){next(err)}
}
async function index(req,res,next){
  try{
    const post = await conn("posts");
    res.json(post)
  }catch(err){next(err)}
}
async function indexById(req,res,next){
  try{
    const post = await conn("posts").where({id:req.params.id});
    if(!post.length) throw [422, "post inexistente"]
    res.json(post[0])
  }catch(err){next(err)}
}
async function create(req,res,next){
  try{
    const {title,description,content,keys,category,picture,author,publication_date} = {...req.body};
    const id = req.params.id;
    const errors = [];
    if(isNull(title) || (title && title.length < 6)) errors.push(BuildError("Titulo deve conter ao menos 6 caracteres","title"));
    if(isNull(description)) errors.push(BuildError( "deve conter uma descrição valida","description"));
    if(isNull(content)) errors.push(BuildError("deve conter um conteudo valido","content"));
    if(isNull(keys)) errors.push(BuildError("'keys' não encontrada","keys"));
    if(!isNull(category) && isNaN(category)) errors.push(BuildError("Categoria Invalida","category"));
    if(!isNull(picture) && typeof picture != "object") errors.push(BuildError("Categoria Invalida","picture"));
    if(!isNull(author) && isNaN(author)) errors.push(BuildError("Autor Invalido","author"));
    if(!isNull(publication_date) ){
      
      !isNaN(Date.parse("some date test"))
      //
      !isNaN(Date.parse("22/05/2001"))  // true
    return res.json(!isNaN(Date.parse(publication_date))) 
      errors.push(BuildError("Data de publicação Invalido","publication_date"));
    } 

    if(errors.length) throw [422,errors];
    
    if(!isNull(author)){
      const categoryExists = await conn("admins").where({id:author});
      if(!categoryExists.length) throw [422, "Administrador inexistente"]
    }
    if(!isNull(category)){
      const categoryExists = await conn("categories").where({id:category});
      if(!categoryExists.length) throw [422, "Categoria inexistente"]
    }

    const path = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-')
    .replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();


    if(id == undefined){
      const post = await conn("posts").insert({title,description,content,keys,category,picture,path,author,publication_date}).returning(['id',"title","description","content","keys","category","picture","path"]);
      res.json(post)
    }else{
      const post = await  conn("posts").update({title,description,content,keys,category,picture,path,publication_date}).where({id}).returning(['id',"title","description","content","keys","category","picture","path"]);
      res.json(post);
       (post)
    }
  }catch(err){next(err)}
}
async function remove(req,res,next){
  try{
     ("deleting")
    const rows = await conn("posts").del().where({id:req.params.id});
     (rows)
    if(rows == undefined || rows == null || rows === 0 ) throw 406;
    res.sendStatus(204)
  }catch(err){next(err)}
}
module.exports = {index,indexById,indexByPath,indexByViews,create,remove,concatViews,vote,indexByDate}