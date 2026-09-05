# Chapter 10: Processes

Lab Guide with Outline, Exercises, and Challenges

## Learning Objectives

After completing this chapter, you will be able to:

- Explain how Linux organizes and manages processes, including parent-child relationships and process IDs
- Use `ps` and `top` to view and monitor running processes
- Control processes by placing them in the background, returning them to the foreground, and stopping them
- Use `kill` and `killall` to send signals to processes
- Distinguish between common signals and explain when to use each one
- Apply `nice` and `renice` to adjust process scheduling priority

## Key Commands Covered

- `ps` — Report a snapshot of current processes
- `top` — Display tasks dynamically in real time
- `jobs` — List active jobs launched from the current terminal
- `bg` — Resume a stopped job in the background
- `fg` — Bring a background or stopped job to the foreground
- `kill` — Send a signal to a process by PID or jobspec
- `killall` — Send a signal to all processes matching a name
- `nice` — Launch a process with a modified scheduling priority
- `renice` — Alter the priority of a running process
- `nohup` — Run a command immune to hangup signals
- `shutdown` — Shut down or reboot the system

---

## Chapter Outline

### 1. How a Process Works

Modern operating systems are *multitasking* — they create the illusion of doing more than one thing at once by rapidly switching from one executing program to another. The Linux kernel manages this through *processes*. Processes are how Linux organizes the different programs waiting for their turn at the CPU.

When the system starts up, the kernel launches a program called `init` (PID 1). `init` starts `systemd`, which in turn starts all system services. Many of these services are *daemon programs* — programs that run in the background without a user interface.

A program can launch other programs. This is expressed as a *parent process* producing a *child process*. The kernel maintains information about each process, including:

- A **process ID (PID)** — assigned in ascending order, with `init` always getting PID 1
- Memory assigned to the process
- The process's readiness to resume execution
- Process owners, user IDs, and effective user IDs

### 2. Viewing Processes with ps

The `ps` command reports a snapshot of current processes. In its simplest form:

```bash
ps
# PID TTY          TIME CMD
# 5198 pts/1    00:00:00 bash
# 10129 pts/1   00:00:00 ps
```

By default, `ps` shows only processes associated with the current terminal session. The columns are:

- **PID** — Process ID
- **TTY** — Controlling terminal ("teletype")
- **TIME** — Amount of CPU time consumed
- **CMD** — The command name

Adding the `x` option (no leading dash) shows all processes owned by the current user, regardless of terminal:

```bash
ps x
# PID TTY      STAT   TIME COMMAND
# 2799 ?       Ssl    0:00 /usr/libexec/bonobo-activation-server ...
# ...
```

A `?` in the TTY column indicates no controlling terminal. This form adds the **STAT** column, which shows process state.

**Process States (STAT column):**

| State | Meaning |
|-------|---------|
| `R` | Running — the process is running or ready to run |
| `S` | Sleeping — waiting for an event (keystroke, network packet) |
| `D` | Uninterruptible sleep — waiting for I/O such as a disk drive |
| `T` | Stopped — the process has been instructed to stop |
| `Z` | Zombie — a child process that has terminated but not been cleaned up by its parent |
| `<` | High-priority process (less "nice") |
| `N` | Low-priority process (more "nice") |

### 3. ps with BSD-Style Options

The `ps aux` option combination (without a leading dash) displays processes belonging to every user with verbose output:

```bash
ps aux
# USER  PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
# root    1  0.0  0.0   2136   644 ?    Ss   Mar05   0:31 init
# ...
```

**Popular BSD-style ps options:**

| Option | Function |
|--------|----------|
| `x` | List the current user's running processes |
| `ax` | List all running processes |
| `w` | Include full command names |
| `u` | Verbose listing |

**BSD-style column headers:**

| Header | Meaning |
|--------|---------|
| `USER` | Owner of the process |
| `%CPU` | CPU usage in percent |
| `%MEM` | Memory usage in percent |
| `VSZ` | Virtual memory size |
| `RSS` | Resident set size — physical RAM used (in kilobytes) |
| `START` | Time when the process started (date if over 24 hours) |
| `TIME` | CPU time consumed by the process |

