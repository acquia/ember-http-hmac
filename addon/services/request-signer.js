import AcquiaHttpHmac from 'npm:http-hmac-javascript';
import Ember from 'ember';

export default Ember.Service.extend({
  signer: null,

  /**
   * An array of header names to check for in the request.  If they are present
   * they will be included as signed headers for the HMAC authentication.
   * @type {Array}
   */
  signedHeaders: [],

  /**
   * Sets up the signer with the required configuration.
   * @method  initializeSigner
   * @param  {Object} config Configuration data with at the following keys:
   *                         - realm
   *                         - public_key
   *                         - secret_key
   * @param {Array}   signedHeaders An array of header names that should be
   * included in the auth signature.
   */
  initializeSigner(config, signed = []) {
    this.set('signer', new AcquiaHttpHmac(config));
    this.set('signedHeaders', signed);
  },

  /**
   * Signs a request.
   * @method  signRequest
   * @param  {Object} jqXhr  The jQuery jqXHR object that wraps the XMLHttpRequest
   * @param  {Object} params Signing parameters required by the http-hmac library
   *                         - method: the request method (verb)
   *                         - path: The url for the request
   *                         - content_type: The contentText for the request (optional)
   * @param {Object} headers An object of headers for the request.
   */
  signRequest(jqXhr, params, headers) {
    Ember.assert('The signer must be configured with initializeSigner prior to use.', !Ember.isEmpty(this.signer));
    let signedHeaders = this.get('signedHeaders');
    params.request = jqXhr;
    // jscs: disable requireCamelCaseOrUpperCaseIdentifiers
    if (!Ember.isEmpty(headers) && !Ember.isEmpty(signedHeaders)) {
      params.signed_headers = {};
      signedHeaders.forEach((headerName) => {
        if (headers.hasOwnProperty(headerName)) {
          params.signed_headers[headerName] = headers[headerName];
        }
      });
    }
    // jscs: enable
    this.get('signer').sign(params);
  },

  /**
   * Validates a response from the server.
   * @method  validateResponse
   * @param {Object} request: The jQuery jqXHR request sent.
   * @return {boolean} True if valid, false otherwise.
   */
  validateResponse(request) {
    Ember.assert('The signer must be configured with initializeSigner prior to use.', !Ember.isEmpty(this.signer));
    return this.get('signer').hasValidResponse(request);
  }
});
