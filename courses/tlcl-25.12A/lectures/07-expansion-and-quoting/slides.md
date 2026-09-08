---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Expansion and Quoting: How the Shell Rewrites Your Command Line'
info: |
  ## The Linux Command Line — Lecture 7
  How the Shell Rewrites Your Command Line. Adapted from TLCL chapter 7.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Expansion and Quoting

How the Shell Rewrites Your Command Line

The Linux Command Line

Lecture 7

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain how the shell processes a command line before execution
- Use pathname expansion (globbing) to match files and directories
- Apply tilde, arithmetic, brace, and parameter expansion in commands
- Use command substitution to capture command output
- Control expansion behavior using double quotes, single quotes, and escape characters
- Distinguish when to use each quoting mechanism

---
layout: section
---

# Expansion

The shell transforms command text before executing it — this process is called *expansion*

---

# Expansion in Action

The shell processes the command line *before* the command runs:

```bash
echo this is a test
# this is a test
```

```bash
echo *
# Desktop Documents Downloads Music Pictures
```

The shell expanded `*` into filenames — `echo` never saw the `*` character

---

# Types of Expansion

| Expansion Type | Syntax | Example |
|----------------|--------|---------|
| Pathname | Wildcards (`*?[]`) | `echo *.txt` |
| Tilde | `~` | `echo ~` |
| Arithmetic | `$((expr))` | `echo $((2+2))` |
| Brace | `{a,b}` or `{1..5}` | `echo {A,B,C}` |
| Parameter | `$VAR` | `echo $HOME` |
| Command | `$(cmd)` | `echo $(date)` |

---
layout: section
---

# Pathname Expansion

The mechanism by which wildcards work — wildcard characters are expanded into matching filenames

---

# Wildcard Patterns

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

---

# Pathname Expansion of Hidden Files

Expansion does **not** reveal hidden files by default:

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

---
layout: section
---

# Tilde Expansion

The `~` character expands to the home directory of the current user

---

# Tilde Expansion Examples

```bash
echo ~
# /home/me
```

```bash
echo ~bob
# /home/bob
```

- `~` alone expands to the current user's home directory
- `~username` expands to that user's home directory
- If the user account does not exist, no expansion occurs and the literal text is displayed

---
layout: section
---

# Arithmetic Expansion

The shell supports integer arithmetic using the form `$((expression))`

---

# Arithmetic Operators

| Operator | Description |
|----------|-------------|
| `+` | Addition |
| `-` | Subtraction |
| `*` | Multiplication |
| `/` | Integer division |
| `%` | Modulo (remainder) |
| `**` | Exponentiation |

---

# Arithmetic Examples

```bash
echo $((2 + 2))
# 4
```

```bash
echo $(((5**2) * 3))
# 75
```

```bash
echo $((7 / 2))
# 3   (integer only — no decimals)
```

- Only integers (whole numbers) are supported
- Parentheses may be used to group sub-expressions

---
layout: section
---

# Brace Expansion

Creates multiple text strings from a pattern containing braces

---

# Comma-Separated Lists

A **preamble** (text before the brace) and **postscript** (text after) are attached to each item:

```bash
echo Front-{A,B,C}-Back
# Front-A-Back Front-B-Back Front-C-Back
```

```bash
echo file_{alpha,beta,gamma}.txt
# file_alpha.txt file_beta.txt file_gamma.txt
```

---

# Ranges

```bash
echo Number_{1..5}
# Number_1 Number_2 Number_3 Number_4 Number_5
```

```bash
echo {Z..A}
# Z Y X W V U T S R Q P O N M L K J I H G F E D C B A
```

```bash
echo {01..12}
# 01 02 03 04 05 06 07 08 09 10 11 12
```

---

# Nested Brace Expansion

Brace expansions can be nested:

```bash
echo a{A{1,2},B{3,4}}b
# aA1b aA2b aB3b aB4b
```

