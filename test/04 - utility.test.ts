import { expect, should, config, assert, use } from 'chai';
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
  goodString2,
} from './constants';

// Initialize chai.should so that it can be used.
should();

// Disable truncation from chai output.
config.truncateThreshold = 0;

let ys: YScanner;

// TODO: This
// * TESTING START
describe(SECTION('YScanner - Utilities'), function () {
  beforeEach(function () {
    ys = new YScanner(testText);
  });

  describe('#scanDelimited', function () {
    it('should scan a double-quoted string by default', function () {
      // TODO
    });
  });

  describe('#scanUntil()', function () {
    //
  });

  describe('#checkInteger()', function () {
    //
  });

  describe('#scanInteger()', function () {
    //
  });

  describe('#checkDecimal()', function () {
    //
  });

  describe('#scanDecimal()', function () {
    //
  });
});
