---
title: 'Shell Scripting'
subtitle: 'The Linux Command Line — Lecture 13'
---

## Learning Objectives

After completing these chapters, you will be able to:

- Explain what a shell script is, describe the role of the shebang, and distinguish script execution from interactive command entry
- Create, permission, and locate shell scripts so they can be invoked like any other command through `PATH`
- Use variables and constants with parameter expansion to avoid repetition and improve script maintainability
- Produce multiline script output using quoted `echo` strings and here documents, and predict which expansions occur inside each form
- Apply top-down design to decompose a script into shell functions, using stubs to keep the program runnable during development
- Use local variables, `return`, and function-level redirection to write independent, portable, and reusable shell functions

## Key Commands Covered

- `chmod 755` — Set common "world-executable" permissions for a script
- `chmod 700` — Set owner-only execute permissions for a script
- `source` (or `.`) — Re-read a shell file in the current session
- `export PATH=~/bin:"$PATH"` — Prepend a directory to the command search path
- `declare -r` — Mark a variable read-only (a true constant)
- `declare -i` — Restrict a variable to integer values
- `cat << TOKEN` / `cat <<- TOKEN` — Feed a here document to a command's standard input
- `local` — Scope a variable to the shell function in which it is defined
- `return` — Exit a shell function, optionally with a status value
- `uptime` — Display system uptime and load averages
- `df -h` — Report disk space in human-readable form
- `du -sh` — Summarize disk usage of a target directory

## Chapter Outline

### 1. What are Shell Scripts? (Ch 24)

A **shell script** is an ordinary text file containing a series of commands. The shell reads the file and carries out each command as though it had been typed interactively at the prompt. Because the shell is both a command interpreter *and* a scripting language, nearly everything you can do on the command line can also be done in a script.

### 2. How to Write a Shell Script (Ch 24)

Creating and running a script requires three things:

1. **Write the script** in a text editor. Editors with syntax highlighting (`vim`, `gedit`, `kate`, `nano` with syntax files) help spot common errors.
2. **Make the script executable** by setting its file permissions.
3. **Put the script somewhere the shell can find it** — either in a directory listed in `PATH`, or invoke it with an explicit pathname.

### 3. Script File Format and the Shebang (Ch 24)

Every shell script should begin with a **shebang** (`#!`) line that tells the kernel which interpreter should run the file. Comments begin with `#` and may appear on their own line or after a command (preceded by whitespace).

```bash
#!/bin/bash

# This is our first script.

echo 'Hello World!'                  # trailing comments are allowed
```

The shebang looks like a comment but is recognized by the kernel only when it is the very first two characters of the file.

### 4. Executable Permissions (Ch 24)

Scripts must be made executable with `chmod`. Two common modes are used:

| Mode | Meaning | When to use |
|---|---|---|
| `755` | Owner `rwx`, group and others `r-x` | Scripts anyone on the system may execute |
| `700` | Owner `rwx`, no access for others | Personal scripts only the owner runs |

```bash
ls -l hello_world
# -rw-r--r-- 1 me me 63 ... hello_world
chmod 755 hello_world
ls -l hello_world
# -rwxr-xr-x 1 me me 63 ... hello_world
```

Scripts must also be **readable** by whoever executes them — the shell needs to read the file to interpret it.

### 5. Script File Location and PATH (Ch 24)

If a script is not in a directory listed in `PATH`, it must be invoked with an explicit pathname (for example, `./hello_world`). Placing the script in a `PATH` directory lets it be called by name like any other command.

```bash
echo $PATH
# /home/me/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:...
mkdir ~/bin
mv hello_world ~/bin
hello_world
# Hello World!
```

If `~/bin` is not already in `PATH`, it can be added by putting this line in `~/.bashrc`:

```bash
export PATH=~/bin:"$PATH"
```

Re-read `.bashrc` in the current session with the dot (source) command:

```bash
. ~/.bashrc
```

**Good locations for scripts:**

| Location | Intended audience |
|---|---|
| `~/bin` | Personal scripts for the current user |
| `/usr/local/bin` | Scripts shared with all users on the system |
| `/usr/local/sbin` | Scripts for system administrators |

Locally supplied software belongs under `/usr/local`, not `/bin` or `/usr/bin`; those are reserved for files managed by the distribution according to the **Filesystem Hierarchy Standard**.

### 6. Formatting for Readability (Ch 24)

Scripts are read far more often than they are written. Two formatting tricks improve readability:

- **Long option names.** Short options (`ls -ad`) save typing at the prompt, but long options (`ls --all --directory`) document intent in a script.
- **Line continuation and indentation.** A long command can be split across lines by ending each continued line with a backslash. Inside scripts, use tabs or spaces to indent the continuation lines.

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

### 7. Starting a Project: The Minimal Document (Ch 25)

