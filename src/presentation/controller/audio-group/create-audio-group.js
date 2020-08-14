const { ServerError, Success, BadRequest} = require("../../../helper/http-helper");
const { invalidParam, missingParam } = require('../../../helper/Errors');
const AudioGroupRepository = require('../../../infra/Pg/audio-group/audio-group-repository')
const audiogroupRepository = new AudioGroupRepository()

class CreateAudioGroup {
  async handle(req) {
    try{
      var errors = this.validate(req.body)
      if(errors.length) return BadRequest({errors})

      const {title, description, content } = req.body
      const id = req.params.id
  
      const audiogroup = await audiogroupRepository.create( { id, title, description, content  })
      return Success.content(audiogroup)
    }catch(err){ return ServerError.unexpected() }
  }

  validate(data){
    var errors = []
    const EXPECTED_VALUES =['title', 'content', 'description']
    for (const v of EXPECTED_VALUES) {
      if(!data[v]) errors.push(missingParam(v))
    }
    if(errors.length) return errors
    const { content } = data
  
    if( typeof(content) != 'object' || !content.audioentities ) return [ invalidParam('content')]
    if( !content.audioentities.length ) return []
    
    errors = content.audioentities.map((audio,i) => {
      if( typeof(audio) != 'object') return invalidParam(`content.audioentities.${i}`)
      if(!audio.author) return missingParam(`content.audioentities.${i}.author`)
      if(!audio.text) return  missingParam(`content.audioentities.${i}.text`)
      if(!audio.location) return missingParam(`content.audioentities.${i}.location`)
    })
    errors = errors.filter(err=>err)
    return errors
  }
}

module.exports = CreateAudioGroup