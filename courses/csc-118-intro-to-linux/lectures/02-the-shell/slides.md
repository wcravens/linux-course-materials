---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'The Shell: Your Command Line Interface'
info: |
  ## CSC 118 — Lecture 2
  The shell as an interface to the operating system: terminal emulators,
  the prompt, command history, and the first system information commands.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---

# The Shell

Your Command Line Interface

CSC 118 · Introduction to Linux

Lecture 2

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain what the shell is and how it relates to the operating system
- Identify the components of the shell prompt and what each part indicates
- Use basic commands to retrieve system information
- Navigate command history using keyboard shortcuts
- Describe how terminal emulators provide access to the shell
- Start and end a terminal session

---
layout: section
---

# What Is the Shell?

A program that takes keyboard commands and passes them to the operating system

---

# The Shell Defined

- The **shell** is not the operating system — it is an interface to it
- Takes commands you type and translates them into actions
- Nearly all Linux distributions use **bash** (Bourne Again SHell)
- Named as a replacement for the original `sh` by Steve Bourne
- The shell is just one of many available shell programs

---

# Shell vs. Operating System

<div class="viz">
<svg viewBox="0 0 800 330" role="img" aria-label="A four-layer stack. You at the keyboard pass commands down to the shell, bash, which interprets them; the shell passes them to the operating system, which carries out the work; the operating system drives the hardware.">
  <defs>
    <marker id="stack-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--muted)" />
    </marker>
  </defs>

  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="200" y="8"   width="300" height="54" rx="6" />
    <rect x="200" y="176" width="300" height="54" rx="6" />
    <rect x="200" y="260" width="300" height="54" rx="6" />
  </g>
  <rect x="200" y="92" width="300" height="54" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />

  <g style="stroke: var(--muted); stroke-width: 1.5" marker-end="url(#stack-arrow)">
    <line x1="350" y1="62"  x2="350" y2="86" />
    <line x1="350" y1="146" x2="350" y2="170" />
    <line x1="350" y1="230" x2="350" y2="254" />
  </g>

  <g class="cat" text-anchor="middle" dominant-baseline="middle">
    <text x="350" y="36">You (keyboard)</text>
    <text x="350" y="204">Operating System</text>
    <text x="350" y="288">Hardware</text>
  </g>
  <text class="val" x="350" y="120" text-anchor="middle" dominant-baseline="middle">Shell (bash)</text>

  <g class="cat" dominant-baseline="middle">
    <text x="520" y="120">Interprets your commands</text>
    <text x="520" y="204">Carries out the work</text>
  </g>
</svg>

<p class="cap">The shell is a middleman between you and the Linux kernel.</p>

</div>

---
layout: section
---

# Terminal Emulators

Programs that give you access to the shell in a graphical environment

---

# Why You Need a Terminal Emulator

- A graphical desktop does not show the shell by default
- A **terminal emulator** opens a window that connects to the shell
- Different desktop environments provide different terminal emulators

| Desktop Environment | Terminal Emulator |
| --- | --- |
| KDE | `konsole` |
| GNOME | `gnome-terminal` |
| Xfce | `xfce4-terminal` |
| macOS | `Terminal.app` |

---

# Opening a Terminal

- Find your terminal emulator in the application menu
- Common keyboard shortcut: <kbd>Ctrl</kbd>-<kbd>Alt</kbd>-<kbd>T</kbd> (on many Linux distributions)
- Once open, you see the **shell prompt** — ready for commands

---
layout: section
---

# The Shell Prompt

Your starting point for every interaction with the shell

---

# Anatomy of the Prompt

```bash
[me@linuxbox ~]$
```

| Component | Value | Meaning |
| --- | --- | --- |
| Username | `me` | Who is logged in |
| Hostname | `linuxbox` | Name of the computer |
| Directory | `~` | Current working directory (home) |
| Prompt char | `$` | Normal user |

