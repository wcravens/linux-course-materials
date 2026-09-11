---
title: 'Exploring the System'
subtitle: 'The Linux Command Line — Lecture 3'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Use `ls` with options and arguments to list files in various formats
- Explain the command structure pattern of `command -options arguments`
- Interpret long-format (`ls -l`) output including permissions, ownership, and timestamps
- Determine a file's type using the `file` command
- View text file contents using the `less` pager
- Identify the purpose of key directories in the Linux filesystem hierarchy

## Key Commands Covered

- `ls` — List directory contents
- `file` — Determine file type
- `less` — View file contents one page at a time

---

## Chapter Outline

### 1. Having More Fun with ls

The `ls` command is probably the most used command on Linux. It can do more than list the contents of the current directory — it can list the contents of any directory, and multiple directories at once:

```bash
ls ~ /usr
# Lists home directory contents, then /usr contents
```

```bash
ls /usr
# Lists only /usr contents
```

### 2. Options and Arguments

Most commands follow the pattern `command -options arguments`, where options modify command behavior and arguments are the items the command acts upon.

Commands support two styles of options:

- **Short options**: a single character preceded by a dash, e.g., `-l`
- **Long options**: a word preceded by two dashes, e.g., `--reverse`

Short options can be combined:

```bash
ls -lt
# Combines -l (long format) and -t (sort by modification time)
```

Options are case-sensitive. For example, `-s` and `-S` have different meanings.

### 3. Common ls Options

Table: The `ls` options covered in this lecture, their long forms, and what each one does

| Option | Long Option | Description |
|--------|-------------|-------------|
| `-a` | `--all` | List all files, including hidden (dot) files |
| `-A` | `--almost-all` | Like `-a` but excludes `.` and `..` |
| `-d` | `--directory` | List the directory itself, not its contents |
| `-F` | `--classify` | Append indicator character (`/` for directories) |
| `-h` | `--human-readable` | Display file sizes in human-readable format (K, M, G) |
| `-l` | | Use long listing format |
| `-r` | `--reverse` | Reverse the sort order |
| `-S` | | Sort by file size (largest first) |
| `-t` | | Sort by modification time (newest first) |

```bash
ls -lh
# Long format with human-readable file sizes
```

```bash
ls -lt --reverse
# Long format, sorted by time, oldest first
```

### 4. A Longer Look at Long Format

The `ls -l` command produces detailed output. Each field in a long-format line has a specific meaning:

```bash
ls -l
# -rw-r--r-- 1 root root 3576296 2024-03-22 11:18 TLCL-24.11.pdf
```

Table: The fields of an example `ls -l` output line and what each one means

| Field | Meaning |
|-------|---------|
| `-rw-r--r--` | Access permissions (file type and permissions) |
| `1` | Number of hard links |
| `root` | Owner of the file |
| `root` | Group owner of the file |
| `3576296` | Size in bytes |
| `2024-03-22 11:18` | Date and time of last modification |
| `TLCL-24.11.pdf` | Name of the file |

The first character of the permissions field indicates the file type: `-` for a regular file, `d` for a directory, `l` for a symbolic link.

### 5. Determining a File's Type with file

The `file` command examines a file and prints a brief description of its contents. Because Linux does not rely on file extensions to determine type, `file` is useful for identifying what kind of data a file contains:

```bash
file picture.jpg
# picture.jpg: JPEG image data
```

```bash
file /etc/passwd
# /etc/passwd: ASCII text
```

```bash
file /bin/ls
# /bin/ls: ELF 64-bit LSB pie executable
```

In Unix-like systems, "everything is a file." There are many kinds of files: regular files, directories, device files, symbolic links, and more.

### 6. Viewing File Contents with less

The `less` command is a **pager** — a program that allows page-by-page viewing of text files:

```bash
less /etc/passwd
```

Many important files on a Linux system are stored as plain text: configuration files in `/etc`, shell scripts, log files, and source code. The `less` command is the preferred tool for examining these.

### 7. What Is "Text"?

Computers represent text using character encoding schemes. **ASCII** (American Standard Code for Information Interchange) is the simplest and most common scheme, mapping 128 characters to numbers. Plain text files contain only these simple character mappings.

Text is not the same as a word processor document. Word processor files contain formatting, fonts, and structure beyond plain characters — they are not plain text even though they contain readable words.

### 8. less Commands

Table: The `less` keys covered so far and the action each one performs

| Command | Action |
|---------|--------|
| Page Up or `b` | Scroll back one page |
| Page Down or Space | Scroll forward one page |
| Up Arrow | Scroll up one line |
| Down Arrow | Scroll down one line |
| `G` | Move to end of file |
| `1G` or `g` | Move to beginning of file |
| `/characters` | Search forward for *characters* |
| `n` | Repeat previous search |
| `h` | Display help screen |
| `q` | Quit `less` |

### 9. Less Is More

The `less` command is an improved replacement for the older `more` command. Programs like `less` and `more` are called *pagers* because they allow content to be viewed one page at a time. The name `less` is a play on the phrase "less is more."

### 10. Taking a Guided Tour

A useful method for exploring the filesystem:

1. `cd` into a directory
2. List the contents with `ls -l`
3. Use `file` on anything interesting to determine what it contains
4. If a file is text, view it with `less`

If the terminal becomes scrambled (for example, by accidentally viewing a binary file), use the `reset` command to restore the terminal to a working state.

### 11. Directories Found on Linux Systems

Linux systems follow a standard directory layout. Key directories include:

Table: The standard Linux directories covered in this lecture and what each one holds

