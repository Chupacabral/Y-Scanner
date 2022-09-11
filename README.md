# Y-Scanner
[](#title)

![NPM Version](https://img.shields.io/github/package-json/v/chupacabral/y-scanner?color=BC0000&logo=npm&style=for-the-badge)
&nbsp;
![License](https://img.shields.io/npm/l/y-scanner?color=%23007EC6&style=for-the-badge&logo=internetarchive)

![Testing](https://img.shields.io/badge/TESTS-0%20%2F%200-18ab64?style=for-the-badge&logo=testcafe&logoColor=white)
&nbsp;
![Code Coverage](https://img.shields.io/badge/COVERAGE-0%25-blueviolet?style=for-the-badge&logo=codeforces&logoColor=white)
&nbsp;

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
    - Other utility methods such as `scanInteger()`, `scanDecimal()`
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

### `checkString(pattern)`
[](#checkstring)

Checks to see if the string `pattern` is next in the scanned text.

Returns the matched string, or `null` if not found.

Does not update the scanner on a match.

```js
const greeting = scanner.checkString('Hello')

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // null
```

### `scanString(pattern)`
[](#scanstring)

Checks to see if the string `pattern` is next in the scanned text.

Returns the matched string, or `null` if not found.

Updates the scanner on a match.

```js
const greeting = scanner.scanString('Hello')

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // "Hello"
```

### `checkRegex(pattern)`
[](#checkregex)

Checks to see if the regex `pattern` is next in the scanned text.

Returns the matched string, or `null` if not found.

Does not update the scanner on a match.

```js
const greeting = scanner.checkRegex(/Hello|Salutations/)

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // null
```

### `scanRegex(pattern)`
[](#scanregex)

Checks to see if the regex `pattern` is next in the scanned text.

Returns the matched string, or `null` if not found.

Updates the scanner on a match.

```js
const greeting = scanner.scanRegex(/Hello|Salutations/)

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // "Hello"
```

### `check(...patterns)`
[](#check)

Checks to see if any of the patterns are next in the scanned text.
Each option can be a string or regex.

Returns the matched string, or `null` if not found.

Does not update the scanner on a match.

```js
const greeting = scanner.check('Hello', /Salutations/)

console.log(greeting)           // "Hello"
console.log(scanner.lastMatch)  // null
```

### `scan(...patterns)`
[](#scan)

Checks to see if any of the patterns are next in the scanned text.
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

|      name      |                      description                | default     |
|:---------------|:------------------------------------------------|:-----------:|
| start          | The starting delimiter for the text             | `"`         |
| end            | The ending delimiter for the text               | `"`         |
| escape         | The escape character for the text               | `\`         |
| keepDelimiters | Whether to keep the delimiters around the match | `false`     |
| inner          | A list of info for any inner delimited text     | `[]`        |
| autoNest       | An object to automatically generate inners      | `undefined` |
| noEndFail      | Whether not finding `end` is a scan fail or not | `true`      |

As you may notice, every option has a default, meaning you can just use
`scanDelimited()` without any arguments to scan a normal double-quoted string,
if that's what you want.
```js
const scanner = new YScanner('"This is some quoted text"')

const stringText = scanner.scanDelimited()

console.log(stringText)  // "This is some quoted text"
```

Of course, you can change a couple things to easily parse something else:

```js
const scanner = new YScanner("`Look it's a backtick string`")

const backtickString = scanner.scanDelimited({ start: '`', end: '`' })

console.log(backtickString)  // "Look it's a backtick string"
```

<br>

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
| autoNest       | An object to automatically generate inners      | `undefined`            |
| noEndFail      | Whether not finding `end` is a scan fail or not | `true`                 |

It's effectively the same as what you set for `options`, but `start` and `end`
are *required*.

As an example, we'll cover how to scan that multi-level delimited text used
earlier in [the features section](#features).

```js
const scanner = new YScanner(
  '[This is stuff in a bracket and "a string with the \\"[]\\" inside it"]'
)

const result = scanner.scanDelimited({
  start: '[', end: ']',
  inner: [{
    start: '"', end: '"',
    keepDelimiters: true
  }]
})

console.log(result)
// 'This is stuff in a bracket and "a string with the "[]" inside it"'
```

Inner delimited items can have inner delimited items inside them, so you can
scan some crazy things with this method, if you needed to.
<br><br>

#### Note: Automatic Nested Delimited Text

Lastly, sometimes you may need *automatically* generated inner delimited text.
<br>
Especially if you have something that needs to have arbitrarily nested
instances of itself within itself, like braces in code like this example:
```js
if (x) {
  if (y) {
    console.log('cool')
  }
}
```
You could not use `inner` alone to accomplish an indefinite amount of nested
braced blocks of code here, as `inner` is something that is explicitly defined 
(and so literally *not indefinite*). But not doing anything would mean that the
scan would end at the first `}`, which isn't very useful.

You can use the `autoNest` option to achieve this indefinite nesting. <br> 
It will automatically generate copies of the main delimited text info and
put them in `inner` (and do this for each layer of nested text), so that you can
have automatic nested delimited text. <br>
You just need to give `autoNest` an object to say that you want it to
automatically nest.

For example, to scan the code for a nested if-block given above:

```js
const scanner = new YScanner(`
if (x) {
  if (y) {
    console.log('cool')
  }
}
`.trim())

const opening = scanner.scan('if (x) ')

const ifBlock = scanner.scanDelimited({
  start: '{', end: '}',
  autoNest: {},
  keepDelimiters: true
})

console.log(opening + ifBlock)
/*
"if (x) {
  if (y) {
    console.log('cool')
  }
}"
*/
```

&nbsp;

That's cool, but you might ask: <br>
*"How do I automatically nest my delimited text but have the automatically
generated nested text be different than the base nested text?"*

<br>

To make it so that anything generated via `autoNest` is different than what
it's nested from, you can just simply give the object for `autoNest` any
of the properties that you can give the `scanDelimited` method itself.

For example, let's say you want to scan a block of code and want the braces
on the outside removed, but want any inner braces kept:
```js
const Scanner = new YScanner(`
{
  if (stuff) {

  }
}
`.trim())

const codeBlock = scanner.scanDelimited({
  start: '{' end: '}',
  autoNest: { keepDelimiters: true },
  keepDelimiters: false
})

console.log(codeBlock)
/*
"
  if (stuff) {

  }
"
*/
```

Anything defined in `autoNest` will be set for any generated nested text,
instead of defaulting to whatever the parent delimited text has.

<br>

The most fun part of this is that instances of delimited text in `inner` can
also have an `autoNest` in them, and even an `autoNest` (inner or not) can have
`autoNest` inside it.

So you can just go absolutely nuts and have crazy automatically generated
infinitely nested delimited text that has different nested text that has
automatically generated infinitely nested delimited text inside of it.

<br>

I don't believe the potential is infinite, but it's much closer to infinity
than a single method maybe should have.

### `scanUntil(patterns, options)`

Scans text until any of the patterns given are encountered in the scanner
text. <br>
Will update the scanner if a good match.

<br>


The `patterns` argument is an array of patterns to try to scan until, and
each pattern can be a string or regular expression.

The `options` argument takes an object with the following optional properties:
|      name      |                      description                       | default |
|:---------------|:-------------------------------------------------------|:-------:|
| failIfNone     | Whether not finding any pattern is a scan failure      | `false` |
| includePattern | Whether to include the matched pattern with the result | `false` |

<br>

As an example, let's say you have a small language and you have some text
that can be anything up to the start of some square brackets. <br>
You can easily scan it by doing:
```js
const scanner = new YScanner('Hello, World! [other stuff]')
const result = scanner.scanUntil(['['])

console.log(result)  // "Hello, World! "
```

If you wanted to include additional kinds of brackets to stop at, you could do:
```js
const scanner = new YScanner('Hello, World! <other stuff again>')
const result = scanner.scanUntil(['[', '(', '{', '<'], { includePattern: true })

console.log(result)  // "Hello, World! <"
```

Compared to the methods next to this one in the list, this is pretty
simple and straightforward.

### `checkInteger(options)`
[](#check-integer)

Scans to see if there is any text next in the scanner that fits the format of
an integer value. <br>
However, this method provides the ability for you to extensively define just
what "integer value" means for your use case.

As long as it generally fits the
form of "text joined together without spaces, with maybe some decoration on
it", this will scan it.

<br>

The `options` argument for this method takes an object with any of the
following properties:

|      name      |                      description                |       default          |
|:---------------|:------------------------------------------------|:----------------------:|
| sign             | Pattern for a sign at the start                    | optional `+`/`-`  |
| prefix           | Pattern for any number prefix                      | `null`            |
| leading          | Pattern for any leading parts of the number        | optional `0`s     |
| digits           | Pattern for the digits for the number              | `0` - `9`         |
| separator        | Pattern for any separators between digits          | `,`               |
| postfix          | Pattern for any part at the end of the number      | `null`            |
| removeSeparators | Whether to remove separators from the number       | `true`            |
| split            | Whether to return an object instead of the number  | `false`           |

*NOTE: Patterns can be a string, regular expression, or `null`. <br>*
*Everything except digits are optional. If you want something to be required,
set `split` to true and see if the portion is `null` or not.*

<br>

If `split` is set to `true`, then instead of the matched string of text for the
integer, this method will return an object with the following properties:

|      name      |                      description                |
|:---------------|:------------------------------------------------|
| sign             | The matched sign, or `null` if none           | 
| prefix           | Any part before the number, or `null` if none |
| leading          | Any leading part of the number, or `null`     | 
| number           | The main part of the number                   |
| postfix          | Any part after the number, or `null` if none  |

*NOTE: A bad match will still return just `null`, not this object.*

&nbsp;

To show off how this method is used, let's see how it works with no options
set (which will scan a normal decimal integer value):
```js
const scanner = new YScanner('1,000,000')

const num = scanner.checkInteger()

console.log(num)  // "1000000"
```

If we set `removeSeparators` to false, it will keep them in the result:
```js
const scanner = new YScanner('1,000,000')

const num = scanner.checkInteger({ removeSeparators: false })

console.log(num)  // "1,000,000"
```

Let's try a more fun example, like changing the number format to hexadecimal:
```js
const scanner = new YScanner('0xDEAD_BEEF')

const num = scanner.checkInteger({
  prefix: /0x/i,
  digits: /[0-9a-f]/i,  // Note that "1234567890ABCDEF" would work too.
  separator: '_'        // We can have some fun and allow underscore separators.
})

console.log(num)  // "0xDEADBEEF"
```


<br>

Lastly, let's try a more complex example. <br>
Imagine you want to parse a signed hex value for a programming language
you're making, and you also wanna allow it to have an `i` at the end to make it
an imaginary integer:
```js
const scanner = new YScanner('-0xDEAD_BEEFi')

const num = scanner.checkInteger({
  prefix: /0x/i,
  digits: /[0-9a-f]/i,  // Note that "1234567890ABCDEF" would work too.
  separator: '_',       // We can have some fun and allow underscore separators.
  postfix: 'i',
  split: true
})

console.log(num)
// { sign: '-', prefix: '0x', leading: null, number: 'DEADBEEF', postfix: 'i' }
```


### `scanInteger(options)`

Same as [#checkInteger](#check-integer), but it will also update the scanner
position on a good match.

### `checkDecimal(options)`
[](#check-decimal)

Scans to see if there is any text next in the scanner that fits the format of
a decimal value. <br>
Like [#checkInteger](#check-integer), there is a multitude of options that will
allow you to define what you want a decimal to be.

The options argument for this method takes an object with any of the following
properties:
|      name        |                      description                   |      default      |
|:-----------------|:---------------------------------------------------|:-----------------:|
| sign             | Pattern for a sign at the start                    | optional `+`/`-`  |
| prefix           | Pattern for any number prefix                      | `null`            |
| leading          | Pattern for any leading parts of the number        | optional `0`s     |
| digits           | Pattern for the digits for the number              | `0` - `9`         |
| separator        | Pattern for any separators between digits          | `,`               |
| radix            | Pattern for the radix point in the decimal value   | `.`               |
| trailing         | Pattern for any trailing parts of the number       | optional `0`s     |
| postfix          | Pattern for any part at the end of the number      | `null`            |
| removeSeparators | Whether to remove separators from the number       | `true`            |
| split            | Whether to return an object instead of the number  | `false`           |

*NOTE: Patterns can be a string, regular expression, or `null`. <br>*
*Everything except digits are optional. If you want something to be required,
set `split` to true and see if the portion is `null` or not.*

<br>

If `split` is set to `true`, then instead of the matched string of text for the
decimal, this method will return an object with the following properties:

|      name        |                     description                   |
|:-----------------|:--------------------------------------------------|
| sign             | The matched sign, or `null` if none               | 
| prefix           | Any part before the number, or `null` if none     |
| leading          | Any leading part of the number, or `null`         | 
| whole            | The whole number portion of the decimal or `null` |
| radix            | The radix point for the decimal, or `null`        |
| fractional       | The fractional portion of the decimal, or `null`  |
| number           | The entire numeric portion of the number          |
| trailing         | Any trailing part of the number, or `null`        |
| postfix          | Any part after the number, or `null` if none      |

*NOTE: A bad match will still return just `null`, not this object.* <br>
*NOTE <sup>2</sup>: If the fractional part of a decimal value has text at the
end that matches trailing text, the trailing part will take it, but will leave
one digit in the fractional part (so `.0` will not be `.` with trailing `0`).*

&nbsp;

Like with `checkInteger`, we'll go over some examples; the most basic is just
calling `checkDecimal()` with no options, which will scan a standard signed
decimal number:
```js
const scanner = new YScanner('5.23')
const num = scanner.checkDecimal()

console.log(num)  // "5.23"
```

Additionally, `split` will return an object of all possible parts of the number
split up:
```js
const scanner = new YScanner('-5.23')
const num = scanner.checkDecimal({ split: true })

console.log(num)
/* { sign: '-', prefix: null, leading: null, whole: '5', radix: '.',
     fractional: '23', number: '5.23', trailing: null, postfix: null } */
```

To up the complexity, let's say you want to scan what you call a
"signed, decimal hex value" with optional underscore separators (that are
simply ignored by your parser) and the ability to put an `i` at the end of
signify an imaginary number:
```js
const scanner = new YScanner('-0xDEAD_BEEF.DEAF_CAFEi')
const num = scanner.checkDecimal({
  prefix: /0x/i,
  digits: /[0-9a-f]/i,
  separator: '_',
  postfix: 'i',
  split: true
})

console.log(num)
/* { sign: '-', prefix: '0x', leading: null, whole: 'DEADBEEF', radix: '.',
     fractional: 'DEAFCAFE', number: 'DEADBEEF.DEAFCAFE', trailing: null,
     postfix: 'i' } */
```

#### Note on how numbers get split
Just for a small reference on how your numbers should come out for questionable
scenarios, here's a table of how some values get split up: <br>
*Note: This is assuming leading/trailing zeroes are allowed.*
|      value        |  leading  | whole  | fractional | trailing | note     |
|:------------------|:---------:|:------:|:----------:|:--------:|:--------:|
| 0.0               | `null`    | `0`    | `0`        | `null`   |          |
| .1                | `null`    | `null` | `1`        | `null`   |          |
| 3.                | `null`    | `null` | `null`     | `null`   | no match |
| 00.0              | `0`       | `0`    | `0`        | `null`   |          |
| 020.000           | `0`       | `20`   | `0`        | `00`     |          |


### `scanDecimal(options)`

Same as [#checkDecimal](#check-decimal), but it will also update the scanner
position on a good match.

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