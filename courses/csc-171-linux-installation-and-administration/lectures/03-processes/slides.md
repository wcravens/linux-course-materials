---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Processes, Job Control, and Signals'
info: |
  ## CSC 171 — Lecture 3
  How Linux organizes running programs: viewing processes with ps and top,
  job control, scheduling priority, and signals.

  Follows *The Linux Command Line* (Shotts, 25.12A), Chapter 10 — Processes.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---

# Processes, Job Control, and Signals

CSC 171 — Linux Installation and Administration

Lecture 3

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain how Linux organizes running programs as **processes**
- Use `ps` to take a snapshot of what is running, and `top` to watch it live
- Read the process state, ownership, and resource columns those tools report
- Control jobs from the shell with `&`, `jobs`, `fg`, `bg`, <kbd>Ctrl</kbd>-<kbd>c</kbd>, and <kbd>Ctrl</kbd>-<kbd>z</kbd>
- Send signals with `kill` and `killall`, and choose the right signal
- Adjust scheduling priority with `nice` and `renice`
- Keep a long task alive across a disconnect with `nohup`
- Shut down or reboot a machine in an orderly way

---

# Why This Matters for Administration

You now have a Linux VM you reach over SSH. Everything you do on it is a process.

- A server that has gone sluggish is a **process** problem until proven otherwise
- A service that will not start leaves evidence in the process table
- A long-running job must survive your SSH session dropping
- Rebooting a machine you cannot walk over to is a one-way command

This is the first lecture where the tools are diagnostic rather than exploratory.

---
layout: section
---

# How a Process Works

The kernel's scheme for organizing programs waiting their turn at the CPU

---

# Multitasking

Linux is a **multitasking** operating system: it creates the illusion of doing more than
one thing at once by rapidly switching from one executing program to another.

The kernel manages this through **processes**.

A process is the kernel's unit of accounting for a running program — who owns it, what
memory it has, whether it is ready to run.

---

# The Boot Sequence

1. The kernel starts a few of its own activities as processes
2. The kernel launches `init`, which is always **PID 1**
3. `init` starts `systemd`, which starts all the system services

Many of those services are **daemons** — programs that sit in the background doing their
work with no user interface at all.

Even with nobody logged in, the machine is busy.

<div class="notes">

On the systemd distributions you will meet in this course, `systemd` *is* PID 1 —
the `init` binary is a symlink to it. Check for yourself on your VM: `ps -p 1 -o pid,comm`.

</div>

---

# Parent and Child Processes

A program can launch other programs. The launcher is the **parent**; the launched program
is the **child**.

<div class="viz">
<svg viewBox="0 0 800 320" role="img" aria-label="A process tree. systemd, PID 1, is the root. It has two children: the sshd daemon and cron. Under sshd is your login shell, bash, and under bash is the sleep command you started.">
  <defs>
    <marker id="tree-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--muted)" />
    </marker>
  </defs>

  <rect x="325" y="10" width="150" height="40" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />

  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="175" y="100" width="150" height="40" rx="6" />
    <rect x="475" y="100" width="150" height="40" rx="6" />
    <rect x="175" y="190" width="150" height="40" rx="6" />
    <rect x="175" y="265" width="150" height="40" rx="6" />
  </g>

  <g style="stroke: var(--muted); stroke-width: 1.5; fill: none">
    <line x1="400" y1="50" x2="400" y2="75" />
    <line x1="250" y1="75" x2="550" y2="75" />
    <line x1="250" y1="75" x2="250" y2="96" marker-end="url(#tree-arrow)" />
    <line x1="550" y1="75" x2="550" y2="96" marker-end="url(#tree-arrow)" />
    <line x1="250" y1="140" x2="250" y2="186" marker-end="url(#tree-arrow)" />
    <line x1="250" y1="230" x2="250" y2="261" marker-end="url(#tree-arrow)" />
  </g>

  <text class="val" x="400" y="30" text-anchor="middle" dominant-baseline="middle">systemd · PID 1</text>

  <g class="cat" text-anchor="middle" dominant-baseline="middle">
    <text x="250" y="120">sshd · 812</text>
    <text x="550" y="120">cron · 640</text>
    <text x="250" y="210">bash · 1043</text>
    <text x="250" y="285">sleep 300 · 1120</text>
  </g>

  <g class="cat" dominant-baseline="middle">
    <text x="345" y="210">your login shell</text>
    <text x="345" y="285">what you just started</text>
  </g>
