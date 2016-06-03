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

  service.set('realm', 'test-realm');
  service.set('publicKey', 'my-public-key');
  service.set('secretKey', 'my-secret-key');
  let signer = service.initializeSigner();

  assert.ok(signer, 'The signer was created.');
  assert.equal(service.signedHeaders.length, 0, 'There are no headers to be included in signature.');
});

test('it requires signer configuration.', function(assert) {
  assert.expect(1);

  try {
    service.signRequest();
  } catch (e) {
    assert.ok(true, 'Sign request throws an error when the signer is not initialized.');
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

test('it can add signing to beforeSend', function(assert) {
  assert.expect(5);

  let signerMock = {
    sign(params) {
      assert.ok(true, 'Signer was invoked before send.');
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign.');
      assert.equal(params.path, 'test-url', 'URL was sent as a parameter to sign.');
      assert.equal(params.method, 'GET', 'It sends the default method to signer.');
    }
  };

  service.set('signer', signerMock);
  let hash = service.updateAjaxOptions();
  assert.ok(hash.beforeSend, 'Before send function was added to hash');
  hash.beforeSend('mock-jqxhr', { url: 'test-url' });
});

test('it sends content type to signer when available', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.ok(true, 'Signer was invoked before send.');
      assert.equal(params.method, 'POST', 'It sends the content type to signer.');
    }
  };

  service.set('signer', signerMock);
  let hash = service.updateAjaxOptions({ type: 'POST' });
  assert.ok(hash.beforeSend, 'Before send function was added to hash');
  hash.beforeSend('mock-jqxhr', { url: 'test-url' });
});

test('it sends headers when available and configured', function(assert) {
  assert.expect(5);

  let allHeaders = {
    'mahna-mahna': 'dodoodododo',
    'marvin-suggs': 'owwww'
  };

  let signerMock = {
    sign(params) {
      assert.ok(true, 'Signer was invoked before send.');
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign.');
      assert.equal(params.signed_headers['marvin-suggs'], 'owwww', 'Signed header value was sent.'); // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
      assert.notOk(params.signed_headers['mahna-mahna'], 'Unsigned header value was not sent.'); // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
    }
  };

  service.set('signer', signerMock);
  service.set('signedHeaders', ['marvin-suggs']);
  let hash = service.updateAjaxOptions({}, allHeaders);
  assert.ok(hash.beforeSend, 'Before send function was added to hash');
  hash.beforeSend('mock-jqxhr', { url: 'test-url' });
});

test('it sends body when available', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.ok(true, 'Signer was invoked before send.');
      assert.equal(params.body, 'moving right along', 'It sends the body to signer.');
    }
  };

  service.set('signer', signerMock);
  let hash = service.updateAjaxOptions();
  assert.ok(hash.beforeSend, 'Before send function was added to hash');
  hash.beforeSend('mock-jqxhr', { url: 'test-url', data: 'moving right along' });
});

test('it preserves existing beforeSend callback', function(assert) {
  let hash = {
    beforeSend(jqXHR, settings) {
      assert.ok(true, 'The pre-existing beforeSend callback was called.');
      assert.equal(jqXHR, 'mock-jqxhr', 'The request was passed to the callback.');
      assert.deepEqual(settings, { url: 'my-url' }, 'The settings were passed to the callback.');
    }
  };
  let signerMock = {
    sign() {
      assert.ok(true, 'Signer was invoked before send.');
    }
  };
  service.set('signer', signerMock);
  service.updateAjaxOptions(hash);
  hash.beforeSend('mock-jqxhr', { url: 'my-url' });
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
