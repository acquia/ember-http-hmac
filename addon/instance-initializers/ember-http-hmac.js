// Read any configuration values from the environment configuration and set on
// the request signer service.
export function initialize(instance) {
  let config = instance.lookupFactory('config:environment');
  let service = instance.lookup('request-signer:main');

  let addonOptions = config['ember-http-hmac'];
  if (addonOptions) {
    let configKeys = ['realm', 'publicKey', 'secretKey', 'signedHeaders'];
    configKeys.forEach((keyName) => {
      let keyValue = addonOptions[keyName];
      if (keyValue) {
        service.set(keyName, keyValue);
      }
    });
  }
}

export default {
  name: 'ember-http-hmac',
  initialize
};
