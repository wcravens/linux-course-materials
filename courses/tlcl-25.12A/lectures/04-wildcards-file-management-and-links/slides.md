---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Files and Directories: Wildcards, File Management, and Links'
info: |
  ## The Linux Command Line — Lecture 4
  Wildcards, File Management, and Links. Adapted from TLCL chapter 4.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Files and Directories

Wildcards, File Management, and Links

The Linux Command Line

Lecture 4

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Use wildcards (globbing) to select files based on name patterns
- Create directories with `mkdir` and organize file hierarchies
- Copy, move, and rename files and directories using `cp` and `mv`
- Remove files and directories safely with `rm`
- Explain the difference between hard links and symbolic links
- Create both types of links using `ln`

---
layout: section
---

# Wildcards (Globbing)

The shell expands **wildcard** characters into matching filenames before executing a command

This process is called *globbing* or *pathname expansion*

---

# Basic Wildcards

| Wildcard | Meaning |
|---|---|
| `*` | Matches any characters (including none) |
| `?` | Matches any single character |
| `[characters]` | Matches any character in the set |
| `[\!characters]` | Matches any character not in the set |

```bash
ls *.txt
# Lists all files ending in .txt
```

```bash
ls file?.txt
# Matches file1.txt, fileA.txt, but not file10.txt
```

---

# Character Classes

Named character classes provide portable, locale-safe matching

| Class | Meaning |
|---|---|
| `[[:alnum:]]` | Any alphanumeric character |
| `[[:alpha:]]` | Any alphabetic character |
| `[[:digit:]]` | Any numeral |
| `[[:lower:]]` | Any lowercase letter |
| `[[:upper:]]` | Any uppercase letter |

```bash
ls [[:upper:]]*
# All files starting with an uppercase letter
```

---

# Wildcard Examples

| Pattern | What It Matches |
|---|---|
| `g*` | Files beginning with `g` |
| `Data???` | `Data` followed by exactly 3 characters |
| `[abc]*` | Files starting with `a`, `b`, or `c` |
| `BACKUP.[0-9][0-9][0-9]` | `BACKUP.` followed by three digits |
| `[\![:digit:]]*` | Files not starting with a numeral |

---

# Why Not Character Ranges?

Traditional ranges like `[A-Z]` depend on **locale settings**

- In some locales, `[a-z]` also matches uppercase letters
- Use `[[:upper:]]` and `[[:lower:]]` for predictable results

---

# Wildcards and Hidden Files

Files starting with `.` (dot files) are not matched by default wildcards

```bash
echo *
# Does NOT include .hidden files
```

```bash
echo .*
# Matches hidden files, but ALSO includes . and ..
```

Safe pattern to match only hidden files:

```bash
ls -d .[\!.]*
# Excludes . and ..
```

---

# Creating Directories

`mkdir` creates one or more directories

```bash
mkdir photos
```

```bash
mkdir dir1 dir2 dir3
# Creates three directories at once
```

The `...` in usage notation means the argument can be repeated:

`mkdir directory...`

---
layout: section
---

# Copying Files and Directories

---

# cp — Basic Usage

Two forms:

- `cp item1 item2` — copy one item to another
- `cp item... directory` — copy items into a directory

**Without `-i`, `cp` silently overwrites existing files**

---

# cp Options

| Option | Long Option | Meaning |
|---|---|---|
| `-a` | `--archive` | Preserve all attributes; copy entire trees |
| `-i` | `--interactive` | Prompt before overwriting |
| `-r` | `--recursive` | Copy directories recursively |
| `-u` | `--update` | Only copy newer or missing files |
| `-v` | `--verbose` | Show what is being copied |

---

# cp Examples

```bash
cp file1 file2
# Copy file1 to file2 (overwrites if file2 exists)
```

```bash
cp -i file1 file2
# Prompts before overwriting
```

```bash
cp file1 file2 dir1
# Copy both files into dir1
```

