---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Working with Commands: Identification, Documentation, and Aliases'
info: |
  ## The Linux Command Line — Lecture 5
  Identification, Documentation, and Aliases. Adapted from TLCL chapter 5.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Working with Commands

Identification, Documentation, and Aliases

The Linux Command Line

Lecture 5

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain the four types of commands recognized by the shell
- Use `type`, `which`, `help`, `man`, `apropos`, `whatis`, and `info` to identify and document commands
- Navigate and interpret man pages and info documents
- Apply `alias` to create custom command shortcuts
- Distinguish between shell builtins, executable programs, shell functions, and aliases

---
layout: section
---

# What Exactly Are Commands?

Every command you type at the shell prompt is one of **four types**

Understanding which type a command belongs to determines where you find its documentation

---

# The Four Command Types

| Type | Description | Example |
|------|-------------|---------|
| **Executable program** | Compiled binary or script in `/usr/bin` | `cp`, `python3` |
| **Shell builtin** | Built directly into the shell | `cd`, `type` |
| **Shell function** | Miniature shell script in the environment | User-defined |
| **Alias** | User-defined shortcut for other commands | `ll` for `ls -l` |

---

# Executable Programs

- Compiled binaries written in C, C++, etc.
- Scripts written in shell, Perl, Python, Ruby
- Stored in directories like `/usr/bin`, `/usr/local/bin`
- The most common type of command

---

# Shell Builtins

