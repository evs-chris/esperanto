# esperanto

A better way to transpile ES6 modules to AMD and CommonJS:

* Easier - no laborious configuration
* Simpler - doesn't make dangerous assumptions about your project setup
* Smarter - non-destructive source code transformation, no runtime Traceur dependency, and no ES5-only features
* Faster - roughly 10x quicker than the alternatives

Try it online here: [rich-harris.co.uk/esperanto](http://www.rich-harris.co.uk/esperanto/)

## Installation

Install esperanto from npm:

```bash
npm install esperanto
```

## Usage

You can use Esperanto in one of two modes:

* [Converting a single module](https://github.com/Rich-Harris/esperanto/wiki/Converting-a-single-module)
* [Bundling multiple ES6 modules](https://github.com/Rich-Harris/esperanto/wiki/Bundling-multiple-ES6-modules)


## Why not use existing module transpilers?

See [comparisons with other tools](https://github.com/Rich-Harris/esperanto/wiki/Comparisons-with-other-tools) for some of the reasons to use Esperanto.


## Still to-do

* Command line mode
* Source maps


## Credits

Many thanks to [Marijn Haverbeke](http://marijnhaverbeke.nl/) for [Acorn](https://github.com/marijnh/acorn), which does all the heavy lifting.


## License

Copyright 2014 Rich Harris. MIT Licensed.
