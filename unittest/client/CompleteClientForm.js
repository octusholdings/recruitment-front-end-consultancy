const faker			= require('faker');
const redefineNode 	= require('../RedefineNode');
const _ 			= require('underscore');

module.exports = CompleteClientForm = (async opt => {
	let testEmail = 'wan.wanted.1';
	let testEmailDomain = '@gmail.com';

	await opt.pageRef.waitFor(4000);

	await Promise.all([
		opt.pageRef.waitForSelector("input#firstName"),
		opt.pageRef.waitForSelector("input#lastName"),
		opt.pageRef.waitForSelector("input.company-typeahead.form-control.tt-input")
	]) 

	let lastName = faker.name.lastName();

	await opt.pageRef.type('input#firstName', 'Puppeteer');
	await opt.pageRef.type('input#lastName', lastName);
	await opt.pageRef.type("input.company-typeahead.form-control.tt-input", "p");
	await opt.pageRef.waitForSelector("li.form-group.Company .tt-menu", {visible: true});
	await opt.pageRef.waitForSelector("li.form-group.Company .tt-menu div.tt-suggestion", {visible: true});
	await opt.pageRef.click("li.form-group.Company .tt-menu div.tt-suggestion:first-child");

	await opt.pageRef.click('button.add-new-email-address');

	await Promise.all([
		opt.pageRef.waitForSelector("#email-address-content select.type"),
		opt.pageRef.waitForSelector("#email-address-content input.form-control.address")
	]) 
	let emailTypeLength = await opt.pageRef.$$eval("#email-address-content select.type option", options => options.length);
	let randEmailType = Math.floor(Math.random() * (emailTypeLength - 2 + 1)) + 2;
	let randEmailTypeValue = await opt.pageRef.$eval("#email-address-content select.type option:nth-child(" + randEmailType + ")", el => el.value);
	
	await opt.pageRef.select('#email-address-content select.type', randEmailTypeValue);

	let randTestEmail = () => {
		let idx = Math.floor(Math.random() * (testEmail.length - 2 + 1)) + 2;
		return testEmail.slice(0, idx) + '.' + testEmail.slice(idx) + testEmailDomain;
	}
	
	await opt.pageRef.type('#email-address-content input.form-control.address', randTestEmail());
	await opt.pageRef.click('#email-address-content #add-email-address');


	console.log("Saving New Client: " + 'Puppeteer ' + lastName);
	await opt.pageRef.evaluate(redefineNode);	
	await opt.pageRef.click('.client-form-buttons .btn.button-save');
	return opt.pageRef.waitFor(4000);
})