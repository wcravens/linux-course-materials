---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Exploring the System: ls, file, and less'
info: |
  ## The Linux Command Line — Lecture 3
  ls, file, and less. Adapted from TLCL chapter 3.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Exploring the System

ls, file, and less

The Linux Command Line

Lecture 3

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Use `ls` with options and arguments to list files in various formats
- Explain the command structure pattern of `command -options arguments`
- Interpret long-format (`ls -l`) output including permissions, ownership, and timestamps
- Determine a file's type using the `file` command
- View text file contents using the `less` pager
- Identify the purpose of key directories in the Linux filesystem hierarchy

---
layout: section
---

# Command Structure

Every Linux command follows a general pattern

```bash
command -options arguments
```

---

# Options

**Short options**: single character preceded by a dash

```bash
ls -l
ls -a
```

**Long options**: word preceded by two dashes

```bash
ls --all
ls --reverse
```

---

# Combining Options

Short options can be combined into a single dash group

```bash
ls -la
# Same as: ls -l -a
```

```bash
ls -lht
# Long format, human-readable sizes, sorted by time
```

Options are **case-sensitive**: `-s` and `-S` are different options

---
layout: section
---

# Listing Files with ls

The most frequently used Linux command

```bash
ls
```

Can list multiple directories at once:

```bash
ls ~ /usr
```

---

# Common ls Options

| Option | Long Option | Description |
|--------|-------------|-------------|
| `-a` | `--all` | Show hidden (dot) files |
| `-A` | `--almost-all` | Like `-a` but excludes `.` and `..` |
| `-d` | `--directory` | List directory itself, not contents |
| `-F` | `--classify` | Append type indicator (`/` for dirs) |
| `-h` | `--human-readable` | Human-readable sizes (K, M, G) |
| `-l` | | Long listing format |
| `-r` | `--reverse` | Reverse sort order |
| `-S` | | Sort by file size |
| `-t` | | Sort by modification time |

---

# ls Examples

```bash
ls -lh /usr/bin
# Long format with human-readable sizes
```

```bash
ls -lt --reverse
# Long format, sorted by time, oldest first
```

```bash
ls -lS /usr/bin | head -10
# Ten largest files in /usr/bin
```

---
layout: section
---

# Understanding Long Format

`ls -l` produces detailed output with seven fields per line

```bash
ls -l
# -rw-r--r-- 1 root root 3576296 2024-03-22 11:18 TLCL-24.11.pdf
```

---

# Long Format Fields

| Field | Meaning |
|-------|---------|
| `-rw-r--r--` | File type and permissions |
| `1` | Hard link count |
| `root` | Owner |
| `root` | Group |
| `3576296` | Size in bytes |
| `2024-03-22 11:18` | Last modification date/time |
| `TLCL-24.11.pdf` | Filename |

---

# File Type Indicators

The first character of the permissions field reveals the file type

| Character | Meaning |
|-----------|---------|
| `-` | Regular file |
| `d` | Directory |
| `l` | Symbolic link |
| `c` | Character special file |
| `b` | Block special file |

---
layout: section
---

# Determining File Type with file

The `file` command examines a file and reports its type

Linux does not rely on file extensions — `file` inspects actual contents

---

# file Examples

```bash
file /etc/passwd
# /etc/passwd: ASCII text
```

```bash
file /bin/ls
# /bin/ls: ELF 64-bit LSB pie executable
```

```bash
file /etc
# /etc: directory
```

```bash
file /dev/null
# /dev/null: character special
```

In Unix-like systems, *"everything is a file"*

---
layout: section
---

# Viewing Files with less

**less** is a *pager* — it displays text files one page at a time

```bash
less /etc/passwd
```

Use `less` to examine configuration files, scripts, log files, and source code

---

# What Is "Text"?

**ASCII** text maps characters to numbers using a simple encoding scheme

- Plain text files contain only character data
- Word processor documents are **not** plain text — they include formatting and structure
- Many important Linux files are plain text: `/etc` configs, shell scripts, logs

---

# less Navigation

| Key | Action |
|-----|--------|
| Space / Page Down | Forward one page |
| `b` / Page Up | Back one page |
| Up / Down Arrow | Scroll one line |
| `G` | Go to end of file |
| `g` or `1G` | Go to beginning |
| `/text` | Search forward for *text* |
| `n` | Next search match |
| `h` | Help screen |
| `q` | Quit |

---

# Less Is More

- `less` replaced the older `more` command
- Both are called *pagers* — they show content one page at a time
- The name is a play on *"less is more"*

---
layout: section
---

# The Linux Filesystem Hierarchy

Linux systems follow a standard directory layout rooted at `/`

---

# System Directories

| Directory | Purpose |
|-----------|---------|
| `/` | Root — everything starts here |
| `/bin` | Essential programs (often symlink to `/usr/bin`) |
| `/boot` | Kernel and boot loader files |
| `/dev` | Device nodes (hardware as files) |
| `/etc` | System-wide configuration files |
| `/home` | User home directories |
| `/lib` | Shared libraries (often symlink to `/usr/lib`) |

---

# More System Directories

| Directory | Purpose |
|-----------|---------|
| `/lost+found` | Filesystem recovery |
| `/media` | Removable media mount points |
| `/mnt` | Manual mount points |
| `/opt` | Optional/add-on software |
| `/proc` | Virtual filesystem — kernel info |
| `/root` | Root user's home directory |
| `/run` | Runtime data (tempfs) |

---

