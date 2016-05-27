import Ember from 'ember';
import HmacAdapterMixin from 'ember-http-hmac/mixins/hmac-adapter-mixin';
import { module, test } from 'qunit';

module('Unit | Mixins | hmac-adapter-mixin');

test('it signs requests before sending.', function(assert) {
  assert.expect(4);

  let AdapterMock = Ember.Object.extend(HmacAdapterMixin, {
    _super() {
      return { type: 'GET' };
    },
    headers: {}
  });
  let expectedParameters = {
    path: 'my-url',
    method: 'GET'
  };
  let requestSignerMock = {
    signRequest(jqXhr, signParameters, headers) {
      assert.ok(true, 'Sign request was called in the beforeSend callback');
      assert.equal(jqXhr, 'mock-jqxhr', 'Jquery XHR object passed.');
      assert.deepEqual(signParameters, expectedParameters, 'Sign parameters were generated.');
      assert.deepEqual(headers, {}, 'Headers were empty.');
    }
  };
  let subject = AdapterMock.create({ requestSigner: requestSignerMock });
  let hash = subject.ajaxOptions();
  hash.beforeSend('mock-jqxhr', { url: 'my-url' });
});

test('it sends content type when available.', function(assert) {
  assert.expect(4);

  let AdapterMock = Ember.Object.extend(HmacAdapterMixin, {
    _super() {
      return { contentType: 'my-content-type', type: 'GET' };
    },
    headers: {}
  });
  let expectedParameters = {
    content_type: 'my-content-type', // jscs:ignore requireCamelCaseOrUpperCaseIdentifiers
    path: 'my-url',
    method: 'GET'
  };
  let requestSignerMock = {
    signRequest(jqXhr, signParameters, headers) {
      assert.ok(true, 'Sign request was called in the beforeSend callback');
      assert.equal(jqXhr, 'mock-jqxhr', 'Jquery XHR object passed.');
      assert.deepEqual(signParameters, expectedParameters, 'Sign parameters were generated.');
      assert.deepEqual(headers, {}, 'Headers were empty.');
    }
  };
  let subject = AdapterMock.create({ requestSigner: requestSignerMock });
  let hash = subject.ajaxOptions();
  hash.beforeSend('mock-jqxhr', { url: 'my-url' });
});

test('it sends headers when set on the adapter.', function(assert) {
  assert.expect(4);

  let mockHeaders = {
    'my-test-header': 'my-header-value'
  };
  let AdapterMock = Ember.Object.extend(HmacAdapterMixin, {
    _super() {
      return { type: 'GET' };
    },
    headers: mockHeaders
  });
  let expectedParameters = {
    path: 'my-url',
    method: 'GET'
  };
  let requestSignerMock = {
    signRequest(jqXhr, signParameters, headers) {
      assert.ok(true, 'Sign request was called in the beforeSend callback');
      assert.equal(jqXhr, 'mock-jqxhr', 'Jquery XHR object passed.');
      assert.deepEqual(signParameters, expectedParameters, 'Sign parameters were generated.');
      assert.deepEqual(headers, mockHeaders, 'Headers were pulled from the adapter.');
    }
  };
  let subject = AdapterMock.create({ requestSigner: requestSignerMock });
  let hash = subject.ajaxOptions();
  hash.beforeSend('mock-jqxhr', { url: 'my-url' });
});

test('it preserves existing beforeSend callback', function(assert) {
  assert.expect(4);

  let AdapterMock = Ember.Object.extend(HmacAdapterMixin, {
    _super() {
      return {
        type: 'GET',
        beforeSend(jqXhr, settings) {
          assert.ok(true, 'The pre-existing beforeSend callback was called.');
          assert.equal(jqXhr, 'mock-jqxhr', 'The request was passed to the callback.');
          assert.deepEqual(settings, { url: 'my-url' }, 'The settings were passed to the callback.');
        }
      };
    }
  });
  let requestSignerMock = {
    signRequest() {
      assert.ok(true, 'Sign request was called in the beforeSend callback');
    }
  };
  let subject = AdapterMock.create({ requestSigner: requestSignerMock });
  let hash = subject.ajaxOptions();
  hash.beforeSend('mock-jqxhr', { url: 'my-url' });
});
