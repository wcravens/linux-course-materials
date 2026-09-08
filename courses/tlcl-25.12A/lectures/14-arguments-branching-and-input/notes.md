---
title: 'Shell Scripting II'
subtitle: 'The Linux Command Line — Lecture 14'
---

## Learning Objectives

After completing these chapters, you will be able to:

- Access a script's command-line arguments via the positional parameters `$0`–`$9`, `${10}+`, `$#`, `$@`, `$*`, and process long argument lists with `shift`
- Parse short and long command-line options with both a `while` / `case` / `shift` loop and the `getopts` built-in
- Distinguish a command's *exit status* from its *output*, and use the parameter `$?`, the `true` / `false` builtins, and the control operators `&&` / `||` to act on success or failure
- Build conditional logic with the `if` / `elif` / `else` / `fi` compound command, using `test` (`[ ]`), the modern `[[ ]]` form, and `(( ))` for arithmetic truth tests
- Combine expressions with logical operators (`-a` / `-o` / `!` for `test`, `&&` / `||` / `!` for `[[ ]]` and `(( ))`) and apply file, string, and integer test expressions appropriately
- Read a single line of input with the `read` builtin, use its options (`-p`, `-r`, `-s`, `-t`, `-n`, `-e`, `-i`, `-d`, `-a`, `-u`), control word splitting through `IFS`, and validate user input before acting on it

## Key Commands Covered

- `$1`, `$2`, … , `${10}` — Positional parameters holding command-line arguments
- `$0` — The pathname of the script itself (always set, even with no arguments)
- `$#` — Number of command-line arguments
- `$*`, `$@`, `"$*"`, `"$@"` — All positional parameters, as a single word or as separate words
- `shift` — Discard `$1` and renumber the remaining parameters down by one
- `getopts` — Built-in option parser for short, single-character flags
- `basename` — Strip the directory portion from a pathname (used to derive `$PROGNAME`)
- `if` / `elif` / `else` / `fi` — Compound command for conditional branching
- `test` and `[ … ]` — POSIX command that evaluates file, string, and integer expressions
- `[[ … ]]` — Modern bash compound command with regex matching (`=~`) and pattern matching (`==`)
- `(( … ))` — Arithmetic truth test (true if the result is non-zero)
- `&&`, `||`, `!` — Control operators for conditional command chaining
- `true`, `false` — Builtins that always succeed (exit 0) or always fail (exit 1)
- `read` — Read one line of standard input into one or more variables
- `IFS` — Internal Field Separator; controls how `read` splits input into fields

## Chapter Outline

### 1. Positional Parameters and the Command Line (Ch 32)

The shell makes a script's command-line arguments available through a set of variables called **positional parameters**, named `0` through `9`. `$0` is always the pathname of the script itself; `$1`–`$9` hold the first nine arguments.

```bash
#!/bin/bash
# posit-param: script to view command line parameters
echo "
\$0 = $0
\$1 = $1
\$2 = $2
\$3 = $3
"
```

Running `posit-param a b c` produces:

```bash
# $0 = /home/me/bin/posit-param
# $1 = a
# $2 = b
# $3 = c
```

### 2. Accessing More Than Nine Arguments (Ch 32)

To read positional parameters numbered ten or higher, surround the number with **braces**:

```bash
echo "${10}, ${55}, ${211}"
```

Without the braces, `$10` would expand to `$1` followed by the literal character `0`.

### 3. Determining the Number of Arguments (Ch 32)

The shell variable `$#` holds the count of arguments passed on the command line:

```bash
echo "Number of arguments: $#"
# Number of arguments: 4   (when invoked as: posit-param a b c d)
```

This is the standard way to check whether the user supplied the right number of arguments before doing real work:

```bash
if [[ $# -ne 1 ]]; then
    echo "Usage: $0 <filename>" >&2
    exit 1
fi
```

### 4. `shift` — Walking Through Many Arguments (Ch 32)

The `shift` builtin renames `$2` to `$1`, `$3` to `$2`, and so on, decreasing `$#` by one. By calling it inside a loop, you can iterate over an arbitrarily long list of arguments using only `$1`:

```bash
#!/bin/bash
# posit-param2: display all arguments
count=1
while [[ $# -gt 0 ]]; do
    echo "Argument $count = $1"
    count=$((count + 1))
    shift
done
```

`$0` is **not** affected by `shift`.

### 5. Simple Applications: Using `$0` and `basename` (Ch 32)

It is good practice to derive a `PROGNAME` constant from `$0` so that usage messages always show the script's actual invoked name, even after the file is renamed:

```bash
#!/bin/bash
# file-info: simple file information program

PROGNAME="$(basename "$0")"

if [[ -e "$1" ]]; then
    echo -e "\nFile Type:"
    file "$1"
    echo -e "\nFile Status:"
    stat "$1"
else
    echo "$PROGNAME: usage: $PROGNAME file" >&2
    exit 1
fi
```

The same pattern works inside a shell function — only the variable changes from `PROGNAME` (built from `$0`) to `FUNCNAME` (a shell variable bash maintains automatically).

### 6. Positional Parameters with Shell Functions (Ch 32)

When you call a shell function with arguments, those arguments become the **function's** positional parameters — independent of the script's. The function sees `$1`, `$2`, `$#` as its own arguments; `$0` is unchanged.

```bash
file_info () {
    if [[ -e "$1" ]]; then
        file "$1"
        stat "$1"
    else
        echo "$FUNCNAME: usage: $FUNCNAME file" >&2
        return 1
    fi
}

file_info /etc/passwd     # $1 inside the function is /etc/passwd
```

### 7. Handling All Parameters at Once: `$*` and `$@` (Ch 32)

Two special parameters expand to the *complete* list of positional parameters but with subtly different word-splitting behavior:

| Parameter | Behavior |
|---|---|
| `$*` | Expands to the list of positional parameters, separated by spaces. |
| `"$*"` | Expands to a **single** double-quoted string containing all parameters joined by the first character of `IFS` (a space by default). |
| `$@` | Expands to the list of positional parameters, separated by spaces. |
| `"$@"` | Expands to **separate** double-quoted words — one per positional parameter. |

In practice, `"$@"` is almost always what you want. It preserves the boundary between arguments even when individual arguments contain whitespace, so it is the safe default for forwarding arguments to another command.

```bash
my_wrapper () {
    real_command "$@"      # passes each argument intact
}
```

### 8. Parsing Options with `while` / `case` / `shift` (Ch 32)

For long-form options (`--file`, `--help`, etc.) the conventional pattern is a `while` loop, a `case` statement that matches the current `$1`, and a `shift` at the bottom of the loop to advance:

```bash
usage () {
    echo "$PROGNAME: usage: $PROGNAME [-f file | -i]"
}

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

The `*)` branch catches anything unrecognized and prints the usage message.

### 9. Parsing Options with `getopts` (Ch 32)

For traditional **short** options (single letters, optionally combined like `ls -la`), the built-in `getopts` does most of the work. It is invoked in a `while` loop and accepts an *optstring* that lists the supported letters; a colon after a letter means that option requires an argument.

```bash
while getopts ":f:ih" opt; do
    case "$opt" in
        f) filename="$OPTARG" ;;
        i) interactive=1 ;;
        h) usage; exit ;;
        \?) echo "option '$OPTARG' invalid" ;;
        :)  echo "option '$OPTARG' missing argument" ;;
    esac
done
```

Two extra cases handle errors: `\?` (note the backslash — `?` is also a wildcard) for unknown letters, and `:` (when the leading `:` of the optstring is present) for missing required arguments. `getopts` populates `OPTARG` with the relevant letter or value, and increments `OPTIND` to the next position.

| Approach | Best for |
|---|---|
| `while` / `case` / `shift` | Long option names, complex parsing logic, full control |
| `getopts` | Short single-letter options, minimal code, multi-option syntax (`-if foo.html`) |

### 10. The Branching Problem (Ch 27)

A script becomes much more useful once it can change direction based on the result of a test. In programming terms, this is a **branch**. The pseudocode form is:

```text
X = 5
If X = 5, then:
    Say "X equals 5."
