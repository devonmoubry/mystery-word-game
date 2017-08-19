const fs = require('fs');
const util = require('util');
const express = require('express');
const mustacheExpress = require('mustache-express');
const session = require('express-session');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const initialSessionState = require('./initial-session-state');

// Create 1. a list of ~250,000 words and 2. list of easy words, which we are
// defining as simply short words -- words between 4 and 6 characters in length.
const words = fs.readFileSync('/usr/share/dict/words', 'utf-8').toLowerCase().split('\n');
const easyWords = words.filter((word) => {
  return (word.length >= 4 && word.length <= 6);
});

// Function that returns a random word from the list of words passed to it
function getRandomWord(wordList) {
  return wordList[Math.floor(Math.random() * wordList.length)];
};

const app = express();
app.engine('mustache', mustacheExpress()); // Register '.mustache' extension with The Mustache Express
app.set('views', './views');
app.set('view engine', 'mustache');
app.use(bodyParser.urlencoded({ extended: false }));

// Setup validator for Express
// https://github.com/ctavan/express-validator
// https://github.com/chriso/validator.js
app.use(expressValidator({
  customValidators: {
    hasNotBeenGuessed: function(currentGuess, previousGuesses) {
      return !previousGuesses.includes(currentGuess);
    }
  }
}));

// Setup session for Express using their recommended default configuration -- in
// future versions of session, `resave` and `saveUninitalized` will be false
// by default: https://github.com/expressjs/session.
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: false,
}));

// Function that checks to see if the session object is in its default state,
// which looks like this if you have never been to the website before:
//
//     {
//       cookie: {
//         path: '/',
//         _expires: null,
//         originalMaxAge: null,
//         httpOnly: true
//       }
//     }
//
// If it's in this state, then we add in our additional state that we are
// defining in initial-session-state.js
function initializeSessionIfEmpty(session) {
  if (Object.keys(session).length === 1) {
    console.log('Initializing session state.');
    Object.assign(session, initialSessionState);
  }
}

app.get('/', (req, res) => {
  initializeSessionIfEmpty(req.session);

  // store new word in a session
  req.session.newWord = getRandomWord(easyWords);
  // // count number of characters in word
  req.session.wordLength = req.session.newWord.length;
  // // TODO: create array with underscores the same length as random word?
  req.session.newWord = req.session.newWord.split('');

  res.render('index', req.session);
})

app.post('/guess', (req, res) => {
  req.checkBody('guessInput', 'You must make a guess.').notEmpty();
  req.checkBody('guessInput', 'Your guess must be a letter.').isAlpha();
  req.checkBody('guessInput', 'Your guess must be exactly one letter.').isByteLength({ min: 1, max: 1 });
  req.checkBody('guessInput', 'You already guessed that').hasNotBeenGuessed(req.session.guessedLetters);
  req.getValidationResult().then(function(errors) {
    if (errors.isEmpty()) {
      console.log('Validator: No errors.');
      req.session.currentGuess = req.body.guessInput;
      req.session.guessedLetters.push(req.session.currentGuess);
    } else {
      console.log('Validator: Errors: ', util.inspect(errors.array()));
    }

    res.render('index', Object.assign({}, req.session, { errors: errors.array() }));
  });
});

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
