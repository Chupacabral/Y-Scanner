import { deepCopy } from './deep_copy';

export interface ScannerState {
  readonly pos: number;
  readonly lastPos: number;
  readonly lastMatch: string | null;
}

type Mutable<T> = { -readonly [K in keyof T]: T[K] };
type mut = Mutable<YScanner>;
/**
 * An object type that defines the information used for scanning delimited
 * text.
 *
 * @property `start`: The starting delimiter for the text.
 * @property `end`: The ending delimiter for the text.
 * @property `escape`: The text that marks an escape sequence in the text.
 * @property `keepDelimiters`: Whether to keep the delimiters with the text
 *                             on a successful scan, or leave them off.
 * @property `internal`: Any types of inner delimited text that can show
 *                       up in the overall delimited text.
 */
export type DelimitedTextInfo = {
  start?: string;
  end?: string;
  escape?: string;
  keepDelimiters?: boolean;
  inner?: InnerDelimitedTextInfo[];
};

/**
 * An object type that is effectively the same as {@link DelimitedTextInfo},
 * but the `start` and `end` properties are required. Used for instances of
 * inner delimited text within an overall group of delimited text.
 *
 * @property `start`: The starting delimiter for the text.
 * @property `end`: The ending delimiter for the text.
 * @property `escape`: The text that marks an escape sequence in the text.
 * @property `keepDelimiters`: Whether to keep the delimiters with the text
 *                             on a successful scan, or leave them off.
 * @property `internal`: Any types of inner delimited text that can show
 *                       up in this delimited text.
 *                       (Yes, you can have nested internal delimited text)
 */
export type InnerDelimitedTextInfo = {
  start: string;
  end: string;
  escape?: string;
  keepDelimiters?: boolean;
  inner?: InnerDelimitedTextInfo[];
};

export class YScanner {
  public readonly lastState: ScannerState = {
    pos: 0,
    lastPos: 0,
    lastMatch: null,
  };
  public readonly text: string;
  public readonly pos: number = 0;
  public readonly lastPos: number = 0;
  public readonly lastMatch: string | null = null;
  public insensitive: boolean = false;

  constructor(text: string) {
    this.text = text;
  }

  public get unscannedText() {
    return this.text.slice(this.pos);
  }

  public get scannedText() {
    return this.text.slice(0, this.pos);
  }

  private updateLastState() {
    (<mut>this).lastState = {
      pos: this.pos,
      lastPos: this.lastPos,
      lastMatch: this.lastMatch,
    };
  }

  public get pointer(): ScannerState {
    return { pos: this.pos, lastPos: this.lastPos, lastMatch: this.lastMatch };
  }

  public loadPointer(pointer: ScannerState) {
    this.updateLastState();

    (<mut>this).pos = pointer.pos;
    (<mut>this).lastPos = pointer.lastPos;
    (<mut>this).lastMatch = pointer.lastMatch;
  }

  public movePosition(n: number) {
    this.updateLastState();

    (<mut>this).lastPos = this.pos;
    (<mut>this).pos += n;

    if ((<mut>this).pos < 0) {
      (<mut>this).pos = 0;
    }
    else if ((<mut>this).pos > this.text.length) {
      (<mut>this).pos = this.text.length;
    }
  }

  public setPosition(n: number) {
    this.updateLastState();

    (<mut>this).lastPos = this.pos;
    (<mut>this).pos = n;

    if ((<mut>this).pos < 0) {
      (<mut>this).pos = 0;
    }
    else if ((<mut>this).pos > this.text.length) {
      (<mut>this).pos = this.text.length;
    }
  }

  public reset() {
    (<mut>this).pos = 0;
    (<mut>this).lastPos = 0;
    (<mut>this).lastMatch = null;
    (<mut>this).insensitive = false;
    (<mut>this).lastState = {
      pos: 0,
      lastPos: 0,
      lastMatch: null,
    };
  }

  public updateMatch(match: string) {
    this.movePosition(match.length);
    (<mut>this).lastMatch = match;
  }

  public undoLastMovement() {
    const previousLastState = this.pointer;

    (<mut>this).pos = this.lastState.pos;
    (<mut>this).lastPos = this.lastState.lastPos;
    (<mut>this).lastMatch = this.lastState.lastMatch;
    (<mut>this).lastState = previousLastState;
  }

  public duplicate(): YScanner {
    const dup = new YScanner(this.text);

    (<mut>dup).pos = this.pos;
    (<mut>dup).lastPos = this.lastPos;
    (<mut>dup).lastMatch = deepCopy(this.lastMatch);
    (<mut>dup).lastState = deepCopy(this.lastState);
    (<mut>dup).insensitive = this.insensitive;

    return dup;
  }

  public checkString(s: string): string | null {
    if (s == '') {
      return null;
    }

    const cased = (t: string) => (this.insensitive ? t.toLowerCase() : t);
    const text = this.unscannedText;
    const match = cased(text).startsWith(cased(s));

    return match ? text.slice(0, s.length) : null;
  }

