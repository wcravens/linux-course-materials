---
title: Getting Started with mdBook
---

## What mdBook is, and when to reach for it

One Markdown file is a document. Twenty of them are a pile. Once your notes
outgrow a single file you want a table of contents, a way to move from one
page to the next, a search box, and one command that turns the whole pile into
something a browser can show. That is what mdBook does.

mdBook is a small command line program that takes a directory of Markdown
files and produces a static website: an HTML page per chapter, a sidebar
listing every chapter in order, previous and next links, full text search, and
a light or dark theme. The output is plain files, so it runs from any web
server, or from no server at all if you just open `index.html`.

It was written to publish *The Rust Programming Language*, and most of the
documentation you will read for Rust tools is built with it. It has since been
picked up well beyond that world, because the problem it solves has nothing to
do with Rust: a set of related pages, written in Markdown, that should read as
a book. Course notes, a lab journal, a project's user guide, the runbook for a
server you administer. If you find yourself keeping a `notes/` directory full
of `.md` files, mdBook is the next step.

The trade is a little structure. mdBook wants your chapters listed in one
file, in order, and it wants them under one directory. In exchange it does
everything else, and the structure it asks for is one you would have invented
anyway by the third chapter.

## Before you start

- **A Linux machine with a shell.** Any distribution will do. Everything
  below was run on Debian, and where distributions differ it says so.
- **A working knowledge of Markdown.** Headings, lists, links, and fenced
  code blocks are all mdBook needs from you. The *Writing Markdown* module
  covers them if you have not met them before.
- **A browser.** mdBook's output is a website, and the point of the exercise
  is to look at it.

You do not need Rust. mdBook is written in it, but it ships as a single
executable, and two of the three ways to install it below never mention a
compiler.

## Installing mdBook

Pick one of the following. When you are done, the check at the end of this
section is the same regardless of which you chose.

### From your distribution's package manager

Debian 13, Ubuntu, and a number of other distributions package mdBook, and a
package is the easiest thing to install and the easiest thing to remove again.

```bash
sudo apt update
sudo apt install mdbook
```

Two cautions. The packaged version can be a release or two behind, which for
what this module covers does not matter. And not every release of every
distribution has it: Debian 12, which is what a fresh cloud VM is likely to be
running, has no `mdbook` package at all. If `apt` reports that it cannot find
the package, use the next method instead.

### From a prebuilt binary

The mdBook project publishes a compiled executable for Linux with every
release. Downloading it and dropping it into a directory on your `PATH` is
the whole installation, it needs no root access, and it gets you the current
version on any distribution.

```bash
VERSION=v0.5.4
ARCH=x86_64-unknown-linux-gnu
URL=https://github.com/rust-lang/mdBook/releases/download
mkdir -p ~/.local/bin
curl -sSL "$URL/$VERSION/mdbook-$VERSION-$ARCH.tar.gz" \
  | tar -xz -C ~/.local/bin
```