To view details about a single process, include its PID:

```bash
ps uw 44719
# USER  PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
# me  44719  0.0  0.0  13480  6492 pts/1 S   15:57   0:00 bash
```

### 4. Viewing Processes Dynamically with top

The `top` command displays a continuously updating view of system processes, sorted by CPU activity (updated every three seconds by default). The display has two parts: a system summary and a process table.

```bash
top
```

**System summary fields:**

| Row | Field | Meaning |
|-----|-------|---------|
| 1 | `top` | Program name |
| 1 | `14:59:20` | Current time of day |
| 1 | `up 6:30` | Uptime — time since last boot |
| 1 | `2 users` | Number of logged-in users |
| 1 | `load average:` | Number of processes waiting to run (averages for the last 1, 5, and 15 minutes; values less than 1.0 mean the machine is not busy) |
| 2 | `Tasks:` | Number of processes and their states |
| 3 | `Cpu(s):` | CPU activity breakdown |
| 3 | `%us` | Percent used by user processes (outside the kernel) |
| 3 | `%sy` | Percent used by system (kernel) processes |
| 3 | `%ni` | Percent used by low-priority ("nice") processes |
| 3 | `%id` | Percent idle |
| 3 | `%wa` | Percent waiting for I/O |
| 4 | `Mem:` | Physical RAM usage |
| 5 | `Swap:` | Swap space (virtual memory) usage |

**Key `top` commands:**

- `h` — Display help screen
- `q` — Quit `top`

### 5. Interrupting a Process

When a program is running in the foreground, pressing **Ctrl-c** sends an INT (interrupt) signal, politely asking it to terminate.

```bash
xlogo
# (Ctrl-c to interrupt)
```

Many (but not all) command-line programs can be interrupted this way.

### 6. Putting a Process in the Background

To launch a program in the background so it runs while the shell prompt remains available, append an ampersand (`&`) to the command:

```bash
xlogo &
# [1] 28236
```

The shell prints the **job number** (`[1]`) and the **PID** (`28236`). This is part of the shell's *job control* facility.

Use the `jobs` command to list background jobs launched from the current terminal:

```bash
jobs
# [1]+ Running    xlogo &
```

Multiple commands can be placed in the background on one line:

```bash
xlogo & gedit &
# [1] 47211
# [2] 47212
```

### 7. Returning a Process to the Foreground

Use the `fg` command followed by a jobspec (`%` plus the job number) to return a background process to the foreground:

```bash
fg %1
# xlogo
```

A background process is immune from terminal keyboard input (including Ctrl-c). You must bring it to the foreground first to interact with it. If there is only one background job, the jobspec is optional.

### 8. Stopping (Pausing) a Process

Pressing **Ctrl-z** sends a TSTP (terminal stop) signal, which stops (pauses) the foreground process without terminating it:

```bash
xlogo
# (Ctrl-z)
# [1]+ Stopped    xlogo
```

A stopped process can be resumed:

- In the foreground with `fg`:
  ```bash
  fg %1
  ```
- In the background with `bg`:
  ```bash
  bg %1
  # [1]+ xlogo &
  ```

This is handy when you launch a graphical program from the command line but forget to append `&`.

### 9. Changing Process Priority

Every process has a *niceness* attribute that determines its scheduling priority. The value ranges from **-20** (highest priority, least nice) to **19** (lowest priority, most nice), with a default of **0**.

**Rules:**
- Regular users may only *decrease* the priority (increase niceness) of processes they own
- Only the superuser may *increase* the priority (decrease niceness)

The `nice` command launches a process with a specified niceness:

```bash
nice -n 10 cpu-hog
```

To increase priority (requires superuser):

```bash
sudo nice -n -10 must-run-fast
```

The `renice` command changes the niceness of an already-running process:

```bash
renice -n 19 379215
```

A niceness of 19 makes the process use CPU cycles only when nothing else is waiting.

### 10. Signals

Signals are one of several ways the operating system communicates with programs. When the terminal receives certain keystrokes, it sends a signal to the foreground program:

- **Ctrl-c** sends INT (interrupt)
- **Ctrl-z** sends TSTP (terminal stop)

