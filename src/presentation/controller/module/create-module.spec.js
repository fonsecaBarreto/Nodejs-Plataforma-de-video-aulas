const CreateModule = require('./create-module')
const { missingParam, invalidParam } = require('../../../helper/Errors')
const makeSut = () =>{
  const sut = new CreateModule()
  return { sut }
}
const VALID_MODULE = {
  name: 'Nome do modulo'
}
describe('Create Module', () => {
  test('Should return 400 if no body is provided', async () => {
    const { sut } = makeSut()
    const moduleData = { }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ 
      errors: [
        missingParam('name'),
        missingParam('description')
      ]
    })
  })
  test('Should return 400 if no name is provided', async () => {
    const { sut } = makeSut()
    const moduleData = { description: 'any_description' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [missingParam('name')] })
  })
  test('Should return 400 if no description is provided', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  missingParam('description'), ] })
  })
  test('Should return 400 invalid name', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 2, description: 'any_description' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  invalidParam('name') ] })
  })
  test('Should return 400 invalid parentId', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name', description: 'any_description', parentId:'string_parentid' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  invalidParam('parentId') ] })
  })
  test('Should return 400 invalid notation', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name', description: 'any_description', notation:'string_notation' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  invalidParam('notation') ] })
  })
  test('Should return 400 invalid attachment', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name', description: 'any_description', attachment:'string_attachment' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  invalidParam('attachment') ] })
  })
  test('Should return 400 invalid picture', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name', description: 'any_description', picture:'string_attachment' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  invalidParam('picture') ] })
  })
  test('Should return 400 invalid videosource is not a object', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name', description: 'any_description', videosource:'dasdasdasdasd' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  invalidParam('videosource') ] })
  })
  test('Should return 400 invalid videosource.location is not a list', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name', description: 'any_description', videosource:{ location:'asdadads' } }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(400)
    expect(res.body).toEqual({ errors: [  invalidParam('videosource.location') ] })
  })

  test('Should return 200 if success', async () => {
    const { sut } = makeSut()
    const moduleData = { name: 'any_name', description: 'any_description' }
    const res = await sut.handle({body:moduleData})
    expect(res.statusCode).toBe(200)
  })

})