The last line downloads the archive and unpacks it in one step, and the
archive contains exactly one file, the `mdbook` executable. The three
variables above it only exist to keep the address readable. Set `VERSION` to
the current release from the
[releases page](https://github.com/rust-lang/mdBook/releases) if a newer one
exists. If `uname -m` reports `aarch64` rather than `x86_64`, you are on an ARM
machine: set `ARCH` to `aarch64-unknown-linux-musl` instead.

`~/.local/bin` is the conventional place for programs a user installs for
themselves, and Debian and Ubuntu add it to your `PATH` automatically at login
*if it exists*. If you just created it, either log out and back in, or add it
to the current shell by hand:

```bash
export PATH="$HOME/.local/bin:$PATH"
```

### With cargo

If you already have a Rust toolchain, `cargo` can build mdBook from source and
install it into `~/.cargo/bin`:

```bash
cargo install mdbook
```

This takes a few minutes and a few hundred megabytes of build artifacts, and
gets you exactly the same program as the prebuilt binary. Run the same command
again to upgrade later. It is here for completeness; if you do not already
have Rust installed, do not install it for this.

### Check that it worked

```bash
mdbook --version
```

If that prints a version, you are done installing. If the shell says
`command not found`, the executable is not on your `PATH`: for the binary
method, re-read the paragraph about `~/.local/bin`; for `cargo`, make sure
`~/.cargo/bin` is on your `PATH`, which the Rust installer offers to arrange.

## Creating a book

`mdbook init` creates a new book. Given no arguments it asks two questions,
whether to create a `.gitignore` and what to call the book. Both can be
answered on the command line instead, which is what the next command does:

```bash
mdbook init linux-notes --title "Linux Notes" --ignore git
cd linux-notes
```

The result is a directory with four files in it:

```text
linux-notes/
├── .gitignore
├── book.toml
└── src/
    ├── SUMMARY.md
    └── chapter_1.md
```

Every mdBook project has this shape, and each of the four files has one job.

`book.toml` is the configuration. The generated one is three lines, and it
would work with just the first two:

```toml
[book]
title = "Linux Notes"
authors = ["Your Name"]
language = "en"
```

mdBook fills in `authors` from your git configuration if you have one, and
leaves it empty otherwise. Edit it by hand to whatever you like.

`src/` holds every chapter. Nothing outside it is part of the book.

`src/SUMMARY.md` is the table of contents, and it is the file that makes
mdBook mdBook. The whole of the next section is about it.

`src/chapter_1.md` is a placeholder chapter, containing one heading. You will
replace it shortly.

The `.gitignore` contains one line, `book`, which is the name of the output
directory. Generated output should not be committed alongside its source, and
this arranges that from the start.

## SUMMARY.md is the table of contents

Open `src/SUMMARY.md`. As generated it is two lines:

```markdown
# Summary

- [Chapter 1](./chapter_1.md)
```

mdBook reads this file to learn what chapters the book has, what order they
come in, and how they nest. Only the files listed here become chapters. A
Markdown file sitting in `src/` that no entry in `SUMMARY.md` points to is
ignored, and a file listed here that does not exist yet is *created*, empty
except for its title, the next time the book builds. That second behavior is
more useful than it sounds: you can write the outline of an entire book in
`SUMMARY.md` first, build once, and have every chapter file waiting for you.

The file is ordinary Markdown, restricted to a few constructs. Replace the
generated contents with this:

```markdown
# Summary

[Introduction](README.md)

# Getting Around

- [Getting a shell](shell.md)
- [Files and directories](files/README.md)
  - [Permissions](files/permissions.md)

# Administration

- [Users and groups](users.md)
- [Services]()
```

Each construct does something specific.

**A bare link on its own line**, like `[Introduction](README.md)`, is a
*prefix chapter*: a page that comes before the numbered chapters and gets no
number. Forewords and introductions go here. Prefix chapters must come before
any list item.

**A list item** is a *numbered chapter*. The link text is what appears in the
sidebar, and the path is relative to `src/`. Chapters are numbered in the
order they appear, so this book's first numbered chapter is *Getting a shell*.

**An indented list item** is a *sub-chapter* of the item above it, and shows
up in the sidebar nested under its parent and numbered `2.1`. Nest as deep as
you need, but consistently: use hyphens or asterisks for the list markers, not
a mixture.

**A level-one heading** is a *part title*. It draws a label in the sidebar
that groups the chapters below it, and the label is not a link, because there
is no page behind it. Note that the `# Summary` at the top is just such a
heading, and mdBook ignores it; it is there by convention.

**A link with an empty target**, like `[Services]()`, is a *draft chapter*.
It appears in the sidebar, greyed out and unclickable, as a reminder of what
you still mean to write. No file is created for it.

A file named `README.md` is special in one way: mdBook renders it as
`index.html` in the corresponding output directory, the way a web server
treats `index.html` as the page for a directory. That is why the introduction
above is `README.md`, and why the directory chapter *Files and directories* is
`files/README.md`: each becomes the landing page for its level.

Delete the placeholder chapter, since nothing refers to it any longer:

```bash
rm src/chapter_1.md
```

## Building the book

```bash
mdbook build
```

The output looks like this, and the paths on the last line will be your own:

```text
 INFO Book building has started
 INFO Running the html backend
 INFO HTML book written to `/home/you/linux-notes/book`
```

Now look at what happened in `src/`:

```text
src/
├── SUMMARY.md
├── README.md
├── shell.md
├── users.md
└── files/
    ├── README.md
    └── permissions.md
```

Every chapter that `SUMMARY.md` promised now exists, each one holding a single
level-one heading copied from its link text. The draft chapter *Services* got
no file, as promised.

The build itself went to `book/`. Open it and you will find an HTML page for
every chapter, in the same directory structure as `src/`, plus the stylesheets,
fonts, JavaScript, and search index that make the site work. There is also a
`print.html`, which is the entire book on one page for printing to PDF, and a
`404.html` for a web server to show when a page is missing.

`book/` is disposable. It is rebuilt from scratch each time, it is what the
`.gitignore` excludes, and `mdbook clean` deletes it. Nothing you want to keep
is ever in there.

You could stop here and open `book/index.html` in a browser directly. The
next section shows the better way.

## Previewing while you write

```bash
mdbook serve --open
```

This builds the book, starts a small web server at
`http://localhost:3000`, and opens your browser to it. Then it watches `src/`
and `book.toml`, and every time you save a file it rebuilds the book and tells
the browser to reload. Leave it running in one terminal, edit in another, and
the page in front of you keeps up with your typing. Stop it with
<kbd>Ctrl</kbd>+<kbd>C</kbd>.

The server listens only on `localhost`, meaning only programs on the same
machine can reach it. That is a sensible default, and it is also why
`mdbook serve` on a remote machine appears not to work: the book is being
served, but on the wrong computer's `localhost`.

### On a remote machine

If you write on a server you reach over SSH, and the browser is on the laptop
in front of you, ask SSH to carry port 3000 across the connection. From the
laptop:

```bash
ssh -L 3000:localhost:3000 you@your-server
```

Then run `mdbook serve` in that session, without `--open`, and point the
laptop's browser at `http://localhost:3000`. Port 3000 on the laptop is now
forwarded through the tunnel to port 3000 on the server, where mdBook is
listening. The same trick works for anything that serves on `localhost`, and
it costs nothing in firewall rules, because nothing new is exposed to the
network.

If the server is a Google Cloud VM reached with `gcloud`, the forwarding
options go after a `--`, which passes them through to the underlying `ssh`:

```bash
gcloud compute ssh linux-lab --zone us-central1-a \
  -- -L 3000:localhost:3000
```

There is also `mdbook watch`, which rebuilds on every change like `serve` but
runs no web server. It is for the case where something else, such as a real
web server, is already serving `book/`.

## Writing chapters

A chapter is a Markdown file. Nearly everything from the *Writing Markdown*
module applies unchanged: headings, emphasis, lists, links, images, block
quotes, fenced code with a language for highlighting, and tables. mdBook's
dialect is CommonMark plus the GitHub extensions for tables, task lists,
strikethrough, and footnotes.

Three things are worth knowing that are specific to a book.

**Start every chapter with a level-one heading.** The link text in
`SUMMARY.md` is what the sidebar shows; the `#` heading at the top of the file
is what the page shows, and the two do not have to match. Use `##` and below
for sections within the chapter.

**Link between chapters with relative paths to the Markdown files.** From
`shell.md`, the permissions chapter is `[permissions](files/permissions.md)`;
from `files/permissions.md`, the shell chapter is `[the shell](../shell.md)`.
mdBook rewrites the `.md` to `.html` in the output, so the links work in the
built book and also on GitHub, where the source is browsed as Markdown.

**Anything in `src/` that is not Markdown is copied to the output as it is.**
Put an image at `src/images/boot-order.png`, refer to it from a chapter with a
path relative to that chapter, and it comes along in the build. Keep the
convention of one directory for images and the source tree stays readable.

### Including a file instead of pasting it

Notes about a system tend to include scripts and configuration files, and a
pasted copy of a file goes stale the first time the original changes. mdBook
can pull the file in at build time instead. Save the script under `src/`, and
in the chapter write:

````markdown
```bash
{{#include examples/backup.sh}}
```
````

The `{{#include}}` line is replaced with the contents of the file, relative to
the chapter that contains it, and the surrounding fence highlights it as a
shell script. Edit the script and the book changes with it.

To include only part of a file, mark the part with a pair of comments in the
file itself:

```bash
# ANCHOR: rotate
find /var/backups -name '*.tar.gz' -mtime +30 -delete
# ANCHOR_END: rotate
```

and name the anchor after a colon: `{{#include examples/backup.sh:rotate}}`.
Including by anchor leaves the anchor comments out of the output; including
the whole file keeps them. A line range works too,
`{{#include examples/backup.sh:5:12}}`, but it breaks the moment a line is
inserted above it, and the anchor does not.

## A little configuration

`book.toml` is written in TOML, a configuration format of `key = value` lines
grouped under bracketed section headings. The `[book]` section you have
already seen holds the metadata. A few more settings are worth knowing about,
and this is a reasonable file for a set of course notes:

```toml
[book]
title = "Linux Notes"
authors = ["Your Name"]
description = "Working notes from CSC 171"
language = "en"

[build]
build-dir = "book"

[output.html]
default-theme = "light"
git-repository-url = "https://github.com/you/linux-notes"

[output.html.fold]
enable = true
level = 1
```

`[build]` controls the build itself. `build-dir` is where the output goes,
and `book` is already the default; it is written out here so you can see where
to change it. There is also `create-missing`, which defaults to `true` and is
the setting that creates chapter files from `SUMMARY.md`. Set it to `false`
and a missing chapter becomes a build error instead, which is what you want
once the book is finished and being built by a machine rather than by you.

`[output.html]` configures the website. `default-theme` picks the color
scheme a first-time reader sees; the reader can change it from the menu bar.
`git-repository-url` adds a link to the repository in the menu bar, if the
book has one. The nested `[output.html.fold]` section collapses the sidebar so
that only the current part is expanded, and `level = 1` starts the folding one
level down, which keeps a long book navigable.

Every option has a default, and the full list is in the configuration chapter
of the mdBook guide linked at the end. Add settings when you need them, not in
advance.

## Publishing

`book/` is a complete static website. Whatever serves plain files can serve it.

The simplest test is Python's built-in server, which is on nearly every Linux
system:

```bash
cd book
python3 -m http.server 8000
```

For something more durable, copy `book/` to the document root of any web
server. On a Debian machine running Apache that is `/var/www/html/`, and the
copy is one `rsync` or `scp`. GitHub Pages and similar services will host it
for nothing; the mdBook guide has a chapter on running the build in continuous
integration so that every push republishes the book.

One setting matters when the book is not at the root of its site. If it lives
at `https://example.edu/notes/` rather than `https://example.edu/`, set
`site-url = "/notes/"` in `[output.html]` so the `404.html` page can find its
stylesheet. Everything else uses relative paths and does not care.

## Doing it from a script

`code/new-book.sh` in this module creates the book described above in one go:
it runs `mdbook init` with the title you give it, writes the `SUMMARY.md` from
the table of contents section, and builds once so that every chapter file
exists. Run it with the title as its only argument:

```bash
bash new-book.sh "Linux Notes"
```

It creates the book in a directory named after the title, in lower case with
hyphens for spaces, and prints the command to preview it. Read it before you
run it. Everything in it appeared somewhere above.

## Reference

Table: mdBook commands used in this module and what each one does

| Command | What it does |
| --- | --- |
| `mdbook --version` | Prints the installed version; the check that installation worked |
| `mdbook init <dir>` | Creates a new book in `<dir>`; `--title` and `--ignore git` answer its questions |
| `mdbook build` | Renders `src/` into `book/`, creating any chapter files that are missing |
| `mdbook serve` | Builds, serves at `localhost:3000`, reloads the browser on each save; `--open` also opens it |
| `mdbook watch` | Rebuilds on each save, with no web server |
| `mdbook clean` | Deletes `book/` |

Table: The files in a book and what each one is for

| File | What it is for |
| --- | --- |
| `book.toml` | Configuration: title, authors, output directory, HTML options |
| `src/SUMMARY.md` | The table of contents; only chapters listed here are built |
| `src/*.md` | The chapters themselves, one file each |
| `src/` (anything else) | Copied to the output unchanged; images and included files go here |
| `book/` | The generated website; disposable, and excluded from version control |

## Further reading

- [The mdBook User Guide](https://rust-lang.github.io/mdBook/): the official
  documentation, itself an mdBook, with a chapter on every command and every
  configuration option.
- [The mdBook releases page](https://github.com/rust-lang/mdBook/releases):
  where the prebuilt binaries live, and the place to check the current version.
- [The Rust Programming Language](https://doc.rust-lang.org/book/): the book
  mdBook was written for, and a good look at what a finished one can be.
- [TOML](https://toml.io/): the format `book.toml` is written in, for when a
  setting needs a type more interesting than a string.
