const gotoGrid  			= require('../GotoGrid');
const redefineNode 			= require('../RedefineNode');

module.exports = CreateNewClientFromClientGrid = (async config => {
	page = await gotoGrid(Object.assign(config, {url: '/#/people/clients'}));
	await page.evaluate(redefineNode);
	await page.waitFor(4000);
	await Promise.all([
		page.waitForSelector("#create-client")
	]) 
	return page.click("#create-client");
});