require('dotenv').config();
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const session = require('express-session');
const apacheApi = require('apache-api')(process.env.APACHE_PATH || '/etc/apache2');

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
app.use('/node_modules/codemirror-mode-apache', express.static(path.join(__dirname, '/node_modules/codemirror-mode-apache')));
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
app.post('/', async (req, res) => {
	if ('restart' in req.body) {
		await apacheApi.actions.restartApache();
		res.render('index', { restart: true });
	}
	else if ('start' in req.body) {
		await apacheApi.actions.startApache();
		res.render('index', { start: true });
	}
	else if ('stop' in req.body) {
		await apacheApi.actions.stopApache();
		res.render('index', { stop: true });
	}
	else if ('status' in req.body) {
		const status = await apacheApi.actions.statusApache();
		res.render('index', { status });
	}
	else
		res.render('index');
});

app.get('/configs', async (req, res) => {
	const [availableConfigs, enabledConfigs] = await Promise.all([
		apacheApi.configs.listAvailable(),
		apacheApi.configs.listEnabled()
	]);
	res.render('configs',{ availableConfigs, enabledConfigs });
});
app.post('/configs', async (req, res) => {
	if ('enable' in req.body && 'config' in req.body) {
		await apacheApi.configs.enable(req.body.config);
		const [availableConfigs, enabledConfigs] = await Promise.all([
			apacheApi.configs.listAvailable(),
			apacheApi.configs.listEnabled()
		]);
		res.render('configs', { availableConfigs, enabledConfigs, enabled: req.body.config });
	}
	else if ('disable' in req.body && 'config' in req.body) {
		await apacheApi.configs.disable(req.body.config);
		const [availableConfigs, enabledConfigs] = await Promise.all([
			apacheApi.configs.listAvailable(),
			apacheApi.configs.listEnabled()
		]);
		res.render('configs', { availableConfigs, enabledConfigs, disabled: req.body.config });
	}
	else
		res.render('configs');
});
app.get('/configs/:name', async (req, res) => {
	const name = req.params.name;
	const config = await apacheApi.configs.readConfig(name, false, false);
	res.render('config', {
		configName: name,
		configContent: config
	});
});
app.post('/configs/:name', async (req, res) => {
	const name = req.params.name;
	let config = await apacheApi.configs.readConfig(name, false, false);
	let saved = false;
	if (req.body['config-code']) {
		config = req.body['config-code'];
		await apacheApi.configs.saveConfig(name, config, false, false);
		saved = true;
	}
	res.render('config', {
		configName: name,
		configContent: config,
		saved
	});
});

app.get('/mods', async (req, res) => {
	const [availableMods, enabledMods] = await Promise.all([
		apacheApi.mods.listAvailable(),
		apacheApi.mods.listEnabled()
	]);
	res.render('mods',{ availableMods, enabledMods });
});
app.post('/mods', async (req, res) => {
	if ('enable' in req.body && 'mod' in req.body) {
		await apacheApi.mods.enable(req.body.mod);
		const [availableMods, enabledMods] = await Promise.all([
			apacheApi.mods.listAvailable(),
			apacheApi.mods.listEnabled()
		]);
		res.render('mods', { availableMods, enabledMods, enabled: req.body.mod });
	}
	else if ('disable' in req.body && 'mod' in req.body) {
		await apacheApi.mods.disable(req.body.mod);
		const [availableMods, enabledMods] = await Promise.all([
			apacheApi.mods.listAvailable(),
			apacheApi.mods.listEnabled()
		]);
		res.render('mods', { availableMods, enabledMods, disabled: req.body.mod });
	}
	else
		res.render('mods');
});

app.get('/sites', async (req, res) => {
	const [availableSites, enabledSites] = await Promise.all([
		apacheApi.configs.listAvailable(true),
		apacheApi.configs.listEnabled(true)
	]);
	res.render('sites',{ availableSites, enabledSites });
});
app.post('/sites', async (req, res) => {
	if ('enable' in req.body && 'site' in req.body) {
		await apacheApi.configs.enable(req.body.site, true);
		const [availableSites, enabledSites] = await Promise.all([
			apacheApi.configs.listAvailable(true),
			apacheApi.configs.listEnabled(true)
		]);
		res.render('sites', { availableSites, enabledSites, enabled: req.body.site });
	}
	else if ('disable' in req.body && 'site' in req.body) {
		await apacheApi.configs.disable(req.body.site, true);
		const [availableSites, enabledSites] = await Promise.all([
			apacheApi.configs.listAvailable(true),
			apacheApi.configs.listEnabled(true)
		]);
		res.render('sites', { availableSites, enabledSites, disabled: req.body.site });
	}
	else
		res.render('sites');
});
app.get('/sites/:name', async (req, res) => {
	const name = req.params.name;
	const site = await apacheApi.configs.readConfig(name, true, false);
	res.render('site', {
		siteName: name,
		siteContent: site
	});
});
app.post('/sites/:name', async (req, res) => {
	const name = req.params.name;
	let site = await apacheApi.configs.readConfig(name, true, false);
	let saved = false;
	if (req.body['site-code']) {
		site = req.body['site-code'];
		await apacheApi.configs.saveConfig(name, site, true, false);
		saved = true;
	}
	res.render('site', {
		siteName: name,
		siteContent: site,
		saved
	});
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