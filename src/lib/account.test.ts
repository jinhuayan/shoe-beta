import assert from "node:assert/strict";
import test from "node:test";
import { accountName, passwordError } from "./account";

test("account names trim outer whitespace and reject empty, long, or non-string input", () => {
  assert.equal(accountName("  Jessica 王  "), "Jessica 王");
  assert.equal(accountName("a".repeat(100)), "a".repeat(100));
  for (const value of ["", " \n ", "a".repeat(101), null, {}, 123]) assert.equal(accountName(value), null);
});

test("password changes require the current password, length limits, confirmation and a new value", () => {
  assert.ok(passwordError("", "new-password", "new-password"));
  for (const value of ["short", "x".repeat(129)]) assert.ok(passwordError("old-password", value, value));
  assert.ok(passwordError("old-password", "new-password", "different-password"));
  assert.ok(passwordError("old-password", "old-password", "old-password"));
  assert.equal(passwordError("old-password", "new-password", "new-password"), null);
  assert.equal(passwordError("old-password", "x".repeat(128), "x".repeat(128)), null);
});
