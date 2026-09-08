---
title: 'Regular Expressions'
subtitle: 'The Linux Command Line — Lecture 12'
---

## Learning Objectives

After completing these chapters, you will be able to:

- Explain what a *regular expression* is, distinguish *literal* characters from *metacharacters*, and identify the difference between **basic** (BRE) and **extended** (ERE) regular expressions
- Use anchors (`^`, `$`), the any-character `.`, bracket expressions, character ranges, POSIX character classes, alternation `|`, and the quantifiers `?`, `*`, `+`, and `{n,m}` with `grep -E` to find text in files
- Apply regular expressions in `find`, `locate`, `less`, and `vim` and explain how each tool's regex flavor differs from `grep`
- Use `cat`, `sort`, and `uniq` to inspect, sort, merge, and deduplicate text streams, including multi-key and offset-based sorts and field separators set with `-t`
- Slice and recombine text with `cut`, `paste`, `join`, `tac`, and `rev`, and select fields and characters by position
- Compare files with `comm`, `diff` (default, context, and unified formats), and `patch`, and describe when each is appropriate
- Edit text non-interactively with `tr` (transliteration, deletion, squeeze) and `sed` (addresses, the `s` command with backreferences, the `y` command, and script files), and use `aspell` to spellcheck different file types

## Key Commands Covered

- `grep` / `egrep` / `grep -E` — Print lines matching a pattern
- `cat -A`, `cat -n`, `cat -s` — Show non-printing characters; number lines; squeeze blank lines
- `sort` — Sort text by line, field, or character offset within a field; multi-key sorts with `-k`
- `uniq` — Remove (or count) adjacent duplicate lines from sorted input
- `cut` — Extract characters or fields from each line
- `paste` — Merge corresponding lines from multiple files into columns
- `join` — Join two sorted files on a shared key field (relational-style join)
- `tac` — Concatenate files in reverse line order
- `rev` — Reverse the characters within each line
- `comm` — Show lines unique to file 1, unique to file 2, and common to both
- `diff` — Report differences between files in default, context (`-c`), or unified (`-u`) format
- `patch` — Apply a `diff` file to update an old file to a new version
- `tr` — Transliterate, delete, or squeeze characters from standard input
- `sed` — Stream editor for filtering and transforming text; supports addresses, `s`, `p`, `d`, `i`, `a`, `q`, `=`, and `y`
- `expand` / `unexpand` — Convert tabs to spaces and back
- `aspell` — Interactive spell checker (with HTML mode `-H`)

---

## Chapter Outline

### 1. What Are Regular Expressions? (Ch 19)

A **regular expression** is a symbolic notation for describing patterns in text. Regular expressions resemble shell wildcards but operate on a much grander scale, and they are supported by most command-line tools that work with text and by most programming languages. Regex flavors vary slightly from tool to tool; this chapter limits itself to the **POSIX** standard, which covers `grep`, `sed`, `find`, `less`, and most other Unix tools.

### 2. `grep` — The Workhorse (Ch 19)

`grep` searches text for lines matching a pattern. The name comes from `g/re/p` — *globally search for a regular expression and print*.

```bash
grep [options] regex [file...]
```

Table: The `grep` options covered in this lecture, their long forms, and what each one does

| Option | Long Option | Description |
|---|---|---|
| `-i` | `--ignore-case` | Match case-insensitively |
| `-v` | `--invert-match` | Print lines that **do not** match |
| `-c` | `--count` | Print the count of matches, not the lines |
| `-l` | `--files-with-matches` | Print only the names of files that contain matches |
| `-L` | `--files-without-match` | Print only the names of files that do **not** contain matches |
| `-n` | `--line-number` | Prefix each line with its line number |
| `-h` | `--no-filename` | Suppress filenames in multi-file searches |
| `-q` | `--quiet` | Print nothing — useful in scripts where only the exit status matters |
| `-E` |  | Use *extended* regular expressions (same as `egrep`) |

```bash
grep -h '^zip' dirlist*.txt
# zip
# zipcloak
# zipgrep
```

### 3. Metacharacters and Literals (Ch 19)

Most characters in a regex match themselves — those are **literals**. The following are **metacharacters** with special meaning:

