const router = require('express').Router();

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { checkUserIsValid, checkUsernameFree } = require('./auth-middleware')

const db = require('../../data/dbConfig') // <---- use database methods directly here?
const { BCRYPT_ROUNDS, JWT_SECRET } = require('../../config')


router.post('/register', checkUserIsValid, checkUsernameFree, async (req, res, next) => {
  // res.end('implement register, please!');
  const { username, password } = req.user;
  
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS)
  
  try {
    const [newUserId] = await db('users').insert({username, password: hash}) // returns a new id?
    // console.log(newUserId)
    // console.log(db('users').where('id', newUserId).first())
    const newUser = await db('users').where('id', newUserId).first()
    res.status(201).json(newUser)
  } catch(err) {
    next(err)
  }
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
});

router.post('/login', checkUserIsValid, async (req, res, next) => {
  const { username, password } = req.user;
  try {
    const [user] = await db('users').where({username});

    if(user && bcrypt.compareSync(password, user.password)){
      const token = generateJwt(user);
      req.headers.authorization = token
      res.status(200).json({
        message: `welcome, ${user.username}`,
        token
      })
    } else {
      next({status: 401, message: "invalid credentials"})
    }

  } catch(err) {
    next(err)
  }
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
});

// create jwt token here
function generateJwt(user){
  const payload = {
    subject: user.id,
    username: user.username
  }
  return jwt.sign(payload, JWT_SECRET, {expiresIn: '1d'});
}

module.exports = router;