</svg>

<p class="cap">Every process except PID 1 has a parent. Your shell's parent is the SSH daemon.</p>

</div>

---

# What the Kernel Tracks

| Attribute | Description |
| --- | --- |
| **PID** | Process ID, a number assigned in ascending order; `init` is always 1 |
| **Memory** | The memory assigned to the process |
| **State** | The process's readiness to resume execution |
| **Owner** | User ID and effective user ID, exactly like a file |

Processes have owners. That single fact decides whether you are allowed to signal one.

---
layout: section
---

# Viewing Processes with `ps`

A snapshot of the machine at the moment you ran the command

---

# The Simplest Form

```bash
ps
#   PID TTY          TIME CMD
#  5198 pts/1    00:00:00 bash
# 10129 pts/1    00:00:00 ps
```

By default `ps` shows very little: only the processes attached to the **current terminal
session**.

Here that is two — the shell you typed into, and `ps` itself.

---

# The Default Columns

| Column | Meaning |
| --- | --- |
| `PID` | Process ID |
| `TTY` | The controlling terminal — short for "teletype" |
| `TIME` | CPU time consumed by the process |
| `CMD` | The command name |

`TTY` is Unix showing its age. `TIME` is CPU time, not wall-clock time — a process idle
for a week still reads `00:00:00`.

---

# `ps x` — Everything You Own

```bash
ps x
#   PID TTY      STAT   TIME COMMAND
#   812 ?        Ss     0:00 /usr/lib/systemd/systemd --user
#  1043 pts/0    Ss     0:00 -bash
#  1120 pts/0    S      0:00 sleep 300
#  1121 pts/0    R+     0:00 ps x
```

- No leading dash — this is **BSD-style** option syntax
- Shows every process you own, whatever terminal (if any) controls it
- A `?` in the `TTY` column means **no controlling terminal** — typically a daemon
- Adds a `STAT` column

---

# Process States

| State | Meaning |
| --- | --- |
| `R` | **Running** — running, or ready to run |
| `S` | **Sleeping** — waiting for an event, such as a keystroke or a network packet |
| `D` | **Uninterruptible sleep** — waiting on I/O, such as a disk |
| `T` | **Stopped** — the process has been told to pause |
| `Z` | **Zombie** — terminated, but not yet cleaned up by its parent |
| `<` | **High priority** — less nice, taking more CPU time than its share |
| `N` | **Low priority** — a nice process, served after the others |

The state may be followed by other characters describing more exotic properties. See
`man ps`.

<div class="notes">

TLCL 25.12A, Table 10-1.

</div>

---

# BSD-Style Options

| Option | Function |
| --- | --- |
| `x` | List our running processes |
| `ax` | List **all** running processes |
| `w` | Include full command names |
| `u` | Verbose listing |

These combine, which is where the familiar `ps aux` comes from.

<div class="notes">

TLCL 25.12A, Table 10-2.

</div>

---

# `ps aux` — Every User, Verbose

```bash
ps aux
# USER  PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
# root    1  0.0  0.4 168404 12904 ?    Ss   Mar05   0:31 /sbin/init
# root  640  0.0  0.1   8524  3120 ?    Ss   Mar05   0:00 /usr/sbin/cron -f
# root  812  0.0  0.2  15420  7008 ?    Ss   Mar05   0:02 sshd: /usr/sbin/sshd
# me   1043  0.0  0.1   9992  5240 pts/0 Ss  09:14   0:00 -bash
```

This is the view an administrator lives in: every process on the machine, with the
resources it is consuming.

Long output — pipe it: `ps aux | less`

---

# The `aux` Columns

| Header | Meaning |
| --- | --- |
| `USER` | User ID — the owner of the process |
| `%CPU` | CPU usage, in percent |
| `%MEM` | Memory usage, in percent |
| `VSZ` | Virtual memory size |
| `RSS` | Resident set size — physical RAM in use, in kilobytes |
| `START` | When the process started; a date is shown past 24 hours |
| `TIME` | CPU time consumed |

