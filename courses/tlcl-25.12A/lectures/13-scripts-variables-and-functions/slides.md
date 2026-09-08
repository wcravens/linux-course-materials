---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Shell Scripting: Scripts, Variables, and Functions'
info: |
  ## The Linux Command Line — Lecture 13
  Scripts, Variables, and Functions. Adapted from TLCL chapters 24, 25, and 26.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Shell Scripting

Scripts, Variables, and Functions

The Linux Command Line

Lecture 13

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain what a shell script is, the role of the shebang, and how script execution differs from interactive command entry
- Create, permission, and locate shell scripts so they can be invoked like any other command through `PATH`
- Use variables and constants with parameter expansion to avoid repetition and improve maintainability
- Produce multiline output with quoted `echo` strings and here documents, and predict which expansions occur in each form
- Apply top-down design by decomposing scripts into shell functions, using stubs to keep scripts runnable
- Use local variables and function-level redirection to write independent, portable, reusable functions

---
layout: section
---

# What Is a Shell Script?

A **shell script** is an ordinary text file that contains a series of commands the shell reads and executes as if typed at the prompt.

---

# The Shell Is Both

- A **command line interface** — interactive use at the prompt
- A **scripting language interpreter** — running files of commands
- Almost anything you can do at the prompt, you can do in a script
- Almost anything you can do in a script, you can do at the prompt

---

# Three Requirements to Run a Script

1. **Write** the script in a text editor (`vim`, `gedit`, `kate`, `nano`)
2. **Make it executable** with `chmod`
3. **Place it where the shell can find it** — either in a `PATH` directory, or invoke with an explicit pathname

---
layout: section
---

# The Shebang and Script Format

The first line of every shell script should be a **shebang** (`#!`) that tells the kernel which interpreter to use.

---

# Anatomy of a First Script

```bash
#!/bin/bash

# This is our first script.
echo 'Hello World!'        # trailing comments are allowed
```

- Line 1: **shebang** — looks like a comment but is read by the kernel
- Comments begin with `#` and run to end of line
- Comments may appear on their own line or after a command (preceded by whitespace)

---

# Why "Shebang"?

- `#!` is only recognized when it is the **very first two bytes** of the file
- A blank line before it disables it
- The kernel reads the rest of the line as the path to the interpreter
- Every shell script should start with `#!/bin/bash`

---
layout: section
---

# Executable Permissions

Scripts must be made executable before they can be run. Use `chmod` to set the mode.

---

# Common Modes for Scripts

| Mode | Symbolic | Who can execute | Use |
|------|----------|-----------------|-----|
| `755` | `rwxr-xr-x` | Everyone | Scripts shared with other users |
| `700` | `rwx------` | Owner only | Personal scripts |

```bash
chmod 755 hello_world
ls -l hello_world
# -rwxr-xr-x 1 me me 63 ... hello_world
```

Scripts must also be **readable** — the shell has to read the file to interpret it.

---
layout: section
---

# Script Location and PATH

The shell only finds scripts by bare name if they are in a directory listed in `PATH`.

---

# Running a Script by Path vs. by Name

```bash
./hello_world      # explicit pathname — always works
hello_world        # bare name — only works if on PATH
# bash: hello_world: command not found
```

- `PATH` is a colon-separated list of directories
- View with `echo $PATH`
- Typical entries: `/usr/local/bin`, `/usr/bin`, `/bin`, and `~/bin`

---

# Good Locations for Scripts

| Location | Intended audience |
|----------|-------------------|
| `~/bin` | Personal scripts for the current user |
| `/usr/local/bin` | Scripts shared with all users on the system |
| `/usr/local/sbin` | Scripts for system administrators |

- Locally supplied software lives under `/usr/local`
- `/bin` and `/usr/bin` are reserved for distribution-provided files (FHS)

---

# Adding ~/bin to PATH

Put this in `~/.bashrc`:

```bash
export PATH=~/bin:"$PATH"
```

Re-read `.bashrc` in the current session with the `source` / dot command:

```bash
. ~/.bashrc
```

On Ubuntu, `~/bin` is added automatically *if it exists at login time*.

---
layout: section
---

# Formatting for Readability

Scripts are read far more often than they are written. Two tricks help future-you understand the code.

---

# Long Option Names

Short options are nice at the prompt; **long** options are better in scripts.

```bash
ls -ad                           # short — easy to type
ls --all --directory             # long — easy to read
```

---

# Line Continuation and Indentation

