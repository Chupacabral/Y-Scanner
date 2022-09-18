import { expect, should, config } from 'chai';
import { YScanner } from '../out/index';
import { SECTION } from './utils';
import {
  testText,
  goodString,
  // badString,
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
describe(SECTION('YScanner - Utilities'), function () {
  beforeEach(function () {
    ys = new YScanner(testText);
  });

  describe('#scanDelimited', function () {
    describe('default behavior', function () {
      it('should scan a double-quoted string by default', function () {
        ys = new YScanner('"' + goodString + '"');

        const result = ys.scanDelimited();
        expect(result).to.exist;
      });

      it('should strip the quotes on match by default', function () {
        ys = new YScanner('"' + goodString + '"');

        const result = ys.scanDelimited();
        expect(result).to.equal(goodString);
      });

      it('should return null if not quoted by default', function () {
        ys = new YScanner(goodString);

        const result = ys.scanDelimited();
        expect(result).to.be.null;
      });

      it('should return null if no ending quote by default', function () {
        ys = new YScanner(goodString);

        const result = ys.scanDelimited();
        expect(result).to.be.null;
      });

      it('should have "\\" as an escape by default', function () {
        ys = new YScanner('"\\"' + goodString + '\\""');

        const result = ys.scanDelimited();
        expect(result).to.equal('"' + goodString + '"');
      });
    });

    describe('option behavior', function () {
      describe('options::start', function () {
        it('should let the start delimiter be changed', function () {
          ys = new YScanner('[' + goodString + '"');

          const result = ys.scanDelimited({ start: '[' });
          expect(result).to.equal(goodString);
        });

        it('should still return null on fail if changed', function () {
          ys = new YScanner('<' + goodString + '"');

          const result = ys.scanDelimited({ end: '[' });
          expect(result).to.be.null;
        });
      });

      describe('options::end', function () {
        it('should let the end delimiter be changed', function () {
          ys = new YScanner('"' + goodString + ']');

          const result = ys.scanDelimited({ end: ']' });
          expect(result).to.equal(goodString);
        });

        it('should still return null on fail if end is changed', function () {
          ys = new YScanner('<' + goodString + '"');

          const result = ys.scanDelimited({ end: ']' });
          expect(result).to.be.null;
        });
      });

      describe('options::escape', function () {
        it('should let the escape character be changed', function () {
          ys = new YScanner('"/"' + goodString + '/""');

          const result = ys.scanDelimited({ escape: '/' });
          expect(result).to.equal('"' + goodString + '"');
        });

        it('should still return null on fail if escape changed', function () {
          ys = new YScanner(goodString);

          const result = ys.scanDelimited({ escape: '/' });
          expect(result).to.be.null;
        });

        it('should not escape anything if set to null', function () {
          ys = new YScanner('"\\' + goodString + '\\"');

          const result = ys.scanDelimited({ escape: null });
          expect(result).to.equal('\\' + goodString + '\\');
        });
      });

      describe('options::keepDelimiters', function () {
        it('should keep delimiters if true', function () {
          ys = new YScanner('"' + goodString + '"');

          const result = ys.scanDelimited({ keepDelimiters: true });
          expect(result).to.equal('"' + goodString + '"');
        });

        it('should not keep delimiters if false', function () {
          ys = new YScanner('"' + goodString + '"');

          const result = ys.scanDelimited({ keepDelimiters: false });
          expect(result).to.equal(goodString);
        });
      });

      describe('options::inner', function () {
        it('should allow for inner delimited text if given', function () {
          ys = new YScanner('"' + goodString + '[' + goodString + ']"');

          const result = ys.scanDelimited({
            inner: [{ start: '[', end: ']' }],
          });

          expect(result).to.equal(goodString + '[' + goodString + ']');
        });

        it('should fail if inner has no end by default', function () {
          ys = new YScanner('"' + goodString + '[' + goodString + '"');

          const result = ys.scanDelimited({
            inner: [{ start: '[', end: ']' }],
          });

          expect(result).to.be.null;
        });

        it('should not fail if inner has no end w/ noEndFail off', function () {
          ys = new YScanner('"' + goodString + '[' + goodString + '"');

          const result = ys.scanDelimited({
            inner: [{ start: '[', end: ']' }],
            noEndFail: false,
          });

          expect(result).to.equal(goodString + '[' + goodString);
        });

        it('should allow for nested inner text', function () {
          const input =
            '"' +
            goodString +
            '[' +
            goodString +
            '<' +
            goodString +
            '>' +
            ']' +
            '"';

          ys = new YScanner(input);

          const result = ys.scanDelimited({
            inner: [
              {
                start: '[',
                end: ']',
                inner: [
                  {
                    start: '<',
                    end: '>',
                  },
                ],
              },
            ],
          });

          expect(result).to.equal(input.slice(1, -1));
        });

        it('should not fail with multiple nests w/ noEndFail off', function () {
          const input =
            '"' + goodString + '[' + goodString + '<' + goodString + ']' + '"';

          ys = new YScanner(input);

          const result = ys.scanDelimited({
            inner: [
              {
                start: '[',
                end: ']',
                inner: [
                  {
                    start: '<',
                    end: '>',
                  },
                ],
              },
            ],
            noEndFail: false,
          });

          expect(result).to.equal(input.slice(1, -1));
        });

        it('should allow for multiple inner options', function () {
          const input =
            '"' +
            goodString +
            '<' +
            goodString +
            '>' +
            '[' +
            goodString +
            ']' +
            goodString +
            '"';

          ys = new YScanner(input);

          const result = ys.scanDelimited({
            inner: [
              { start: '[', end: ']' },
              { start: '<', end: '>' },
            ],
          });

          expect(result).to.equal(input.slice(1, -1));
        });
      });

      describe('options::autoNest', function () {
        it('should automatically copy & nest the delimited text', function () {
          const input = `{
            if (y) {
              if (z) {

              }
            }
          }`;

          ys = new YScanner(input);

          const result = ys.scanDelimited({
            start: '{',
            end: '}',
            escape: null,
            autoNest: {},
            keepDelimiters: true,
          });

          expect(result).to.equal(input);
        });

        it('should allow override from parent settings', function () {
          // Quadruple nested quoted text.
          const input = `"x 'y 'z 'a' ' ' x"`;

          ys = new YScanner(input);

          const result = ys.scanDelimited({
            autoNest: { start: "'", end: "'" },
            keepDelimiters: true,
          });

          expect(result).to.equal(input);
        });

        it('should work when combined with inners', function () {
          const input = '"hello <"world!">"';

          ys = new YScanner(input);

          const result = ys.scanDelimited({
            inner: [{ start: '<', end: '>' }],
            autoNest: {},
            keepDelimiters: true,
          });

          expect(result).to.equal(input);
        });
      });

      describe('options::noEndFail', function () {
        it('should return null if true and no end keepDelimiters', function () {
          const input = '"Bad String';
          ys = new YScanner(input);

          const result = ys.scanDelimited({ noEndFail: true });
          expect(result).to.be.null;
        });

        it('should default to true', function () {
          const input = '"Bad String';
          ys = new YScanner(input);

          const result = ys.scanDelimited();
          expect(result).to.be.null;
        });

        it('should return matched text if false and no end', function () {
          const input = '"Bad String';
          ys = new YScanner(input);

          const result = ys.scanDelimited({ noEndFail: false });
          expect(result).to.equal(input.slice(1));
        });
      });
    });
  });

  describe('#scanUntil()', function () {
    describe('default behavior', function () {
      it('should get all the text until any found pattern', function () {
        const input = 'Here is some text before a brace {';
        ys = new YScanner(input);

        const result = ys.scanUntil(['{']);
        expect(result).to.equal(input.slice(0, -1));
      });

      it('should not include the found pattern by default', function () {
        const input = 'Here is some text before a bracket <';
        ys = new YScanner(input);

        const result = ys.scanUntil(['<']);
        expect(result).to.equal(input.slice(0, -1));
      });

      it('should allow multiple options of string/regex', function () {
        const input = 'Here is some text before a bracket <';
        ys = new YScanner(input);

        const result = ys.scanUntil(['{', '(', /</]);
        expect(result).to.equal(input.slice(0, -1));
      });

      it('should not fail if no pattern found by default', function () {
        const input = 'Here is some text before a brace';
        ys = new YScanner(input);

        const result = ys.scanUntil(['{']);
        expect(result).to.equal(input);
      });
    });

    describe('option behavior', function () {
      describe('options::failIfNone', function () {
        it('should return null if true and no pattern found', function () {
          const input = 'Here is some text before a brace';
          ys = new YScanner(input);

          const result = ys.scanUntil(['{'], { failIfNone: true });
          expect(result).to.be.null;
        });

        it('should return text if false and no pattern found', function () {
          const input = 'Here is some text before a brace';
          ys = new YScanner(input);

          const result = ys.scanUntil(['{'], { failIfNone: false });
          expect(result).to.equal(input);
        });
      });

      describe('options::includePattern', function () {
        it('should add pattern text if true and pattern found', function () {
          const input = 'Here is some text before a brace {';
          ys = new YScanner(input);

          const result = ys.scanUntil(['{'], { includePattern: true });
          expect(result).to.equal(input);
        });

        it('should cut pattern text if false and pattern found', function () {
          const input = 'Here is some text before a brace {';
          ys = new YScanner(input);

          const result = ys.scanUntil(['{'], { includePattern: false });
          expect(result).to.equal(input.slice(0, -1));
        });
      });
    });
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