```text
^ $ . [ ] { } - ? * + ( ) | \
```

> **Quote your patterns.** Many regex metacharacters are also shell metacharacters. Always wrap a regex in single quotes on the command line to keep the shell from expanding it: `grep -E '^([0-9]{3})' file`.

### 4. The Any Character `.` (Ch 19)

The dot matches **any single character** at that position.

```bash
grep -h '.zip' dirlist*.txt
# bunzip2
# bzip2
# gunzip
# gzip
```

The plain string `zip` is *not* matched, because `.zip` requires a character before the `z`.

### 5. Anchors `^` and `$` (Ch 19)

Anchors match a position rather than a character. `^` anchors to the start of a line; `$` anchors to the end.

```bash
grep -h '^zip' dirlist*.txt    # starts with zip
grep -h 'zip$' dirlist*.txt    # ends with zip
grep -h '^zip$' dirlist*.txt   # exactly zip
```

`^$` matches a blank line.

### 6. Bracket Expressions and Character Classes (Ch 19)

Square brackets match exactly **one** character from the listed set:

```bash
grep -h '[bg]zip' dirlist*.txt        # matches bzip or gzip
```

Inside a bracket expression, two characters have special meaning:

- `^` as the **first** character negates the set (`[^bg]zip` matches anything ending in `zip` *except* `bzip` or `gzip`).
- `-` between two characters defines a range (`[A-Z]`, `[0-9]`).

To include a literal `-`, place it first: `[-AZ]` matches `-`, `A`, or `Z`.

#### POSIX Character Classes

Traditional ranges depend on the locale's collation order. POSIX classes are locale-aware and portable:

Table: The POSIX character classes covered in this lecture and what each one matches

| Class | Matches |
|---|---|
| `[:alnum:]` | Alphanumeric characters |
| `[:alpha:]` | Alphabetic characters |
| `[:digit:]` | The digits 0–9 |
| `[:upper:]` / `[:lower:]` | Uppercase / lowercase letters |
| `[:space:]` | Whitespace (space, tab, newline, …) |
| `[:blank:]` | Space and tab |
| `[:punct:]` | Punctuation |
| `[:print:]` / `[:graph:]` | Printable / visible characters |
| `[:cntrl:]` | Control codes |
| `[:xdigit:]` | Hexadecimal digit |

A POSIX class is itself a bracket-expression element, so it must appear *inside* an outer set:

```bash
ls /usr/sbin/[[:upper:]]*       # filenames starting with an uppercase letter
```

### 7. POSIX BRE vs. ERE (Ch 19)

POSIX defines two regex dialects.

- **Basic Regular Expressions (BRE)** — recognized metacharacters: `^ $ . [ ] *`. Other "advanced" metacharacters (`( ) { } ? + |`) must be **escaped** with a backslash to take on their regex meaning.
- **Extended Regular Expressions (ERE)** — `( ) { } ? + |` are metacharacters by default; preceding any metacharacter with a backslash makes it a literal.

`grep` is BRE by default. Use `grep -E` (or `egrep`) for ERE. `sed` uses BRE by default; some tools accept `-E` or `-r` to switch to ERE.

### 8. Alternation (Ch 19)

The `|` metacharacter matches any one of several alternatives:

```bash
echo "AAA" | grep -E 'AAA|BBB'      # AAA
echo "BBB" | grep -E 'AAA|BBB'      # BBB
echo "CCC" | grep -E 'AAA|BBB'      # (no output)
```

Use parentheses to scope alternation:

```bash
grep -Eh '^(bz|gz|zip)' dirlist*.txt    # filenames starting with bz, gz, or zip
```

Without the parentheses, `^bz|gz|zip` means "starts with `bz` *or* contains `gz` *or* contains `zip`."

### 9. Quantifiers (Ch 19)

Table: The regex quantifiers covered in this lecture and how many repetitions each one allows

| Quantifier | Meaning |
|---|---|
| `?` | Zero or one of the preceding element |
| `*` | Zero or more of the preceding element |
| `+` | One or more of the preceding element |
| `{n}` | Exactly *n* occurrences |
| `{n,m}` | Between *n* and *m* occurrences (inclusive) |
| `{n,}` | *n* or more occurrences |
| `{,m}` | At most *m* occurrences |

