import ENV from '../config/environment';
import setupRequestService from 'ember-http-hmac/instance-initializers/setup-request-service';

export function initialize(instance) {
  setupRequestService(instance, ENV);
}

export default {
  name: 'ember-http-hmac',
  initialize
};
