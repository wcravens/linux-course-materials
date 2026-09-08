---
title: 'Expansion and Quoting'
subtitle: 'The Linux Command Line — Lecture 7'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Explain how the shell processes a command line before execution
- Use pathname expansion (globbing) to match files and directories
- Apply tilde, arithmetic, brace, and parameter expansion in commands
- Use command substitution to capture command output
- Control expansion behavior using double quotes, single quotes, and escape characters
- Distinguish when to use each quoting mechanism

## Key Commands Covered

- `echo` — Display a line of text (used to demonstrate expansions)
- `printenv` — Print environment variable values

## Chapter Outline

### 1. Expansion

Each time a command line is entered, bash performs several processes on the text before carrying out the command. The mechanism by which this happens is called *expansion*. With expansion, a sequence typed at the command line is transformed into something else before the shell acts upon it.

**Example:**

```bash
echo this is a test
# this is a test
```

```bash
echo *
# Displays filenames in the current directory, not a literal *
```

The shell expands the `*` into the names of files in the current working directory before the `echo` command is executed.

### 2. Pathname Expansion

The mechanism by which wildcards work is called *pathname expansion*. Wildcard characters are expanded into matching filenames.

```bash
echo D*
# Desktop Documents Downloads
```

```bash
echo *s
# Documents Downloads Pictures Videos
```

```bash
echo [[:upper:]]*
# Desktop Documents Downloads Music Pictures
```

```bash
echo /usr/*/share
# /usr/local/share
```

**Pathname Expansion of Hidden Files:**

Expansion does not reveal hidden files by default:

```bash
echo *
# Does not include files starting with a dot
```

```bash
echo .*
# Shows hidden files, but also includes . and ..
```

The correct pattern to match only hidden files (excluding `.` and `..`):

```bash
ls -d .[!.]?*
```

### 3. Tilde Expansion

The tilde character (`~`) expands to the home directory of the current user or, when followed by a username, to that user's home directory.

```bash
echo ~
# /home/me
```

```bash
echo ~bob
# /home/bob
```

If the user account `bob` does not exist, no expansion occurs and the literal text `~bob` is displayed.

### 4. Arithmetic Expansion

The shell supports integer arithmetic via expansion using the form `$((expression))`.

```bash
echo $((2 + 2))
# 4
```

Arithmetic expansion supports only integers (whole numbers), not floating-point (decimal) values.

**Supported operators:**

Table: The arithmetic operators supported inside `$((...))` and what each one does

| Operator | Description |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Integer division |
| `%` | Modulo (remainder) |
| `**` | Exponentiation |

```bash
echo $(((5**2) * 3))
# 75
```

Spaces are not required within the arithmetic expression, but parentheses may be used to group sub-expressions.

### 5. Brace Expansion

Brace expansion creates multiple text strings from a pattern containing braces. The preamble (text before the brace) and postscript (text after) are attached to each item inside the braces.

```bash
echo Front-{A,B,C}-Back
# Front-A-Back Front-B-Back Front-C-Back
```

Patterns may use a comma-separated list or a range:

```bash
echo Number_{1..5}
# Number_1 Number_2 Number_3 Number_4 Number_5
```

```bash
echo {Z..A}
# Z Y X W V U T S R Q P O N M L K J I H G F E D C B A
```

```bash
echo a{A{1,2},B{3,4}}b
# aA1b aA2b aB3b aB4b
```

**Practical use — creating sets of files or directories:**

```bash
mkdir {2024..2026}-{01..12}
# Creates directories: 2024-01, 2024-02, ... 2026-12
```

### 6. Parameter Expansion

Variables in the shell can be expanded using the `$` prefix. To see a list of available variables, use `printenv`.

```bash
echo $USER
# me
```

```bash
echo $HOME
# /home/me
```

```bash
echo $SHELL
# /bin/bash
```

If a parameter name is misspelled, the expansion will still occur but will result in an empty string:

```bash
echo $SUER
# (blank line)
```

### 7. Command Substitution

Command substitution allows the output of a command to be used as an expansion. Place the command inside `$()`:

```bash
echo $(ls)
# Displays output of ls as a single line
```

```bash
ls -l $(which cp)
# -rwxr-xr-x 1 root root 153976 ... /usr/bin/cp
```

An older syntax uses backticks, but `$()` is preferred:

```bash
ls -l `which cp`
# Equivalent to the $() form above
```

Command substitution can be nested when using the `$()` form, which is not possible with backticks.

