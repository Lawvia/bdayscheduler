const mysql = require('../module/mysql_connector')

module.exports = {
    getById: async function (id_agency) {
        try {
            await mysql.connectAsync()
            var sql = "SELECT * FROM ms_messages " +
                "WHERE id=?"
            var data = [id_agency];
            var [result, cache] = await mysql.executeAsync(sql, data)
            await mysql.endPool()
            return [result[0], null]
        } catch (error) {
            console.log(error)
            await mysql.endPool()
            return [null, error]
        }
    },

    getUserByName: async function (firstName, lastName) {
        try {
            await mysql.connectAsync()
            var sql = "SELECT * FROM ms_user " +
                "WHERE first_name=? AND last_name = ? AND email_sent =0"
            var data = [firstName, lastName];
            var [result, cache] = await mysql.executeAsync(sql, data)
            await mysql.endPool()
            return [result[0], null]
        } catch (error) {
            console.log(error)
            await mysql.endPool()
            return [null, error]
        }
    },

    getList: async function () {
        try {
            await mysql.connectAsync()
            var sql = "SELECT * FROM ms_user WHERE email_sent = 0"
            var [result, cache] = await mysql.queryAsync(sql)
            await mysql.endPool()
            return [result, null]
        } catch (error) {
            console.log(error)
            await mysql.endPool()
            return [null, error]
        }
    },
    add: async function (data) {
        try {
            await mysql.connectAsync()
            var sql = "INSERT INTO ms_user (first_name,last_name,birthday_date,location) " +
                "VALUES (?,?,?,?)"
            var data_input = [data.firstName, data.lastName, data.birthdayDate, data.location];
            console.log("data", data_input)
            var [result, cache] = await mysql.executeAsync(sql, data_input)
            await mysql.endPool()
            
            return [result, null]
        } catch (error) {
            console.log(error)
            await mysql.endPool()
            return [null, error]
        }
    },
     update: async function (data) {
        try {
            await mysql.connectAsync()
            var sql = "UPDATE ms_user SET " +
                "first_name=?, " +
                "last_name=?, " +
                "birthday_date=?, " +
                "location=? " +
                
                "WHERE first_name=? AND last_name=?"
            data_input = [data.firstName, data.lastName, data.birthdayDate, data.location, data.OldFirstName, data.OldLastName]
            var [result, cache] = await mysql.executeAsync(sql, data_input)
            await mysql.endPool()
            
            return [result, null]
        } catch (error) {
            console.log(error)
            await mysql.endPool()
            return [null, error]
        }
    },
    updateEmailSent: async function (id) {
        try {
            await mysql.connectAsync()
            var sql = "UPDATE ms_user SET " +
                "email_sent=1 " +
                
                "WHERE id=?"
            data_input = [id]
            console.log("sql ", sql)
            var [result, cache] = await mysql.executeAsync(sql, data_input)
            await mysql.endPool()
            
            return [result, null]
        } catch (error) {
            console.log(error)
            await mysql.endPool()
            return [null, error]
        }
    },
    delete: async function (firstName, lastName) {
        try {
            var sql = "DELETE FROM ms_user WHERE first_name=? AND last_name=?";
            var data_input = [firstName, lastName]
            var [result, cache] = await mysql.executeAsync(sql, data_input)
            await mysql.endPool()
           
            return [result, null]
        } catch (error) {
            console.log(error)
            await mysql.endPool()
            return [null, error]
        }
    }

}