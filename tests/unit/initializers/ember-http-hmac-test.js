import { test, module } from 'qunit';
import Initializer from 'ember-http-hmac/initializers/ember-http-hmac';

module('Unit | Initializers | ember-http-hmac');

test('it registers the signer', function(assert) {
  assert.expect(2);

  let applicationMock = {
    register(factoryName, factoryClass) {
      assert.equal(factoryName, 'request-signer:main', 'It registers with the expected factory name.');
      assert.ok(factoryClass.isServiceFactory, 'It registers a service factory.');
    }
  };

  Initializer.initialize(applicationMock);
});
