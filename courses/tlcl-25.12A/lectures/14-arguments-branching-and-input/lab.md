---
title: 'Shell Scripting II: Lab'
subtitle: 'The Linux Command Line — Lecture 14'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir -p ~/flow_lab/bin
cd ~/flow_lab
export PATH="$HOME/flow_lab/bin:$PATH"
# Create a few test files so file-existence tests have something to work on
touch present.txt
mkdir present.d
chmod 644 present.txt
```

### Exercise 1: Viewing the Positional Parameters (10 minutes)

**Task 1.1**: Create a script that echoes its first four positional parameters and the argument count.

```bash
cat > ~/flow_lab/bin/posit-param <<'EOF'
#!/bin/bash
# posit-param: view command line parameters

echo "Number of arguments: $#"
echo "\$0 = $0"
echo "\$1 = $1"
echo "\$2 = $2"
echo "\$3 = $3"
echo "\$4 = $4"
EOF
chmod 755 ~/flow_lab/bin/posit-param
```

**Task 1.2**: Run it with no arguments, then with four arguments, and observe the output.

```bash
posit-param
posit-param alpha bravo charlie delta
```

**Task 1.3**: Try to access a tenth argument *without* using braces, then with braces.

```bash
posit-param a b c d e f g h i j
# add to the end of posit-param:  echo "tenth (no braces): $10"
# add to the end of posit-param:  echo "tenth (braces):    ${10}"
vim ~/flow_lab/bin/posit-param
posit-param a b c d e f g h i j
```

**Task 1.4**: Show that `$0` always points to the script regardless of arguments.

```bash
posit-param
posit-param one two
```

**Questions to answer:**

1. What is the value of `$0` when you run `posit-param` from `PATH`? Why does it not say `posit-param`?
2. What does `$10` expand to *without* braces, and why?
3. What does `$#` show when you run `posit-param` with no arguments?

### Exercise 2: Walking Many Arguments with `shift` (10 minutes)

**Task 2.1**: Write a script that uses a `while` loop and `shift` to print every positional parameter it receives.

```bash
cat > ~/flow_lab/bin/walk-args <<'EOF'
#!/bin/bash
# walk-args: print each argument using shift

count=1
while [[ $# -gt 0 ]]; do
    echo "Argument $count = $1"
    count=$((count + 1))
    shift
done
echo "After the loop: \$# = $#"
EOF
chmod 755 ~/flow_lab/bin/walk-args
```

**Task 2.2**: Run it with a small argument list, then a larger one.

```bash
walk-args a b c
walk-args one two three four five six seven
```

**Task 2.3**: Use pathname expansion to feed the script a real-world list.

```bash
walk-args /etc/host*
walk-args ~/flow_lab/*
```

**Task 2.4**: Confirm that `$0` is unchanged by `shift`.

```bash
# Add: echo "After loop: \$0 = $0"   then re-run
vim ~/flow_lab/bin/walk-args
walk-args x y z
```

**Questions to answer:**

1. What does `shift` do to `$1`, `$2`, and `$#` each time it runs?
2. Why does the loop eventually exit?
3. Did `$0` change after the loop ran?

### Exercise 3: Parsing Long Options with `case` (10 minutes)

**Task 3.1**: Create a script that accepts `-f file` / `--file file`, `-i` / `--interactive`, and `-h` / `--help`.

```bash
cat > ~/flow_lab/bin/long-opts <<'EOF'
#!/bin/bash
# long-opts: parse long-form options with case + shift

PROGNAME="$(basename "$0")"
interactive=
filename=

usage () {
    echo "$PROGNAME: usage: $PROGNAME [-f file | --file file] [-i | --interactive] [-h | --help]"
}

while [[ -n "$1" ]]; do
    case "$1" in
        -f | --file)        shift; filename="$1" ;;
        -i | --interactive) interactive=1 ;;
        -h | --help)        usage; exit ;;
        *)                  usage >&2; exit 1 ;;
    esac
    shift
done

echo "interactive = '$interactive'"
echo "filename    = '$filename'"
EOF
chmod 755 ~/flow_lab/bin/long-opts
```

**Task 3.2**: Try several invocations and confirm the parsing is correct.

```bash
long-opts
long-opts -i
long-opts --file foo.html
long-opts --interactive --file bar.html
long-opts --help
long-opts --bogus
```

