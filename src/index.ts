// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepCopy(obj: any) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.reduce((arr, item, i) => {
      arr[i] = deepCopy(item);
      return arr;
    }, []);
  }

  if (obj instanceof Object) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.keys(obj).reduce((newObj: any, key) => {
      newObj[key] = deepCopy(obj[key]);
      return newObj;
    }, {});
  }
}

//? Double check if this is needed later
// function escapeRegex(s: string) {
//   return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
// }

/**
 * An object representing a specified state of a {@link YScanner}.
 */
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
 * @property `inner`: Any types of inner delimited text that can show
 *                    up within the overall delimited text.
 * @property `autoNest`: A {@link DelimitedTextInfo} object that represents
 *                       the information to use to automatically generate
 *                       an inner nested instance of delimited text.
 *                       Generally, this automatic nested text is intended
 *                       to be based off of the parent delimited text (and
 *                       will fill in default values based on it), but can
 *                       technically be whatever you want.
 * @property `noEndFail`: Whether matching an end delimiter counts as
 *                        a scanning failure.
 */
export type DelimitedTextInfo = {
  start?: string;
  end?: string;
  escape?: string | null;
  keepDelimiters?: boolean;
  inner?: InnerDelimitedTextInfo[];
  autoNest?: DelimitedTextInfo;
  noEndFail?: boolean;
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
 * @property `autoNest`: Like `autoNest` in {@link DelimitedTextInfo}, but
 *                       based on this inner delimited text instead.
 * @property `noEndFail`: Whether matching an end delimiter counts as
 *                        a scanning failure.
 */
export type InnerDelimitedTextInfo = {
  start: string;
  end: string;
  escape?: string | null;
  keepDelimiters?: boolean;
  inner?: InnerDelimitedTextInfo[];
  autoNest?: DelimitedTextInfo;
  noEndFail?: boolean;
};

/**
 * An object type that represents the result from the YScanner
 * `checkInteger()` or `scanInteger()` methods with the `split` option turned
 * on.
 *
 * This object will contain all the scanned portions of the integer found,
 * with anything unscanned being set to `null`.
 */
export type IntegerScanSplitResult = {
  sign: string | null;
  prefix: string | null;
  leading: string | null;
  number: string;
  postfix: string | null;
};

/**
 * An object type that represents the result from the YScanner
 * `checkDecimal()` or `scanDecimal()` methods with the `split` option turned
 * on.
 *
 * This object will contain all the scanned portions of the number found,
 * with anything unscanned being set to `null`.
 */
export type DecimalScanSplitResult = {
  sign: string | null;
  prefix: string | null;
  leading: string | null;
  whole: string | null;
  radix: string | null;
  fractional: string | null;
  number: string;
  trailing: string | null;
  postfix: string | null;
};

/**
 * A lexical scanner that takes a string and operates on it.
 */
export class YScanner {
  /**
   * A pointer containing the previous state of the scanner from before
   * the latest update.
   */
  public readonly lastState: ScannerState = {
    pos: 0,
    lastPos: 0,
    lastMatch: null,
  };
  /**
   * The text the scanner is scanning over.
   */
  public readonly text: string;
  /**
   * The current scanner position along the text.
   */
  public readonly pos: number = 0;
  /**
   * The previous scanner position along the text.
   */
  public readonly lastPos: number = 0;
  /**
   * The latest match found from the scanner.
   */
  public readonly lastMatch: string | null = null;
  /**
   * Whether or not the {@link YScanner } scans in a case-insensitive manner
   * or not.
   */
  public insensitive: boolean = false;

  /**
   * Creates a {@link YScanner } instance for the specified text.
   * @param text The text to have the scanner scan through.
   */
  constructor(text: string) {
    this.text = text;
  }

  /**
   * The text that has yet to be scanned from the scanner.
   */
  public get unscannedText() {
    return this.text.slice(this.pos);
  }

  /**
   * The text that has already been scanned from the scanner.
   */
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

  /**
   * A pointer representing the current scanner state.
   * @see {@link ScannerState }
   */
  public get pointer(): ScannerState {
    return { pos: this.pos, lastPos: this.lastPos, lastMatch: this.lastMatch };
  }

  /**
   * Loads the scanner state specified from the given scan pointer, and sets
   * the scanner state to it.
   *
   * @param pointer The pointer to set the scanner state with.
   * @see {@link ScannerState }
   */
  public loadPointer(pointer: ScannerState) {
    this.updateLastState();

    (<mut>this).pos = pointer.pos;
    (<mut>this).lastPos = pointer.lastPos;
    (<mut>this).lastMatch = pointer.lastMatch;
  }

  /**
   * Moves the scanner position `n` characters along the scanned text.
   *
   * Note that if the new position is outside of the boundaries of the scanner
   * text, it will set the position to the beginning/end of the text instead.
   *
   * @param n The amount to adjust the scanner position.
   */
  public movePosition(n: number) {
    if (n === 0) {
      return;
    }

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

  /**
   * Sets the scanner position to the index specified at `n`.
   *
   * Note that if `n` is outside of the boundaries of the scanner text, it
   * will set the position to the beginning/end of the text instead.
   *
   * @param n The position to set the scanner position to.
   */
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

  /**
   * Get the next `n` characters from the upcoming text to be scanned.
   * If the amount of characters left is less than `n`, then whatever is
   * left will be returned.
   *
   * Does not update the scanner.
   *
   * @param n The amount of characters to peek.
   * @returns The next `n` characters, or whatever is left if less than `n`.
   */
  public peek(n: number = 1) {
    return this.unscannedText.slice(0, n);
  }

  /**
   * Get the next `n` characters from the upcoming text to be scanned.
   * If the amount of characters left is less than `n`, then whatever is
   * left will be returned.
   *
   * Updates the scanner with the returned text.
   *
   * @param n The amount of characters to peek.
   * @returns The next `n` characters, or whatever is left if less than `n`.
   */
  public grab(n: number = 1) {
    const text = this.peek(n);

    this.updateMatch(text);

    return text;
  }

  /**
   * Resets the properties on the scanner to their starting values.
   */
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

  /**
   * Updates the scanner state using a string that represents the latest
   * match from the scanner.
   *
   * *Not intended for normal use; any methods intended to update the scanner
   * already use this method. This method is only public as an option in the
   * case you somehow need it.*
   *
   * @param match A string that the scanner matched.
   */
  public updateMatch(match: string) {
    this.movePosition(match.length);
    (<mut>this).lastMatch = match;
  }

  /**
   * Resets the scanner state to the previous pointer state, before the latest
   * match.
   */
  public unscan() {
    const previousLastState = this.pointer;

    (<mut>this).pos = this.lastState.pos;
    (<mut>this).lastPos = this.lastState.lastPos;
    (<mut>this).lastMatch = this.lastState.lastMatch;
    (<mut>this).lastState = previousLastState;
  }

  /**
   * Copies the current {@link YScanner } instance.
   *
   * Note that this performs a deep copy, and does not pass references to
   * any object values.
   *
   * @returns A copy of the {@link YScanner } instance.
   */
  public duplicate(): YScanner {
    const dup = new YScanner(this.text);

    (<mut>dup).pos = this.pos;
    (<mut>dup).lastPos = this.lastPos;
    (<mut>dup).lastMatch = deepCopy(this.lastMatch);
    (<mut>dup).lastState = deepCopy(this.lastState);
    (<mut>dup).insensitive = this.insensitive;

    return dup;
  }

  /**
   * Scans the text to see if the given string matches it.
   *
   * Does not update the scanner on match.
   *
   * @param s A string to try to match with.
   * @returns The text matched from the string, or `null` if no match.
   */
  public checkString(s: string): string | null {
    if (s == '') {
      return null;
    }

    const cased = (t: string) => (this.insensitive ? t.toLowerCase() : t);
    const text = this.unscannedText;
    const match = cased(text).startsWith(cased(s));

    return match ? text.slice(0, s.length) : null;
  }

  /**
   * Scans the text to see if the given string matches it, and
   * updates the scanner with any matched text.
   *
   * @param s A string to try to match with.
   * @returns The text matched from the string, or `null` if no match.
   */
  public scanString(s: string): string | null {
    const match = this.checkString(s);

    if (match !== null) {
      this.updateMatch(match);
    }

    return match;
  }

  /**
   * Scans the text to see if the given regular expression matches it.
   *
   * Does not update the scanner on match.
   *
   * @param r A regular expression to try to match with.
   * @returns The text matched from the regex, or `null` if no match.
   */
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

  /**
   * Scans the text to see if the given regular expression matches it, and
   * updates the scanner with any matched text.
   *
   * @param r A regular expression to try to match with.
   * @returns The text matched from the regex, or `null` if no match.
   */
  public scanRegex(r: RegExp): string | null {
    const match = this.checkRegex(r);

    if (match !== null) {
      this.updateMatch(match);
    }

    return match;
  }

  /**
   * Scans the text and finds the first matching pattern.
   *
   * Does not update the scanner.
   *
   * @param patterns A list of patterns (string or RegExp) to try to scan.
   * @returns The text from the first matching pattern, or `null` if no match.
   */
  public check(...patterns: (string | RegExp)[]): string | null {
    let match: string | null = null;

    for (const pattern of patterns) {
      match =
        typeof pattern === 'string'
          ? this.checkString(pattern)
          : this.checkRegex(pattern);

      if (match !== null) {
        break;
      }
    }

    return match;
  }

  /**
   * Scans the text and finds the first matching pattern, and updates the
   * scanner with the matched text.
   *
   * @param patterns A list of patterns (string or RegExp) to try to scan.
   * @returns The text from the first matching pattern, or `null` if no match.
   */
  public scan(...patterns: (string | RegExp)[]): string | null {
    const match: string | null = this.check(...patterns);

    if (match) {
      this.updateMatch(match);
    }

    return match;
  }

  /**
   * Scans the text and finds the first matching pattern and moves the
   * scan pointer and returns the length of the match, but does not change
   * what the last match was or anything aside from skipping over the matched
   * text.
   *
   *
   * @param patterns A list of patterns (string or RegExp) to try to scan.
   * @returns The length of text skipped from any match; `0` if no match.
   */
  public skip(...patterns: (string | RegExp)[]): number {
    const match: string | null = this.check(...patterns);

    if (match) {
      this.movePosition(match.length);
    }

    return (match ?? '').length;
  }

  public get eos() {
    return this.pos >= this.text.length;
  }

  /**
   * Set the scan pointer to the end of the scanner text.
   *
   * @param options An object with the following optional properties:
   *
   *                `clear`: Whether to clear the data for the last match or
   *                         not.
   *
   *                      Default: false
   */
  public terminate({ clear = false }: { clear?: boolean } = { clear: false }) {
    this.setPosition(this.text.length);

    if (clear) {
      (<mut>this).lastMatch = null;
    }
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
   *   start: '"', end: '"', escape: '\\', keepDelimiters: false, inner: [],
   *   autoNest: undefined, noEndFail: false
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
      autoNest = undefined,
      noEndFail = true,
    }: DelimitedTextInfo = {
      start: '"',
      end: '"',
      escape: '\\',
      keepDelimiters: false,
      inner: [],
      autoNest: undefined,
      noEndFail: true,
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

    if (autoNest !== undefined) {
      autoNest.start = autoNest.start ?? start;
      autoNest.end = autoNest.end ?? end;
      autoNest.escape = autoNest.escape ?? end;
      autoNest.inner = autoNest.inner ?? inner;
      autoNest.keepDelimiters = autoNest.keepDelimiters ?? keepDelimiters;
      autoNest.noEndFail = autoNest.noEndFail ?? noEndFail;
      autoNest.autoNest = autoNest.autoNest ?? autoNest;

      inner.push(autoNest as InnerDelimitedTextInfo);
    }

    const innerStarts = inner.map((i) => i.start);
    const hasInners = inner.length > 0;
    let innerStart: string | null = null;
    let innerType: InnerDelimitedTextInfo | undefined;

    while (!dup.eos) {
      // An escape means we cannot terminate, so just scan and go.
      if (escaped) {
        match += dup.grab();
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
        if (escape != null && dup.scan(escape) !== null) {
          escaped = true;
          continue;
        }

        // If there is the start of any inner delimited text, go and scan
        // this inner text according to the provided rules for it.
        if (hasInners && dup.scan(...innerStarts) !== null) {
          // Get starting inner delimited and back up to before it was matched,
          // as when we scan the inner delimited text it will expect that
          // start delimiter to still be available.
          innerStart = dup.lastMatch;
          dup.unscan();

          innerType = inner.find(
            (i) => i.start === innerStart,
          ) as InnerDelimitedTextInfo;

          // Set optional inner delimited text info to defaults.
          innerType.escape = innerType?.escape ?? escape;
          innerType.inner = innerType.inner ?? [];
          innerType.keepDelimiters = innerType.keepDelimiters ?? true;
          innerType.autoNest = innerType.autoNest ?? undefined;
          innerType.noEndFail = innerType.noEndFail ?? noEndFail;

          // Recursively scan inner delimited text and add it to scan
          // at current level.
          let outcome = dup.scanDelimited(innerType as DelimitedTextInfo);

          const innerSwallowEnd = YScanner.backscan(outcome ?? '', end);

          // If the end delimiter for the inner text is not the same as the
          // outer text, and the inner scan ends with the outer end delimiter,
          // then it seems the inner scam has swallowed the outer delimiter.
          //
          // In that case, remove the delimiter from the inner outcome if
          // the outer text does not want the delimiter kept.
          //
          // Note that this is only if innerEnd !== outerEnd as otherwise
          // it is assumed that the end delimiter is part of the inner text.
          if (
            innerType.end !== end &&
            innerSwallowEnd.result !== null &&
            !keepDelimiters
          ) {
            outcome = innerSwallowEnd.newText;
          }

          if (outcome !== null) {
            match += outcome;
          }
          // If null result, then it is an inner scan failure.
          // noEndFail = true for inner would mean null is not returned.
          else {
            return null;
          }
        }
        else {
          // If no other case was hit, then we just have a normal character
          // to scan and continue from.
          match += dup.grab();
        }
      }
    }

    const fullMatch = startDelimiter + match + (endDelimiter ?? '');

    // If no end delimiter, then our delimited text never ended, which is
    // a failure as it literally was not limited.
    if (noEndFail && endDelimiter === null) {
      return null;
    }

    // If match, copy duplicate pointer to this.
    this.loadPointer({
      pos: dup.pos,
      lastPos: this.pos,
      lastMatch: fullMatch,
    });

    // Return whatever version of match is wanted.
    return keepDelimiters ? fullMatch : match;
  }

  /**
   * Scans text until any of the given patterns are found.
   *
   * @param patterns A list of strings or regexes that are options to terminate
   *                 the scanning if encountered.
   * @param options An options object with properties:
   *
   *                `failIfNone`: Whether or not to count the scan as a fail
   *                              if no patterns found to end the scan.
   *                              (Default `false`)
   *
   *                `includePattern`: Whether or not to count the pattern to
   *                                  scan until as part of the scan match.
   *                                  (Default `false`)
   *
   * @returns The string of text matched, or `null` if a failed scan.
   */
  public scanUntil(
    patterns: (string | RegExp)[],
    {
      failIfNone = false,
      includePattern = false,
    }: { failIfNone?: boolean; includePattern?: boolean } = {
      failIfNone: false,
      includePattern: false,
    },
  ) {
    let match = '';
    const dup = this.duplicate();
    let foundOption = false;

    // Loop through text until any given patter matches.
    while (!dup.eos && !foundOption) {
      if (!dup.scan(...(patterns as (string | RegExp)[]))) {
        // If no match, just append next character.
        match += dup.grab();
      }
      else {
        foundOption = true;
      }
    }

    // Short circuit fail if supposed to fail if no "until pattern" found.
    if (failIfNone && !foundOption) {
      return null;
    }

    // Create final matched text based on if the "until pattern" should be
    // counted as part of the match.
    const matchedOption = dup.lastMatch;
    const finalMatch = includePattern ? match + matchedOption : match;

    // If the "until pattern" should not be counted, back up duplicate scanner
    // to before it was matched.
    if (!includePattern) {
      dup.unscan();
    }

    // Update this scanner to matched text and return it.
    this.updateMatch(finalMatch);

    return finalMatch;
  }

  /**
   * Scans the text to see if there is a valid integer next. Allows you to
   * customize the format of the integer extensively, being able to define
   * your own groups of text for any part of text resembling any sort of
   * integer value.
   *
   * Does not update the scanner on match.
   *
   * @param options An options object with the properties:
   *
   *                `sign`: Pattern to use for a sign at the start
   *                        of the integer.
   *
   *                        Default: '+' or '-'
   *
   *                `prefix`: Pattern to use for a prefix
   *                          before the numeric part of the integer
   *                          *(e.g. `0x` for hex)*.
   *
   *                        Default: null
   *
   *                `leading`: Pattern to use for a leading portion of the
   *                           integer *(e.g. leading zeroes)*
   *
   *                        Default: leading 0s
   *
   *                `digits`: Pattern to use for the possible digits in the
   *                          integer; can be used to define alternate bases.
   *
   *                        Default: Standard decimal 0-9
   *
   *                `separator`: Pattern for any text to be used as an optional
   *                             separator between digits.
   *
   *                        Default: ','
   *
   *                `postfix`: Same idea as `prefix`, but at the end of the
   *                           number *(e.g. the `f` in `23f`)*.
   *
   *                        Default: null
   *
   *                `removeSeparators`: Whether to include the separators
   *                                    in the final integer or not.
   *
   *                        Default: true
   *
   *                `split`: Whether to just return the matched integer text,
   *                         or return a {@link IntegerScanSplitResult} object
   *                         with all the portions of the matched integer
   *                         separated for you.
   *
   *                        Default: false
   *
   * @returns The scanned integer text (or object if `split` is on), or `null`
   *          if no match.
   *
   * @see {@link scanInteger}
   */
  public checkInteger(
    {
      sign = /^[+-]?/,
      prefix = null,
      leading = '0',
      digits = /^\d/,
      separator = ',',
      postfix = null,
      removeSeparators = true,
      split = false,
    }: {
      sign?: string | RegExp | null;
      prefix?: string | RegExp | null;
      leading?: string | RegExp | null;
      digits?: string | RegExp;
      separator?: string | RegExp | null;
      postfix?: string | RegExp | null;
      removeSeparators?: boolean;
      split?: boolean;
    } = {
      sign: /^[+-]?/,
      prefix: null,
      leading: '0',
      digits: /^\d/,
      separator: ',',
      postfix: null,
      removeSeparators: true,
      split: false,
    },
  ): string | IntegerScanSplitResult | null {
    const dup = this.duplicate();
    let signPart: string | null = null;
    let prefixPart: string | null = null;
    let leadingPart: string | null = null;

    if (sign != null) {
      signPart = dup.scan(sign);
    }

    if (prefix != null) {
      prefixPart = dup.scan(prefix);
    }

    if (leading != null) {
      if (typeof leading === 'string') {
        leadingPart = '';

        while (dup.scan(leading)) {
          leadingPart += dup.lastMatch;
        }
      }
      // RegExp expected.
      else {
        leadingPart = dup.scan(leading);
      }
    }

    const scanDigit =
      typeof digits === 'string'
        ? () => dup.scan(...digits)
        : () => dup.scan(digits);

    const scanSeparator = () => (separator ? dup.scan(separator) : null);
    let matchNumber = '';
    let foundDigit: string | null = null;
    let foundSeparator: string | null = null;
    let atLeastOneDigit: boolean = false;

    while (!dup.eos) {
      foundDigit = scanDigit();
      // If found digit, don't scan for sep since that'll double-scan.
      foundSeparator = foundDigit !== null ? null : scanSeparator();

      if (foundDigit !== null) {
        matchNumber += foundDigit;
        atLeastOneDigit = true;
      }
      else if (foundSeparator !== null && !removeSeparators) {
        matchNumber += foundSeparator;
      }

      if (foundDigit === null && foundSeparator === null) {
        break;
      }
    }

    // Grab digit from leading text if possible, to avoid bad scan when
    // peventable.
    // This allows "0" to do
    // { leading: "0", number: null } -> { leading: null, number: "0" }
    // which makes more sense.
    if (!atLeastOneDigit && leadingPart) {
      if (typeof digits === 'string') {
        const leadingDigit = [...digits]
          .map((digit) => YScanner.backscan(leadingPart as string, digit))
          .find((match) => match.result !== null);

        if (leadingDigit !== undefined) {
          matchNumber = leadingDigit.result + matchNumber;
          leadingPart = leadingDigit.newText;
          atLeastOneDigit = true;
        }
      }
      else {
        const leadingDigit = YScanner.backscan(leadingPart, digits);

        if (leadingDigit.result !== null) {
          matchNumber = leadingDigit.result + matchNumber;
          leadingPart = leadingDigit.newText;
          atLeastOneDigit = true;
        }
      }
    }

    if (!atLeastOneDigit) {
      return null;
    }

    let postfixPart: string | null = null;

    if (postfix != null) {
      postfixPart = dup.scan(postfix);
    }

    // Return object with all scanned portions separated if wanted.
    if (split) {
      return {
        sign: signPart === '' ? null : signPart,
        prefix: prefixPart === '' ? null : prefixPart,
        leading: leadingPart === '' ? null : leadingPart,
        number: matchNumber,
        postfix: postfixPart === '' ? null : postfixPart,
      };
    }
    else {
      return (
        (signPart ?? '') +
        (prefixPart ?? '') +
        (leadingPart ?? '') +
        matchNumber +
        (postfixPart ?? '')
      );
    }
  }

  /**
   * Scans the text to see if there is a valid integer next. Allows you to
   * customize the format of the integer extensively, being able to define
   * your own groups of text for any part of text resembling any sort of
   * integer value.
   *
   * Will update the scanner on a good match.
   *
   * @param options An options object with the properties:
   *
   *                `sign`: Pattern to use for a sign at the start
   *                        of the integer.
   *
   *                        Default: '+' or '-'
   *
   *                `prefix`: Pattern to use for a prefix
   *                          before the numeric part of the integer
   *                          *(e.g. `0x` for hex)*.
   *
   *                        Default: null
   *
   *                `leading`: Pattern to use for a leading portion of the
   *                           integer *(e.g. leading zeroes)*
   *
   *                        Default: leading 0s
   *
   *                `digits`: Pattern to use for the possible digits in the
   *                          integer; can be used to define alternate bases.
   *
   *                        Default: Standard decimal 0-9
   *
   *                `separator`: Pattern for any text to be used as an optional
   *                             separator between digits.
   *
   *                        Default: ','
   *
   *                `postfix`: Same idea as `prefix`, but at the end of the
   *                           number *(e.g. the `f` in `23f`)*.
   *
   *                        Default: null
   *
   *                `removeSeparators`: Whether to include the separators
   *                                    in the final integer or not.
   *
   *                        Default: true
   *
   *                `split`: Whether to just return the matched integer text,
   *                         or return a {@link IntegerScanSplitResult} object
   *                         with all the portions of the matched integer
   *                         separated for you.
   *
   *                        Default: false
   *
   * @returns The scanned integer text (or object if `split` is on), or `null`
   *          if no match.
   * @see {@link checkInteger}
   */
  public scanInteger(
    {
      sign = /^[+-]?/,
      prefix = null,
      leading = '0',
      digits = /^\d/,
      separator = ',',
      postfix = null,
      removeSeparators = true,
      split = false,
    }: {
      sign?: string | RegExp | null;
      prefix?: string | RegExp | null;
      leading?: string | RegExp | null;
      digits?: string | RegExp;
      separator?: string | RegExp | null;
      postfix?: string | RegExp | null;
      removeSeparators?: boolean;
      split?: boolean;
    } = {
      sign: /^[+-]?/,
      prefix: null,
      leading: '0',
      digits: /^\d/,
      separator: ',',
      postfix: null,
      removeSeparators: true,
      split: false,
    },
  ): string | IntegerScanSplitResult | null {
    const dup = this.duplicate();
    let signPart: string | null = null;
    let prefixPart: string | null = null;
    let leadingPart: string | null = null;

    if (sign != null) {
      signPart = dup.scan(sign);
    }

    if (prefix != null) {
      prefixPart = dup.scan(prefix);
    }

    if (leading != null) {
      // If string, loop scan leading text string, to allow for simple
      // definition of leading text like "0" for leading zeroes.
      if (typeof leading === 'string') {
        leadingPart = '';

        while (dup.scan(leading)) {
          leadingPart += dup.lastMatch;
        }
      }
      // RegExp expected, just do normal loop since regex can define if it
      // wants looped matches or not.
      else {
        leadingPart = dup.scan(leading);
      }
    }

    const scanDigit =
      typeof digits === 'string'
        ? () => dup.scan(...digits)
        : () => dup.scan(digits);

    const scanSeparator = () => (separator ? dup.scan(separator) : null);
    let matchNumber = '';
    let fullMatchNumber = '';
    let foundDigit: string | null = null;
    let foundSeparator: string | null = null;
    let atLeastOneDigit: boolean = false;

    while (!dup.eos) {
      foundDigit = scanDigit();
      // If found digit, don't scan for sep since that'll mess up loop.
      foundSeparator = foundDigit !== null ? null : scanSeparator();

      if (foundDigit !== null) {
        matchNumber += foundDigit;
        fullMatchNumber += foundDigit;
        atLeastOneDigit = true;
      }
      else if (foundSeparator !== null) {
        if (!removeSeparators) {
          matchNumber += foundSeparator;
        }

        fullMatchNumber += foundSeparator;
      }

      if (foundDigit === null && foundSeparator === null) {
        break;
      }
    }

    // Grab digit from leading text if possible, to avoid bad scan when
    // peventable.
    // This allows "0" to do
    // { leading: "0", number: null } -> { leading: null, number: "0" }
    // which makes more sense.
    if (!atLeastOneDigit && leadingPart) {
      if (typeof digits === 'string') {
        const leadingDigit = [...digits]
          .map((digit) => YScanner.backscan(leadingPart as string, digit))
          .find((match) => match.result !== null);

        if (leadingDigit !== undefined) {
          matchNumber = leadingDigit.result + matchNumber;
          fullMatchNumber = leadingDigit.result + fullMatchNumber;
          leadingPart = leadingDigit.newText;
          atLeastOneDigit = true;
        }
      }
      else {
        const leadingDigit = YScanner.backscan(leadingPart, digits);

        if (leadingDigit.result !== null) {
          matchNumber = leadingDigit.result + matchNumber;
          fullMatchNumber = leadingDigit.result + fullMatchNumber;
          leadingPart = leadingDigit.newText;
          atLeastOneDigit = true;
        }
      }
    }

    if (!atLeastOneDigit) {
      return null;
    }

    let postfixPart: string | null = null;

    if (postfix != null) {
      postfixPart = dup.scan(postfix);
    }

    const finalMatchText = (num: string) =>
      (signPart ?? '') +
      (prefixPart ?? '') +
      (leadingPart ?? '') +
      num +
      (postfixPart ?? '');

    this.updateMatch(finalMatchText(fullMatchNumber));

    // Return object with all scanned portions separated if wanted.
    if (split) {
      return {
        sign: signPart === '' ? null : signPart,
        prefix: prefixPart === '' ? null : prefixPart,
        leading: leadingPart === '' ? null : leadingPart,
        number: matchNumber,
        postfix: postfixPart === '' ? null : postfixPart,
      };
    }
    else {
      return finalMatchText(matchNumber);
    }
  }

  /**
   * Scans the text to see if there is a valid decimal number next. Allows you
   * to customize the format of a decimal number extensively, being able to
   * define your own groups of text for any part of text resembling any sort of
   * decimal value.
   *
   * Will not update the scanner on match.
   *
   * @param options An options object with the properties:
   *
   *                `sign`: Pattern to use for a sign at the start
   *                        of the number.
   *
   *                        Default: '+' or '-'
   *
   *                `prefix`: Pattern to use for a prefix
   *                          before the numeric part of the number
   *                          *(e.g. `0x` for hex)*.
   *
   *                        Default: null
   *
   *                `leading`: Pattern to use for a leading portion of the
   *                           number *(e.g. leading zeroes)*
   *
   *                        Default: leading 0s
   *
   *                `digits`: Pattern to use for the possible digits in the
   *                          number; can be used to define alternate bases.
   *
   *                        Default: Standard decimal 0-9
   *
   *                `separator`: Pattern for any text to be used as an optional
   *                             separator between digits.
   *
   *                        Default: ','
   *
   *                `radix`: Pattern to use for the radix point (the part in
   *                         the middle).
   *
   *                        Default: '.'
   *
   *                `trailing`: Pattern to use for a trailing portion of the
   *                            number *(e.g. trailing zeroes)*
   *
   *                        Default: trailing 0s
   *
   *                `postfix`: Same idea as `prefix`, but at the end of the
   *                           number *(e.g. the `f` in `23f`)*.
   *
   *                        Default: null
   *
   *                `removeSeparators`: Whether to include the separators
   *                                    in the final number or not.
   *
   *                        Default: true
   *
   *                `split`: Whether to just return the matched number text,
   *                         or return a {@link DecimalScanSplitResult} object
   *                         with all the portions of the matched number
   *                         separated for you.
   *
   *                        Default: false
   *
   * @returns The scanned integer text (or object if `split` is on), or `null`
   *          if no match.
   * @see {@link checkInteger}
   */
  public checkDecimal(
    {
      sign = /^[+-]?/,
      prefix = null,
      leading = '0',
      digits = /^\d/,
      separator = ',',
      radix = '.',
      trailing = '0',
      postfix = null,
      removeSeparators = true,
      split = false,
    }: {
      sign?: string | RegExp | null;
      prefix?: string | RegExp | null;
      leading?: string | RegExp | null;
      digits?: string | RegExp;
      separator?: string | RegExp | null;
      radix?: string | RegExp;
      trailing?: string | RegExp | null;
      postfix?: string | RegExp | null;
      removeSeparators?: boolean;
      split?: boolean;
    } = {
      sign: /^[+-]?/,
      prefix: null,
      leading: '0',
      digits: /^\d/,
      separator: ',',
      radix: '.',
      trailing: '0',
      postfix: null,
      removeSeparators: true,
      split: false,
    },
  ): string | DecimalScanSplitResult | null {
    const dup = this.duplicate();
    let signPart: string | null = null;
    let prefixPart: string | null = null;
    let leadingPart: string | null = null;

    if (sign != null) {
      signPart = dup.scan(sign);
    }

    if (prefix != null) {
      prefixPart = dup.scan(prefix);
    }

    if (leading != null) {
      if (typeof leading === 'string') {
        leadingPart = '';

        while (dup.scan(leading)) {
          leadingPart += dup.lastMatch;
        }
      }
      // RegExp expected.
      else {
        leadingPart = dup.scan(leading);
      }
    }

    const scanDigit =
      typeof digits === 'string'
        ? () => dup.scan(...digits)
        : () => dup.scan(digits);

    const scanSeparator = () => (separator ? dup.scan(separator) : null);
    const scanRadix = () => dup.scan(radix);

    let matchWhole = '';
    let matchFractional = '';
    let radixPart: string | null = null;
    let foundDigit: string | null = null;
    let foundSeparator: string | null = null;
    let foundRadix: string | null = null;
    let atLeastOneDigit: boolean = false;
    let pastRadix: boolean = false;

    while (!dup.eos) {
      foundDigit = scanDigit();
      // If found digit, don't scan for sep since that'll double-scan.
      foundSeparator = foundDigit !== null ? null : scanSeparator();
      // Also do not scan if something else found to avoid double-scan.
      foundRadix =
        foundDigit !== null || foundSeparator !== null ? null : scanRadix();

      if (foundDigit !== null) {
        if (pastRadix) {
          matchFractional += foundDigit;
          atLeastOneDigit = true;
        }
        else {
          matchWhole += foundDigit;
          atLeastOneDigit = true;
        }
      }
      else if (foundSeparator !== null && !removeSeparators) {
        if (pastRadix) {
          matchFractional += foundSeparator;
        }
        else {
          matchFractional += foundDigit;
        }
      }
      else if (foundRadix) {
        radixPart = foundRadix;
        pastRadix = true;
      }

      if (
        foundDigit === null &&
        foundSeparator === null &&
        foundRadix === null
      ) {
        break;
      }
    }

    if (!atLeastOneDigit) {
      return null;
    }

    // If there is something in the leading text, but the whole number portion
    // is empty, see if there is a digit to take from the leading text.
    // Essentially the same idea as how the trailing text will take from the
    // fractional number portion after this, but in reverse.
    if (matchWhole === '' && leadingPart != null && leadingPart.length) {
      if (typeof digits === 'string') {
        const digitArray = [...digits];
        let backMatch = digitArray
          .map((digit) => YScanner.backscan(leadingPart as string, digit))
          .find((digitMatch) => digitMatch.result !== null);

        while (backMatch?.result !== null) {
          leadingPart = backMatch?.newText as string;

          matchWhole = backMatch?.result + matchWhole;

          backMatch = digitArray
            .map((digit) => YScanner.backscan(leadingPart as string, digit))
            .find((digitMatch) => digitMatch.result !== null);
        }
      }
      else {
        let backMatch = YScanner.backscan(leadingPart as string, digits);

        while (backMatch?.result !== null) {
          leadingPart = backMatch?.newText as string;

          matchWhole = backMatch?.result + matchWhole;

          backMatch = YScanner.backscan(leadingPart as string, digits);
        }
      }
    }

    let trailingPart: string | null = null;

    if (trailing != null) {
      trailingPart = '';

      // Loop and repeatedly grab matches for the trailing text pattern off
      // the end of the fractional portion of the number, since any trailing
      // text at the end of the number counts as trailing text itself.
      let backMatch = YScanner.backscan(matchFractional, trailing);

      while (backMatch.result !== null) {
        matchFractional = backMatch.newText;

        trailingPart = backMatch.result + trailingPart;

        backMatch = YScanner.backscan(matchFractional, trailing);
      }

      // After checking fractional part, scan rest of text for any trailing
      // text.
      if (typeof trailing === 'string') {
        while (dup.scan(trailing)) {
          trailingPart += dup.lastMatch;
        }
      }
      // RegExp expected.
      else {
        if (dup.scan(trailing) !== null) {
          trailingPart += dup.scan(trailing);
        }
      }
    }

    let postfixPart: string | null = null;

    if (postfix != null) {
      postfixPart = dup.scan(postfix);
    }

    if (split) {
      return {
        sign: signPart === '' ? null : signPart,
        prefix: prefixPart === '' ? null : prefixPart,
        leading: leadingPart === '' ? null : leadingPart,
        whole: matchWhole === '' ? null : matchWhole,
        radix: radixPart === '' ? null : radixPart,
        fractional: matchFractional === '' ? null : matchFractional,
        number: matchWhole + (radixPart ?? '') + matchFractional,
        trailing: trailingPart === '' ? null : trailingPart,
        postfix: postfixPart === '' ? null : postfixPart,
      };
    }
    else {
      return (
        (signPart ?? '') +
        (prefixPart ?? '') +
        (leadingPart ?? '') +
        matchWhole +
        (radixPart ?? '') +
        matchFractional +
        (trailingPart ?? '') +
        (postfixPart ?? '')
      );
    }
  }

  /**
   * Scans the text to see if there is a valid decimal number next. Allows you
   * to customize the format of a decimal number extensively, being able to
   * define your own groups of text for any part of text resembling any sort of
   * decimal value.
   *
   * Will update the scanner on match.
   *
   * @param options An options object with the properties:
   *
   *                `sign`: Pattern to use for a sign at the start
   *                        of the number.
   *
   *                        Default: '+' or '-'
   *
   *                `prefix`: Pattern to use for a prefix
   *                          before the numeric part of the number
   *                          *(e.g. `0x` for hex)*.
   *
   *                        Default: null
   *
   *                `leading`: Pattern to use for a leading portion of the
   *                           number *(e.g. leading zeroes)*
   *
   *                        Default: leading 0s
   *
   *                `digits`: Pattern to use for the possible digits in the
   *                          number; can be used to define alternate bases.
   *
   *                        Default: Standard decimal 0-9
   *
   *                `separator`: Pattern for any text to be used as an optional
   *                             separator between digits.
   *
   *                        Default: ','
   *
   *                `radix`: Pattern to use for the radix point (the part in
   *                         the middle).
   *
   *                        Default: '.'
   *
   *                `trailing`: Pattern to use for a trailing portion of the
   *                            number *(e.g. trailing zeroes)*
   *
   *                        Default: trailing 0s
   *
   *                `postfix`: Same idea as `prefix`, but at the end of the
   *                           number *(e.g. the `f` in `23f`)*.
   *
   *                        Default: null
   *
   *                `removeSeparators`: Whether to include the separators
   *                                    in the final number or not.
   *
   *                        Default: true
   *
   *                `split`: Whether to just return the matched number text,
   *                         or return a {@link DecimalScanSplitResult} object
   *                         with all the portions of the matched number
   *                         separated for you.
   *
   *                        Default: false
   *
   * @returns The scanned integer text (or object if `split` is on), or `null`
   *          if no match.
   * @see {@link checkInteger}
   */
  public scanDecimal(
    {
      sign = /^[+-]?/,
      prefix = null,
      leading = '0',
      digits = /^\d/,
      separator = ',',
      radix = '.',
      trailing = '0',
      postfix = null,
      removeSeparators = true,
      split = false,
    }: {
      sign?: string | RegExp | null;
      prefix?: string | RegExp | null;
      leading?: string | RegExp | null;
      digits?: string | RegExp;
      separator?: string | RegExp | null;
      radix?: string | RegExp;
      trailing?: string | RegExp | null;
      postfix?: string | RegExp | null;
      removeSeparators?: boolean;
      split?: boolean;
    } = {
      sign: /^[+-]?/,
      prefix: null,
      leading: '0',
      digits: /^\d/,
      separator: ',',
      radix: '.',
      trailing: '0',
      postfix: null,
      removeSeparators: true,
      split: false,
    },
  ): string | DecimalScanSplitResult | null {
    const dup = this.duplicate();
    let signPart: string | null = null;
    let prefixPart: string | null = null;
    let leadingPart: string | null = null;

    if (sign != null) {
      signPart = dup.scan(sign);
    }

    if (prefix != null) {
      prefixPart = dup.scan(prefix);
    }

    if (leading != null) {
      if (typeof leading === 'string') {
        leadingPart = '';

        while (dup.scan(leading)) {
          leadingPart += dup.lastMatch;
        }
      }
      // RegExp expected.
      else {
        leadingPart = dup.scan(leading);
      }
    }

    const scanDigit =
      typeof digits === 'string'
        ? () => dup.scan(...digits)
        : () => dup.scan(digits);

    const scanSeparator = () => (separator ? dup.scan(separator) : null);
    const scanRadix = () => dup.scan(radix);

    let matchWhole = '';
    let matchFractional = '';
    let fullMatchNumber = '';
    let radixPart: string | null = null;
    let foundDigit: string | null = null;
    let foundSeparator: string | null = null;
    let foundRadix: string | null = null;
    let atLeastOneDigit: boolean = false;
    let pastRadix: boolean = false;

    while (!dup.eos) {
      foundDigit = scanDigit();
      // If found digit, don't scan for sep since that'll double-scan.
      foundSeparator = foundDigit !== null ? null : scanSeparator();
      // Also do not scan if something else found to avoid double-scan.
      foundRadix =
        foundDigit !== null || foundSeparator !== null ? null : scanRadix();

      if (foundDigit !== null) {
        if (pastRadix) {
          matchFractional += foundDigit;
          atLeastOneDigit = true;
        }
        else {
          matchWhole += foundDigit;
          atLeastOneDigit = true;
        }

        fullMatchNumber += foundDigit;
      }
      else if (foundSeparator !== null && !removeSeparators) {
        if (pastRadix) {
          matchFractional += foundSeparator;
        }
        else {
          matchWhole += foundSeparator;
        }

        fullMatchNumber += foundSeparator;
      }
      else if (foundRadix) {
        radixPart = foundRadix;
        pastRadix = true;

        fullMatchNumber += foundRadix;
      }

      if (
        foundDigit === null &&
        foundSeparator === null &&
        foundRadix === null
      ) {
        break;
      }
    }

    if (!atLeastOneDigit) {
      return null;
    }

    // If there is something in the leading text, but the whole number portion
    // is empty, see if there is a digit to take from the leading text.
    // Essentially the same idea as how the trailing text will take from the
    // fractional number portion after this, but in reverse.
    if (matchWhole === '' && leadingPart != null && leadingPart.length) {
      if (typeof digits === 'string') {
        const digitArray = [...digits];
        let backMatch = digitArray
          .map((digit) => YScanner.backscan(leadingPart as string, digit))
          .find((digitMatch) => digitMatch.result !== null);

        while (
          backMatch?.result !== null &&
          (matchWhole === '' || leadingPart.length > 1)
        ) {
          leadingPart = backMatch?.newText as string;

          matchWhole = backMatch?.result + matchWhole;

          backMatch = digitArray
            .map((digit) => YScanner.backscan(leadingPart as string, digit))
            .find((digitMatch) => digitMatch.result !== null);
        }
      }
      else {
        let backMatch = YScanner.backscan(leadingPart as string, digits);

        while (
          backMatch?.result !== null &&
          (matchWhole === '' || leadingPart.length > 1)
        ) {
          leadingPart = backMatch?.newText as string;

          matchWhole = backMatch?.result + matchWhole;

          backMatch = YScanner.backscan(leadingPart as string, digits);
        }
      }
    }

    let trailingPart: string | null = null;

    if (trailing != null) {
      trailingPart = '';

      // Loop and repeatedly grab matches for the trailing text pattern off
      // the end of the fractional portion of the number, since any trailing
      // text at the end of the number counts as trailing text itself.
      let backMatch = YScanner.backscan(matchFractional, trailing);

      // Check fractional length to ensure it has at least one digit.
      // This is so something like ".0" has fractional "0" and not a leading
      // "0" for an "empty" number.
      while (backMatch.result !== null && matchFractional.length > 1) {
        // Cut off matched portion of string from number matches.
        matchFractional = backMatch.newText;
        fullMatchNumber = fullMatchNumber.slice(0, -backMatch.result.length);

        trailingPart = backMatch.result + trailingPart;

        backMatch = YScanner.backscan(matchFractional, trailing);
      }

      // After checking fractional part, scan rest of text for any trailing
      // text.
      if (typeof trailing === 'string') {
        while (dup.scan(trailing)) {
          trailingPart += dup.lastMatch;
        }
      }
      // RegExp expected.
      else {
        if (dup.scan(trailing) !== null) {
          trailingPart += dup.scan(trailing);
        }
      }
    }

    let postfixPart: string | null = null;

    if (postfix != null) {
      postfixPart = dup.scan(postfix);
    }

    const finalMatchText = (num: string) =>
      (signPart ?? '') +
      (prefixPart ?? '') +
      (leadingPart ?? '') +
      num +
      (trailingPart ?? '') +
      (postfixPart ?? '');

    this.updateMatch(finalMatchText(fullMatchNumber));

    if (split) {
      return {
        sign: signPart === '' ? null : signPart,
        prefix: prefixPart === '' ? null : prefixPart,
        leading: leadingPart === '' ? null : leadingPart,
        whole: matchWhole === '' ? null : matchWhole,
        radix: radixPart === '' ? null : radixPart,
        fractional: matchFractional === '' ? null : matchFractional,
        number: matchWhole + (radixPart ?? '') + matchFractional,
        trailing: trailingPart === '' ? null : trailingPart,
        postfix: postfixPart === '' ? null : postfixPart,
      };
    }
    else {
      return finalMatchText(matchWhole + (radixPart ?? '') + matchFractional);
    }
  }

  /**
   * Appends the given text to the end of the scanner text. Does not change
   * anything except for the text, effectively just making it longer.
   *
   * @param text The text to append to the end of the scanner text.
   */
  public append(text: string) {
    (<mut>this).text += text;
  }

  /**
   * Prepends the given text to the start of the scanner text.
   * Will adjust the scanner position to adjust for this new text at the start,
   * unless `reset` is toggled on, in which case the scanner will reset
   * itself.
   *
   *
   * @param text The text to append to the end of the scanner text.
   * @param options An object with the properties:
   *
   *                `reset`: Whether to reset the scanner after inserting the
   *                         new text or not.
   *
   *                      Default: false
   */
  public prepend(
    text: string,
    { reset = false }: { reset?: boolean } = { reset: false },
  ) {
    (<mut>this).text = text + this.text;

    if (reset) {
      this.reset();
    }
    else {
      // Adjust position to account for new space at start.
      this.movePosition(text.length);
    }
  }

  /**
   * Scans the given input text from the end to see if the given option
   * matches (e.g. "I like eggs" would backwards match "eggs").
   *
   * @param text The text to scan from the end of.
   * @param pattern The pattern to try scanning the text with.
   * @returns An object with the following properties:
   *
   *          `result`: The scanned text (or `null`).
   *
   *          `newText`: The input text with the result removed from the end.
   */
  public static backscan(text: string, pattern: string | RegExp) {
    let [result, newText] = ['', text];
    let offset = 1;
    let currentSlice = '';

    // Normal algorithm cuts off for 1 character strings.
    // Just hardcoding for this case because I'm too lazy to change the
    // algorithm to work perfectly since this works too.
    if (text.length === 1) {
      if (typeof pattern === 'string') {
        const matched = text === pattern;
        return { result: matched ? text : null, newText: matched ? '' : text };
      }
      else {
        const matched = text.match(pattern);
        if (matched) {
          return { result: matched[0], newText: '' };
        }
        else {
          return { result: null, newText: text };
        }
      }
    }

    if (typeof pattern === 'string') {
      while (newText && offset < newText.length) {
        currentSlice = newText.slice(newText.length - offset);

        if (currentSlice === pattern) {
          result = currentSlice + result;
          newText = newText.slice(0, -offset);
          break;
        }
        else {
          offset += 1;
        }
      }
    }
    // RegExp expected.
    else {
      // Ensure regex pattern will only match at start of text.
      if (!('^' in [...pattern.source])) {
        pattern = new RegExp('^' + pattern.source, pattern.flags);
      }

      while (newText !== '' && offset < newText.length) {
        currentSlice = newText.slice(newText.length - offset);

        if (currentSlice.match(pattern)) {
          result = currentSlice + result;
          newText = newText.slice(0, -offset);
          break;
        }
        else {
          offset += 1;
        }
      }
    }

    return { result: result === '' ? null : result, newText };
  }
}

// TODO: Clean up documentation and code.
