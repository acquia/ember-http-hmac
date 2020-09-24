import { run } from '@ember/runloop';
import { test, module } from 'qunit';
import RequestSigner from 'ember-http-hmac/services/request-signer';

let service;

module('Unit | Services | request-signer', function(hooks) {
  hooks.beforeEach(function() {
    service = RequestSigner.create();
  });

  hooks.afterEach(function() {
    run(service, 'destroy');
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

  test('it can retire current signer if realm, publicKey, or secretKey is set again', function(assert) {
    assert.expect(9);

    service.set('realm', 'test-realm');
    service.set('publicKey', 'my-public-key');
    service.set('secretKey', 'my-secret-key');

    let signer;

    service.initializeSigner();
    signer = service.get('signer');
    assert.ok(signer, 'The signer was created.');
    service.set('realm', 'test-realm');
    signer = service.get('signer');
    assert.ok(signer, 'The signer was NOT retired when same realm is set.');
    service.set('realm', 'new-test-realm');
    signer = service.get('signer');
    assert.notOk(signer, 'The signer was retired when new realm is set.');

    service.initializeSigner();
    signer = service.get('signer');
    assert.ok(signer, 'The signer was created.');
    service.set('publicKey', 'my-public-key');
    signer = service.get('signer');
    assert.ok(signer, 'The signer was NOT retired when same public key is set.');
    service.set('publicKey', 'new-public-key');
    signer = service.get('signer');
    assert.notOk(signer, 'The signer was retired when new public key is set.');

    service.initializeSigner();
    signer = service.get('signer');
    assert.ok(signer, 'The signer was created.');
    service.set('secretKey', 'my-secret-key');
    signer = service.get('signer');
    assert.ok(signer, 'The signer was NOT retired when same secret key is set.');
    service.set('secretKey', 'new-secret-key');
    signer = service.get('signer');
    assert.notOk(signer, 'The signer was retired when new secret key is set.');
  });

  test('it requires signer configuration.', function(assert) {
    assert.expect(1);

    try {
      service.signRequest();
    } catch(e) {
      assert.ok(true, 'Sign request throws an error when the signer is not initialized.');
    }
  });

  test('it signs a request without special headers.', function(assert) {
    assert.expect(2);

    let signerMock = {
      getFetchHeaders(params) {
        assert.notOk(params.signed_headers, 'No headers are included for the signature.'); // eslint-disable-line camelcase
        assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
        return {};
      }
    };
    service.set('signer', signerMock);
    service.updateAjaxOptions({ foo: 'bar' }, { 'header-1': 'header-value' });
  });

  test('it includes signed headers when present.', function(assert) {
    assert.expect(2);

    let signerMock = {
      getFetchHeaders(params) {
        assert.deepEqual(params.signed_headers, { 'my-signed-header': 'my-signed-header-value' }, 'Signed headers were included'); // eslint-disable-line camelcase
        assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
        return {};
      }
    };
    service.set('signer', signerMock);
    service.set('signedHeaders', ['my-signed-header']);
    let headers = {
      'header-1': 'header-1-value',
      'my-signed-header': 'my-signed-header-value'
    };
    service.updateAjaxOptions({ foo: 'bar' }, headers);
  });

  test('it signs requests when signed headers are not present.', function(assert) {
    assert.expect(2);

    let signerMock = {
      getFetchHeaders(params) {
        assert.notOk(params.signed_headers, 'No headers are included for the signature.'); // eslint-disable-line camelcase
        assert.equal(params.foo, 'bar', 'Additional parameters are passed through for signature.');
        return {};
      }
    };
    service.set('signer', signerMock);
    service.set('signedHeaders', ['my-signed-header']);
    let headers = {
      'header-1': 'header-1-value'
    };
    service.updateAjaxOptions({ foo: 'bar' }, headers);
  });

  test('it sends content type to signer when available', function(assert) {
    assert.expect(2);

    let signerMock = {
      getFetchHeaders(params) {
        assert.ok(true, 'Signer was invoked before send.');
        assert.equal(params.method, 'POST', 'It sends the content type to signer.');
        return {};
      }
    };

    service.set('signer', signerMock);
    service.updateAjaxOptions({ type: 'POST', url: 'test-url' });
  });

  test('it sends headers when available and configured', function(assert) {
    assert.expect(3);

    let allHeaders = {
      'mahna-mahna': 'dodoodododo',
      'marvin-suggs': 'owwww'
    };

    let signerMock = {
      getFetchHeaders(params) {
        assert.ok(true, 'Signer was invoked before send.');
        assert.equal(params.signed_headers['marvin-suggs'], 'owwww', 'Signed header value was sent.'); // eslint-disable-line camelcase
        assert.notOk(params.signed_headers['mahna-mahna'], 'Unsigned header value was not sent.'); // eslint-disable-line camelcase
        return {};
      }
    };

    service.set('signer', signerMock);
    service.set('signedHeaders', ['marvin-suggs']);
    service.updateAjaxOptions({}, allHeaders);
  });

  test('it sends body when available', function(assert) {
    assert.expect(2);

    const signerMock = {
      getFetchHeaders(params) {
        assert.ok(true, 'Signer was invoked before send.');
        assert.equal(params.body, 'moving right along', 'It sends the body to signer.');
        return {};
      }
    };
    const requestOptions = { url: 'test-url', data: 'moving right along' };

    service.set('signer', signerMock);
    service.updateAjaxOptions(requestOptions);
  });

  test('it does not validate without a configured signer', function(assert) {
    assert.expect(1);
    const validText = 'I am the response text';
    const allHeaders = {
      'mahna-mahna': 'dodoodododo',
      'marvin-suggs': 'owwww'
    };
    const validNonce = '4gavsdn29432cnpvgfdg';
    const validTimestamp = 1346048064;
    const mockResponse = {
      headers: allHeaders,
      text() {
        return Promise.resolve(validText);
      },
    };

    service.set('signer', undefined);
    try {
      service.validateResponse(mockResponse, validNonce, validTimestamp)
    } catch (e) {
      assert.ok(/The signer must be configured/.test(e.message), 'The assertion is raised.');
    }
  });

  test('it validates the response', async function(assert) {
    assert.expect(4);

    const validText = 'I am the response text';
    const allHeaders = {
      'mahna-mahna': 'dodoodododo',
      'marvin-suggs': 'owwww'
    };
    const validNonce = '4gavsdn29432cnpvgfdg';
    const validTimestamp = 1346048064;
    const signerMock = {
      hasValidFetchResponse(text, headers, nonce, timestamp) {
        assert.equal(text, validText, 'The response text is passed.');
        assert.equal(headers, allHeaders, 'The headers are passed.');
        assert.equal(nonce, validNonce, 'The nonce is passed.');
        assert.equal(timestamp, validTimestamp, 'The timestamp is passed.');
      },
    };

    service.set('signer', signerMock);
    await service.validateResponse(validText, allHeaders, validNonce, validTimestamp);
  })
});
