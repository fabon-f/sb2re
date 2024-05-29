# sb2re

Convert Scrapbox format to Re:VIEW format

## Installation

```sh
deno install --global --allow-read --allow-write --name sb2re jsr:@fabon/sb2re/cli
```

Alternatively, you can also run the CLI command **without installation**.

```sh
# run without installation
deno run --allow-read --allow-write jsr:@fabon/sb2re/cli input out.re
```

## Usage

```sh
sb2re [args...]
# help
sb2re --help

# convertion
cat input | sb2re [options] > out.re
sb2re input [options] > out.re
sb2re input out.re [options]
```