---

# Practical Use

Create directory structures efficiently:

```bash
mkdir {2024..2026}-{01..12}
# Creates directories: 2024-01, 2024-02, ... 2026-12
```

```bash
mkdir -p project/{src,doc,test}/{v1,v2}
# Creates 6 subdirectories in one command
```

---
layout: section
---

# Parameter Expansion

Variables in the shell can be expanded using the `$` prefix

---

# Common Environment Variables

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

Use `printenv` to see a list of available variables

---

# Misspelled Variables

If a parameter name is misspelled, the expansion still occurs but results in an empty string:

```bash
echo $SUER
# (blank line)
```

- No error message is produced
- This is a common source of subtle bugs

---
layout: section
---

# Command Substitution

Allows the output of a command to be used as an expansion

---

# Using `$()`

```bash
echo $(ls)
# Displays output of ls as a single line
```

```bash
ls -l $(which cp)
# -rwxr-xr-x 1 root root 153976 ... /usr/bin/cp
```

```bash
current_dir=$(pwd)
echo "I am in $current_dir"
```

---

# Backtick Syntax

An older syntax uses backticks, but `$()` is preferred:

```bash
ls -l `which cp`
# Equivalent to the $() form above
```

- `$()` is easier to read
- `$()` supports nesting; backticks do not
- Always prefer `$()` in new scripts

---
layout: section
---

# Quoting

The shell provides *quoting* mechanisms to selectively suppress unwanted expansions

---

# The Problem

```bash
echo The total is $100.00
# The total is 00.00
```

The shell interpreted `$1` as a variable (which was empty), resulting in missing text

```bash
echo this is a    test
# this is a test   (extra spaces removed)
```

The shell performs *word splitting* on unquoted text

---
layout: section
---

# Double Quotes

Suppress most special characters, but three are still recognized

---

# What Double Quotes Allow

- `$` — parameter expansion, arithmetic expansion, and command substitution
- `` ` `` — command substitution (backtick form)
- `\` — escaping

---

# Double Quote Examples

```bash
echo "The     spaces    are    preserved"
# The     spaces    are    preserved
```

```bash
echo "Your username is $USER"
# Your username is me
```

```bash
echo "Today is $(date)"
# Today is Mon Mar 10 ...
```

---

# Preserving Formatting

Unquoted command substitution loses newlines and extra whitespace:

```bash
echo $(cal)
# Calendar output on one line, formatting lost
```

Double-quoted command substitution preserves formatting:

```bash
echo "$(cal)"
# Calendar displayed with original formatting
```

---
layout: section
---

# Single Quotes

Suppress **all** expansions — everything is treated as literal text

---

# Single Quote Example

```bash
echo 'text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER'
# text ~/*.txt {a,b} $(echo foo) $((2+2)) $USER
```

- No expansion of any kind occurs
- Use when you need exact literal text

---
layout: section
---

# Escaping Characters

A backslash (`\`) tells the shell to treat the next character literally

---

# Escape Examples

```bash
echo "The balance for user $USER is: \$5.00"
# The balance for user me is: $5.00
```

```bash
echo "A backslash: \\"
# A backslash: \
```

Commonly escaped inside double quotes: `$`, `\`, `` ` ``, `"`, and `!`

---

# Backslash Escape Sequences

When used with `echo -e` or `$' '` quoting:

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

---

# Quoting Comparison

| Method | Syntax | Suppresses | Allows |
|--------|--------|------------|--------|
| Double quotes | `"text"` | Word splitting, pathname expansion, brace expansion | `$`, `` ` ``, `\` |
| Single quotes | `'text'` | All expansions | Nothing |
| Escape | `\char` | Next character only | N/A |

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/chapter_lab
cd ~/chapter_lab
mkdir -p dir1 dir2 dir3
touch file1.txt file2.txt file3.txt .hidden_file
mkdir .hidden_dir
touch dir1/notes.txt dir2/data.csv dir3/report.txt
```

