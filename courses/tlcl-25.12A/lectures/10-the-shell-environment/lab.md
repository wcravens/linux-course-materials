---
title: 'The Shell Environment: Lab'
subtitle: 'The Linux Command Line — Lecture 10'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir -p ~/ch11-lab
cd ~/ch11-lab
```

---

### Exercise 1: Examining the Environment (10 minutes)

Explore the contents of the shell environment using `printenv`, `set`, and `echo`.

**Task 1.1** — View all environment variables piped through `less`. Use the arrow keys to scroll; press `q` to quit.

```bash
printenv | less
```

**Task 1.2** — Display the value of specific environment variables.

```bash
printenv USER
printenv HOME
printenv PATH
printenv SHELL
```

**Task 1.3** — Display variable values using `echo` with the `$` prefix.

```bash
echo $USER
echo $HOME
echo $PATH
```

**Task 1.4** — View all defined aliases.

```bash
alias
```

**Questions to answer:**
1. What is the value of your `PATH` variable? How many directories does it contain (count the colons and add one)?
2. What is the difference in output format between `printenv USER` and `echo $USER`?
3. Does `printenv` list your aliases? How do you display aliases instead?

---

### Exercise 2: Comparing `set` and `printenv` (10 minutes)

The `set` command shows more than `printenv`. Explore the difference.

**Task 2.1** — View all shell and environment variables through `less`.

```bash
set | less
```

**Task 2.2** — Compare the number of lines each command produces.

```bash
set | wc -l
printenv | wc -l
```

**Task 2.3** — Search for history-related variables in both outputs.

```bash
set | grep HIST
printenv | grep HIST
```

**Task 2.4** — Search for `BASH_VERSION`, which is a shell variable (not an environment variable).

```bash
set | grep BASH_VERSION
printenv | grep BASH_VERSION
```

**Questions to answer:**
1. Which command produces more lines of output, `set` or `printenv`? What does the extra content include?
2. What is the current value of `HISTSIZE` on your system?
3. Is `BASH_VERSION` visible in `printenv` output? What does this tell you about whether it is a shell variable or an environment variable?

---

### Exercise 3: Exploring Startup Files (10 minutes)

Locate and read the startup files that configure your environment.

**Task 3.1** — List all files in your home directory, including hidden ones.

```bash
ls -a ~
```

**Task 3.2** — View the contents of `~/.bashrc`.

```bash
cat ~/.bashrc
```

**Task 3.3** — View the login shell startup file (use whichever exists on your system).

```bash
cat ~/.bash_profile 2>/dev/null || cat ~/.profile 2>/dev/null
```

**Task 3.4** — Look at the global startup files (read-only — do not edit).

```bash
cat /etc/profile
cat /etc/bash.bashrc 2>/dev/null || cat /etc/bashrc 2>/dev/null
```

**Questions to answer:**
1. Which of the following startup files are present in your home directory: `.bash_profile`, `.bash_login`, `.profile`, `.bashrc`?
2. Does your login startup file (`.bash_profile` or `.profile`) include a line that reads `.bashrc`? What does that line accomplish?
3. What is the purpose of the `PATH=$PATH:$HOME/bin` line you may have found?

---

### Exercise 4: Shell Variables vs. Environment Variables (15 minutes)

Demonstrate the difference between local shell variables and exported environment variables.

**Task 4.1** — Create a shell variable and confirm it is set.

```bash
my_color="blue"
echo $my_color
# blue
```

**Task 4.2** — Confirm it is **not** in the environment (`printenv` will return nothing).

```bash
printenv my_color
```

**Task 4.3** — Launch a child shell and try to access the variable.

```bash
bash
echo $my_color
# (empty — variable was not exported)
exit
```

**Task 4.4** — Export the variable and repeat.

```bash
export my_color
bash
echo $my_color
# blue
exit
```

**Task 4.5** — Modify the variable in the child shell and observe that the parent is unaffected.

```bash
bash
my_color="red"
echo $my_color
# red
exit
echo $my_color
# blue  (parent's value is unchanged)
```

**Questions to answer:**
1. Why was `my_color` invisible to the child shell in Task 4.3?
2. What does `export` do to a shell variable?
3. In Task 4.5, the child changed `my_color` to "red" but the parent still saw "blue" after the child exited. What rule does this illustrate?

---

### Exercise 5: Temporary Environment Variables (10 minutes)

Use per-command environment variable assignments to temporarily modify program behavior.

**Task 5.1** — Check whether `MANWIDTH` is currently set.

```bash
printenv MANWIDTH
# (likely no output — not set by default)
```

**Task 5.2** — Run `man ls` normally and note the line width of the output. Press `q` to exit.

```bash
man ls
```

**Task 5.3** — Run `man ls` with a narrow `MANWIDTH` and compare the output width.

```bash
MANWIDTH=50 man ls
```

**Task 5.4** — Confirm `MANWIDTH` was not permanently set.

```bash
printenv MANWIDTH
# (still empty)
```

**Task 5.5** — Run a command with `PAGER` set to `cat` to bypass the interactive pager.

```bash
PAGER=cat man echo
```

**Questions to answer:**
1. Did the line width of the `man` output change between Task 5.2 and Task 5.3?
2. After running `MANWIDTH=50 man ls`, is `MANWIDTH` now in your environment? Why or why not?
3. What is a practical use case for setting a temporary environment variable instead of modifying your startup files?

---

### Exercise 6: Editing `~/.bashrc` with nano (15 minutes)

Add useful aliases and settings to your `~/.bashrc` file.

**Task 6.1** — Create a backup of `~/.bashrc` before making any changes.

```bash
cp ~/.bashrc ~/.bashrc.bak
ls -la ~ | grep bashrc
```

**Task 6.2** — Open `~/.bashrc` with nano.

```bash
nano ~/.bashrc
```

**Task 6.3** — Navigate to the end of the file using the down arrow key or `PageDown`. Add the following block at the end of the file:

```bash
# Ignore duplicate consecutive commands in history
# and increase history size to 1000 lines
export HISTCONTROL=ignoredups
export HISTSIZE=1000

