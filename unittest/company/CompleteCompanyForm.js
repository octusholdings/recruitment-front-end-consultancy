const faker			= require('faker');
const redefineNode 	= require('../RedefineNode');
const _ 			= require('underscore');

module.exports = CompleteCompanyForm = (async opt => {

	await opt.pageRef.waitFor(8000);

	await Promise.all([
		opt.pageRef.waitForSelector("input.form-control.name")
	]) 

	let name = 'Puppeteer ' + faker.company.companyName();

	await opt.pageRef.type('input.form-control.name', name);

	console.log("Saving New Company: " + name);
	await opt.pageRef.evaluate(redefineNode);	
	await opt.pageRef.click('input.btn.button-save');
	return opt.pageRef.waitFor(4000);
})