import AjaxService from 'ember-ajax/services/ajax';
import Ember from 'ember';

/**
 * Extends the Ajax service to automatically sign all requests.
 * @todo  handle signature validation upon response - probably use jQuery success
 * callback.
 */
export default AjaxService.extend({
  requestSigner: Ember.inject.service(),

  /**
   * Overrides the Ajax.request method to attach a signing beforeSend callback
   * to the options.
   */
  request(url, options) {
    if (!options) {
      options = {};
    }
    let signer = this.get('requestSigner');
    let beforeSend = options.beforeSend || null;
    let headers = options.headers || {};

    // jscs: disable requireCamelCaseOrUpperCaseIdentifiers
    let signParameters = {
      method: options.type || 'GET'
    };
    // jscs: enable

    options.beforeSend = (jqXhr, settings) => {
      signParameters.path = settings.url;
      signer.signRequest(jqXhr, signParameters, headers);

      if (beforeSend) {
        beforeSend(...arguments);
      }
    };

    return this._super(url, options);
  }
});
