const { ReceivePayment } =  require('./payment-controller')
const { OnPaymentCreated } = require('./on-payment-created')
const { OnPaymentReceived } = require('./on-payment-received')
const { PaymentController } = require('./payment-controller');

const onPaymentCreated = new OnPaymentCreated()
const onPaymentReceived = new OnPaymentReceived()
const controller = new PaymentController(onPaymentCreated,onPaymentReceived)

module.exports = controller