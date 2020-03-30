# Ember-http-hmac [![Build Status](https://travis-ci.com/acquia/ember-http-hmac.svg?token=xpbhY9xz7Z9aqH5aUfgP&branch=master)](https://travis-ci.com/acquia/ember-http-hmac)

This addon provides an Ember integration for working with version 2.0 of the [HTTP HMAC Specification](https://github.com/acquia/http-hmac-spec/tree/2.0).  It wraps the [http-hmac-javascript library](https://github.com/acquia/http-hmac-javascript) and exposes signing capabilites via the request-signer service. 

## Configuration
In order to generate the authorization headers the http-hmac-javascript library needs to know the realm, public key, and secret key to use.  These values can be set either in the `config/environment.js` file or directly on the request-signer service.  Optionally, you can configure a list of headers that need to be included in the signature.  This is an array of header names that will be included if present in the request.

### Setting configuration in the environment
The values can be set in the environment configuration by adding a section to your variables:

```
module.exports = function(environment) {
  'ember-http-hmac': {
    realm: 'your-realm',
    publicKey: 'enter-your-public-key-here',
    secretKey: 'enter-your-secret-key-here',
    signedHeaders: ['header-name-1', 'header-name-2']
  }
};
```

### Setting configuration directly on the service
The same variables exist on the `request-signer` servive provided by ember-http-hmac.  Here is an example of setting the values within a component:

```
export default Ember.Component.extend({
  requestSigner: Ember.inject.service();

  init() {
    this._super(...arguments);
    let signer = this.get('requestSigner');
    signer.set('realm', 'your-realm');
    signer.set('publicKey', 'enter-your-public-key-here');
    signer.set('secretKey', 'enter-your-secret-key-here');
    signer.set('signedHeader', ['header-name-1', 'header-name-2']);
  }
});
```

## Using the request-signer service directly
The basic signing functionality is available directly as the `request-signer` service to use as needed.

## Installation

### As an addon
This addon can be installed via standard ember addon installation procedures:
* `ember install ember-http-hmac`

# To Dos
* Create a test helper to register support
* Add configuration to disable signed headers

# For Development

## Installation

* `git clone` this repository
* `npm install`
* `bower install`

## Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

## Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

## Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