`RSS` is the number to trust when asking "what is eating the RAM?" — `VSZ` counts memory
that was reserved but may never have been touched.

<div class="notes">

TLCL 25.12A, Table 10-3.

</div>

---

# A Single Process

Include a PID as an argument to get a detailed snapshot of just that process:

```bash
ps uw 44719
# USER   PID %CPU %MEM   VSZ  RSS TTY   STAT START   TIME COMMAND
# me   44719  0.0  0.0 13480 6492 pts/1 S    15:57   0:00 bash
```

You can also choose the columns yourself:

```bash
ps -o pid,ppid,ni,stat,cmd -p 44719
```

`ppid` is the **parent** PID — how you walk back up the tree.

---
layout: section
---

# Viewing Processes Dynamically with `top`

The live view, refreshed every three seconds

---

# What `top` Shows

```bash
top
```

`ps` gives a snapshot at the instant you ran it. `top` gives a continuously updating
display of processes sorted by CPU activity.

The display has two parts:

1. A **system summary** across the first several rows
2. A **table of processes**, sorted by CPU activity

---

# Reading the Display

```text
top - 14:59:20 up 6:30, 2 users, load average: 0.07, 0.02, 0.00
Tasks: 109 total,   1 running, 106 sleeping,   0 stopped,   2 zombie
Cpu(s): 0.7%us, 1.0%sy, 0.0%ni, 98.3%id, 0.0%wa, 0.0%hi, 0.0%si
Mem:    319496k total,  314860k used,    4636k free,   19392k buff
Swap:   875500k total,  149128k used,  726372k free,  114676k cach

  PID USER      PR  NI  VIRT   RES   SHR S %CPU %MEM    TIME+ COMMAND
 6244 me        39  19 31752  3124  2188 S  6.3  1.0 16:24.42 trackerd
11071 me        20   0  2304  1092   840 R  1.3  0.3  0:00.14 top
 4955 root      20   0  104m  9668  5776 S  0.3  3.0  2:19.39 Xorg
    1 root      20   0  2976   528   476 S  0.0  0.2  0:03.14 init
```

---

# The System Summary

| Row | Field | Meaning |
| --- | --- | --- |
| 1 | `up` | **Uptime** — time since the machine last booted |
| 1 | `2 users` | Number of users logged in |
| 1 | `load average` | Processes in a runnable state sharing the CPU, averaged over the last 1, 5, and 15 minutes |
| 2 | `Tasks` | Process count, broken out by state |
| 3 | `Cpu(s)` | The character of the work the CPU is doing — broken out on the next slide |
| 4 | `Mem` | How physical RAM is being used |
| 5 | `Swap` | How swap space (virtual memory) is being used |

<div class="notes">

TLCL 25.12A, Table 10-4.

</div>

---

# Row 3: What the CPU Is Doing

```text
Cpu(s): 0.7%us, 1.0%sy, 0.0%ni, 98.3%id, 0.0%wa, 0.0%hi, 0.0%si
```

| Field | Meaning |
| --- | --- |
| `%us` | CPU used by **user** processes — everything outside the kernel |
| `%sy` | CPU used by **system** (kernel) processes |
| `%ni` | CPU used by **nice**, low-priority processes |
| `%id` | CPU **idle** |
| `%wa` | CPU **waiting for I/O** |

A machine that feels slow while `%id` stays high is not CPU-bound. Look at `%wa` — it is
usually the disk.

---

# Load Average, Read Correctly

`load average: 0.07, 0.02, 0.00`

- Three numbers: the last **1 minute**, **5 minutes**, and **15 minutes**
- The count of processes runnable and sharing the CPU — **not** a percentage
- Values below `1.0` mean the machine is not busy
- Compare the three: a high 1-minute figure with a low 15-minute figure is a spike;
  all three high is a sustained problem

A sustained load average well above your CPU count is the classic "the server is slow"
signature.

---

# Two Keys Worth Knowing

- <kbd>h</kbd> — display the help screen
- <kbd>q</kbd> — quit `top`

**Why `top` and not a graphical monitor?**

Both major desktop environments ship graphical equivalents, but `top` is faster and
consumes far fewer system resources.

Your system monitor should not be the source of the slowdown you are trying to track down.

On a VM you reach over SSH, it is also the only one you have.

