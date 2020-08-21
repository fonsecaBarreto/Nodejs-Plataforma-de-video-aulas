
const conn = require("../../../config/sqlConnection");

const PER_MONTH = (30*24*60*60*1000);

class OnPaymentReceived {
  async handler ( { customer, status }) {
    const student = await conn("students").where({customer_id:customer}).select(["id","expiration"]).first();
    if(!student) throw new Error(" - Não Registrado do aluno na base de dados.")
    var { expiration, id } = student
    const LAST_EXPIRATION = expiration;
    expiration = ( Number(expiration) + PER_MONTH )+ ""
    var usuario = await conn("students").where({id}).update({expiration,experimental:false}).returning(["id","name","email","expiration"])
    usuario = usuario[0];
    console.log(` - Usuario '${usuario.name}', Pagamento efetuado!\n  - exp: `,LAST_EXPIRATION,"--->",usuario.expiration)
    return { name: usuario.name, email: usuario.email }
  }
}
module.exports = { OnPaymentReceived }