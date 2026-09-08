---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'The Shell Environment: Variables, Startup Files, and Configuration'
info: |
  ## The Linux Command Line — Lecture 10
  Variables, Startup Files, and Configuration. Adapted from TLCL chapter 11.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# The Shell Environment

Variables, Startup Files, and Configuration

The Linux Command Line

Lecture 10

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Distinguish environment variables from shell variables and explain how each is inherited by child processes
- Use `printenv`, `set`, and `echo` to examine the shell environment
- Explain how login and non-login shells read different startup files
- Modify `~/.bashrc` to add aliases, variables, and settings using `nano`
- Use `export` to make shell variables available to child processes
- Apply `source` to activate startup file changes in the current session

---
layout: section
---

# What Is the Shell Environment?

The shell maintains a body of information called the *environment* — data programs use to configure themselves.

**Two types of stored data:**

- **Environment variables** — available to the shell and all launched programs
- **Shell variables** — local to the current bash instance only

**Also stored:**

- **Aliases** — shorthand command names
- **Shell functions** — small programs defined in startup files (Part 4)

---

# Examining the Environment

```bash
# List all environment variables
printenv | less

# Show a specific variable
printenv USER
# me

# Show shell + environment variables (sorted)
set | less

# Show a variable's value
echo $HOME
# /home/me

# Show all defined aliases
alias
```

| Command | Shows |
|---|---|
| `printenv` | Environment variables only |
| `set` | Environment + shell variables + functions |
| `alias` | Aliases only |

---

# Key Environment Variables

| Variable | Purpose |
|---|---|
| `HOME` | Your home directory path |
| `PATH` | Directories searched for commands |
| `USER` | Your username |
| `SHELL` | Your default shell |
| `PS1` | Shell prompt string |
| `LANG` | Character set and collation order |
| `TERM` | Terminal type |
| `EDITOR` | Default text editor |
| `PAGER` | Default paging program |
| `PWD` / `OLDPWD` | Current / previous directory |

---
layout: section
---

# How Is the Environment Established?

When bash starts, it reads *startup files* — configuration scripts that build the environment.

**Which files are read depends on the session type:**

| Session Type | When It Occurs |
|---|---|
| **Login shell** | SSH login, virtual console, graphical login |
| **Non-login shell** | Terminal emulator opened inside GUI |

---

# Login Shell Startup Files

Read in this order — first match wins for the personal files:

| File | Purpose |
|---|---|
| `/etc/profile` | Global config for all users |
| `~/.bash_profile` | Your personal config (checked first) |
| `~/.bash_login` | Used if `.bash_profile` is absent |
| `~/.profile` | Default on Debian/Ubuntu systems |

These files run **once** at login.

---

# Non-Login Shell Startup Files

| File | Purpose |
|---|---|
| `/etc/bash.bashrc` | Global config for all users |
| `~/.bashrc` | Your personal config |

Non-login shells also **inherit** environment variables from the parent login shell.

`~/.bashrc` is read nearly every time — most login startup files also source it.

**Rule of thumb:** put your personal customizations in `~/.bashrc`.

---

# Inside a Startup File

A typical `~/.bash_profile`:

```bash
# .bash_profile

# Source ~/.bashrc if it exists
if [ -f ~/.bashrc ]; then
        . ~/.bashrc
fi

# Add ~/bin to PATH
PATH=$PATH:$HOME/bin
export PATH
```

- `#` lines are **comments** — ignored by the shell
- `. ~/.bashrc` reads `.bashrc` in the current shell
- `PATH=$PATH:$HOME/bin` **appends** to the existing `PATH`
- `export PATH` makes `PATH` available to child processes

---
layout: section
---

# Shell Variables vs. Environment Variables

Shell variables are **local** to the current bash instance.

Environment variables are **copied** to child processes.

**A child process cannot alter its parent's environment.**

---

# Demonstrating Inheritance

```bash
# Set a shell variable (not exported)
foo="bar"
printenv foo   # empty — not in environment

# Launch a child shell
bash
echo $foo      # empty — not inherited

exit           # return to parent

# Export makes it an environment variable
export foo
bash
echo $foo      # bar — now inherited

exit
```

---

# Using `export`