- Commands built directly into `bash` itself
- No separate executable file on disk
- Examples: `cd`, `echo`, `type`, `alias`, `help`
- Needed for functionality that cannot be done by an external program (e.g., `cd` must change the shell's own working directory)

---
layout: section
---

# Identifying Commands

---

# `type` — What Kind of Command Is It?

The `type` command is a shell builtin that reveals how the shell interprets a command name

```bash
type type
# type is a shell builtin

type ls
# ls is aliased to 'ls --color=auto'

type cp
# cp is /usr/bin/cp
```

---

# `which` — Where Is the Executable?

The `which` command shows the full path of an executable program

```bash
which ls
# /usr/bin/ls

which cp
# /usr/bin/cp
```

- Only works for **executable programs**
- Does not find builtins, functions, or aliases
- `which cd` produces no useful result because `cd` is a builtin

---

# `type` vs `which`

| Feature | `type` | `which` |
|---------|--------|---------|
| Finds builtins | Yes | No |
| Finds aliases | Yes | No |
| Finds executables | Yes | Yes |
| Finds functions | Yes | No |
| Shows command type | Yes | No |

Use `type` first to determine what kind of command you have, then `which` if you need the executable path

---
layout: section
---

# Getting Help: Shell Builtins

---

# `help` — Documentation for Builtins

The `help` command is the primary way to get documentation for shell builtins

```bash
help cd
# cd: cd [-L|[-P [-e]]] [dir]
#     Change the shell working directory. ...
```

---

# Reading `help` Notation

- `[]` — Square brackets indicate **optional** items
- `|` — Vertical bar means **mutually exclusive** (choose one)
- Items without brackets are **required**

Use `-m` for a man-page-style format:

```bash
help -m cd
```

---

# `--help` — Quick Usage for Executables

Many executable programs support a `--help` option

```bash
mkdir --help
# Usage: mkdir [OPTION]... DIRECTORY...
# Create the DIRECTORY(ies), if they do not already exist. ...
```

- Not universal — some programs do not support it
- Some programs use `-h` instead

---
layout: section
---

# Getting Help: Man Pages

---

# `man` — The Manual Page System

The `man` command displays formal documentation for programs

```bash
man ls
```

- Uses `less` as the pager
- Space to scroll forward, `b` to scroll back
- `/pattern` to search, `q` to quit

---

# Man Page Sections

Man pages are organized into **numbered sections**

| Section | Contents |
|---------|----------|
| 1 | User commands |
| 2 | Kernel system calls |
| 3 | C library functions |
| 4 | Special files and drivers |
| 5 | File formats |
| 6 | Games and amusements |
| 7 | Miscellaneous |
| 8 | System administration commands |

---

# Specifying a Man Page Section

Some topics exist in multiple sections — specify the section number to get the right page

```bash
man passwd
# Shows section 1: the passwd command

man 5 passwd
# Shows section 5: the /etc/passwd file format
```

---

# `whatis` — One-Line Descriptions

The `whatis` command displays a brief description from the man page

```bash
whatis ls
# ls (1)              - list directory contents

whatis cp
# cp (1)              - copy files and directories
```

The number in parentheses is the man page section

---

# `apropos` — Search by Keyword

The `apropos` command searches man page names and descriptions for a keyword

```bash
apropos partition
# Displays all man pages related to "partition"
```

Equivalent to `man -k`:

```bash
man -k partition
# Same result as apropos partition
```

Use `apropos` when you know what you want to do but cannot remember the command name

---
layout: section
---

# Getting Help: Info Pages and Documentation Files

---

# `info` — GNU Hyperlinked Documentation

The GNU Project provides *info pages* as an alternative to man pages

- Hyperlinked, tree-structured documents organized into **nodes**
- More navigable for large documents

```bash
info coreutils
```

---

# Navigating Info Pages

| Key | Action |
|-----|--------|
| `?` | Display help |
| PgUp / Backspace | Previous page |
| PgDn / Space | Next page |
| `n` | Next node |
| `p` | Previous node |
| `u` | Up to parent node |
| Enter | Follow hyperlink |
| `q` | Quit |

---

# README and Documentation Files

Many packages install additional documentation in `/usr/share/doc`

```bash
ls /usr/share/doc
```

- README files, changelogs, examples, configuration guides
- Some files are compressed with `gzip` (`.gz` extension)
- Use `zless` to read compressed files without decompressing:

```bash
zless /usr/share/doc/some-package/README.gz
```

---
layout: section
---

# Creating Commands with `alias`

---

# Multiple Commands on One Line

Use semicolons to separate commands on a single line

```bash
cd /usr; ls; cd -
# Changes to /usr, lists contents, returns to previous directory
```

---

# Checking if a Name Is Available

Always verify a name is not already taken before creating an alias

```bash
type test
# test is a shell builtin

type foo
# bash: type: foo: not found
```

If `type` reports "not found," the name is safe to use

---

# Creating an Alias

```bash
alias foo='cd /usr; ls; cd -'
```

Use it just like any other command:

```bash
foo
# Runs the full sequence
```

Examine it with `type`:

```bash
type foo
# foo is aliased to 'cd /usr; ls; cd -'
```

---

# Managing Aliases

Remove an alias:

```bash
unalias foo
```

View all defined aliases:

```bash
alias
```

Common use — adding default options to existing commands:

```bash
alias ls='ls --color=auto'
```

---

# Alias Persistence

- Aliases defined on the command line **vanish when the shell session ends**
- To make aliases permanent, add them to shell configuration files (covered in Chapter 11)
- Always use `type` to check for name conflicts before creating an alias

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/commands_lab
cd ~/commands_lab
touch sample.txt notes.txt data.csv
```

---

# Exercise 1: Identifying Command Types

Use `type` to classify several commands:

```bash
type cd
type ls
type mkdir
type bash
type alias
```

Then compare with `which`:

```bash
which ls
which cd
which bash
```

Notice that `which` cannot locate builtins like `cd`.

---

# Exercise 2: Getting Help

Use the appropriate help tool for each command type:

```bash
help cd
help -m cd
mkdir --help
```

View the difference between `help` (for builtins) and `--help` (for executables):

```bash
help cp
# Error — cp is not a builtin
```

---

# Exercise 3: Exploring Man Pages

Open and navigate a man page:

```bash
man ls
```

Practice: search for "sort" with `/sort`, then press `q` to quit.

Compare man page sections:

```bash
man passwd
man 5 passwd
```

---

# Exercise 4: Searching for Commands

Use `apropos` and `whatis` to discover and describe commands:

```bash
apropos directory
whatis rmdir
whatis mkdir
```

Verify that `apropos` and `man -k` are equivalent:

```bash
apropos compress
man -k compress
```

---

# Exercise 5: Creating and Using Aliases

Check for name availability, create aliases, and clean up:

```bash
type myfiles
alias myfiles='ls -lh ~/commands_lab'
myfiles
type myfiles
unalias myfiles
```

Create a multi-command alias:

```bash
alias sysinfo='echo "User: $USER"; echo "Shell: $SHELL"; echo "Date: $(date)"'
sysinfo
unalias sysinfo
```

---

# Lab Cleanup

```bash
rm -rf ~/commands_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

What is the output of each command? Explain your reasoning.

```bash
type echo
type man
which cd
which cp
```

Why does `which cd` behave differently from `which cp`?

---

# Challenge 2

A student wants to read about the `/etc/passwd` file format. They type `man passwd` and see the wrong page. What command should they use instead, and why?

---

# Challenge 3

Write an alias called `quickinfo` that displays the current user, current directory, and today's date on separate lines. Then show how to remove it.

```bash
alias quickinfo='echo "User: $USER"; echo "Dir: $(pwd)"; echo "Date: $(date)"'
quickinfo
unalias quickinfo
```

---

# Challenge 4

A student creates this alias but it does not work as expected:

```bash
alias backup=cd ~/Documents; tar -czf backup.tar.gz .
```

Identify the two problems and provide a corrected version.

---

# Assessment Questions

1. What are the four types of commands the shell recognizes?
2. What is the difference between `type` and `which`?
3. How do you access the man page for the `/etc/passwd` file format rather than the `passwd` command?
4. What is the difference between `help` and `--help`, and when would you use each?
5. Why do aliases created at the command line disappear when the terminal is closed?
6. How would you find a command related to "compression" if you did not know its name?

---

# Summary

Today we learned how to:

- Identify the four types of commands (executables, builtins, functions, aliases) using `type`
- Locate executable programs with `which`
- Access documentation using `help`, `--help`, `man`, `apropos`, `whatis`, and `info`
- Navigate man page sections to find the right documentation
- Create, use, and remove custom command aliases

Knowing how to identify commands and find their documentation is a foundational skill that makes every other Linux task easier to learn and troubleshoot.

---

# Additional Resources

- `man man` — learn how the manual page system itself works
- `man bash` — the comprehensive bash reference (see SHELL BUILTIN COMMANDS section)
- `info coreutils` — detailed GNU documentation for core command-line utilities
- `help help` — learn more about the builtin help system
- Explore `/usr/share/doc` for package-specific documentation and examples