Programs "listen" for signals and may act upon them — for example, saving work in progress before terminating.

### 11. Sending Signals with kill

The `kill` command sends signals to processes by PID or jobspec:

```bash
kill [-signal] PID...
```

If no signal is specified, TERM (terminate) is sent by default.

```bash
xlogo &
# [1] 28401
kill 28401
# [1]+ Terminated    xlogo
```

**Common signals:**

| Number | Name | Meaning |
|--------|------|---------|
| 1 | HUP | Hangup — sent when the controlling terminal closes. Also used by daemons to trigger reinitialization (reread config files). |
| 2 | INT | Interrupt — same as Ctrl-c. Usually terminates the program. |
| 9 | KILL | Kill — the kernel immediately terminates the process. The program cannot catch or ignore this signal. Use only as a last resort. |
| 15 | TERM | Terminate — the default signal. The program can handle it gracefully. |
| 18 | CONT | Continue — restores a process after a STOP or TSTP signal. Sent by `bg` and `fg`. |
| 19 | STOP | Stop — pauses the process. Like KILL, it cannot be caught or ignored. |
| 20 | TSTP | Terminal stop — sent by Ctrl-z. The program may choose to ignore it. |

Signals can be specified by number, by name, or by name with the `SIG` prefix:

```bash
kill -1 13546
kill -INT 13601
kill -SIGINT 13608
```

Jobspecs can be used in place of PIDs:

```bash
kill %1
```

**Other common signals:**

| Number | Name | Meaning |
|--------|------|---------|
| 3 | QUIT | Quit |
| 11 | SEGV | Segmentation violation — illegal memory access |
| 28 | WINCH | Window change — sent when a terminal window is resized |

To view a complete list of signals:

```bash
kill -l
```

Processes have owners — you must own a process (or be the superuser) to send it signals.

### 12. Making a Process Hangup Proof with nohup

When a terminal closes, the HUP signal is sent to its foreground process, which normally terminates it. The `nohup` command makes a process immune to HUP:

```bash
nohup xlogo
```

Now closing the terminal window will not terminate `xlogo`.

### 13. Sending Signals to Multiple Processes with killall

The `killall` command sends signals to all processes matching a given program name:

```bash
killall [-u user] [-signal] name...
```

```bash
xlogo &
# [1] 18801
xlogo &
# [2] 18802
killall xlogo
# [1]- Terminated    xlogo
# [2]+ Terminated    xlogo
```

As with `kill`, you must own the processes or be the superuser.

### 14. Shutting Down the System

Shutting down involves orderly termination of all processes and syncing mounted file systems. Four commands perform this function:

- `halt` — Halt the system
- `poweroff` — Power off the system
- `reboot` — Reboot the system
- `shutdown` — Shut down with scheduling options

```bash
sudo reboot
```

The `shutdown` command supports a time delay and action selection:

```bash
sudo shutdown -h now    # Halt immediately
sudo shutdown -r now    # Reboot immediately
```

When `shutdown` is executed, a message is broadcast to all logged-in users warning them.

### 15. More Process-Related Commands

| Command | Description |
|---------|-------------|
| `pstree` | Outputs a process list in a tree pattern showing parent-child relationships |
| `vmstat` | Snapshot of system resource usage (memory, swap, disk I/O). Use `vmstat 5` for continuous updates. |
| `xload` | Graphical program that draws a graph of system load over time |
| `tload` | Like `xload` but draws the graph in the terminal. Terminate with Ctrl-c. |

