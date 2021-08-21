//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
//have to keep bcrypt dependency to compare hashed passwords
//not using passport-local-mongoose which does all this for you ??
const bcrypt = require('bcrypt');
const saltRounds = 10;
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
const app = express();
app.use(express.static('public'));
app.use(express.urlencoded({extended:true}));
app.set('view engine', 'ejs');
//Setting up the session options
app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));
//Initialising passport and telling it to use the session
app.use(passport.initialize());
app.use(passport.session());
//Defining the local strategy for passport
passport.use(new LocalStrategy(
  function(username, password, done) {
    //Find user in database by username, return user object if found
    async function findUser() {
      try {
        await client.connect();
        let user = await client.db('userDB').collection('users').findOne({username});
        return user;
      } catch (err) {
        console.log(err);
      } finally {
        await client.close();
      }
    }
    //If user is found, compare entered password to saved password hash using bcrypt
    findUser().then(user => {
      //bcrypt.compare will return true or false as result
      bcrypt.compare(password, user.password, function(err, result) {
        if (result === true) {
          //Successful authentication, which then triggers successRedirect in /login route
          console.log('Logged in!');
          return done(null, user);
        } else {
          //Unsuccessful authentication, which then triggers failureRedirect in /login route
          return done(null, false, {message: 'Incorrect credentials.'});
        }
      })
    })
}));
//Creates session cookie
passport.serializeUser(function(user, done) {
  done(null, user);
});
//Destroys session cookie
passport.deserializeUser(function(id, done) {
  done(null, id)
});

const {MongoClient} = require('mongodb');
const uri = 'mongodb://localhost:27017';
const client = new MongoClient(uri);


app.get("/", function(req, res) {
  res.render('home');
});

app.get('/login', function(req, res, next) {
  res.render('login');
});

app.post('/login',
  //Checks if user sign in is valid, creates cookie and redirects if successful
  passport.authenticate('local', { successRedirect: '/secrets',
                                   failureRedirect: '/login'}));

app.get("/register", function(req, res) {
  res.render('register');
});

app.post("/register", function(req, res) {
  let user = {
    username: req.body.username,
    password: req.body.password
  }
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
    createUser()
  });
  req.login(user, function(err) {
    if (err) {
      console.log(err);
    } else {
      return res.redirect('/secrets');
    }
  });
});

app.get('/secrets', function(req, res) {
  res.render('secrets');
});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.listen(3000, function() {
  console.log('Server started on port 3000.');
});
