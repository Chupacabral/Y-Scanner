import { expect, should, config, assert } from 'chai';
import { YScanner } from '../out/index';
import { SECTION } from './utils';
import {
  testText,
  goodString,
  goodStringCI,
  badString,
  goodRegex,
  goodRegexCI,
  badRegex,
  testEnumOutput,
  testPointerName,
  testTypeName,
  testMacroName,
} from './constants';

// Initialize chai.should so that it can be used.
should();

// Disable truncation from chai output.
config.truncateThreshold = 0;

let ys: YScanner;

console.log(
  `
  Key For Mode Names:
  N = Normal Mode
  I = Case Insensitive Mode
  F = Full Output Mode
  A = Advanced Output Mode
`.trim(),
);

// * TESTING START
describe(SECTION('YScanner - Base'), function () {
  beforeEach(function() {
    ys = new YScanner(testText)
  })
});
