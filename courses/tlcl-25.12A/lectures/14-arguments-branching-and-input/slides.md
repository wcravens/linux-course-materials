---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Shell Scripting II: Arguments, Branching, and Input'
info: |
  ## The Linux Command Line — Lecture 14
  Arguments, Branching, and Input. Adapted from TLCL chapters 32, 27, and 28.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Shell Scripting II

Arguments, Branching, and Input

The Linux Command Line

Lecture 14

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Access command-line arguments via the positional parameters `$0`–`${N}`, `$#`, `$@`, `$*`, and walk long lists with `shift`
- Parse short and long options with both `while` / `case` / `shift` and the `getopts` builtin
- Distinguish a command's *exit status* from its *output*; use `$?`, `true` / `false`, `&&`, and `||`
- Build conditional logic with `if` / `elif` / `else` / `fi` using `test` (`[ ]`), `[[ ]]`, and `(( ))`
- Combine expressions with `&&`, `||`, and `!` and apply file, string, and integer test expressions
- Read keyboard input with `read`, control word splitting through `IFS`, and validate user input

---

# Module Order: 32 → 27 → 28

This module presents three TLCL chapters in **pedagogical** rather than numerical order:

| Step | Chapter | Topic |
|------|---------|-------|
| 1 | **32** | Get input from the **command line** (positional parameters) |
| 2 | **27** | **Branch** on the result of tests (`if`) |
| 3 | **28** | Get input from the **keyboard** (`read`) |

Together: argument parsing → flow control → interactive input.

---
layout: section
---

# Positional Parameters (Ch 32)

The shell exposes a script's command-line arguments through a set of variables called **positional parameters**, named `0` through `9`.

---

# Viewing the Parameters

```bash
#!/bin/bash
# posit-param: view command line parameters
echo "
\$0 = $0
\$1 = $1
\$2 = $2
\$3 = $3
"
```

Run it:

```bash
posit-param a b c
# $0 = /home/me/bin/posit-param
# $1 = a
# $2 = b
# $3 = c
```

- `$0` is **always** the pathname of the script
- `$1`–`$9` are the first nine arguments

---

# Past Nine: Use Braces

To access positional parameters numbered 10 or higher, surround the number with **braces**:

```bash
echo "${10}, ${55}, ${211}"
```

Without braces, `$10` expands as `$1` followed by the literal character `0`.

---
layout: section
---

# Counting and Walking Arguments

`$#` is the count; `shift` walks the list.

---

# `$#` — How Many Were Passed?

```bash
if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <filename>" >&2
    exit 1
fi
```

The early-exit usage check is one of the most common patterns in shell scripts.

---

# `shift` — Process an Arbitrary List

`shift` renames `$2 → $1`, `$3 → $2`, … and decrements `$#`.

```bash
count=1
while [[ $# -gt 0 ]]; do
    echo "Argument $count = $1"
    count=$((count + 1))
    shift
done
```

`$0` is **never** affected by `shift`.

---
layout: section
---

# Useful Patterns from `$0`

A short prelude that makes every script self-aware.

---

# Derive `PROGNAME` from `$0`

```bash
PROGNAME="$(basename "$0")"

usage () {
    echo "$PROGNAME: usage: $PROGNAME [-i] [-f file]"
}
```

- `basename` strips the directory portion of a pathname
- Usage messages stay correct even after the script is renamed
- Inside a function, the equivalent is the auto-set `FUNCNAME`

---
layout: section
---

# All Parameters at Once: `$*` and `$@`

Two special parameters expand to the full argument list — but they are not interchangeable.

---

# Four Behaviors

| Form | Result |
|---|---|
| `$*` | Words separated by spaces (subject to word-splitting) |
| `"$*"` | A **single** double-quoted word, joined by `IFS[0]` |
| `$@` | Words separated by spaces (subject to word-splitting) |
| `"$@"` | **Separate** double-quoted words — one per parameter |

```bash
# Set 3 args, the second containing a space
set -- one "two three" four
for a in "$@"; do echo "[$a]"; done
# [one]
# [two three]
# [four]
```

---

# Use `"$@"` to Forward Arguments

```bash
my_wrapper () {
    real_command "$@"      # preserves argument boundaries
}
```

`"$@"` is the **safe default** when one script or function passes its arguments to another command — even if some arguments contain spaces.

---
layout: section
---

# Parsing Long Options: `while` / `case` / `shift`

