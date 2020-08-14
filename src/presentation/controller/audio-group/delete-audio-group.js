const { ServerError, BadRequest, Success, Conflict } = require("../../../helper/http-helper");
const { invalidParam, missingParam, internalConflict } = require("../../../helper/Errors");
const AudioGroupRepository = require("../../../infra/Pg/audio-group/audio-group-repository");

const repo = new AudioGroupRepository()
class DeleteAudioGroup {
  async handle(req){
    try{
      const id = req.params.id
      if(!id) return BadRequest(missingParam(id))
      if(isNaN(id)) return BadRequest(invalidParam(id))

      const deleted = await repo.delete(id)
      if(deleted === false ) return Conflict(invalidParam('id'))
      return Success.noContent()
    }catch(err){
      console.log(err)
      ServerError.unexpected()
    }
  }
}
module.exports = DeleteAudioGroup