**Task 3.3**: Predict, *before running it*, what will happen if you swap the order:

```bash
long-opts -f
```

Then run it and explain.

**Questions to answer:**

1. Why is there a `shift` *inside* the `-f` branch and another `shift` at the bottom of the loop?
2. What did `--bogus` do, and which `case` branch caught it?
3. What goes wrong with `long-opts -f` (no filename), and how could you defend against it?

### Exercise 4: Parsing Short Options with `getopts` (10 minutes)

**Task 4.1**: Build a script that supports `-f file`, `-i`, and `-h` using `getopts`.

```bash
cat > ~/flow_lab/bin/short-opts <<'EOF'
#!/bin/bash
# short-opts: parse short options with getopts

PROGNAME="$(basename "$0")"
interactive=
filename=

usage () {
    echo "$PROGNAME: usage: $PROGNAME [-f file] [-i] [-h]"
}

while getopts ":f:ih" opt; do
    case "$opt" in
        f)  filename="$OPTARG" ;;
        i)  interactive=1 ;;
        h)  usage; exit ;;
        \?) echo "$PROGNAME: invalid option '-$OPTARG'" >&2 ;;
        :)  echo "$PROGNAME: option '-$OPTARG' requires an argument" >&2 ;;
    esac
done

echo "interactive = '$interactive'"
echo "filename    = '$filename'"
EOF
chmod 755 ~/flow_lab/bin/short-opts
```

**Task 4.2**: Show that single-letter options can be combined.

```bash
short-opts -if foo.html
short-opts -i -f foo.html
```

**Task 4.3**: Trigger the two error branches.

```bash
short-opts -a
short-opts -f
```

**Task 4.4**: Confirm that `OPTIND` advances past the parsed options.

```bash
# Add at the bottom of the script:  echo "OPTIND = $OPTIND"
vim ~/flow_lab/bin/short-opts
short-opts -i -f foo.html extra1 extra2
```

**Questions to answer:**

1. Why does the optstring `":f:ih"` have a leading colon and a colon after `f`?
2. What did `-if foo.html` do that the `case`/`shift` version of Exercise 3 could *not* do as cleanly?
3. What does `OPTIND` represent?

### Exercise 5: Exit Status and Control Operators (10 minutes)

**Task 5.1**: Inspect `$?` after a successful and a failing command.

```bash
ls -d /usr/bin
echo $?
ls -d /bin/usr
echo $?
```

**Task 5.2**: Use `true` and `false` to confirm the exit status convention.

```bash
true;  echo $?
false; echo $?
```

**Task 5.3**: Use `&&` and `||` for two-step decisions.

```bash
mkdir temp && cd temp
pwd
cd ..
[[ -d temp ]] || mkdir temp     # already exists, so mkdir is skipped
[[ -d nope ]] || mkdir nope
ls -d temp nope
```

**Task 5.4**: Use `||` to bail out of a script.

```bash
[[ -d nope ]] || { echo "nope is missing — bailing"; exit 1; } 2>/dev/null
echo "(this only prints if nope existed)"
rmdir temp nope
```

**Questions to answer:**

1. What value does `echo $?` print after `false`?
2. Why does `mkdir temp && cd temp` change directory, but `mkdir /etc && cd /etc` would not?
3. What is the practical difference between `cmd1 && cmd2` and `if cmd1; then cmd2; fi`?

### Exercise 6: `if` with `test`, `[[ ]]`, and `(( ))` (15 minutes)

**Task 6.1**: Write `test-file`, which classifies a file given on the command line.

```bash
cat > ~/flow_lab/bin/test-file <<'EOF'
#!/bin/bash
# test-file: evaluate a file given as $1

FILE="$1"

if [[ -e "$FILE" ]]; then
    [[ -f "$FILE" ]] && echo "$FILE is a regular file."
    [[ -d "$FILE" ]] && echo "$FILE is a directory."
    [[ -r "$FILE" ]] && echo "$FILE is readable."
    [[ -w "$FILE" ]] && echo "$FILE is writable."
    [[ -x "$FILE" ]] && echo "$FILE is executable/searchable."
else
    echo "$FILE does not exist." >&2
    exit 1
fi
EOF
chmod 755 ~/flow_lab/bin/test-file
test-file ~/flow_lab/present.txt
test-file ~/flow_lab/present.d
test-file /nope
```