```bash
cp -r dir1 dir2
# Copy dir1 and all contents into dir2
```

---
layout: section
---

# Moving and Renaming

---

# mv — Move and Rename

Two forms (same as `cp`):

- `mv item1 item2` — move/rename one item
- `mv item... directory` — move items into a directory

**Without `-i`, `mv` silently overwrites existing files**

---

# mv Options

| Option | Long Option | Meaning |
|---|---|---|
| `-i` | `--interactive` | Prompt before overwriting |
| `-u` | `--update` | Only move newer or missing files |
| `-v` | `--verbose` | Show what is being moved |

---

# mv Examples

```bash
mv file1 file2
# Rename file1 to file2
```

```bash
mv file1 file2 dir1
# Move both files into dir1
```

```bash
mv dir1 dir2
# If dir2 exists: move dir1 into dir2
# If dir2 doesn't exist: rename dir1 to dir2
```

---
layout: section
---

# Removing Files and Directories

---

# rm — Remove

`rm item...` deletes files and directories

**Linux has no undelete command** — deleted files are gone permanently

---

# rm Options

| Option | Long Option | Meaning |
|---|---|---|
| `-i` | `--interactive` | Prompt before each deletion |
| `-r` | `--recursive` | Delete directories and contents |
| `-f` | `--force` | Ignore nonexistent files, never prompt |
| `-v` | `--verbose` | Show what is being deleted |

---

# rm Examples

```bash
rm file1
# Delete silently
```

```bash
rm -i file1
# Prompt before deleting
```

```bash
rm -r dir1
# Delete dir1 and everything inside it
```

```bash
rm -rf dir1
# Force-delete without prompting
```

---

# Be Careful with rm\!

The accidental space problem:

```bash
rm *.html      # Deletes all .html files (intended)
rm * .html     # Deletes EVERYTHING, then tries to delete .html
```

**Safety rule:** Always test with `ls` first

```bash
ls *.html      # Verify the pattern
rm *.html      # Then delete
```

---
layout: section
---

# Links

The `ln` command creates additional directory entries that reference existing file data

Two types: **hard links** and **symbolic links**

---

# Hard Links

Created with `ln file link`

- Additional directory entry pointing to the same **inode**
- File data is shared — no distinction between "original" and link
- File persists until *all* hard links are removed
- Link count visible with `ls -l`

```bash
ln fun fun-hard
ls -li
# Both entries show the same inode number
```

---

# Hard Link Limitations

1. Cannot span physical devices (partitions)
2. Cannot reference directories

Hard links are indistinguishable from the original file — they *are* the file

---

# Symbolic Links

Created with `ln -s item link`

- A special file containing a text pointer to the target
- Overcomes both hard link limitations
- Can reference directories
- Can span devices

```bash
ln -s fun fun-sym
ls -l fun-sym
# lrwxrwxrwx ... fun-sym -> fun
```

---

# Broken Symbolic Links

If the target is deleted, the symlink becomes *broken*

```bash
rm fun
cat fun-sym
# Error: No such file or directory
```

The symlink still exists but points to nothing

---

# Relative Paths in Symlinks

Relative paths are relative to the **link's location**, not your current directory

```bash
ln -s ../fun dir1/fun-sym
# dir1/fun-sym points to ../fun (relative to dir1)
```

---

# Hard Links vs. Symbolic Links

