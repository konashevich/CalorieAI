(function () {
  var exec = require('cordova/exec');
  function wrap(action, args) { return new Promise(function (resolve, reject) { exec(resolve, function (err) { reject(typeof err === 'string' ? new Error(err) : err || new Error('AACRecorder error')); }, 'AACRecorder', action, args || []); }); }
  var api = {
    hasPermission: function () { return wrap('hasPermission'); },
    requestPermission: function () { return wrap('requestPermission'); },
    start: function (opts) { return wrap('start', [opts || {}]); },
    stop: function () { return wrap('stop'); },
    isRecording: function () { return wrap('isRecording'); }
  };
  module.exports = api; if (typeof window !== 'undefined') window.AACRecorder = api;
})();
