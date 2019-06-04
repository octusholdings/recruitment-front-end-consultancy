const redefineNode 	= require('../RedefineNode');

module.exports = UploadDocumentToCandidate = (async opt => {
	await opt.pageRef.waitForSelector('li.document-tab');
	await opt.pageRef.evaluate(redefineNode);
	await opt.pageRef.click('li.document-tab');
	const fileUploadEle = await opt.pageRef.waitForSelector('input#fileUpload');
	// await fileEle.uploadFile(...);
});