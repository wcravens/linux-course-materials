---
title: 'Packages, Search, and Archiving'
subtitle: 'The Linux Command Line — Lecture 11'
---

## Learning Objectives

After completing these chapters, you will be able to:

- Explain how Linux packaging systems work and use package management tools to search, install, update, and remove software
- Use `locate` and `find` to search for files based on name, type, size, and other attributes
- Apply `find` tests, operators, and actions to perform complex file searches
- Use `gzip`, `bzip2`, `tar`, and `zip` to compress and archive files
- Synchronize files and directories using `rsync` for local and remote backups

## Key Commands Covered

- `apt-cache` — Query the APT package cache for package information
- `apt` — High-level package management tool for Debian-based systems
- `dpkg` — Low-level Debian package manager
- `locate` — Find files by name using a prebuilt database
- `find` — Search for files in a directory hierarchy based on various criteria
- `xargs` — Build and execute command lines from standard input
- `touch` — Change file timestamps or create empty files
- `stat` — Display detailed file or file system status
- `gzip` — Compress or expand files using the Lempel-Ziv algorithm
- `bzip2` — Compress or expand files using block-sorting compression
- `tar` — Create, list, and extract tape archive files
- `zip` — Package and compress files in ZIP format
- `rsync` — Synchronize files and directories locally or over a network

## Chapter Outline

### 1. Packaging Systems (Ch 14)

Linux distributions use **package management** systems to install, update, and remove software. Most distributions fall into one of two families based on their package format.

Table: The two major packaging systems and the distributions that use each one

| Packaging System | Distributions |
|---|---|
| Debian Style (`.deb`) | Debian, Ubuntu, Linux Mint, Raspberry Pi OS |
| Red Hat Style (`.rpm`) | Fedora, CentOS, Red Hat Enterprise Linux, OpenSUSE |

### 2. How a Package System Works (Ch 14)

A **package file** is a compressed collection of files that make up a piece of software, including the programs, data files, metadata, and pre/post-installation scripts. Packages are distributed through central **repositories** maintained by distribution vendors. Packages often have **dependencies** -- other packages they require to function. Modern package managers resolve dependencies automatically.

Package management tools come in two levels:

Table: The low-level and high-level package tools for Debian versus Red Hat systems

| Level | Debian | Red Hat |
|---|---|---|
| Low-level (install/remove files) | `dpkg` | `rpm` |
| High-level (search, resolve dependencies) | `apt`, `apt-get` | `dnf`, `yum` |

### 3. Common Package Management Tasks (Ch 14)

The following table consolidates the most common package operations for both Debian and Red Hat systems.

Table: Common package operations and the equivalent command on Debian versus Red Hat systems

| Task | Debian | Red Hat |
|---|---|---|
| Update package database | `apt update` | *(automatic with dnf)* |
| Search for a package | `apt search string` | `dnf search string` |
| Install from repository | `apt install package` | `dnf install package` |
| Install from file | `dpkg -i package_file` | `rpm -i package_file` |
| Remove a package | `apt remove package` | `dnf erase package` |
| Update all packages | `apt update; apt upgrade` | `dnf update` |
| List installed packages | `dpkg -l` | `rpm -qa` |
| Check if package is installed | `dpkg -s package` | `rpm -q package` |
| Show package info | `apt show package` | `dnf info package` |
| Find which package owns a file | `dpkg -S filename` | `rpm -qf filename` |

Low-level tools (`dpkg`, `rpm`) do not perform dependency resolution. Always prefer the high-level tools (`apt`, `dnf`) when installing from repositories.

### 4. locate -- Find Files the Easy Way (Ch 17)

The `locate` command searches a prebuilt database of file pathnames and returns every name matching a given substring. It is extremely fast because it searches a database rather than the file system directly.

```bash
locate bin/zip
# /usr/bin/zip
# /usr/bin/zipcloak
# /usr/bin/zipgrep
```

The database is created and updated by the `updatedb` program, which typically runs once a day via `cron`. Very recently created files may not appear in `locate` results until `updatedb` runs again. A superuser can run `updatedb` manually to force an update.

`locate` can be combined with `grep` for more refined searches:

```bash
locate zip | grep bin
```

### 5. find -- Find Files the Hard Way (Ch 17)

The `find` command searches a directory hierarchy in real time based on a variety of file attributes. Unlike `locate`, it does not depend on a database.

```bash
find ~ -type f -name "*.JPG" -size +1M
```

**Common file type tests:**

Table: The `find -type` codes covered in this lecture and the file type each one matches

