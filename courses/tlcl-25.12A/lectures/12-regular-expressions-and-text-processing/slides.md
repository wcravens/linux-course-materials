---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Regular Expressions: Text Processing on the Command Line'
info: |
  ## The Linux Command Line — Lecture 12
  Text Processing on the Command Line. Adapted from TLCL chapters 19 and 20.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Regular Expressions

Text Processing on the Command Line

The Linux Command Line

Lecture 12

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Read and write **regular expressions** — BRE vs. ERE, anchors, brackets, character classes, alternation, quantifiers
- Apply regex in `grep`, `find`, `locate`, `less`, `vim`, and `sed`
- Sort, dedupe, and slice text with `sort`, `uniq`, `cut`, `paste`, `join`, `tac`, `rev`
- Compare text with `comm`, `diff`, and `patch`
- Edit text non-interactively with `tr` and `sed` (`s`, backreferences, `y`, scripts, `-i`)
- Spellcheck plain-text and HTML files with `aspell`

---

# Module Outline

| Step | Chapter | Topic |
|---|---|---|
| 1 | **19** | The **language** of patterns — regular expressions |
| 2 | **20** | The **tools** that consume them — `grep`, `sort`, `cut`, `sed`, … |

Together: pattern notation → real text-processing pipelines.

---
layout: section
---

# What Is a Regular Expression? (Ch 19)

A **regular expression** is a symbolic notation for describing patterns in text.

---

# Why It Matters

- Every Unix-like system uses text everywhere: configs, logs, source code, mail headers, `/etc/passwd`
- Almost every text-processing tool (`grep`, `sed`, `awk`, `find`, `less`, `vim`, …) takes a regex as input
- Programming languages (Python, JavaScript, Perl, Ruby, …) all share the same core notation

We will limit ourselves to the **POSIX** flavors that the standard command-line tools speak.

---
layout: section
---

# `grep` — Print Lines Matching a Pattern

The workhorse of pattern searching. The name comes from `g/re/p` in `ed`.

---

# Common `grep` Options

| Option | Effect |
|---|---|
| `-i` | Ignore case |
| `-v` | Invert — print non-matching lines |
| `-c` | Count matches instead of printing them |
| `-l` | List filenames that contain matches |
| `-n` | Prefix lines with line numbers |
| `-h` | Suppress filenames in multi-file output |
| `-q` | Quiet — useful in scripts (check `$?`) |
| `-E` | Use *extended* regex (same as `egrep`) |

```bash
grep -h '^zip' dirlist*.txt
# zip
# zipcloak
# zipgrep
```

---
layout: section
---

# Metacharacters and Literals

Most characters match themselves. These are the regex *metacharacters*:

```text
^ $ . [ ] { } - ? * + ( ) | \
```

---

# Always Quote Patterns

Many regex metacharacters are *also* shell metacharacters.

```bash
# Wrong — the shell expands the {…}
grep ^([0-9]{3}) phonelist.txt

# Right
grep -E '^\([0-9]{3}\)' phonelist.txt
```

Use **single quotes** for regex literals on the command line.

---

# The Any Character `.`

A dot matches **any single character** at that position.

```bash
grep -h '.zip' dirlist*.txt
# bunzip2
# bzip2
# gunzip
# gzip
```

`.zip` requires a character *before* `z`, so plain `zip` is **not** matched.

---
layout: section
---

# Anchors: `^` and `$`

Anchors match a **position**, not a character.

---

# Start, End, and Exact Match

```bash
grep -h '^zip' dirlist*.txt    # starts with zip
grep -h 'zip$' dirlist*.txt    # ends with zip
grep -h '^zip$' dirlist*.txt   # exactly zip — nothing more
```

`^$` matches a **blank line**.

---
layout: section
---

# Bracket Expressions

Square brackets match exactly **one** character from the listed set.

---

# Sets, Negation, Ranges

