//jshint esversion:6
// order is important
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
require('dotenv').config();
const mongoose = require("mongoose");
const session = require('express-session');
const passport= require("passport");
const passportLocalMongoose = require("passport-local-mongoose");// we dont need to expose passport-local explicitely bcoz passport-local-mong..already have the dependencies
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');


app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');


// app.set('trust proxy', 1)         // use it if on https connection and also make sure secure must be true.. secure: true
// setup for session
app.use(session({
  secret: 'find the secret.',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// initialise passport
app.use(passport.initialize());
// managing passport with sessions
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema = new mongoose.Schema({
  email: String,
  password:String,
  googleId:String,
  secret: String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User= mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser(function(user, done) {
    done(null, user.id);

});
// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:4000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", function(req,res){
  res.render("home");
});
app.get("/auth/google",
  passport.authenticate('google', {scope: ["profile"]})
);
app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });
app.get("/login", function(req,res){
  res.render("login");
});
app.get("/register", function(req,res){
  res.render("register");
});
app.get("/secrets", function(req,res){
  User.find({"secret": {$ne: null}}, function(err, foundUsers){
    if(err){
      console.log(err);
    } else{
      if(foundUsers){
        res.render("secrets",{usersWithSecrets: foundUsers});
      }
    }
  });
});
app.get("/logout", function(req,res){
  req.logout();
  res.redirect("/");
});
app.get("/submit",function(req,res){
  if(req.isAuthenticated()){
    res.render("submit");
  } else {
    res.redirect("/login");
  }
});

app.post("/submit",function(req,res){
  const submittedSecret= req.body.secret;

  User.findById(req.user.id, function(err, foundUser){
    if(err){
      console.log(err);
    } else{
      if(foundUser){
        foundUser.secret=submittedSecret;
        foundUser.save(function(){
          res.redirect("/secrets");
        });
      }
    }
  });
});
app.post("/register",function(req,res){

  User.register({username:req.body.username}, req.body.password, function(err,user){
    if(err){
      console.log(err);
      res.redirect("/register");
    } else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});

app.post("/login", function(req,res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if(err){
      console.log(err);
    }
    else{
      passport.authenticate("loacal")(req, res, function(){
        res.redirect("/secrets");
      });
    }
  });

});



app.listen("4000", function(req,res){
  console.log("server is running on port 4000");
});
