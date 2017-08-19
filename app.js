const express = require('express');
const mustacheExpress = require('mustache-express');
const session = require('express-session');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const fs = require('fs');

const app = express();
const words = fs.readFileSync("/usr/share/dict/words", "utf-8").toLowerCase().split("\n");

// Register '.mustache' extension with The Mustache Express
app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(bodyParser.urlencoded({ extended: false }));

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}))

app.use(expressValidator());

app.get('/', function (req, res) {
  res.render('index');
})

// TODO: Render validation error messages
// TODO: display error message: input is invalid, please try again. your guess must be 1 letter.
// TODO: if input is valid...
// TODO: check to see if guess matches letter in guessed array
// TODO: if guess matches letter in guessed array display message: you already guess that, please try again.
// TODO: check to see if input matches letter in session
// TODO: if guess matches letter in mystery word display user message
// TODO: rerender home with usermessage and updated game play board
// TODO: user message: _ is in the mystery word
// TODO: letter added to guessed array?
// TODO: if guess does not match letter in mystery word rerender page
// TODO: subtract 1 from guesses count
// TODO: add letter to guessed array
// TODO: check to see if user guesses the word
// TODO: if word is guess display You did it!
// TODO: check to see if user ran out of turns
// TODO: if user ran out of turns display You ran out of guesses.
// TODO: display full word from session
// TODO: tell computer gameplay = false
// TODO: if gameplay is false display button with message do you want to play again?
// TODO: if play again button is pressed page reloads with: new word, guess count 8, letters guessed array [], gamplay is true, new gameplay

app.listen(3000, function () {
  console.log('🍸  Party at http://localhost:3000...');
});
