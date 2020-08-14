
const CreateAudioGroup  = require("../controller/audio-group/create-audio-group")
const IndexAudiogroup  = require("../controller/audio-group/index-audio-group")
const DeleteAudioGroup  = require("../controller/audio-group/delete-audio-group")
const { validateToken } = require("../../api/admin")

module.exports = app =>{
  app.route('/audiogroup/')
    .all(validateToken)
    .get( async (req,res) => {
      const indexAudiogroup = new IndexAudiogroup()
      const {statusCode, body} = await indexAudiogroup.handle(req)
      res.status(statusCode).json(body)
    })
    .post( async (req,res) => {
      const createAudioGroup = new CreateAudioGroup()
      const {statusCode, body} = await createAudioGroup.handle(req)
      res.status(statusCode).json(body)
    })
  app.route('/audiogroup/:id')
    .all(validateToken)
    .delete( async (req,res) => {
      const deleteController = new DeleteAudioGroup()
      const {statusCode, body} = await deleteController.handle(req)
      res.status(statusCode).json(body)
    })
    .get( async (req,res) => {
      const indexAudiogroup = new IndexAudiogroup()
      const {statusCode, body} = await indexAudiogroup.handle(req)
      res.status(statusCode).json(body)
    })
    .put( async (req,res) => {
      const createAudioGroup = new CreateAudioGroup()
      const {statusCode, body} = await createAudioGroup.handle(req)
      res.status(statusCode).json(body)
    })
   
}