//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const {MongoClient} = require('mongodb');
const uri = 'mongodb://localhost:27017';

const crypto = require('crypto');

const app = express();
const client = new MongoClient(uri);

app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');

app.get("/", function(req, res) {
  res.render('home');
});

app.get("/login", function(req, res) {
  res.render('login');
});

app.post('/login', function(req, res) {
  const user = req.body.username;
  const password = req.body.password;

  async function findUser() {
    try {
      await client.connect();
      const foundUser = await client.db('userDB').collection('users').findOne({username: user});
      let encrypted = foundUser.password;

      if (foundUser == undefined) {
        res.render('home');
      } else {
        let decipher = crypto.createDecipheriv('aes-256-cbc', process.env.KEY, process.env.IV);
        let decrypted = decipher.update(encrypted, 'hex', 'utf-8');
        decrypted += decipher.final('utf-8');

        if (decrypted === password) {
          res.render('secrets');
        }
      }
    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  }

  findUser();
});

app.get("/register", function(req, res) {
  res.render('register');
});

app.post("/register", function(req, res) {

  let password = req.body.password;

  let cipher = crypto.createCipheriv('aes-256-cbc', process.env.KEY, process.env.IV);
  let encrypted = cipher.update(password, 'utf-8', 'hex');
  encrypted += cipher.final('hex');

  async function createUser() {
    try {
      await client.connect();
      const addUser = await client.db('userDB').collection('users').insertOne({username: req.body.username, password: encrypted});
      console.log('User registered in database.');
    } catch (err) {
      console.log(err);
    } finally {
      await client.close();
    }
  }

  createUser();
  res.render("secrets");
});







app.listen(3000, function() {
  console.log('Server started on port 3000.');
});