---

# Normal User vs. Superuser

The last character of the prompt tells you your privilege level

- `$` — **Normal user** session (safe for everyday work)
- `#` — **Superuser** (root) session (full system access)

The superuser can modify or delete any file on the system — use with extreme caution

---

# What Happens with Unknown Commands

```bash
asdfjkl
# bash: asdfjkl: command not found
```

- The shell searches for a program matching what you typed
- If no match is found, it reports "command not found"
- The shell does not crash — it simply shows a new prompt

---
layout: section
---

# Command History and Cursor Movement

Navigate and edit your commands without retyping

---

# Command History

- Bash records up to **1,000 previously entered commands**
- <kbd>↑</kbd> — recall the previous command
- <kbd>↓</kbd> — move forward to more recent commands
- Continue pressing <kbd>↑</kbd> to go further back in history

```bash
date          # Run a command
# (press up-arrow)
date          # Previous command recalled
```

---

# Cursor Movement

- <kbd>←</kbd> — move cursor one character to the left
- <kbd>→</kbd> — move cursor one character to the right
- <kbd>Home</kbd>, <kbd>^a</kbd> — jump to the beginning of the line
- <kbd>End</kbd>, <kbd>^e</kbd> — jump to the end of the line

These keys let you edit a command before pressing <kbd>Enter</kbd> — no need to retype the whole thing

---

# Practical Workflow

1. Run a command: `df -h`
2. Press <kbd>↑</kbd> to recall it
3. Use <kbd>←</kbd> to position the cursor
4. Edit the command: `df -h /`
5. Press <kbd>Enter</kbd> to run the modified command

This cycle of recall, edit, and execute is one of the most powerful habits to develop

---
layout: section
---

# Mice, Copy/Paste, and Focus

Working with the mouse in the terminal

---

# X Window Copy and Paste

The **X Window System** provides a simple copy-and-paste mechanism:

1. **Highlight text** with the mouse — this automatically copies it
2. **Middle-click** (or press both left and right buttons) — this pastes

No keyboard shortcut needed for this method

---

# Keyboard Copy/Paste Differences

| Action | GUI Applications | Terminal |
| --- | --- | --- |
| Copy | `Ctrl-c` | `Ctrl-Shift-c` |
| Paste | `Ctrl-v` | `Ctrl-Shift-v` |

In the terminal, `Ctrl-c` **cancels the current command** — it does not copy

---

# Window Focus Policies

Two common behaviors for how windows receive keyboard input:

- **Click-to-focus** — click on a window to give it focus (most common)
- **Focus-follows-mouse** — a window receives input when the mouse pointer enters it

Most desktop environments default to click-to-focus

---
layout: section
---

# Simple Commands

Getting useful information from the shell

---
layout: two-cols
layoutClass: gap-8
---

# date and cal

```bash
date
# Mon Mar 10 12:45:00 CDT 2026
```

Displays the current date and time

::right::

<div class="mt-14" />

```bash
cal
#      March 2026
# Su Mo Tu We Th Fr Sa
#  1  2  3  4  5  6  7
#  8  9 10 11 12 13 14
# ...
```

Displays a calendar of the current month

---

# df and free

```bash
df -h
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1        47G  7.7G   38G  17% /
```

Shows disk free space in human-readable format

```bash
free -h
#              total       used       free
# Mem:          3.8G       1.9G       1.9G
```

Shows free and used memory (Linux only — use `vm_stat` on macOS)

---

# uptime

```bash
uptime
# 12:45:00 up 3 days, 4:12, 2 users, load average: 0.15, 0.20, 0.18
```

Shows how long the system has been running, the number of logged-in users, and the system load averages

---

# Commands Summary

| Command | What It Shows |
| --- | --- |
| `date` | Current date and time |
| `cal` | Calendar of the current month |
| `df` | Disk free space |
| `free` | Memory usage |
| `uptime` | System uptime and load |

