import Ember from 'ember';
import Pretender from 'pretender';
import { test, module } from 'qunit';
import SignedAjax from 'ember-http-hmac/services/signed-ajax';
import { jsonResponse } from '../../helpers/json';

let service, server;
module('Unit | Services | signed-ajax', {
  beforeEach() {
    service = SignedAjax.create();
    server = new Pretender();
  },
  afterEach() {
    server.shutdown();
    Ember.run(service, 'destroy');
  }
});

test('it signs requests with no options', function(assert) {
  assert.expect(5);

  let mockRequestSigner = {
    signRequest(jqXhr, signParameters, headers) {
      assert.equal(signParameters.method, 'GET', 'Method passed to sign request.');
      assert.equal(signParameters.path, 'example.com', 'Url passed to sign request.');
      assert.deepEqual(headers, {}, 'Headers are passed in as empty.');
      jqXhr.setRequestHeader('Authorization', 'test-auth');
    }
  };
  server.get('example.com', (req) => {
    assert.ok(true, 'Ajax request was sent.');
    assert.equal(req.requestHeaders.Authorization, 'test-auth', 'Authorization header was sent with request.');
    return jsonResponse();
  });

  service.requestSigner = mockRequestSigner;
  service.request('example.com');
});

test('it signs requests with options', function(assert) {
  assert.expect(6);

  let mockHeaders = { 'test-header': 'test-header-value' };
  let mockRequestSigner = {
    signRequest(jqXhr, signParameters, headers) {
      assert.equal(signParameters.method, 'GET', 'Method passed to sign request.');
      assert.equal(signParameters.path, 'example.com', 'Url passed to sign request.');
      assert.deepEqual(headers, mockHeaders, 'Headers are passed in as empty.');
      jqXhr.setRequestHeader('Authorization', 'test-auth');
    }
  };
  server.get('example.com', (req) => {
    assert.ok(true, 'Ajax request was sent.');
    assert.equal(req.requestHeaders.Authorization, 'test-auth', 'Authorization header was sent with request.');
    assert.equal(req.requestHeaders['test-header'], 'test-header-value', 'Other headers were preserved and sent with request.');
    return jsonResponse();
  });

  service.requestSigner = mockRequestSigner;
  service.request('example.com', {
    headers: mockHeaders
  });
});

test('it preserves specified beforeSend callbacks', function(assert) {
  assert.expect(5);

  let mockRequestSigner = {
    signRequest() {
      assert.ok(true, 'SignRequest was called.');
    }
  };
  server.get('example.com', () => {
    assert.ok(true, 'Ajax request was sent.');
    return jsonResponse();
  });
  let mockBeforeSend = (jqXhr, settings) => {
    assert.ok(true, 'User specified beforeSend callback was called.');
    assert.ok(jqXhr, 'jqXhr object was passed to callback.');
    assert.equal(settings.url, 'example.com', 'Settings were passed to callback.');
  };

  service.requestSigner = mockRequestSigner;
  service.request('example.com', { beforeSend: mockBeforeSend });
});
