const { HttpResponse } = require('../presentation/protocols/http')
const { internalConflict } = require('./Errors')

const BadRequest = (body) => {
  return new HttpResponse(400, body)
}
const Conflict = (body) => {
  return new HttpResponse(409, body)
}

const Success = {
  created(body){ return new HttpResponse(201,body)},
  content(body){ return new HttpResponse(200,body)},
  noContent(){ return new HttpResponse(206)}
}

const ServerError = {
  unexpected() { return new HttpResponse(500,new Error('Unexpected Error'))},
}

module.exports = { BadRequest, Conflict, Success, ServerError }