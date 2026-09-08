---
title: 'The Shell Environment'
subtitle: 'The Linux Command Line — Lecture 10'
---

## Learning Objectives

- Distinguish between *environment variables* and *shell variables*, and explain how the shell stores and uses each type.
- Use `printenv`, `set`, and `echo` to examine the contents of the shell environment.
- Explain how login and non-login shell sessions establish the environment, and identify which startup files each type reads.
- Modify `~/.bashrc` using a text editor (`nano`) to add aliases, variables, and settings.
- Use `export` to promote a shell variable to an environment variable, making it available to child processes.
- Apply `source` (or `.`) to activate changes in a startup file without ending the current terminal session.

---

## Key Commands Covered

- `printenv` — Print part or all of the environment variables
- `set` — Display all shell and environment variables and shell functions
- `export` — Make a shell variable available to child processes as an environment variable
- `alias` — Create, view, or list command aliases
- `source` — Execute commands from a file in the current shell (also written as `.`)
- `nano` — Simple text-based editor for creating and modifying configuration files

---

## Chapter Outline

### 1. What Is Stored in the Environment?

The shell maintains a body of information during a session called the *environment*. Programs use data stored in the environment to adjust their behavior. The shell stores two main types of data:

- **Environment variables**: available to the shell and to all programs launched from it. Created either by the shell itself or by startup scripts.
- **Shell variables**: local to the current running instance of bash; not passed to child processes.

The environment also stores *aliases* (shorthand command names) and *shell functions* (small programs defined in startup files).

#### Examining the Environment

The `printenv` command lists environment variables. The `set` builtin lists both shell and environment variables (and shell functions), sorted alphabetically. Neither command shows aliases — use `alias` for those.

```bash
# List all environment variables
printenv | less

# Display a single variable
printenv USER
# me

# List all shell and environment variables (sorted)
set | less

# View a variable's value with echo
echo $HOME
# /home/me

# List all current aliases
alias
# alias ll='ls -l --color=tty'
# alias vi='vim'
```

#### Some Interesting Environment Variables

| Variable | Contents |
|---|---|
| `DISPLAY` | Name of the graphical display (e.g., `:0`) |
| `EDITOR` | Default text editing program |
| `HOME` | Pathname of the home directory |
| `LANG` | Defines character set and collation order |
| `OLDPWD` | Previous working directory |
| `PAGER` | Default paging program (often `/usr/bin/less`) |
| `PATH` | Colon-separated list of directories searched when entering a command |
| `PS1` | "Prompt string 1" — defines the shell prompt appearance |
| `PWD` | Current working directory |
| `SHELL` | Name of the default shell program |
| `TERM` | Terminal type |
| `TZ` | Time zone specification |
| `USER` | Current username |

---

### 2. How Is the Environment Established?

When the shell starts, it reads a series of configuration scripts called *startup files* that define the default environment. Which files are read depends on the type of shell session:

- **Login shell session**: prompts for a username and password (e.g., logging into a virtual console, via SSH, or starting a graphical session). Login shells read the startup files listed below.
- **Non-login shell session**: opening a terminal emulator inside a graphical environment (no password prompt). Non-login shells read a different, shorter list.

**Startup Files for Login Shell Sessions:**

| File | Contents |
|---|---|
| `/etc/profile` | Global configuration script that applies to all users |
| `~/.bash_profile` | User's personal startup file; extends or overrides the global script |
| `~/.bash_login` | Read if `~/.bash_profile` is not found |
| `~/.profile` | Read if neither of the above is found (default on Debian/Ubuntu) |

**Startup Files for Non-Login Shell Sessions:**

| File | Contents |
|---|---|
| `/etc/bash.bashrc` | Global configuration script for all users |
| `~/.bashrc` | User's personal startup file; extends or overrides the global script |

Non-login shells also inherit the environment variables from their parent login shell. Most login shell startup files are written to source `~/.bashrc`, making `~/.bashrc` the most important file for personal customizations.

---

### 3. What's in a Startup File?

A typical `~/.bash_profile` on a CentOS system looks like:

```bash
# .bash_profile

# Get the aliases and functions
if [ -f ~/.bashrc ]; then
        . ~/.bashrc
fi

# User specific environment and startup programs

PATH=$PATH:$HOME/bin
export PATH
```