---
layout: section
---

# Controlling Processes

Job control: the shell's foreground, background, and stopped states

---

# Our Guinea Pig

*The Linux Command Line* uses `xlogo`, a small graphical program from the X Window System.

Your VM has **no graphical display** — you are on a server, over SSH.

So we will use `sleep` instead: a command that does nothing for a set number of seconds
and then exits. It is safe, predictable, and does not care how it is killed.

```bash
sleep 300
```

The prompt does not come back. The shell is waiting for the program to finish — exactly
as it has for every command so far.

---

# Interrupting a Process

Press <kbd>Ctrl</kbd>-<kbd>c</kbd> to interrupt the foreground program.

```bash
sleep 300
# (press Ctrl-c)
[me@linuxbox ~]$
```

This politely **asks** the program to terminate. The prompt returns.

Many — but not all — command-line programs can be interrupted this way.

---

# Putting a Process in the Background

To get the prompt back *without* terminating the program, put it in the background by
following the command with an ampersand:

```bash
sleep 300 &
# [1] 28236
[me@linuxbox ~]$
```

The shell prints two things:

- `[1]` — the **job number**, assigned by the shell
- `28236` — the **PID**, assigned by the kernel

The prompt returns immediately.

---

# Jobs and PIDs Are Different Numbers

```bash
sleep 300 &
# [1] 28236
ps
#   PID TTY          TIME CMD
# 10603 pts/1    00:00:00 bash
# 28236 pts/1    00:00:00 sleep
# 28239 pts/1    00:00:00 ps
```

- The **job number** is small, per-terminal, and only your shell knows it
- The **PID** is system-wide and is what every other tool wants

Job control is a *shell* feature. `ps`, `top`, and `kill` are happy with PIDs.

---

# Listing Background Jobs

```bash
jobs
# [1]+ Running                 sleep 300 &
```

One job, numbered 1, running, started as `sleep 300 &`.

Several at once, on one line:

```bash
sleep 100 & sleep 200 &
# [1] 47211
# [2] 47212
```

---

# Returning a Process to the Foreground

```bash
jobs
# [1]+ Running                 sleep 300 &
fg %1
# sleep 300
```

- `%1` is a **jobspec** — a percent sign followed by the job number
- With only one background job, the jobspec is optional

A background process is **immune to terminal keyboard input**, including
<kbd>Ctrl</kbd>-<kbd>c</kbd>. To interrupt one from the keyboard you must foreground it
first.

---

# Stopping (Pausing) a Process

Press <kbd>Ctrl</kbd>-<kbd>z</kbd> to stop the foreground process without terminating it:

```bash
sleep 300
# (press Ctrl-z)
# [1]+ Stopped                 sleep 300
[me@linuxbox ~]$
```

The process is **paused**, not gone. It holds its memory and its PID and consumes no CPU
until it is resumed.

---

# Resuming a Stopped Process

Resume it in the **foreground**:

```bash
fg %1
```

Or resume it in the **background**:

```bash
bg %1
# [1]+ sleep 300 &
```

As with `fg`, the jobspec is optional when there is only one job.

This pair is what to reach for when you start something long and forget the trailing `&`.

---

# The Job Control State Machine

<div class="viz">
<svg viewBox="0 0 800 220" role="img" aria-label="Three states connected by arrows. From foreground, Ctrl-z moves a job to stopped; fg brings it back. From stopped, bg moves it to background; fg brings a background job back to the foreground. Ctrl-c terminates a foreground job.">
  <defs>
    <marker id="jc-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--muted)" />
    </marker>
  </defs>

  <rect x="10" y="84" width="170" height="52" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="315" y="84" width="170" height="52" rx="6" />
    <rect x="620" y="84" width="170" height="52" rx="6" />
  </g>

  <g style="stroke: var(--muted); stroke-width: 1.5; fill: none" marker-end="url(#jc-arrow)">
    <line x1="95"  y1="84"  x2="95"  y2="46" />
    <line x1="184" y1="100" x2="311" y2="100" />
    <line x1="311" y1="124" x2="184" y2="124" />
    <line x1="489" y1="110" x2="616" y2="110" />
    <path d="M705 136 L705 182 L95 182 L95 140" />
  </g>

  <g class="val" text-anchor="middle" dominant-baseline="middle">
    <text x="95"  y="110">Foreground</text>
    <text x="400" y="110">Stopped</text>
    <text x="705" y="110">Background</text>
  </g>

  <g class="cat" text-anchor="middle">
    <text x="95"  y="34">Ctrl-c · terminated</text>
    <text x="247" y="90">Ctrl-z</text>
    <text x="247" y="142">fg %N</text>
    <text x="552" y="100">bg %N</text>
    <text x="400" y="202">fg %N</text>
  </g>
