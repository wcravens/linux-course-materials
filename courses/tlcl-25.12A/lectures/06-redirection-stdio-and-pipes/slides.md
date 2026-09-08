---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Redirection: STDIO, Pipes, and Filters'
info: |
  ## The Linux Command Line — Lecture 6
  STDIO, Pipes, and Filters. Adapted from TLCL chapter 6.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Redirection

STDIO, Pipes, and Filters

The Linux Command Line

Lecture 6

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain standard input, output, and error (STDIO)
- Use redirection operators to control data flow
- Chain commands together using pipes
- Apply common filter commands to process text data
- Combine multiple tools to solve real-world tasks
- Archive and compress data

---
layout: section
---

# Understanding STDIO

Every program in Linux has **three default data streams**

Think of these as three separate channels that every program has open

---

# Standard Input (stdin)

**File Descriptor 0**

- Where a program reads its input
- By default, comes from the keyboard
- Can be redirected from files or other commands

---

# Standard Output (stdout)

**File Descriptor 1**

- Where a program writes its normal output
- By default, goes to the terminal screen
- Can be redirected to files or other commands

---

# Standard Error (stderr)

**File Descriptor 2**

- Where a program writes error messages
- By default, goes to the terminal screen (like stdout)
- Can be redirected separately from stdout

---
layout: section
---

# Redirection Operators

---

# Output Redirection

`>` — Redirect stdout to a file (overwrite)

```bash
ls -l > filelist.txt
```

`>>` — Redirect stdout to a file (append)

```bash
echo "New line" >> log.txt
```

---

# Input Redirection

`<` — Redirect stdin from a file

```bash
sort < unsorted.txt
```

`<<` — Here document (multi-line input)

```bash
cat << EOF
Line 1
Line 2
EOF
```

---
layout: section
---

# File Descriptors

Integer numbers that represent open files or data streams in a process

| FD | Name   | Description     |
|----|--------|-----------------|
| 0  | stdin  | Standard Input  |
| 1  | stdout | Standard Output |
| 2  | stderr | Standard Error  |

---

# Using File Descriptors

Explicitly redirect stdout (same as `>`):

```bash
command 1> output.txt
```

Redirect stderr to a file:

```bash
find / -name "*.txt" 2> errors.txt
```

---

# Redirect Both Streams

Redirect both stdout and stderr:

```bash
command &> output_and_errors.txt
command > output.txt 2>&1    # older syntax
```

Redirect to separate files:

```bash
command > output.txt 2> errors.txt
```

---

# Special Redirection

`/dev/null` — The bit bucket (discard output)

```bash
command 2> /dev/null    # silence errors
```

Redirect stdout to stderr (useful in scripts):

```bash
echo "Error message" 1>&2
```

---

# Custom File Descriptors

You can create your own file descriptors (3-9):

```bash
# Open FD 3 for writing
exec 3> myfile.txt
echo "Line 1" >&3
echo "Line 2" >&3
exec 3>&-    # Close FD 3
```

```bash
# Open FD 4 for reading
exec 4< inputfile.txt
read -u 4 line
exec 4>&-    # Close FD 4
```

---

# Why File Descriptors Matter

- Precise control over where data flows
- Essential for complex shell scripts
- Preserve streams while redirecting others
- Enable advanced logging and error handling

---
layout: section
---

# Pipes: Connecting Commands

The pipe operator `|` connects stdout of one command to stdin of another

```bash
command1 | command2 | command3
```

Data flows **left to right** through the pipeline

---

# Pipe Example

```bash
cat /var/log/syslog | grep "error" | wc -l
```

1. Read a log file
2. Filter for lines containing "error"
3. Count them

---

# Key Pipe Concepts

- Build complex operations from simple tools
- Each command runs **simultaneously** (not sequentially)
- Data flows in **real-time** through the pipeline
- The Unix philosophy: *"Do one thing and do it well"*

---
layout: section
---

# Essential Filter Commands

Filters read from stdin, process data, and write to stdout

---

# cat — Concatenate and Display

```bash
cat file.txt                # Display file
cat file1.txt file2.txt     # Concatenate multiple files
cat -n file.txt             # Number all lines
```

---

# grep — Search for Patterns

```bash
grep "error" logfile.txt       # Find lines with "error"
grep -i "error" file.txt       # Case-insensitive
grep -v "debug" file.txt       # Invert match (exclude)
grep -r "TODO" /home/user      # Recursive search
grep -n "pattern" file.txt     # Show line numbers
```

---

# sort — Sort Lines of Text

```bash
sort file.txt              # Alphabetical sort
sort -n numbers.txt        # Numeric sort
sort -r file.txt           # Reverse sort
sort -u file.txt           # Sort and remove duplicates
sort -k2 data.txt          # Sort by second field
```

---

# uniq — Filter Repeated Lines

Requires **sorted input**!

```bash
sort file.txt | uniq          # Remove duplicates
sort file.txt | uniq -c       # Count occurrences
sort file.txt | uniq -d       # Show only duplicates
```

---

# head & tail

```bash
head file.txt              # First 10 lines
head -n 20 file.txt        # First 20 lines
```

```bash
tail file.txt              # Last 10 lines
tail -n 20 file.txt        # Last 20 lines
tail -f /var/log/syslog    # Follow file (real-time)
```

---

# wc — Word Count

```bash
wc file.txt           # Lines, words, characters
wc -l file.txt        # Count lines only
wc -w file.txt        # Count words only
```

