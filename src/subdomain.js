import { routers } from './router';

const detectsubdomain = async function detectsubdomain (ctx, next) {
	let [subdomain = 'www'] = ctx.request.subdomains;
	ctx.subdomain = subdomain;
	if (ctx.request.origin.indexOf(configuration.server.host) > -1) {
		ctx.response.set('Access-Control-Allow-Origin', ctx.request.origin);
		ctx.response.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	}
	await routers(ctx.subdomain).secured.call(ctx, next);
	await routers(ctx.subdomain).public.call(ctx, next);
	await next();
};
export default detectsubdomain;
