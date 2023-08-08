const express = require('express')
const router = express.Router()
const c_api = require('./api/controller_api')
var cron = require('node-cron');

cron.schedule('0 0 * * *', () => {
  console.log('running every night to send messages that not sent');
  //get db email_sent == 0
  //reschedule sent 
});

router.get('/app-status', async (req, res) => {
    var status = {status:"OK"}
    
    res.send(status);
})

router.get('/', function(req, res){
    res.redirect('/panels')
})

router.use("/api", c_api)


module.exports = router