**Task 6.2**: Write `test-string`, which evaluates a string variable.

```bash
cat > ~/flow_lab/bin/test-string <<'EOF'
#!/bin/bash
# test-string: evaluate a string

ANSWER="${1:-maybe}"

if [[ -z "$ANSWER" ]]; then
    echo "There is no answer." >&2
    exit 1
fi

if   [[ "$ANSWER" == "yes"   ]]; then echo "The answer is YES."
elif [[ "$ANSWER" == "no"    ]]; then echo "The answer is NO."
elif [[ "$ANSWER" == "maybe" ]]; then echo "The answer is MAYBE."
else echo "The answer is UNKNOWN." ; fi
EOF
chmod 755 ~/flow_lab/bin/test-string
test-string yes
test-string no
test-string maybe
test-string banana
```

**Task 6.3**: Write `test-integer`, using `(( ))` for the arithmetic comparisons.

```bash
cat > ~/flow_lab/bin/test-integer <<'EOF'
#!/bin/bash
# test-integer: evaluate an integer using (( ))

INT="${1:-0}"

if [[ ! "$INT" =~ ^-?[0-9]+$ ]]; then
    echo "INT '$INT' is not an integer." >&2
    exit 1
fi

if   ((INT == 0)); then echo "INT is zero."
elif ((INT < 0));  then echo "INT is negative."
else                    echo "INT is positive."
fi

if (( (INT % 2) == 0 )); then echo "INT is even."; else echo "INT is odd."; fi
EOF
chmod 755 ~/flow_lab/bin/test-integer
test-integer 0
test-integer -7
test-integer 42
test-integer abc
```

**Task 6.4**: Combine expressions: write a one-line `if` that succeeds only when `INT` is between 1 and 100.

```bash
INT=50
if [[ "$INT" -ge 1 && "$INT" -le 100 ]]; then echo "in range"; else echo "out"; fi
INT=200
if [[ "$INT" -ge 1 && "$INT" -le 100 ]]; then echo "in range"; else echo "out"; fi
```

**Questions to answer:**

1. Why are the parameters quoted as `"$FILE"` and `"$ANSWER"` inside `[[ ]]`?
2. Why does `test-integer abc` exit cleanly instead of crashing inside the `(( ))` test?
3. What does the `${1:-0}` syntax do when no argument is supplied?

### Exercise 7: `read` Basics and Options (15 minutes)

**Task 7.1**: Read a single value with a prompt.

```bash
cat > ~/flow_lab/bin/say-hello <<'EOF'
#!/bin/bash
read -r -p "What is your name? " name
echo "Hello, $name!"
EOF
chmod 755 ~/flow_lab/bin/say-hello
say-hello
```

**Task 7.2**: Read multiple values into multiple variables.

```bash
cat > ~/flow_lab/bin/three <<'EOF'
#!/bin/bash
echo -n "Enter three values > "
read -r a b c
echo "a='$a'  b='$b'  c='$c'"
EOF
chmod 755 ~/flow_lab/bin/three
three                       # try with two, three, and five inputs
```

**Task 7.3**: Use `-s` and `-t` to read a "secret" with a timeout.

```bash
cat > ~/flow_lab/bin/secret <<'EOF'
#!/bin/bash
if read -r -s -t 8 -p "Enter secret passphrase > " pass; then
    echo -e "\nGot a $((${#pass})) character passphrase."
else
    echo -e "\nInput timed out." >&2
    exit 1
fi
EOF
chmod 755 ~/flow_lab/bin/secret
secret           # type something quickly
secret           # let it time out
```

**Task 7.4**: Provide a default value with `-e -i`.

```bash
read -e -p "Enter a username [$USER] > " -i "$USER"
echo "Got: '$REPLY'"
```

**Questions to answer:**

1. What is in `REPLY` after a `read` with no variable name listed?
2. What happens in Task 7.2 when you enter five values into three variables?
3. Why is the `-r` option recommended for almost every `read`?

### Exercise 8: `IFS`, Here Strings, and Validating Input (10 minutes)

**Task 8.1**: Split a `/etc/passwd` line into fields with `IFS` and a here string.

