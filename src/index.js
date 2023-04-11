const express = require('express');
const session = require('express-session');
const path = require('path');
const cookieParser = require('cookie-parser');
const { db } = require('./db');
const MySQLStore = require('express-mysql-session')(session);

const server = express();

server.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  resave: false,
  saveUninitialized: false,
  store: new MySQLStore({
    host: 'localhost',
    user: 'root',
    database: 'users'
  })
}));

server.use(express.static(path.resolve('public')));
server.use(express.urlencoded());
server.use(express.json());

function isAuthenticated (request, response, next) {
  if (request.session.user) {
    return next();
  }
  response.redirect('/login');
};

// Routes
server.get('/login', (req, res) => {
  res.sendFile(path.resolve('public/login.html'));
});
server.get('/dashboard', isAuthenticated, (req, res) => {
  res.sendFile(path.resolve('public/dashboard.html'));
});
server.get('/', (req, res) => {
  res.sendFile(path.resolve('public/index.html'));
});

server.post('/api/login', (req, res) => { 
  db.query(
    'SELECT * FROM users WHERE username = ? AND password = ?',
    [req.body.username, req.body.password],
    (err, results, fields) => {
      if (results === '') return res.redirect('/');
      results.forEach(user => {
        req.session.user = {user: user, loggedIn: true};
        req.session.save(function (err) {
          res.redirect('/dashboard');
        });
      });
    }
  );
});

server.post('/api/logout', (req, res) => {
  req.session.user = null
  req.session.save(err => {
    res.redirect('/');
  });
});

server.listen(3000, () => console.log('Connected'));