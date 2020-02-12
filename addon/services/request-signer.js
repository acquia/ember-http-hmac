import { assert } from '@ember/debug';
import { computed } from '@ember/object';
import { isEmpty } from '@ember/utils';
import Service from '@ember/service';
const { AcquiaHttpHmac } = window;

export default Service.extend({
  /**
   * The authentication signer to utilize
   * @type {AcquiaHttpHmac}
   * @private
   */
  signer: null,

  /**
   * The authentication realm to use for signing requests.
   * @type {String}
   * @public
   */
  realm: computed('_realm', {
    get() {
      return this.get('_realm');
    },
    set(key, value) {
      return this._updateSignerDependency('_realm', value);
    }
  }),

  /**
   * Stores the current realm.
   * @type {String}
   * @private
   */
  _realm: null,

  /**
   * The public key to use for signing requests.
   * @type {String}
   * @public
   */
  publicKey: computed('_publicKey', {
    get() {
      return this.get('_publicKey');
    },
    set(key, value) {
      return this._updateSignerDependency('_publicKey', value);
    }
  }),

  /**
   * Stores the current public key.
   * @type {String}
   * @private
   */
  _publicKey: null,

  /**
   * The secret key to use for signing requests.
   * @type {String}
   * @public
   */
  secretKey: computed('_secretKey', {
    get() {
      return this.get('_secretKey');
    },
    set(key, value) {
      return this._updateSignerDependency('_secretKey', value);
    }
  }),

  /**
   * Stores the current secret key.
   * @type {String}
   * @private
   */
  _secretKey: null,

  /**
   * Helper function to update a property that invalidates the signer.
   * @method  _updateSignerDependency
   * @private
   * @param  {String} propertyName The internal property storage name
   * @param  {any} value           The newly requested value
   * @return {any}                 The updated value
   */
  _updateSignerDependency(propertyName, value) {
    let current = this.get(propertyName);
    if (value === current) {
      return current;
    }
    this.set('signer', null);
    this.set(propertyName, value);
    return value;
  },

  /**
   * An array of header names to check for in the request.  If they are present
   * they will be included as signed headers for the HMAC authentication.
   * @type {Array}
   * @public
   */
  signedHeaders: null,

  init() {
    this._super(...arguments);

    this.signedHeaders = [];
  },

  /**
   * Sets up the signer with the required configuration.
   * @method  initializeSigner
   * @public
   * @param  {Object} config Configuration data with at the following keys:
   *                         - realm
   *                         - public_key
   *                         - secret_key
   * @param {Array}   signedHeaders An array of header names that should be
   * included in the auth signature.
   */
  initializeSigner() {
    let realm = this.get('realm');
    let publicKey = this.get('publicKey');
    let secretKey = this.get('secretKey');

    assert('The realm must be populated for http hmac authentication', !isEmpty(realm));
    assert('The public key must be populated for http hmac authentication', !isEmpty(publicKey));
    assert('The private key must be populated for http hmac authentication', !isEmpty(secretKey));

    /* eslint-disable camelcase */
    let config = {
      realm,
      public_key: publicKey,
      secret_key: secretKey
    };
    /* eslint-enable */

    let signer = new AcquiaHttpHmac(config);
    this.set('signer', signer);
    return signer;
  },

  /**
   * Updates the ajax options for signing a request.
   * @method  updateAjaxOptions
   * @protected
   * @param {Object} hash    The ajax options hash
   * @param {Object} headers Any headers to be included with the request
   * @return {Object} The updated hash - also modified by reference.
   */
  updateAjaxOptions(hash, headers) {
    if (!hash) {
      hash = {};
    }

    let signer = this.get('signer');
    if (isEmpty(signer)) {
      signer = this.initializeSigner();
    }

    const signParameters = {
      method: hash.type || 'GET',
      path: hash.url,
      ...(hash.hasOwnProperty('contentType')) && { contentType: hash.contentType },  // eslint-disable-line camelcase
      ...(!isEmpty(hash.data)) && { body: hash.data } 
    };

    const signedHeaders = signer.getHeaders(signParameters);

    hash.headers = Object.assign(headers, signedHeaders);
    return hash;
  },

  /**
   * Signs a request.
   * @method  signRequest
   * @public
   * @param  {Object} jqXhr  The jQuery jqXHR object that wraps the XMLHttpRequest
   * @param  {Object} params Signing parameters required by the http-hmac library
   *                         - method: the request method (verb)
   *                         - path: The url for the request
   *                         - content_type: The contentText for the request (optional)
   * @param {Object} headers An object of headers for the request.
   */
  signRequest(jqXhr, params, headers) {
    let signer = this.get('signer');
    if (isEmpty(signer)) {
      signer = this.initializeSigner();
    }
    let signedHeaders = this.get('signedHeaders');
    params.request = jqXhr;
    /* eslint-disable camelcase */
    if (!isEmpty(headers) && !isEmpty(signedHeaders)) {
      params.signed_headers = {};
      signedHeaders.forEach((headerName) => {
        if (headers.hasOwnProperty(headerName)) {
          params.signed_headers[headerName] = headers[headerName];
        }
      });
    }
    /* eslint-enable camelcase */
    signer.sign(params);
  },

  /**
   * Validates a response from the server.
   * @method  validateResponse
   * @public
   * @param {Object} request: The jQuery jqXHR request sent.
   * @return {boolean} True if valid, false otherwise.
   */
  validateResponse(request) {
    assert('The signer must be configured with initializeSigner prior to use.', !isEmpty(this.signer));
    return this.get('signer').hasValidResponse(request);
  }
});