| File Type | Description |
|---|---|
| `b` | Block special device file |
| `c` | Character special device file |
| `d` | Directory |
| `f` | Regular file |
| `l` | Symbolic link |

**Size units:**

Table: The size-unit suffixes accepted by `find -size` and what each one represents

| Character | Unit |
|---|---|
| `c` | Bytes |
| `k` | Kilobytes (1024 bytes) |
| `M` | Megabytes |
| `G` | Gigabytes |

A `+` before the number means "greater than," a `-` means "less than," and no sign means "exactly."

**Key tests:**

Table: The `find` tests covered in this lecture and what each one matches

| Test | Description |
|---|---|
| `-name pattern` | Match by filename (wildcard pattern) |
| `-iname pattern` | Case-insensitive name match |
| `-type c` | Match by file type |
| `-size n` | Match by file size |
| `-mtime n` | Modified `n*24` hours ago |
| `-newer file` | Modified more recently than `file` |
| `-user name` | Owned by `name` |
| `-perm mode` | Match by permissions |
| `-empty` | Match empty files/directories |

### 6. find Operators (Ch 17)

Tests can be combined using logical operators to build complex search expressions.

Table: The logical operators `find` accepts for combining tests and what each one does

| Operator | Description |
|---|---|
| `-and` (or `-a`) | True if both sides are true (default if omitted) |
| `-or` (or `-o`) | True if either side is true |
| `-not` (or `!`) | Negates the following test |
| `\( \)` | Groups expressions (must be escaped) |

```bash
find ~ \( -type f -not -perm 0600 \) -or \( -type d -not -perm 0700 \)
```

This finds all files without `0600` permissions or directories without `0700` permissions.

### 7. find Actions and xargs (Ch 17)

`find` can act on its results using predefined or user-defined actions.

**Predefined actions:**

Table: The predefined `find` actions covered in this lecture and what each one does

| Action | Description |
|---|---|
| `-print` | Output pathname (default action) |
| `-delete` | Delete matching file |
| `-ls` | Perform `ls -dils` on match |
| `-quit` | Quit after first match |

**User-defined actions** use `-exec` or `-ok`:

```bash
find ~ -type f -name '*.bak' -exec rm '{}' ';'
```

Replace `;` with `+` to batch arguments into a single command execution for better efficiency:

```bash
find ~ -type f -name 'foo*' -exec ls -l '{}' +
```

The **xargs** command reads items from standard input and executes a specified command with those items as arguments:

```bash
find ~ -type f -name 'foo*' -print | xargs ls -l
```

For filenames with spaces, use null-separated output:

```bash
find ~ -iname '*.jpg' -print0 | xargs --null ls -l
```

### 8. Compressing Files (Ch 18)

**Data compression** removes redundancy from data to reduce file size. Linux uses *lossless* compression for general files, which preserves all original data.

**gzip/gunzip:**

`gzip` compresses files, replacing the original with a `.gz` version. `gunzip` reverses the process.

```bash
gzip foo.txt
# Creates foo.txt.gz, removes foo.txt

gunzip foo.txt.gz
# Restores foo.txt, removes foo.txt.gz
```

Key `gzip` options: `-c` (write to stdout), `-d` (decompress), `-r` (recursive), `-v` (verbose), `-1` to `-9` (compression level). The `zcat` command views compressed files without decompressing.

**bzip2/bunzip2:**

`bzip2` works like `gzip` but uses a different algorithm achieving higher compression at slower speed. Compressed files use the `.bz2` extension.

```bash
bzip2 foo.txt
# Creates foo.txt.bz2

bunzip2 foo.txt.bz2
# Restores foo.txt
```

### 9. Archiving with tar (Ch 18)

The **tar** program (tape archive) bundles multiple files and directories into a single archive file. The basic syntax is `tar mode[options] pathname...`.

**Modes:**

Table: The `tar` mode letters covered in this lecture and what each one does

| Mode | Description |
|---|---|
| `c` | Create an archive |
| `x` | Extract an archive |
| `t` | List archive contents |
| `r` | Append to an archive |

```bash
tar cf archive.tar directory/
# Create archive from directory

tar tf archive.tar
# List archive contents

tar xf archive.tar
# Extract archive
```

**Compression flags** integrate `gzip` or `bzip2` directly:

```bash
tar czf archive.tar.gz directory/
# Create gzip-compressed archive

tar cjf archive.tar.bz2 directory/
# Create bzip2-compressed archive

tar xzf archive.tar.gz
# Extract gzip-compressed archive
```

