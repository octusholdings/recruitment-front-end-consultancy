const faker		= require('faker');
const _ 		= require('underscore');

module.exports = CompleteCandidateForm = (async opt => {
	let testEmail = 'mdhilwan';
	let testEmailDomain = '@gmail.com';

	await Promise.all([
		opt.pageRef.waitForSelector("select#salutation"),
		opt.pageRef.waitForSelector("input.form-control.firstName"),
		opt.pageRef.waitForSelector("input.form-control.lastName"),
		opt.pageRef.waitForSelector("select#source"),
		opt.pageRef.waitForSelector("select#status"),
		opt.pageRef.waitForSelector("select#maritalStatus"),
		opt.pageRef.waitForSelector("select#gender"),
		opt.pageRef.waitForSelector("button.add-new-email-address")
	]) 

	let salutationLength = await opt.pageRef.$$eval("select#salutation option", options => options.length);
	let randSalutation = Math.floor(Math.random() * (salutationLength - 2 + 1)) + 2;
	let randSalutationValue = await opt.pageRef.$eval("select#salutation option:nth-child(" + randSalutation + ")", el => el.value);

	let sourceLength = await opt.pageRef.$$eval("select#source option", options => options.length);
	let randSource = Math.floor(Math.random() * (sourceLength - 2 + 1)) + 2;
	let randSourceValue = await opt.pageRef.$eval("select#source option:nth-child(" + randSource + ")", el => el.value);

	let statusLength = await opt.pageRef.$$eval("select#status option", options => options.length);
	let randStatus = Math.floor(Math.random() * (statusLength - 2 + 1)) + 2;
	let randStatusValue = await opt.pageRef.$eval("select#status option:nth-child(" + randStatus + ")", el => el.value);

	let maritalStatusLength = await opt.pageRef.$$eval("select#maritalStatus option", options => options.length);
	let randMaritalStatus = Math.floor(Math.random() * (maritalStatusLength - 2 + 1)) + 2;
	let randMaritalStatusValue = await opt.pageRef.$eval("select#maritalStatus option:nth-child(" + randMaritalStatus + ")", el => el.value);

	let genderLength = await opt.pageRef.$$eval("select#gender option", options => options.length);
	let randGender = Math.floor(Math.random() * (genderLength - 2 + 1)) + 2;
	let randGenderValue = await opt.pageRef.$eval("select#gender option:nth-child(" + randGender + ")", el => el.value);

	let lastName = faker.name.lastName();

	await opt.pageRef.select('select#salutation', randSalutationValue);
	await opt.pageRef.type('input.form-control.firstName', 'Puppeteer');
	await opt.pageRef.type('input.form-control.lastName', lastName);
	await opt.pageRef.select('select#source', randSourceValue);
	await opt.pageRef.select('select#status', randStatusValue);
	await opt.pageRef.select('select#maritalStatus', randMaritalStatusValue);
	await opt.pageRef.select('select#gender', randGenderValue);

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

	// await Promise.all([
	// 	opt.pageRef.waitForSelector("#industry-list input.select2-search__field"),
	// 	opt.pageRef.waitForSelector("#jobFunction-list input.select2-search__field"),
	// 	opt.pageRef.waitForSelector("#skill-list input.select2-search__field"),
	// 	opt.pageRef.waitForSelector("#location-list input.select2-search__field"),
	// 	opt.pageRef.waitForSelector("#location-list input.select2-search__field"),
	// 	opt.pageRef.waitForSelector("#seekingLocation-list input.select2-search__field")
	// ])

	// let vowals = ['a','e','i','o','u'];

	// await opt.pageRef.type("#industry-list input.select2-search__field", _.sample(vowals, 1));
	// await opt.pageRef.waitForSelector("#select2-selectIndustry-results>li");

	// await opt.pageRef.waitFor(4000);

	// let industryLength = opt.pageRef.$$eval("#select2-selectIndustry-results>li", els => els.length);
	// let randIndustry = Math.floor(Math.random() * (industryLength - 1 + 1)) + 1;
	
	// await opt.pageRef.click("#select2-selectIndustry-results>li:nth-child(" + randIndustry + ")");

	console.log("Saving New Candidate: Puppeteer " + lastName);
	await opt.pageRef.click('#save-button');
	return opt.pageRef.waitFor(4000);
})