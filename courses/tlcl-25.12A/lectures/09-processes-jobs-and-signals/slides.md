---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Processes: Jobs, Signals, and Job Control'
info: |
  ## The Linux Command Line — Lecture 9
  Jobs, Signals, and Job Control. Adapted from TLCL chapter 10.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Processes

Jobs, Signals, and Job Control

The Linux Command Line

Lecture 9

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain how Linux organizes and manages processes
- Use `ps` and `top` to view and monitor running processes
- Control processes using job control (background, foreground, stop)
- Send signals to processes with `kill` and `killall`
- Distinguish between common signals and when to use each
- Adjust process priority with `nice` and `renice`

---
layout: section
---

# How a Process Works

Linux is **multitasking** — it rapidly switches between programs to create the illusion of simultaneous execution

The kernel manages this through **processes**

---

# The Boot Sequence

1. Kernel starts and launches `init` (always **PID 1**)
2. `init` starts `systemd`
3. `systemd` starts all system services

Many services run as **daemon programs** — background processes with no user interface

---

# Parent and Child Processes

A program can launch other programs

- The launcher is the **parent process**
- The launched program is the **child process**

The kernel tracks each process:

| Attribute | Description |
|-----------|-------------|
| PID | Unique process ID (ascending order) |
| Memory | RAM assigned to the process |
| State | Ready, running, sleeping, stopped, etc. |
| Owner | User ID and effective user ID |

---
layout: section
---

# Viewing Processes with ps

`ps` provides a **snapshot** of current processes

---

# Basic ps

```bash
ps
# PID TTY          TIME CMD
# 5198 pts/1    00:00:00 bash
# 10129 pts/1   00:00:00 ps
```

By default: only shows processes for the **current terminal session**

---

# ps Columns

| Column | Meaning |
|--------|---------|
| PID | Process ID |
| TTY | Controlling terminal |
| TIME | CPU time consumed |
| CMD | Command name |

---

# ps x — All Your Processes

```bash
ps x
```

- Shows all processes you own, regardless of terminal
- `?` in TTY column = no controlling terminal
- Adds the **STAT** column (process state)

---

# Process States

| State | Meaning |
|-------|---------|
| `R` | Running or ready to run |
| `S` | Sleeping — waiting for an event |
| `D` | Uninterruptible sleep — waiting for I/O |
| `T` | Stopped (paused) |
| `Z` | Zombie — terminated but not cleaned up |
| `<` | High priority (less nice) |
| `N` | Low priority (more nice) |

---

# ps aux — All Users, Verbose

```bash
ps aux
# USER  PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
# root    1  0.0  0.0   2136   644 ?    Ss   Mar05   0:31 init
```

Shows processes belonging to **every user** with detailed information

---

# BSD-Style Column Headers

| Header | Meaning |
|--------|---------|
| `USER` | Owner of the process |
| `%CPU` | CPU usage in percent |
| `%MEM` | Memory usage in percent |
| `VSZ` | Virtual memory size |
| `RSS` | Physical RAM used (kilobytes) |
| `START` | Time process started |
| `TIME` | CPU time consumed |

---

# Viewing a Single Process

```bash
ps uw 44719
```

Include a PID as an argument to get details about one specific process

**Tip:** Pipe long output through `less`:

```bash
ps aux | less
```

---
layout: section
---

# Viewing Processes Dynamically with top

`top` shows a **continuously updating** display of processes sorted by CPU activity

Updates every **3 seconds** by default

---

# top System Summary

| Row | Field | Meaning |
|-----|-------|---------|
| 1 | `up` | System uptime since last boot |
| 1 | `users` | Number of logged-in users |
| 1 | `load average` | Processes waiting to run (1, 5, 15 min averages) |
| 2 | `Tasks` | Process count and states |
| 3 | `%us` | CPU used by user processes |
| 3 | `%sy` | CPU used by kernel processes |
| 3 | `%id` | CPU idle percentage |
| 3 | `%wa` | CPU waiting for I/O |
| 4 | `Mem` | Physical RAM usage |
| 5 | `Swap` | Virtual memory usage |

---

# top Keyboard Commands

- `h` — Display help
- `q` — Quit top

**Why use `top` over GUI tools?**

It is faster and consumes far fewer system resources — your monitoring tool shouldn't be the cause of the slowdown you're trying to diagnose

---
layout: section
---

# Controlling Processes

---

# Interrupting a Process

Press <kbd>Ctrl</kbd>-<kbd>c</kbd> to send an INT (interrupt) signal to the foreground process

```bash
sleep 300
# Press Ctrl-c to interrupt
```

The program terminates and the shell prompt returns

---

# Putting a Process in the Background

Append `&` to run a command in the background

```bash
sleep 300 &
# [1] 28236
```

The shell prints:
- **Job number** — `[1]`
- **PID** — `28236`