A US phone-number validator using `?` and `{n}`:

```bash
echo "(555) 123-4567" | grep -E '^\(?[0-9]{3}\)? [0-9]{3}-[0-9]{4}$'
# (555) 123-4567
```

### 10. Putting Regular Expressions to Work (Ch 19)

The same regex notation drops into many tools, with small dialect differences:

- **`grep -Ev '^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$' phonelist.txt`** — print lines that *do not* match the validator (a quick way to find malformed phone numbers).
- **`find . -regex '.*[^-_./0-9a-zA-Z].*'`** — find pathnames containing any character outside a "safe" set. `find` requires the regex to match the **entire pathname**, so `.*` is needed at both ends.
- **`locate --regex 'bin/(bz|gz|zip)'`** — search the locate database with extended regex.
- **`/^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$`** in `less` — interactive search highlighting.
- **`/([0-9]\{3\}) [0-9]\{3\}-[0-9]\{4\}`** in `vim` — same idea, but in BRE, so `{` `}` must be backslashed.

### 11. Why Text Processing Matters (Ch 20)

Unix-like systems store and exchange enormous amounts of text — documents, web pages, email, printer output, source code, configuration files, and log files. The chapter introduces the standard set of tools used to process all of this text from the command line:

```text
cat sort uniq cut paste join tac rev comm diff patch tr sed aspell
```

### 12. Revisiting `cat` (Ch 20)

`cat` has options for *visualizing* and *modifying* text:

Table: The `cat` options covered in this lecture and what each one does

| Option | Effect |
|---|---|
| `-A` | Show non-printing characters: `^I` for tab, `$` at line end |
| `-n` | Number every output line |
| `-s` | Squeeze runs of blank lines into a single blank line |

```bash
cat -A foo.txt
# ^IThe quick brown fox jumps over the lazy dog.   $
```

> **MS-DOS vs. Unix line endings.** Unix ends each line with a single linefeed (`\n`), DOS/Windows uses carriage return + linefeed (`\r\n`). `cat -A` shows stray `^M`s before each `$`. Tools like `dos2unix`, `tr -d '\r'`, or `sed -i 's/\r$//'` strip them out.

### 13. `sort` — Order a Stream (Ch 20)

`sort` reads lines, sorts them, and writes them to standard output. It accepts files on the command line or input on standard input.

Table: The `sort` options covered in this lecture and what each one does

| Option | Effect |
|---|---|
| `-b` | Ignore leading blanks |
| `-f` | Case-insensitive |
| `-n` | Numeric sort |
| `-r` | Reverse order |
| `-k F[,F]` | Sort key — a field or range of fields |
| `-t C` | Field separator character |
| `-m` | Merge already-sorted files |
| `-o FILE` | Write to *FILE* instead of stdout |
| `-u` | (GNU) suppress duplicates as you sort |

`sort` divides each line into **fields** using whitespace by default. A multi-key sort can isolate fields and even *offsets* within fields:

```bash
# Alphabetic sort by distro name, numeric sort by version
sort --key=1,1 --key=2n distros.txt

# Sort by year/month/day starting at character offsets within field 3
sort -k 3.7nbr -k 3.1nbr -k 3.4nbr distros.txt

# Use a colon as field separator (e.g., for /etc/passwd)
sort -t ':' -k 7 /etc/passwd | head
```

### 14. `uniq` — Remove Adjacent Duplicates (Ch 20)

`uniq` removes (or reports on) **adjacent** duplicate lines. Almost always paired with `sort`:

```bash
sort foo.txt | uniq
sort foo.txt | uniq -c    # count of each unique line
sort foo.txt | uniq -d    # only the duplicated lines
```

Table: The `uniq` options covered in this lecture and what each one does

| Option | Effect |
|---|---|
| `-c` | Prefix each line with its count |
| `-d` | Print only lines that have duplicates |
| `-u` | Print only lines that have **no** duplicates |
| `-i` | Case-insensitive comparison |
| `-f n` | Skip the first *n* fields when comparing |
| `-s n` | Skip the first *n* characters when comparing |

### 15. `cut` — Extract Columns or Fields (Ch 20)

