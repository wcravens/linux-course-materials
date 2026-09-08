---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Packages, Search, and Archiving: Managing Software and Finding Files'
info: |
  ## The Linux Command Line — Lecture 11
  Managing Software and Finding Files. Adapted from TLCL chapters 14, 17, and 18.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Packages, Search, and Archiving

Managing Software and Finding Files

The Linux Command Line

Lecture 11

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain how Linux packaging systems work and distinguish between Debian-style and Red Hat-style tools
- Use `apt-get`/`apt-cache` and `dnf` to search for, install, update, and remove packages
- Use `locate` and `find` to search for files by name, type, size, and other attributes
- Apply `find` actions and `xargs` to process search results
- Compress files with `gzip` and `bzip2` and create archives with `tar`
- Use `rsync` to efficiently synchronize files and directories

---
layout: section
---

# Package Management

Linux distributions use **packaging systems** to install and manage software

---

# Two Major Packaging Families

| Family | Distributions | Package Format | Low-Level Tool | High-Level Tool |
|--------|--------------|----------------|----------------|-----------------|
| Debian | Ubuntu, Mint, Debian | `.deb` | `dpkg` | `apt-get` / `apt-cache` |
| Red Hat | Fedora, RHEL, CentOS, Rocky | `.rpm` | `rpm` | `dnf` (formerly `yum`) |

- **Packages** are compressed archives containing the files needed to install a program
- **Repositories** are central servers where packages are stored and downloaded from
- **Dependencies** are shared packages that multiple programs rely on

---

# How Packages Work

- A **package file** contains the program files plus metadata (version, dependencies, description)
- **Low-level tools** (`dpkg`, `rpm`) handle installing/removing individual package files
- **High-level tools** (`apt-get`, `dnf`) handle searching repositories and resolving dependencies automatically
- High-level tools call low-level tools behind the scenes

---

# Common Package Management Tasks

| Task | Debian (`apt-get`/`apt-cache`) | Red Hat (`dnf`) |
|------|-------------------------------|-----------------|
| Search for a package | `apt-cache search string` | `dnf search string` |
| Install from repo | `sudo apt-get install pkg` | `sudo dnf install pkg` |
| Install from file | `sudo dpkg -i file.deb` | `sudo rpm -i file.rpm` |
| Remove a package | `sudo apt-get remove pkg` | `sudo dnf erase pkg` |
| Update from repo | `sudo apt-get update; sudo apt-get upgrade` | `sudo dnf update` |
| List installed | `dpkg -l` | `rpm -qa` |
| Package info | `apt-cache show pkg` | `dnf info pkg` |
| Which package owns a file | `dpkg -S file` | `rpm -qf file` |

---
layout: section
---

# Finding Files with locate

The `locate` command searches a pre-built database of filenames for fast results

---

# Using locate

```bash
locate bin/zip
# /usr/bin/zip
# /usr/bin/zipcloak
# /usr/bin/zipgrep
```

- Searches a database of pathnames maintained by `updatedb`
- The database is rebuilt periodically (usually daily via cron)
- Very fast but may not reflect recently created files
- Combine with `grep` for more refined searches

```bash
locate zip | grep bin
```

---

# Updating the Database

```bash
sudo updatedb
```

- Run manually if you need `locate` to find recently created files
- On some distributions, `locate` may not work until `updatedb` has run at least once

---
layout: section
---

# Finding Files with find

The `find` command searches directory trees in real time using *tests*, *operators*, and *actions*

---

# Basic find Usage

```bash
find ~ -type d | wc -l
# 1695  (count of directories)
```

```bash
find ~ -type f -name "*.JPG" -size +1M | wc -l
# 840  (large JPEG files)
```

| File Type | Description |
|-----------|-------------|
| `b` | Block special device |
| `d` | Directory |
| `f` | Regular file |
| `l` | Symbolic link |

---

# Key find Tests

| Test | Description |
|------|-------------|
| `-name pattern` | Match filename with wildcard pattern |
| `-iname pattern` | Case-insensitive `-name` |
| `-type c` | Match file type (`f`, `d`, `l`, etc.) |
| `-size n` | Match by size (`+` = larger, `-` = smaller) |
| `-mtime n` | Modified *n* days ago |
| `-user name` | Owned by user |
| `-perm mode` | Match permissions |
| `-empty` | Match empty files/directories |

Size units: `k` (KB), `M` (MB), `G` (GB)

---

# find Operators

Combine tests using **logical operators** to create complex searches:

