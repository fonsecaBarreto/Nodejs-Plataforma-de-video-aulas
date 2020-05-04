const Router = require("express").Router();
const {index,create,update,remove,genToken,validateToken} = require("../api/admin")
const { check } = require('express-validator');
const creationModel =[
  check('username').notEmpty().isLength({min:6}).withMessage("mínimo de 6 caracteres"),
  check('password').notEmpty().isLength({ min: 6 }).withMessage('mínimo de 6 caracteres'),
  check('password_repeat').custom((value,{req, loc, path}) => {
     if (value !== req.body.password) return false; return value;}).withMessage("senhas não coincidem")
];
const updateModel =[
  check('username').isLength({min:6}).withMessage("mínimo de 6 caracteres"),
  check('password').isLength({ min: 6 }).withMessage('mínimo de 6 caracteres')
];
Router.post("/signin",genToken)
Router.post("/signup",creationModel,create)
Router.post("/auth",validateToken,(req,res)=>{ res.json(req.admin)})
Router.route("/")
  .get(validateToken,index)
  .post(validateToken,creationModel,create)
Router.route("/:id")
  .put(validateToken, updateModel,update)
  .delete(validateToken, remove)
module.exports = Router;