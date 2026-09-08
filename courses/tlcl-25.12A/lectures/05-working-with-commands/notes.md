---
title: 'Working with Commands'
subtitle: 'The Linux Command Line — Lecture 5'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Explain the four types of commands recognized by the shell
- Use `type`, `which`, `help`, `man`, `apropos`, `whatis`, and `info` to identify and document commands
- Navigate and interpret man pages and info documents
- Apply `alias` to create custom command shortcuts
- Distinguish between shell builtins, executable programs, shell functions, and aliases

## Key Commands Covered

- `type` — Display the type (builtin, alias, executable, function) of a command
- `which` — Display the location of an executable program
- `help` — Display help for shell builtin commands
- `man` — Display a program's manual page
- `apropos` — Search the man page descriptions by keyword
- `whatis` — Display a one-line description of a command
- `info` — Display a program's GNU info entry
- `alias` — Create a shortcut name for a command or command sequence
- `unalias` — Remove an alias definition

## Chapter Outline

### 1. What Exactly Are Commands?

A command entered at the shell prompt can be one of four different things. Understanding which kind a particular command is helps determine where to find its documentation and how to troubleshoot it.

The four types of commands:

Table: The four types of commands, what each one is, and an example of each

| Type | Description | Example |
|------|-------------|---------|
| **Executable program** | Compiled binaries or scripts stored in directories like `/usr/bin` | `cp`, `python3` |
| **Shell builtin** | A command built directly into the shell itself | `cd`, `type` |
| **Shell function** | A miniature shell script incorporated into the environment | User-defined functions |
| **Alias** | A user-defined command built from other commands | `alias ll='ls -l'` |

Executable programs include compiled binaries (written in C, C++, etc.) and programs written in scripting languages such as shell scripts, Perl, Python, and Ruby.

### 2. Identifying Commands with `type`

The `type` command is a shell builtin that reports which of the four types a given command name belongs to.

```bash
type type
# type is a shell builtin

type ls
# ls is aliased to 'ls --color=auto'

type cp
# cp is /usr/bin/cp
```

The `type` command accepts any command name as an argument and displays how the shell will interpret it.

### 3. Locating Executables with `which`

The `which` command displays the full path of an executable program. It only works for executable programs, not for builtins, functions, or aliases.

```bash
which ls
# /usr/bin/ls

which cd
# (no result or error — cd is a builtin, not an executable)
```

Some distributions provide a `which` that will also report aliases, but the standard behavior is to locate only executables.

### 4. Getting Help for Shell Builtins with `help`

The `help` command is a shell builtin that provides documentation for other builtins. It is the primary way to get help for commands that are built into the shell (such as `cd`), since these commands do not have their own man pages in section 1.

```bash
help cd
# cd: cd [-L|[-P [-e]]] [dir]
#     Change the shell working directory. ...
```

**Notation conventions in help output:**

- Square brackets (`[]`) indicate optional items
- A vertical bar (`|`) indicates mutually exclusive items
- Items without brackets are required

The `-m` option displays help in a format similar to a man page:

```bash
help -m cd
```

### 5. Getting Help with `--help`

Many executable programs support a `--help` option that displays a brief usage summary. This is not available on all programs, but it is a common convention.

```bash
mkdir --help
# Usage: mkdir [OPTION]... DIRECTORY...
# Create the DIRECTORY(ies), if they do not already exist. ...
```

Some programs use `-h` instead of or in addition to `--help`. Not every program supports this option; some will display an error or interpret it differently.

### 6. Reading Manual Pages with `man`

The `man` command displays the formal documentation (manual page) for a given program. Man pages are displayed using `less` as the pager, so the same navigation keys apply (spacebar to scroll, `q` to quit).

```bash
man ls
# Displays the manual page for ls
```

**Man page sections:**

Man pages are organized into numbered sections. When a command exists in multiple sections, the section number can be specified explicitly.

Table: The numbered man page sections and what kind of content each one holds

| Section | Contents |
|---------|----------|
| 1 | User commands |
| 2 | Programming interfaces for kernel system calls |
| 3 | Programming interfaces to the C library |
| 4 | Special files such as device nodes and drivers |
| 5 | File formats |
| 6 | Games and amusements |
| 7 | Miscellaneous |
| 8 | System administration commands |

To specify a section:

```bash
man 5 passwd
# Displays the man page for the passwd file format (section 5),
# not the passwd command (section 1)
```

### 7. Searching for Man Pages with `apropos`

The `apropos` command searches the names and descriptions of all man pages for a given keyword. It is equivalent to `man -k`.

```bash
apropos partition
# Displays a list of man pages related to "partition"
```

```bash
man -k partition
# Same result as apropos partition
```

This is useful when you know what you want to do but do not know the name of the command.

### 8. One-Line Descriptions with `whatis`

The `whatis` command displays a brief one-line description of a command, drawn from its man page.

```bash
whatis ls
# ls (1)              - list directory contents
```

```bash
whatis cp
# cp (1)              - copy files and directories
```

The output includes the man page section number in parentheses.

### 9. GNU Info Pages with `info`

The GNU Project provides an alternative to man pages called *info pages*. Info documents are hyperlinked and organized into a tree structure of *nodes*, making them more navigable for large documents.

