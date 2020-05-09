const conn = require("../config/sqlConnection");
const {isNull, BuildError, isEmail} = require("../api/validation")
const {getAuthor} = require("../api/admin");
const {getName} = require("../api/category");
async function vote(req,res,next){
  try{
    const voto =  (req.query.v == undefined || (req.query.v != "up" && req.query.v != "down")) ? "up" : req.query.v;
    var {votes} = await conn("posts").where({path:req.params.path}).select("votes").first(); 
    votes = voto == "up" ? votes+1: votes-1;
    await conn("posts").where({path:req.params.path}).update({votes})
    res.sendStatus(204) 
  }catch(err){next(err)}
}
async function indexByDate(req,res,next){
  try{
    const count = await conn("posts").count().first()
    const articles= await conn("posts")
    .select(["title","path","publication_date","views","category","votes","picture","description"])
    .orderBy('publication_date', 'desc')
    .offset(req.query.o || 0)
    .limit(req.query.l || 6)

    res.json({articles,...count})
  }catch(err){next(err)}
}
async function indexByCategory(req,res,next){
  try{
    const category = await conn("categories").where({path:req.params.path}).select("id").first();
    if(category && category.id){
      const posts =await conn("posts").where({category:category.id}).select(["title","path","publication_date","views","category","votes","picture","description"]);
      if(!posts.length) throw [422,"post Inexistente"];
      return res.json(posts)
    }

  }catch(err){next(err)}
}
async function indexRecommended(req,res,next){
  try{
 
    const post = await conn("posts").where({path:req.params.path}).select('category').first();
    const category = await conn("categories").where({id:post.category}).select("id").first();
    if(category && category.id){
      const posts =await conn("posts")
      .where({category:category.id})
      .whereNot({path:req.params.path})
      .orderBy('views', 'desc')
      .offset(req.query.o || 0)
      .limit(req.query.l || 8)
      .select(["title","path","publication_date","views","category","votes","picture","description"]);
      if(!posts.length) throw [422,"post Inexistente"];
      return res.json(posts)
    }

  }catch(err){next(err)}
}

async function indexEditorChoice(req,res,next){
  try{
    const list = await conn("websiteconfigs").where({ref:"favorites"}).first()
    const posts =await (conn("posts"))
    .where((builder) => builder.whereIn('id', list.content))
    .select(["title","path","publication_date","views","category","votes","picture","description"])
    .limit(req.query.l || 7)
    if(!posts.length) throw [500, "Não encontrado"];
    res.json(posts)
  }catch(err){next(err)}
}
async function indexByViews(req,res,next){
  try{
  
    const result= await conn("posts")
    .select(["title","path","publication_date","views","category","votes"])
    .orderBy('views', 'desc')
    .limit(req.query.l || 6)


    res.json(result)
  }catch(err){next(err)}
}
async function indexByPath(req,res,next){
  try{
    const post =await conn("posts").where({path:req.params.path}).first();
    if(!post) throw [422,"post Inexistente"];
    if(!isNull(post.author)) post.author = await getAuthor(post.author)
    if(!isNull(post.category)) post.category = await getName(post.category)
    await conn("posts").where({path:req.params.path}).update({views:post.views+1})
    return res.json(post)
  }catch(err){next(err)}
}
async function indexById(req,res,next){
  try{
    const post = await conn("posts").where({id:req.params.id});
    if(!post.length) throw [422, "post inexistente"]
    res.json(post[0])
  }catch(err){next(err)}
}

async function index(req,res,next){
  console.log(req.protocol)
  try{
    const post = await conn("posts");
    res.json(post)
  }catch(err){next(err)}
}
async function create(req,res,next){
  try{
    const {title,description,content,keys,category,picture,author} = {...req.body};

  
    const id = req.params.id;
    const errors = [];
    if(isNull(title) || (title && title.length < 6)) errors.push(BuildError("Titulo deve conter ao menos 6 caracteres","title"));
    if(isNull(description)) errors.push(BuildError( "deve conter uma descrição valida","description"));
    if(isNull(content)) errors.push(BuildError("deve conter um conteudo valido","content"));
    if(isNull(keys)) errors.push(BuildError("'keys' não encontrada","keys"));
    if(!isNull(category) && isNaN(category)) errors.push(BuildError("Categoria Invalida","category"));
    if(!isNull(picture) && typeof picture != "object") errors.push(BuildError("Categoria Invalida","picture"));
    if(!isNull(author) && !isEmail(author)) errors.push(BuildError("Autor Invalido","author"));

    if(errors.length) throw [422,errors];
    
    if(!isNull(author)){
      const categoryExists = await conn("admins").where({email:author});
      if(!categoryExists.length) throw [422, "Administrador inexistente"]
    }
    if(!isNull(category)){
      const categoryExists = await conn("categories").where({id:category});
      if(!categoryExists.length) throw [422, "Categoria inexistente"]
    }

    const path = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-')
    .replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();


    if(id == undefined){
      const post = await conn("posts").insert({title,description,content,keys,category,picture,path,author}).returning(['id',"title","description","content","keys","category","picture","path"]);
      res.json(post)
    }else{
      const post = await  conn("posts").update({title,description,content,keys,category,picture,path,author}).where({id}).returning(['id',"title","description","content","keys","category","picture","path"]);
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
module.exports = {index,indexById,indexByPath,indexByViews,create,remove,vote,indexByDate,indexEditorChoice,indexByCategory,indexRecommended}