`cut` extracts a portion of every line.

Table: The `cut` options covered in this lecture, their long forms, and what each one does

| Option | Long form | Effect |
|---|---|---|
| `-c LIST` | `--characters=LIST` | Extract by character position(s) |
| `-f LIST` | `--fields=LIST` | Extract field(s); requires tab-separated input by default |
| `-d C` | `--delimiter=C` | Use *C* as the field separator |
|  | `--complement` | Output everything *except* the selected portion |

```bash
cut -f 3 distros.txt                   # third field of each line
cut -f 3 distros.txt | cut -c 7-10     # year of release (chars 7-10 of date)
cut -d ':' -f 1 /etc/passwd | head     # account names
```

> **Pair with `expand`** to convert tabs to spaces when you need consistent character columns: `expand distros.txt | cut -c 23-`. `unexpand` does the reverse.

### 16. `paste` — Combine Columns (Ch 20)

`paste` is the opposite of `cut` — it merges *corresponding lines* of two or more files side by side, separated by a tab (or a delimiter set with `-d`):

```bash
paste distros-dates.txt distros-versions.txt
# 11/25/2008    Fedora    10
# 10/30/2008    Ubuntu    8.10
# ...
```

### 17. `join` — Relational-Style Join (Ch 20)

`join` combines lines from two files on a **shared key field** (the first field by default). Both files must be **sorted on the key**.

```bash
join distros-key-names.txt distros-key-vernums.txt | head
# 11/25/2008 Fedora 10
# 10/30/2008 Ubuntu 8.10
# ...
```

By default `join` uses whitespace as the input delimiter and a single space on output. Options like `-t`, `-1`, and `-2` change the delimiter and the key field per file.

### 18. `tac` and `rev` (Ch 20)

`tac` is `cat` in reverse line order; `rev` reverses the characters within each line.

```bash
tail /var/log/backup.log | tac    # newest entries on top
echo "This is a test." | rev      # .tset a si sihT
```

A common idiom uses `rev` to make `cut` operate from the *end* of each line:

```bash
tail /var/log/backup.log | rev | cut -c 2- | rev    # strip the trailing period
```

### 19. `comm` — Compare Sorted Files (Ch 20)

`comm` produces three columns:

1. lines unique to file 1
2. lines unique to file 2
3. lines common to both

Suppress columns with `-1`, `-2`, or `-3`:

```bash
comm -12 file1.txt file2.txt    # only the lines common to both
```

### 20. `diff` and `patch` (Ch 20)

`diff` reports the differences between two files (or directory trees with `-r`). It supports several output formats:

- **Default** — terse `r1ar2`/`r1cr2`/`r1dr2` change commands.
- **Context format** (`-c`) — surrounds changes with a few lines of context, marking the two files with `***` and `---`.
- **Unified format** (`-u`) — the modern, more compact format that source-control systems use; lines start with space, `-`, or `+`.

A *patch* is just a `diff` saved to a file. `patch` reads a unified diff and edits the older file to match the newer one:

```bash
diff -Naur file1.txt file2.txt > patchfile.txt
patch < patchfile.txt
```

`-N` treats absent files as empty, `-a` treats files as text, `-u` produces unified output, and `-r` recurses into directories.

### 21. `tr` — Transliterate, Delete, Squeeze (Ch 20)

`tr` performs character-level translation on standard input.

```bash
echo "lowercase letters" | tr a-z A-Z
# LOWERCASE LETTERS

echo "lowercase letters" | tr [:lower:] A
# AAAAAAAAA AAAAAAA

tr -d '\r' < dos_file > unix_file        # strip carriage returns
echo "aaabbbccc" | tr -s ab               # squeeze adjacent runs: abccc
```

A famous toy use is **ROT13**, a self-inverse substitution cipher:

```bash
echo "secret text" | tr a-zA-Z n-za-mN-ZA-M
# frperg grkg
```

### 22. `sed` — Stream Editor (Ch 20)

`sed` runs a small program over a stream of text, applying commands to each line. The general form is:

```text
sed 'address command' [file...]
sed -f script.sed [file...]
```

If no address is given, the command is applied to every line. The slash is a *conventional* delimiter — any other character can be used (e.g., `s_front_back_`).

