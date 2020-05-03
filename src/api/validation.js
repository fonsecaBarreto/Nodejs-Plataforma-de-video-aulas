function isNull(value){
  if(!value || value === undefined || value === null) return true;
  return false;
}
function isString(value){
  if (value.type == "string") return true;
  return false
}
function isNumber(value){
  if (!isNaN(value)) return true;
  return false
}
function BuildError(msg,param){
  return {msg:msg,param:param}
}

module.exports = {isNull,isString,isNumber,BuildError}