# Useful ls aliases
alias l.='ls -d .* --color=auto'
alias ll='ls -l --color=auto'
```

**Task 6.4** — Save the file with `Ctrl-o`. When nano prompts for the filename, press `Enter` to confirm.

**Task 6.5** — Exit nano with `Ctrl-x`.

**Task 6.6** — Verify your changes were saved.

```bash
tail -12 ~/.bashrc
```

**Questions to answer:**
1. What key combination saves a file in nano? What key combination exits nano?
2. What does `Ctrl-o` stand for in nano's terminology?
3. If you made a mistake and want to discard your changes and revert to the backup, what command would you use?

---

### Exercise 7: Activating Changes with `source` (10 minutes)

Apply your `~/.bashrc` changes to the current session without starting a new terminal.

**Task 7.1** — Check whether the `ll` alias is active before sourcing.

```bash
type ll
# (may say "ll not found" if the alias hasn't been loaded yet)
```

**Task 7.2** — Source the modified `~/.bashrc` to activate the changes.

```bash
source ~/.bashrc
```

**Task 7.3** — Test the new aliases and variables.

```bash
ll
l.
echo $HISTSIZE
```

**Task 7.4** — Use the dot shorthand for `source` as an equivalent.

```bash
. ~/.bashrc
```

**Task 7.5** — Verify aliases are now listed.

```bash
alias | grep ll
alias | grep l\.
```

**Questions to answer:**
1. What is the difference between running `. ~/.bashrc` and opening a new terminal window?
2. Why do changes to `~/.bashrc` require `source` (or a new terminal) to take effect, rather than being applied immediately when the file is saved?
3. What would happen if `~/.bashrc` contained a syntax error and you ran `source ~/.bashrc`?

---

### Exercise 8: Adding a Personal `bin` Directory to `PATH` (10 minutes)

Create a personal script directory and make it accessible via `PATH`.

**Task 8.1** — Check whether `~/bin` already exists and is in your `PATH`.

```bash
ls -d ~/bin 2>/dev/null && echo "bin exists" || echo "bin not found"
echo $PATH | tr ':' '\n' | grep bin
```

**Task 8.2** — Create the `~/bin` directory if it does not exist.

```bash
mkdir -p ~/bin
```

**Task 8.3** — Create a simple greeting script and make it executable.

```bash
cat > ~/bin/greet << 'EOF'
#!/bin/bash
echo "Hello, $USER! Today's date is $(date '+%A, %B %d')."
EOF
chmod +x ~/bin/greet
```

**Task 8.4** — Add `~/bin` to `PATH` if it is not already there, then reload.

```bash
echo 'export PATH=$PATH:$HOME/bin' >> ~/.bash_profile
source ~/.bash_profile
```

**Task 8.5** — Run the script by name alone to confirm it is found via `PATH`.

```bash
greet
# Hello, me! Today's date is Monday, April 07.
```

**Questions to answer:**
1. Why does the shell need `PATH` to locate the `greet` script? What would happen if `~/bin` were not in `PATH`?
2. What is the purpose of `chmod +x ~/bin/greet`?
3. Why did you add the `PATH` modification to `~/.bash_profile` rather than `~/.bashrc`?

---

### Lab Cleanup

```bash
rm -f ~/bin/greet
rmdir ~/bin 2>/dev/null
cd ~
rmdir ~/ch11-lab 2>/dev/null
# To restore the original .bashrc if desired:
# cp ~/.bashrc.bak ~/.bashrc && source ~/.bashrc
```

---

## Challenge Section

**Challenge 1: Vocabulary Check**

In your own words, define each of the following terms and explain how they differ from one another:

- *environment variable*
- *shell variable*
- *startup file*
- *alias*

---

**Challenge 2: Predict the Output**

Without running the commands, predict what each `echo` statement will print. Then run them to verify your predictions.

```bash
color="green"
echo "1: $color"
bash
echo "2: $color"
exit
export color
bash
echo "3: $color"
color="red"
echo "4: $color"
exit
echo "5: $color"
```

Write the expected output for each numbered echo in order.

---

**Challenge 3: True or False — Justify Your Answer**

For each statement below, write **True** or **False** and provide one sentence of explanation.

1. `printenv` displays both shell variables and environment variables.
2. A child process can permanently change an environment variable in its parent shell.
3. Running `source ~/.bashrc` and opening a new terminal window both produce exactly the same environment.
4. The `set` command (with no arguments) can display the values of shell variables that `printenv` does not show.
5. Running `LANG=C man bash` changes your system's default language setting permanently.

---

**Challenge 4: Debugging a Startup File**

A student wants to add `/opt/mytools/bin` to their `PATH` and saves the following in `~/.bashrc`:

```bash
PATH = $PATH:/opt/mytools/bin
export PATH
```

Running `source ~/.bashrc` produces an error. Identify the problem and write the corrected version.

---

**Challenge 5: Trace the Environment**

A system has the following `~/.bash_profile`:

```bash
if [ -f ~/.bashrc ]; then
    . ~/.bashrc
