---
title: Getting Started with mdBook
---

mdBook is a small command line tool that turns a directory of Markdown files
into a static website with a table of contents, previous and next links, full
text search, and a choice of themes. It was written to publish the Rust
book and is now used for documentation, guides, and notes well beyond that
world. If your notes have outgrown a single file, it is the next step.

This module walks through mdBook from nothing to a published book: installing
it from a distribution package, a prebuilt binary, or `cargo`; creating a book
with `mdbook init`; the `SUMMARY.md` file that defines the chapters, their
order, and their nesting, including prefix chapters, part titles, and drafts;
building with `mdbook build` and previewing with `mdbook serve`, on your own
machine and over an SSH tunnel to a remote one; writing chapters, linking
between them, and including scripts from files so that they never go stale; a
few useful settings in `book.toml`; and putting the finished `book/` directory
on a web server.

You should be comfortable in a Linux shell and know basic Markdown, which the
*Writing Markdown* module covers. No Rust is required. Expect to spend about
an hour, with a working book of your own at the end of it, and a script in
`code/` that reproduces the whole walkthrough in one command.
