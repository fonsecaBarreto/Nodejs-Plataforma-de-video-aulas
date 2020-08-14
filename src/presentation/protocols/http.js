
class HttpResponse {
  constructor(status,body){
    this.statusCode = status
    this.body = body
  }
}
class HttpRequest {
  constructor(body){
    this.body = body
  }
}

module.exports = { HttpRequest, HttpResponse}