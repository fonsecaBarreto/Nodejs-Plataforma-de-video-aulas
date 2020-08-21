
const { ReceivePayment } = require('./receive-payment')

const makeSut = () =>{
  class OnPaymentCreatedStub {
    handler({customer, subscription}){
      return {
        name:'any_name',
        email:'any_email',
        phone: 'any_phone',
        password: 'hashed_password'
      }
    }
  }
  class OnPaymentReceivedStub {
    handler({customer, status}){
      return {
        name:'any_name',
        email:'any_email',
        phone: 'any_phone',
        password: 'hashed_password'
      }
    }
  }
  const onPaymentCreatedStub = new OnPaymentCreatedStub()
  const onPaymentReceivedStub = new OnPaymentReceivedStub()
  const sut = new ReceivePayment(onPaymentCreatedStub,onPaymentReceivedStub)
  return { sut, onPaymentCreatedStub, onPaymentReceivedStub }
}

const PAYMENT_RECEIVED =  {
  event: "PAYMENT_RECEIVED",
  payment: {
      object: "payment",
      id: "pay_080225913252",
      subscription:'idteste',
      customer: "cus_000015350285",
      value: 0.5,
      netValue: 0.5,
      status: "CONFIRMED",
      description: "asdnjkadas  asdjnhaj dn asd adj najsd asdbn akjsjnd jasnd  REF: #00S1"
  }
}
const PAYMENT_CREATED =  {
  event: "PAYMENT_CREATED",
  payment: {
      object: "payment",
      id: "pay_080225913252",
      subscription:'idteste',
      customer: "cus_000015350285",
      value: 0.5,
      netValue: 0.5,
      status: "CONFIRMED",
      description: "asdnjkadas  asdjnhaj dn asd adj najsd asdbn akjsjnd jasnd  REF: #00S1"
  }
}
const EXPECTED_COSTUMER = {
  name: "Lucas Fonseca Barreto",
  email: "lucasfonsecab@hotmail.comsaa",
  customer_id: "cus_000015350285"
}

 describe("Receive Payment", () => {
  test("onPaymentCreated return new student", async () => {
    const { sut, onPaymentCreatedStub } = makeSut()
    const hanlderSpy = jest.spyOn(onPaymentCreatedStub, 'handler')
    const req = { body: PAYMENT_CREATED }
    const res = await sut.handler(req)
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({
      name:'any_name',
      email:'any_email',
      phone: 'any_phone',
      password: 'hashed_password'
    })
  })

}) 

