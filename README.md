# sb2re
Convert Scrapbox format to Re:VIEW format

## Usage

You can execute this command by `deno run` inside the root directory of the project.

```sh
# In the project's root directory
deno run -A cli.ts [args...]

# help
deno run -A cli.ts --help

# convertion
cat input | deno run -A cli.ts [options] > out.re
deno run -A cli.ts input [options] > out.re
deno run -A cli.ts input out.re [options]
```

## Installation

You can install this command globally using `deno install`. If you want to update, please execute installation command again.

```sh
# Install / Update
deno install -Af --name=sb2re https://github.com/fabon-f/sb2re/raw/master/cli.ts
```
