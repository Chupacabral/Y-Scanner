import { expect, should, config, assert } from 'chai';
import { YScanner } from '../out/index';
import { SECTION } from './utils';
import {
  testText,
  goodString,
  goodStringCI,
  // badString,
  // goodRegex,
  // goodRegexCI,
  // badRegex,
  // testEnumOutput,
  // testPointerName,
  // testTypeName,
  // testMacroName,
  goodString2,
} from './constants';

// Initialize chai.should so that it can be used.
should();

// Disable truncation from chai output.
config.truncateThreshold = 0;

let ys: YScanner;

// * TESTING START
describe(SECTION('YScanner - Base'), function () {
  beforeEach(function () {
    ys = new YScanner(testText);
  });

  describe('@lastState', function () {
    it('should exist', function () {
      ys.should.have.property('lastState');
    });

    it('should start with { 0, 0, null }', function () {
      ys.lastState.should.deep.equal({ pos: 0, lastPos: 0, lastMatch: null });
    });

    it('should equal the previous scanner match state', function () {
      ys.scan(goodString);
      ys.lastState.should.deep.equal({ pos: 0, lastPos: 0, lastMatch: null });

      ys.scan(goodString2);

      ys.lastState.should.deep.equal({
        pos: goodString.length,
        lastPos: 0,
        lastMatch: goodString,
      });
    });
  });

  describe('@text', function () {
    it('should exist', function () {
      ys.should.have.property('text');
    });

    it('should equal the text given to the constructor', function () {
      ys.text.should.equal(testText);
    });
  });

  describe('@pos', function () {
    it('should exist', function () {
      ys.should.have.property('pos');
    });

    it('should start at 0', function () {
      ys.pos.should.equal(0);
    });

    it('should equal the current scanner position', function () {
      ys.scan(goodString);

      ys.pos.should.equal(goodString.length);
    });
  });

  describe('@lastPos', function () {
    it('should exist', function () {
      ys.should.have.property('lastPos');
    });

    it('should start at 0', function () {
      ys.lastPos.should.equal(0);
    });

    it('should equal the current scanner position', function () {
      ys.scan(goodString);
      ys.lastPos.should.equal(0);

      ys.scan(goodString2);
      ys.lastPos.should.equal(goodString.length);
    });
  });

  describe('@lastMatch', function () {
    it('should exist', function () {
      ys.should.have.property('lastMatch');
    });

    it('should start at null', function () {
      expect(ys.lastMatch).to.be.null;
    });

    it('should equal the previously matched text', function () {
      ys.scan(goodString);
      expect(ys.lastMatch).to.equal(goodString);
    });
  });

  describe('@insensitive', function () {
    it('should exist', function () {
      ys.should.have.property('insensitive');
    });

    it('should start with false', function () {
      ys.insensitive.should.be.false;
    });

    it('should be writable', function () {
      ys.insensitive = false;
      ys.insensitive = true;
    });

    it('should make scanning case-insensitive if true', function () {
      ys.insensitive = true;

      const result = ys.scan(goodStringCI);
      expect(result).to.not.be.null;
    });

    it('should make scanning case-sensitive if false', function () {
      ys.insensitive = false;

      const result = ys.scan(goodStringCI);
      expect(result).to.be.null;
    });
  });

  describe('#unscannedText', function () {
    it('should equal the text when position is 0', function () {
      ys.unscannedText.should.equal(ys.text);
    });

    it('should be an empty string when scanner is eos', function () {
      ys.scan(testText);
      ys.unscannedText.should.be.empty;
    });

    it('should return the part of the text after the position', function () {
      ys.scan(goodString);
      ys.unscannedText.should.equal(ys.text.slice(goodString.length));
    });
  });

  describe('#scannedText', function () {
    it('should be an empty string when position is 0', function () {
      ys.scannedText.should.be.empty;
    });

    it('should equal the text when scanner is eos', function () {
      ys.scan(testText);
      ys.scannedText.should.equal(ys.text);
    });

    it('should return the part of the text before the position', function () {
      ys.scan(goodString);
      ys.scannedText.should.equal(goodString);
    });
  });

  describe('#pointer', function () {
    it('should equal @lastState at start', function () {
      ys.pointer.should.deep.equal(ys.lastState);
    });

    it('should equal the current scanner state', function () {
      ys.scan(goodString);

      ys.pointer.should.deep.equal({
        pos: ys.pos,
        lastPos: ys.lastPos,
        lastMatch: ys.lastMatch,
      });
    });
  });

  describe('#eos', function () {
    it('should equal whether or not the scanner is at the end', function () {
      let eos = ys.eos;

      eos.should.be.false;

      ys.movePosition(ys.text.length);
      eos = ys.eos;

      eos.should.be.true;
    });
  });

  describe('constructor()', function () {
    it('should set the text to the given text', function () {
      ys.text.should.equal(testText);
    });
  });
});
