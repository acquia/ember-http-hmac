// Read any configuration values from the environment configuration and set on
// the request signer service.
export default function setupRequestService(instance, config) {
  let service = instance.lookup('service:request-signer');

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