---

# Exercise 1: Observing Expansion

Use `echo` to see how the shell expands wildcards:

```bash
cd ~/chapter_lab
echo *
echo file*
echo *.txt
echo dir?
echo *.xyz
```

Note: when a pattern matches nothing, the literal pattern is displayed

---

# Exercise 2: Hidden Files

```bash
echo *
echo .*
ls -d .[!.]?*
ls -d * .[!.]?*
```

The pattern `.[!.]?*` matches hidden files while excluding `.` and `..`

---

# Exercise 3: Tilde, Parameter, and Arithmetic Expansion

```bash
echo ~
echo ~root
echo $USER
echo $HOME
echo $SHELL
echo $((100 + 50))
echo $((2 ** 10))
echo $((7 / 2))
```

---

# Exercise 4: Brace Expansion

Generate text patterns and create directory structures:

```bash
echo {A,B,C}-file
echo {1..10}
echo {a..z}
echo {01..12}
mkdir -p project/{src,doc,test}/{v1,v2}
ls -R project/
```

---

# Exercise 5: Command Substitution and Quoting

```bash
echo "Today is $(date)"
ls -l $(which bash)
echo "The total is $100.00"
echo 'The total is $100.00'
echo "The cost is \$5.00"
echo "The     spaces    are    preserved"
```

Compare how double quotes, single quotes, and escaping affect output

---

# Exercise 6: Combining Techniques

Create a dated backup directory using multiple expansion types:

```bash
mkdir "backup_$(date +%Y-%m-%d)"
ls -d backup*
echo "Report for $USER on $(date +%A), $(date +%B) $(date +%d)"
mkdir -p "logs/$(date +%Y)"/{jan,feb,mar,apr,may,jun}
ls -R logs/
```

---

# Lab Cleanup

```bash
rm -rf ~/chapter_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

What will the following commands display? Predict the output before running them.

```bash
echo ~
echo "~"
echo '~'
```

**Answer:** `~` expands to the home directory only when unquoted. Double quotes and single quotes both suppress tilde expansion.

---

# Challenge 2

Write a single `mkdir` command using brace expansion to create this structure:

```
project/
  hw1/draft/  hw1/final/
  hw2/draft/  hw2/final/
  hw3/draft/  hw3/final/
```

**Answer:**

```bash
mkdir -p project/hw{1..3}/{draft,final}
```

---

# Challenge 3

A student types this and gets unexpected output:

```bash
echo "There are $(ls | wc -l) files costing $$50 each"
```

What is the problem, and how do you fix it?

**Answer:** `$$` expands to the shell's process ID. Fix with:

```bash
echo "There are $(ls | wc -l) files costing \$50 each"
```

---

# Assessment Questions

1. What is *expansion* and when does it occur relative to command execution?
2. How do you match hidden files with pathname expansion while excluding `.` and `..`?
3. What three special characters are still recognized inside double quotes?
4. What is the difference between `$()` and backtick syntax for command substitution?
5. Why does `echo $((10 / 3))` produce `3` instead of `3.33`?
6. How does brace expansion differ from pathname expansion?

---

# Summary

Today we learned how to:

- Recognize that the shell expands command text before execution
- Use pathname expansion to match files with wildcards
- Apply tilde, arithmetic, brace, and parameter expansion
- Capture command output with command substitution
- Control expansion with double quotes, single quotes, and escape characters
- Choose the right quoting mechanism for each situation

Understanding expansion and quoting is essential for writing correct shell commands and scripts.

---

# Additional Resources

- `man bash` — see the EXPANSION section for the full specification
- `man echo` — options for displaying text and escape sequences
- `man printenv` — listing environment variables
- *The Linux Command Line* Chapter 7: "Seeing the World as the Shell Sees It"
- Practice by using `echo` to test expansion patterns before applying them in real commands