For long-form options like `--file foo` and `--help`.

---

# The Pattern

```bash
interactive=
filename=

while [[ -n "$1" ]]; do
    case "$1" in
        -f | --file)        shift; filename="$1" ;;
        -i | --interactive) interactive=1 ;;
        -h | --help)        usage; exit ;;
        *)                  usage >&2; exit 1 ;;
    esac
    shift
done
```

- `case` matches the current `$1` against each pattern
- The `*)` branch catches anything unrecognized
- `shift` at the bottom advances to the next argument

---
layout: section
---

# Parsing Short Options: `getopts`

For traditional single-letter options like `ls -la`.

---

# The Pattern

```bash
while getopts ":f:ih" opt; do
    case "$opt" in
        f)  filename="$OPTARG" ;;
        i)  interactive=1 ;;
        h)  usage; exit ;;
        \?) echo "invalid option '-$OPTARG'" >&2 ;;
        :)  echo "option '-$OPTARG' missing argument" >&2 ;;
    esac
done
```

- A colon after a letter (`f:`) means that option requires an argument
- A leading colon (`:f:ih`) silences `getopts`'s own error messages so you can format them yourself
- `OPTARG` holds the value (or the offending letter); `OPTIND` advances

---

# Which Parser Should I Use?

| Approach | Best for |
|---|---|
| `while` / `case` / `shift` | Long options, complex parsing, full control |
| `getopts` | Short options, less code, multi-option syntax (`-if foo`) |

Both are valid and widely used. Pick the one that fits the script.

---
layout: section
---

# Branching with `if` (Ch 27)

A real script needs to change direction based on the result of a test.

---

# The Pseudocode

```text
X = 5
If X = 5, then:
    Say "X equals 5."
Otherwise:
    Say "X does not equal 5."
```

In bash:

```bash
x=5
if [ "$x" -eq 5 ]; then
    echo "x equals 5."
else
    echo "x does not equal 5."
fi
```

---

# Full `if` Syntax

```text
if commands; then
    commands
[elif commands; then
    commands...]
[else
    commands]
fi
```

- `if` evaluates the **success or failure** of *commands*, not a Boolean expression
- `elif` is short for "else if" — chain as many as you need
- `else` is optional

---
layout: section
---

# Exit Status

Every command returns an integer exit status when it terminates.

---

# `$?` Holds the Most Recent Exit Status

By convention, **0 = success**, **non-zero = failure**.

```bash
ls -d /usr/bin
echo $?
# 0
ls -d /bin/usr
# ls: cannot access '/bin/usr': No such file or directory
echo $?
# 2
```

---

# `true` and `false`

Two builtins exist solely to test flow control:

```bash
true;  echo $?     # 0
false; echo $?     # 1
```

```bash
if true;  then echo "It's true.";  fi    # prints
if false; then echo "It's true.";  fi    # nothing
```

---
layout: section
---

# `test` and `[ ]`

The most common command used with `if`.

---

# Two Equivalent Forms

```bash
test expression
[ expression ]
```

The `[ ]` form is more popular. The closing `]` is a *required* final argument — there must be a space before it.

- Returns exit status **0** if *expression* is true
- Returns exit status **1** if *expression* is false

---

# File Expressions

| Expression | True if |
|---|---|
| `-e file` | `file` exists |
| `-f file` | regular file |
| `-d file` | directory |
| `-r file` | readable |
| `-w file` | writable |
| `-x file` | executable / searchable |
| `-L file` | symbolic link |
| `f1 -nt f2` | `f1` newer than `f2` |
| `f1 -ef f2` | same inode (hard link) |

---

# String Expressions

| Expression | True if |
|---|---|
| `-z "$s"` | length of `$s` is zero |
| `-n "$s"` | length of `$s` is greater than zero |
| `"$a" = "$b"` | equal (POSIX) |
| `"$a" == "$b"` | equal (bash) |
| `"$a" != "$b"` | not equal |

> **Always quote variables** in test expressions. `[ -z "$x" ]` is safe; `[ -z $x ]` breaks when `$x` is empty or contains spaces.

---

# Integer Expressions

| Expression | True if |
|---|---|
| `$a -eq $b` | equal |
| `$a -ne $b` | not equal |
| `$a -lt $b` | less than |
| `$a -le $b` | less than or equal |
| `$a -gt $b` | greater than |
| `$a -ge $b` | greater than or equal |

