const fs = require('fs');
const path = require('path');
const readline = require('readline');
const Writable = require('stream').Writable;
const crypto = require('crypto');


const argv = process.argv.slice(2);
if (argv.length < 1 || argv.length > 2 || (argv.length === 2 && argv[1] !== 'remove'))
	return console.log('Syntax: node manage-account <username> [remove]');
const username = argv[0];

const accountsPath = path.join(__dirname, 'accounts.json');
let accounts;
try {
	accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath).toString()) : [];
}
catch (e) {
	return console.log('Error: unable to load accounts file.');
}

if (argv.length > 1) {
	accounts = accounts.filter(account => account.username !== username);
	try {
		fs.writeFileSync(accountsPath, JSON.stringify(accounts));
	}
	catch (e) {
		return console.log('Error: unable to save accounts file.');
	}
	return console.log('Account "' + username + '" deleted.');
}

if (accounts.filter(account => account.username === username).length > 0)
	console.log('Waring: account "' + username + '" is already registered!\nYou\'re going to replace the password of this account.');

enterPassword('Password: ').then(password => {
	enterPassword('Confirm password: ').then(confirmPassword => {
		if (password !== confirmPassword)
			return console.log('Passwords do not match.');
		accounts = accounts.filter(account => account.username !== username);
		accounts.push({ username, password: sha512(password) })
		try {
			fs.writeFileSync(accountsPath, JSON.stringify(accounts));
		}
		catch (e) {
			return console.log('Error: unable to save accounts file.');
		}
		console.log('Account "' + username + '" registered.');
	});
});


function enterPassword(caption = 'Password: ') {
	return new Promise(resolve => {
		const mutableStdout = new Writable({
			write: function(chunk, encoding, callback) {
				if (!this.muted)
					process.stdout.write(chunk, encoding);
				callback();
			}
		});
		
		mutableStdout.muted = false;
		
		const rl = readline.createInterface({
			input: process.stdin,
			output: mutableStdout,
			terminal: true
		});
		
		rl.question(caption, (password) => {
			resolve(password);
			rl.close();
			console.log('');
		});
		
		mutableStdout.muted = true;
	});
}
function sha512(text) {
	return crypto.createHash('sha512').update(text).digest('hex');
}