```bash
# bzip OR gzip
grep -h '[bg]zip' dirlist*.txt

# zip preceded by anything except b or g
grep -h '[^bg]zip' dirlist*.txt

# any uppercase letter
grep -h '[A-Z]' dirlist*.txt

# literal '-', 'A', or 'Z'
grep -h '[-AZ]' dirlist*.txt
```

Inside `[…]`:

- `^` as the **first** character → negation
- `-` between two characters → range
- A literal `-` must come **first** in the set

---
layout: section
---

# POSIX Character Classes

Locale-aware, portable replacements for ranges.

---

# The Useful Ones

| Class | Matches |
|---|---|
| `[:alnum:]` | Letters and digits |
| `[:alpha:]` | Letters |
| `[:digit:]` | `0`–`9` |
| `[:upper:]` / `[:lower:]` | Upper / lower-case letters |
| `[:space:]` | Whitespace (space, tab, newline, …) |
| `[:blank:]` | Space and tab |
| `[:punct:]` | Punctuation |
| `[:xdigit:]` | Hexadecimal digit |

---

# Wrap a Class in a Set

Each class is itself a *bracket-expression element* — wrap it in another set:

```bash
ls /usr/sbin/[[:upper:]]*
grep -E '^[[:alnum:]_]+$' file
```

---
layout: section
---

# BRE vs. ERE

POSIX defines two regex dialects.

---

# Basic vs. Extended

| Feature | BRE | ERE |
|---|---|---|
| Default in… | `grep`, `sed` | `grep -E`, `egrep`, `awk` |
| `^ $ . [ ] *` | metacharacter | metacharacter |
| `( ) { } ? + \|` | **literal** unless backslashed | **metacharacter** unless backslashed |

```bash
grep    '\([0-9]\{3\}\)'  phonelist.txt   # BRE
grep -E  '([0-9]{3})'      phonelist.txt  # ERE
```

`grep -E` is identical to the historical `egrep` command.

---
layout: section
---

# Alternation `|`

Match any one of several alternatives (ERE only).

---

# Grouping with `()`

```bash
echo "AAA" | grep -E 'AAA|BBB'      # AAA
echo "BBB" | grep -E 'AAA|BBB'      # BBB
echo "CCC" | grep -E 'AAA|BBB'      # (no match)

grep -Eh '^(bz|gz|zip)' dirlist*.txt
```

Without the parentheses, `^bz|gz|zip` means "starts with `bz` *or* contains `gz` *or* contains `zip`."

---
layout: section
---

# Quantifiers

Specify how many times the previous element repeats.

---

# The Six Forms

| Quantifier | Meaning |
|---|---|
| `?` | Zero or one |
| `*` | Zero or more |
| `+` | One or more |
| `{n}` | Exactly *n* |
| `{n,m}` | Between *n* and *m* |
| `{n,}` | *n* or more |

```bash
echo "(555) 123-4567" | grep -E '^\(?[0-9]{3}\)? [0-9]{3}-[0-9]{4}$'
# (555) 123-4567
```

The `\(` and `\)` are *literal* parentheses; the `?` makes them optional.

---
layout: section
---

# Regex Beyond `grep`

The same notation drops into many tools — with small dialect differences.

---

# Same Idea, Different Tools

```bash
# find: regex must match the WHOLE pathname
find . -regex '.*[^-_./0-9a-zA-Z].*'

# locate: pick BRE or ERE explicitly
locate --regex 'bin/(bz|gz|zip)'

# less: forward search with /
/^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$

# vim: BRE — backslash the {…}
/([0-9]\{3\}) [0-9]\{3\}-[0-9]\{4\}
```

---
layout: section
---

# Why Text Processing? (Ch 20)

Unix text tools turn lines and files into a relational-style data pipeline.

---

# The Toolbox

```text
cat      sort     uniq
cut      paste    join
tac      rev
comm     diff     patch
tr       sed      aspell
```

Each tool does **one thing**. Pipelines combine them into solutions to real problems.

