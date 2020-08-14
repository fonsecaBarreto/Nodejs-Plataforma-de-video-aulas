const { ServerError, BadRequest } = require("../../../helper/http-helper");
const { Success } = require('../../../helper/http-helper');
const { missingParam, invalidParam } = require("../../../helper/Errors");
class CreateModule {
  async handle(req){
    try{
      var errors = await this.validate(req.body)
      if(errors.length) return BadRequest({errors})

      const { parentId, name } = req.body
      const id = req.params.id
      if(parentId) { 
        const parentExists = await conn("modules").where({id:parentId});
        if(!parentExists.length) throw [422, "Modulo Pai desconhecida"];
        if(!isNull(id) && id == parentId) throw [422, "Modulo não podem ser subordinadas a elas mesmas"];
        if(id !=null){ // means you are updating
          var subordinates = await getPath(id)
          if( subordinates.includes(parentId)) throw [422, "Modulo não podem ser Redigida a um Subordinado"];
        }  
      }
      const path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-')
      .replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();
    
    
     /*  if(id){
        const sameName = await conn("modules").where({name}); // if post check is anme already exists
        if(sameName.length) throw [422, "Modulo ja Registrada"];

        const modules = await conn('modules').insert({name,parentId,path,description,picture,notation,restrict,video,attachment,videosource}).returning(QUERY_SELECT);
        return res.json(modules)
      }else{
        const modules = await conn("modules").update({name,parentId,path,description,picture,notation,restrict,video,attachment,videosource}).where({id}).returning(QUERY_SELECT);
        return res.json(modules)
      }
 */
      var module = {...req.body, path, id:'auto_geretad'}
      return Success.content(module)
    }catch(err){ console.log(err); return ServerError.unexpected()}
  }
  async validate(data){
    var errors = []
    const NOT_NULL_VALUES = ['name','description']
    for (const param of NOT_NULL_VALUES){ if(!data[param]) errors.push(missingParam(param))}
    if(errors.length) return errors

    const { name, description, parentId, notation, video, attachment, picture, videosource, restrict } = data
    if(name && typeof(name) != 'string' ) errors.push(invalidParam('name'))
    if(description && typeof(description) != 'string' ) errors.push(invalidParam('description'))
    if(video && typeof(video) != 'string' ) errors.push(invalidParam('video'))
    if(parentId && isNaN(parentId) ) errors.push(invalidParam('parentId'))
    if(notation && isNaN(notation) ) errors.push(invalidParam('notation'))
    if(attachment && typeof(attachment) != 'object') errors.push(invalidParam('attachment'))
    if(picture && typeof(picture) != 'object')  errors.push(invalidParam('picture'))
    
    if(videosource){
      if (typeof(videosource) != 'object') return [ ...errors, invalidParam('videosource')]
      if(!videosource.location || !Array.isArray(videosource.location) || videosource.location.length === 0) return [ ...errors, invalidParam('videosource.location') ]
      
      const VIDEO_SOURCE_LOCATION_PARAMS= ["src","type","resolution"];
      for(const loc of videosource.location){
          for (const params of VIDEO_SOURCE_LOCATION_PARAMS){
            if(!loc[params]) errors.push(missingParam(`videosource.location.${params}`))
          }
      }
     
    }
    return errors 
  } 
}

module.exports = CreateModule