| Feature | Hard Link | Symbolic Link |
|---|---|---|
| Same inode as target | Yes | No |
| Spans devices | No | Yes |
| Links to directories | No | Yes |
| Breaks if target deleted | No | Yes |
| `ls -l` appearance | Same as regular file | Shows `->` arrow |

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/playground
cd ~/playground
mkdir dir1 dir2
cp /etc/passwd .
touch report.txt data.csv notes.txt
touch .hidden1 .hidden2
```

---

# Exercise 1: Wildcard Exploration

Try various wildcard patterns:

```bash
cd ~/playground
ls *.txt
ls ????.*
ls [dn]*
```

List hidden files safely:

```bash
echo .*
ls -d .[\!.]*
```

---

# Exercise 2: Copying Files

Copy files with different options:

```bash
cp passwd passwd.bak
cp -v report.txt report_copy.txt
cp -i passwd passwd.bak
```

Copy multiple files and a directory:

```bash
cp report.txt data.csv dir1/
cp -r dir1/ dir2/dir1_backup/
```

---

# Exercise 3: Moving and Renaming

Rename and move files between directories:

```bash
mv passwd.bak old_passwd
mv old_passwd dir1/
mv dir1/old_passwd restored_passwd
```

Move multiple files:

```bash
mv data.csv notes.txt dir2/
```

---

# Exercise 4: Safe Removal

Test patterns before deleting:

```bash
ls report*
rm -v report_copy.txt
rm -i restored_passwd
```

Remove a directory tree:

```bash
mkdir -p temp/sub1/sub2
rm -r temp/
```

---

# Exercise 5: Hard Links

Create hard links and verify with inodes:

```bash
ln report.txt report-hard
ln report.txt dir1/report-hard
ls -li report.txt report-hard dir1/report-hard
```

Modify through one link, check all:

```bash
echo "new line" >> report-hard
cat report.txt
```

---

# Exercise 6: Symbolic Links

Create symbolic links and explore behavior:

```bash
ln -s report.txt report-sym
ls -l report-sym
ln -s ../report.txt dir1/report-sym
ls -l dir1/report-sym
```

Observe a broken symlink:

```bash
rm report.txt
cat report-sym
ls -l report-sym
```

---

# Lab Cleanup

```bash
rm -rf ~/playground
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

What is the output of each wildcard pattern, given a directory with these files: `alpha.txt`, `beta.txt`, `GAMMA.txt`, `data1.csv`, `data2.csv`, `notes.md`

```bash
ls *.csv
ls [[:upper:]]*
ls data?.csv
ls *.[tm]*
```

---

# Challenge 2

A student runs these commands. What is the final state of the files?

```bash
mkdir work
touch work/a.txt work/b.txt
cp work/a.txt work/c.txt
mv work/b.txt work/d.txt
ln work/c.txt work/c-hard
ln -s c.txt work/c-sym
rm work/a.txt
```

Which files remain in `work/`? What happens if you `cat work/c-sym`?

---

# Challenge 3

You create a symbolic link and a hard link to `original.txt`. Then you delete `original.txt`.

- Can you still read the file through the hard link? Why?
- Can you still read the file through the symbolic link? Why?
- What does `ls -li` reveal about the difference?

---

# Assessment Questions

1. What is the difference between the `*` and `?` wildcards?
2. Why should you use `[[:upper:]]` instead of `[A-Z]` in wildcard patterns?
3. What happens when you use `cp` without the `-i` flag and the destination file already exists?
4. How does the shell determine whether `mv item1 item2` is a rename or a move?
5. What are the two limitations of hard links that symbolic links overcome?
6. Why is it important to always test wildcard patterns with `ls` before using `rm`?

---

# Summary

Today we learned how to:

- Select files using wildcard patterns and character classes
- Create directories with `mkdir`
- Copy files and directories with `cp` and its key options
- Move and rename files with `mv`
- Safely remove files and directories with `rm`
- Create hard links and symbolic links with `ln`

These file management commands are the foundation of everyday work on the Linux command line.

---

# Additional Resources

- `man cp`, `man mv`, `man rm`, `man ln`, `man mkdir` — full option details
- `man 7 glob` — wildcard pattern syntax reference
- [GNU Coreutils Manual](https://www.gnu.org/software/coreutils/manual/) — comprehensive documentation
- Practice in a temporary directory (`/tmp`) to safely experiment with destructive commands
- Chapter 4 of *The Linux Command Line* by William Shotts for additional examples