---

# Ending a Terminal Session

**Method 1** — Type the `exit` command:

```bash
exit
```

**Method 2** — Press <kbd>Ctrl</kbd>-<kbd>d</kbd> (sends an end-of-file signal to the shell)

Both methods close the current shell session. If you are in a terminal emulator, the window will close as well.

---
layout: section
---

# The Console Behind the Curtain

Accessing the shell without a graphical desktop

---

# Virtual Terminals

Even without a graphical desktop, Linux provides shell access through **virtual terminals** (also called *virtual consoles*):

- Most distributions provide **six virtual consoles**
- Access them with <kbd>Ctrl</kbd>-<kbd>Alt</kbd>-<kbd>F1</kbd> through <kbd>Ctrl</kbd>-<kbd>Alt</kbd>-<kbd>F6</kbd>
- Each presents a full-screen text login prompt
- Return to the graphical desktop with <kbd>Alt</kbd>-<kbd>F7</kbd>

---

# When to Use Virtual Consoles

- The graphical desktop has become unresponsive
- You need a distraction-free, full-screen terminal
- You want to run multiple independent sessions
- The system is booted without a graphical desktop

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

No file or directory setup is required for this lab.

Open a terminal emulator and verify you see a shell prompt:

```bash
# You should see something like:
# [username@hostname ~]$
```

---

# Exercise 1: Examine the Prompt

Display information about your shell environment:

```bash
echo $SHELL
# /bin/bash
```

```bash
whoami
# your_username
```

```bash
hostname
# your_hostname
```

---

# Exercise 2: Run Simple Commands

Try each of the basic system information commands:

```bash
date
cal
df -h
uptime
```

Display a calendar for a specific month:

```bash
cal 7 1969
```

---

# Exercise 3: Handle Errors

Enter commands that do not exist and observe the shell response:

```bash
foobar
# bash: foobar: command not found
```

```bash
datte
# bash: datte: command not found
```

Notice the shell recovers gracefully and presents a new prompt each time

---

# Exercise 4: Use Command History

Run several commands, then use the arrow keys to navigate:

```bash
date
cal
uptime
echo "Hello from the shell"
```

- Press <kbd>↑</kbd> to recall previous commands
- Press <kbd>↓</kbd> to move forward
- View your full history:

```bash
history
```

---

# Exercise 5: Edit a Command

Type a command with a deliberate typo:

```bash
# Type: echo "Helo World"
# Use left-arrow to navigate back to "Helo"
# Insert the missing 'l' to make "Hello"
# Press Enter
echo "Hello World"
# Hello World
```

Recall the command with <kbd>↑</kbd>, edit it to say "Hello Linux", and run it again

---

# Exercise 6: End and Restart a Session

End your terminal session:

```bash
exit
```

Open a new terminal and verify you have a fresh prompt.

Try using <kbd>Ctrl</kbd>-<kbd>d</kbd> to close the new session.

If on Linux with a graphical desktop, try switching to a virtual console with <kbd>Ctrl</kbd>-<kbd>Alt</kbd>-<kbd>F2</kbd>, log in, run `date`, type `exit`, and return with <kbd>Alt</kbd>-<kbd>F7</kbd>.

---
layout: section
---

# Challenge Problems

---

# Challenge 1

Examine this shell prompt and identify every component:

```text
[jsmith@webserver01 Documents]$
```

What is the username, hostname, current directory, and user privilege level?

---

# Challenge 2

Predict what will happen in each scenario before testing:

1. You type `datee` and press <kbd>Enter</kbd>
2. You press <kbd>Enter</kbd> on an empty command line
3. You type `date`, press <kbd>Enter</kbd>, then press <kbd>↑</kbd> and <kbd>Enter</kbd> again

---

# Challenge 3

Using only commands from Chapter 1, write a sequence of four commands that produces a brief system status report showing: the current date and time, system uptime, disk usage, and a monthly calendar.

