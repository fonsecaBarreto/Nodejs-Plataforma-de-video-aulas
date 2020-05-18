const conn = require("../config/sqlConnection");
const {isNull, BuildError, isObject, isString, isNumber} = require("./validation")
const {concatPoints} = require("./student")
async function index(req,res,next){
  try{
    const replies = await conn("exercisesreplies").select("*");
    res.json(replies)
  }catch(err){next(err)}
}
async function indexById(req,res,next){
  try{
    const replies = await conn("exercisesreplies").where({id:req.params.id}).select("*").first();
    res.json(replies)
  }catch(err){next(err)}
}
async function indexByStudent(req,res,next){
  try{
    var replies = await conn("exercisesreplies").where({student:req.params.student}).select("*");
    if(replies.length){
      replies = await Promise.all(replies.map(async(r,i)=>{
        r.exercise = await (conn("exercises").where({id:r.exercise})).first();
        return r
        
      }))
    }
    res.json(replies)
  }catch(err){next(err)}
}
//index exercises replies by modules
//index also exercises by modules after...
async function remove(req,res,next){
  try{
    const rows = await conn("exercisesreplies").del().where({id:req.params.id});
    if(rows == undefined || rows == null || rows === 0 ) throw 406;
    res.sendStatus(204)
  }catch(err){next(err)}
}
async function create(req,res,next){
  try{
   
    if(!req.user) throw [422,"Usuario não identificado"];
    const student = req.user.id
    const {answer,attachment,feedback} = {...req.body};
    const exercise = req.params.exercise;
    const errors = [];
    if(isNull(exercise) || isNaN(exercise)) errors.push(BuildError("Exercício  invalida","exercise"));
    if(isNull(student) ||  isNaN(student)) errors.push(BuildError("Usuario Invalido","student"));
    if(isNull(answer) || !isObject(answer) )errors.push(BuildError("Resposta Invalida","answer"));
    if(!isNull(attachment) && !isObject(attachment)) errors.push(BuildError("Formato de anexo desconhecido","attachment"));
    if(!isNull(feedback)    && !isObject(feedback)) errors.push(BuildError("Resposta Incorreta","feedback"));
    if(errors.length) throw[422,errors];

    const exercisesExists = await conn("exercises").where({id:exercise}).select("type","resolution","options"); 
    if(!exercisesExists.length) throw [422,"Exercício inexistente"]
 
    const replyexists = await conn("exercisesreplies").where({student,exercise}).select("closed").first();
    if(replyexists && replyexists.closed == true)throw [422, "Essa questão ja foi feita"];
    
    var solved = false;
    var closed = false;
    if(exercisesExists[0].type == "1"){ //if multipla escolha
      if(answer.option == null) throw [400,"Resposta desconhecida"];
      else{

        const opcoes = Object.keys(exercisesExists[0].options)
        if(!opcoes.includes(answer.option) )throw [400,"Opção inexistente"];
        const corret_answer = exercisesExists[0].resolution.answer;
        if(answer.option == corret_answer){
          solved=true
          concatPoints(student,exercise)
        }
        closed=true;
      }
    }else{
      if(answer.text == null) throw [400,"Resposta desconhecida"];
    }
    if(replyexists){
      const reply = await conn("exercisesreplies").where({exercise,student}).update({solved,closed,exercise,student,answer,attachment,feedback}).returning("*")
      return res.json(reply)
    }else{
      const reply = await conn("exercisesreplies").insert({solved,closed,exercise,student,answer,attachment,feedback}).returning("*");
      return res.json(reply)
    }

  
  }catch(err){next(err)}
}

async function closeCase(req,res,next){//admin fuciton
  try{
    const {feedback,solved} = {...req.body}
    const id = req.params.id;
    const errors = [];
    if(isNull(feedback) || !isObject(feedback)) errors.push(BuildError("Valor de gabarito invalido","feedback"))
    if(solved == null) errors.push(BuildError("Correto ou não?","solved"))
    if(isNull(id)) errors.push(BuildError("Avaliação não identificada","id"))
    if(errors.length) throw [422,errors]
    

    const reply = await conn("exercisesreplies").where({id}).select("exercise").first()
    if(!reply || reply.closed==true) throw [406,"Indisponivel"]

    


    const retorno = await conn("exercisesreplies").where({id}).update({solved,feedback,closed:true}).returning(["student","exercise"])
    concatPoints(retorno[0].student,retorno[0].exercise)

    res.json(retorno[0])
  }catch(err){next(err)}

  //gives feed back and set it as solved or not
}

module.exports = {index,indexById,create,remove,closeCase,indexByStudent}