Programs are usually built up in stages. The book's running project is a system-information **report generator** that produces an HTML page. The first version produces a well-formed but empty HTML document.

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

A quoted string may span multiple lines — the shell keeps reading until the closing quote. This works on the command line too; the continuation prompt `>` (held in the shell variable `PS2`) appears until the quote is closed.

### 8. Variables and Constants (Ch 25)

A **variable** is created simply by assigning a value to it. The shell does not require declaration. Parameter expansion (`$name` or `${name}`) substitutes the variable's value into a command.

```bash
TITLE="System Information Report For $HOSTNAME"
echo "<h1>$TITLE</h1>"
```

**Rules for variable names:**

1. Names may contain letters, digits, and underscores.
2. The first character must be a letter or underscore.
3. Spaces and punctuation are not allowed.

The shell is **lax** about undefined names: referencing a misspelled variable expands to nothing rather than an error, which can silently break commands that require arguments.

```bash
foo="yes"
echo $foo
# yes
echo $fool
#           (empty — fool was never set)
```

**Variables vs. constants.** The shell makes no technical distinction, but a common convention uses **UPPERCASE** names for values that do not change (constants) and **lowercase** names for values that do (true variables). To enforce immutability, use `declare -r`; to restrict to integers, use `declare -i`.

```bash
declare -r TITLE="Page Title"     # read-only
```

**Assignment forms.** No spaces are permitted around `=`. The value may be any expansion:

```bash
a=z                            # literal string
b="a string"                   # embedded spaces require quotes
c="a string and $b"            # parameter expansion
d="$(ls -l foo.txt)"           # command substitution
e=$((5 * 7))                   # arithmetic expansion
f="\t\ta string\n"             # escape sequences
a=5 b="a string"               # multiple assignments on one line
```

**Curly braces** disambiguate variable names from surrounding text:

```bash
filename="myfile"
mv "$filename" "${filename}1"  # renames myfile -> myfile1
```

It is good practice to enclose variables (and command substitutions) in **double quotes** to prevent word-splitting, especially when the value may contain filenames with spaces.

### 9. Here Documents (Ch 25)

A **here document** is a form of I/O redirection that embeds a block of text in the script and feeds it to a command's standard input. The general form is:

```
command << TOKEN
text
TOKEN
```

`TOKEN` is any string chosen by the programmer (`_EOF_` is a common convention). The closing token must appear alone on its own line with no trailing spaces.

```bash
cat << _EOF_
<html>
    <head><title>$TITLE</title></head>
    <body><h1>$TITLE</h1><p>$TIMESTAMP</p></body>
</html>
_EOF_
```

**Expansion rules:**

| Form | Parameter expansion | Command substitution | Arithmetic expansion | Quotes inside |
|---|---|---|---|---|
| `<< TOKEN` | Performed | Performed | Performed | Treated as literal characters |
| `<< 'TOKEN'` (token quoted) | Suppressed | Suppressed | Suppressed | Treated as literal characters |

Use `<<- TOKEN` (note the dash) to strip **leading tab characters** from the here document body. Spaces are not stripped, so the feature is easily defeated by editors that convert tabs to spaces.

Here documents work with any command that accepts standard input — `cat`, `ftp`, `mail`, `bc`, and others.

### 10. Top-Down Design (Ch 26)

**Top-down design** is the practice of breaking a large task into progressively smaller sub-tasks until each piece is simple enough to implement directly. This stepwise refinement is a natural fit for shell programming: each refined step becomes a small shell function.

For the report generator, the top-level steps are:

1. Open page
2. Open page header
3. Set page title
4. Close page header
5. Open page body
6. Output page heading
7. Output timestamp
8. *(additional sections: uptime, disk space, home space)*
9. Close page body
10. Close page

### 11. Shell Functions (Ch 26)

A **shell function** is a "mini-script" defined inside a larger script. Functions have two equivalent syntactic forms:

```bash
# Formal form
function name {
    commands
    return
}

# Preferred short form
name () {
    commands
    return
}
```

- Function names follow the same rules as variable names.
- A function must contain at least one command; `return` (optional) satisfies the requirement.
- **A function definition must appear in the script before the function is called**, otherwise the shell treats the call as an unknown external command.

```bash
#!/bin/bash
function step2 {
    echo "Step 2"
    return
}
echo "Step 1"
step2
echo "Step 3"
```

**Stubs.** While developing, empty functions (`name () { return; }`) or stubs that merely announce themselves (`echo "report_uptime executed."`) keep the script runnable. Running the program frequently during development makes it easy to localize new bugs to the most recent change.

### 12. Local Variables (Ch 26)

Variables declared inside a function with the `local` keyword are **local** to that function: they do not exist outside it and do not collide with variables of the same name elsewhere in the script.