---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir ~/process_lab
cd ~/process_lab
```

### Exercise 1: Viewing Processes with ps (10 minutes)

**Task 1.1**: Run `ps` with no options and observe the output.

```bash
ps
```

**Task 1.2**: Run `ps` with the `x` option to see all of your processes.

```bash
ps x
```

**Task 1.3**: Run `ps` with `aux` to see all processes on the system.

```bash
ps aux
```

**Task 1.4**: Pipe the output through `less` to browse it.

```bash
ps aux | less
```

**Questions to answer:**

1. How many columns did plain `ps` show versus `ps aux`?
2. What does a `?` in the TTY column mean?
3. What is the PID of your current bash shell?

### Exercise 2: Understanding Process States (10 minutes)

**Task 2.1**: Look at the STAT column for several processes.

```bash
ps aux | head -20
```

**Task 2.2**: Find all zombie processes (if any) on the system.

```bash
ps aux | grep -w Z
```

**Task 2.3**: Find the process with PID 1 and note its command name.

```bash
ps aux | grep -w "^ *root *1 "
```

Or more directly:

```bash
ps uw 1
```

**Questions to answer:**

1. What does a STAT value of `Ss` mean? (Hint: what does `S` mean and what does the lowercase `s` indicate?)
2. What command is running as PID 1 on your system?
3. What is the difference between the `S` and `R` process states?

### Exercise 3: Monitoring with top (10 minutes)

**Task 3.1**: Launch `top` and observe the display for 30 seconds.

```bash
top
```

**Task 3.2**: While `top` is running, note the following from the summary area:
- System uptime
- Number of users
- Load averages (1, 5, and 15 minutes)
- Percentage of CPU idle time
- Total and used memory

**Task 3.3**: Press `h` to view the help screen, then press any key to return.

**Task 3.4**: Press `q` to quit `top`.

**Questions to answer:**

1. Which process was using the most CPU when you ran `top`?
2. What do the three load average numbers represent?
3. How often does `top` update its display by default?

### Exercise 4: Job Control — Background and Foreground (15 minutes)

**Task 4.1**: Start a long-running process in the foreground, then interrupt it.

```bash
sleep 300
# Press Ctrl-c to interrupt
```

**Task 4.2**: Start a process in the background using `&`.

```bash
sleep 300 &
```

**Task 4.3**: List your background jobs.

```bash
jobs
```

**Task 4.4**: Bring the background job to the foreground, then send it back.

```bash
fg %1
# Press Ctrl-z to stop (pause) it
bg %1
```

**Task 4.5**: Start two more background jobs and list them all.

```bash
sleep 400 &
sleep 500 &
jobs
```

**Questions to answer:**

1. What information does the shell print when you launch a command with `&`?
2. What is the difference between Ctrl-c and Ctrl-z?
3. After pressing Ctrl-z, is the process terminated or paused?

### Exercise 5: Stopping and Resuming Processes (10 minutes)

**Task 5.1**: Start a foreground process and stop it with Ctrl-z.

```bash
sleep 600
# Press Ctrl-z
```

**Task 5.2**: Verify the job is stopped.

```bash
jobs
```

**Task 5.3**: Resume it in the background.

```bash
bg %1
```

**Task 5.4**: Verify it is now running in the background.

```bash
jobs
```

**Task 5.5**: Bring it back to the foreground and terminate it.

```bash
fg %1
# Press Ctrl-c
```

**Questions to answer:**

1. What was the job's status after Ctrl-z — `Running` or `Stopped`?
2. What changed in the `jobs` output after running `bg %1`?
3. When would this foreground-to-background technique be useful in practice?

### Exercise 6: Sending Signals with kill (15 minutes)

**Task 6.1**: Start a background process and terminate it with `kill`.

```bash
sleep 1000 &
jobs
kill %1
jobs
```

**Task 6.2**: Start another background process and send it different signals.

```bash
sleep 1000 &
kill -STOP %1
jobs
kill -CONT %1
jobs
```

**Task 6.3**: Use the KILL signal (signal 9) as a last resort.

```bash
sleep 1000 &
kill -9 %1
jobs
```

**Task 6.4**: List all available signals.

```bash
kill -l
```

**Questions to answer:**

1. What is the default signal sent by `kill` when no signal is specified?
2. Why should signal 9 (KILL) only be used as a last resort?
3. What is the difference between STOP and TSTP signals?

### Exercise 7: Using killall and nohup (10 minutes)

**Task 7.1**: Start multiple background `sleep` processes and terminate them all at once.

```bash
sleep 800 &
sleep 800 &
sleep 800 &
jobs
killall sleep
jobs
```

**Task 7.2**: Observe the effect of `nohup` (without actually closing the terminal).

```bash
nohup sleep 200 &
ls nohup.out
```

**Task 7.3**: Clean up the `nohup` process.

```bash
kill %1
rm -f nohup.out
```

**Questions to answer:**

1. How does `killall` differ from `kill`?
2. What file does `nohup` create, and why?
3. In what scenario would you use `nohup`?

### Exercise 8: Process Priority with nice and renice (10 minutes)

**Task 8.1**: Start a process with reduced priority.

```bash
nice -n 10 sleep 500 &
```

**Task 8.2**: Verify the niceness value with `ps`.

```bash
ps -o pid,ni,cmd -p $!
```

**Task 8.3**: Change the niceness of the running process.

```bash
renice -n 15 $!
ps -o pid,ni,cmd -p $!
```

**Task 8.4**: Attempt to increase priority (this should fail for a regular user).

```bash
renice -n 5 $!
```

**Task 8.5**: Clean up.

```bash
kill %1
```

**Questions to answer:**

1. What is the range of niceness values, and what does a higher value mean?
2. Why did the attempt to set a lower niceness value fail?
3. What niceness value would make a process use CPU only when nothing else is waiting?

### Lab Cleanup

```bash
kill $(jobs -p) 2>/dev/null
rm -rf ~/process_lab
```

---

## Challenge Section

**Challenge 1: Explain Process Basics**

In your own words, describe what a *process* is and how parent-child relationships work in Linux. Explain the role of `init` (PID 1) and what *daemon programs* are.

**Challenge 2: Predict the Output**

A user runs the following commands. Describe what the `jobs` output will show after each step.

```bash
sleep 100 &
sleep 200 &
sleep 300 &
kill %2
jobs
```

**Challenge 3: Interpret ps Output**

Given the following `ps aux` output for a single process:

```
USER  PID %CPU %MEM    VSZ   RSS TTY  STAT START   TIME COMMAND
root  947  0.0  0.1  45320  8192 ?    Ss   Mar01   0:05 /usr/sbin/sshd
```

Answer the following:
1. Who owns this process?
2. Does it have a controlling terminal?
3. What does the STAT value `Ss` mean?
4. How much physical RAM is it using?

**Challenge 4: Signal Identification**

Match each action to the correct signal name and number:

1. A user presses Ctrl-c at the terminal
2. A user presses Ctrl-z at the terminal
3. The `kill` command is run with no signal argument
4. A terminal window is closed, disconnecting the session
5. The kernel forcibly terminates a process that won't respond

**Challenge 5: True or False**

Mark each statement as true or false and provide a brief justification.

1. The `kill` command always terminates a process.
2. Signal 9 (KILL) can be caught and handled by a program.
3. A regular user can increase the priority (lower the niceness) of their own processes.
4. The `bg` command sends the CONT signal to a stopped job.
5. A zombie process is one that is consuming large amounts of CPU.
6. The `nohup` command makes a process immune to the HUP signal.

**Challenge 6: Debugging — Fix the Command**

A student wants to find the PID of all running `bash` processes, but their command returns too much output including unrelated lines. Identify the problem and provide a corrected command.

```bash
ps aux | grep bash
```

**Challenge 7: Job Control Scenario**

You are editing a file with `vim` in the terminal and realize you need to run a quick command. Describe the exact steps (keystrokes and commands) to:

1. Pause `vim` without closing it
2. Run your command at the shell prompt
3. Return to `vim` exactly where you left off

**Challenge 8: Explain the Difference**

Explain the difference between each pair:

1. `kill 1234` vs. `kill -9 1234`
2. `kill %1` vs. `kill 1234`
3. `kill` vs. `killall`
4. `nice` vs. `renice`

**Challenge 9: Process Monitoring Scenario**

Your Linux server is responding slowly. Describe the steps you would take to diagnose the problem using `ps` and `top`. What specific information would you look for in the output of each command? Name at least three things you would check.

**Challenge 10: Write the Commands**

Write the exact command(s) for each scenario:

1. Launch a long-running backup script (`backup.sh`) in the background with reduced priority (niceness of 15)
2. Check that it is running and note its PID
3. The backup is taking too long and you want to lower its priority even further to niceness 19
4. The backup has hung and will not respond to a normal termination signal — forcibly terminate it

**Challenge 11: nohup and Background Processes**

Explain why running `nohup long_task.sh &` is useful when connecting to a remote server via SSH. What would happen to `long_task.sh` if you ran it as just `long_task.sh &` and then closed your SSH session?

**Challenge 12: Putting It All Together**

You have three CPU-intensive tasks to run: `render_video.sh`, `compile_project.sh`, and `analyze_data.sh`. Write a sequence of commands that:

1. Launches all three in the background with a niceness of 10
2. Lists them as background jobs
3. Terminates all three at once using a single command

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---------|---------|
| `ps` | Report a snapshot of current processes |
| `top` | Display processes dynamically in real time |
| `jobs` | List active jobs from the current terminal |
| `bg` | Resume a stopped job in the background |
| `fg` | Bring a job to the foreground |
| `kill` | Send a signal to a process by PID or jobspec |
| `killall` | Send a signal to processes by name |
| `nice` | Launch a process with modified priority |
| `renice` | Change priority of a running process |
| `nohup` | Run a command immune to hangup signals |
| `shutdown` | Shut down or reboot the system |
| `pstree` | Display processes in a tree showing parent-child relationships |
| `vmstat` | Show system resource usage (memory, swap, disk I/O) |

### Process States Summary

| State | Name | Description | Example |
|-------|------|-------------|---------|
| `R` | Running | Process is running or ready to run | Active computation |
| `S` | Sleeping | Waiting for an event | Waiting for keyboard input |
| `D` | Uninterruptible sleep | Waiting for I/O | Disk read in progress |
| `T` | Stopped | Process has been paused | After Ctrl-z |
| `Z` | Zombie | Terminated but not cleaned up | Child process awaiting parent |

### Common Signals Summary

| Signal | Number | Sent By | Can Be Caught? | Typical Use |
|--------|--------|---------|----------------|-------------|
| HUP | 1 | Terminal close | Yes | Terminate or reinitialize daemons |
| INT | 2 | Ctrl-c | Yes | Politely interrupt a program |
| KILL | 9 | `kill -9` | No | Force-terminate unresponsive process |
| TERM | 15 | `kill` (default) | Yes | Graceful termination |
| TSTP | 20 | Ctrl-z | Yes | Pause a foreground process |
| CONT | 18 | `fg` / `bg` | Yes | Resume a stopped process |
| STOP | 19 | `kill -STOP` | No | Force-pause a process |

### Job Control Quick Reference

| Action | Command / Keystroke |
|--------|-------------------|
| Run in background | `command &` |
| List background jobs | `jobs` |
| Bring job to foreground | `fg %N` |
| Send stopped job to background | `bg %N` |
| Pause foreground process | Ctrl-z |
| Interrupt foreground process | Ctrl-c |
| Terminate by PID | `kill PID` |
| Terminate by job number | `kill %N` |
| Force-kill | `kill -9 PID` |
| Kill all by name | `killall name` |

### Tips for Success

1. Use `ps aux | less` to browse the full process list — it is often too long to read in a single screen.
2. Learn the common signal numbers: 1 (HUP), 2 (INT), 9 (KILL), 15 (TERM), 18 (CONT), 19 (STOP), 20 (TSTP).
3. Always try `kill PID` (TERM) before resorting to `kill -9 PID` (KILL) — the KILL signal gives the process no chance to clean up.
4. Use `jobs` to find job numbers and `ps` to find PIDs — both can be used with `kill`.
5. When running long tasks on a remote server, use `nohup command &` to prevent the task from dying when you disconnect.
6. The `$!` variable holds the PID of the most recently backgrounded process — useful in scripts.

### Common Pitfalls

- Using `kill -9` as a first resort — this prevents the process from saving data or cleaning up temporary files. Always try TERM first.
- Forgetting that `kill` sends TERM (signal 15) by default, not KILL (signal 9) — the name is misleading.
- Confusing `kill` PIDs with `kill` jobspecs — `kill 1` sends a signal to PID 1 (init!), while `kill %1` sends it to job 1. Always use `%` for jobspecs.
- Attempting to increase process priority as a regular user — only the superuser can decrease niceness values (increase priority).
- Running `killall` carelessly — on some systems it may match more processes than expected. Verify with `ps` first.