```bash
# Export at declaration
export MY_VAR="hello"

# Export after assignment
MY_VAR="hello"
export MY_VAR

# Verify
printenv MY_VAR
# hello
```

Once exported, `MY_VAR` is available to all programs launched from this shell.

---

# Temporary Environment Variables

Place a variable assignment **before a command** to set it for that one command only:

```bash
# Format man output to 75 chars wide — this run only
MANWIDTH=75 man ls
```

After the command, `MANWIDTH` is **not** in your environment:

```bash
printenv MANWIDTH   # (no output)
```

Make it permanent with an alias:

```bash
alias man='MANWIDTH=75 man'
```

---
layout: section
---

# Modifying the Environment

**Which file to edit:**

| Goal | Edit This File |
|---|---|
| Add to `PATH`, define env vars | `~/.bash_profile` or `~/.profile` |
| Add aliases, set options, `umask` | `~/.bashrc` |

---

# Text Editors

**Graphical editors** (require a GUI session):
- `gedit` — GNOME text editor
- `kate`, `kwrite`, `kedit` — KDE editors

**Text-based editors** (work anywhere):
- `nano` — simple, menu-driven (beginner-friendly)
- `vi` / `vim` — powerful, always available (next chapter)
- `emacs` — all-purpose programming environment

---

# Using nano

Always back up before editing:

```bash
cp ~/.bashrc ~/.bashrc.bak
```

Open the file:

```bash
nano ~/.bashrc
```

**Essential nano keys:**

| Key | Action |
|---|---|
| `Ctrl-o` | Save the file |
| `Ctrl-x` | Exit nano |
| `Ctrl-w` | Search |
| `Ctrl-k` | Cut current line |
| `Ctrl-u` | Paste cut line |

---

# Additions to `~/.bashrc`

```bash
# Change umask for easier directory sharing
umask 0002

# History settings
export HISTCONTROL=ignoredups
export HISTSIZE=1000

# Helpful aliases
alias l.='ls -d .* --color=auto'
alias ll='ls -l --color=auto'
```

| Setting | Effect |
|---|---|
| `umask 0002` | Group-writable default permissions |
| `HISTCONTROL=ignoredups` | Skip consecutive duplicate history entries |
| `HISTSIZE=1000` | Store 1000 commands in history |
| `alias l.` | List dot-files in current directory |
| `alias ll` | Long-format directory listing |

---

# Why Comments Matter

Always document your changes:

```bash
# Ignore duplicate consecutive commands in history
# and increase history size to 1000 lines
export HISTCONTROL=ignoredups
export HISTSIZE=1000
```

**Commented-out lines** preserve examples without activating them:

```bash
#alias la='ls -A'   # uncomment to enable
```

Remove the leading `#` to *uncomment* and activate the line.

---

# Activating Changes

`~/.bashrc` is read only at the **start** of a new session.

To apply changes to the current session, use `source`:

```bash
source ~/.bashrc
# Equivalent shorthand:
. ~/.bashrc
```

`source` reads and executes the file **in the current shell** — no new session needed.

```bash
# Verify changes took effect
ll               # alias should now work
echo $HISTSIZE   # 1000
```

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir -p ~/ch11-lab
cd ~/ch11-lab
```

---

# Exercise 1: Examine the Environment

```bash
# Browse all environment variables
printenv | less

# Check specific variables
printenv USER
printenv PATH

# Compare counts
set | wc -l
printenv | wc -l

# View aliases
alias
```

Notice: `set` produces far more output than `printenv`.

---

# Exercise 2: Shell vs. Environment Variables

```bash
# Create a shell variable
test_var="hello"

# Not visible with printenv
printenv test_var   # (empty)

# Not inherited by child shell
bash
echo $test_var      # (empty)
exit

# Export and try again
export test_var
bash
echo $test_var      # hello
exit
```

---

# Exercise 3: Explore Your Startup Files

```bash
# List hidden files in home directory
ls -a ~

# View your current .bashrc
cat ~/.bashrc

# View login startup file
cat ~/.bash_profile 2>/dev/null || cat ~/.profile 2>/dev/null
```

Look for: comment lines, `PATH` assignments, `. ~/.bashrc` calls.

---

# Exercise 4: Edit `~/.bashrc`

```bash
# Back up first
cp ~/.bashrc ~/.bashrc.bak

