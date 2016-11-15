import Ember from 'ember';
const { AcquiaHttpHmac } = window;

export default Ember.Service.extend({
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
  realm: Ember.computed({
    set(key, value) {
      if (value === this.get('_realm')) {
        return;
      }
      // If realm is updated, retire the current signer.
      this.set('signer', null);
      this.set('_realm', value);
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
  publicKey: Ember.computed({
    set(key, value) {
      if (value === this.get('_publicKey')) {
        return;
      }
      // If public key is updated, retire the current signer.
      this.set('signer', null);
      this.set('_publicKey', value);
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
  secretKey: Ember.computed({
    set(key, value) {
      if (value === this.get('_secretKey')) {
        return;
      }
      // If secret key is updated, retire the current signer.
      this.set('signer', null);
      this.set('_secretKey', value);
    }
  }),

  /**
   * Stores the current secret key.
   * @type {String}
   * @private
   */
  _secretKey: null,

  /**
   * An array of header names to check for in the request.  If they are present
   * they will be included as signed headers for the HMAC authentication.
   * @type {Array}
   * @public
   */
  signedHeaders: [],

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
    let realm = this.get('_realm');
    let publicKey = this.get('_publicKey');
    let secretKey = this.get('_secretKey');

    Ember.assert('The realm must be populated for http hmac authentication', !Ember.isEmpty(realm));
    Ember.assert('The public key must be populated for http hmac authentication', !Ember.isEmpty(publicKey));
    Ember.assert('The private key must be populated for http hmac authentication', !Ember.isEmpty(secretKey));

    // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
    let config = {
      realm,
      public_key: publicKey,
      secret_key: secretKey
    };
    // jscs:enable

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

    let { beforeSend } = hash;
    let signParameters = {
      method: hash.type || 'GET'
    };
    if (hash.hasOwnProperty('contentType')) {
      signParameters.content_type = hash.contentType; // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
    }

    hash.beforeSend = (jqXhr, settings) => {
      signParameters.path = settings.url;
      if (!Ember.isEmpty(settings.data)) {
        signParameters.body = settings.data;
      }
      try {
        this.signRequest(jqXhr, signParameters, headers);
      } catch (e) {
        return false;
      }

      if (beforeSend) {
        beforeSend(jqXhr, settings);
      }
    };
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
    if (Ember.isEmpty(signer)) {
      signer = this.initializeSigner();
    }
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
    Ember.assert('The signer must be configured with initializeSigner prior to use.', !Ember.isEmpty(this.signer));
    return this.get('signer').hasValidResponse(request);
  }
});
