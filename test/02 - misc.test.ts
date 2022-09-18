import { expect, should, config } from 'chai';
import { YScanner } from '../out/index';
import { SECTION } from './utils';
import {
  testText,
  goodString,
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

// * TESTING START
describe(SECTION('YScanner - Misc'), function () {
  beforeEach(function () {
    ys = new YScanner(testText);
  });

  describe('#loadPointer()', function () {
    it('should update scanner state to what is in the pointer', function () {
      const start = ys.pointer;

      ys.scan(goodString);
      ys.loadPointer(start);

      ys.pointer.should.deep.equal(start);
    });

    it('should update @lastState before changing state', function () {
      const start = ys.pointer;

      ys.scan(goodString);
      const afterScan = ys.pointer;
      ys.loadPointer(start);

      ys.lastState.should.deep.equal(afterScan);
    });
  });

  describe('#movePosition()', function () {
    it('should move the position n spaces forward if n >= 0', function () {
      ys.movePosition(goodString.length);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });

    it('should move the position n spaces backward if n < 0', function () {
      ys.scan(goodString);

      ys.movePosition(-(goodString.length - 1));

      ys.pos.should.equal(1);
      ys.lastPos.should.equal(goodString.length);
      expect(ys.lastMatch).to.equal(goodString);
    });

    it('should do nothing if n = 0', function () {
      ys.scan(goodString);

      const afterMatch = ys.pointer;

      ys.movePosition(0);

      ys.pointer.should.deep.equal(afterMatch);
    });

    it('should set position to 0 if pos - n < 0', function () {
      ys.movePosition(-1000);

      ys.pos.should.equal(0);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;

      ys.scan(goodString);
      ys.movePosition(-1000);

      ys.pos.should.equal(0);
      ys.lastPos.should.equal(goodString.length);
      expect(ys.lastMatch).to.equal(goodString);
    });

    it('should set position to text length if pos + n > length', function () {
      ys.movePosition(testText.length + 1);

      ys.pos.should.equal(testText.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });
  });

  describe('#setPosition()', function () {
    it('should set the scan position to n', function () {
      ys.setPosition(goodString.length);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });

    it('should set position to 0 if n < 0', function () {
      ys.setPosition(-100);

      ys.pos.should.equal(0);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });

    it('should set position to text length if n > length', function () {
      ys.setPosition(testText.length + 1);

      ys.pos.should.equal(testText.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });
  });

  describe('#peek()', function () {
    it('should peek 1 character by default', function () {
      const char = ys.peek();
      char.should.equal(testText.slice(0, 1));
    });

    it('should peek n characters', function () {
      const chars = ys.peek(goodString.length);
      chars.should.equal(goodString);
    });

    it('should peek whatever is left if less than n characters', function () {
      ys.setPosition(testText.length - 1);
      const chars = ys.peek(2);

      chars.length.should.equal(1);
      chars.length.should.not.equal(2);

      ys.setPosition(0);

      const otherChars = ys.peek(ys.text.length + 10);
      otherChars.should.equal(ys.text);
      otherChars.length.should.not.equal(ys.text.length + 10);
    });

    it('should return an empty string if nothing left', function () {
      ys.setPosition(ys.text.length);

      const chars = ys.peek(10);
      chars.should.be.empty;
    });

    it('should not update the scan pointer', function () {
      ys.peek(goodString.length);

      ys.pos.should.equal(0);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
    });
  });

  describe('#grab()', function () {
    it('should grab 1 character by default', function () {
      const char = ys.grab();
      char.should.equal(testText.slice(0, 1));
    });

    it('should grab n characters', function () {
      const chars = ys.grab(goodString.length);
      chars.should.equal(goodString);
    });

    it('should grab whatever is left if less than n characters', function () {
      ys.setPosition(testText.length - 1);
      const chars = ys.grab(2);

      chars.length.should.equal(1);
      chars.length.should.not.equal(2);

      ys.setPosition(0);

      const otherChars = ys.grab(ys.text.length + 10);
      otherChars.should.equal(ys.text);
      otherChars.length.should.not.equal(ys.text.length + 10);
    });

    it('should return an empty string if nothing left', function () {
      ys.setPosition(ys.text.length);

      const chars = ys.grab(10);
      chars.should.be.empty;
    });

    it('should update the scan pointer', function () {
      ys.grab(goodString.length);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.equal(goodString);
    });
  });

  describe('#reset()', function () {
    it('should reset scanner state, insensitive, and lastState', function () {
      const start = ys.pointer;
      ys.scan(goodString);

      ys.reset();

      ys.pos.should.equal(0);
      ys.lastPos.should.equal(0);
      expect(ys.lastMatch).to.be.null;
      ys.insensitive.should.be.false;
      ys.lastState.should.deep.equal(start);
    });
  });

  describe('#terminate()', function () {
    it('should put the scan pointer at the end', function () {
      ys.terminate();
      ys.pos.should.equal(ys.text.length);
    });

    it('should clear @lastMatch if clear = true', function () {
      ys.scan(goodString);
      ys.terminate({ clear: true });

      expect(ys.lastMatch).to.be.null;
    });
  });

  describe('#updateMatch()', function () {
    it('should move the scanner position by the match length', function () {
      ys.updateMatch(goodString);

      ys.pos.should.equal(goodString.length);
      ys.lastPos.should.equal(0);
    });

    it('should update @lastMatch', function () {
      ys.updateMatch(goodString);
      expect(ys.lastMatch).to.equal(goodString);
    });
  });

  describe('#unscan()', function () {
    it('should reverse the previous update', function () {
      const start = ys.pointer;

      ys.scan(goodString);
      const afterMatch = ys.pointer;

      ys.unscan();

      ys.pointer.should.deep.equal(start);
      ys.lastState.should.deep.equal(afterMatch);
    });
  });

  describe('#duplicate()', function () {
    it('should create a deep copy of the object', function () {
      const dup = ys.duplicate();

      dup.should.deep.equal(ys);
      dup.should.not.equal(ys);
    });
  });

  describe('#append()', function () {
    it('should append text to the end of @text', function () {
      ys.append(goodString);
      ys.text.should.equal(testText + goodString);
    });

    it('should not adjust the scanner state', function () {
      const start = ys.pointer;

      ys.append(goodString);
      ys.pointer.should.deep.equal(start);
    });
  });

  describe('#prepend()', function () {
    it('should prepend text to the start of @text', function () {
      ys.prepend(goodString);
      ys.text.should.equal(goodString + testText);
    });

    it('should adjust the scanner position if reset = false', function () {
      ys.scan(goodString);
      ys.prepend(goodString);

      ys.pos.should.equal(goodString.length * 2);
    });

    it('should reset the scanner if reset = true', function () {
      ys.scan(goodString);
      ys.prepend(goodString, { reset: true });

      ys.pos.should.equal(0);
    });
  });
});