Otherwise:
    Say "X does not equal 5."
```

In bash, the same idea is written with `if`:

```bash
x=5
if [ "$x" -eq 5 ]; then
    echo "x equals 5."
else
    echo "x does not equal 5."
fi
```

### 11. The `if` Compound Command (Ch 27)

The full syntax of `if` is:

```text
if commands; then
    commands
[elif commands; then
    commands...]
[else
    commands]
fi
```

`if` evaluates the **success or failure** of *commands*, not a Boolean expression. To understand what counts as success or failure, you have to understand exit status.

### 12. Exit Status (Ch 27)

Every command — including scripts and shell functions — returns an integer **exit status** to the system when it terminates. By convention, `0` means success and any non-zero value means failure. The most recent exit status is held in the parameter `$?`.

```bash
ls -d /usr/bin
echo $?
# 0
ls -d /bin/usr
# ls: cannot access /bin/usr: No such file or directory
echo $?
# 2
```

The shell provides two trivial commands for testing flow control:

- `true` — always exits with status `0` (success)
- `false` — always exits with status `1` (failure)

```bash
if true;  then echo "It's true.";  fi    # prints
if false; then echo "It's true.";  fi    # prints nothing
```

If a *list* of commands follows `if` (separated by `;`), only the **last** command's exit status counts.

### 13. `test` and `[ ]` — Conditional Expressions (Ch 27)

By far the most common command used with `if` is `test`. It has two equivalent syntactic forms:

```bash
test expression
[ expression ]
```

Both return exit status `0` if *expression* is true and `1` if it is false. With the `[ ]` form, the closing bracket `]` is a *required* final argument.

#### File Expressions

| Expression | True if |
|---|---|
| `-e file` | `file` exists |
| `-f file` | `file` exists and is a regular file |
| `-d file` | `file` exists and is a directory |
| `-r file` | `file` is readable by the effective user |
| `-w file` | `file` is writable by the effective user |
| `-x file` | `file` is executable / searchable |
| `-s file` | `file` exists and has length greater than zero |
| `-L file` | `file` is a symbolic link |
| `-O file` | `file` is owned by the effective user |
| `-G file` | `file` is owned by the effective group |
| `file1 -nt file2` | `file1` is newer than `file2` |
| `file1 -ot file2` | `file1` is older than `file2` |
| `file1 -ef file2` | `file1` and `file2` share the same inode (a hard link) |

#### String Expressions

| Expression | True if |
|---|---|
| `string` | `string` is not null |
| `-n string` | length of `string` is greater than zero |
| `-z string` | length of `string` is zero |
| `string1 = string2` | the two strings are equal (POSIX form) |
| `string1 == string2` | the two strings are equal (bash extension) |
| `string1 != string2` | the two strings are not equal |

> **Quote your variables in test expressions.** Writing `[ -z "$ANSWER" ]` is safer than `[ -z $ANSWER ]`. If `$ANSWER` is empty or contains spaces, the unquoted form expands to the wrong number of arguments and `test` produces a confusing error.

#### Integer Expressions

| Expression | True if |
|---|---|
| `int1 -eq int2` | equal |
| `int1 -ne int2` | not equal |
| `int1 -lt int2` | less than |
| `int1 -le int2` | less than or equal |
| `int1 -gt int2` | greater than |
| `int1 -ge int2` | greater than or equal |

### 14. The Modern `[[ ]]` Form (Ch 27)

bash adds a compound command `[[ expression ]]` that supports everything `test` does and adds two important features:

- **Pattern matching with `==`** — the right-hand side of `==` is treated as a glob:
  ```bash
  FILE=foo.bar
  if [[ "$FILE" == foo.* ]]; then echo "matches foo.*"; fi
  ```
- **Regex matching with `=~`** — the right-hand side is an extended regular expression:
  ```bash
  if [[ "$INT" =~ ^-?[0-9]+$ ]]; then echo "INT is an integer"; fi
  ```

Inside `[[ ]]`, characters that are normally special to bash (`<`, `>`, `(`, `)`) lose their shell meaning, so they do not need to be quoted or escaped.

### 15. `(( ))` for Arithmetic Truth Tests (Ch 27)

For purely numeric comparisons, the compound command `(( expression ))` is more natural. It performs **arithmetic evaluation**: the result is true if the value is non-zero.

```bash
if ((INT == 0)); then echo "INT is zero"; fi
if ((INT < 0));  then echo "INT is negative"; fi
if (( (INT % 2) == 0 )); then echo "INT is even"; fi
```

Because `(( ))` is part of the shell syntax, variables inside it are referenced **by name** — no `$` is required.

### 16. Combining Expressions (Ch 27)

Logical operators connect simple expressions into compound ones. `test` and the modern compound commands use different operators:

| Operation | `test` / `[ ]` | `[[ ]]` and `(( ))` |
|---|---|---|
| AND | `-a` | `&&` |
| OR  | `-o` | `\|\|` |
| NOT | `!`  | `!` |

```bash
# Range check with [[ ]]
if [[ "$INT" -ge "$MIN_VAL" && "$INT" -le "$MAX_VAL" ]]; then
    echo "$INT is within range."
