const bodyParser = require('body-parser')
const helmet = require('helmet')
const express = require('express')
const app = express()
const http = require('http').createServer(app)
const path = require('path')
const c_main = require('./app/controllers/controller_main')
const app_config = require('./app/config/app.json')
const cookieParser = require('cookie-parser')


// Enable proxy for get secure https
app.enable("trust proxy")

// Middlewares
app.use(helmet({
    frameguard: false
}))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname + '/public')))


app.use(cookieParser())

app.use('/', c_main)

http.listen(app_config.port, () => console.log('bdayScheduler listening on port ' + app_config.port))
