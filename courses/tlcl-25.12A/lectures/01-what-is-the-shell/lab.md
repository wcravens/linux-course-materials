---
title: 'The Shell: Lab'
subtitle: 'The Linux Command Line — Lecture 1'
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

Using only the commands introduced in TLCL chapter 1, construct a sequence of commands (one per line) that would display a brief "system report" containing:

1. The current date and time
2. How long the system has been running
3. Disk space usage in human-readable format
4. A calendar of the current month

Write out the exact commands you would use.

---