Pathnames in archives are stored as relative paths by default (leading `/` is stripped). `tar` used with `find` enables selective or incremental archiving:

```bash
find playground -name 'file-A' | tar czf backup.tgz -T -
```

### 10. zip/unzip (Ch 18)

The `zip` program creates ZIP archives familiar to Windows users. The `-r` option is required for recursive directory archiving.

```bash
zip -r playground.zip playground/
# Create ZIP archive

unzip playground.zip
# Extract ZIP archive

unzip -l playground.zip
# List archive contents without extracting
```

### 11. Synchronizing with rsync (Ch 18)

**rsync** synchronizes files between directories by copying only the differences. This makes it fast and efficient for backups.

```bash
rsync -av source_dir destination_dir
```

The `-a` option enables archive mode (recursion, preserves attributes) and `-v` enables verbose output. On subsequent runs, `rsync` copies only changed files.

A trailing `/` on the source copies the directory *contents* without creating the directory itself:

```bash
rsync -av source/ destination
# Copies contents of source into destination

rsync -av source destination
# Copies source directory into destination (creates destination/source)
```

The `--delete` option removes files in the destination that no longer exist in the source:

```bash
sudo rsync -av --delete /etc /home /usr/local /media/BigDisk/backup
```

**rsync over a network** uses SSH for secure transfers:

```bash
rsync -av --delete --rsh=ssh /home remote-sys:/backup
```

---

## Additional Resources

### Key Commands Summary

Table: The commands covered in this lecture and what each one does

| Command | Purpose |
|---------|---------|
| `apt search` | Search for packages in repositories |
| `apt install` | Install a package with dependency resolution |
| `apt remove` | Remove an installed package |
| `dpkg -l` | List all installed packages |
| `dpkg -S` | Find which package owns a file |
| `locate` | Rapidly find files by name via database |
| `updatedb` | Update the `locate` database |
| `find` | Search for files by attributes in real time |
| `xargs` | Build command lines from standard input |
| `touch` | Update file timestamps or create empty files |
| `stat` | Display detailed file status information |
| `gzip`/`gunzip` | Compress/decompress files (`.gz`) |
| `bzip2`/`bunzip2` | Compress/decompress files (`.bz2`) |
| `tar` | Create, list, and extract archive files |
| `zip`/`unzip` | Create and extract ZIP archives |
| `rsync` | Synchronize files and directories efficiently |

### Package Management Quick Reference

Table: Common package tasks and the equivalent command on Debian versus Red Hat systems

| Task | Debian (`apt`/`dpkg`) | Red Hat (`dnf`/`rpm`) |
|---|---|---|
| Search | `apt search term` | `dnf search term` |
| Install | `apt install pkg` | `dnf install pkg` |
| Remove | `apt remove pkg` | `dnf erase pkg` |
| Update all | `apt update; apt upgrade` | `dnf update` |
| List installed | `dpkg -l` | `rpm -qa` |
| Package info | `apt show pkg` | `dnf info pkg` |
| File owner | `dpkg -S /path/to/file` | `rpm -qf /path/to/file` |

### Tips for Success

1. Use `locate` for quick filename searches and `find` for complex attribute-based searches -- choose the right tool for the task.
2. Always test `find` commands with `-print` before using `-delete` or `-exec rm` to avoid accidentally removing files.
3. Remember that `gzip` and `bzip2` replace the original file by default -- use `-k` (keep) or `-c` (stdout) to preserve originals.
4. Use `tar czf` for gzip-compressed archives and `tar cjf` for bzip2-compressed archives -- the compression flag comes before `f`.
5. Run `rsync` with `-n` (dry-run) first to preview what will be copied before performing the actual synchronization.
6. When using `find` with `-exec`, remember to quote `'{}'` and `';'` to prevent shell interpretation.

### Common Pitfalls

- Forgetting to quote the `-name` pattern in `find` (e.g., `find . -name *.txt` fails because the shell expands `*.txt` before `find` sees it; use `find . -name '*.txt'`).
- Using `apt install` without running `apt update` first on Debian systems, which may result in outdated or missing package information.
- Omitting the `-r` flag with `zip`, which causes only the directory itself (not its contents) to be archived.
- Confusing `tar czf` (gzip) with `tar cjf` (bzip2) -- using the wrong flag produces an archive with a misleading file extension.
- Forgetting the trailing `/` distinction with `rsync` -- `rsync source dest` copies the directory into `dest`, while `rsync source/ dest` copies only the *contents* into `dest`.