---
layout: section
---

# Revisiting `cat`

`cat` is more than concatenation — it has options for **inspection**.

---

# Show, Number, Squeeze

| Option | Effect |
|---|---|
| `-A` | Show non-printing characters: `^I` for tab, `$` at line end |
| `-n` | Number every line |
| `-s` | Collapse runs of blank lines |

```bash
cat -A foo.txt
# ^IThe quick brown fox jumps over the lazy dog.   $
```

The `^I` shows a tab; the `$` shows a stray trailing space.

---

# MS-DOS vs. Unix Lines

- Unix: each line ends with **LF** (`\n`)
- DOS/Windows: each line ends with **CR + LF** (`\r\n`)
- `cat -A` exposes the stray `^M`s; `tr -d '\r'` strips them; `dos2unix` does the same

---
layout: section
---

# `sort` — Order a Stream

`sort` reads lines, orders them, and writes them out.

---

# Common Options

| Option | Effect |
|---|---|
| `-n` | Numeric sort |
| `-r` | Reverse |
| `-f` | Case-insensitive |
| `-b` | Ignore leading blanks |
| `-u` | Suppress duplicates |
| `-k F[,F]` | Key — field or range |
| `-t C` | Field separator |

```bash
du -s /usr/share/* | sort -nr | head
sort -t ':' -k 7 /etc/passwd | head    # sort by login shell
```

---

# Multi-Key and Offset Sorts

```bash
# Alphabetic by name, numeric by version
sort --key=1,1 --key=2n distros.txt

# Year, month, day — offsets within field 3 of MM/DD/YYYY
sort -k 3.7nbr -k 3.1nbr -k 3.4nbr distros.txt
```

`3.7nbr` = field 3, offset 7, **n**umeric, **b** ignore-blanks, **r**everse.

---
layout: section
---

# `uniq` — Adjacent Duplicates Only

`uniq` removes (or counts) **adjacent** duplicate lines. Almost always paired with `sort`.

---

# Sort-then-uniq

```bash
sort foo.txt | uniq         # collapse to unique lines
sort foo.txt | uniq -c      # count of each unique line
sort foo.txt | uniq -d      # only duplicates
sort foo.txt | uniq -u      # only the truly unique lines
```

Without `sort`, duplicates that aren't adjacent **are not collapsed**.

---
layout: section
---

# `cut` — Extract Columns

Pull out a portion of every line.

---

# Characters or Fields

| Option | Effect |
|---|---|
| `-c LIST` | Extract by character position |
| `-f LIST` | Extract by field |
| `-d C` | Set the field delimiter |
| `--complement` | Extract everything *except* the selection |

```bash
cut -f 3 distros.txt                      # third tab-separated field
cut -f 3 distros.txt | cut -c 7-10        # year inside the date
cut -d ':' -f 1 /etc/passwd | head        # account names
```

For non-tab data, set `-d` or pre-process with `tr -s ' ' '\t'`.

---
layout: section
---

# `paste` and `join`

Two ways to combine columns from multiple files.

---

# `paste` — Side-by-Side

```bash
paste distros-dates.txt distros-versions.txt
# 11/25/2008    Fedora    10
# 10/30/2008    Ubuntu    8.10
```

Corresponding lines, separated by tabs (or any delimiter set with `-d`).

---

# `join` — Relational-Style Join

```bash
join distros-key-names.txt distros-key-vernums.txt | head
# 11/25/2008 Fedora 10
# 10/30/2008 Ubuntu 8.10
```

- Joins on the **first field** by default (configurable via `-1` and `-2`)
- Both files **must be sorted** on the key field
- The first field appears once in the output

---
layout: section
---

# `tac` and `rev`

Two small but useful "reverse" tools.

---

# Reverse Lines vs. Characters

```bash
# Reverse the order of lines
tail /var/log/backup.log | tac

# Reverse the characters within each line
echo "This is a test." | rev
# .tset a si sihT
```