```bash
foo=0
funct_1 () {
    local foo
    foo=1
    echo "funct_1: foo = $foo"
}
funct_1
echo "global: foo = $foo"
# funct_1: foo = 1
# global:  foo = 0
```

Using `local` makes shell functions **independent** of each other and of their containing script, which in turn makes them **portable** — easy to copy from one script to another without causing name conflicts.

### 13. Shell Functions and Redirection (Ch 26)

The body of a shell function is a **group command**, so its combined output can be redirected or piped as a single unit:

```bash
my_funct () {
    echo "My Documents"
    ls ~/Documents
    echo "My Music"
    ls ~/Music
}

my_funct > my_directories.txt    # redirect combined output to a file
my_funct | sort                  # pipe combined output
my_var="$(my_funct)"             # capture output in a variable
my_funct < input.txt             # feed input to commands inside
```

### 14. Shell Functions in `.bashrc` (Ch 26 sidebar)

Shell functions are the **preferred replacement for aliases** when you want a personal mini-command. Functions can use arguments, conditionals, loops, and redirection — aliases cannot. A useful function placed in `~/.bashrc` becomes available in every new interactive shell.

```bash
ds () {
    echo "Disk Space Utilization For $HOSTNAME"
    df -h
}
```

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---------|---------|
| `chmod 755` / `chmod 700` | Set world-executable / owner-only-executable permissions |
| `./script` | Run a script by explicit relative path |
| `source` / `.` | Re-execute a shell file in the current session |
| `export PATH=...` | Add a directory to the command search path |
| `declare -r` | Mark a variable as read-only (constant) |
| `declare -i` | Restrict a variable to integer values |
| `cat << TOKEN` | Start an unquoted here document (expansions performed) |
| `cat << 'TOKEN'` | Start a quoted here document (expansions suppressed) |
| `cat <<- TOKEN` | Here document that strips leading tabs |
| `local name` | Declare a function-local variable |
| `return` | Exit a shell function |

### Script Anatomy Summary

| Element | Syntax | Example |
|---|---|---|
| Shebang | `#!/path/to/interpreter` | `#!/bin/bash` |
| Full-line comment | `# text` | `# Program to output a page` |
| Trailing comment | `cmd  # text` | `echo hi  # greet` |
| Variable assignment | `name=value` | `TITLE="Report"` |
| Parameter expansion | `$name` or `${name}` | `$TITLE`, `${filename}1` |
| Command substitution | `$(command)` | `NOW="$(date)"` |
| Arithmetic expansion | `$((expr))` | `SUM=$((2+3))` |
| Function (short form) | `name () { cmds; }` | `greet () { echo hi; }` |
| Function (formal form) | `function name { cmds; }` | `function greet { echo hi; }` |
| Here document | `cmd << TOKEN \ntext\nTOKEN` | `cat << _EOF_` |

### Here Document Behavior

| Form | Parameter / Command / Arithmetic Expansion | Quotes Inside | Leading Tabs |
|---|---|---|---|
| `<< TOKEN` | Performed | Literal | Preserved |
| `<< 'TOKEN'` | Suppressed | Literal | Preserved |
| `<<- TOKEN` | Performed | Literal | Stripped |
| `<<- 'TOKEN'` | Suppressed | Literal | Stripped |

### Tips for Success

1. Put the shebang on the very first line of every script — anything before it (including a blank line) will prevent the kernel from recognizing the interpreter.
2. Use **UPPERCASE** names for values that do not change and **lowercase** names for values that do — the shell does not enforce this, but readers of your code will expect it.
3. Always double-quote variable expansions (`"$VAR"`) unless you have a specific reason to allow word-splitting, especially where filenames are involved.
4. Start every non-trivial script with **stub** functions and flesh them out one at a time, re-running the script after each change to catch bugs early.
5. Prefer here documents over long sequences of `echo` commands for multi-line output — they are easier to read, edit, and re-indent.
6. Use `local` for every variable inside a function unless you specifically want to modify a global — this keeps functions independent and portable.

### Common Pitfalls

- Leaving spaces around `=` in an assignment (`TITLE = "Report"`). The shell interprets this as running `TITLE` as a command with `=` and `"Report"` as arguments.
- Misspelling a variable name (`$fool` vs. `$foo`). The shell silently expands the misspelling to the empty string, which can break commands that require arguments.
- Defining a function *after* the line that calls it. The shell reads top to bottom, so the call is treated as an unknown command.
- Using spaces instead of tabs with `<<-`. Only tabs are stripped; space-indented lines are copied verbatim, which may break the intended output formatting.
- Forgetting to `chmod 755` (or `700`) a new script — the shell will report "Permission denied" even when the file exists on `PATH`.
- Assuming `~/bin` is automatically on `PATH`. On Debian/Ubuntu it is auto-added only if `~/bin` exists at login; on other distributions you must add it explicitly in `~/.bashrc`.
