---
title: 'The Shell'
subtitle: 'The Linux Command Line — Lecture 1'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Explain what the shell is and how it relates to the operating system
- Identify the components of the shell prompt and what each part indicates
- Use basic commands to retrieve system information
- Navigate command history using keyboard shortcuts
- Describe how terminal emulators provide access to the shell
- Start and end a terminal session

## Key Commands Covered

- `date` — Display the current date and time
- `cal` — Display a calendar for the current month
- `df` — Report disk free space on file systems
- `free` — Display the amount of free and used memory
- `uptime` — Show how long the system has been running
- `exit` — End the current terminal session

## Chapter Outline

### 1. What Is the Shell?

The **shell** is a program that takes commands typed at the keyboard and passes them to the operating system to carry out. Nearly all Linux distributions supply a shell program from the GNU Project called **bash**. The name bash is an acronym for *Bourne Again SHell*, a reference to the fact that it is a replacement for the original Unix shell program, `sh`, written by Steve Bourne.

### 2. Terminal Emulators

When using a graphical desktop environment, a program called a **terminal emulator** is needed to interact with the shell. Different desktop environments provide their own terminal emulator programs. KDE uses `konsole`, GNOME uses `gnome-terminal`, and other environments provide similar programs. All of them serve the same purpose: to give the user access to the shell.

### 3. Making Your First Keystrokes

When the terminal emulator starts, the shell displays a **shell prompt**. The prompt typically looks like this:

```bash
[me@linuxbox ~]$
```

The prompt contains the username (`me`), the hostname (`linuxbox`), and the current working directory (`~`, which represents the home directory). The `$` at the end indicates a normal user session. If the last character of the prompt is a `#` instead, the session has **superuser** (root) privileges.

Typing a random command that does not exist demonstrates how the shell reports errors:

```bash
asdfjkl
# bash: asdfjkl: command not found
```

The shell tells you it could not find a program by that name.

### 4. Command History

Bash maintains a history of commands that have been entered. By default, it records the last **1,000 commands**. Pressing the **up-arrow** key recalls the previous command. Each subsequent press of the up-arrow moves further back through the history. The **down-arrow** key moves forward through the history, returning toward the most recent command. When you reach the end (most recent), the command line clears.

### 5. Cursor Movement

The **left-arrow** and **right-arrow** keys move the cursor along the current command line, allowing you to edit a command before pressing Enter. This is useful for correcting typos or modifying a previous command recalled from history.

### 6. A Few Words About Mice and Focus

The **X Window System** (the underlying engine for graphical desktops on Linux) supports a quick copy-and-paste technique: highlighting text with the mouse automatically copies it to a buffer, and pressing the **middle mouse button** pastes the text at the cursor position in the terminal.

Do not use `Ctrl-c` and `Ctrl-v` for copy and paste in the terminal. These key combinations have different meanings in the shell: `Ctrl-c` sends an interrupt signal to the running program, and `Ctrl-v` is used for literal character insertion.

Linux also supports two focus policies for windows:

- **Click-to-focus** — a window receives input only after you click on it (the default in most desktop environments).
- **Focus-follows-mouse** — a window receives input whenever the mouse pointer moves over it, without needing to click.

### 7. Try Some Simple Commands

Several simple commands demonstrate the shell in action:

```bash
date
# Mon Mar 10 12:45:00 CDT 2026
```

The `date` command displays the current date and time.

```bash
cal
#      March 2026
# Su Mo Tu We Th Fr Sa
#  1  2  3  4  5  6  7
#  8  9 10 11 12 13 14
# 15 16 17 18 19 20 21
# 22 23 24 25 26 27 28
# 29 30 31
```

The `cal` command displays a calendar of the current month.

```bash
df
# Filesystem     1K-blocks    Used Available Use% Mounted on
# /dev/sda1       50000000 8000000  40000000  17% /
```

The `df` command shows the amount of free space on disk drives.

```bash
free
#              total       used       free     shared    buffers     cached
# Mem:       4000000    2000000    2000000          0     200000     800000
```

The `free` command displays the amount of free and used memory. On some systems (such as macOS), `free` is not available; `vm_stat` or similar tools are used instead.

```bash
uptime
# 12:45:00 up 3 days, 4:12, 2 users, load average: 0.15, 0.20, 0.18
```

The `uptime` command shows how long the system has been running, along with the number of users and system load averages.

### 8. Ending a Terminal Session

There are two ways to end a terminal session:

```bash
exit
```

Typing `exit` at the shell prompt closes the session. Alternatively, pressing `Ctrl-d` sends an end-of-file indicator to the shell, which also closes the session.

### 9. The Console Behind the Curtain

Even without a graphical desktop running, Linux provides access to the shell through **virtual terminals** (also called *virtual consoles*). On most distributions, six virtual consoles are available, accessed by pressing `Ctrl-Alt-F1` through `Ctrl-Alt-F6`. Each virtual console presents a login prompt where you can enter your username and password to start a shell session. To return to the graphical desktop, press `Alt-F7`.

Virtual terminals are useful when the graphical desktop becomes unresponsive or when you need a full-screen terminal environment.

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---------|---------|
| `date` | Display the current date and time |
| `cal` | Display a calendar |
| `df` | Report disk free space |
| `free` | Display free and used memory |
| `uptime` | Show system uptime and load |
| `exit` | End the terminal session |

### Shell Prompt Components

| Component | Example | Meaning |
|-----------|---------|---------|
| Username | `me` | The currently logged-in user |
| Hostname | `linuxbox` | The name of the computer |
| Working directory | `~` | The current directory (`~` = home) |
| Prompt character | `$` | Normal user session |
| Prompt character | `#` | Superuser (root) session |

### Keyboard Navigation Summary

| Key | Action |
|-----|--------|
| Up-arrow | Recall previous command from history |
| Down-arrow | Move forward through command history |
| Left-arrow | Move cursor left on the command line |
| Right-arrow | Move cursor right on the command line |
| Home | Move cursor to beginning of line |
| End | Move cursor to end of line |
| Enter | Execute the current command |
| Ctrl-c | Cancel the current command |
| Ctrl-d | End the terminal session (EOF) |

### Tips for Success

1. Get comfortable with your terminal emulator before diving into complex commands — know how to open it, resize it, and adjust its settings.
2. Use the up-arrow key frequently to recall and re-run previous commands instead of retyping them.
3. When a command is not found, check your spelling carefully — Linux commands are case-sensitive.
4. Practice using the left and right arrow keys to edit commands on the line rather than deleting everything and starting over.
5. Remember that `Ctrl-c` cancels commands in the terminal — it does not copy text. Use your terminal emulator's menu or `Ctrl-Shift-c` for copying.
6. Start with simple commands like `date`, `cal`, and `uptime` to build confidence before moving to more complex tasks.

### Common Pitfalls

- Trying to use `Ctrl-c` and `Ctrl-v` for copy and paste in the terminal — these key combinations have different meanings in the shell.
- Forgetting that Linux commands are case-sensitive — `Date` is not the same as `date`.
- Not realizing that the `free` command may not be available on all systems (e.g., macOS) — use `vm_stat` or check your distribution's documentation.
- Confusing the shell with the terminal emulator — the shell is the program that interprets commands, while the terminal emulator is the window that provides access to the shell.
- Panicking when a command is not found — the shell simply reports the error and presents a new prompt; nothing is broken.
