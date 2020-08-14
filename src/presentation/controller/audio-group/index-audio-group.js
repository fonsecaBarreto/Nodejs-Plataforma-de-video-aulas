const { ServerError, Success} = require("../../../helper/http-helper")
const AudioGroupRepository = require("../../../infra/Pg/audio-group/audio-group-repository")
const audiogroupRepository = new AudioGroupRepository()
class IndexAudiogroup {
  async handle(req){
    try{
      const id = req.params.id
      const groups = await audiogroupRepository.index(id)
      return Success.content(groups)
    }catch(err){
      console.log(err)
      return ServerError.unexpected()
    }   
  }
}
module.exports = IndexAudiogroup