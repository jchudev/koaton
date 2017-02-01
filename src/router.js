import { sync as glob } from 'glob';
import * as path from 'upath';
import * as passport from 'koa-passport';
import KoatonRouter from './support/KoatonRouter';
import * as Router from 'koa-router';

let subdomainRouters;

function initialize () {
	subdomainRouters = {
		www: new KoatonRouter('www')
	};
	KoatonRouter.RestRouter = subdomainRouters.www;
	// for (const subdomain of configuration.server.subdomains) {
	// 	subdomainRouters[subdomain] = new KoatonRouter(subdomain, '.');
	// }
	let routers = glob('koaton_modules/**/routes.js').concat(glob('routes.js'));
	for (const router of routers) {
		let location = path.dirname(router);
		let PackageSubdomains = requireSafe(ProyPath(location, 'config', 'server.js'), {default: { subdomains: [] }}).default.subdomains;
		for (const subdomain of PackageSubdomains) {
			if (!subdomainRouters[subdomain]) {
				subdomainRouters[subdomain] = new KoatonRouter(subdomain);
			}
			subdomainRouters[subdomain].location(location);
		}
		require(ProyPath(router)).default(subdomainRouters, passport);
	}
	const allow = subdomainRouters.www.public.allowedMethods();

	let embers = glob('koaton_modules/**/config/ember.js').concat('config/ember.js');
	const serveapp = function (directory) {
		return async function serveEmberAPP (ctx, next) {
			await next();
			if (!ctx.body) {
				await ctx.render(directory);
			}
		};
	};
	// Load all ember apps
	for (const ember of embers) {
		const config = require(ProyPath(ember)).default;
		for (const app in config) {
			let emberapp = config[app];

			if (ember.indexOf('koaton_modules') > -1) {
				emberapp.directory = path.join('..', 'koaton_modules', app, 'views', 'ember_apps', config[app].directory);
			} else {
				emberapp.directory = path.join('ember_apps', config[app].directory);
			}
			const sub = emberapp.subdomain || 'www',
				approouter = new Router(),
				serveemberapp = serveapp(emberapp.directory);

			approouter.get('/', serveemberapp).get('*', serveemberapp);
			(emberapp.access === 'public' ? subdomainRouters[sub].public : subdomainRouters[sub].secured)
			.use(path.join('/', emberapp.mount), approouter.routes());
		}
	}
	for (const idx in subdomainRouters) {
		subdomainRouters[idx].public = subdomainRouters[idx].public.middleware();
		subdomainRouters[idx].secured = subdomainRouters[idx].secured.middleware();
	}
	return allow;
}

function routers (domain) {
	return subdomainRouters[domain];
}

export {
	initialize,
	routers
};