fi

# Same idea with test (note backslashes around parentheses for grouping)
if [ "$INT" -ge "$MIN_VAL" -a "$INT" -le "$MAX_VAL" ]; then
    echo "$INT is within range."
fi
```

Use parentheses to group, and remember that inside the old `test` form they must be escaped: `\(` and `\)`.

### 17. Control Operators: Another Way to Branch (Ch 27)

bash provides two **control operators** that branch on the exit status of the previous command, without an `if`:

```text
command1 && command2     # run command2 only if command1 succeeded
command1 || command2     # run command2 only if command1 failed
```

```bash
mkdir temp && cd temp                # cd only if mkdir succeeded
[[ -d temp ]] || mkdir temp          # create temp only if it does not exist
[ -d temp ] || exit 1                # bail out if temp is missing
```

These are concise and idiomatic for short, two-step decisions. For anything more complex, prefer `if`.

### 18. Reading Keyboard Input — the `read` Builtin (Ch 28)

To make a script *interactive*, use the `read` builtin to read a single line from standard input into one or more variables. The general form is:

```text
read [-options] [variable...]
```

If no variables are listed, the input is assigned to the shell variable `REPLY`.

```bash
echo -n "Please enter an integer -> "
read int
echo "$int"
```

`read` can populate several variables at once. If the input has more words than variables, the **last** variable receives all the remaining input; if it has fewer, the trailing variables are left empty.

```bash
read var1 var2 var3 var4 var5
# Enter one or more values > a b c d e f g
# var1=a  var2=b  var3=c  var4=d  var5='e f g'
```

### 19. `read` Options (Ch 28)

| Option | Effect |
|---|---|
| `-p prompt` | Display *prompt* before reading (saves you an `echo -n`) |
| `-r` | **Raw mode** — backslashes are not interpreted as escapes (recommended for safety) |
| `-s` | Silent — do not echo typed characters (useful for passwords) |
| `-t seconds` | Time out after *seconds*; exit non-zero if no input arrives |
| `-n num` | Read at most *num* characters, then return |
| `-d delim` | Use the first character of *delim* instead of newline as the end-of-input marker |
| `-e` | Use Readline for editing — same line-editing keys as the prompt |
| `-i string` | With `-e`, supply *string* as a default value the user can edit |
| `-a array` | Assign each word to successive elements of *array* (covered in Ch 35) |
| `-u fd` | Read from file descriptor *fd* instead of standard input |

```bash
read -r -p "Enter one or more values > "
echo "REPLY = '$REPLY'"

# Password-style input with a 10-second timeout
if read -r -s -t 10 -p "Enter secret passphrase > " secret_pass; then
    echo -e "\nSecret passphrase = '$secret_pass'"
