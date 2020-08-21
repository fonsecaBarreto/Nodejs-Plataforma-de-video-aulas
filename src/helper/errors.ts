export function missingParam (param) {
  return { param, message:`Missing Param: ${param}`}
}
export function  invalidParam (param, details){
  return { param, message: `Invalid Param: ${param}`,details}
}
