//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const app = express();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds=5;

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine','ejs');

mongoose.connect("mongodb://localhost:27017/userDB");   //mongodb://localhost:27017/wikiDB"

const userSchema = new mongoose.Schema({
  email: String,
  password:String
});



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

bcrypt.hash(req.body.password, saltRounds, function(err,hash){
  const newUser= new User({
    email: req.body.username,
    password: hash
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
        bcrypt.compare(password, foundUser.password, function(err, result) {
          if(result=== true){
            res.render("secrets");
          }
      });

      }
    }
  });
});


app.listen("4000", function(req,res){
  console.log("server is running on port 4000");
});