---
layout: section
---

# The Modern `[[ ]]`

bash adds a compound command `[[ expression ]]` that does everything `test` does — and more.

---

# Pattern Matching with `==`

```bash
FILE=foo.bar
if [[ "$FILE" == foo.* ]]; then
    echo "matches foo.*"
fi
```

The right-hand side of `==` is treated as a **glob pattern**.

---

# Regex Matching with `=~`

```bash
INT=-25
if [[ "$INT" =~ ^-?[0-9]+$ ]]; then
    echo "INT is an integer"
fi
```

The right-hand side of `=~` is an **extended regular expression**. This makes `[[ ]]` perfect for input validation.

---
layout: section
---

# `(( ))` for Arithmetic Truth Tests

A natural-looking syntax for purely numeric comparisons.

---

# `(( ))` in Action

```bash
INT=42
if (( INT == 0 )); then echo "zero"; fi
if (( INT > 0  )); then echo "positive"; fi
if (( (INT % 2) == 0 )); then echo "even"; fi
```

- The result is **true** if the arithmetic value is **non-zero**
- Variables are referenced **by name** — no `$` needed
- Use the familiar C-style operators: `==`, `!=`, `<`, `>`, `&&`, `||`, `%`, …

---
layout: section
---

# Combining Expressions

`test` and the modern compound commands use different operators.

---

# AND / OR / NOT

| Operation | `test` / `[ ]` | `[[ ]]` and `(( ))` |
|---|---|---|
| AND | `-a` | `&&` |
| OR  | `-o` | `\|\|` |
| NOT | `!`  | `!` |

```bash
# Range check (modern form)
if [[ "$INT" -ge "$MIN" && "$INT" -le "$MAX" ]]; then
    echo "in range"
fi

# Same idea (POSIX form)
if [ "$INT" -ge "$MIN" -a "$INT" -le "$MAX" ]; then
    echo "in range"
fi
```

Inside `[ ]`, parentheses for grouping must be **escaped**: `\(` and `\)`.

---
layout: section
---

# Control Operators: `&&` and `||`

A concise alternative to `if` for two-step decisions.

---

# Branch Without `if`

```bash
mkdir temp && cd temp                # cd only if mkdir succeeded
[[ -d temp ]] || mkdir temp          # create only if missing
[ -d temp ] || exit 1                # bail out if missing
```

- `cmd1 && cmd2` — run `cmd2` only if `cmd1` **succeeded**
- `cmd1 || cmd2` — run `cmd2` only if `cmd1` **failed**

For anything more complex, use `if`. These are great for one-liners and `.bashrc` snippets.

---
layout: section
---

# Reading Keyboard Input (Ch 28)

Make a script *interactive* with the `read` builtin.

---

# Basic `read`

```bash
read [-options] [variable...]
```

```bash
echo -n "Please enter an integer -> "
read int
echo "$int"
```

If you list **no variables**, the input is assigned to the shell variable `REPLY`.

---

# Reading Multiple Values

```bash
read var1 var2 var3 var4 var5
# Enter > a b c d e f g
# var1='a'  var2='b'  var3='c'  var4='d'  var5='e f g'
```

- Extra input collapses into the **last** variable
- Too few inputs leave the trailing variables **empty**

---
layout: section
---

# `read` Options

A small set of flags makes `read` very flexible.

---

# Most Useful Options

| Option | Effect |
|---|---|
| `-p prompt` | Display *prompt* before reading |
| `-r` | Raw — backslashes are not interpreted |
| `-s` | Silent — do not echo typed characters |
| `-t n` | Time out after *n* seconds (non-zero exit on timeout) |
| `-n n` | Read at most *n* characters |
| `-e` | Use Readline editing |
| `-i str` | Default value (with `-e`) |
| `-d c` | End on character *c* instead of newline |
| `-a array` | Read words into successive elements of *array* |
| `-u fd` | Read from file descriptor *fd* |

---

# A Secret with a Timeout

```bash
if read -r -s -t 10 -p "Enter passphrase > " secret; then
    echo -e "\nSecret = '$secret'"
else
    echo -e "\nInput timed out" >&2
    exit 1
fi
```

- `-r` always recommended — treats backslashes literally
- `-s` for passwords (no echo)
- `-t` for failsafe interactive prompts

---

# Default Values with `-e -i`

