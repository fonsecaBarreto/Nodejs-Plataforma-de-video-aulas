require("dotenv").config()
const { App } = require('./app')
const app = new App(process.env.PORT || 9000, process.env.NODE_ENV)
app.run()