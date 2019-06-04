Gem::Specification.new do |s|
  s.name = "bootstrap-sass"
  s.version = '2.3.1.0'
  s.authors = ["Thomas McDonald"]
  s.email = 'tom@conceptcoding.co.uk'
  s.summary = "Twitter's Bootstrap, converted to Sass and ready to drop into Rails or Compass"
  s.homepage = "http://github.com/thomas-mcdonald/bootstrap-sass"
  s.license = "Apache 2.0"

  s.add_development_dependency 'compass'
  s.add_development_dependency 'sass-rails', '~> 3.2'
  s.add_runtime_dependency     'sass',       '~> 3.2'

  s.files = Dir["vendor/**/*.{scss,js,png}"] + Dir["lib/**/*"] + Dir["templates/**/*"] + ["README.md", "LICENSE"]
end