'use strict';

require('lib0/dist/encoding.cjs');
require('lib0/dist/decoding.cjs');
require('lib0/dist/time.cjs');
require('lib0/dist/math.cjs');
require('lib0/dist/observable.cjs');
require('lib0/dist/function.cjs');
var Y = require('yjs');
var awareness$1 = require('./awareness.cjs');
var t = require('lib0/dist/testing.cjs');
var log = require('lib0/dist/logging.cjs');
var environment_js = require('lib0/dist/environment.cjs');

/**
 * @param {t.TestCase} tc
 */
const testAwareness = tc => {
  const doc1 = new Y.Doc();
  doc1.clientID = 0;
  const doc2 = new Y.Doc();
  doc2.clientID = 1;
  const aw1 = new awareness$1.Awareness(doc1);
  const aw2 = new awareness$1.Awareness(doc2);
  aw1.on('update', /** @param {any} p */ ({ added, updated, removed }) => {
    const enc = awareness$1.encodeAwarenessUpdate(aw1, added.concat(updated).concat(removed));
    awareness$1.applyAwarenessUpdate(aw2, enc, 'custom');
  });
  let lastChangeLocal = /** @type {any} */ (null);
  aw1.on('change', /** @param {any} change */ change => {
    lastChangeLocal = change;
  });
  let lastChange = /** @type {any} */ (null);
  aw2.on('change', /** @param {any} change */ change => {
    lastChange = change;
  });
  aw1.setLocalState({ x: 3 });
  t.compare(aw2.getStates().get(0), { x: 3 });
  t.assert(/** @type {any} */ (aw2.meta.get(0)).clock === 1);
  t.compare(lastChange.added, [0]);
  // When creating an Awareness instance, the the local client is already marked as available, so it is not updated.
  t.compare(lastChangeLocal, { added: [], updated: [0], removed: [] });

  // update state
  lastChange = null;
  lastChangeLocal = null;
  aw1.setLocalState({ x: 4 });
  t.compare(aw2.getStates().get(0), { x: 4 });
  t.compare(lastChangeLocal, { added: [], updated: [0], removed: [] });
  t.compare(lastChangeLocal, lastChange);

  lastChange = null;
  lastChangeLocal = null;
  aw1.setLocalState({ x: 4 });
  t.assert(lastChange === null);
  t.assert(/** @type {any} */ (aw2.meta.get(0)).clock === 3);
  t.compare(lastChangeLocal, lastChange);
  aw1.setLocalState(null);
  t.assert(lastChange.removed.length === 1);
  t.compare(aw1.getStates().get(0), undefined);
  t.compare(lastChangeLocal, lastChange);
};

var awareness = /*#__PURE__*/Object.freeze({
  __proto__: null,
  testAwareness: testAwareness
});

/* istanbul ignore if */
if (environment_js.isBrowser) {
  log.createVConsole(document.body);
}

t.runTests({
  awareness
}).then(success => {
  /* istanbul ignore next */
  if (environment_js.isNode) {
    process.exit(success ? 0 : 1);
  }
});
//# sourceMappingURL=test.cjs.map
