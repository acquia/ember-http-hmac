import RequestSigner from '../services/request-signer';

// Register the request signer service to utilize at application instance launch.
export function initialize() {
  let application = arguments[1] || arguments[0];
  application.register('request-signer:main', RequestSigner);
}

export default {
  name: 'ember-http-hmac',
  initialize
};
