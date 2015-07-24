# Changelog for jasminewd2

# 0.0.5

- ([037c7de](https://github.com/angular/jasminewd/commit/037c7de7fea4de068734b6fa250d145800863633))
  chore(dependencies): update Jasmine to 2.3.1

# 0.0.4

- ([8f8b8b3](https://github.com/angular/jasminewd/commit/8f8b8b39e779559fd3b29b138d7577658b8a64b7))
  tests(context): test that the `this` variable points to the right thing

  Note: this means that using `this.addMatchers` no longer works inside before blocks or specs. It
  should have been changed to `jamsine.addMatchers` since the upgrade to Jasmine 2. It was still
  working by accident up until the previous commit.

- ([c0f13d2](https://github.com/angular/jasminewd/commit/c0f13d254966c859db22d020a5390138dbf48e64))
  refactor(asyncTestFn): refactor async test wrapping to show more info

  Test wrapping for Jasmine 2 now more closely follows the test wrapping for Mocha at
  https://github.com/SeleniumHQ/selenium/blob/master/javascript/node/selenium-webdriver/testing/index.js

  This also adds more information to the task names in the control flow, for easier debugging.

# 0.0.3

- ([161e1fa](https://github.com/angular/jasminewd/commit/161e1fa48deaa5ea0f485027ea8ae41562864936))
  fix(errors): update webdriverjs, fix asynchronous error output

  Add some console logging, remove useless info about the last running task in the control flow, and
  fix error where problems reported from done.fail were getting pushed into the following spec.

  Closes #18

- ([fdb03a3](https://github.com/angular/jasminewd/commit/fdb03a388d4846952c09fb0ad75a37b46674c750))
  docs(readme): add note about jasmine 1 vs jasmine 2

- ([acaec8b](https://github.com/angular/jasminewd/commit/acaec8bdd157e9933d608c66204a52335fb46ee4))
  feat(index): add jasmine2.0 support