# Open in nano
nano ~/.bashrc
```

Navigate to end of file. Add:

```bash
# History improvements
export HISTCONTROL=ignoredups
export HISTSIZE=1000

# Useful ls aliases
alias l.='ls -d .* --color=auto'
alias ll='ls -l --color=auto'
```

Save with `Ctrl-o`, exit with `Ctrl-x`.

---

# Exercise 5: Activate and Verify

```bash
# Activate changes in current session
source ~/.bashrc

# Test the new aliases
ll
l.

# Verify the variable
echo $HISTSIZE
# 1000

# Confirm aliases are listed
alias | grep ll
```

---

# Lab Cleanup

```bash
# To restore original .bashrc if desired:
# cp ~/.bashrc.bak ~/.bashrc
# source ~/.bashrc

cd ~
rmdir ~/ch11-lab 2>/dev/null
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1: Inheritance Prediction

Predict the output of each `echo`. Then verify.

```bash
color="green"
bash
echo "1: $color"
exit
export color
bash
echo "2: $color"
color="red"
echo "3: $color"
exit
echo "4: $color"
```

**Expected:** `1:` empty, `2: green`, `3: red`, `4: green`

---

# Challenge 2: Debug the Startup File

A student adds this to `~/.bashrc`:

```bash
PATH = $PATH:/opt/mytools/bin
export PATH
```

Running `source ~/.bashrc` produces an error. What is wrong? Write the corrected line.

**Answer:** Spaces around `=` make the shell treat `PATH` as a command name. Fix: `PATH=$PATH:/opt/mytools/bin`

---

# Challenge 3: Scenario — Broken PATH

A student accidentally ran `PATH=/usr/local/bin`. Now `ls`, `cat`, and `cp` don't work.

1. Why did the commands stop working?
2. How can they restore `PATH` without closing the terminal?
3. How should they have added `/usr/local/bin` safely?

**Answer:** They replaced `PATH` instead of extending it. Fix: `export PATH=$PATH:/usr/local/bin`. Correct method: `PATH=$PATH:/usr/local/bin`

---

# Challenge 4: Write the Configuration

Add the following to `~/.bashrc` with appropriate comments:

1. Set `HISTSIZE` to 2000
2. Create alias `..` for `cd ..`
3. Create alias `...` for `cd ../..`

```bash
# Increase command history size
export HISTSIZE=2000

# Directory navigation shortcuts
alias ..='cd ..'
alias ...='cd ../..'
```

---

# Assessment Questions

1. What is the difference between an environment variable and a shell variable? Which one does `export` create?
2. When you open a terminal emulator in a graphical desktop, is it a login shell or non-login shell? Which startup file does it primarily read?
3. Why is it important to back up `~/.bashrc` before editing it?
4. What does `source ~/.bashrc` do that opening a new terminal window does not?
5. A colleague says "I added an alias to `~/.bashrc` but it isn't working." What is the most likely explanation, and how would you fix it?
6. Why should you use `PATH=$PATH:/new/dir` rather than `PATH=/new/dir` when adding a directory to `PATH`?

---

# Summary

Today we learned how to:

- Examine the shell environment using `printenv`, `set`, `echo`, and `alias`
- Distinguish login shells (which read `~/.bash_profile`) from non-login shells (which read `~/.bashrc`)
- Use `export` to make shell variables available to child processes
- Safely edit `~/.bashrc` with `nano` to add aliases, history settings, and custom variables
- Activate changes immediately using `source ~/.bashrc` without opening a new session

Understanding the environment is the foundation for customizing Linux to your workflow — every tool you configure and every alias you create lives here.

---

# Additional Resources

- `man bash` — The INVOCATION section covers startup files in detail; the ENVIRONMENT section lists all variables bash reads and sets
- `man nano` — Complete reference for the nano text editor, including all key bindings
- `help export` — Built-in help for the `export` command (`export` is a bash builtin)
- `help source` — Built-in help for `source` / `.` (also a bash builtin)
- `man printenv` — Options and usage for the `printenv` command
