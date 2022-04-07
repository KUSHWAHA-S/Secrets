//jshint esversion:6

require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');

mongoose.connect("mongodb://localhost:27017/userDB");   //mongodb://localhost:27017/wikiDB"

const userSchema = new mongoose.Schema({
  email: String,
  password:String
});


userSchema.plugin(encrypt, { secret: process.env.SECRET, encryptedFields: ["password"]});

const User= mongoose.model("User",userSchema);

app.get("/", function(req,res){
  res.render("home");
});
app.get("/login", function(req,res){
  res.render("login");
});
app.get("/register", function(req,res){
  res.render("register");
});

app.post("/register",function(req,res){

  const newUser= new User({
    email: req.body.username,
    password: req.body.password
  });

  newUser.save(function(err){
    if(!err){
      res.render("secrets");
    }
    else{
      console.log("not saved! some error ouccured ");
       }
  });

});

app.post("/login", function(req,res){
  const username=req.body.username;
  const password=req.body.password;

  User.findOne({email: username}, function(err,foundUser){
    if(err){
      console.log(err);
    }
    else {
      if(foundUser){
        if(foundUser.password === password){
          res.render("secrets");
        }
      }
    }
  });
});


app.listen("4000", function(req,res){
  console.log("server is running on port 4000");
});