### 8. Quoting

The shell provides mechanisms called *quoting* to selectively suppress unwanted expansions.

```bash
echo The total is $100.00
# The total is 00.00
```

The shell interpreted `$1` as a variable (which was empty), resulting in missing text. Quoting solves this problem.

### 9. Double Quotes

Placing text inside double quotes suppresses most special characters, but **three are still recognized**:

- `$` (dollar sign) — parameter expansion, arithmetic expansion, and command substitution still occur
- `` ` `` (backquote) — command substitution still occurs
- `\` (backslash) — escaping still works

```bash
echo "The total is $100.00"
# The total is 00.00   ($1 still expanded)
```

```bash
echo "$(cal)"
# Displays calendar output with formatting preserved
```

**Word splitting** — by default, the shell splits text on spaces, tabs, and newlines. Double quotes suppress this:

```bash
echo this is a    test
# this is a test   (extra spaces removed)
```

```bash
echo "this is a    test"
# this is a    test   (spaces preserved)
```

Unquoted command substitutions lose embedded newlines and extra whitespace. Double-quoted command substitutions preserve them:

```bash
echo $(cal)
# Calendar output on one line, formatting lost
```

```bash
echo "$(cal)"
# Calendar displayed with original formatting
```

### 10. Single Quotes

Single quotes suppress **all** expansions. Everything between single quotes is treated as literal text.

```bash
echo 'text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER'
# text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER
```

### 11. Escaping Characters

A backslash (`\`) preceding a character tells the shell to treat that character literally (the "escape character").

```bash
echo "The balance for user $USER is: \$5.00"
# The balance for user me is: $5.00
```

The backslash is commonly used inside double quotes to escape `$`, `\`, `` ` ``, `"`, and `!`.

**Backslash Escape Sequences:**

When used with `echo -e` or inside `$' '` quoting, certain backslash sequences have special meaning:

Table: The backslash escape sequences covered in this lecture and what each one produces

| Sequence | Meaning |
|----------|---------|
| `\a` | Bell (alert) |
| `\b` | Backspace |
| `\n` | Newline |
| `\r` | Carriage return |
| `\t` | Tab |

```bash
echo -e "Line 1\nLine 2"
# Line 1
# Line 2
```

```bash
echo -e "Column1\tColumn2"
# Column1    Column2
```

---

## Additional Resources

### Key Commands Summary

Table: The commands covered in this lecture and what each one does

| Command | Purpose |
|---------|---------|
| `echo` | Display text and demonstrate expansions |
| `printenv` | Display the value of environment variables |

### Expansion Types Summary

Table: The six kinds of shell expansion covered in this lecture, their syntax, and an example

| Expansion Type | Syntax | Example |
|----------------|--------|---------|
| Pathname | Wildcards (`*?[]`) | `echo *.txt` |
| Tilde | `~` | `echo ~` |
| Arithmetic | `$((expr))` | `echo $((2+2))` |
| Brace | `{a,b}` or `{1..5}` | `echo {A,B,C}` |
| Parameter | `$VAR` | `echo $HOME` |
| Command | `$(cmd)` | `echo $(date)` |

### Quoting Summary

Table: The quoting methods covered in this lecture, their syntax, what each suppresses, and what it still allows

| Method | Syntax | Suppresses | Allows |
|--------|--------|------------|--------|
| Double quotes | `"text"` | Word splitting, pathname expansion, brace expansion | `$`, `` ` ``, `\` |
| Single quotes | `'text'` | All expansions | Nothing |
| Escape | `\char` | Next character only | N/A |

### Tips for Success

1. Use `echo` to test expansion patterns before using them with commands that modify files.
2. When in doubt, quote your strings — double quotes are a safe default for most situations.
3. Use `$()` instead of backticks for command substitution — it is easier to read and supports nesting.
4. Remember that arithmetic expansion only works with integers.
5. Brace expansion is processed before other expansions — it does not work on the results of variable or command substitution.
6. Practice building complex commands incrementally — start simple and add one expansion type at a time.

### Common Pitfalls

- Forgetting that `$1` inside double quotes tries to expand as a positional parameter (use `\$` to get a literal dollar sign).
- Using `.*` with `rm` — this matches `.` and `..`, which can be catastrophic.
- Assuming arithmetic expansion handles decimals — it does not.
- Confusing brace expansion with pathname expansion — brace expansion generates strings regardless of whether matching files exist.