  public scanString(s: string): string | null {
    const match = this.checkString(s);

    if (match !== null) {
      this.updateMatch(match);
    }

    return match;
  }

  public checkRegex(r: RegExp): string | null {
    // Empty regex gets set to (?:)
    if (r.source === '(?:)') {
      return null;
    }

    let rSource = r.source;
    let rFlags = r.flags;

    if (!rSource.startsWith('^')) {
      rSource = '^' + rSource;
    }

    if (this.insensitive && !rFlags.includes('i')) {
      rFlags += 'i';
    }

    const text = this.unscannedText;
    const newR = new RegExp(rSource, rFlags);

    const match = text.match(newR);

    return match ? match[0] : null;
  }

  public scanRegex(r: RegExp): string | null {
    const match = this.checkRegex(r);

    if (match !== null) {
      this.updateMatch(match);
    }

    return match;
  }

  public check(...options: (string | RegExp)[]): string | null {
    let match: string | null = null;

    for (const option of options) {
      match =
        typeof option === 'string'
          ? this.checkString(option)
          : this.checkRegex(option);

      if (match !== null) {
        break;
      }
    }

    return match;
  }

  public scan(...options: (string | RegExp)[]): string | null {
    const match: string | null = this.check(...options);

    if (match) {
      this.updateMatch(match);
    }

    return match;
  }

  public get eos() {
    return this.pos >= this.text.length;
  }

  /**
   * Attempts to scan an instance of text between two delimiters.
   *
   * This method allows for start, end, and escape text to be arbitrary lengths
   * instead of a single character, the option to automatically strip the
   * delimiters from the output, and the ability to recursively scan nested
   * instances of delimited text.
   *
   * The last option allows for powerful options such as parsing something like:
   * ```c
   * [ This is stuff in a bracket and "a string with the \"[]\" inside it" ]
   * ```
   * which has text delimited between square brackets, with an inner instance
   * of a delimited string containing square brackets and escaped quotes within
   * this string.
   *
   * @param options An options object of type {@link DelimitedTextInfo}.
   *
   *                Any {@link InternalDelimitedTextInfo} instances stored in
   *                the `inner` option will have the optional
   *                `escape` and `keepDelimiters` properties default to whatever
   *                is given within the `options` parameter for this method.
   *
   * @default ```js
   * {
   *   start: '"', end: '"', escape: '\\', keepDelimiters: false, inner: []
   * }
   * ```
   * The default values for `options` will scan a basic double-quote delimited
   * string with backslash escape characters, so for the basic use case you
   * can simply call the method with no arguments.
   *
   * @returns The string of delimited text matched, or `null` if no match.
   */
  public scanDelimited(
    {
      start = '"',
      end = '"',
      escape = '\\',
      keepDelimiters = false,
      inner = [],
    }: DelimitedTextInfo = {
      start: '"',
      end: '"',
      escape: '\\',
      keepDelimiters: false,
      inner: [],
    },
  ): string | null {
    const dup = this.duplicate();
    const startDelimiter = dup.scan(start);
    let endDelimiter: string | null = null;

    // Obviously not delimited text if no delimiter to start it.
    if (startDelimiter === null) {
      return null;
    }

    let escaped = false;
    let match = '';
    // Regex for any single character. The ^ and i are to optimize for
    // how the scanner processes regexes.
    const character = /^./is;

    const innerStarts = inner.map((i) => i.start);
    const hasinners = inner.length > 0;
    let innerStart: string | null = null;
    let innerType: InnerDelimitedTextInfo | undefined;

    while (!dup.eos) {
      // An escape means we cannot terminate, so just scan and go.
      if (escaped) {
        match += dup.scan(character);
        escaped = false;
        continue;
      }
      else {
        // Check if end delimiter found.
        // The end delimiter signifies the end of the match, of course.
        endDelimiter = dup.scan(end);

        if (endDelimiter !== null) {
          break;
        }

        // If escape character found, then toggle escape flag and increase
        // number of escapes found.
        if (dup.scan(escape) !== null) {
          escaped = true;
          continue;
        }

        if (hasinners && dup.scan(...innerStarts) !== null) {
          innerStart = dup.lastMatch;
          dup.undoLastMovement();

          innerType = inner.find(
            (i) => i.start === innerStart,
          ) as InnerDelimitedTextInfo;

          innerType.escape = innerType?.escape ?? escape;
          innerType.inner = innerType.inner ?? [];
          innerType.keepDelimiters = innerType.keepDelimiters ?? keepDelimiters;

          match += dup.scanDelimited(innerType as DelimitedTextInfo);
        }
        else {
          match += dup.scan(character);
        }
      }
    }

    const fullMatch = startDelimiter + match + endDelimiter;

    if (endDelimiter === null) {
      return null;
    }

    // If match, copy duplicate pointer to this.
    this.loadPointer({
      pos: dup.pos,
      lastPos: this.pos,
      lastMatch: fullMatch,
    });

    return keepDelimiters ? fullMatch : match;
  }
}
