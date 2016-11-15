import { test, module } from 'qunit';
import setupRequestService from 'ember-http-hmac/instance-initializers/setup-request-service';
import RequestSigner from 'ember-http-hmac/services/request-signer';

module('Unit | Instance Initializers | setup-requets-service');

test('it registers the signer', function(assert) {
  assert.expect(5);

  let expected = {
    realm: 'test-realm',
    publicKey: 'my-public-key',
    secretKey: 'my-secret-key',
    signedHeaders: ['my-signed-header-a', 'my-signed-header-b']
  };
  let requestSigner = RequestSigner.create();
  let environmentMock = {
    'ember-http-hmac': expected
  };
  let instanceMock = {
    lookup(factoryName) {
      assert.equal(factoryName, 'service:request-signer', 'The request signer is requested');
      return requestSigner;
    }
  };

  setupRequestService(instanceMock, environmentMock);
  assert.equal(requestSigner.get('realm'), expected.realm, 'Realm was set on service.');
  assert.equal(requestSigner.get('publicKey'), expected.publicKey, 'Public key was set on service.');
  assert.equal(requestSigner.get('secretKey'), expected.secretKey, 'Secret key was set on service.');
  assert.equal(requestSigner.get('signedHeaders'), expected.signedHeaders, 'Signed headers were set on service.');
});