```bash
cat > ~/flow_lab/bin/show-user <<'EOF'
#!/bin/bash
read -r -p "Enter a username > " user_name
file_info="$(grep "^$user_name:" /etc/passwd)"

if [[ -n "$file_info" ]]; then
    IFS=":" read -r user pw uid gid name home shell <<< "$file_info"
    echo "User       = '$user'"
    echo "UID        = '$uid'"
    echo "GID        = '$gid'"
    echo "Full Name  = '$name'"
    echo "Home Dir.  = '$home'"
    echo "Shell      = '$shell'"
else
    echo "No such user '$user_name'." >&2
    exit 1
fi
EOF
chmod 755 ~/flow_lab/bin/show-user
show-user                  # try entering your own username, then "nobody", then "ghost"
```

**Task 8.2**: Demonstrate the "you can't pipe `read`" pitfall.

```bash
echo "foo" | read -r value
echo "value = '$value'"          # empty!
read -r value <<< "foo"
echo "value = '$value'"          # 'foo'
```

**Task 8.3**: Validate input — accept only an integer between 1 and 100.

```bash
cat > ~/flow_lab/bin/get-int <<'EOF'
#!/bin/bash
# get-int: read and validate an integer

read -r -p "Enter an integer between 1 and 100 > "

if [[ -z "$REPLY" ]]; then
    echo "Empty input." >&2; exit 1
fi
if ! [[ "$REPLY" =~ ^-?[0-9]+$ ]]; then
    echo "'$REPLY' is not an integer." >&2; exit 1
fi
if (( REPLY < 1 || REPLY > 100 )); then
    echo "'$REPLY' is out of range." >&2; exit 1
fi
echo "Accepted: $REPLY"
EOF
chmod 755 ~/flow_lab/bin/get-int
get-int                     # try: 50, abc, -3, 999, blank
```

**Questions to answer:**

1. Why is `IFS=":"` placed before `read` instead of being assigned on its own line?
2. Why does `echo "foo" | read value` leave `$value` empty?
3. List one input each that triggers each of the three validation branches in `get-int`.

### Exercise 9: A Tiny Menu-Driven Program (10 minutes)

**Task 9.1**: Build a script that combines argument parsing, branching, and `read` into a small menu.

```bash
cat > ~/flow_lab/bin/sysmenu <<'EOF'
#!/bin/bash
# sysmenu: tiny menu combining $@, if, and read

PROGNAME="$(basename "$0")"

# Allow a one-shot mode via -1 <selection>
if [[ "$1" == "-1" && -n "$2" ]]; then
    selection="$2"
else
    echo "
$PROGNAME — main menu
  1) Hostname and uptime
  2) Disk space
  3) Home space
  0) Quit
"
    read -r -p "Enter selection [0-3] > " selection
fi

if   [[ "$selection" == 1 ]]; then echo "Hostname: $HOSTNAME"; uptime
elif [[ "$selection" == 2 ]]; then df -h
elif [[ "$selection" == 3 ]]; then du -sh "$HOME" 2>/dev/null
elif [[ "$selection" == 0 ]]; then echo "Goodbye."
else echo "Invalid selection: '$selection'" >&2; exit 1; fi
EOF
chmod 755 ~/flow_lab/bin/sysmenu
```

**Task 9.2**: Run the program in interactive mode.

```bash
sysmenu                # try several selections, including invalid ones
```

**Task 9.3**: Run the program in non-interactive (one-shot) mode using a positional parameter.

```bash
sysmenu -1 1
sysmenu -1 2
sysmenu -1 9         # invalid
```

**Questions to answer:**

1. Which features from each of the three chapters does `sysmenu` use?
2. How would you extend it to also accept long-form `--once 1`?
3. Why is the input `selection` quoted as `"$selection"` inside every test?

### Lab Cleanup

```bash
rm -rf ~/flow_lab
# To restore PATH, simply open a new terminal — the export was session-only.
```

---

## Challenge Section

**Challenge 1: Explain the Difference**

In one or two sentences each, explain the difference between:

1. `$*` and `$@` (unquoted)
2. `"$*"` and `"$@"` (quoted)
3. `[ ]` and `[[ ]]`
4. `[[ ]]` and `(( ))`
5. `if cmd1; then cmd2; fi` and `cmd1 && cmd2`

**Challenge 2: Predict the Output**

Assume `set -- one "two three" four`. Write the output you expect from each command before running it.

