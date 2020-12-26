require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');

const authMiddleware = require('./authMiddleware');

const app = express();

const accountsPath = path.join(__dirname, 'accounts.json');
let accounts;
try {
	accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath).toString()) : [];
}
catch (e) {
	return console.log('Error: unable to load accounts file. See README.md for installation.');
}

app.use(helmet({ contentSecurityPolicy: false }));
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.use('semantic', express.static(path.join(__dirname, 'node_modules')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: true
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('view options', {
	layout: false
});

app.use(authMiddleware);


app.get('/', (req, res) => {
	res.render('index');
});
app.get('/configs', (req, res) => {
	res.render('configs');
});
app.get('/mods', (req, res) => {
	res.render('mods');
});
app.get('/login', (req, res) => {
	res.render('login');
});
app.post('/login', (req, res) => {
	if (!('username' in req.body) || !('password' in req.body))
		return res.render('login');
	if (accounts.filter(account => account.username === req.body.username && account.password === sha512(req.body.password)).length === 1) {
		req.session.logged = true;
		req.session.username = req.body.username;
		res.redirect('/');
	}
	else
		res.render('login', { error: 'Invalid username or password.' });
});

app.get('*', (req, res) => {
	res.status(404).render('404', { session: req.session });
});

app.listen(process.env.PORT, () => {
	console.log('Server listening on port ' + process.env.PORT + '.')
});


function sha512(text) {
	return crypto.createHash('sha512').update(text).digest('hex');
}