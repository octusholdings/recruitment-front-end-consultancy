const gotoGrid  			= require('../GotoGrid');
const redefineNode 			= require('../RedefineNode');

module.exports = CreateNewCandidateFromCandidateGrid = (async config => {
	page = await gotoGrid(Object.assign(config, {url: '/#/people/candidates'}));
	await page.evaluate(redefineNode);
	await page.waitFor(4000);
	await Promise.all([
		page.waitForSelector("#create-candidate")
	])
	return page.click("#create-candidate");
});