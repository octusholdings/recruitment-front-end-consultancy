const puppeteer 	= require('puppeteer');
const redefineNode 	= require('./redefineNode');

module.exports = LoginOctus = (async (opt) => {
	let browser

	browser = await puppeteer.launch({headless: false});

	opt.pageRef = await browser.newPage();

	await opt.pageRef.setViewport({ width: 1366, height: 768});
	await opt.pageRef.goto(opt.baseDomainRef, {waitUntil: 'networkidle2'});
		
	return Promise.all([
		opt.pageRef.waitForSelector('#username'),
		opt.pageRef.waitForSelector('#password'),
		opt.pageRef.waitForSelector('#sendLogin'),
	]).then(async () => {
		await opt.pageRef.type('#username', 'octus');
		await opt.pageRef.type('#password', 'password');
		await opt.pageRef.evaluate(redefineNode);
		await opt.pageRef.click('#sendLogin');
		await opt.pageRef.waitForSelector('#leftMenuItems');
		return opt.pageRef;
	});
});