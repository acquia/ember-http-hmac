'use strict';

var path = require('path');
var mergeTrees = require('broccoli-merge-trees');
var Funnel = require('broccoli-funnel');

module.exports = {
  name: 'ember-http-hmac',

  treeForVendor: function(inputTree) {
    var httpPackagePath = path.dirname(require.resolve('http-hmac-javascript'));
    var httpPackageTree = new Funnel(this.treeGenerator(httpPackagePath), {
      srcDir: '/',
      destDir: 'http-hmac-javascript'
    });
    var cryptoPackagePath = path.dirname(require.resolve('crypto-js'));
    var cryptoPackageTree = new Funnel(this.treeGenerator(cryptoPackagePath), {
      srcDir: '/',
      destDir: 'crypto-js'
    });
    var trees = [httpPackageTree, cryptoPackageTree];
    if (inputTree) {
      trees.push(inputTree);
    }
    return mergeTrees(trees);
  },

  included: function(app) {
    this._super.included(app);

    if (app.import) {
      this.importDependencies(app);
    }
  },

  importDependencies: function(app) {
    app.import('vendor/crypto-js/crypto-js.js');
    app.import('vendor/http-hmac-javascript/hmac.min.js');
  }
};
