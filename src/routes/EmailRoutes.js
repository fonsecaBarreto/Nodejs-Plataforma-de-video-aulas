const Router = require("express").Router()

const {broadAssignController,experimentalRequest,captivatedRequest} = require("../api/mail_api")

Router.post("/subscribe",broadAssignController);



module.exports = Router;