const redefineNode 	= require('../RedefineNode');

module.exports = SelectCandidateFromCandidateGrid = (async opt => {
	let randRow = "#grid .k-grid-content tbody tr:nth-child(" + opt.index + ")";
	await opt.pageRef.waitForSelector(randRow);
	await opt.pageRef.evaluate(redefineNode);
	await opt.pageRef.click(randRow);
});