#### Address Notation

Table: The `sed` address forms covered in this lecture and which lines each one selects

| Address | Description |
|---|---|
| `n` | Line number *n* |
| `$` | Last line |
| `/regexp/` | Lines matching a POSIX BRE |
| `addr1,addr2` | Range from *addr1* through *addr2* |
| `first~step` | *first*, then every *step*-th line (`1~2` is odd lines) |
| `addr1,+n` | *addr1* and the following *n* lines |
| `addr!` | Negation — every line *except* the address |

#### Common Commands

Table: The `sed` commands covered in this lecture and what each one does

| Command | Description |
|---|---|
| `=` | Print the current line number |
| `a\` | Append text after the line |
| `d` | Delete the line |
| `i\` | Insert text before the line |
| `p` | Print the line (use with `-n` to print only matched lines) |
| `q` | Quit (and print the current line, unless `-n`) |
| `Q` | Quit without printing |
| `s/regex/repl/[flags]` | Substitute |
| `y/set1/set2` | Transliterate (`set1` and `set2` must be the same length) |

#### `s` — The Workhorse

The most-used command is `s`. The `g` flag makes it act on **all** matches on a line, not just the first:

```bash
echo "aaabbbccc" | sed 's/b/B/'      # aaaBbbccc
echo "aaabbbccc" | sed 's/b/B/g'     # aaaBBBccc
```

Backreferences (`\1`–`\9`) refer to subexpressions captured with `\(...\)` in BRE. The classic example reformats `MM/DD/YYYY` to `YYYY-MM-DD`:

```bash
sed 's/\([0-9]\{2\}\)\/\([0-9]\{2\}\)\/\([0-9]\{4\}\)$/\3-\1-\2/' distros.txt
```

#### Script Files and `-i`

A multi-line script can be saved to a file and run with `-f`. The `-i` option edits files **in place** (rewrites them with the changes applied):

```bash
sed -i 's/lazy/laxy/; s/jumps/jimps/' foo.txt
```

Multiple commands on one line are separated with semicolons.

> **People who like `sed` also like `awk` and `perl`.** Both extend the same line-by-line model into full programming languages. They are outside the scope of this chapter but worth knowing about.

### 23. `aspell` — Interactive Spell Checking (Ch 20)

`aspell check FILE` runs an interactive spell checker, presenting numbered suggestions for each unknown word along with `Ignore`, `Replace`, `Add`, and `Abort` actions.

For markup languages, `aspell` has built-in modes that ignore the markup:

```bash
aspell -H check page.html       # HTML mode — skip tag contents
```

Without `-H`, `aspell` would treat `html`, `head`, etc. as misspellings.

---

## Additional Resources

### Key Commands Summary

Table: The text-processing commands covered in this lecture and what each one does

| Command | Purpose |
|---|---|
| `grep [-E] pattern [file...]` | Print lines matching a regex; `-E` for extended regex |
| `cat [-Ans]` | Visualize non-printing characters; number lines; squeeze blanks |
| `sort [-bfnr] [-k F[,F]] [-t C]` | Sort by line, field, or offset; numeric or reverse |
| `uniq [-cdiu] [-f n] [-s n]` | Collapse, count, or filter adjacent duplicate lines |
| `cut [-c LIST] [-f LIST] [-d C]` | Extract characters or fields from each line |
| `paste FILE...` | Merge corresponding lines from multiple files into columns |
| `join FILE1 FILE2` | Relational-style join on a shared, sorted key field |
| `tac FILE` | Reverse line order |
| `rev FILE` | Reverse character order within each line |
| `comm [-123] FILE1 FILE2` | Three-column compare of sorted files |
| `diff [-cu] [-Naur] A B` | Report differences; `-u` for the modern unified format |
| `patch < diff_file` | Apply a unified diff to update files |
| `tr [-ds] SET1 [SET2]` | Transliterate, delete, or squeeze characters |
| `sed [-n] [-i] [-f script] 'addr cmd' [file...]` | Stream-edit lines by address |
| `expand` / `unexpand` | Convert tabs to spaces and back |
| `aspell [-H] check FILE` | Interactive spell checker (HTML mode with `-H`) |

### Regex Notation Cheat Sheet

Table: Regex notation covered in this lecture, its meaning, and whether BRE, ERE, or both support it

| Pattern | Meaning | BRE / ERE |
|---|---|---|
| `.` | Any single character | both |
| `^`, `$` | Start / end of line | both |
| `[abc]`, `[a-z]`, `[^abc]` | Bracket expression / range / negated | both |
| `[[:digit:]]` | POSIX character class | both |
| `*` | Zero or more of previous | both |
| `?`, `+` | Zero-or-one / one-or-more | ERE (BRE: `\?`, `\+`) |
| `{n}`, `{n,m}` | Exact / bounded repetition | ERE (BRE: `\{n\}`) |
| `(abc)` | Grouping | ERE (BRE: `\(abc\)`) |
| `a\|b` | Alternation | ERE (BRE: not supported) |
| `\1`–`\9` | Backreference to a group | both (in `sed`, only with `\(\)` groups) |

### `sed` Quick Reference

Table: `sed` syntax elements covered in this lecture, an example of each, and its effect

| Element | Example | Effect |
|---|---|---|
| Address — line | `5p` | Print line 5 |
| Address — range | `1,5p` | Print lines 1–5 |
| Address — regex | `/regex/p` | Print lines matching regex |
| Address — negation | `/regex/!p` | Print lines *not* matching |
| `s/REGEX/REPL/` | `s/foo/bar/` | Replace first match per line |
| `s/REGEX/REPL/g` | `s/b/B/g` | Replace **every** match per line |
| `\1`–`\9` in REPL | `\3-\1-\2` | Insert captured groups |
| `y/SET1/SET2/` | `y/a-z/A-Z/` | Transliterate (sets must be same length) |
| `-n` | `sed -n '5p'` | Suppress automatic printing |
| `-i` | `sed -i 's/x/y/'` | Edit files in place |
| `-f FILE` | `sed -f script.sed in.txt` | Run a multi-line script |

### Tips for Success

1. **Always single-quote** regular expressions on the command line so the shell does not expand `*`, `?`, `[`, `$`, or `\` before the regex tool sees them.
2. **Pick the right dialect.** `grep` is BRE by default; reach for `grep -E` (or `egrep`) when you want `?`, `+`, `{n,m}`, `(...)`, or `|` without backslashes. `sed` is BRE by default; some versions accept `-E` (or `-r`) for ERE.
3. **Sort before you `uniq` or `join`.** Both tools rely on adjacent-line ordering. If the output looks wrong, suspect missing or wrong sort order first.
4. **Use `cat -A` to debug whitespace.** When `cut`, `sort`, or `awk` produce unexpected results, `cat -A` will reveal stray tabs, trailing spaces, or carriage returns.
5. **Build complex `sed` substitutions in stages.** Get the regex right with `grep -E` first, then translate it back to BRE with `\(...\)`, `\{n\}`, and `\?` for `sed`.
6. **Reach for `diff -u` and `patch`** instead of emailing whole files. Patches are reviewable, applicable, and reversible — and they are the format every modern source-control system speaks.

### Common Pitfalls

- Forgetting to escape `(`, `)`, `{`, `}`, `?`, and `+` when using `sed` (BRE), or *over*-escaping them with `grep -E` (ERE).
- Writing `[A-Z]` in a UTF-8 locale and being surprised when it includes lowercase letters in the dictionary collation order. Use `[[:upper:]]` or `LANG=C` to get the traditional ASCII behavior.
- Running `uniq` without `sort` first and assuming all duplicates were collapsed.
- Using `cut -f` on space-separated data without specifying `-d ' '` (or pre-processing with `tr -s ' ' '\t'`).
- Forgetting that `join` requires both files to be sorted on the key field; the output is silently wrong otherwise.
- Forgetting the `g` flag on `sed s` and only replacing the first match per line.
- Editing a file with `sed` *without* `-i` and then wondering why the file did not change — by default, `sed` writes to standard output.
- Using `\d` and `\s` in POSIX regex tools — those are Perl/PCRE shortcuts and do not work in plain `grep` or `sed`. Use `[0-9]` and `[[:space:]]` instead.