# User Program Directories

| Directory | Purpose |
|-----------|---------|
| `/usr` | Largest tree — user programs and data |
| `/usr/bin` | Distribution-installed executables |
| `/usr/lib` | Shared libraries for `/usr/bin` |
| `/usr/local` | Locally compiled software |
| `/usr/sbin` | System administration programs |
| `/usr/share` | Shared data (configs, icons) |
| `/usr/share/doc` | Package documentation |

---

# Variable Data Directories

| Directory | Purpose |
|-----------|---------|
| `/var` | Frequently changing data |
| `/var/log` | Log files (`messages`, `syslog`) |
| `/tmp` | Temporary files (cleared on reboot) |
| `/sys` | Device and driver info (virtual) |
| `/sbin` | System binaries (often symlink to `/usr/sbin`) |

---

# Exploring with the Guided Tour Method

1. `cd` into a directory
2. Run `ls -l` to see contents
3. Use `file` on interesting entries
4. View text files with `less`

If the terminal scrambles from viewing a binary file, type `reset`

---
layout: section
---

# Symbolic Links

A special file type that points to another file by name

```bash
ls -l /lib/libc.so.6
# lrwxrwxrwx 1 root root 12 ... libc.so.6 -> libc-2.6.so
```

---

# Why Symbolic Links?

- Enable **version management** — programs use a generic name
- The symlink points to the current version
- Upgrading only requires changing the link target
- The `l` at the start of permissions identifies a symlink

---

# Creating Symbolic Links

```bash
ln -s target linkname
```

```bash
ln -s /usr/share/doc/bash docs_link
ls -l docs_link
# lrwxrwxrwx 1 user user 19 ... docs_link -> /usr/share/doc/bash
```

---

# Hard Links

- A second type of link with a different mechanism
- Additional directory entries pointing to the same data on disk
- Explored in detail in the next chapter

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/exploring_lab
cd ~/exploring_lab
mkdir -p project/{src,docs,tests}
touch project/src/main.c project/src/utils.c
touch project/docs/readme.txt project/docs/license.txt
echo "This is a sample text file." > sample.txt
echo "#\!/bin/bash" > script.sh && chmod +x script.sh
cp /etc/passwd passwd_copy.txt
```

---

# Exercise 1: Exploring ls Options

List the lab directory in different ways:

```bash
ls ~/exploring_lab
ls -F ~/exploring_lab
ls -la ~/exploring_lab
ls -lah ~/exploring_lab
```

Try listing multiple directories:

```bash
ls ~ /usr
```

---

# Exercise 2: Long Format and Sorting

Examine long-format output and identify each field:

```bash
ls -l ~/exploring_lab
ls -lh /usr/bin | head -10
ls -lS /usr/bin | head -10
```

Compare with the directory listing option:

```bash
ls -ld ~/exploring_lab/project
```

---

# Exercise 3: Determining File Types

Use `file` on different types of files:

```bash
cd ~/exploring_lab
file sample.txt
file script.sh
file project
file /bin/ls
file /dev/null
```

---

# Exercise 4: Navigating with less

View a text file and practice navigation:

```bash
less passwd_copy.txt
```

Practice: Space (forward), `b` (back), `G` (end), `g` (beginning), `/root` (search), `n` (next match), `q` (quit)

---

# Exercise 5: Exploring the Filesystem

Use the guided tour method on several directories:

```bash
ls -l /
ls /etc | head -20
file /etc/passwd
ls /usr/bin | wc -l
ls -ld /bin
```

---

# Exercise 6: Working with Symbolic Links

Create and examine symbolic links:

```bash
cd ~/exploring_lab
ln -s sample.txt sample_link.txt
ls -l sample_link.txt
cat sample_link.txt
file sample_link.txt
```

Examine system symlinks:

```bash
ls -la /bin
```

---

# Lab Cleanup

```bash
rm -rf ~/exploring_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

Write a single `ls` command that shows all files (including hidden), in long format, with human-readable sizes, sorted by modification time with the oldest file first.

---

# Challenge 2

Given this `ls -l` output, identify the file type, owner, and size of each entry:

```
drwxr-xr-x 2 alice staff 4096 2025-11-15 09:30 reports
-rw-r--r-- 1 alice staff 8234 2025-11-14 14:22 data.csv
lrwxrwxrwx 1 alice staff    8 2025-11-15 09:31 latest -> data.csv
```

---

# Challenge 3

A student wants to see the long listing of the `/etc` directory itself (not its contents) but types `ls -l /etc`. What is the corrected command?

---

# Assessment Questions

1. What is the general pattern that Linux commands follow?
2. How do you tell from `ls -l` output whether an entry is a file, directory, or symbolic link?
3. Why does Linux not rely on file extensions to determine file type?
4. What is the difference between `less` and `cat` for viewing files?
5. What is the purpose of a symbolic link, and how is it used for version management?

---

# Summary

Today we learned how to:

- Use `ls` with various options to list and sort directory contents
- Read and interpret `ls -l` long-format output
- Identify file types using the `file` command
- Navigate text files with the `less` pager
- Explore the standard Linux filesystem hierarchy
- Recognize and create symbolic links

These skills form the foundation for navigating and understanding any Linux system.

---

# Additional Resources

- `man ls` — Complete reference for listing options
- `man file` — File type identification details
- `man less` — Full pager navigation reference
- [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html) — Official directory layout specification
- Practice exploring `/etc`, `/var/log`, and `/usr/share/doc` on your system
