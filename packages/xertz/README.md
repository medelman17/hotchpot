xertz
=====



[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/xertz.svg)](https://npmjs.org/package/xertz)
[![CircleCI](https://circleci.com/gh/medelman17/xertz/tree/master.svg?style=shield)](https://circleci.com/gh/medelman17/xertz/tree/master)
[![Codecov](https://codecov.io/gh/medelman17/xertz/branch/master/graph/badge.svg)](https://codecov.io/gh/medelman17/xertz)
[![Downloads/week](https://img.shields.io/npm/dw/xertz.svg)](https://npmjs.org/package/xertz)
[![License](https://img.shields.io/npm/l/xertz.svg)](https://github.com/medelman17/xertz/blob/master/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g xertz
$ xertz COMMAND
running command...
$ xertz (-v|--version|version)
xertz/0.0.0 darwin-x64 node-v12.16.1
$ xertz --help [COMMAND]
USAGE
  $ xertz COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`xertz hello [FILE]`](#xertz-hello-file)
* [`xertz help [COMMAND]`](#xertz-help-command)

## `xertz hello [FILE]`

describe the command here

```
USAGE
  $ xertz hello [FILE]

OPTIONS
  -f, --force
  -h, --help       show CLI help
  -n, --name=name  name to print

EXAMPLE
  $ xertz hello
  hello world from ./src/hello.ts!
```

_See code: [src/commands/hello.ts](https://github.com/medelman17/xertz/blob/v0.0.0/src/commands/hello.ts)_

## `xertz help [COMMAND]`

display help for xertz

```
USAGE
  $ xertz help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v2.2.3/src/commands/help.ts)_
<!-- commandsstop -->
