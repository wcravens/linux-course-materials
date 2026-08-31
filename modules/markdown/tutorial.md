---
title: Writing Markdown
---

## What Markdown is, and why it is worth an hour

Markdown is a small set of conventions for marking up plain text. A `#` at the
start of a line means "this is a heading". Asterisks around a word mean
"emphasize this". A hyphen at the start of a line means "this is a list item".
A program called a renderer reads those conventions and produces HTML, a PDF,
or whatever else you asked it for.

Many formats can produce HTML. What makes Markdown worth an hour of your time
is the half of it that never gets rendered at all. A Markdown file is meant to
be read as it stands, in a terminal, by a person. Compare a heading in HTML,
`<h2>Installing the tools</h2>`, with the same heading in Markdown,
`## Installing the tools`. The second one does not need to be rendered to be
understood, and it does not stop being readable when the tool that renders it
is unavailable.

That property is why Markdown turns up wherever prose has to live next to code.
The `README.md` at the top of a source repository is Markdown. Commit messages,
issue trackers, pull request descriptions, and most chat clients accept it. The
notes you are reading right now are a Markdown file. Because the file is plain
text, version control can diff it line by line, `grep` can search it, and any
editor on any machine can open it. Nothing about it is locked to one
application.

Markdown is deliberately small. You can learn nearly all of it in a sitting,
and the parts you do not learn you will rarely miss.

## The syntax that covers most writing

### Headings

One to six `#` characters, followed by a space, make a heading of that level.

```markdown
# Document title
## A major section
### A subsection inside it
```

Use one level-one heading as the document title and go down one level at a
time. Skipping from `#` to `###` is not a syntax error, but screen readers
announce heading levels to let a listener move through a document by its
structure, and a gap in the levels breaks that.

### Paragraphs and emphasis

A blank line separates paragraphs. A single newline does not, so you are free
to wrap long lines in your editor without changing the output.

```markdown
Wrap `code` in backticks, *one asterisk for italic*, and
**two for bold**.
```

Underscores do the same job as asterisks. Pick one and stay with it.

### Lists

A hyphen and a space start an unordered list item. A number, a period, and a
space start an ordered one. Indent a nested list under the item it belongs to.

```markdown
- Packages
  - Installed with a package manager
  - Removed the same way
- Configuration

1. Download the image
2. Verify the checksum
3. Write it to the disk
```

The numbers you type are not the numbers that appear. A renderer counts the
items itself, so a list written entirely with `1.` still comes out numbered
correctly. That is convenient when you insert a step in the middle.

### Links and images

A link is bracketed text followed by a parenthesized target.

```markdown
[The Linux Kernel Archives](https://www.kernel.org/)
```

An image is the same thing with a leading `!`, where the bracketed text is the
alt text rather than the visible label.

```markdown
![A diagram of the boot sequence](/boot-sequence.png)
```

Alt text is not decoration. It is what a reader using a screen reader gets
instead of the picture, so describe what the image shows rather than naming the
file.

### Blockquotes

A `>` at the start of a line quotes it. Quoted lines can contain any other
Markdown.

```markdown
> The kernel is not the operating system. It is the part of the operating
> system that talks to the hardware.
```

## Code

Inline code goes in single backticks: `ls -l /etc` reads as code rather than as
prose. If the code itself contains a backtick, surround it with two backticks
instead.

A block of code goes in a fence: three backticks on a line by themselves, the
code, then three more. Write the language directly after the opening fence and
the renderer will highlight it.

````markdown
```bash
sudo apt update
sudo apt install pandoc
pandoc notes.md -o notes.pdf
```
````

Which renders as:

```bash
sudo apt update
sudo apt install pandoc
pandoc notes.md -o notes.pdf
```

Notice the outer fence in the example above uses four backticks. A fence ends
at the next line of *at least* as many backticks, so showing a three-backtick
block requires wrapping it in four. Use `text` as the language when you want a
block left unhighlighted, such as sample terminal output.

## Tables

A table is a header row, a row of hyphens marking the columns, and one row per
record. The pipes do not have to line up in the source; lining them up only
makes the file pleasanter to read.

Every table in these notes carries a caption, written as a paragraph beginning
`Table: ` on the line directly above the table. The renderer consumes that
paragraph and turns it into a real HTML `<caption>` element, which is what a
screen reader announces before it starts reading cells. Markdown has no syntax
of its own for captions, which is why the convention exists. A table without
one still renders, but the build prints a warning.

````markdown
Table: Common file permission bits and what each one allows

| Symbol | Value | On a file | On a directory |
| --- | --- | --- | --- |
| `r` | 4 | Read the contents | List the entries |
| `w` | 2 | Change the contents | Add or remove entries |
| `x` | 1 | Execute it | Enter it |
````

Rendered, the caption is placed off-screen rather than drawn, because the
prose around a table normally introduces it already and a visible caption would
repeat what you just read. The table itself looks like this:

Table: Common file permission bits and what each one allows

| Symbol | Value | On a file | On a directory |
| --- | --- | --- | --- |
| `r` | 4 | Read the contents | List the entries |
| `w` | 2 | Change the contents | Add or remove entries |
| `x` | 1 | Execute it | Enter it |

Write the header row as ordinary Markdown. The renderer marks those cells as
headers for you, so a screen reader can say which column a value belongs to
when it reads across a row.

## Flavors

There is no single Markdown. The original was a Perl script with no
specification, and the gaps in it were filled in differently by everyone who
reimplemented it.

**CommonMark** is the answer to that. It is a precise specification of the
core: headings, emphasis, lists, links, images, blockquotes, and code. Treat it
as the part of Markdown that works everywhere.

**GitHub Flavored Markdown**, or GFM, is CommonMark plus a few additions that
proved too useful to leave out. Tables are one of them, which is why the
section above is not part of the core. GFM also adds task lists and
strikethrough.

```markdown
- [x] Partition the disk
- [ ] Install the base system

~~This sentence is struck through.~~
```

The renderer, not the file, decides which flavor you get. The same document can
show a table on one site and a row of pipe characters on another. When you are
writing for a system you do not control, stay near the CommonMark core and test
anything beyond it.

## Where Markdown shows up on a Linux system

The first place is the `README.md` at the root of almost every source
repository you will clone. Reading one in a terminal with `less README.md` is a
normal thing to do, and it works because Markdown was designed for it.

The second is `pandoc`, a document converter packaged by every major
distribution. It reads Markdown and writes HTML, PDF, EPUB, and about thirty
other formats, so a plain text file in your home directory can become a
formatted document without a word processor ever being involved.

The third is these notes. Every page of this course is a Markdown file that a
build turns into both the HTML you may be reading and the PDF you can print.
One source file, two outputs, and the source stays readable on its own. That is
the whole argument for the format, and you have now seen it from both ends.

## Further reading

- [The CommonMark specification](https://spec.commonmark.org/): the definitive
  description of the core syntax, with worked examples for every rule.
- [The GitHub Flavored Markdown specification](https://github.github.com/gfm/):
  CommonMark plus tables, task lists, strikethrough, and autolinks.
- [The Markdown Guide](https://www.markdownguide.org/): a friendlier reference
  organized by what you are trying to write.
