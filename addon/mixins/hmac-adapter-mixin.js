import Ember from 'ember';

const {
  inject,
  Mixin
} = Ember;

// This mixin provides http-hmac signing capabilities to an ember-data adapter.
// @todo : Implement response validation once there is access to the jqXHR
// object in the response.
// https://github.com/emberjs/data/issues/4404
export default Mixin.create({
  /**
   * The request signing service to use
   * @type {Ember.Service}
   * @public
   */
  requestSigner: inject.service(),

  /**
   * Overrides the adapter's ajax options to add custom signing functionality.
   * @method ajaxOptions
   * @private
   */
  ajaxOptions() {
    let signer = this.get('requestSigner');
    let hash = this._super(...arguments);
    return signer.updateAjaxOptions(hash, this.get('headers'));
  }
});
