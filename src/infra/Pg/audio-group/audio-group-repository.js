const conn = require("../../../config/sqlConnection");
class AudioGroupRepository {

  async create({id, title, description, content}){
    var audiogroup = null
    if(!id){
      audiogroup = await conn('audiogroups').insert({title,description,content})
      .returning(['id','title','description','content'])
    }else{
      audiogroup = await conn('audiogroups').update({title,description,content})
      .where({id})
      .returning(['id','title','description','content'])
    }
    return audiogroup[0]
  }

  async index(id){
    const groups = await conn('audiogroups').where(id?{id}:{})
    return groups
  }

  async delete(id){
    const rows = await conn('audiogroups').where({id}).del()
    if(rows !== 1) return false
    return true
  }

}

module.exports = AudioGroupRepository