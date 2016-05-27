import Pretender from 'pretender';
import { test, moduleForComponent } from 'ember-qunit';

moduleForComponent('service:signed-ajax', 'Unit | Services | signed-ajax', {
  beforeEach() {
    this.server = new Pretender();
  },
  afterEach() {
    this.server.shutdown();
  }
});

test('it signs requests with no options', function(assert) {
  assert.expect(5);

  let mockRequestSigner = {
    signRequest(jqXhr, signParameters, headers) {
      assert.equal(signParameters.method, 'GET');
      assert.equal(signParameters.path, 'example.com', '');
      assert.deepEqual(headers, {}, 'Headers are passed in as empty.');
      jqXhr.setRequestHeader('Authorization', 'test-auth');
    }
  };
  this.server.get('example.com', (req) => {
    assert.ok(true, 'Ajax request was sent.');
    assert.equal(req.requestHeaders.Authorization, 'test-auth', 'Authorization header was sent with request.');
  });

  this.subject({ requestSigner: mockRequestSigner }).request('example.com');
});

test('it signs requests with options', function(assert) {
  assert.expect(6);

  let mockRequestSigner = {
    signRequest(jqXhr, signParameters, headers) {
      assert.equal(signParameters.method, 'GET');
      assert.equal(signParameters.path, 'example.com', '');
      assert.deepEqual(headers, {}, 'Headers are passed in as empty.');
      jqXhr.setRequestHeader('Authorization', 'test-auth');
    }
  };
  this.server.get('example.com', (req) => {
    assert.ok(true, 'Ajax request was sent.');
    assert.equal(req.requestHeaders.Authorization, 'test-auth', 'Authorization header was sent with request.');
    assert.equal(req.requestHeaders['test-header'], 'test-header-value', 'Other headers were preserved and sent with request.');
  });

  this.subject({ requestSigner: mockRequestSigner }).request('example.com', {
    headers: { 'test-header': 'test-header-value' }
  });
});

test('it preserves specified beforeSend callbacks', function(assert) {
  assert.expect(5);

  let mockRequestSigner = {
    signRequest() {
      assert.ok(true, 'SignRequest was called.');
    }
  };
  this.server.get('example.com', () => {
    assert.ok(true, 'Ajax request was sent.');
  });
  let mockBeforeSend = (jqXhr, settings) => {
    assert.ok(true, 'User specified beforeSend callback was called.');
    assert.ok(jqXhr, 'jqXhr object was passed to callback.');
    assert.equal(settings.url, 'example.com', 'Settings were passed to callback.');
  };

  this.subject({ requestSigner: mockRequestSigner }).request('example.com', { beforeSend: mockBeforeSend });
});
