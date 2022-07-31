// implement additional Model functions <--- add, find

// User does not
const db = require('../../data/dbConfig')

// check that user in req.body is properly formatted
function checkUserIsValid(req, res, next){
    const {username, password} = req.body
    if(!username.trim() || !password){
        next({status: 401, message: "username and password required"})
    }

    req.user = {
        username: username.trim(),
        password
    }

    next()
}

// check that new user doesn't already exist in database
async function checkUsernameFree(req, res, next) {
    const exists = await db('users').select('username').where({username: req.user.username})
    if(exists.length != 0) {
        next({status: 400, message: "username taken"})
    }

    next()
}

// 
module.exports = {
    checkUserIsValid,
    checkUsernameFree
}