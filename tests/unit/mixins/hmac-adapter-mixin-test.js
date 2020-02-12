import EmberObject from '@ember/object';
import HmacAdapterMixin from 'ember-http-hmac/mixins/hmac-adapter-mixin';
import { module, test } from 'qunit';
import RequestSigner from 'ember-http-hmac/services/request-signer';

module('Unit | Mixins | hmac-adapter-mixin', function() {
  test('it signs requests before sending.', function(assert) {
    assert.expect(4);

    let AdapterMock = EmberObject.extend(HmacAdapterMixin, {
      _super() {
        return { type: 'GET' };
      },
      headers: {}
    });
    let expectedParameters = {
      path: 'my-url',
      method: 'GET'
    };
    let RequestSignerMock = RequestSigner.extend({
      signRequest(jqXhr, signParameters, headers) {
        assert.ok(true, 'Sign request was called in the beforeSend callback');
        assert.equal(jqXhr, 'mock-jqxhr', 'Jquery XHR object passed.');
        assert.deepEqual(signParameters, expectedParameters, 'Sign parameters were generated.');
        assert.deepEqual(headers, {}, 'Headers were empty.');
      }
    });
    let subject = AdapterMock.create({ requestSigner: RequestSignerMock.create() });
    let hash = subject.ajaxOptions();
    hash.beforeSend('mock-jqxhr', { url: 'my-url' });
  });

  test('it sends headers when set on the adapter.', function(assert) {
    assert.expect(4);

    let mockHeaders = {
      'my-test-header': 'my-header-value'
    };
    let AdapterMock = EmberObject.extend(HmacAdapterMixin, {
      _super() {
        return { type: 'GET' };
      },
      headers: mockHeaders
    });
    let expectedParameters = {
      path: 'my-url',
      method: 'GET'
    };
    let RequestSignerMock = RequestSigner.extend({
      signRequest(jqXhr, signParameters, headers) {
        assert.ok(true, 'Sign request was called in the beforeSend callback');
        assert.equal(jqXhr, 'mock-jqxhr', 'Jquery XHR object passed.');
        assert.deepEqual(signParameters, expectedParameters, 'Sign parameters were generated.');
        assert.deepEqual(headers, mockHeaders, 'Headers were pulled from the adapter.');
      }
    });
    let subject = AdapterMock.create({ requestSigner: RequestSignerMock.create() });
    let hash = subject.ajaxOptions();
    hash.beforeSend('mock-jqxhr', { url: 'my-url' });
  });
});