```bash
read -e -p "Enter username " -i "$USER"
echo "You answered: '$REPLY'"
```

The user can press **Enter** to accept the default, or edit it with the standard Readline keys.

---
layout: section
---

# Word Splitting and `IFS`

`read` splits input into fields using the characters in `IFS`.

---

# Per-Command IFS Override

```bash
file_info="$(grep "^$user_name:" /etc/passwd)"
IFS=":" read -r user pw uid gid name home shell <<< "$file_info"
echo "Full Name = '$name'"
```

Two new pieces of syntax:

- `IFS=":"` placed *before* the command applies **only** to that command
- `<<<` is a **here string** — it feeds a single string to standard input

---

# You Can't Pipe `read`

```bash
echo "foo" | read x
echo "x = '$x'"
# x = ''
```

Pipelines run each stage in a **subshell**. `read` assigns to `x` *inside the subshell*, and that environment is destroyed when the pipeline ends.

The fix is a here string:

```bash
read -r x <<< "foo"
echo "x = '$x'"
# x = 'foo'
```

---
layout: section
---

# Validating Input

Always assume user input is wrong until proven otherwise.

---

# A Defensive Pattern

```bash
invalid_input () {
    echo "Invalid input '$REPLY'" >&2
    exit 1
}

read -r -p "Enter a single item > "

[[ -z "$REPLY" ]] && invalid_input
(( $(echo "$REPLY" | wc -w) > 1 )) && invalid_input

if   [[ "$REPLY" =~ ^-?[[:digit:]]+$ ]];           then echo "integer"
elif [[ "$REPLY" =~ ^-?[[:digit:]]*\.[[:digit:]]+$ ]]; then echo "float"
elif [[ "$REPLY" =~ ^[-[:alnum:]._]+$ ]];          then echo "filename"
else echo "something else"; fi
```

- One small `invalid_input` function, called from every failure branch
- Reject empty input first; check shape next; classify last

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir -p ~/flow_lab/bin
cd ~/flow_lab
export PATH="$HOME/flow_lab/bin:$PATH"
touch present.txt
mkdir present.d
```

---

# Exercise 1: View the Positional Parameters

Create a script that echoes `$0`, `$1`–`$4`, and `$#`.

```bash
cat > ~/flow_lab/bin/posit-param <<'EOF'
#!/bin/bash
echo "Number of arguments: $#"
echo "\$0 = $0"
echo "\$1 = $1  \$2 = $2  \$3 = $3  \$4 = $4"
EOF
chmod 755 ~/flow_lab/bin/posit-param
posit-param alpha bravo charlie delta
```

---

# Exercise 2: Walk Many Args with `shift`

```bash
cat > ~/flow_lab/bin/walk-args <<'EOF'
#!/bin/bash
count=1
while [[ $# -gt 0 ]]; do
    echo "Argument $count = $1"
    count=$((count + 1))
    shift
done
EOF
chmod 755 ~/flow_lab/bin/walk-args
walk-args one two three four five
walk-args /etc/host*
```

---

# Exercise 3: Long-Option Parser

```bash
while [[ -n "$1" ]]; do
    case "$1" in
        -f | --file)        shift; filename="$1" ;;
        -i | --interactive) interactive=1 ;;
        -h | --help)        usage; exit ;;
        *)                  usage >&2; exit 1 ;;
    esac
    shift
done
```

Try it with `-i`, `--file foo`, `--interactive --file bar`, `--bogus`.

---

# Exercise 4: Short-Option Parser with `getopts`

```bash
while getopts ":f:ih" opt; do
    case "$opt" in
        f)  filename="$OPTARG" ;;
        i)  interactive=1 ;;
        h)  usage; exit ;;
        \?) echo "invalid option '-$OPTARG'" >&2 ;;
        :)  echo "missing argument for '-$OPTARG'" >&2 ;;
    esac
done
```

Try `-i`, `-f foo.html`, `-if foo.html`, `-a`, `-f` (no arg).

---

# Exercise 5: `if` with `[[ ]]` and `(( ))`

```bash
INT=42
if [[ ! "$INT" =~ ^-?[0-9]+$ ]]; then
    echo "not an integer" >&2; exit 1
fi
if   ((INT == 0)); then echo "zero"
elif ((INT < 0));  then echo "negative"
else                    echo "positive"; fi
```

---

# Exercise 6: `read` with Options

