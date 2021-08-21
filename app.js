//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const crypto = require('crypto');

const {MongoClient} = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);

const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
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
      let hash = foundUser.password;

      if (foundUser == undefined) {
        res.render('home');
      } else {
        bcrypt.compare(password, hash, function(err, result) {
          if (result === true) {
            res.render('secrets');
          } else if (result === false) {
            res.render('home');
          }
        });
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

  let password = bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    async function createUser() {
      try {
        await client.connect();
        const addUser = await client.db('userDB').collection('users').insertOne({username: req.body.username, password: hash});
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
});

app.listen(3000, function() {
  console.log('Server started on port 3000.');
});
