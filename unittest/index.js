const puppeteer 			= require('puppeteer');
const _ 					= require('underscore');
const redefineNode 			= require('./RedefineNode');
const gotoGrid  			= require('./GotoGrid');
const loginOctus  			= require('./LoginOctus');

const newComFromComGrid 	= require('./companyGridView/CreateNewCompanyFromCompanyGrid');
const completeComForm 		= require('./company/CompleteCompanyForm');

const newCcdFromCcdGrid 	= require('./candidateGridView/CreateNewCandidateFromCandidateGrid');
const completeCcdForm 		= require('./candidate/CompleteCandidateForm');
const uploadDocToCcd 		= require('./candidate/UploadDocumentToCandidate');

const newCliFromCliGrid 	= require('./clientGridView/CreateNewClientFromClientGrid');
const completeCliForm 		= require('./client/CompleteClientForm');

const selectCcdFromCcdGrid 	= require('./candidateGridView/SelectCandidateFromCandidateGrid');
const findCcdFromCcdGrid 	= require('./candidateGridView/FindCandidateFromCandidateGrid');

const gridSelectAll  		= require('./kendoGridView/KendoGridSelectAll');
const gridMassMail 			= require('./kendoGridView/KendoGridMassMail');
const gridDeleteMultiple 	= require('./kendoGridView/KendoGridDeleteMultiple');
const gridClearFilter 		= require('./kendoGridView/KendoGridClearFilter');

const findCliFromCliGrid 	= require('./clientGridView/FindClientFromClientGrid');

let page;
let config = {
	pageRef: page, 
	// baseDomainRef: 'http://demo.octus.io/ui'
	baseDomainRef: 'http://localhost:4567/'
};

(async () => {
	page = await loginOctus(config);

	// Describe the test scenario
	console.log(`========== TEST MASS MAIL ==========`)

	await newCcdFromCcdGrid(config);
	await completeCcdForm(config);

	await newCcdFromCcdGrid(config);
	await completeCcdForm(config);

	await newCcdFromCcdGrid(config);
	await completeCcdForm(config);

	await newCcdFromCcdGrid(config);
	await completeCcdForm(config);

	await newCcdFromCcdGrid(config);
	await completeCcdForm(config);

	await newComFromComGrid(config);
	await completeComForm(config);

	await newCliFromCliGrid(config);
	await completeCliForm(config);

	await newCliFromCliGrid(config);
	await completeCliForm(config);

	await newCliFromCliGrid(config);
	await completeCliForm(config);

	await newCliFromCliGrid(config);
	await completeCliForm(config);

	await findCcdFromCcdGrid(Object.assign(config, {findCcdWith: {firstName: 'Puppeteer'}}));
	await gridSelectAll(config);
	await gridMassMail(config);
	await gridClearFilter(config);

	await page.waitFor(4000);

	await findCcdFromCcdGrid(Object.assign(config, {findCcdWith: {firstName: 'Puppeteer'}}));
	await gridSelectAll(config);
	await gridDeleteMultiple(config);

	await page.waitFor(10000);

	await gridClearFilter(config);

	await findCliFromCliGrid(Object.assign(config, {findCcdWith: {firstName: 'Puppeteer'}}));
	await gridSelectAll(config);
	await gridMassMail(config);
	await gridClearFilter(config);

	await page.waitFor(4000);

	await findCliFromCliGrid(Object.assign(config, {findCcdWith: {firstName: 'Puppeteer'}}));
	await gridSelectAll(config);
	await gridDeleteMultiple(config);

	await page.waitFor(10000);

	await gridClearFilter(config);

	console.log('Test Complete')
})()