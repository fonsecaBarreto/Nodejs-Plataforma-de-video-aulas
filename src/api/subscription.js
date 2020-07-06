const {save} = require("./student")

function rescueAsaasCostumer(customer_id){
  return new Promise((resolve,reject)=>{
    request({ method: 'GET',url: `https://www.asaas.com/api/v3/customers/${customer_id}`,
      headers: {'Content-Type': 'application/json', 'access_token': api_key}},
      function (error, response, body) {
        if(error || response.statusCode > 300 ) reject(error)
        resolve(JSON.parse(body))
      });
  })
}


function paymentCreated({customer,subscription}){
  return new Promise(async(resolve,reject)=>{
    try{ 
      const {name,email,phone} = await rescueAsaasCostumer(customer);
      var password =  generatePassword(8) ;

      try{ console.log(" -- Cadastrando Usuario em banco de dados... ")
        const user = await save({name,email,customer_id:customer,subscription_id:subscription,password})
        console.log(" --- Usuario cadastrado ",user)
          try{
            await experimentalAssign({email,name,phone,password}) 
            console.log(" --- Audiencia experimental")
          }catch(err){console.log(" --- Não foi possivel entrar em audiencia experimental",err);}
          return resolve();
          
      }catch(err){console.log(" ---x não foi possivel criar usuario");return reject(err)}

    }catch(err){ console.log("--- Incerteza sobre o usuario"); return reject(err)}
  })
}
const EXPECTED_STATUS=["CONFIRMED","RECEIVED_IN_CASH","RECEIVED"]
function paymentReceived(customer,status){
  return new Promise(async (resolve,reject)=>{
    if(!EXPECTED_STATUS.includes(status)){console.log("STATUS INVALIDO");return reject()}
    try{
      console.log("customer: ",customer)
      try{
        const exists = await conn("students").where({customer_id:customer}).select(["id","expiration","email","name"]);
        if(!exists.length) {console.log("Aluno não existe em banco de dados");return reject()}
        var {expiration,id,email,name} = {...exists[0]}
        const LAST_EXPIRATION = expiration;
        expiration = ( Number(expiration) + (30*24*60*60*1000)  )+ ""
        try{ 
          const usuario = await conn("students").where({id}).update({expiration}).returning("*")
          console.log("usuario atualizado com sucesso")
          console.log(LAST_EXPIRATION,"--->",usuario[0].expiration)
        }catch(err){console.log("não foi possivel atualizar credito do usuario");return reject()}

        try{
          await captivatedAssign({email,name})
          console.log("audiencia cativa mailchimp")
        }catch(err){console.log("mail chimp audicente error")}

        resolve();
      }catch(err){console.log ("---x Incerteza sobre Aluno");
        return reject(err)
      }
    }catch(err){console.log("---x Incerteza sobre o cliente Asaas")
      return reject(err)
    }

  })
}
async function payment(req,res){
    const payload = {...req.body};
    if(payload != null){ console.log("\n",payload.event,"\n-----------------------------")
      if(payload.event == 'PAYMENT_CREATED'){ console.log(" - Asaas Client Created")
        try{await paymentCreated(payload.payment)
        }catch(err){console.log(err)}
      }else if(payload.event == 'PAYMENT_RECEIVED' || payload.event == "PAYMENT_CONFIRMED"){
        try{await paymentReceived(payload.payment)
        }catch(err){console.log(err)}
      }
    } console.log("\n----------------------------- /end")
    return res.sendStatus(200)
}


module.exports = {payment}