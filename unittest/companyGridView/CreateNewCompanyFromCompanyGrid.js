const gotoGrid  			= require('../GotoGrid');
const redefineNode 			= require('../RedefineNode');

module.exports = CreateNewCompanyFromCompanyGrid = (async config => {
	page = await gotoGrid(Object.assign(config, {url: '/#/company/search'}));
	await page.evaluate(redefineNode);
	await page.waitFor(4000);
	await Promise.all([
		page.waitForSelector("#create-company")
	]) 
	return page.click("#create-company");
});