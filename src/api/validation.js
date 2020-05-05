const email = require("email-validator")
function isNull(value){
  if(!value || value === undefined || value === null) return true;
  return false;
}
function isString(value){
  if (typeof value == "string") return true;
  return false
}
function isNumber(value){
  if (!isNaN(value)) return true;
  return false
}
function BuildError(msg,param){
  return {msg:msg,param:param}
}
function isEmail(mail){
  return email.validate(mail)
}
module.exports = {isEmail, isNull,isString,isNumber,BuildError}