fi
MY_APP_HOME=/opt/myapp
export MY_APP_HOME
PATH=$PATH:$MY_APP_HOME/bin
export PATH
```

And `~/.bashrc` defines:

```bash
export EDITOR=nano
alias cls='clear'
```

After a fresh login, for each item below state whether it will be in the environment and why:

- `MY_APP_HOME`
- `EDITOR`
- `cls` (the alias)
- `/opt/myapp/bin` as part of `PATH`

---

**Challenge 6: Write the Configuration**

A user wants to make the following customizations to their shell environment:

1. Set the default editor to `nano`.
2. Set `HISTSIZE` to 2000.
3. Create an alias `..` that runs `cd ..`.
4. Create an alias `...` that runs `cd ../..`.

Write the exact lines they should add to `~/.bashrc`, including appropriate comments for each section.

---

**Challenge 7: `source` vs. Subshell**

Explain the difference between the following two methods:

```bash
source ~/.bashrc
```

```bash
bash
```

In your explanation, address: (a) what each command does, (b) whether new aliases and variables in `~/.bashrc` become available in the current session, and (c) what happens to variables already set in the current session.

---

**Challenge 8: Scenario — Broken PATH**

A student accidentally ran:

```bash
PATH=/usr/local/bin
```

After running this command, many standard commands like `ls`, `cat`, and `cp` no longer work. Explain:

1. Why the commands stopped working.
2. How to restore `PATH` in the current terminal without closing it (assume bash builtins still work).
3. How the student could have safely added `/usr/local/bin` to `PATH` without overwriting the existing value.

---

**Challenge 9: Environment or Alias?**

Consider these two approaches to always running `grep` with color highlighting:

**Option A:**
```bash
export GREP_OPTIONS='--color=auto'
```

**Option B:**
```bash
alias grep='grep --color=auto'
```

1. Explain how each approach works.
2. Note that `GREP_OPTIONS` was deprecated and removed in newer versions of GNU grep. Which approach is more portable and why?
3. Which file (`~/.bashrc` or `~/.bash_profile`) is the correct place to put the alias, and why?

---

**Challenge 10: Integrative — Full Environment Setup**

Write a complete block of additions for `~/.bashrc` that accomplishes all of the following:

1. Sets `HISTSIZE` to 5000 and `HISTFILESIZE` to 10000.
2. Sets `HISTCONTROL` to `ignoreboth` (ignores both duplicates and commands starting with a space).
3. Adds `~/bin` to `PATH` using an `if` test that only adds it when the directory exists.
4. Defines at least three useful aliases of your own choice (not the ones from the chapter).
5. Includes a comment block above each logical section explaining its purpose.

Use this syntax for the conditional `PATH` addition:

```bash
if [ -d "$HOME/bin" ]; then
    PATH="$HOME/bin:$PATH"
fi
```

---
