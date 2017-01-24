import Ember from 'ember';
import Application from '../../app';
import config from '../../config/environment';

export default function startApp(attrs) {
  let application;

  // use defaults, but you can override
  let attributes = Ember.merge({}, config.APP); // jscs:ignore disallowDirectPropertyAccess
  attributes = Ember.merge(attributes, attrs); // jscs:ignore disallowDirectPropertyAccess

  Ember.run(() => { // jscs:ignore disallowDirectPropertyAccess
    application = Application.create(attributes);
    application.setupForTesting();
    application.injectTestHelpers();
  });

  return application;
}
