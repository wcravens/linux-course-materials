---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Navigation: Moving Around the Linux File System'
info: |
  ## The Linux Command Line — Lecture 2
  Moving Around the Linux File System. Adapted from TLCL chapter 2.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Navigation

Moving Around the Linux File System

The Linux Command Line

Lecture 2

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain how the Linux file system is organized as a hierarchical tree structure
- Use `pwd` to display the current working directory
- Use `ls` to list the contents of directories
- Navigate the file system using `cd` with absolute and relative pathnames
- Distinguish between absolute pathnames and relative pathnames
- Apply navigation shortcuts including `~`, `-`, `.`, and `..`

---
layout: section
---

# The File System Tree

Linux organizes all files in a single **hierarchical directory structure**

Think of it as an upside-down tree with the root at the top

---

# Root Directory

The first directory in the file system is called the **root directory**, written as `/`

- Every file and directory lives somewhere beneath `/`
- All branches of the tree extend downward from root
- The root directory is not the same as the root user's home directory

---

# Single Tree vs. Multiple Drives

**Windows**: Each storage device gets its own tree (`C:\`, `D:\`, `E:\`)

**Linux**: One single file system tree, regardless of how many drives are attached

- Storage devices are **mounted** at various points on the tree
- The system administrator controls where devices are mounted
- Users navigate one unified tree structure

---

# Key Directories

| Directory | Purpose |
|-----------|---------|
| `/` | Root — top of the file system tree |
| `/home` | User home directories |
| `/bin` | Essential user command binaries |
| `/etc` | System configuration files |
| `/usr` | User programs and data |
| `/var` | Variable data (logs, mail, etc.) |
| `/tmp` | Temporary files |

---
layout: section
---

# The Current Working Directory

---

# Where Am I?

At any moment, you are standing inside one directory — the **current working directory**

- From here you can see files in the directory
- You can see the path up to the parent directory
- You can see subdirectories below you

---

# pwd — Print Working Directory

The `pwd` command shows your current location:

```bash
pwd
# /home/me
```

Use `pwd` frequently to confirm where you are

---

# The Home Directory

When you log in, your current working directory is your **home directory**

```bash
pwd
# /home/me
```

- Each user has their own home directory
- It is the only place a regular user can write files
- Represented by the `~` (tilde) shortcut

---
layout: section
---

# Listing Directory Contents

---

# ls — List Files

The `ls` command lists files and directories in the current directory:

```bash
ls
# Desktop Documents Downloads Music Pictures
```

---

# Listing Other Directories

You can list any directory by specifying its path:

```bash
ls /usr
# bin games include lib local sbin share src
```

List multiple directories at once:

```bash
ls ~ /usr
# /home/me:
# Desktop Documents Downloads Music Pictures
#
# /usr:
# bin games include lib local sbin share src
```

---

# Hidden Files

Files beginning with `.` are **hidden** — `ls` does not show them by default

Use `ls -a` to see all files, including hidden ones:

```bash
ls -a
# . .. .bash_history .bashrc Desktop Documents Downloads
```

The `.` entry is the current directory, `..` is the parent directory

---

# Changing Directories

The `cd` command changes your current working directory

```bash
cd /usr/bin
pwd
# /usr/bin
```

Two ways to specify where to go:

- **Absolute pathnames** — start from root
- **Relative pathnames** — start from current directory

---
layout: section
---

# Absolute Pathnames

---

# Starting from Root

An **absolute pathname** begins with `/` (the root directory) and traces the complete path:

```bash
cd /usr/bin
pwd
# /usr/bin
```

```bash
cd /usr/local/bin
pwd
# /usr/local/bin
```

---

# When to Use Absolute Pathnames

- They work the same no matter where you currently are
- Use them when you know the full path to your destination
- Use them when you are unsure of your current location

Every absolute pathname starts with `/` — if it does not start with `/`, it is a relative pathname

---
layout: section
---

# Relative Pathnames

---

# Starting from Here

A **relative pathname** starts from your current working directory

Two special notations:

| Notation | Meaning |
|----------|---------|
| `.` | The current directory |
| `..` | The parent directory (one level up) |

---

# Moving Up with `..`

```bash
cd /usr/bin
cd ..
pwd
# /usr
```

Move up two levels:

```bash
cd /usr/local/bin
cd ../..
pwd
# /usr
```

---

# Moving Down

Navigate into a subdirectory by name:

```bash
cd /usr
cd bin
pwd
# /usr/bin
```

The `./` prefix is optional — `cd ./bin` and `cd bin` do the same thing:

```bash
cd /usr
cd ./bin
pwd
# /usr/bin
```

---

# Combining Up and Down

Move up and then down in a single command:

```bash
cd /usr/bin
cd ../local
pwd
# /usr/local
```

This reads as: "go up one level (to `/usr`), then down into `local`"

---
layout: section
---

# Navigation Shortcuts

---

# cd with No Arguments

`cd` by itself takes you to your home directory:

```bash
cd /usr/bin
cd
pwd
# /home/me
```

This is the fastest way to get home

---

# cd - (Previous Directory)

`cd -` takes you back to the previous working directory:

```bash
cd ~/Documents
cd /var/log
cd -
# /home/me/Documents
pwd
# /home/me/Documents
```

Use it to toggle between two directories you are working in

---

# cd ~user_name

`cd ~user_name` takes you to another user's home directory:

```bash
cd ~root
pwd
# /root
```

`cd ~` (tilde alone) is the same as `cd` — it goes to your own home directory

---

# Shortcuts Summary

| Shortcut | Result |
|----------|--------|
| `cd` | Changes to home directory |
| `cd -` | Changes to previous working directory |
| `cd ~user_name` | Changes to home directory of *user_name* |
| `cd ..` | Changes to parent directory |

---
layout: section
---

# Important Facts About Filenames

---

# Hidden Files

Filenames beginning with `.` (period) are hidden

- `ls` does not display them
- `ls -a` shows all files including hidden ones
- Common hidden files: `.bashrc`, `.bash_history`, `.profile`

---

# Case Sensitivity

Filenames and commands are **case sensitive**

- `File1` and `file1` are different files
- `ls` and `LS` are different commands
- Be consistent with your naming conventions

---

# No File Extensions Required

Linux has **no concept of a "file extension"**

- Unlike Windows, the OS does not use extensions to determine file type
- You may name files any way you like
- Some applications may expect certain extensions, but Linux itself does not

---

# Spaces in Filenames

**Do not embed spaces in filenames**

- Spaces make command-line work difficult
- Use dashes (`-`) or underscores (`_`) instead
- Limit punctuation to period, dash, and underscore

Good: `my-report.txt`, `my_report.txt`

Bad: `my report.txt`

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/navigation_lab
cd ~/navigation_lab
mkdir -p projects/src projects/doc projects/test
mkdir -p data/2024 data/2025
touch projects/src/main.c projects/doc/readme.txt
touch data/2024/report.csv data/2025/report.csv
touch .hidden_config
```

---

# Exercise 1: Using pwd

Display your current working directory:

```bash
pwd
```

Change to different directories and check your location:

```bash
cd /
pwd
cd ~
pwd
cd ~/navigation_lab
pwd
```

---

# Exercise 2: Listing Directories

List the lab directory contents:

```bash
cd ~/navigation_lab
ls
```

List a directory without entering it:

```bash
ls /usr
ls ~/navigation_lab/projects
```

List hidden files:

```bash
ls -a ~/navigation_lab
```

---

# Exercise 3: Absolute Pathnames

Navigate using full paths from root:

```bash
cd /usr/bin
pwd
cd /var/log
pwd
cd ~/navigation_lab/projects/src
pwd
```

---

# Exercise 4: Relative Pathnames

Navigate using relative paths:

```bash
cd ~/navigation_lab
cd projects
pwd
cd ..
pwd
```

Combine up and down movement:

```bash
cd ~/navigation_lab/projects/src
cd ../../data/2025
pwd
```

---

# Exercise 5: Shortcuts

Use `cd` with no arguments:

```bash
cd /var/log
cd
pwd
```

Toggle with `cd -`:

```bash
cd ~/navigation_lab
cd /usr/bin
cd -
pwd
```

Visit another user's home:

```bash
cd ~root
pwd
cd ~
pwd
```

---

# Exercise 6: Exploring the Tree

Explore system directories from root:

```bash
cd /
ls
ls /bin
ls /etc
ls /home
ls /usr
```

Navigate a deep path and return:

```bash
cd /usr/local/share
pwd
cd ~/navigation_lab
pwd
```

---

# Lab Cleanup

```bash
rm -rf ~/navigation_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

You are in `/home/student/projects/src`. Write a single `cd` command using a relative pathname to reach `/home/student/data/reports`.

---

# Challenge 2

What will `pwd` display after this sequence?

```bash
cd /usr/local/bin
cd ..
cd ../var
cd log
pwd
```

---

# Challenge 3

A student types `cd usr/bin` from their home directory and gets an error. Explain why and provide two corrected commands — one using an absolute pathname, one using a relative pathname.

---

# Assessment Questions

1. What is the difference between an absolute pathname and a relative pathname?
2. What does the `..` notation represent, and how is it used?
3. How do you view hidden files in a directory?
4. What happens when you type `cd` with no arguments?
5. How does Linux handle multiple storage devices differently from Windows?
6. Why should you avoid spaces in filenames on Linux?

---

# Summary

Today we learned how to:

- Understand the Linux file system as a single hierarchical tree rooted at `/`
- Display our location with `pwd`
- List directory contents with `ls` and `ls -a`
- Navigate using absolute pathnames (starting from `/`)
- Navigate using relative pathnames (using `.` and `..`)
- Use shortcuts (`cd`, `cd -`, `cd ~`) for efficient movement

These navigation skills are foundational — every task on the Linux command line begins with knowing where you are and how to move to where you need to be.

---

# Additional Resources

- `man pwd` — full documentation for the print working directory command
- `man cd` — documentation for changing directories (built-in, see `help cd`)
- `man ls` — full documentation for listing directory contents
- [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html) — explains what each top-level directory is for
- Practice navigating in `/usr`, `/var`, and `/etc` to build familiarity with the standard directory layout
