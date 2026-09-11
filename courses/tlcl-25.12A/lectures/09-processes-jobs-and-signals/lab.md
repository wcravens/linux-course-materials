---
title: 'Processes: Lab'
subtitle: 'The Linux Command Line — Lecture 9'
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
