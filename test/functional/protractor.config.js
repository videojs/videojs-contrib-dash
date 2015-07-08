var config = {};

var netInterfaces = require('os').networkInterfaces(),
  externalIps = Object.keys(netInterfaces)
  .reduce(function(result, iface) {
    return result.concat(netInterfaces[iface]);
  }, [])
  .filter(function(iface) {
    return iface.family === 'IPv4' && !iface.internal;
  }),
  externalIp = externalIps[externalIps.length - 1].address;

if (process.env.TEAMCITY_VERSION) {
  config.seleniumAddress = 'http://10.1.12.30:4444/wd/hub';
}

config.baseUrl = 'http://' + externalIp + ':8000/tests/functional/';
config.specs = ['spec.js'];

config.framework = 'jasmine2';
config.jasmineNodeOpts = {
  showColors: true,
  defaultTimeoutInterval: 60000
};

config.onPrepare = function() {
  browser.ignoreSynchronization = true;

  return browser.getCapabilities().then(function(caps) {
    browser.name = [caps.get('browserName'),
      (caps.get('version') || 'latest'),
      caps.get('platform')].join('_');
    browser.browserName = caps.get('browserName');
    browser.platform = caps.get('platform');
  });
};

exports.config = config;
