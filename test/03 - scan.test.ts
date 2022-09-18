import { expect, should, config } from 'chai';
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

// * TESTING START
describe(SECTION('YScanner - Scanning'), function () {
  beforeEach(function () {
    ys = new YScanner(testText);
  });

  describe('#checkString()', function () {
    it('should return a matched string', function () {
      const result = ys.checkString(goodString);
      expect(result).to.equal(goodString);
    });

    it('should return null on no match', function () {
      const result = ys.checkString(badString);
      expect(result).to.be.null;
    });

    it('should return null for empty input', function () {
      const result = ys.checkString('');
      expect(result).to.be.null;
    });

    it('should be case-insensitive if @insensitive = true', function () {
      ys.insensitive = true;

      const result = ys.checkString(goodStringCI);
      expect(result).to.equal(goodString);
    });

    it('should not update the scanner on match', function () {
      const start = ys.pointer;
      ys.checkString(goodString);

      ys.pointer.should.deep.equal(start);
    });
  });

  describe('#scanString()', function () {
    it('should return a matched string', function () {
      const result = ys.scanString(goodString);
      expect(result).to.equal(goodString);
    });

    it('should return null on no match', function () {
      const result = ys.scanString(badString);
      expect(result).to.be.null;
    });

    it('should return null for empty input', function () {
      const result = ys.scanString('');
      expect(result).to.be.null;
    });

    it('should be case-insensitive if @insensitive = true', function () {
      ys.insensitive = true;

      const result = ys.scanString(goodStringCI);
      expect(result).to.equal(goodString);
    });

    it('should update the scanner on match', function () {
      ys.scanString(goodString);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.equal(goodString);
    });
  });

  describe('#checkRegex()', function () {
    it('should return a matched string', function () {
      const result = ys.checkRegex(goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should return null on no match', function () {
      const result = ys.checkRegex(badRegex);
      expect(result).to.be.null;
    });

    it('should return null for empty input', function () {
      const result = ys.checkRegex(new RegExp(''));
      expect(result).to.be.null;
    });

    it('should be case-insensitive if @insensitive = true', function () {
      ys.insensitive = true;

      const result = ys.checkRegex(goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should not update the scanner on match', function () {
      const start = ys.pointer;
      ys.checkRegex(goodRegex);

      ys.pointer.should.deep.equal(start);
    });
  });

  describe('#scanRegex()', function () {
    it('should return a matched string', function () {
      const result = ys.scanRegex(goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should return null on no match', function () {
      const result = ys.scanRegex(badRegex);
      expect(result).to.be.null;
    });

    it('should return null for empty input', function () {
      const result = ys.scanRegex(new RegExp(''));
      expect(result).to.be.null;
    });

    it('should be case-insensitive if @insensitive = true', function () {
      ys.insensitive = true;

      const result = ys.scanRegex(goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should update the scanner on match', function () {
      ys.scanRegex(goodRegex);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.equal(goodString);
    });
  });

  describe('#check()', function () {
    it('should return matched text for string pattern', function () {
      const result = ys.check(goodString);
      expect(result).to.equal(goodString);
    });

    it('should return matched text for regex pattern', function () {
      const result = ys.check(goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should return null for unmatched string pattern', function () {
      const result = ys.check(badString);
      expect(result).to.be.null;
    });

    it('should return null for unmatched regex pattern', function () {
      const result = ys.check(badRegex);
      expect(result).to.be.null;
    });

    it('should return first match of multiple mixed patterns', function () {
      const result = ys.check(badString, badRegex, goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should return null if multiple patterns fail', function () {
      const result = ys.check(badString, badRegex);
      expect(result).to.be.null;
    });

    it('should return null for empty input', function () {
      const result = ys.check('', new RegExp(''));
      expect(result).to.be.null;
    });

    it('should be case-insensitive if @insensitive = true', function () {
      ys.insensitive = true;

      let result = ys.check(goodRegexCI);
      expect(result).to.equal(goodString);

      ys.reset();
      ys.insensitive = true;

      result = ys.check(goodStringCI);
      expect(result).to.equal(goodString);
    });

    it('should not update the scanner on match', function () {
      const start = ys.pointer;
      ys.check(goodString);

      ys.pointer.should.deep.equal(start);
    });
  });

  describe('#scan()', function () {
    it('should return matched text for string pattern', function () {
      const result = ys.scan(goodString);
      expect(result).to.equal(goodString);
    });

    it('should return matched text for regex pattern', function () {
      const result = ys.scan(goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should return null for unmatched string pattern', function () {
      const result = ys.scan(badString);
      expect(result).to.be.null;
    });

    it('should return null for unmatched regex pattern', function () {
      const result = ys.scan(badRegex);
      expect(result).to.be.null;
    });

    it('should return first match of multiple mixed patterns', function () {
      const result = ys.scan(badString, badRegex, goodRegex);
      expect(result).to.equal(goodString);
    });

    it('should return null if multiple patterns fail', function () {
      const result = ys.scan(badString, badRegex);
      expect(result).to.be.null;
    });

    it('should return null for empty input', function () {
      const result = ys.scan('', new RegExp(''));
      expect(result).to.be.null;
    });

    it('should be case-insensitive if @insensitive = true', function () {
      ys.insensitive = true;

      let result = ys.scan(goodRegexCI);
      expect(result).to.equal(goodString);

      ys.reset();
      ys.insensitive = true;

      result = ys.scan(goodStringCI);
      expect(result).to.equal(goodString);
    });

    it('should update the scanner on match', function () {
      ys.scan(goodString);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.equal(goodString);
    });
  });

  describe('#skip()', function () {
    it('should skip the length of the matched text', function () {
      ys.skip(goodString);
      ys.pos.should.equal(goodString.length);
    });

    it('should not move if no match', function () {
      ys.skip(badString);
      ys.pos.should.equal(0);
    });

    it('should return 0 on no match', function () {
      const skipped = ys.skip(badString);
      skipped.should.equal(0);
    });

    it('should match the first good pattern', function () {
      const skipped = ys.skip(badString, goodRegex);
      skipped.should.be.greaterThan(0);
    });

    it('should only change position, not @lastMatch', function () {
      ys.skip(goodString);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });

    it('should be case-insensitive if @insensitive = true', function () {
      ys.insensitive = true;

      ys.skip(goodStringCI);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });
  });
});