```bash
echo "$#"
echo "$1"
echo "$2"
for a in $*;   do echo "[$a]"; done
for a in "$*"; do echo "[$a]"; done
for a in $@;   do echo "[$a]"; done
for a in "$@"; do echo "[$a]"; done
```

**Challenge 3: True or False**

Mark each statement true or false and justify briefly.

1. `$0` is renumbered to `$1` after the first `shift`.
2. `getopts` automatically supports long options like `--file`.
3. The exit status `0` means **failure** in bash.
4. `[[ "$x" == foo.* ]]` performs *regular expression* matching.
5. `read` will populate the `REPLY` variable if you do not list any variables to read into.
6. Variables inside `(( ))` must be referenced with a `$`.
7. A pipeline like `echo foo | read x` reliably assigns `foo` to `x`.

**Challenge 4: Debug the Script**

The following script is meant to add two integers given on the command line. It contains **three independent bugs**. Identify each one and write a corrected version.

```bash
#!/bin/bash
# add: add two integers

if [ $# = 2 ] then
    echo $(($1 + $2))
fi
```

**Challenge 5: Practical — Range Checker**

Write a script `range` that takes three arguments: an integer `$1`, a low bound `$2`, and a high bound `$3`. It should print `in` if `$1` is between the bounds *inclusive*, and `out` otherwise. It must reject (with a usage error on standard error and exit status 1) any invocation where the wrong number of arguments is supplied or any of the three arguments is not an integer.

**Challenge 6: Predict the Output**

Given:

```bash
INT=42
```

predict the output of each command before running it.

```bash
[[ "$INT" -gt 0 ]] && echo positive
(( INT > 0 ))    && echo positive
[[ "$INT" =~ ^[0-9]+$ ]] && echo digits
[ "$INT" -gt 0 -a "$INT" -lt 100 ] && echo "in range"
[[ "$INT" -gt 0 && "$INT" -lt 100 ]] && echo "in range"
```

**Challenge 7: Convert `case` to `getopts`**

Take the `long-opts` script from Exercise 3 and rewrite it as a `getopts` version named `short-opts2` that supports `-f file`, `-i`, and `-h`. Compare the two implementations: where is the `case`/`shift` version more flexible? Where is `getopts` shorter?

**Challenge 8: Practical — Robust Username Lookup**

Write a script `userinfo` that:

1. Accepts a username as `$1`. If `$1` is missing, prompts the user with `read`.
2. Looks the username up in `/etc/passwd` using `grep`.
3. If found, splits the matching line on `:` (using `IFS` and a here string) and prints the user's UID, full name, home directory, and shell on separate lines.
4. If not found, prints `userinfo: no such user 'NAME'` on standard error and exits with status 1.

**Challenge 9: Scenario — Defensive Validation**

You receive an integer from the user via `read -r -p "Enter integer > "`. Write the smallest piece of code that rejects all of the following inputs with an error on standard error: an empty line, a line containing letters, a line containing a decimal point, a value below 0, and a value above 1000. Accepted inputs should print `OK <value>`.

**Challenge 10: Practical — Wrap a Command**

Write a one-line shell function `safe_grep` that calls `grep "$@"` but redirects standard error to `/dev/null`. Explain why `"$@"` (quoted) is required here and why `$*` would not work.

**Challenge 11: Read with a Timeout**

Write a script `count-down` that prints `Press Enter within 5 seconds...` and uses `read -t 5`. If the user presses Enter, it prints `Got it!`; otherwise, it prints `Too slow.` and exits with status 1. Use the *exit status* of `read`, not a separate variable.

**Challenge 12: Putting It All Together**

Write a script `~/bin/diskreport` that:

1. Defines `PROGNAME` from `$0`.
2. Accepts `-q` / `--quiet` (suppress headings) and `-d dir` / `--dir dir` (report on `dir` instead of `$HOME`) using either parser style.
3. If neither option is supplied **and** standard input is a terminal, prompts the user with `read -r -p "Directory to report on [$HOME]: "` and uses `$HOME` as the default if the response is empty.
4. Validates that the chosen directory exists; if not, exits with status 1 and an error to standard error.
5. Prints (omitting the headings if `-q`):
   - `Disk space:` followed by `df -h <dir>`
   - `Directory size:` followed by `du -sh <dir>`
6. Returns exit status `0` on success.

Explain in one or two sentences how each of the three chapter topics shows up in your script.

---
