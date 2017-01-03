import AjaxService from 'ember-ajax/services/ajax';
import Ember from 'ember';

const { inject } = Ember;

// Extends the Ajax service to automatically sign all requests.
// @todo  handle signature validation upon response - probably use jQuery success
// callback.
export default AjaxService.extend({
  /**
   * The request signing service to use
   * @type {Ember.Service}
   * @public
   */
  requestSigner: inject.service(),

  /**
   * Overrides the Ajax.request method to attach a signing beforeSend callback
   * to the options.
   * @method  request
   * @public
   */
  request(url, options) {
    if (!options) {
      options = {};
    }
    let signer = this.get('requestSigner');
    let headers = options.headers || {};
    let signedOptions = signer.updateAjaxOptions(options, headers);
    return this._super(url, signedOptions);
  }
});
