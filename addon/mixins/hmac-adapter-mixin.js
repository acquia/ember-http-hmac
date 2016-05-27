import Ember from 'ember';

/**
 * This mixin provides http-hmac signing capabilities to an ember-data adapter.
 * The adapter must call the initializeSigner method with the configuration
 * for the signer including the realm, public and secret keys.
 * Once configured, all requests will be signed.
 * @todo : Implement response validation once there is access to the jqXHR
 * object in the response.
 * https://github.com/emberjs/data/issues/4404
 */
export default Ember.Mixin.create({
  requestSigner: Ember.inject.service(),

  /**
   * Overrides the adapter's ajax options to add custom signing functionality.
   * @method ajaxOptions
   */
  ajaxOptions() {
    let signer = this.get('requestSigner');

    let hash = this._super(...arguments);
    let { beforeSend } = hash;

    // jscs: disable requireCamelCaseOrUpperCaseIdentifiers
    let signParameters = {
      method: hash.type
    };
    if (hash.hasOwnProperty('contentType')) {
      signParameters.content_type = hash.contentType;
    }
    // jscs: enable

    hash.beforeSend = (jqXhr, settings) => {
      signParameters.path = settings.url;
      signer.signRequest(jqXhr, signParameters, this.get('headers'));

      if (beforeSend) {
        beforeSend(jqXhr, settings);
      }
    };
    return hash;
  }
});