Key elements:
- Lines beginning with `#` are *comments* — the shell ignores them. They exist for human readability.
- The `if` block checks whether `~/.bashrc` exists and sources it (`. ~/.bashrc`), ensuring aliases and personal settings are loaded in login shells too.
- `PATH=$PATH:$HOME/bin` uses *parameter expansion* to append the `~/bin` directory to the existing `PATH`. This makes the personal `~/bin` directory available for user-written scripts.
- `export PATH` converts `PATH` into an environment variable, making it available to all child processes.

**Extending a variable with parameter expansion:**

```bash
foo="This is some "
foo=$foo"text."
echo $foo
# This is some text.
```

---

### 4. Child Process Environment Inheritance

Shell variables are **local** to the current instance of bash and are not copied to child processes. Environment variables **are** copied to children. Critically, a child process **cannot** alter the environment of its parent — changes made inside a child shell are discarded when it exits.

```bash
# Set a shell variable in the parent shell
foo="bar"

# Launch a child shell
bash

# foo is not visible — it was never exported
echo $foo
# (empty output)

# Exit back to the parent shell
exit

# foo is still set in the parent
echo $foo
# bar
```

To make a shell variable visible to child processes, use `export`:

```bash
export foo="bar"
# Now all child processes will receive foo as an environment variable
```

---

### 5. Launching a Program with a Temporary Environment

A variable assignment placed immediately before a command on the same line sets a *temporary environment variable* that exists only for the duration of that one command:

```bash
# Format man output to 75 characters wide, this one time
MANWIDTH=75 man ls
```

The variable is not added to the environment — it disappears after the command runs. This technique is useful for overriding defaults without permanently changing startup files. A common alias makes the setting permanent:

```bash
alias man='MANWIDTH=75 man'
```

---

### 6. Modifying the Environment

To add your own customizations, edit the appropriate startup file:

- Add directories to `PATH` or define new environment variables → edit `~/.bash_profile` (or `~/.profile` on Debian/Ubuntu).
- Add aliases, shell options, `umask` settings, and other personal preferences → edit `~/.bashrc`.

#### Text Editors

A *text editor* is a program for editing plain text files. Linux provides many choices:

- **Graphical editors**: `gedit` (GNOME), `kedit`, `kwrite`, `kate` (KDE). Familiar word-processor-like interface; require a graphical session.
- **Text-based editors**: `nano` (simple, menu-driven, good for beginners), `vi`/`vim` (powerful, available everywhere), `emacs` (all-purpose programming environment).

For startup file editing, `nano` is the recommended starting point.

#### Using a Text Editor

**Before editing any configuration file, always create a backup:**

```bash
cp ~/.bashrc ~/.bashrc.bak
```

Open `~/.bashrc` with nano:

```bash
nano ~/.bashrc
```

**Essential nano key bindings:**

| Key | Action |
|---|---|
| `Ctrl-x` | Exit nano |
| `Ctrl-o` | Save (write out) the file |
| `Ctrl-k` | Cut the current line |
| `Ctrl-u` | Paste (uncut) the previously cut line |
| `Ctrl-w` | Search for text |

Navigate to the end of the file and add the following lines:

```bash
# Change umask to make directory sharing easier
umask 0002

# Ignore duplicate consecutive commands in history
# and increase history size to 1000 lines
export HISTCONTROL=ignoredups
export HISTSIZE=1000

# Add some helpful aliases
alias l.='ls -d .* --color=auto'
alias ll='ls -l --color=auto'
```

**Meaning of each addition:**

| Line | Meaning |
|---|---|
| `umask 0002` | Sets default file permissions so group members can write shared files |
| `export HISTCONTROL=ignoredups` | Suppresses duplicate consecutive entries in command history |
| `export HISTSIZE=1000` | Increases command history buffer from ~500 to 1000 entries |
| `alias l.='ls -d .* --color=auto'` | Creates `l.` as a shortcut to list all dot-files |
| `alias ll='ls -l --color=auto'` | Creates `ll` as a shortcut for a long-format directory listing |

#### Why Comments Are Important

When modifying configuration files, always add comments to explain what each change does. Without comments, the purpose of a modification is easily forgotten. *Commented-out* lines (prefixed with `#`) preserve examples or disabled settings for reference:

```bash
# some more ls aliases
#alias ll='ls -l'
#alias la='ls -A'
#alias l='ls -CF'
```

To *uncomment* a line, remove the leading `#`. To *comment out* an active line, add `#` at the start.

---

### 7. Activating Changes