```bash
info coreutils
# Displays the info document for GNU coreutils
```

**Key navigation commands within `info`:**

Table: The `info` navigation keys covered in this lecture and what each one does

| Key | Action |
|-----|--------|
| `?` | Display help |
| PgUp / Backspace | Previous page |
| PgDn / Space | Next page |
| `n` | Next node |
| `p` | Previous node |
| `u` | Up to parent node |
| Enter | Follow a hyperlink |
| `q` | Quit |

Info pages are most commonly found for GNU utilities. Many programs include info entries through the `coreutils` info document.

### 10. README and Other Documentation Files

Many packages install additional documentation files into `/usr/share/doc`. These may include README files, changelogs, usage examples, and configuration guides.

```bash
ls /usr/share/doc
# Lists documentation directories for installed packages
```

Some documentation files are compressed with `gzip` and have a `.gz` extension. These can be read without manually decompressing them using `zless`:

```bash
zless /usr/share/doc/some-package/README.gz
```

### 11. Creating Commands with `alias`

The `alias` command allows users to define custom command names that expand to other commands or sequences of commands. Multiple commands can be placed on a single line by separating them with semicolons.

**Placing multiple commands on one line:**

```bash
cd /usr; ls; cd -
# Changes to /usr, lists contents, then returns to the previous directory
```

**Checking whether a name is already in use:**

```bash
type test
# test is a shell builtin

type foo
# bash: type: foo: not found
```

Always use `type` to verify that the name you want to use for an alias is not already taken by another command.

**Creating an alias:**

```bash
alias foo='cd /usr; ls; cd -'
```

**Using the alias:**

```bash
foo
# Runs the full sequence: cd /usr; ls; cd -
```

**Examining an alias with `type`:**

```bash
type foo
# foo is aliased to 'cd /usr; ls; cd -'
```

**Removing an alias:**

```bash
unalias foo
```

**Common use — adding default options to existing commands:**

```bash
alias ls='ls --color=auto'
```

**Viewing all defined aliases:**

```bash
alias
# Displays all currently defined aliases
```

**Important:** Aliases defined on the command line vanish when the shell session ends. Making aliases permanent requires adding them to shell configuration files (covered in TLCL chapter 11).

---

## Additional Resources

### Key Commands Summary

Table: The commands covered in this lecture and what each one does

| Command | Purpose |
|---------|---------|
| `type` | Display the type of a command (builtin, alias, executable, function) |
| `which` | Display the location of an executable program |
| `help` | Display help for shell builtins |
| `man` | Display a program's manual page |
| `apropos` | Search man page descriptions by keyword |
| `whatis` | Display a one-line manual page description |
| `info` | Display a program's GNU info entry |
| `alias` | Define a custom command shortcut |
| `unalias` | Remove an alias definition |

### Command Documentation Summary

Table: The documentation sources covered in this lecture, what each is best for, and its syntax

| Documentation Source | Best For | Syntax |
|---------------------|----------|--------|
| `type` | Determining what kind of command it is | `type command` |
| `help` | Shell builtins only | `help builtin` |
| `--help` | Quick usage summary for executables | `command --help` |
| `man` | Full reference for executables and file formats | `man command` |
| `man N` | Specific man page section | `man 5 passwd` |
| `apropos` | Finding commands when you know the topic | `apropos keyword` |
| `whatis` | Quick one-line description | `whatis command` |
| `info` | Detailed GNU documentation with hyperlinks | `info command` |
| `/usr/share/doc` | Package-specific documentation files | `ls /usr/share/doc` |

### Man Page Sections Summary

Table: The numbered man page sections, what each holds, and a sample command to view one

| Section | Contents | Example |
|---------|----------|---------|
| 1 | User commands | `man 1 ls` |
| 2 | Kernel system calls | `man 2 open` |
| 3 | C library functions | `man 3 printf` |
| 4 | Special files and drivers | `man 4 null` |
| 5 | File formats | `man 5 passwd` |
| 6 | Games | `man 6 fortune` |
| 7 | Miscellaneous | `man 7 ascii` |
| 8 | System administration | `man 8 mount` |

### Tips for Success

1. Always use `type` first to determine what kind of command you are dealing with — this tells you where to look for documentation.
2. Use `help` for builtins and `man` for executables — using the wrong one will not give useful results.
3. Use `apropos` when you know what you want to do but cannot remember the command name.
4. Remember that `which` only works for executable programs — it will not find builtins, functions, or aliases.
5. Create aliases for commands you type frequently, but remember they are lost when the session ends unless saved to a configuration file.
6. Read the notation conventions in `help` output — square brackets mean optional, vertical bar means choose one.

### Common Pitfalls

- Using `which` to find a shell builtin like `cd` — `which` cannot locate builtins and will either produce an error or no output.
- Using `help` on an executable program — `help` only documents shell builtins, not external programs.
- Forgetting to quote alias definitions that contain spaces or special characters — always wrap the alias value in single quotes.
- Creating an alias with the same name as an important command (like `rm` or `ls`) without understanding the consequences — use `type` to check first.
- Expecting aliases to persist after closing the terminal — aliases are session-only unless added to `~/.bashrc` or a similar configuration file.
