module.exports = KendoGridDeleteMultiple = (async opt => {
	await opt.pageRef.click('.k-item.massDelete');
	await opt.pageRef.click('.confirm-delete');
	console.log('Kendo Grid > delete multiple!')
	await opt.pageRef.waitForSelector("#defaultModal", {hidden: true});
});