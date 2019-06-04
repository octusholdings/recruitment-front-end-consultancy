module.exports = GotoGrid = (async opt => {
	await opt.pageRef.goto(opt.baseDomainRef + opt.url)
	await opt.pageRef.waitForSelector('[role="gridcell"]', {timeout: 10000})
	.catch(err => { console.log('no record here') });
	return opt.pageRef
});