| Operator | Description |
|----------|-------------|
| `-and` (default) | Both tests must be true |
| `-or` | Either test must be true |
| `-not` (or `!`) | Negate the test |
| `\( \)` | Group expressions (must escape parens) |

```bash
find ~ \( -type f -not -perm 0600 \) -or \( -type d -not -perm 0700 \)
```

---

# find Actions

| Action | Description |
|--------|-------------|
| `-print` | Display pathname (default) |
| `-ls` | Display `ls -dils` style output |
| `-delete` | Delete matching file |
| `-exec cmd {} ;` | Run command on each match |

```bash
find ~ -type f -name '*.bak' -delete
```

Use `-exec` with `+` instead of `;` to batch results into a single command:

```bash
find ~ -type f -name 'foo*' -exec ls -l '{}' +
```

---

# xargs

The `xargs` command reads items from standard input and builds command lines:

```bash
find ~ -type f -name 'foo*' -print | xargs ls -l
```

- Converts piped input into arguments for a command
- Handles very long argument lists by splitting into multiple executions
- Use `-print0` with `find` and `--null` with `xargs` for filenames containing spaces

```bash
find ~ -iname '*.jpg' -print0 | xargs --null ls -l
```

---
layout: section
---

# Compressing Files

Linux provides several tools for **file compression** to reduce storage and transfer sizes

---

# gzip

The most common compression tool on Linux:

```bash
gzip file.txt
# Creates file.txt.gz, removes original
```

```bash
gunzip file.txt.gz
# Restores original file
```

| Option | Description |
|--------|-------------|
| `-c` | Write to stdout (keep original) |
| `-d` | Decompress (same as `gunzip`) |
| `-r` | Recurse into directories |
| `-v` | Verbose (show compression ratio) |
| `-1` to `-9` | Speed vs. compression (1=fast, 9=best) |

Use `zcat` or `zless` to view compressed files without decompressing

---

# bzip2

Higher compression than `gzip` but slower:

```bash
bzip2 file.txt
# Creates file.txt.bz2
```

```bash
bunzip2 file.txt.bz2
# Restores original file
```

- Same usage pattern as `gzip`/`gunzip`
- Achieves better compression at the cost of speed
- Files use the `.bz2` extension

---
layout: section
---

# Archiving with tar

The `tar` command (originally *tape archive*) bundles multiple files into a single archive file

---

# Essential tar Operations

| Mode | Flag | Description |
|------|------|-------------|
| Create | `-c` | Create a new archive |
| Extract | `-x` | Extract files from archive |
| List | `-t` | List archive contents |

Always combine with `-f` (filename) and usually `-v` (verbose):

```bash
tar cf archive.tar dir1 dir2
# Create archive from directories
```

```bash
tar tf archive.tar
# List contents
```

```bash
tar xf archive.tar
# Extract contents
```

---

# tar with Compression

Add a compression flag to create compressed archives:

| Flag | Compression | Extension |
|------|-------------|-----------|
| `-z` | gzip | `.tar.gz` or `.tgz` |
| `-j` | bzip2 | `.tar.bz2` |

```bash
tar czf project-backup.tar.gz project/
# Create gzip-compressed archive
```

```bash
tar xzf project-backup.tar.gz
# Extract gzip-compressed archive
```

```bash
tar xjf archive.tar.bz2
# Extract bzip2-compressed archive
```

---

# zip and unzip

The `zip` format provides cross-platform compatibility with Windows:

```bash
zip -r project.zip project/
# Create zip archive recursively
```

```bash
unzip project.zip
# Extract zip archive
```

- Use `-r` to include subdirectories when creating
- `unzip -l archive.zip` lists contents without extracting

---
layout: section
---

# Synchronizing with rsync

The `rsync` command efficiently copies and synchronizes files by transferring only the differences

---

# rsync Basics

```bash
rsync -av source/ destination/
```

| Option | Description |
|--------|-------------|
| `-a` | Archive mode (preserves permissions, timestamps, etc.) |
| `-v` | Verbose output |
| `--delete` | Remove files in destination not present in source |
| `--dry-run` | Show what would happen without making changes |

- A trailing `/` on the source directory copies the *contents* (not the directory itself)
- Without trailing `/`, the directory itself is copied into the destination

---

# rsync Examples

Synchronize a local directory:

```bash
rsync -av ~/projects/ ~/backup/projects/
```

Synchronize over a network using SSH:

```bash
rsync -av ~/projects/ user@remote:/backup/projects/
```

Always test with `--dry-run` first:

