import { HttpResponse, HttpRequest } from './http'
export interface Controller {
  handler(req:HttpRequest): HttpResponse
}
