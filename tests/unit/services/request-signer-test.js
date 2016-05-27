import { test, module } from 'qunit';
import Ember from 'ember';
import RequestSigner from 'ember-http-hmac/services/request-signer';

let service;
module('Unit | Services | request-signer', {
  beforeEach() {
    service = RequestSigner.create();
  },
  afterEach() {
    Ember.run(service, 'destroy');
  }
});

test('it can initialize a signer', function(assert) {
  assert.expect(2);

  // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
  let expectedConfig = {
    realm: 'test-realm',
    public_key: 'my-public-key',
    secret_key: 'my-secret-key'
  };
  // jscs:enable
  service.initializeSigner(expectedConfig);
  let { signer } = service;
  assert.ok(signer, 'The signer was created.');
  assert.equal(service.signedHeaders.length, 0, 'There are no headers to be included in signature.');
});

test('it can specify headers to include in signature.', function(assert) {
  assert.expect(2);

  // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
  let config = {
    realm: 'test-realm',
    public_key: 'my-public-key',
    secret_key: 'my-secret-key'
  };
  // jscs:enable
  let expectedHeaders = ['test-header-1', 'test-header-2'];
  service.initializeSigner(config, expectedHeaders);
  let signer = service.get('signer');
  assert.ok(signer, 'The signer was created.');
  assert.deepEqual(service.get('signedHeaders'), expectedHeaders, 'The expected headers were set from the initialization.');
});

test('it requires signer configuration.', function(assert) {
  assert.expect(1);

  try {
    service.signRequest();
  } catch (e) {
    assert.ok(e.message.indexOf('The signer must be configured with initializeSigner prior to use') >= 0, 'Sign request throws an error when the signer is not initialized.');
  }
});

test('it signs a request without special headers.', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign');
      assert.notOk(params.signed_headers, 'No headers are included for the signature.'); // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
      assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
    }
  };
  service.set('signer', signerMock);
  service.signRequest('mock-jqxhr', { foo: 'bar' }, { 'header-1': 'header-value' });
});

test('it includes signed headers when present.', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign');
      assert.deepEqual(params.signed_headers, { 'my-signed-header': 'my-signed-header-value' }, 'Signed headers were included'); // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
      assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
    }
  };
  service.set('signer', signerMock);
  service.set('signedHeaders', ['my-signed-header']);
  let headers = {
    'header-1': 'header-1-value',
    'my-signed-header': 'my-signed-header-value'
  };
  service.signRequest('mock-jqxhr', { foo: 'bar' }, headers);
});

test('it signs requests when signed headers are not present.', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign');
      assert.notOk(params.signed_headers, 'No headers are included for the signature.'); // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
      assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
    }
  };
  service.set('signer', signerMock);
  service.set('signedHeader', ['my-signed-header']);
  let headers = {
    'header-1': 'header-1-value'
  };
  service.signRequest('mock-jqxhr', { foo: 'bar' }, headers);
});

test('it can validate the response from a request.', function(assert) {
  assert.expect(2);

  let signerMock = {
    hasValidResponse(request) {
      assert.equal(request, 'mock-jqxhr', 'Request was passed for validation.');
      return true;
    }
  };
  service.set('signer', signerMock);
  let valid = service.validateResponse('mock-jqxhr');
  assert.ok(valid, 'Signer response was passed through from request signer service.');
});