A clever idiom uses `rev` to make `cut` operate from the **end** of each line:

```bash
tail /var/log/backup.log | rev | cut -c 2- | rev   # strip trailing period
```

---
layout: section
---

# Comparing Text — `comm`

Three columns: unique to file 1, unique to file 2, shared by both.

---

# Suppress Columns to Ask Different Questions

```bash
comm    file1.txt file2.txt    # all three columns
comm -12 file1.txt file2.txt   # only the lines common to both
comm -23 file1.txt file2.txt   # only lines unique to file1
comm -13 file1.txt file2.txt   # only lines unique to file2
```

Both files must already be **sorted**.

---
layout: section
---

# Comparing Text — `diff`

Reports differences in three formats.

---

# Default, Context, and Unified

```bash
diff       file1.txt file2.txt   # terse default
diff -c    file1.txt file2.txt   # context format (*** / ---)
diff -u    file1.txt file2.txt   # unified format (--- / +++)
```

The unified format is what `git`, `svn`, and code reviewers all use.

```text
@@ -1,4 +1,4 @@
-a
 b
 c
 d
+e
```

---
layout: section
---

# `patch` — Apply a `diff`

Turns a unified diff back into the actual edits.

---

# The Workflow

```bash
diff -Naur file1.txt file2.txt > patchfile.txt
patch < patchfile.txt
patch -R < patchfile.txt   # reverse the patch
```

Why `diff` + `patch`?

- The diff is **small** (only the changes, plus a little context)
- The diff is **reviewable** — you can read it before applying
- The same workflow scales from one file to a whole kernel source tree

---
layout: section
---

# `tr` — Translate, Delete, Squeeze

Character-level substitution on standard input.

---

# Three Modes

```bash
# Transliterate
echo "lowercase letters" | tr a-z A-Z
# LOWERCASE LETTERS

# Delete
tr -d '\r' < dos_file > unix_file

# Squeeze repeats
echo "aaabbbccc" | tr -s ab
# abccc
```

`tr` reads only **standard input** — not files as arguments.

---

# ROT13 — A Self-Inverse Cipher

```bash
echo "secret text" | tr 'a-zA-Z' 'n-za-mN-ZA-M'
# frperg grkg

echo "frperg grkg" | tr 'a-zA-Z' 'n-za-mN-ZA-M'
# secret text
```

Running ROT13 twice returns the original — the alphabet is shifted by 13, and 13 + 13 = 26.

---
layout: section
---

# `sed` — Stream Editor

A small editing language that runs over each line of a stream.

---

# General Form

```text
sed [options] 'address command' [file...]
sed -f script.sed [file...]
```

- No address → command runs on every line
- `-n` → suppress automatic printing
- `-i` → edit files **in place**

---

# Address Notation

| Address | Description |
|---|---|
| `n` | Line number *n* |
| `$` | Last line |
| `/regexp/` | Lines matching a BRE |
| `addr1,addr2` | Range, inclusive |
| `addr1,+n` | *addr1* and *n* lines after it |
| `addr!` | Negation — every line **except** addr |

```bash
sed -n '1,5p' distros.txt
sed -n '/SUSE/p' distros.txt
sed -n '/SUSE/!p' distros.txt
```

---

# The Most-Used Commands