---

# cut — Extract Fields

```bash
cut -d',' -f1 data.csv       # First field (comma-delimited)
cut -c1-10 file.txt          # Characters 1-10
```

---

# tr — Translate Characters

```bash
cat file.txt | tr 'a-z' 'A-Z'    # Convert to uppercase
cat file.txt | tr -d ' '          # Delete spaces
cat file.txt | tr -s ' '          # Squeeze repeated spaces
```

---

# tee — Split Output

Read from stdin, write to **both** stdout and files

```bash
ls -l | tee listing.txt                  # Display AND save
command | tee -a log.txt                 # Display and append
command | tee file1.txt file2.txt | grep "error"
```

---
layout: section
---

# Compression Tools

---

# gzip / gunzip

```bash
gzip largefile.txt                # Creates largefile.txt.gz
gunzip largefile.txt.gz           # Restores largefile.txt
gzip -c file.txt > file.txt.gz   # Keep original file
zcat file.txt.gz                  # View without decompressing
```

---

# tar — Archive Files

```bash
tar -czf archive.tar.gz dir/    # Create compressed archive
tar -xzf archive.tar.gz         # Extract compressed archive
tar -tzf archive.tar.gz         # List contents
tar -xzf archive.tar.gz file1   # Extract specific file
```

---

# Common tar Options

| Flag | Meaning          |
|------|------------------|
| `-c` | Create          |
| `-x` | Extract         |
| `-z` | gzip compression|
| `-j` | bzip2 compression|
| `-f` | File name       |
| `-v` | Verbose         |
| `-t` | List contents   |

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/redirection_lab
cd ~/redirection_lab
```

Create sample data files:
- `server.log` — simulated server log
- `users.csv` — sample user data
- `numbers.txt` — numbers 1-100

---

# Exercise 1: Basic Redirection

Save a directory listing to a file:

```bash
ls -lh > directory_listing.txt
cat directory_listing.txt
```

Append the current date:

```bash
date >> directory_listing.txt
```

---

# Exercise 1 (cont.)

Redirect stderr:

```bash
ls /nonexistent 2> error_log.txt
cat error_log.txt
```

Redirect both stdout and stderr:

```bash
ls /etc /nonexistent &> combined_output.txt
```

---

# Exercise 2: Working with Pipes

Find and count ERROR lines:

```bash
grep "ERROR" server.log | wc -l
```

Display 5 most recent entries:

```bash
tail -n 5 server.log
```

Find WARN messages and sort:

```bash
grep "WARN" server.log | sort
```

---

# Exercise 2 (cont.)

Count unique log levels:

```bash
cut -d' ' -f3 server.log | sort | uniq
```

Find user login events:

```bash
grep "User login" server.log | cut -d':' -f2
```

---

# Exercise 3: Complex Pipelines

Top 5 largest files in /etc:

```bash
du -h /etc/* 2>/dev/null | sort -rh | head -n 5
```

Count occurrences of each log level:

```bash
cut -d' ' -f3 server.log | sort | uniq -c | sort -rn
```

---

# Exercise 3 (cont.)

Extract unique usernames from CSV:

```bash
tail -n +2 users.csv | cut -d',' -f1 | sort
```

Find users who logged in on a specific date:

```bash
grep "2025-09-30" users.csv | cut -d',' -f1,4
```

---

# Exercise 4: tee and tail -f

Process data and save intermediate results:

```bash
cat server.log | grep "ERROR" | tee error_messages.txt | wc -l
```

Monitor a file in real-time:

```bash
tail -f server.log | tee live_monitor.txt
```

---

# Exercise 5: Archive & Compression

Create a compressed archive:

```bash
tar -czf redirection_lab.tar.gz redirection_lab/
```

List contents without extracting:

```bash
tar -tzf redirection_lab.tar.gz | head -n 10
```

Compress and view without decompressing:

```bash
gzip numbers_copy.txt
zcat numbers_copy.txt.gz | head -n 10
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

Extract ERROR and WARN messages, sort, save, and count:

```bash
grep -E "ERROR|WARN" server.log | sort | tee issues.txt | wc -l
```

---

# Challenge 2

Find files modified in last 7 days, sorted by size:

```bash
find ~ -type f -mtime -7 2>/dev/null \
  | xargs ls -lh 2>/dev/null \
  | sort -k5 -h
```

---

# Challenge 3

Monitor CPU usage every 2 seconds:

```bash
watch -n 2 "top -bn1 | head -n 5"
```

With logging:

```bash
while true; do
  date >> cpu_log.txt
  top -bn1 | head -n 5 | tail -n 3 >> cpu_log.txt
  sleep 2
done
```

---

# Assessment Questions

1. What's the difference between `>` and `>>`?
2. How would you discard all error messages from a command?
3. Why does `uniq` usually need sorted input?
4. What does the `-f` flag do with `tail`?
5. How would you save output to a file while also viewing it on screen?

---

# Summary

Today we learned how to:

- Control where input comes from and output goes to
- Chain commands with pipes for powerful workflows
- Use essential filter commands to process text
- Compress and archive files
- Monitor files in real-time

These skills form the foundation of efficient Linux system administration and data processing.

---

# Additional Resources

- `man bash` — see REDIRECTION section
- `man` pages for each command
- [GNU Core Utilities Manual](https://www.gnu.org/software/coreutils/manual/)
- Practice with real log files in `/var/log/`
