const conn = require("../config/sqlConnection");
const {isNull, BuildError, isObject, isString, isNumber} = require("../api/validation")
const {indexByStudent_Module} = require("../api/exercisereply")

async function indexByModule(req,res,next){
  try{
    console.log("indexing by module")
    const path = req.params.path;
    const m = await conn("modules").where({path:path}).select('id').first();
    if(!m) throw [422,"Módulo inexistente"];
    const exercises = await conn("exercises").where({module:m.id});
    if(exercises && exercises.length){
      await Promise.all(exercises.map(async e=>{
        try{
          const reply = await conn("exercisesreplies").where({student:req.user.id,exercise:e.id}).first()
          if(reply) e.reply = reply
        }catch(err){}
      }))
    }
    return res.json(exercises)
  }catch(err){next(err)}
}
async function index(req,res,next){
  try{
    const exercises = await conn("exercises").select(["enunciation","type","options","resolution","tip","attachment","achievement","module","id"]);
    return res.json(exercises)
  }catch(err){next(err)}
}
async function indexById(req,res,next){
  try{
    const exercise = await conn("exercises").where({id:req.params.id}).select(["enunciation","type","options","resolution","tip","attachment","achievement","module","id"]).first();
    if(! exercise ) throw [422, "exercício inexistente"]
    res.json(exercise)
  }catch(err){next(err)}
}
async function remove(req,res,next){
  try{
    //check if there is replies to it;
   console.log("removindg")
    const id = req.params.id;
    const force=  req.query.f;
    const replies = await conn("exercisesreplies").where({exercise:id})
    if(force !== "true" && replies.length) throw [422,"Existem respostas a esse exercicio, apague-as primeiro"];
    else if( force === "true" && replies.length){
      const exercisesrows = await conn("exercisesreplies").del().where({exercise:id});
      if(exercisesrows == undefined || exercisesrows == null || exercisesrows === 0 ) throw [406,"Operação mal sucedida -  Não foi possivel apagar os exercisios respectivos."];
    }
    const rows = await conn("exercises").del().where({id});
    if(rows == undefined || rows == null || rows === 0 ) throw 406;
    res.sendStatus(204)
  }catch(err){next(err)}
}
const TYPES={
  1:"multiple choice",
  2:"discursive"
}
async function create(req,res,next){
  try{
    console.log("creating")
    var {enunciation,type,module,options,resolution,tip,attachment,achievement=25} = {...req.body};
    var id = req.params.id;
    const errors = [];

    if(isNull(enunciation) || enunciation.length < 6 ) errors.push(BuildError("O enunciado deve conter ao menos 6 caracteres","enunciation"));
    if(isNull(type) || isNaN(type) || TYPES[type] == undefined) errors.push(BuildError( "deve conter um tipo valido","type"));
    if(isNull(module) || isNaN(module)) errors.push(BuildError( "Modulo Invalido","module"));
    
    if(isNull(achievement) || !isNumber(achievement) ) errors.push(BuildError( "Conquista deve ser um valor numérico inteiro","achievement"));
    if(type == 1){
      if(isNull(options) || !isObject(options)) errors.push(BuildError("Questões de multipla escolha devem contem opções válidas","options"))
      if(isNull(resolution) || !isObject(resolution)) errors.push(BuildError("Questões de multipla escolha devem contem Resolução válida","resolution"))
    }else{

      options=null;
      resolution=null;
    }
    if(!isNull(tip) && !isString(tip))errors.push(BuildError("A Dica deve ser um valor Textual Valido (Não Obrigatorio)","tip"));
    if(!isNull(attachment) && !isObject(attachment) )errors.push(BuildError("Anexo contem um formato desconhecido","attachment"));
    if(errors.length) throw [ 422, errors];
    /*  */

    const modulesExists = await conn("modules").where({id:module});
    if(!modulesExists.length) throw [422,"modulo não existe"]
    
   
    if(id == undefined){
      const exercise = await conn("exercises").insert({enunciation,type,options,resolution,tip,attachment,achievement,module}).returning(["*"]);
      res.json(exercise)
    }else{
      const exercise = await conn("exercises").update({enunciation,type,options,resolution,tip,attachment,achievement,module}).where({id}).returning(["*"]);
      res.json(exercise) 
    } 
  }catch(err){next(err)}
}

module.exports = {index,indexById,indexByModule,create,remove}