Split a long command with backslashes; indent continuations to show structure.

```bash
find playground \
    \( \
        -type f \
        -not -perm 0600 \
        -exec chmod 0600 '{}' ';' \
    \) \
    -or \
    \( \
        -type d \
        -not -perm 0700 \
        -exec chmod 0700 '{}' ';' \
    \)
```

---
layout: section
---

# Starting a Project: The Minimal Document

Programs are built up in **stages**. Start small, verify it runs, then add features.

---

# Stage 1: A Well-Formed HTML Document

```bash
#!/bin/bash
# Program to output a system information page

echo "<html>
    <head>
         <title>Page Title</title>
    </head>
    <body>
         Page body.
    </body>
</html>"
```

- A single quoted string may span multiple lines
- The shell keeps reading until the closing `"` is seen
- `PS2` (`> `) prompts at the shell until the quote closes

---
layout: section
---

# Variables and Constants

A **variable** is created simply by assigning a value — no declaration required.

---

# Declaring and Using Variables

```bash
TITLE="System Information Report For $HOSTNAME"
echo "<h1>$TITLE</h1>"
```

**Rules for variable names:**

- Letters, digits, and underscores only
- First character must be a letter or underscore
- No spaces or punctuation

**No spaces around `=`:**

```bash
TITLE="Report"       # correct
TITLE = "Report"     # WRONG — shell runs TITLE as a command
```

---

# Variables vs. Constants (Convention)

The shell treats them identically, but **programmers** distinguish by case:

| Style | Meaning | Example |
|-------|---------|---------|
| `UPPER_CASE` | Constant (value does not change) | `TITLE`, `HOSTNAME`, `PATH` |
| `lower_case` | True variable (value changes) | `filename`, `count`, `i` |

To **enforce** immutability:

```bash
declare -r TITLE="Page Title"    # read-only
declare -i COUNT=0               # integer-only
```

---

# The Silent Misspelling Problem

```bash
foo="yes"
echo $foo
# yes
echo $fool
#             <- blank! shell created $fool as empty
```

Referencing an unset variable **silently expands to nothing**. This can break commands that require arguments:

```bash
cp $foo $fool
# cp: missing destination file operand
```

Defensive practice: always double-quote expansions — `"$var"`.

---

# Assignment Forms

```bash
a=z                            # literal string
b="a string"                   # spaces need quotes
c="a string and $b"            # parameter expansion
d="$(ls -l foo.txt)"           # command substitution
e=$((5 * 7))                   # arithmetic expansion
f="\t\ta string\n"             # escape sequences
a=5 b="a string"               # multiple assignments on one line
```

---

# Braces for Disambiguation

```bash
filename="myfile"
touch "$filename"
mv "$filename" "${filename}1"    # renames myfile -> myfile1
```

Without braces the shell tries to expand `$filename1` — a different variable name.

---
layout: section
---

# Here Documents

A **here document** is a form of I/O redirection that embeds a block of text in the script and feeds it to a command's standard input.

---

# Basic Form

```
command << TOKEN
text
TOKEN
```

- `TOKEN` is any string the programmer chooses (`_EOF_` is a common convention)
- The closing token must appear alone on its line with **no leading/trailing whitespace**

```bash
cat << _EOF_
<html>
    <head><title>$TITLE</title></head>
    <body><h1>$TITLE</h1></body>
</html>
_EOF_
```

---

# Expansion Rules

| Form | Parameter / Command / Arithmetic | Quotes inside |
|------|----------------------------------|----------------|
| `<< TOKEN` | Performed | Literal |
| `<< 'TOKEN'` | Suppressed | Literal |

```bash
foo="some text"
cat << _EOF_          # expansions happen
$foo                  #   -> some text
"$foo"                #   -> "some text"
_EOF_

cat << '_EOF_'        # token quoted — expansions suppressed
$foo                  #   -> $foo
"$foo"                #   -> "$foo"
_EOF_
```

---

# Indented Here Documents with `<<-`

`<<-` strips **leading tab characters** so you can indent the body for readability.

```bash
cat <<- _EOF_
	<html>
	<body>Report</body>
	</html>
	_EOF_
```

- Only **tabs** are stripped — spaces are kept verbatim
- Editors that convert tabs to spaces will defeat this feature

---
layout: section
---

# Top-Down Design

Break a large task into progressively smaller steps. Each refined step becomes a **shell function**.

---

# Example: "Go to the Market"

