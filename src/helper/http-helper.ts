import { HttpResponse, HttpRequest } from '../presentation/protocols/http'

const BadRequest = (body): HttpResponse => {
  return { statusCode:400, body }
}
const Conflict = (body): HttpResponse => {
  return { statusCode: 409, body }
}

const Success = {
  created(body){ return {statusCode: 201, body}},
  content(body){ return {statusCode: 200, body}},
  noContent()  { return {statusCode: 206}},
}

const ServerError = {
  unexpected() { return {statusCode: 500, body : new Error('Unexpected Error') }}
}

module.exports = { BadRequest, Conflict, Success, ServerError }