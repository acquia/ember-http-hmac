import { test, module } from 'qunit';
import InstanceInitializer from 'ember-http-hmac/instance-initializers/ember-http-hmac';
import RequestSigner from 'ember-http-hmac/services/request-signer';

module('Unit | Instance Initializers | ember-http-hmac');

test('it registers the signer', function(assert) {
  assert.expect(6);

  let expected = {
    realm: 'test-realm',
    publicKey: 'my-public-key',
    secretKey: 'my-secret-key',
    signedHeaders: ['my-signed-header-a', 'my-signed-header-b']
  };
  let requestSigner = RequestSigner.create();
  let instanceMock = {
    lookupFactory(factoryName) {
      assert.equal(factoryName, 'config:environment', 'The environment is requested.');
      return {
        'ember-http-hmac': expected
      };
    },
    lookup(factoryName) {
      assert.equal(factoryName, 'request-signer:main', 'The request signer is requested');
      return requestSigner;
    }
  };

  InstanceInitializer.initialize(instanceMock);
  assert.equal(requestSigner.get('realm'), expected.realm, 'Realm was set on service.');
  assert.equal(requestSigner.get('publicKey'), expected.publicKey, 'Public key was set on service.');
  assert.equal(requestSigner.get('secretKey'), expected.secretKey, 'Secret key was set on service.');
  assert.equal(requestSigner.get('signedHeaders'), expected.signedHeaders, 'Signed headers were set on service.');
});
