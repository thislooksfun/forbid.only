const chai = require("chai");

// Code taken from https://medium.com/@RubenOostinga/combining-chai-and-jest-matchers-d12d1ffd0303
// on Sept 11, 2019
// ================
// Make sure chai and jasmine ".not" play nice together
const originalNot = Object.getOwnPropertyDescriptor(
  chai.Assertion.prototype,
  "not"
).get;
Object.defineProperty(chai.Assertion.prototype, "not", {
  get() {
    Object.assign(this, this.assignedNot);
    return originalNot.apply(this);
  },
  set(newNot) {
    this.assignedNot = newNot;
    return newNot;
  },
});

// Combine both jest and chai matchers on expect
const originalExpect = global.expect;

global.expect = actual => {
  const originalMatchers = originalExpect(actual);
  const chaiMatchers = chai.expect(actual);
  const combinedMatchers = Object.assign(chaiMatchers, originalMatchers);
  return combinedMatchers;
};
// ================
// End code snippet