| Command | Effect |
|---|---|
| `p` | Print (with `-n`, only matched lines) |
| `d` | Delete |
| `s/REGEX/REPL/[g]` | Substitute |
| `y/SET1/SET2/` | Transliterate (sets must be same length) |
| `i\` / `a\` | Insert before / append after |
| `q`, `Q` | Quit |
| `=` | Print line number |

---
layout: section
---

# `sed` Substitution and Backreferences

The `s` command is the workhorse — and the source of `sed`'s reputation.

---

# `g` Flag — Global Replace

```bash
echo "aaabbbccc" | sed 's/b/B/'      # aaaBbbccc
echo "aaabbbccc" | sed 's/b/B/g'     # aaaBBBccc
```

Without `g`, only the **first** match on each line is replaced.

---

# Backreferences

In BRE, `\(...\)` captures a subexpression; `\1`–`\9` reference it in the replacement.

```bash
sed 's/\([0-9]\{2\}\)\/\([0-9]\{2\}\)\/\([0-9]\{4\}\)$/\3-\1-\2/' distros.txt
```

Reformats `MM/DD/YYYY` to `YYYY-MM-DD`. Unsightly, but a single command.

---

# `sed` Script Files

```bash
cat > distros.sed <<'EOF'
1 i\
\
Linux Distributions Report\

s/\([0-9]\{2\}\)\/\([0-9]\{2\}\)\/\([0-9]\{4\}\)$/\3-\1-\2/
y/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/
EOF
sed -f distros.sed distros.txt
```

`-f` runs a multi-line script. `-i` edits files in place.

---
layout: section
---

# `aspell` — Interactive Spell Checker

Successor to `ispell`, with built-in modes for many text formats.

---

# Plain Text and HTML

```bash
aspell    check foo.txt    # plain text
aspell -H check foo.html   # HTML — ignores tag names
```

In an interactive session you pick from numbered suggestions or:

- `i` / `I` — Ignore once / always
- `r` / `R` — Replace once / all
- `a` / `l` — Add to personal dictionary

Without `--dont-backup`, `aspell` saves the original as `FILE.bak`.

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir -p ~/text_lab && cd ~/text_lab
ls /bin > dirlist-bin.txt
ls /usr/bin > dirlist-usr-bin.txt
for i in {1..10}; do
    echo "(${RANDOM:0:3}) ${RANDOM:0:3}-${RANDOM:0:4}" >> phonelist.txt
done
cat > distros.txt <<'EOF'
SUSE	10.2	12/07/2006
Fedora	10	11/25/2008
SUSE	11.0	06/19/2008
Ubuntu	8.04	04/24/2008
Fedora	8	11/08/2007
SUSE	10.3	10/04/2007
EOF
printf 'a\nb\nc\nd\n' > file1.txt
printf 'b\nc\nd\ne\n' > file2.txt
```

---

# Exercise 1: `grep` Anchors and Brackets

```bash
grep -h '^zip'   dirlist*.txt
grep -h 'zip$'   dirlist*.txt
grep -h '^zip$'  dirlist*.txt
grep -h '.zip'   dirlist*.txt
grep -h '[bg]zip'  dirlist*.txt
grep -h '[^bg]zip' dirlist*.txt
```

---

# Exercise 2: ERE — Alternation and Quantifiers

```bash
grep -Eh '^(bz|gz|zip)' dirlist*.txt
grep -Ev '^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$' phonelist.txt
echo "This works." | grep -E '^[[:upper:]][[:upper:][:lower:] ]*\.'
```

---

# Exercise 3: `sort`, `uniq`, and `cut`

```bash
sort distros.txt
sort --key=1,1 --key=2n distros.txt
sort -k 3.7nbr -k 3.1nbr -k 3.4nbr distros.txt
cut -f 3 distros.txt
cut -f 3 distros.txt | cut -c 7-10
cut -d ':' -f 1 /etc/passwd | head
sort foo.txt | uniq -c
```

---

# Exercise 4: `paste`, `join`, `tac`, `rev`

```bash
sort -k 3.7nbr -k 3.1nbr -k 3.4nbr distros.txt > distros-by-date.txt
cut -f 1,2 distros-by-date.txt > distros-versions.txt
cut -f 3   distros-by-date.txt > distros-dates.txt
paste distros-dates.txt distros-versions.txt
tac distros-by-date.txt | head -3
echo "This is a test." | rev
```

---

# Exercise 5: `comm`, `diff`, `patch`