```bash
read -r -p "What is your name? " name
echo "Hello, $name!"

if read -r -s -t 8 -p "Passphrase > " pass; then
    echo -e "\nGot ${#pass} characters."
else
    echo -e "\nTimed out." >&2; exit 1
fi
```

---

# Exercise 7: `IFS` and Here Strings

```bash
read -r -p "Enter a username > " who
info="$(grep "^$who:" /etc/passwd)"
if [[ -n "$info" ]]; then
    IFS=":" read -r user pw uid gid name home shell <<< "$info"
    echo "Full Name = '$name'"
    echo "Home Dir  = '$home'"
else
    echo "No such user '$who'." >&2; exit 1
fi
```

---

# Lab Cleanup

```bash
rm -rf ~/flow_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1: Predict the Output

Given `set -- one "two three" four`, predict each line:

```bash
echo "$#"
for a in "$*"; do echo "[$a]"; done
for a in "$@"; do echo "[$a]"; done
```

**Answer:**

```
3
[one two three four]
[one]
[two three]
[four]
```

`"$*"` joins everything into one word; `"$@"` keeps the original boundaries.

---

# Challenge 2: Debug

Three independent bugs — find them.

```bash
#!/bin/bash
# add: add two integers
if [ $# = 2 ] then
    echo $(($1 + $2))
fi
```

**Answer:**

1. `=` is the **string** equality operator. For integers use `-eq`, or use `[[ ]]` / `(( ))`.
2. Missing **semicolon** before `then` — write `if [ … ]; then`.
3. The arguments are not validated — `add 5 abc` would explode in the arithmetic. Use a regex check first.

---

# Challenge 3: True or False

1. `getopts` automatically supports long options like `--file`. → **False** — only short options.
2. `read` populates `REPLY` if you list no variables. → **True**.
3. `(( ))` requires a `$` before variable names. → **False** — variables are by name.
4. Pipelines like `echo X | read VAR` reliably set `VAR`. → **False** — `read` runs in a subshell.
5. `[ "$x" == "$y" ]` is the same as `[[ "$x" == "$y" ]]`. → **False** — only `[[ ]]` treats the right side as a glob.

---

# Challenge 4: Range Check

Write a one-liner that prints `in` if `INT` is between 1 and 100, otherwise `out`.

**Answer (one of several):**

```bash
[[ "$INT" =~ ^-?[0-9]+$ && INT -ge 1 && INT -le 100 ]] && echo in || echo out
```

For a clearer multi-line version, use an `if` with `[[ ]]`.

---

# Assessment Questions

1. What is the difference between `$0`, `$#`, and `$@` in a shell script?
2. When parsing options, when would you choose `getopts` over `while` / `case` / `shift`, and vice-versa?
3. What is an *exit status*, and which exit value indicates success?
4. List one feature `[[ ]]` provides that `[ ]` does not.
5. Why is `[ -z $x ]` dangerous, and how would you fix it?
6. Why does `echo "foo" | read x` leave `$x` empty?

---

# Summary

Today we learned how to:

- Read a script's arguments with `$0`, `$1`–`${N}`, `$#`, `$@`, `$*`, and `shift`
- Parse both long and short options with `case`/`shift` and `getopts`
- Use exit status, `$?`, `true`, `false`, `&&`, and `||` to act on success or failure
- Build conditionals with `if` / `elif` / `else` / `fi` and the test commands `[ ]`, `[[ ]]`, and `(( ))`
- Apply file, string, and integer expressions, and combine them with `&&`, `||`, and `!`
- Read keyboard input with `read`, control word splitting with `IFS`, and validate user input

These three chapters together turn a script from a fixed sequence of commands into a real, user-facing program — one that takes input from the command line *and* the terminal, and decides what to do based on the data it sees.

---

# Additional Resources

- `man bash` — see **PARAMETERS**, **CONDITIONAL EXPRESSIONS**, **SHELL BUILTIN COMMANDS** (for `read`, `getopts`, `shift`, `test`)
- `help if`, `help test`, `help read`, `help getopts`, `help shift` — built-in help for each command
- *The Linux Command Line* Chapters 27, 28, and 32
- *Bash Reference Manual* §3.4.2 — Special Parameters (`$@`, `$*`, `$#`, `$?`, `$0`)
- ShellCheck (https://www.shellcheck.net) — catches most of the quoting, `[ ]` / `[[ ]]`, and word-splitting bugs covered here
