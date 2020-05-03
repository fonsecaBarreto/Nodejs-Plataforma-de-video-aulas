const conn = require("../config/sqlConnection");
const {isNull, BuildError} = require("../api/validation")

async function index(req,res,next){
  try{
    const exercises = await conn("exercises");
    res.json(exercises)
  }catch(err){next(err)}
}

async function indexById(req,res,next){
  try{
    const exercise = await conn("exercises").where({id:req.params.id});
    if(!exercise.length) throw [422, "exercício inexistente"]
    res.json(exercise[0])
  }catch(err){next(err)}
}
async function create(req,res,next){
  try{
    const {enunciation,type,options,feedback} = {...req.body};
    const id = req.params.id;
    const errors = [];
    if(isNull(enunciation)) errors.push(BuildError("O enunciado deve conter ao menos 6 caracteres","enunciation"));
    if(isNull(type) && isNaN(type) ) errors.push(BuildError( "deve conter um tipo valido","type"));
    if(isNull(feedback) || typeof feedback != "object") errors.push(BuildError("Gabarito não encontrado","feedback"));
    if(!isNull(options) && typeof options != "object") errors.push(BuildError("Opções invalidas","options"));
    if(errors.length){
      throw [ 422, errors]
    }

    if(id == undefined){
      const exercise = await conn("exercises").insert({enunciation,type,options,feedback}).returning(["*"]);
      res.json(exercise)
    }else{
      const exercise = await conn("exercises").update({enunciation,type,options,feedback}).where({id}).returning(["*"]);
      res.json(exercise)
    }
  }catch(err){next(err)}
}
async function remove(req,res,next){
  try{
    console.log("deleting")
    const rows = await conn("exercises").del().where({id:req.params.id});
    if(rows == undefined || rows == null || rows === 0 ) throw 406;
    res.sendStatus(204)
  }catch(err){next(err)}
}
module.exports = {index,indexById,create,remove}