| Directory | Description |
|-----------|-------------|
| `/` | The root directory; everything starts here |
| `/bin` | Essential programs needed to boot and run the system (deprecated; now a symlink to `/usr/bin` on many systems) |
| `/boot` | Linux kernel, boot loader, and related files |
| `/dev` | Device nodes — special files representing hardware devices |
| `/etc` | System-wide configuration files and shell scripts that run at boot |
| `/home` | Home directories for regular users |
| `/lib` | Shared library files (deprecated; now a symlink to `/usr/lib`) |
| `/lost+found` | Used for filesystem recovery after a crash |
| `/media` | Mount points for removable media (USB drives, CDs) |
| `/mnt` | Mount points for manually mounted filesystems |
| `/opt` | Optional or add-on software |
| `/proc` | A virtual filesystem exposing kernel and process information |
| `/root` | Home directory of the root (superuser) account |
| `/run` | Runtime data for processes started since last boot (tempfs) |
| `/sbin` | System binaries for administration (deprecated; now a symlink to `/usr/sbin`) |
| `/sys` | A virtual filesystem exposing device and driver information |
| `/tmp` | Temporary files; may be cleared on reboot |
| `/usr` | Contains the majority of user programs and data |
| `/usr/bin` | Executable programs installed by the distribution |
| `/usr/lib` | Shared libraries for `/usr/bin` programs |
| `/usr/local` | Programs compiled and installed locally (not from the distribution) |
| `/usr/sbin` | Additional system administration programs |
| `/usr/share` | Shared data used by programs (default configs, icons, etc.) |
| `/usr/share/doc` | Documentation for installed packages |
| `/var` | Data that changes frequently: databases, spool files, user mail |
| `/var/log` | Log files (e.g., `messages`, `syslog`) |

Notable configuration files in `/etc`:

- `/etc/crontab` — Scheduled tasks
- `/etc/fstab` — Filesystem mount table
- `/etc/passwd` — User account information

User-specific desktop configuration often resides in `~/.config` and `~/.local`.

### 12. Symbolic Links

A directory listing may include entries like:

```bash
ls -l /lib/libc.so.6
# lrwxrwxrwx 1 root root 12 ... libc.so.6 -> libc-2.6.so
```

A **symbolic link** (also called a *soft link* or *symlink*) is a special file that points to another file by name. The `l` at the beginning of the permissions field identifies it as a symbolic link.

Symbolic links are used for version management. A program can reference a generic name (e.g., `libc.so.6`), which is a symlink pointing to the actual versioned file (e.g., `libc-2.6.so`). When the library is upgraded, only the symlink needs to change.

Symbolic links are created with `ln -s`:

```bash
ln -s target linkname
```

### 13. Hard Links

A **hard link** is a second type of link, different in mechanism from symbolic links. Unlike symlinks, hard links are additional directory entries that point directly to the same data on disk. Hard links are explored in more detail in the next lecture.

---

## Additional Resources

### Key Commands Summary

Table: The commands covered in this lecture and what each one does

| Command | Purpose |
|---------|---------|
| `ls` | List directory contents |
| `file` | Determine the type of a file |
| `less` | View file contents page by page |

### Common ls Options Summary

Table: The `ls` options covered in this lecture, their purpose, and an example invocation

| Option | Long Option | Purpose | Example |
|--------|-------------|---------|---------|
| `-a` | `--all` | Show hidden files | `ls -a ~` |
| `-l` | | Long format | `ls -l /etc` |
| `-h` | `--human-readable` | Readable sizes | `ls -lh /usr/bin` |
| `-t` | | Sort by time | `ls -lt` |
| `-S` | | Sort by size | `ls -lS /usr/bin` |
| `-r` | `--reverse` | Reverse sort | `ls -ltr` |
| `-d` | `--directory` | List directory itself | `ls -ld /etc` |
| `-F` | `--classify` | Append type indicators | `ls -F /` |

### Long Format Fields Summary

Table: Each position in an `ls -l` line, the field it holds, and an example value

| Position | Field | Example |
|----------|-------|---------|
| 1 | File type and permissions | `-rw-r--r--` |
| 2 | Hard link count | `1` |
| 3 | Owner | `root` |
| 4 | Group | `root` |
| 5 | Size (bytes) | `3576296` |
| 6 | Modification date/time | `2024-03-22 11:18` |
| 7 | Filename | `README.md` |

### less Navigation Summary

Table: Every `less` key covered in this lecture and the action each one performs

| Key | Action |
|-----|--------|
| Space / Page Down | Forward one page |
| `b` / Page Up | Back one page |
| `G` | Go to end of file |
| `g` or `1G` | Go to beginning of file |
| `/text` | Search forward for *text* |
| `n` | Next search match |
| `h` | Help |
| `q` | Quit |

### Tips for Success

1. Use `ls -F` to quickly distinguish files from directories without switching to long format.
2. When exploring unfamiliar directories, follow the guided tour method: `ls -l`, then `file`, then `less` on text files.
3. Combine `ls` options freely — for example, `ls -lahS` gives a comprehensive sorted view.
4. Use `file` before `less` to avoid accidentally viewing binary files that may scramble your terminal.
5. If your terminal does become scrambled, type `reset` and press Enter to restore it.
6. Remember that `less` is for viewing only — it does not modify files.

### Common Pitfalls

- Confusing `ls /etc` (list contents of `/etc`) with `ls -d /etc` (list the directory entry itself). Without `-d`, `ls` shows what is inside the directory.
- Assuming file extensions determine file type on Linux — they do not. Use `file` to identify contents.
- Forgetting that `ls` does not show hidden files by default. Use `-a` or `-A` to reveal them.
- Accidentally viewing binary files with `less`, which scrambles the terminal. Always check with `file` first.
- Confusing the `-S` option (sort by size) with `-s` (display allocated size) — options are case-sensitive.