</svg>

<p class="cap">A trailing <code>&amp;</code> starts a job in the background directly, skipping the foreground entirely.</p>

</div>

---

# Job Control Summary

| Action | Command or key |
| --- | --- |
| Start in the background | `command &` |
| List jobs | `jobs` |
| Bring a job to the foreground | `fg %N` |
| Resume a stopped job in the background | `bg %N` |
| Pause the foreground job | <kbd>Ctrl</kbd>-<kbd>z</kbd> |
| Interrupt the foreground job | <kbd>Ctrl</kbd>-<kbd>c</kbd> |

Job control belongs to one terminal session. Log out and the job numbers are gone — the
processes may not be.

---
layout: section
---

# Changing Process Priority

Niceness, and who is allowed to change it

---

# Niceness

Every process carries a **niceness** value: the scheduling priority the kernel gives it.

| Value | Meaning |
| --- | --- |
| `-20` | Most favorable — highest priority, least nice |
| `0` | Default, no adjustment |
| `19` | Least favorable — lowest priority, most nice |

**The rule to remember:**

- A regular user may only **decrease** priority, and only on processes they own
- Only the **superuser** may increase priority

A nice process is one being generous with the CPU, leaving more for everybody else.

---

# `nice` — Launch With a Priority

Run a CPU-heavy job at lower priority so it stays out of everything else's way:

```bash
nice -n 10 cpu-hog
```

Run something at higher priority — as the superuser, since only root may:

```bash
sudo nice -n -10 must-run-fast
```

It is rarely necessary to raise priority, and doing so risks starving essential system
processes of the CPU time they need. Be careful.

---

# `renice` — Change a Running Process

Find the PID first, then adjust it:

```bash
ps
#    PID TTY          TIME CMD
# 379087 pts/9    00:00:00 bash
# 379215 pts/9    00:00:00 cpu-hog
# 379223 pts/9    00:00:00 ps

renice -n 19 379215
```

A niceness of `19` — the maximum — is genuinely useful: it lets the process use CPU
cycles only when nothing else is waiting for them.

That is the right setting for a backup, a re-index, or a transcode on a busy server.

---
layout: section
---

# Signals

How the operating system talks to programs

---

# You Have Been Sending Signals All Along

Signals are one of several ways the operating system communicates with programs.

When the terminal receives one of these keystrokes, it sends a signal to the foreground
program:

| Keystroke | Signal | Effect |
| --- | --- | --- |
| <kbd>Ctrl</kbd>-<kbd>c</kbd> | `INT` (2) | Interrupt — usually terminates the program |
| <kbd>Ctrl</kbd>-<kbd>z</kbd> | `TSTP` (20) | Terminal stop — pauses the program |

Programs "listen" for signals and may act on them. That is how a program can save work in
progress when it is told to terminate.

---

# `kill` Sends Signals

Despite the name, `kill` does not kill anything itself. It sends a signal.

```bash
kill [-signal] PID...
```

With no signal specified, it sends `TERM` (15) — terminate.

```bash
sleep 300 &
# [1] 28401
kill 28401
# [1]+ Terminated              sleep 300
```

---

# Three Ways to Name a Signal

```bash
kill -1 13546        # by number
kill -INT 13601      # by name
kill -SIGINT 13608   # by name, with the SIG prefix
```

All three are equivalent. Jobspecs work in place of PIDs:

```bash
sleep 300 &
# [1] 13546
kill %1
# [1]+ Terminated              sleep 300
```

---

# Common Signals

