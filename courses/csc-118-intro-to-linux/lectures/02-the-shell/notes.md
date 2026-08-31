# Chapter 1: What Is the Shell?

Lab Guide with Outline, Exercises, and Challenges

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

## Exercises (90-minute lab)

### Lab Setup

No special setup is required for this lab. All exercises use the default terminal environment and built-in commands. Simply open a terminal emulator to begin.

```bash
# Open your terminal emulator application
# Verify you see a shell prompt similar to:
# [username@hostname ~]$
```

### Exercise 1: Exploring the Shell Prompt (10 minutes)

**Task 1.1**: Examine your shell prompt

Look at the prompt displayed in your terminal and identify its components.

```bash
# Your prompt should look something like:
# [username@hostname ~]$
```

**Task 1.2**: Display the name of your current shell

```bash
echo $SHELL
# /bin/bash
```

**Task 1.3**: Check the bash version

```bash
bash --version
# GNU bash, version 5.x.x ...
```

**Task 1.4**: Display your username and hostname

```bash
whoami
# your_username
```

```bash
hostname
# your_hostname
```

**Questions to answer:**

1. What are the three pieces of information shown in your shell prompt?
2. What does the `$` at the end of your prompt indicate? What would `#` indicate?
3. Is your shell bash? How did you confirm this?

### Exercise 2: Running Simple Commands (10 minutes)

**Task 2.1**: Display the current date and time

```bash
date
```

**Task 2.2**: Display a calendar of the current month

```bash
cal
```

**Task 2.3**: Display the calendar for a specific month and year

```bash
cal 12 2025
```

**Task 2.4**: Display the calendar for the entire current year

```bash
cal -y
```

**Questions to answer:**

1. What day of the week is today according to the `cal` output?
2. What day of the week was January 1 of this year?
3. Does `date` display the time zone? If so, what time zone is your system set to?

### Exercise 3: Checking System Resources (10 minutes)

**Task 3.1**: Check disk space usage

```bash
df
```

**Task 3.2**: Display disk space in human-readable format

```bash
df -h
```

**Task 3.3**: Check system uptime

```bash
uptime
```

**Task 3.4**: Check memory usage (Linux systems)

```bash
free
```

If `free` is not available on your system, try:

```bash
free -h
```

**Questions to answer:**

1. What is the difference between the output of `df` and `df -h`?
2. How long has your system been running according to `uptime`?
3. How many users are currently logged in according to `uptime`?

### Exercise 4: Handling Errors (10 minutes)

**Task 4.1**: Type a command that does not exist

```bash
foobar
# bash: foobar: command not found
```

**Task 4.2**: Try several nonsense commands and observe the error format

```bash
xyzzy
# bash: xyzzy: command not found
```

```bash
qwerty123
# bash: qwerty123: command not found
```

**Task 4.3**: Try a real command with a typo

```bash
datte
# bash: datte: command not found
```

**Task 4.4**: Observe what happens when you press Enter with an empty command line

```bash
# (press Enter on an empty prompt)
```

**Questions to answer:**

1. What is the consistent format of the error message when a command is not found?
2. Does the shell crash or stop working when you enter an invalid command?
3. What happens when you press Enter without typing anything?

### Exercise 5: Using Command History (15 minutes)

**Task 5.1**: Run several commands to build a history

```bash
date
cal
uptime
df -h
echo "Hello from the shell"
```

**Task 5.2**: Use the up-arrow key to recall the most recent command

Press the **up-arrow** key once. You should see `echo "Hello from the shell"` on your command line. Press Enter to re-run it.

**Task 5.3**: Navigate further back in history

Press the **up-arrow** key multiple times to move back through the commands you typed. Then press the **down-arrow** key to move forward again.

**Task 5.4**: View your command history

```bash
history
```

**Task 5.5**: Count how many commands are in your history

```bash
history | wc -l
```

**Questions to answer:**

1. How many commands back did the up-arrow key let you navigate?
2. What happens when you press the down-arrow key past the most recent command?
3. How many commands does your history currently contain?

### Exercise 6: Cursor Movement and Line Editing (10 minutes)

**Task 6.1**: Type a command but do not press Enter yet

```bash
# Type: echo "Helo World"
# Do NOT press Enter
```

**Task 6.2**: Use the left-arrow key to move the cursor back to the typo ("Helo") and correct it to "Hello" by adding the missing `l`. Then press Enter.

```bash
echo "Hello World"
# Hello World
```

**Task 6.3**: Recall a previous command with the up-arrow key, then use the left and right arrow keys to modify it before running it

Press the up-arrow to recall `echo "Hello World"`, then edit it to say `echo "Hello Linux"` and press Enter.

```bash
echo "Hello Linux"
# Hello Linux
```

**Task 6.4**: Try the Home and End keys

Type a long command but do not press Enter. Press the **Home** key to jump to the beginning of the line, then press the **End** key to jump to the end.

**Questions to answer:**

1. How did you fix the typo without retyping the entire command?
2. What is the advantage of being able to recall and edit previous commands?
3. What keys move the cursor to the beginning and end of the command line?

### Exercise 7: Copy and Paste in the Terminal (10 minutes)

**Task 7.1**: Use mouse highlighting to copy text

Highlight some text displayed in your terminal by clicking and dragging with the mouse across previous command output.

**Task 7.2**: Paste the highlighted text

Click in the terminal where you want to paste, then press the **middle mouse button** (or both left and right buttons simultaneously on a two-button mouse). The highlighted text should appear at the cursor.