```bash
rsync -av --dry-run --delete ~/source/ ~/dest/
```

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir -p ~/search_lab/{docs,images,logs,backup}
cd ~/search_lab
touch docs/{report.txt,notes.txt,readme.md}
touch images/{photo1.jpg,photo2.jpg,logo.png}
touch logs/{app.log,error.log,debug.log}
echo "Hello World" > docs/report.txt
echo "Important data" > docs/notes.txt
dd if=/dev/zero of=images/large.jpg bs=1024 count=2048 2>/dev/null
```

---

# Exercise 1: Finding Files with find

Use `find` to search by type, name, and size:

```bash
cd ~/search_lab
find . -type f | wc -l
find . -type d
find . -name "*.txt"
find . -name "*.log" -or -name "*.txt"
find . -type f -size +1M
find . -type f -empty
```

---

# Exercise 2: find Actions

Use actions to process search results:

```bash
find . -name "*.log" -ls
find . -name "*.txt" -exec wc -l '{}' +
find . -type f -name "*.md" -exec cat '{}' ';'
find . -name "*.log" -print | xargs wc -l
```

---

# Exercise 3: Compression

Compress and decompress files:

```bash
cp docs/report.txt docs/report-copy.txt
gzip -v docs/report-copy.txt
ls -l docs/report-copy.*
gunzip docs/report-copy.txt.gz
gzip -c docs/notes.txt > backup/notes.txt.gz
zcat backup/notes.txt.gz
```

---

# Exercise 4: Creating and Extracting Archives

Create tar archives with and without compression:

```bash
tar czf docs-backup.tar.gz docs/
tar tf docs-backup.tar.gz
mkdir /tmp/restore_test
tar xzf docs-backup.tar.gz -C /tmp/restore_test
ls /tmp/restore_test/docs/
zip -r images.zip images/
unzip -l images.zip
```

---

# Exercise 5: Synchronizing with rsync

Use `rsync` to synchronize directories:

```bash
rsync -av docs/ backup/docs/
ls backup/docs/
touch docs/new-file.txt
rsync -av docs/ backup/docs/
rsync -av --dry-run --delete docs/ backup/docs/
```

---

# Lab Cleanup

```bash
rm -rf ~/search_lab /tmp/restore_test
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

Write a single `find` command to locate all `.txt` files in your home directory that are larger than 10 kilobytes and were modified within the last 7 days.

**Answer:**

```bash
find ~ -type f -name "*.txt" -size +10k -mtime -7
```

---

# Challenge 2

Create a compressed tar archive of your home directory's `.bashrc` and `.profile` files (if they exist), then list the archive contents and extract them to `/tmp`.

**Answer:**

```bash
tar czf ~/config-backup.tar.gz -C ~ .bashrc .profile 2>/dev/null
tar tzf ~/config-backup.tar.gz
tar xzf ~/config-backup.tar.gz -C /tmp
```

---

# Challenge 3

A student runs `find /usr -name *.txt` and gets unexpected results. What is the problem and how should the command be written?

**Answer:** The shell expands `*.txt` before `find` sees it. The pattern must be quoted:

```bash
find /usr -name "*.txt"
```

---

# Assessment Questions

1. What is the difference between a high-level package tool (like `apt-get`) and a low-level tool (like `dpkg`)?
2. How does `locate` differ from `find` in terms of how it searches for files?
3. What does the `+` sign mean in `find -size +1M` versus `-size 1M` versus `-size -1M`?
4. Why should you always quote wildcard patterns when using them with `find -name`?
5. What is the difference between `tar czf` and `tar xzf`?
6. How does `rsync` improve efficiency compared to simply copying files with `cp -r`?

---

# Summary

Today we learned how to:

- Use high-level package managers (`apt-get`, `dnf`) to install, update, and remove software
- Search for files quickly with `locate` and thoroughly with `find`
- Combine `find` tests with logical operators and apply actions to search results
- Compress files using `gzip` and `bzip2`
- Create, list, and extract archives with `tar` (with and without compression)
- Synchronize files efficiently with `rsync`

These skills form the foundation for system administration tasks: keeping software up to date, locating files across complex directory structures, and creating reliable backups.

---

# Additional Resources

- `man apt-get`, `man dnf`, `man dpkg`, `man rpm` -- package management tools
- `man find`, `man locate`, `man xargs` -- file searching tools
- `man tar`, `man gzip`, `man rsync` -- archiving and synchronization tools
- *The Linux Command Line* Chapters 14, 17, and 18
- Practice `find` commands with `-print` before using `-delete` or `-exec` to verify results