```
1. Get in car
2. Drive to market
3. Park car
4. Enter market
5. Purchase food
6. Return to car
7. Drive home
```

"Park car" refines further:

```
3.1 Find parking space
3.2 Drive car into space
3.3 Turn off motor
3.4 Set parking brake
3.5 Exit car
3.6 Lock car
```

---

# Applied to the Report Script

High-level steps for the HTML report:

1. Open page / header / title / body
2. Output heading and timestamp
3. Output **uptime** section
4. Output **disk space** section
5. Output **home space** section
6. Close body / page

Each numbered section becomes a **shell function** such as `report_uptime`, `report_disk_space`, `report_home_space`.

---
layout: section
---

# Shell Functions

A **shell function** is a mini-script defined inside a larger script. Two equivalent forms exist.

---

# Two Syntactic Forms

```bash
# Formal form
function name {
    commands
    return
}

# Short form (preferred)
name () {
    commands
    return
}
```

- Function names follow the **same rules** as variable names
- The function must contain at least one command; `return` (optional) satisfies it
- **Definitions must appear before calls** — the shell reads top to bottom

---

# A Working Example

```bash
#!/bin/bash
# Shell function demo

function step2 {
    echo "Step 2"
    return
}

# Main program starts here
echo "Step 1"
step2
echo "Step 3"
```

Output:

```
Step 1
Step 2
Step 3
```

---

# Stubs: Keep the Script Running

Define empty functions first; flesh them out one at a time.

```bash
report_uptime () {
    echo "Function report_uptime executed."
    return
}

report_disk_space () {
    echo "Function report_disk_space executed."
    return
}
```

- Running the script frequently localizes new bugs to the most recent change
- Stubs verify the logical **flow** before the content exists

---
layout: section
---

# Local Variables

Variables declared with `local` inside a function exist only while the function is running.

---

# The `local` Keyword

```bash
foo=0    # global
funct_1 () {
    local foo    # separate variable, local to funct_1
    foo=1
    echo "funct_1: foo = $foo"
}
funct_1
echo "global: foo = $foo"
```

Output:

```
funct_1: foo = 1
global:  foo = 0
```

---

# Why Use `local`?

- Prevents functions from **accidentally overwriting** variables in the caller
- Allows functions to be **independent** of each other
- Makes functions **portable** — you can copy them between scripts without name conflicts
- Essential discipline as scripts grow

---
layout: section
---

# Shell Functions and Redirection

A function body is a **group command** — its combined output can be redirected or piped as a single unit.

---

# Redirect, Pipe, Capture

```bash
my_funct () {
    echo "My Documents"
    ls ~/Documents
    echo "My Music"
    ls ~/Music
}

my_funct > my_directories.txt     # redirect to a file
my_funct | sort                   # pipe through sort
my_var="$(my_funct)"              # capture into a variable
my_funct < input.txt              # feed stdin to commands inside
```

---

# Functions Instead of Aliases

Shell functions are the **preferred replacement for aliases** in `~/.bashrc`.

```bash
ds () {
    echo "Disk Space Utilization For $HOSTNAME"
    df -h
}
```

- Functions accept arguments; aliases do not
- Functions can contain conditionals, loops, redirection
- Place reusable functions in `~/.bashrc` to make them available in every shell

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir -p ~/scripts_lab/bin
cd ~/scripts_lab
export PATH="$HOME/scripts_lab/bin:$PATH"
```

---

# Exercise 1: Your First Script

Create, permission, and run a trivial script by name.

```bash
cat > ~/scripts_lab/bin/hello_world <<'EOF'
#!/bin/bash
# My very first shell script
echo 'Hello World!'
EOF
chmod 755 ~/scripts_lab/bin/hello_world
hello_world
```

---

# Exercise 2: Variables and Expansion

Watch how misspellings expand silently.

```bash
foo="yes"
echo $foo
echo $fool         # silent empty expansion!
declare -r VERSION="1.0"
VERSION="2.0"      # fails: read-only variable
```

---

# Exercise 3: Minimal HTML with Variables

Build the first version of `sys_info_page`.

```bash
cat > ~/scripts_lab/bin/sys_info_page <<'EOF'
#!/bin/bash
TITLE="System Information Report For $HOSTNAME"
CURRENT_TIME="$(date +"%x %r %Z")"
TIMESTAMP="Generated $CURRENT_TIME, by $USER"

echo "<html>
  <head><title>$TITLE</title></head>
  <body>
    <h1>$TITLE</h1>
    <p>$TIMESTAMP</p>
  </body>
