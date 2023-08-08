const express = require('express')
const router = express.Router()
const authorize = require('../../config/authorization.json')
const user = require('../../models/model_user')
const moment = require('moment-timezone');
const schedule = require('node-schedule');
const axios = require('axios');
const axiosRetry = require('axios-retry');

var auth = require('basic-auth')
var compare = require('tsscmp')

const apiUrl = 'https://email-service.digitalenvision.com.au/send-email';
const maxRetries = 3;
axiosRetry(axios, {
    retries: 3, // number of retries
    retryDelay: (retryCount) => {
        console.log(`retry attempt: ${retryCount}`);
        return retryCount * 2000; // time interval between retries
    },
    retryCondition: (error) => {
        // if retry condition is not specified, by default idempotent requests are retried
        return error.response.status === 500;
    },
});

router.use(async function(req, res, next) {
    var credentials = auth(req)
    if (!credentials || !checkAuth(credentials.name, credentials.pass)) {
        return res.status(401).json({ message: 'Invalid Authorization' });
    } 
    console.log("Auth Success")
    next()
});

function checkAuth (name, pass) {
  var valid = true
  valid = compare(name, authorize.username) && valid
  valid = compare(pass, authorize.password) && valid
 
  return valid
}

function scheduleMessage(data,timezone) {
    const now = moment();
    const bday = new Date(data.birthdayDate);
    bday.setFullYear(new Date().getFullYear());

    const userTime = moment.tz(bday, timezone).set({hours: 12, minutes: 38});

    const timeDiff = userTime.diff(now, 'seconds');

    console.log('Scheduling message for:', userTime.format('LLLL'));
    
    schedule.scheduleJob(new Date(userTime.toDate() + timeDiff * 1000), async function(bind){
        console.log('Sending scheduled message now!');
        // retry mechanism, handling error
        

        var [get, err] = await user.getUserByName(bind.firstName, bind.lastName);
        console.log("get ",get)
        if (err != null || !get) {
            //user already deleted or updated or email sent flag = 1
            console.log("user already deleted or updated")
            return
        }else{
            let temp = bind.template_email.replace("{full_name}", bind.firstName + " " + bind.lastName);
            console.log(temp);
            // send a POST request
            await axios.post(apiUrl, {
                email: 'rsndvdsn@gmail.com',
                message: temp
            })
            .then(async (response) => {
                console.log(response.data);
                //update db flag
                var [check, err] = await user.updateEmailSent(get.id);
                if (err != null){
                    console.log("error update email flag", err)
                }
            }, (error) => {
                if (error.response.status !== 200) {
                    throw new Error(`API call failed with status code: ${error.response.status} after 3 retry attempts`);
                }
            });
        }


    }.bind(null,data));
}


router.get("/get_user", async function(req, res){
    var [check, err] = await user.getList();
    if (!check) return res.status(404).send("User Not Found!");
    else { 
        return res.status(200).send(check);
    }
})

router.post("/user", async function(req, res){
    var firstName = req.body.first_name
    var lastName = req.body.last_name
    var birthdayDate = req.body.birthday_date
    var location = req.body.location

    if (!req.body){
        return res.status(500).json({ message: 'no body' });
    }

    //validate date
    if (!moment(birthdayDate, "YYY-MM-DD", true).isValid()) {
        return res.status(400).json({ message: 'Invalid date format' });
    }

    if (moment.tz.zone(location)) {
        // scheduleMessage(timezone);
        var data_input = {
            id: 0,
            firstName: firstName,
            lastName: lastName,
            birthdayDate: birthdayDate,
            location: location,
            template_email: ""
        }


        var [check, err] = await user.add(data_input);
        if (err != null) return res.status(400).json({ message: err.message });
        else { 
            //get db for template message
            var template_email = ""
            if (req.body.template == null) {
                //use default from db
                var [tempe, err] = await user.getById(1);
                template_email = tempe.template
            }else{
                var [tempe, err] = await user.getById(req.body.template);
                template_email = tempe.template
            }
            data_input.template_email = template_email
            data_input.id = check.insertId

            scheduleMessage(data_input, location)
            return res.status(200).json({ name: firstName+lastName, birthday: birthdayDate, message: 'user added' });
        }
    } else {
        return res.status(404).json({ message: 'location not found' });
    }
})

router.delete("/user", async function(req, res){
    var firstName = req.body.first_name
    var lastName = req.body.last_name

    if (!req.body){
        return res.status(500).json({ message: 'no body' });
    }

    var [check, err] = await user.delete(firstName, lastName);
    if (err != null) return res.status(400).json({ message: err.message });
    return res.status(200).json({ name: firstName+lastName, message: 'user deleted' });
})



router.put("/user", async function(req, res){
    var OldFirstName = req.body.old_first_name
    var OldLastName = req.body.old_last_name

    var firstName = req.body.first_name
    var lastName = req.body.last_name
    var birthdayDate = req.body.birthday_date
    var location = req.body.location

    if (!req.body){
        return res.status(500).json({ message: 'no body' });
    }

    //validate date
    if (!moment(birthdayDate, "YYY-MM-DD", true).isValid()) {
        return res.status(400).json({ message: 'Invalid date format' });
    }

    if (moment.tz.zone(location)) {
        var data_input = {
            OldFirstName: OldFirstName,
            OldLastName: OldLastName,
            firstName: firstName,
            lastName: lastName,
            birthdayDate: birthdayDate,
            location: location,
            template_email: "",
            id: 0
        }

        var [check, err] = await user.update(data_input);
        if (err != null) return res.status(400).json({ message: err.message });
        else { 
            //get db for template message
            var template_email = ""
            if (req.body.template == null) {
                //use default from db
                var [tempe, err] = await user.getById(1);
                template_email = tempe.template
            }else{
                var [tempe, err] = await user.getById(req.body.template);
                template_email = tempe.template
            }
            data_input.template_email = template_email
            data_input.id = check.insertId

            scheduleMessage(data_input, location)
            return res.status(200).json({ name: firstName+lastName, birthday: birthdayDate, message: 'user updated' });
        }
        
    } else {
        return res.status(404).json({ message: 'location not found' });
    }

})


module.exports = router