The shell prompt returns immediately

---

# Listing Background Jobs

```bash
jobs
# [1]+ Running    sleep 300 &
```

Multiple background jobs on one line:

```bash
sleep 100 & sleep 200 &
# [1] 47211
# [2] 47212
```

---

# Returning a Process to the Foreground

```bash
fg %1
```

- `%1` is a **jobspec** (percent sign + job number)
- If only one background job, the jobspec is optional
- Background processes are **immune to keyboard input** — you must bring them to the foreground first

---

# Stopping (Pausing) a Process

Press <kbd>Ctrl</kbd>-<kbd>z</kbd> to stop (pause) the foreground process without terminating it

```bash
sleep 300
# Ctrl-z
# [1]+ Stopped    sleep 300
```

The process is paused, not terminated

---

# Resuming a Stopped Process

Resume in the **foreground**:

```bash
fg %1
```

Resume in the **background**:

```bash
bg %1
# [1]+ sleep 300 &
```

This is handy when you forget to append `&`

---

# Job Control Summary

| Action | Command / Key |
|--------|---------------|
| Run in background | `command &` |
| List jobs | `jobs` |
| Foreground a job | `fg %N` |
| Background a job | `bg %N` |
| Pause foreground | `Ctrl-z` |
| Interrupt foreground | `Ctrl-c` |

---
layout: section
---

# Changing Process Priority

---

# Niceness

Every process has a **niceness** value that determines scheduling priority

| Value | Meaning |
|-------|---------|
| -20 | Highest priority (least nice) |
| 0 | Default |
| 19 | Lowest priority (most nice) |

**Rules:**
- Regular users can only **decrease** priority (increase niceness)
- Only the **superuser** can increase priority

---

# nice — Launch with Priority

```bash
nice -n 10 cpu-hog          # Lower priority
sudo nice -n -10 must-run-fast  # Higher priority (root only)
```

---

# renice — Change Running Process

```bash
renice -n 19 379215
```

Find the PID first with `ps`, then adjust priority

Niceness of **19** = use CPU only when nothing else is waiting

---
layout: section
---

# Signals

Signals are how the operating system **communicates** with programs

---

# Keyboard Signals

| Keystroke | Signal | Effect |
|-----------|--------|--------|
| `Ctrl-c` | INT (2) | Interrupt — terminate the program |
| `Ctrl-z` | TSTP (20) | Terminal stop — pause the program |

Programs "listen" for signals and can act on them (e.g., saving work before exiting)

---

# Sending Signals with kill

```bash
kill [-signal] PID...
```

Default signal: **TERM** (15) — graceful termination

```bash
sleep 300 &
# [1] 28401
kill 28401
# [1]+ Terminated    sleep 300
```

---

# Signal Specification

Three ways to specify a signal:

```bash
kill -1 13546        # By number
kill -INT 13601      # By name
kill -SIGINT 13608   # By name with SIG prefix
```

Use **jobspecs** instead of PIDs:

```bash
kill %1
```

---

# Common Signals

| # | Name | Can Catch? | Meaning |
|---|------|-----------|---------|
| 1 | HUP | Yes | Hangup — terminal closed; daemons reload config |
| 2 | INT | Yes | Interrupt — same as `Ctrl-c` |
| 9 | KILL | **No** | Kernel terminates immediately — last resort |
| 15 | TERM | Yes | Graceful termination (default) |
| 18 | CONT | Yes | Continue a stopped process |
| 19 | STOP | **No** | Force-pause (cannot be ignored) |
| 20 | TSTP | Yes | Terminal stop — `Ctrl-z` |

---

# KILL vs TERM — Know the Difference

**TERM (15)** — the polite way
- Program receives the signal
- Can save data and clean up
- Always try this first

**KILL (9)** — the last resort
- Kernel terminates immediately
- Program gets **no chance** to clean up
- Only use when TERM fails

---

# Other Signals

| # | Name | Meaning |
|---|------|---------|
| 3 | QUIT | Quit |
| 11 | SEGV | Segmentation violation (illegal memory access) |
| 28 | WINCH | Window resize (programs like `top` redraw) |

List all signals:

```bash
kill -l
```

---

# Process Ownership

Processes have owners, just like files

- You must **own** a process to send it signals
- Or be the **superuser**

---

# nohup — Hangup Protection

When a terminal closes, the HUP signal terminates its foreground process

`nohup` makes a process **immune** to HUP:

```bash
nohup long_task.sh &
```

Essential for **remote sessions** (SSH) — closing the connection won't kill the process

---

# killall — Signal by Name

Send signals to **all processes** matching a program name

```bash
killall [-u user] [-signal] name...
```

```bash
sleep 300 &
# [1] 18801
sleep 300 &
# [2] 18802
killall sleep
# [1]- Terminated    sleep 300
# [2]+ Terminated    sleep 300
```

