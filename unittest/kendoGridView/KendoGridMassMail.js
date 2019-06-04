const redefineNode 	= require('../RedefineNode');

let waitTime = 2000;

module.exports = KendoGridMassMail = (async opt => {
	let massMailingSel = "#menu .massMailing"
	let massMailingDisabled = await opt.pageRef.$eval(massMailingSel, el => el.classList.contains('k-state-disabled'));

	if (massMailingDisabled) {
		console.error('None selected. Button still undefined');
	} else {
		await opt.pageRef.evaluate(redefineNode);
		await opt.pageRef.click(massMailingSel);

		await Promise.all([
			opt.pageRef.waitForSelector(".missing-email"),
			opt.pageRef.waitForSelector(".msg-title"),
			opt.pageRef.waitForSelector(".massMailing-message")
		]);

		await opt.pageRef.waitFor(waitTime);
		await opt.pageRef.evaluate(redefineNode);
		await opt.pageRef.click(".remove-missing-emails").then(() => {
			console.log('removing missing emails')
			return true;
		}, () => {
			console.log('no missing emails')
		})
		await opt.pageRef.type('.msg-title', 'Puppeteer Test Email Records');

		let templateLength = await opt.pageRef.$$eval("select#specJobTemplate option", options => options.length);
		let randTemplate = Math.floor(Math.random() * (templateLength - 2 + 1)) + 2;
		let randTemplateValue = await opt.pageRef.$eval("select#specJobTemplate option:nth-child(" + randTemplate + ")", el => el.value);

		await opt.pageRef.select("select#specJobTemplate", randTemplateValue);
		await opt.pageRef.evaluate(redefineNode);
		await opt.pageRef.click(".apply-template-btn");
		await opt.pageRef.evaluate(redefineNode);

		await opt.pageRef.waitFor(waitTime);
		await opt.pageRef.click(".confirm-send");

		console.log('Emailing candidate records from candidate grid');
		
		await opt.pageRef.waitForSelector("#defaultModal .modal-dialog", {hidden: true});
	}
});