</html>"
EOF
chmod 755 ~/scripts_lab/bin/sys_info_page
sys_info_page
```

---

# Exercise 4: Here Documents

Rewrite using `cat << _EOF_` and compare quoted vs. unquoted tokens.

```bash
foo="some text"

cat << _EOF_
$foo    "$foo"    \$foo
_EOF_

cat << '_EOF_'
$foo    "$foo"    \$foo
_EOF_
```

---

# Exercise 5: Top-Down Design with Stubs

Add three stub functions to `sys_info_page` and verify they run.

```bash
report_uptime ()     { echo "report_uptime executed."; return; }
report_disk_space () { echo "report_disk_space executed."; return; }
report_home_space () { echo "report_home_space executed."; return; }

cat << _EOF_
<body>
    <h1>$TITLE</h1>
    $(report_uptime)
    $(report_disk_space)
    $(report_home_space)
</body>
_EOF_
```

---

# Exercise 6: Local Variables

Show that `local` keeps function and caller separate.

```bash
foo=0
funct_1 () {
    local foo
    foo=1
    echo "funct_1: foo = $foo"
}
funct_1
echo "global: foo = $foo"
```

---

# Lab Cleanup

```bash
rm -rf ~/scripts_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

A script begins with this first line. Will the kernel recognize the shebang? Why or why not?

```bash

#!/bin/bash
echo "hello"
```

**Answer:** No. The first line is **blank**, so the `#!` is no longer the very first two bytes of the file. Remove the blank line.

---

# Challenge 2

Predict the output of each block, given `name="Alice"`.

```bash
cat << END
Hello, $name!
Cost: $((5+5))
END
```

```bash
cat << 'END'
Hello, $name!
Cost: $((5+5))
END
```

**Answer:**

```
Hello, Alice!
Cost: 10
---
Hello, $name!
Cost: $((5+5))
```

Unquoted `END` → expansions happen. Quoted `'END'` → expansions are suppressed.

---

# Challenge 3

Find the **three** bugs in this script and correct them.

```bash
#!/bin/bash
TITLE = "Daily Report"

echo "<p>Generated on $(date) by ${user}</p>"
```

**Answer:**

1. Spaces around `=` — write `TITLE="Daily Report"`.
2. Wrong variable name — `USER` is the environment variable, not `user`. Use `${USER}`.
3. The shebang should be on **line 1** with nothing before it. Ensure the file has no leading blank lines or BOM.

---

# Challenge 4

Write a function `ds` that prints the hostname and `df -h` output, then add it to `~/.bashrc` so it is available in every new shell.

**Answer:**

```bash
ds () {
    echo "Disk Space Utilization For $HOSTNAME"
    df -h
}
```

Append to `~/.bashrc`; reload with `. ~/.bashrc`.

---

# Assessment Questions

1. What does the shebang (`#!/bin/bash`) do, and why must it be on the very first line?
2. What is the difference between the `755` and `700` permission modes, and when would you use each for a script?
3. Why does `hello_world` fail with "command not found" while `./hello_world` works from the same directory?
4. What is the difference between an unquoted here document (`<< _EOF_`) and a quoted one (`<< '_EOF_'`)?
5. Why must a shell function be defined **before** any line that calls it?
6. What problem does the `local` keyword solve inside a shell function?

---

# Summary

Today we learned how to:

- Write, permission, and place shell scripts so they can be invoked like any other command
- Use the shebang, comments, and long-option formatting to make scripts readable
- Assign variables and constants, and use parameter expansion, command substitution, and arithmetic expansion in script values
- Emit multi-line output with quoted strings and here documents, and predict which expansions occur in each form
- Apply top-down design with shell functions and stubs to keep scripts runnable during development
- Use `local` variables and function redirection to write portable, independent, reusable functions

These skills are the foundation of every shell script you will write as a Linux user, administrator, or developer — from a one-line `.bashrc` helper to a multi-thousand-line automation tool.

---

# Additional Resources

- `man bash` — see the sections **SHELL GRAMMAR**, **SHELL FUNCTIONS**, **PARAMETERS**, and **HERE DOCUMENTS**
- `help declare`, `help local`, `help return`, `help source` — built-in help for relevant shell builtins
- *The Linux Command Line* Chapters 24, 25, and 26
- Wikipedia: **Shebang (Unix)** and **Top-down design**
- Keep every new script in a version-controlled `~/bin` directory so you can review and reuse past work
