module.exports = KendoGridClearFilter = (async opt => {
	console.log('Kendo Grid > clear filter!')
	await opt.pageRef.click('.k-item.clearFilter');
});