const express = require("express");
const ejs = require('ejs');
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require('passport');
const passportLocalMongoose = require('passport-local-mongoose');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require("passport-facebook").Strategy;
var findOrCreate = require('mongoose-findorcreate')
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();
app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
  secret: 'My little secret',
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://admin-aryaman:puru1234@cluster0.zh3kk.mongodb.net/loginDB", { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
  googleId: String,
  facebookId: String
});

userSchema.plugin(passportLocalMongoose, {usernameUnique: false});
userSchema.plugin(findOrCreate);


const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

passport.use(new GoogleStrategy({
    clientID: "526319799152-m84rm5bo9rrcvi81p4gakrodqtnbn3vp.apps.googleusercontent.com",
    clientSecret: "LArahRh10aCMAgyFRIvgTKGI",
    callbackURL: "http://localhost:3000/auth/google/success",
    username: "email",
    password: "password",
    scope: "https://www.googleapis.com/auth/plus.login",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id, username: profile.id }, function(err, user) {

return cb(err, user);

});
  }
));

passport.use(new FacebookStrategy({
    clientID: "149399460488918",
    clientSecret: "262f5d830f9012b4f369424c638f9e43",
    callbackURL: "http://localhost:3000/auth/facebook/success"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));



app.get("/", function(req, res){

  res.sendFile(__dirname+"/home.html");
});

app.get('/auth/google',
  passport.authenticate('google', { scope: [ 'email', 'profile' ] }));


app.get('/auth/google/success',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect success page.
    res.redirect('/success');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook'));

app.get('/auth/facebook/success',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect success.
    res.redirect('/success');
  });

app.get("/register", function(req, res){

  res.sendFile(__dirname+"/register.html");
});

app.get("/login", function(req, res){

  res.sendFile(__dirname+"/login.html");
});

app.get("/success", function(req, res){

  if(req.isAuthenticated()){
    res.sendFile(__dirname+"/success.html");
  }
  else{
    res.redirect("/login");
  }

});

app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});


app.post("/register", function(req, res){

  User.register({username: req.body.username}, req.body.password, function(err, user) {

    if(err){
      console.log(err);
      res.redirect("/register");
    }
    else{
      passport.authenticate("local")(req, res, function(){
        res.redirect("/success");
      });


    }
  });



//   bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//     // Store hash in your password DB.
//
//     var user = new User({
//       email: req.body.email,
//       password: hash
//     });
//
//     user.save();
//     res.redirect("/success");
// });


});

app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err) {
  if (err) {
    console.log(err);
    res.redirect("/login");
  }
  else {
    passport.authenticate("local")(req, res, function(){
      res.redirect("/success");
    });
  }

});
});

var PORT = process.env.PORT || 3000;
app.listen(PORT, function(){
  console.log("the server is running on port 3000");
});