```bash
comm     file1.txt file2.txt
comm -12 file1.txt file2.txt
diff -u  file1.txt file2.txt
diff -Naur file1.txt file2.txt > patchfile.txt
patch < patchfile.txt
patch -R < patchfile.txt
```

---

# Exercise 6: `tr` and `sed`

```bash
echo "lowercase letters" | tr a-z A-Z
echo "aaabbbccc" | tr -s ab
echo "Hello World" | tr 'a-zA-Z' 'n-za-mN-ZA-M'

sed -n '/SUSE/p' distros.txt
sed 's/\([0-9]\{2\}\)\/\([0-9]\{2\}\)\/\([0-9]\{4\}\)$/\3-\1-\2/' distros.txt
echo "aaabbbccc" | sed 's/b/B/g'
```

---

# Lab Cleanup

```bash
rm -rf ~/text_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1: Predict the Output

```bash
echo "abc"   | grep -E '^a.c$'
echo "abbbc" | grep -E '^ab+c$'
echo "ac"    | grep -E '^ab+c$'
echo "ac"    | grep -E '^ab*c$'
```

**Answer:**

```text
abc
abbbc
(no match)
ac
```

`+` requires *at least one*; `*` allows *zero or more*.

---

# Challenge 2: ZIP+4 Validator

Write a single `grep -E` that matches `12345-6789` and rejects `12345`, `12345-678`, and `abcde-1234`.

**Answer:**

```bash
grep -E '^[0-9]{5}-[0-9]{4}$'
```

The anchors `^…$` reject anything with extra characters; `{5}` and `{4}` enforce the exact lengths.

---

# Challenge 3: Top 10 Largest Files in `/usr/bin`

Use only the chapter's tools — no `find -size`.

**Answer:**

```bash
ls -l /usr/bin | sort -nrk 5 | head -10
```

`sort -n` interprets the size field as a number; `-r` reverses; `-k 5` selects the size column from `ls -l` output.

---

# Challenge 4: Most-Common Login Shell

Print the shell pathname and user count for the most popular login shell.

**Answer:**

```bash
cut -d ':' -f 7 /etc/passwd | sort | uniq -c | sort -nr | head -1
```

`cut` extracts the shell field; `sort` groups duplicates; `uniq -c` counts; `sort -nr` ranks by count; `head -1` takes the winner.

---

# Assessment Questions

1. What is the difference between **basic** and **extended** regex, and which `grep` invocation gives you each?
2. What does `^[[:upper:]][[:alnum:]]*$` match, and why prefer `[[:upper:]]` over `[A-Z]` in UTF-8?
3. Why must input be sorted before `uniq` collapses duplicates? What about `join`?
4. Compare the **default**, **context**, and **unified** `diff` formats. Which does `git` use?
5. In a `sed` substitution, what is the role of the `g` flag, and what is a backreference?
6. Why does running ROT13 twice return the original text?

---

# Summary

Today we learned how to:

- Read and write **regular expressions** and apply them in `grep`, `find`, `locate`, `less`, `vim`, `sed`
- Sort, dedupe, and slice text with `sort`, `uniq`, `cut`, `paste`, `join`, `tac`, `rev`
- Compare files with `comm`, `diff`, and `patch`
- Edit text non-interactively with `tr` and `sed` — addresses, `s` with backreferences, scripts, and `-i`
- Spellcheck plain-text and HTML files with `aspell`

These tools turn a one-off question ("how many users use bash?") into a single short pipeline.

---

# Additional Resources

- `man` pages: `grep`, `sed`, `tr`, `sort`, `uniq`, `cut`, `paste`, `join`, `comm`, `diff`, `patch`, `aspell`
- *The Linux Command Line* Chapters 19 and 20
- GNU Coreutils manual — `gnu.org/software/coreutils/manual/`
- GNU `sed` manual — `gnu.org/software/sed/manual/`
- `regex101.com` — interactive tester (set flavor to POSIX)
- ShellCheck (`shellcheck.net`) — catches quoting and escaping bugs