---

# Assessment Questions

1. What is the shell, and how does it differ from the operating system?
2. What do the `$` and `#` characters at the end of the shell prompt indicate?
3. Name three commands that display system information and describe what each shows.
4. How do you recall and re-run a previously entered command?
5. Why should you avoid using `Ctrl-c` and `Ctrl-v` for copy and paste in the terminal?
6. What are virtual consoles, and how do you access them?

---

# Summary

Today we learned how to:

- Understand what the shell is and how bash provides a command line interface
- Read the shell prompt to identify the user, hostname, and current directory
- Run basic system information commands (`date`, `cal`, `df`, `free`, `uptime`)
- Use command history and cursor movement to work efficiently
- Copy and paste text in the terminal using the X Window method
- Start and end terminal sessions with `exit` and <kbd>Ctrl</kbd>-<kbd>d</kbd>

These foundational skills prepare you for every topic that follows in this course — everything you do in Linux begins at the shell prompt.

---

# Additional Resources

- `man bash` — the full bash manual (comprehensive reference)
- `man date`, `man cal`, `man df`, `man free`, `man uptime` — manual pages for each command covered
- [The Linux Command Line (free PDF)](https://linuxcommand.org/tlcl.php) — the full textbook by William Shotts
- Explore your terminal emulator's preferences for font size, color scheme, and keyboard shortcuts
- Practice opening and closing terminal sessions until the workflow feels natural

---
layout: center
class: text-center
---

<div class="kicker">CSC 118 · Introduction to Linux · Lecture 2</div>

# You Have a Prompt

<div class="term">
<div class="term-bar"><i></i><i></i><i></i><span>student@parkland: ~</span></div>
<pre class="term-body"><span class="ps1">[student@parkland ~]$</span> echo "Lecture 2 complete"
Lecture 2 complete
<span class="ps1">[student@parkland ~]$</span> <span class="cursor"></span></pre>
</div>

<div class="next">Next up — navigating the file system with <code>pwd</code>, <code>cd</code>, and <code>ls</code></div>

<div class="hint">Questions? Bring them to the prompt.</div>

<style>
.slidev-layout .kicker {
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 0.6rem;
}

.slidev-layout .term {
  width: 40rem;
  margin: 2rem auto 1.6rem;
  border-radius: 0.6rem;
  overflow: hidden;
  text-align: left;
  background: #1c1c1f;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.55);
}

.slidev-layout .term .term-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  background: #2a2a2e;
}

.slidev-layout .term .term-bar i {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
}

.slidev-layout .term .term-bar i:nth-child(1) { background: #ff5f57; }
.slidev-layout .term .term-bar i:nth-child(2) { background: #febc2e; }
.slidev-layout .term .term-bar i:nth-child(3) { background: #28c840; }

.slidev-layout .term .term-bar span {
  margin: 0 auto;
  padding-right: 2.4rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.slidev-layout .term .term-body {
  margin: 0;
  padding: 1rem 1.1rem 1.2rem;
  background: transparent;
  color: #e6e6e6;
  font-size: 0.95rem;
  line-height: 1.7;
}

.slidev-layout .term .ps1 { color: #7fd88f; }

.slidev-layout .term .cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.05em;
  vertical-align: -0.18em;
  background: #e6e6e6;
  animation: end-blink 1.1s steps(1, end) infinite;
}

@keyframes end-blink {
  0%, 60%   { opacity: 1; }
  61%, 100% { opacity: 0.25; }
}

.slidev-layout .next { font-size: 1.05rem; }

.slidev-layout .next code {
  padding: 0.1em 0.35em;
  border-radius: 0.25rem;
  background: rgba(128, 128, 128, 0.16);
}

.slidev-layout .hint {
  margin-top: 0.9rem;
  font-size: 0.85rem;
  opacity: 0.55;
}
</style>
