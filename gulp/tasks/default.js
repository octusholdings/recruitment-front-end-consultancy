const gulp 			= require('gulp');
const argv 			= require('yargs').argv;
const runSequence   = require('run-sequence');
const util          = require('gulp-util');

gulp.task('default', () => {
	runSequence(
		'help',
		'readme'
	);
});

gulp.task('readme', () => {
util.log(`

${util.colors.white.bgRed.bold(' Welcome! Readme! ')}

If this is the first time you running this, please ensure that you have the required package. Always delete the node_modules folder:

  ${util.colors.grey('sudo rm -rf node_modules/')}

...then begin by installing all the required packages

  ${util.colors.grey('sudo npm install')}

Also ensure that 1) your backend (Octus Recruitment Cloud instance) is running properly, 2) is on the right branch, 3) have the right database, 4) have mongoDB running and have elasticSearch running. If one of them is not running properly, please contact one of the backend guys who will be more than happy to help you! ^_^

${util.colors.black.bgYellow.bold(' To run for development: ')}

  ${util.colors.grey('gulp clean && gulp dev-run --dev')}

${util.colors.black.bgYellow.bold(' To run for development with minified js files: ')}

  ${util.colors.grey('gulp clean && gulp dev-run --dev --min')}

${util.colors.black.bgYellow.bold(' To run without browsersync: ')}

  ${util.colors.grey('gulp clean && gulp dev-run --dev --nginx')}

As the param suggest this is especially useful when you want to run via proxy, NGIX or ngrok. You wont need browsersync to keep on refreshing. For running with nginx you need nginx to run together with ngrok.

1) run ngrok from your terminal: ${util.colors.grey(' ./ngrok http 80 ')}
Port 80 is the default port for nginx
ngrok will randomly generate a fake url: xxxxxxxx.ngrok.io

2) Ensure that in your nginx configuration .conf file you have your server properly setup:
- Make sure that the server name uses the generated ngrok url xxxxxxxx.ngrok.io

${util.colors.grey(`server {
  server_name  xxxxxxxx.ngrok.io;
  root     /folder/to/recruitment-front-end/nginx;

  location / {
    index  index.html;
  }

  location /server {
    proxy_set_header X-Real-IP  $remote_addr;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header Host $host;
    proxy_pass http://localhost:8080;
  }
}`)}

3) Check your ${util.colors.grey(' cors.allowOrigin ')} variable. This can be found in octus.local-dev.properties file in the BackEnd repository. Make sure it the variable points to ur ngrok fake url like so:
${util.colors.grey(' cors.allowOrigin=https://xxxxxxxx.ngrok.io ')}

4) Run EVERYTHING!
- running nginx ${util.colors.grey(' sudo nginx ')}
- running frontend with ${util.colors.grey(' --nginx ')} argument Run backend
- running backend as per normal

7) Navigate to xxxxxxxx.ngrok.io/ui in your browser. And pray hard it works.

${util.colors.black.bgYellow.bold(' To bundle for production: ')}

  ${util.colors.grey('gulp clean && gulp dev-run --prod && gulp package')}

`)
});