Changes to `~/.bashrc` take effect only in new terminal sessions. To apply changes to the *current* session without opening a new terminal, use `source`:

```bash
source ~/.bashrc
```

The `source` command reads and executes the contents of the specified file in the current shell, as if the lines had been typed at the keyboard. It can also be written as a single dot:

```bash
. ~/.bashrc
```

After sourcing, test that the changes worked:

```bash
ll
# (should display a long-format directory listing)

echo $HISTSIZE
# 1000
```

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---|---|
| `printenv` | Display all environment variables |
| `printenv VAR` | Display the value of a specific environment variable |
| `set` | Display all shell and environment variables and shell functions |
| `echo $VAR` | Display the value of any variable |
| `export VAR` | Make `VAR` an environment variable available to child processes |
| `export VAR=value` | Set and export a variable in one step |
| `alias name='cmd'` | Create an alias called `name` that runs `cmd` |
| `alias` | List all currently defined aliases |
| `source FILE` | Execute `FILE` in the current shell (same as `. FILE`) |
| `nano FILE` | Open `FILE` in the nano text editor |

### Concept Summary

| Concept | Description | Example |
|---|---|---|
| Environment variable | Available to the shell and all child processes | `PATH`, `HOME`, `USER` |
| Shell variable | Local to the current bash instance only | `my_color="blue"` |
| `export` | Converts a shell variable to an environment variable | `export my_color` |
| Login shell | Session that reads `/etc/profile`, then `~/.bash_profile` | SSH login, virtual console |
| Non-login shell | Session that reads `/etc/bash.bashrc`, then `~/.bashrc` | Terminal emulator in GUI |
| Startup file | Script read automatically when a shell session begins | `~/.bashrc`, `~/.bash_profile` |
| `source` / `.` | Reads and executes a file in the current shell | `source ~/.bashrc` |
| Temporary env var | Per-command assignment; exists only for that command | `MANWIDTH=75 man ls` |
| Comment | Line beginning with `#`; ignored by the shell | `# This is a comment` |
| Commented-out line | Active line disabled by prefixing with `#` | `#alias ll='ls -l'` |

### Startup File Decision Table

| Goal | File to Modify |
|---|---|
| Add a directory to `PATH` | `~/.bash_profile` or `~/.profile` |
| Define a new environment variable | `~/.bash_profile` or `~/.profile` |
| Add aliases | `~/.bashrc` |
| Set `umask` | `~/.bashrc` |
| Set `HISTSIZE`, `HISTCONTROL` | `~/.bashrc` |
| Customize the shell prompt (`PS1`) | `~/.bashrc` |

### Tips for Success

1. **Always back up configuration files before editing.** Run `cp ~/.bashrc ~/.bashrc.bak` before every editing session. To restore: `cp ~/.bashrc.bak ~/.bashrc && source ~/.bashrc`.
2. **Use `source ~/.bashrc` to test your changes immediately.** You do not need to open a new terminal — just source the file after saving it.
3. **Add comments to everything you add.** Use `#` before each logical block to explain its purpose. Your future self will thank you.
4. **Use `echo $VARIABLE` to verify a variable was set.** After sourcing, confirm with `echo $HISTSIZE` or `printenv HISTSIZE` that the value is what you expect.
5. **Use `type command` to see how a command resolves.** `type ll` shows whether `ll` is an alias, a function, or an external program.
6. **When modifying `PATH`, always append — never replace.** Use `PATH=$PATH:$NEW_DIR` rather than `PATH=$NEW_DIR` to preserve all existing path entries.

### Common Pitfalls

- **Spaces around `=` in variable assignment.** The shell requires no spaces: `MY_VAR=value` is correct; `MY_VAR = value` causes a "command not found" error because the shell treats `MY_VAR` as a command name.
- **Forgetting `export`.** A variable set without `export` is a shell variable — child processes and programs launched from the shell won't see it. Export variables that programs need to read.
- **Overwriting `PATH` instead of extending it.** Writing `PATH=/new/dir` destroys the existing `PATH` and breaks most shell commands. Always use `PATH=$PATH:/new/dir`.
- **Changes not taking effect.** After editing `~/.bashrc`, the changes won't apply in the current session until the file is sourced (`source ~/.bashrc`) or a new terminal is opened.
- **Editing the wrong startup file.** Aliases added to `~/.bash_profile` may not appear in terminal emulator sessions (non-login shells) unless `~/.bash_profile` explicitly sources `~/.bashrc`.
