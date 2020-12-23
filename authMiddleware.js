function authMiddleware(req, res, next) {
	if (!req.session.logged && req.url !== '/login')
		res.redirect('/login');
	else
		next();
}

module.exports = authMiddleware;