**Task 7.3**: Observe the difference between terminal paste and application paste

Note that `Ctrl-c` does not copy text in the terminal. Instead, it sends an interrupt signal. Many terminal emulators support `Ctrl-Shift-c` and `Ctrl-Shift-v` for copy and paste.

**Task 7.4**: Test `Ctrl-c` behavior

```bash
# Type a partial command and press Ctrl-c
echo "This will not
# (press Ctrl-c)
# The command is cancelled and a new prompt appears
```

**Questions to answer:**

1. What is the X Window System method for copying and pasting text?
2. Why should you avoid using `Ctrl-c` for copying text in the terminal?
3. What keyboard shortcut do many terminal emulators use for copy instead of `Ctrl-c`?

### Exercise 8: Ending and Starting Sessions (10 minutes)

**Task 8.1**: End your terminal session with `exit`

```bash
exit
```

**Task 8.2**: Open a new terminal emulator window and verify you get a fresh shell prompt.

**Task 8.3**: Open a second terminal window. Notice that each window has its own independent shell session.

**Task 8.4**: In one of the windows, use `Ctrl-d` to close the session. Observe that it behaves the same as typing `exit`.

**Task 8.5**: Explore virtual consoles (Linux with a graphical desktop only)

If you are running Linux with a graphical desktop, press `Ctrl-Alt-F2` to switch to a virtual console. You should see a text-based login prompt. Log in, run a command such as `date`, then type `exit` to log out. Press `Alt-F7` (or `Alt-F1` on some distributions) to return to the graphical desktop.

**Questions to answer:**

1. What are two ways to end a terminal session?
2. Do separate terminal windows share the same command history?
3. How do you access a virtual console, and how do you return to the graphical desktop?

### Exercise 9: Putting It All Together (15 minutes)

**Task 9.1**: Run a sequence of system information commands

```bash
date
uptime
df -h
cal
```

**Task 9.2**: Use command history to re-run the `date` command without retyping it

Press the up-arrow key until `date` appears, then press Enter.

**Task 9.3**: Use command history to recall `df -h`, edit it to `df -h /`, and run it

```bash
df -h /
```

**Task 9.4**: Display the current date in a specific format

```bash
date +"%A, %B %d, %Y"
# Tuesday, March 10, 2026
```

**Task 9.5**: Display the calendar for the month you were born

```bash
cal [month] [year]
# Replace [month] and [year] with your birth month and year
```

**Questions to answer:**

1. Which of the commands you ran provides the most useful information about your system?
2. How did using command history save you time compared to retyping commands?
3. Were you able to modify a recalled command before running it?

### Lab Cleanup

No cleanup is required for this lab. All exercises used built-in commands and did not create any files or directories.

---

## Challenge Section

**Challenge 1: Identify Prompt Components**

Examine the following shell prompt and identify each component:

```
[jsmith@webserver01 Documents]$
```

What is the username? What is the hostname? What is the current working directory? What does the `$` indicate?

**Challenge 2: Predict the Behavior**

What will happen in each of the following scenarios? Write your answers before testing them.

1. You type `datee` and press Enter.
2. You type `date` and press Enter, then press the up-arrow key once and press Enter again.
3. You press Enter five times on an empty prompt.

**Challenge 3: True or False**

Determine whether each statement is true or false. Provide a brief justification.

1. The shell is part of the Linux kernel.
2. Bash stands for "Bourne Again SHell."
3. A `#` at the end of the shell prompt indicates a normal user session.
4. The `free` command displays available disk space.
5. Pressing `Ctrl-c` in the terminal copies text to the clipboard.
6. Virtual consoles are only available when a graphical desktop is running.

**Challenge 4: Command Exploration**

For each of the following commands, run it in your terminal and write a one-sentence description of what it displays:

1. `date`
2. `cal`
3. `df -h`
4. `uptime`
5. `free -h` (or `vm_stat` on macOS)

**Challenge 5: History Investigation**

Run the following command and answer the questions below:

```bash
history | tail -20
```

1. What does this command display?
2. What do the numbers at the left side of the output represent?
3. How could command history help you if you accidentally closed your terminal?

**Challenge 6: Keyboard Shortcuts**

Match each keyboard action to its function in the terminal:

| Action | Function |
|--------|----------|
| Up-arrow | ? |
| Down-arrow | ? |
| Left-arrow | ? |
| Right-arrow | ? |
| Ctrl-c | ? |
| Ctrl-d | ? |
| Middle mouse button | ? |

**Challenge 7: Terminal Emulators**

Explain why a terminal emulator is needed when using a graphical desktop environment. What purpose does it serve? Name at least two terminal emulator programs.

**Challenge 8: Superuser vs. Normal User**

A system administrator notices that their shell prompt ends with `#` instead of `$`. What does this mean, and why should they exercise caution? What kinds of actions might be dangerous to perform as this type of user?

**Challenge 9: Virtual Consoles**

Explain what virtual consoles are and describe a practical scenario in which a virtual console would be useful. Include the key combinations needed to switch between virtual consoles and the graphical desktop.

**Challenge 10: Building a System Report**

Using only the commands introduced in Chapter 1, construct a sequence of commands (one per line) that would display a brief "system report" containing:

1. The current date and time
2. How long the system has been running
3. Disk space usage in human-readable format
4. A calendar of the current month

Write out the exact commands you would use.

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
