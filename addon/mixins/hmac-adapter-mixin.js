import Ember from 'ember';

// This mixin provides http-hmac signing capabilities to an ember-data adapter.
// @todo : Implement response validation once there is access to the jqXHR
// object in the response.
// https://github.com/emberjs/data/issues/4404
export default Ember.Mixin.create({
  /**
   * The request signing service to use
   * @type {Ember.Service}
   * @public
   */
  requestSigner: Ember.inject.service(),

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
