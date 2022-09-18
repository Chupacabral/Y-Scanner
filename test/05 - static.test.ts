import { expect, should, config } from 'chai';
import { YScanner } from '../out/index';
import { SECTION } from './utils';
import {
  testText,
  // goodString,
  // goodStringCI,
  // badString,
  // goodRegex,
  // goodRegexCI,
  // badRegex,
  // testEnumOutput,
  // testPointerName,
  // testTypeName,
  // testMacroName,
  // goodString2,
} from './constants';

// Initialize chai.should so that it can be used.
should();

// Disable truncation from chai output.
config.truncateThreshold = 0;

let ys: YScanner;

// TODO: This
// * TESTING START
describe(SECTION('YScanner - Static'), function () {
  beforeEach(function () {
    ys = new YScanner(testText);
  });

  describe('backscan()', function () {
    //
  });
});