else
    echo -e "\nInput timed out" >&2
    exit 1
fi
```

### 20. Default Values with `-e -i` (Ch 28)

```bash
read -e -p "What is your user name? " -i "$USER"
echo "You answered: '$REPLY'"
```

Pressing **Enter** without typing accepts the default; the user can also edit it with the standard Readline keys.

### 21. Word Splitting and `IFS` (Ch 28)

`read` splits input into fields using the characters in **`IFS`** (Internal Field Separator). The default `IFS` contains a space, a tab, and a newline. To process delimited data, set `IFS` *only* for the duration of the `read` command:

```bash
file_info="$(grep "^$user_name:" /etc/passwd)"
IFS=":" read -r user pw uid gid name home shell <<< "$file_info"
echo "Full Name = '$name'"
```

Two new pieces of syntax appear here:

- A variable assignment placed *before* a command applies only to that command — `IFS=":"` does **not** persist after `read` returns.
- The `<<<` operator is a **here string**: it feeds the contents of the following word to standard input, the way `<<` feeds a here document.

### 22. You Can't Pipe `read` (Ch 28 sidebar)

It would be natural to write:

```bash
echo "foo" | read       # REPLY is empty afterwards!
```

…but pipelines run each stage in a **subshell**. `read` assigns to `REPLY` *inside the subshell*, and that environment is destroyed the moment the pipeline finishes. The classic workarounds are a here string (`<<< "foo"`) or process substitution (covered in TLCL chapter 36).

### 23. Validating Input (Ch 28)

User input is the most common source of bugs in interactive programs. Always check for the things that can go wrong: empty input, multiple words where one is expected, characters that are not allowed, values out of range, and so on. The chapter's running example combines `[[ ]]`, `(( ))`, control operators, regular expressions, and shell functions:

```bash
invalid_input () {
    echo "Invalid input '$REPLY'" >&2
    exit 1
}

read -r -p "Enter a single item > "

[[ -z "$REPLY" ]] && invalid_input
(( $(echo "$REPLY" | wc -w) > 1 )) && invalid_input

if   [[ "$REPLY" =~ ^-?[[:digit:]]+$ ]];        then echo "'$REPLY' is an integer."
elif [[ "$REPLY" =~ ^-?[[:digit:]]*\.[[:digit:]]+$ ]]; then echo "'$REPLY' is a float."
elif [[ "$REPLY" =~ ^[-[:alnum:]]+$ ]];         then echo "'$REPLY' is a valid filename."
else echo "'$REPLY' is something else." ; fi
```

### 24. Menu-Driven Programs (Ch 28)

A common pattern combines `read` with `if`/`elif` (or `case`, covered in Ch 31) to present a menu and act on the user's selection:

```bash
echo "
Please Select:

  1. Display System Information
  2. Display Disk Space
  3. Display Home Space Utilization
  0. Quit
"
read -p "Enter selection [0-3] > "

if [[ -z "$REPLY" ]]; then
    echo "No selection." >&2
elif [[ "$REPLY" == 1 ]]; then
    echo "Hostname: $HOSTNAME"; uptime
elif [[ "$REPLY" == 2 ]]; then
    df -h
elif [[ "$REPLY" == 3 ]]; then
    du -sh "$HOME"
elif [[ "$REPLY" == 0 ]]; then
    echo "Goodbye."
else
    echo "Invalid selection." >&2