| # | Name | Catchable? | Meaning |
| --- | --- | --- | --- |
| 1 | `HUP` | yes | **Hangup** — the controlling terminal has closed. Many daemons reread their configuration instead of exiting |
| 2 | `INT` | yes | **Interrupt** — the same as <kbd>Ctrl</kbd>-<kbd>c</kbd> |
| 9 | `KILL` | **no** | **Kill** — never delivered to the program; the kernel terminates it outright |
| 15 | `TERM` | yes | **Terminate** — the default `kill` sends |
| 18 | `CONT` | yes | **Continue** — restore a stopped process; sent by `bg` and `fg` |
| 19 | `STOP` | **no** | **Stop** — pause without terminating; cannot be ignored |
| 20 | `TSTP` | yes | **Terminal stop** — sent by <kbd>Ctrl</kbd>-<kbd>z</kbd>; a program may ignore it |

<div class="notes">

TLCL 25.12A, Table 10-5.

</div>

---

# `HUP` Is the Administrator's Signal

The hangup signal is a relic of terminals attached to remote computers over phone lines
and modems — the terminal literally hung up.

Two modern uses:

- **Closing a terminal session** sends `HUP` to its foreground program, which terminates
- **Daemons reinitialize** on `HUP`: they restart and reread their configuration file
  without dropping connections. The Apache web server works this way

```bash
sudo kill -HUP $(cat /run/nginx.pid)
```

Reloading a service without restarting it is a real operational difference: the daemon
picks up the new configuration without dropping the connections it is already serving.

---

# `KILL` vs. `TERM` — Know the Difference

<div class="grid grid-cols-2 gap-8">
<div>

### `TERM` (15) — the default

- The signal **is delivered** to the program
- It can save its work, flush buffers, close files, remove its lock
- Always try this first

```bash
kill 28401
```

</div>
<div>

### `KILL` (9) — the last resort

- The signal is **never delivered**; the kernel terminates the process
- No chance to clean up, save, or unlock anything
- Only after `TERM` has failed

```bash
kill -9 28401
```

</div>
</div>

Reaching for `kill -9` first is how databases end up with corrupt state and stale lock
files. Give `TERM` a few seconds.

---

# Other Signals You Will Meet

| # | Name | Meaning |
| --- | --- | --- |
| 3 | `QUIT` | Quit |
| 11 | `SEGV` | **Segmentation violation** — the program made illegal use of memory |
| 28 | `WINCH` | **Window change** — sent when a window is resized; `top` and `less` redraw |

The complete list:

```bash
kill -l
```

<div class="notes">

TLCL 25.12A, Table 10-6.

</div>

---

# Processes Have Owners

Processes, like files, have owners.

You must be the **owner** of a process — or the **superuser** — to send it a signal with
`kill`.

```bash
kill 1
# bash: kill: (1) - Operation not permitted
```

This is why so much administration is `sudo kill`, and why permission errors from `kill`
are a signal in themselves: you are aiming at somebody else's process.

---

# `nohup` — Surviving a Hangup

Close a terminal and its foreground program is sent `HUP` and terminates. Over SSH, a
dropped connection does the same thing.

`nohup` makes a program immune to `HUP`:

```bash
nohup long_task.sh &
```

Output that would have gone to the terminal is appended to `nohup.out` in the current
directory.

This matters the moment you administer a machine remotely — an upgrade, an import, or a
backup that outlives your connection.

---

# `killall` — Signal by Name

Send a signal to every process matching a program name or a username:

```bash
killall [-u user] [-signal] name...
```

```bash
sleep 300 &
# [1] 18801
sleep 300 &
# [2] 18802
killall sleep
# [1]- Terminated              sleep 300
# [2]+ Terminated              sleep 300
```

As with `kill`, you need superuser privileges to signal processes that are not yours.

Read the name carefully before pressing <kbd>Enter</kbd> — `killall` does not ask.

---
layout: section
---

# Shutting Down the System

Orderly termination, and why it matters more on a machine you cannot see

---

# The Four Commands

| Command | Action |
| --- | --- |
| `halt` | Halt the system |
| `poweroff` | Power the system off |
| `reboot` | Reboot the system |
| `shutdown` | Halt, power off, or reboot, with a scheduled delay |

Shutting down means the **orderly termination of every process**, plus housekeeping —
syncing all mounted filesystems — before the power goes off.

The first three take no options in normal use:

```bash
sudo reboot
```

---

# `shutdown`

`shutdown` lets you choose the action and give it a delay:

