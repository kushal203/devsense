/**
 * Global test setup — redirects require('vscode') to our CJS mock.
 * Uses _resolveFilename which is writable in Node 24.
 */
'use strict';
const path = require('path');
const Module = require('module');
const original = Module._resolveFilename.bind(Module);
Module._resolveFilename = function (request, ...args) {
  if (request === 'vscode') {
    return path.join(__dirname, 'mocks', 'vscode.js');
  }
  return original(request, ...args);
};
