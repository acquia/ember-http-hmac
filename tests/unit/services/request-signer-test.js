import { test, moduleForComponent } from 'ember-qunit';

moduleForComponent('service:request-signer', 'Unit | Services | request-signer');

test('it can initialize a signer', function(assert) {
  assert.expect(5);

  let requestSigner = this.subject();
  let expectedConfig = {
    realm: 'test-realm',
    public_key: 'my-public-key',
    secret_key: 'my-secret-key'
  };
  requestSigner.initializeSigner(expectedConfig);
  let signer = requestSigner.get('signer');
  assert.ok(signer, 'The signer was created.');
  assert.equal(signer.config.realm, expectedConfig.realm, 'The realm was configured.');
  assert.equal(signer.config.public_key, expectedConfig.public_key, 'The public key was configured.');
  assert.equal(signer.config.secret_key, expectedConfig.realm, 'The secret key was configured.');
  assert.equal(requestSigner.get('signedHeaders.length'), 0, 'There are no headers to be included in signature.');
});

test('it can specify headers to include in signature.', function(assert) {
  assert.expect(2);

  let requestSigner = this.subject();
  let config = {
    realm: 'test-realm',
    public_key: 'my-public-key',
    secret_key: 'my-secret-key'
  };
  let expectedHeaders = ['test-header-1', 'test-header-2'];
  requestSigner.initializeSigner(config, expectedHeaders);
  let signer = requestSigner.get('signer');
  assert.ok(signer, 'The signer was created.');
  assert.deepEqual(requestSigner.get('signedHeaders'), expectedHeaders, 'The expected headers were set from the initialization.');
});

test('it requires signer configuration.', function(assert) {
  assert.expect(1);

  let requestSigner = this.subject();
  assert.throws(requestSigner.signRequest(), 'The signer must be configured with initializeSigner prior to use.', 'Sign request throws an error when the signer is not initialized.');
});

test('it signs a request without special headers.', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign');
      assert.notOk(params.signed_header, 'No headers are included for the signature.');
      assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
    }
  };
  let requestSigner = this.subject({ signer: signerMock });
  requestSigner.signRequest('mock-jqxhr', { foo: 'bar' }, { 'header-1': 'header-value' });
});

test('it includes signed headers when present.', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign');
      assert.deepEqual(params.signed_header, { 'my-signed-header': 'my-signed-header-value' }, 'Signed headers were included');
      assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
    }
  };
  let requestSigner = this.subject({ signer: signerMock, signedHeaders: ['my-signed-header'] });
  let headers = {
    'header-1': 'header-1-value',
    'my-signed-header': 'my-signed-header-value'
  };
  requestSigner.signRequest('mock-jqxhr', { foo: 'bar' }, headers);
});

test('it signs requests when signed headers are not present.', function(assert) {
  assert.expect(3);

  let signerMock = {
    sign(params) {
      assert.equal(params.request, 'mock-jqxhr', 'Request was passed as a parameter to sign');
      assert.notOk(params.signed_header, 'No headers are included for the signature.');
      assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
    }
  };
  let requestSigner = this.subject({ signer: signerMock, signedHeaders: ['my-signed-header'] });
  let headers = {
    'header-1': 'header-1-value'
  };
  requestSigner.signRequest('mock-jqxhr', { foo: 'bar' }, headers);
});

test('it can validate the response from a request.', function(assert) {
  assert.expect(2);

  let signerMock = {
    hasValidResponse(request) {
      assert.equal(request, 'mock-jqxhr', 'Request was passed for validation.');
      return true;
    }
  };
  let requestSigner = this.subject({ signer: signerMock });
  let valid = requestSigner.validateResponse('mock-jqxhr');
  assert.ok(valid, 'Signer response was passed through from request signer service.');
});