```bash
sudo shutdown -h now      # halt, immediately
sudo shutdown -r now      # reboot, immediately
sudo shutdown -r +15      # reboot in fifteen minutes
sudo shutdown -c          # cancel a scheduled shutdown
```

Once `shutdown` runs, a message is broadcast to every logged-in user warning them of what
is coming.

Delays can be specified several ways — see `man shutdown`.

---

# On a Cloud VM, Read That Twice

<div class="text-lg">

`sudo shutdown -h now` on your GCP instance **stops the instance**.

</div>

- Your SSH session dies immediately, with no error you can act on
- The machine will not come back on its own
- You restart it from the Cloud Console or with `gcloud compute instances start`

```bash
gcloud compute instances start INSTANCE_NAME --zone ZONE
```

`sudo reboot` is the safe one: the instance stays running and you can SSH back in after a
minute.

This is the difference between a command on a laptop and the same command on a server
four hundred miles away.

---

# More Process-Related Commands

| Command | Description |
| --- | --- |
| `pstree` | The process list as a tree, showing parent-child relationships |
| `vmstat` | A snapshot of system resource usage — memory, swap, disk I/O |
| `xload` | A graphical graph of system load over time |
| `tload` | The same graph, drawn in the terminal |

```bash
pstree            # see the hierarchy from PID 1 down
vmstat 5          # update every 5 seconds; Ctrl-c to stop
```

<div class="notes">

TLCL 25.12A, Table 10-7. `xload` needs a graphical display and will not run on your VM.

</div>

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

SSH into your VM, then make a directory to work in:

```bash
mkdir ~/process_lab
cd ~/process_lab
```

Everything in this lab uses `sleep`. Nothing here can damage the machine, and every
exercise ends with the processes cleaned up.

---

# Exercise 1: Exploring `ps`

Compare the output of the three forms:

```bash
ps
ps x
ps aux
```

Browse the full list a page at a time:

```bash
ps aux | less
```

Look at PID 1 specifically, and at its command name:

```bash
ps uw 1
ps -p 1 -o pid,ppid,comm
```

What is PID 1 on your VM, and what is its parent?

---

# Exercise 2: Monitoring With `top`

```bash
top
```

While it runs, find each of these:

- The system uptime and the three load averages
- The percentage of the CPU that is idle
- Which process is using the most CPU
- How many tasks are sleeping

Press <kbd>h</kbd> for help, then <kbd>q</kbd> to quit.

---

# Exercise 3: Job Control

Start a background job and list it:

```bash
sleep 300 &
jobs
```

Bring it forward, pause it, and send it back:

```bash
fg %1
# press Ctrl-z
bg %1
jobs
```

Confirm from the outside that it is still there:

```bash
ps -o pid,stat,cmd -p $(jobs -p)
```

---

# Exercise 3, continued

Run several jobs at once:

```bash
sleep 400 &
sleep 500 &
jobs
```

Bring one forward and interrupt it:

```bash
fg %1
# press Ctrl-c
jobs
```

Which job numbers remain, and did they get renumbered?

---

# Exercise 4: Sending Signals

Terminate with the default signal:

```bash
sleep 1000 &
kill %1
```

Stop and continue, watching the state change:

```bash
sleep 1000 &
jobs
kill -STOP %1
jobs
kill -CONT %1
jobs
```

---

# Exercise 4, continued

Force-kill, and note the different message the shell prints:

```bash
sleep 1000 &
kill -9 %1
```

List every signal the system knows:

```bash
kill -l
```

Try to signal a process you do not own, and read the error:

```bash
kill 1
```

---

# Exercise 5: `killall` and `nohup`

Terminate several processes by name:

```bash
sleep 800 &
sleep 800 &
sleep 800 &
jobs
killall sleep
```

Run something immune to hangup, and find its output file:

```bash
nohup sleep 200 &
ls -l nohup.out
kill %1
rm -f nohup.out
```

---

# Exercise 6: Process Priority

Launch a job with reduced priority and inspect it:

```bash
nice -n 10 sleep 500 &
ps -o pid,ni,cmd -p $!
```

Lower its priority further:

```bash
renice -n 15 $!
ps -o pid,ni,cmd -p $!
```

Now try to **raise** it, and read the error carefully:

```bash
renice -n 5 $!
```

Why did that fail, and what would make it succeed?

---

# Lab Cleanup

```bash
kill $(jobs -p) 2>/dev/null
cd ~
rm -rf ~/process_lab
```

Confirm nothing is left behind:

```bash
jobs
ps x
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

Predict the output of `jobs` before you run any of this, then check:

```bash
sleep 100 &
sleep 200 &
sleep 300 &
kill %2
jobs
```

- Which jobs remain, and with which numbers?
- What do the `+` and `-` markers next to the job numbers mean?
- If you now run `sleep 400 &`, what job number does it get?

---

# Challenge 2

Given this line of `ps aux` output:

```text
USER  PID %CPU %MEM   VSZ  RSS TTY STAT START  TIME COMMAND
root  947  0.0  0.1 45320 8192 ?   Ss  Mar01  0:05 /usr/sbin/sshd
```

1. Who owns this process?
2. Does it have a controlling terminal? How can you tell, and what does that imply?
3. What does the `STAT` value `Ss` mean — both characters?
4. How much physical RAM is it using?
5. Could you terminate it as a regular user? Should you, while connected over SSH?

---

# Challenge 3

Explain the difference within each pair, and give a case where the choice matters:

1. `kill 1234` and `kill -9 1234`
2. `kill %1` and `kill 1`
3. `nice` and `renice`
4. `sudo reboot` and `sudo shutdown -h now`, on the VM you are SSHed into

---

# Assessment Questions

1. What is a process, and what is PID 1 on a systemd machine?
2. What is the difference between what `ps` shows you and what `top` shows you?
3. A job is running in the foreground. What sequence of keys and commands moves it to the background without terminating it?
4. Why should `kill -9` be used only after `kill` has failed?
5. What does `nohup` do, and what problem does it solve for a remote administrator?
6. A regular user runs `renice -n 5` on their own process, currently at niceness 15, and it fails. Why?
7. The load average on a two-CPU server reads `8.20, 7.90, 7.60`. What does that tell you?

---

# Summary

Today we learned how to:

- Read the process model — PID, parent and child, ownership, daemons
- Take a snapshot with `ps` and watch the machine live with `top`
- Read process state, `RSS`, and load average when diagnosing a slow system
- Move work between foreground, background, and stopped with `&`, `fg`, `bg`, <kbd>Ctrl</kbd>-<kbd>c</kbd>, and <kbd>Ctrl</kbd>-<kbd>z</kbd>
- Send signals with `kill` and `killall`, and reach for `TERM` before `KILL`
- Adjust scheduling priority with `nice` and `renice`
- Keep a long job alive across a disconnect with `nohup`
- Shut down or reboot a machine deliberately

These are the tools you reach for first when a server misbehaves.

---

# Additional Resources

- *The Linux Command Line*, Shotts — **Chapter 10, Processes** ([free PDF](https://linuxcommand.org/tlcl.php))
- `man ps`, `man top`, `man kill`, `man killall`, `man nice`, `man renice`, `man nohup`
- `man 7 signal` — the complete signal documentation
- `man shutdown` — every way to express a delay
- [Compute Engine — stopping and starting an instance](https://cloud.google.com/compute/docs/instances/stop-start-instance)
- `pstree` — visualize the hierarchy on your own VM, from PID 1 down
- Practice with `sleep`: it is the safest possible subject for experiments with job control

---
layout: center
class: text-center
---

<div class="kicker">CSC 171 · Linux Installation and Administration · Lecture 3</div>

# Nothing Runs Unsupervised

<div class="term">
<div class="term-bar"><i></i><i></i><i></i><span>student@parkland: ~</span></div>
<pre class="term-body"><span class="ps1">student@vm-171:~$</span> sleep 300 &amp;
<span class="dim">[1] 28236</span>
<span class="ps1">student@vm-171:~$</span> kill %1
<span class="dim">[1]+ Terminated              sleep 300</span>
<span class="ps1">student@vm-171:~$</span> <span class="cursor"></span></pre>
</div>

<div class="next">Next up — the environment: <code>printenv</code>, <code>set</code>, <code>export</code>, and the startup files that shape your shell</div>

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
.slidev-layout .term .dim { color: rgba(230, 230, 230, 0.55); }

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
