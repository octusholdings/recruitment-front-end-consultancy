const redefineNode 			= require('../RedefineNode');

module.exports = KendoGridSelectAll = (async config => {
	await config.pageRef.waitForSelector('#menu .k-item.k-state-default.selectAll');
	await config.pageRef.evaluate(redefineNode);	
	console.log('Kendo Grid > SelectAll')
	return config.pageRef.click('#menu .k-item.k-state-default.selectAll');
});