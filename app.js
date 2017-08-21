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

// Middleware function with no mount path. This code runs before every request.
app.use(function (req, res, next) {
  console.log('\n---------------------------');
  console.log('Request URL:', req.originalUrl);

  initializeSessionIfEmpty(req.session);

  console.log('Session object before request:', req.session);

  console.log('---------------------------');

  // Pass control to the next middleware function. Otherwise, the request will be left hanging.
  next();
});

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
    initializeSession(session);
  }
}

function initializeSession(session) {
  Object.assign(session, initialSessionState);
}

app.get('/', (req, res) => {
  //store new word in session
  // create array of objects with char
  req.session.newWord = initializeWord(getRandomWord(easyWords))
  console.log('what is newWord', req.session.newWord);
  res.render('index', req.session);
})

app.post('/guess', (req, res) => {
  // Render validation error messages
  req.checkBody('guessInput', 'You must make a guess.').notEmpty();
  req.checkBody('guessInput', 'Your guess must be a letter.').isAlpha();
  req.checkBody('guessInput', 'Your guess must be exactly one letter.').isByteLength({ min: 1, max: 1 });
  // check to see if guess matches letter in guessed array
  // if guess matches letter in guessed array display message
  req.checkBody('guessInput', 'You already guessed that').hasNotBeenGuessed(req.session.guessedLetters);
  req.getValidationResult().then(function(errors) {
    // if input is valid...
    if (errors.isEmpty()) {
      console.log('Validator: No errors.');
      req.session.currentGuess = req.body.guessInput;
      // add letter to guessed array
      req.session.guessedLetters.push(req.session.currentGuess);
      // check to see if input matches letter in session
      // if guess matches letter in mystery word display user message
      let badGuess = true;
      console.log('before map',req.session.newWord);
      req.session.newWord = req.session.newWord.map((letterObj) => {
        if (letterObj.letter == req.session.currentGuess) {
          letterObj.guessed = true;
          badGuess = false;
        }
        return letterObj;
      });
      console.log('after map',req.session.newWord);
      if (badGuess == true) {
        req.session.badGuesses++;
      }
      // check to see if user ran out of turns
      if (req.session.easyModeMaxGuesses == req.session.badGuesses) {
        // if user ran out of turns display You ran out of guesses.
        req.session.moreGuesses = false;
        // display full word from session
        // tell computer gameplay = false
        // if gameplay is false display button with message do you want to play again?
        req.session.gamePlay = false;
        req.session.win = false;
      }

      req.session.win = hasWon(req.session.newWord);
      req.session.gamePlay = gameIsAfoot(req.session.newWord);

      console.log('Win', req.session.win);

    } else {
      // display error messages: input is invalid
      console.log('Validator: Errors: ', util.inspect(errors.array()));
    }
    res.render('index', Object.assign({}, req.session, { errors: errors.array() }));
  });
});
// if word is guess display You did it!
function hasWon(letters) {
  return !letters.map(function(letterObj) {
    return letterObj.guessed;
  }).includes(false)
}
// check to see if user guesses the word
function gameIsAfoot(letters) {
  return letters.map(function(letterObj) {
    return letterObj.guessed;
  }).includes(false)
}
// if play again button is pressed page reloads with: new word, letters guessed array [], gamplay is true, new gameplay
app.post('/reset', (req, res) => {
  initializeSession(req.session);
  res.redirect('/');
})

function initializeWord(word) {
  let lettersArray = [];
  word.split('').forEach((letter) => {
    lettersArray.push( { letter: letter, guessed: false } )
  });
  return lettersArray;
}

app.listen(3000, function () {
  console.log('🍸  Party at http://localhost:3000...');
});
