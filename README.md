# runreal cli

![hero](assets/hero.png)

<p align="center">The Open-Source Unreal Engine toolkit.
  <br />
  <a href="https://docs.runreal.dev/cli"><strong>Documentation »</strong></a>
  <br />
  <br />
  <a href="https://runreal.dev">Website</a>
  ·
  <a href="https://x.com/runreal_dev">Twitter</a>
  <br />
  <br />
</p>

- **Unreal Engine**: Configure engines, build projects, and run UAT/UBT commands.
- **Buildgraph**: Generate reports from your buildgraphs.


## Installation

Download the latest release from the [Releases](https://github.com/runreal/cli/releases/latest) page.


## Building from source

1. Clone the cli

```bash
git clone https://github.com/runreal/cli
```

2. Install dependencies

```bash
deno install
```

3. Run the cli in dev mode

```bash
deno task dev
```

### Compiling to binaries

```bash
deno task compile-win
deno task compile-linux
deno task compile-macos
```

### Changelog
See the [CHANGELOG](CHANGELOG.md) for a list of changes.


### License

MIT [LICENSE](LICENSE)
