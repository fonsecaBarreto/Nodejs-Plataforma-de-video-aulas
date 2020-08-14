exports.missingParam = function(param){
  return { param, message:`Missing Param: ${param}`}
}
exports.invalidParam = function(param, details){
  return { param, message: `Invalid Param: ${param}`,details}
}
