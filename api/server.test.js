// Write your tests here
const request = require('supertest')
const db = require('../data/dbConfig')
const server = require('./server')
const bcrypt = require('bcrypt')

test('[0] sanity check', () => {
  expect(true).not.toBe(false)
  expect(process.env.NODE_ENV).toBe('testing')
})

beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
})

beforeEach(async () => {
  await db('users').truncate();
  // db.seed.run();
})

afterAll(async () => {
  await db.destroy();
})
const dummyUser = {username: 'New User', password: 'Password'}

describe('[POST] register endpoint tests', () => {
  test('[1] can successfully register new users', async () => {
    const res = await request(server).post('/api/auth/register').send(dummyUser)
    expect(res.body).toMatchObject({username: dummyUser.username})
    expect(res.status).toEqual(201)
    expect(bcrypt.compareSync(dummyUser.password, '$2b$08$ACxvXW3gsMcM.i45uI.JLeuxvMXCFONyVi9w1orepxWpiUayZA/QW')).toBe(true)
  }, 750)

  test('[2] Returns an error and message when username or password is not supplied in registrations', async () => {
    const noPassword = await request(server).post('/api/auth/register').send({username: 'New User'})
    expect(noPassword.body).toMatchObject({message: /username and password required/i})

    const noUser = await request(server).post('/api/auth/register').send({password: '1234'})
    expect(noUser.body).toMatchObject({message: /username and password required/i})

    const blankDummy = await request(server).post('/api/auth/register').send({})
    expect(blankDummy.body).toMatchObject({message: /username and password required/i})
  }, 750)
})

describe('[POST] login endpoint tests', () => {
  test('[3] can successfully login and return a valid token', async () => {
    await request(server).post('/api/auth/register').send(dummyUser)

    const login = await request(server).post('/api/auth/login').send(dummyUser)
    expect(login.body).toMatchObject({message: `welcome, ${dummyUser.username}`})
  }, 750)

  test('[4] cannot login without correct username, password and valid token', async () => {
    await request(server).post('/api/auth/register').send(dummyUser)

    const badUsername = await request(server).post('/api/auth/login').send({username: 'Fake User', password:'Password'})
    expect(badUsername.body).toMatchObject({message: 'invalid credentials'})

    const badPassword = await request(server).post('/api/auth/login').send({username: 'New User', password:'passw0rd'})
    expect(badPassword.body).toMatchObject({message: 'invalid credentials'})
  }, 750)
})

describe('[GET] jokes endpoint', () => {
  test('[5] gets all jokes when user is logged in', async () => {
    await request(server).post('/api/auth/register').send(dummyUser)
    await request(server).post('/api/auth/login').send(dummyUser)
      .then(async (res) => {
        const jokes = await request(server).get('/api/jokes').set({Authorization: res.body.token})
        // console.log(jokes)
        expect(jokes.body).not.toBeNull();
        expect(jokes.body).toHaveLength(3)
    })
  }, 750)

  // test('dummy', async () => {
  //   await request(server).post('/api/auth/register').send(dummyUser)
  //   await request(server).post('/api/auth/login').send(dummyUser)
  //     .then(async (res) => {
  //       const jokes = await request(server).get('/api/jokes').set({Authorisation: `${res.token}`})
  //       console.log(jokes)
  //       expect(jokes.text).toBeNull()
  //   })
  // }, 750)

  test('[6] returns an error message if user is not logged in', async () => {
    const jokesError = await request(server).get('/api/jokes');
    expect(jokesError.body).toMatchObject({message: 'token required'})
    expect(jokesError.status).toEqual(401)
  }, 750)

  // test('[7] returns an error message on invalid/expired token', async () => {
  //   const invalidError = await request(server).get('/api/jokes').send({authorization: '7fwuihuif2498rhufir3h89hd28785'});
  //   expect(invalidError).toMatchObject({message: 'token required'})
  // }, 750)
})

// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWJqZWN0IjoxLCJ1c2VybmFtZSI6IlBsYWNlaG9sZGVyIiwiaWF0IjoxNjU5NDAyNzA4LCJleHAiOjE2NTk0ODkxMDh9.1BfohqyVGt0WG4xLKbT4-QptNiyF3mwijVvQ-MpOBc8