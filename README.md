# Y-Scanner
[](#title)

![NPM Version](https://img.shields.io/github/package-json/v/chupacabral/y-scanner?color=BC0000&logo=npm&style=for-the-badge)
&nbsp;
![License](https://img.shields.io/npm/l/y-scanner?color=%23007EC6&style=for-the-badge&logo=internetarchive)

![Testing](https://img.shields.io/badge/TESTS-0%20%2F%200-18ab64?style=for-the-badge&logo=testcafe&logoColor=white)
&nbsp;
![Code Coverage](https://img.shields.io/badge/COVERAGE-0%25-blueviolet?style=for-the-badge&logo=codeforces&logoColor=white)
&nbsp;
![Features Implemented](https://img.shields.io/badge/FEATURES-3%20/%204-c27904?style=for-the-badge&logo=windowsterminal&logoColor=white)

Simple, but powerful lexical scanner. Inspired by, but distinct from, Ruby's
StringScanner.

This library is a simplified version of my other scanner library,
[X-Scanner](https://github.com/Chupacabral/X-Scanner).

It is similar in overall use as X-Scanner, but with most of the complex
features stripped out.
This leaves a scanner that is still very powerful, just more optimized for
instances where you need a good scanner, but not one that is insanely
extensible.

## Features
[](#features)

Y-Scanner supports the same general functionality that you may be used to from
other string scanning libraries.

However, some interesting features that Y-Scanner provides are:
- <ins>**Pointers**</ins>
  - Save your scanner state, and jump back to it if needed.
  - Y-Scanner keeps track of the last state the scanner was in, and has
    a method `undoLastMovement()` to revert back to the previous state, so
    you do not have to create a pointer for simple cases.
- <ins>**Scanning for an arbitrary amount of options**</ins>
  - The methods `check()` and `scan()` allow for infinite options of
    either `string` or `RegExp`, so that you don't have to repeatedly
    scan and check if an option was matched yourself.
- <ins>**Powerful convenience methods**</ins>
  - Y-Scanner comes built-in with functionality that is incredibly useful when
    scanning more complicated text, such as:
    
    - `scanDelimited()` which will scan for
    text between two delimiters and supports recursively scanning instances of
    delimited text within the overall delimited text.
      - If that description sounds confusing, an example of what it can scan
        would be:
        ```c
        [ This is stuff in a bracket and "a string with the \"[]\" inside it" ]
        ```
        which is text between `[]` with a string between two `"` and the `[]`
        inside it and also escaped quotes inside the string.
    - `scanUntil()` which will scan text until it reaches some option.
    - Other utility methods such as `scanInteger()`, `scanDecimal()`, and
      `scanHex()`.
- <ins>**Built-In Case Insensitivity**</ins>
  - Y-Scanner allows ensuring that any scans it tries are done in a
    case-insensitive manner by simply setting the `insensitive` option
    to `true` (and `false` to turn it off).
    
    You can do this at any time, so you have full control of how the scanner
    acts.

## How To Install
[](#how-to-install)

First, make sure you have Node.js and NPM ready to go on your machine.

Then, in the folder with your code, enter on a command line:
```css
npm install y-scanner
```

To install it for use globally on your computer:
```css
npm install -g y-scanner
```

Then, import it into your code like any other NPM library:
```js
const { YScanner } = require('y-scanner')
```

If you are using ES Module syntax in your code, then it's:
```js
import { YScanner } from 'y-scanner'
```

## Properties
[](#properties)

### `text` — `string`
The text to be scanned.

### `pos` — `number`
The position of the scanner along the scanned text.

### `lastPos` — `number`
The previous position of the scanner.

### `lastMatch` — `string` or `null`
The previous match found from a scanner method that updates the scanner on a
match.

### `insensitive` — `boolean`
Whether or not the scanner scans in a case-insensitive manner or not.

Defaults to `false`.

### `unscannedText` - `string`
The portion of the text that has yet to be scanned.

### `scannedText` - `string`
The portion of the text that has already been scanned.

### `pointer` - `{ pos, lastPos, lastMatch }`
[](#pointer)

A pointer to the current state of the scanner.

### `lastState` - `{ pos, lastPos, lastMatch }`
A pointer to the previous state of the scanner.

### `eos` — `boolean`
A boolean representing if the scanner as at the end of the string being scanned.

An object representing the current state of the scanner.

## Methods
For all the code examples for these methods, assume the following code comes
before (unless done differently):
```js
const scanner = new YScanner("Hello, World!")
```

&nbsp;

[](#methods)

### `checkString(option)`
[](#checkstring)

Checks to see if the string `option` is next in the scanned text.

Returns the matched string, or `null` if not found.

Does not update the scanner on a match.

```js
const greeting = scanner.checkString('Hello')

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // null
```

### `scanString(option)`
[](#scanstring)

Checks to see if the string `option` is next in the scanned text.

Returns the matched string, or `null` if not found.

Updates the scanner on a match.

```js
const greeting = scanner.scanString('Hello')

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // "Hello"
```

### `checkRegex(option)`
[](#checkregex)

Checks to see if the regex `option` is next in the scanned text.

Returns the matched string, or `null` if not found.

Does not update the scanner on a match.

```js
const greeting = scanner.checkRegex(/Hello|Salutations/)

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // null
```

### `scanRegex(option)`
[](#scanregex)

Checks to see if the regex `option` is next in the scanned text.

Returns the matched string, or `null` if not found.

Updates the scanner on a match.

```js
const greeting = scanner.scanRegex(/Hello|Salutations/)

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // "Hello"
```

### `check(...options)`
[](#check)

Checks to see if any of the options given are next in the scanned text.
Each option can be a string or regex.

Returns the matched string, or `null` if not found.

Does not update the scanner on a match.

```js
const greeting = scanner.check('Hello', /Salutations/)

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // null
```

### `scan(...options)`
[](#scan)

Checks to see if any of the options given are next in the scanned text.
Each option can be a string or regex.

Returns the matched string, or `null` if not found.

Updates the scanner on a match.

```js
const greeting = scanner.scan('Hello', /Salutations/)

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // "Hello"
```

### `scanDelimited(options)`

Scans any text coming up in the scanned text that is between two delimiters.

The `options` argument is an object with the following attributes:

|      name      |                      description                | default |
|:---------------|:------------------------------------------------|:-------:|
| start          | The starting delimiter for the text             | `"`     |
| end            | The ending delimiter for the text               | `"`     |
| escape         | The escape character for the text               | `\`     |
| keepDelimiters | Whether to keep the delimiters around the match |
| inner          | A list of info for any inner delimited text     | `[]`    |

As you may notice, every option has a default, meaning you can just use
`scanDelimited()` without any arguments to scan a normal double-quoted string,
if that's what you want.

```js
const scanner = new YScanner("`Look it's a backtick string`")

const backtickString = scanner.scanDelimited({ start: '`', end: '`' })

console.log(backtickString)  // "Look it's a backtick string"
```

If you have any delimited text *inside* your delimited text, you can use the
`inner` option to specify this. Any inner delimited text is specified with an
object with the following attributes:

|      name      |                      description                |       default          |
|:---------------|:------------------------------------------------|:----------------------:|
| start          | The starting delimiter for the text             | NONE                   |
| end            | The ending delimiter for the text               | NONE                   |
| escape         | The escape character for the text               | whatever `options` has |
| keepDelimiters | Whether to keep the delimiters around the match | whatever `options` has |
| inner          | A list of info for any inner delimited text     | whatever `options` has |

It's effectively the same as what you set for `options`, but `start` and `end`
are *required*.

As an example, we'll cover how to scan that multi-level delimited text used
earlier in [the features section](#features).

```js
const scanner = new YScanner(
  '[This is stuff in a bracket and "a string with the \\"[]\\" inside it"]'
)

const result = scanner.scanDelimited({
  start: '[',
  end: ']',
  inner: [{
    start: '"',
    end: '"'
  }]
})

console.log(result)
// 'This is stuff in a bracket and "a string with the "[]" inside it"'
```

Inner delimited items can have inner delimited items inside them, so you can
scan some crazy things with this method, if you needed to.

### `loadPointer(pointer)`

Loads up a pointer for some state for the scanner. This can either be
a pointer saved from calling [pointer](#pointer), or an object that has the
structure `{ pos, lastPos, lastMatch }`.

```js
const start = scanner.pointer

scanner.scan('Hello')
scanner.loadPointer(start)

console.log(scanner.lastMatch)  // null
```

### `movePosition(n)`

Moves the scanner position `n` characters away from the current position. <br>
Negative numbers will move the scanner backwards.

If the resulting position is past the end of the text being scanned, it will
be set to the end of the text.

If the resulting position is before the start of the text being scanned, it will
be set to `0`.

```js
scanner.movePosition(1)

console.log(scanner.pos)  // 1

scanner.movePosition(-100)

console.log(scanner.pos)  // 0
```

### `setPosition(n)`

Sets the scanner position to `n`.

Like `movePosition()`, if the resulting position is outside of the bounds of
the text being scanned, it will be set to the start/end of the text.

```js
scanner.setPosition(5)

console.log(scanner.pos)  // 5

scanner.setPosition(-100)

console.log(scanner.pos)  // 0
```

### `reset()`

Resets the scanner back to it's initial state, as if it was brand new.

```js
scanner.scan('Hello')

scanner.reset()

console.log(scanner.lastMatch)  // null
```

### `updateMatch(match)`

Takes a match string and updates the scanner as if it had just scanned that
string.

*This method should generally not be used, as the scanning methods already
use it, but the option is provided for any weird edge cases where you need it.*

```js
scanner.updateMatch('Hello')

console.log(scanner.lastMatch)  // "Hello"
```

### `undoLastMovement()`

Reverts the scanner state to that of `lastState`, which is the previous scanner
position.

```js
scanner.scan('Hello')

scanner.undoLastMovement()

console.log(scanner.pos)  // 0
```

### `duplicate()`

Creates a copy of the Y-Scanner instance. <br>
This will actually deep-copy the
scanner, and not simply make a reference copy of it.

```js
scanner.scan('Hello')

const newScanner = scanner.duplicate()

console.log(newScanner.lastMatch)  // "Hello"
```