---
layout: section
---

# Shutting Down the System

Orderly termination of all processes + filesystem sync

---

# Shutdown Commands

| Command | Action |
|---------|--------|
| `halt` | Halt the system |
| `poweroff` | Power off |
| `reboot` | Reboot |
| `shutdown` | Shutdown with scheduling options |

---

# shutdown Examples

```bash
sudo reboot
sudo shutdown -h now    # Halt immediately
sudo shutdown -r now    # Reboot immediately
```

`shutdown` broadcasts a warning message to all logged-in users

---

# More Process Tools

| Command | Description |
|---------|-------------|
| `pstree` | Tree view showing parent-child relationships |
| `vmstat` | System resource usage (memory, swap, disk I/O) |
| `xload` | Graphical system load graph |
| `tload` | Terminal-based system load graph |

```bash
vmstat 5     # Update every 5 seconds
pstree       # See the process hierarchy
```

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/process_lab
cd ~/process_lab
```

---

# Exercise 1: Exploring ps

Compare the output of these three commands:

```bash
ps
ps x
ps aux
```

Browse the full list:

```bash
ps aux | less
```

Find PID 1:

```bash
ps uw 1
```

---

# Exercise 2: Monitoring with top

```bash
top
```

While running, note:
- System uptime and load averages
- CPU idle percentage
- Which process uses the most CPU

Press `h` for help, `q` to quit

---

# Exercise 3: Job Control

Start a background process:

```bash
sleep 300 &
jobs
```

Bring to foreground, then stop and background:

```bash
fg %1
# Ctrl-z to pause
bg %1
jobs
```

---

# Exercise 3 (cont.)

Start multiple background jobs:

```bash
sleep 400 &
sleep 500 &
jobs
```

Bring one to foreground and terminate:

```bash
fg %1
# Ctrl-c to terminate
```

---

# Exercise 4: Sending Signals

Terminate with default signal:

```bash
sleep 1000 &
kill %1
```

Stop and continue:

```bash
sleep 1000 &
kill -STOP %1
jobs
kill -CONT %1
jobs
```

---

# Exercise 4 (cont.)

Force-kill:

```bash
sleep 1000 &
kill -9 %1
```

List all signals:

```bash
kill -l
```

---

# Exercise 5: killall and nohup

Kill multiple processes by name:

```bash
sleep 800 &
sleep 800 &
sleep 800 &
killall sleep
```

Use nohup:

```bash
nohup sleep 200 &
ls nohup.out
kill %1
rm -f nohup.out
```

---

# Exercise 6: Process Priority

Launch with reduced priority:

```bash
nice -n 10 sleep 500 &
ps -o pid,ni,cmd -p $!
```

Change priority of a running process:

```bash
renice -n 15 $!
ps -o pid,ni,cmd -p $!
```

Try to increase priority (should fail):

```bash
renice -n 5 $!
```

---

# Lab Cleanup

```bash
kill $(jobs -p) 2>/dev/null
rm -rf ~/process_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

What will `jobs` show after these commands?

```bash
sleep 100 &
sleep 200 &
sleep 300 &
kill %2
jobs
```

---

# Challenge 2

Given this `ps aux` line, answer the questions below:

```
USER  PID %CPU %MEM  VSZ   RSS TTY STAT START  TIME COMMAND
root  947  0.0  0.1  45320 8192 ?   Ss  Mar01  0:05 /usr/sbin/sshd
```

1. Who owns it?
2. Does it have a controlling terminal?
3. What does `Ss` mean?
4. How much RAM is it using?

---

# Challenge 3

Explain the difference between:

1. `kill 1234` vs. `kill -9 1234`
2. `kill %1` vs. `kill 1`
3. `nice` vs. `renice`

---

# Assessment Questions

1. What is a process, and what is PID 1?
2. What is the difference between `ps` and `top`?
3. How do you move a running foreground process to the background?
4. Why should `kill -9` only be used as a last resort?
5. What does `nohup` do, and when would you use it?

---

# Summary

Today we learned how to:

- Understand how Linux manages processes (PID, parent-child, daemons)
- View processes with `ps` (snapshot) and `top` (dynamic)
- Control processes with job control (`&`, `fg`, `bg`, <kbd>Ctrl</kbd>-<kbd>c</kbd>, <kbd>Ctrl</kbd>-<kbd>z</kbd>)
- Send signals to processes with `kill` and `killall`
- Adjust scheduling priority with `nice` and `renice`
- Keep processes alive with `nohup`

These skills are essential for monitoring system health and managing running programs.

---

# Additional Resources

- `man ps`, `man top`, `man kill`, `man nice`
- `man 7 signal` — full signal documentation
- `pstree` — visualize process hierarchy
- Practice with `sleep` — safe command for experimenting with job control