fi
```

This is the natural endpoint of the module — the script accepts arguments (Ch 32), branches on test results (Ch 27), and reads input from the user (Ch 28).

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---------|---------|
| `$0` | Pathname of the running script (never affected by `shift`) |
| `$1`–`$9`, `${10}+` | Positional parameters holding command-line arguments |
| `$#` | Number of positional parameters |
| `"$@"` | All positional parameters as separate, double-quoted words (the safe default) |
| `"$*"` | All positional parameters as a single double-quoted word, joined by `IFS[0]` |
| `shift [n]` | Drop `$1` (or the first *n* parameters); `$#` decreases accordingly |
| `getopts` | Built-in short-option parser; populates `OPTARG` and `OPTIND` |
| `if … then … [elif … then …] [else …] fi` | Conditional branching |
| `test` / `[ ]` | POSIX conditional expression command |
| `[[ ]]` | bash conditional command with `=~` regex and `==` glob matching |
| `(( ))` | Arithmetic truth test (true if non-zero) |
| `&&`, `\|\|` | Control operators — branch on previous command's exit status |
| `true`, `false` | Always-succeed and always-fail builtins |
| `read [-rsptedinau] [vars…]` | Read one line of standard input |
| `IFS=":" read …` | Per-command override of the field separator |
| `<<<` | "Here string" — feed a single string to standard input |

### Conditional Expression Cheat Sheet

| Test | `test` / `[ ]` | `[[ ]]` | `(( ))` |
|---|---|---|---|
| File exists | `-e file` | `-e file` | — |
| String is empty | `-z "$s"` | `-z "$s"` | — |
| Strings equal | `"$a" = "$b"` | `"$a" == "$b"` (glob on right) | — |
| String matches regex | not supported | `"$s" =~ pattern` | — |
| Integers equal | `$a -eq $b` | `"$a" -eq "$b"` | `a == b` |
| Integer less than | `$a -lt $b` | `"$a" -lt "$b"` | `a < b` |
| AND | `-a` | `&&` | `&&` |
| OR | `-o` | `\|\|` | `\|\|` |
| NOT | `!` | `!` | `!` |

### `read` Option Quick Reference

| Option | Purpose | Typical use |
|---|---|---|
| `-p prompt` | Issue *prompt* before reading | Replaces a separate `echo -n` |
| `-r` | Raw — no backslash escapes | **Use almost always** |
| `-s` | Silent — no echo | Passwords, PINs |
| `-t n` | Timeout after *n* seconds | Failsafe interactive prompts |
| `-n n` | Read at most *n* characters | Single-keystroke menus |
| `-d c` | End on character *c* | Reading null-terminated records |
| `-e` | Use Readline editing | Friendly prompts |
| `-i str` | Default value (with `-e`) | Pre-fill the user's name |
| `-a array` | Read into an array | Tokenizing a single line |
| `-u fd` | Read from file descriptor *fd* | Reading lines from a file in a `while` loop |

### Tips for Success

1. Quote your variables in test expressions — `[ -z "$x" ]` is safe; `[ -z $x ]` breaks when `$x` is empty or contains spaces.
2. Prefer `[[ ]]` and `(( ))` to `[ ]` for new bash code — they are easier to read and cleaner about word splitting and special characters. Keep `[ ]` for portable POSIX scripts.
3. Always include `-r` with `read` unless you have a specific reason to interpret backslash escapes.
4. Use `"$@"` (with the quotes) when forwarding a script's arguments to another command — it preserves boundaries between arguments containing spaces.
5. Check `$#` early and print a clear `Usage:` message to standard error if the script was called incorrectly.
6. For long, validated input, write a small `invalid_input` shell function and call it from each failure branch — it keeps the validation chain readable.

### Common Pitfalls

- Forgetting that `shift` does **not** affect `$0`. A loop that uses `$0` for a usage message keeps working correctly even after `shift`.
- Writing `$10` instead of `${10}`. The first form expands as `$1` followed by the literal `0`.
- Comparing strings with `=` inside `(( ))` — `(( ))` is for *integers* only. Use `[[ "$a" == "$b" ]]` for strings.
- Forgetting the colon after `f` in the `getopts` optstring `":f:ih"`. Without it, `getopts` does not consume the option's argument and `OPTARG` is empty.
- Writing `if [ $# = 2 ] then` (missing semicolon). `if … then` requires either a semicolon between *list* and `then`, or a newline.
- Trying to use `echo X | read VAR` to capture input. The `read` runs in a subshell; `VAR` is empty in the parent shell. Use `<<<` or process substitution instead.
- Forgetting the `-r` flag on `read`, allowing the shell to swallow backslashes the user typed.
