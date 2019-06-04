const gotoGrid  			= require('../GotoGrid');

module.exports = FindClientFromClientGrid = (async opt => {
	page = await gotoGrid(Object.assign(opt, {url: '/#/people/clients'}));

	let fieldNames = Object.keys(opt.findCcdWith);
	
	let kendoField = fieldNames.map(field => page
		.waitForSelector('[data-text-field="' + field + '"]')
		.then(() => page.type('[data-text-field="' + field + '"]', opt.findCcdWith[field]))
	);

	await Promise.all(kendoField);
	console.log('Finding candidate from candidateGrid:', opt.findCcdWith);
	return page.keyboard.down('Enter');
});