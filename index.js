require('dotenv').config();
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();

app.use(helmet());
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.use('semantic', express.static(path.join(__dirname, 'node_modules')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
	secret: 'WKToEp772uzyohiz2hnb0OTYoRDuCOObl',
	resave: false,
	saveUninitialized: true
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'pug');
app.set('view options', {
	layout: false
});


app.get('/', (req, res) => {
	res.redirect('/login');
});
app.get('/login', (req, res) => {
	res.render('login');
});

app.get('*', (req, res) => {
	res.status(404).render('404', { session: req.session });
});

app.listen(process.env.PORT, () => {
	console.log('Server listening on port ' + process.env.PORT + '.')
});