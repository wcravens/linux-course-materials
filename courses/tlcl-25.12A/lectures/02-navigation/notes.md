---
title: 'Navigation'
subtitle: 'The Linux Command Line — Lecture 2'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Explain how the Linux file system is organized as a hierarchical tree structure
- Use `pwd` to display the current working directory
- Use `ls` to list the contents of directories
- Navigate the file system using `cd` with absolute and relative pathnames
- Distinguish between absolute pathnames and relative pathnames
- Apply navigation shortcuts including `~`, `-`, `.`, and `..`

## Key Commands Covered

- `pwd` — Print the name of the current working directory
- `cd` — Change the current working directory
- `ls` — List directory contents

---

## Chapter Outline

### 1. Understanding the File System Tree

Like Windows, Linux organizes its files in a *hierarchical directory structure* — a tree-like pattern of directories (also called folders) that contain files and other directories. The first directory in the file system is called the **root directory**.

Unlike Windows, which has a separate file system tree for each storage device (e.g., `C:\`, `D:\`), Linux always has a single file system tree regardless of how many drives or storage devices are attached to the computer. Storage devices are *mounted* at various points on the tree according to the system administrator's preferences. This process is managed by the system administrator.

### 2. The Current Working Directory

Most of us are used to a graphical file manager, but the command line works differently. Imagine the file system as an upside-down tree and that we are able to stand in the middle of it. At any given moment, we are inside a single directory called the *current working directory*. We can see the files in the directory, the pathway to the directory above us (the *parent directory*), and any subdirectories below us.

The `pwd` (print working directory) command displays the current working directory:

```bash
pwd
# /home/me
```

When we first log in to our system, our current working directory is set to our **home directory**. Each user account is given its own home directory, and it is the only place a regular user is allowed to write files.

### 3. Listing the Contents of a Directory

The `ls` command is used to list the contents of a directory:

```bash
ls
# Desktop Documents Downloads Music Pictures
```

The `ls` command can also list the contents of a specified directory, or multiple directories:

```bash
ls /usr
# bin games include lib local sbin share src
```

```bash
ls ~ /usr
# /home/me:
# Desktop Documents Downloads Music Pictures
#
# /usr:
# bin games include lib local sbin share src
```

### 4. Changing the Current Working Directory

To change the current working directory, use the `cd` command. Type `cd` followed by the *pathname* of the desired working directory. A pathname is the route along the branches of the file system tree to reach a given directory. Pathnames can be specified in one of two ways: as **absolute pathnames** or as **relative pathnames**.

### 5. Absolute Pathnames

An *absolute pathname* begins with the root directory (`/`) and follows the tree branch by branch until the path to the desired directory or file is completed. Each directory along the path is separated by a `/`:

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

Because an absolute pathname always starts from the root directory, it works the same regardless of the current working directory.

### 6. Relative Pathnames

A *relative pathname* starts from the current working directory rather than from root. It uses two special notations: `.` (dot) refers to the current working directory, and `..` (dot dot) refers to the parent directory.

```bash
cd /usr/bin
cd ..
pwd
# /usr
```

```bash
cd /usr
cd ./bin
pwd
# /usr/bin
```

In almost all cases, the `./` prefix can be omitted because it is implied:

```bash
cd /usr
cd bin
pwd
# /usr/bin
```

Relative pathnames can combine `..` to walk up the tree and then down again:

```bash
cd /usr/bin
cd ../local
pwd
# /usr/local
```

### 7. Some Helpful Shortcuts

The `cd` command offers several useful shortcuts:

| Shortcut | Result |
|----------|--------|
| `cd` | Changes to the home directory |
| `cd -` | Changes to the previous working directory |
| `cd ~user_name` | Changes to the home directory of *user_name* |

```bash
cd
pwd
# /home/me
```

```bash
cd /usr/bin
cd -
# /home/me
pwd
# /home/me
```

```bash
cd ~root
pwd
# /root
```

### 8. Important Facts About Filenames

Linux file systems have several properties that differ from other operating systems:

1. **Filenames beginning with a period (`.`) are hidden.** This simply means that `ls` will not list them unless you use `ls -a`:

```bash
ls -a
# . .. .bash_history .bashrc Desktop Documents Downloads
```

2. **Filenames and commands in Linux are case sensitive.** The filenames `File1` and `file1` refer to different files.

3. **Linux has no concept of a "file extension."** Unlike Windows, which uses extensions to determine file type, you may name files any way you like. The content or type of a file is determined by other means. Although Linux itself does not care about extensions, many application programs do.

4. **Do not embed spaces in filenames.** Although Linux supports spaces in filenames, limit the punctuation characters in filenames to period, dash, and underscore. Spaces in filenames make many command-line tasks more difficult.

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---------|---------|
| `pwd` | Print the current working directory |
| `cd` | Change the current working directory |
| `ls` | List directory contents |

### Navigation Concepts Summary

| Concept | Description | Example |
|---------|-------------|---------|
| Root directory | The top of the file system tree | `/` |
| Home directory | User's personal directory | `/home/me` |
| Absolute pathname | Full path from root | `/usr/local/bin` |
| Relative pathname | Path from current directory | `../bin` |
| Current directory | The directory you are in now | `.` |
| Parent directory | The directory one level up | `..` |
| Hidden file | A file whose name begins with `.` | `.bashrc` |

### Navigation Shortcuts Summary

| Shortcut | Result |
|----------|--------|
| `cd` | Changes to home directory |
| `cd -` | Changes to previous working directory |
| `cd ~` | Changes to home directory |
| `cd ~user_name` | Changes to home directory of *user_name* |
| `cd ..` | Changes to parent directory |
| `cd ../..` | Changes two levels up |

### Pathname Notation Summary

| Notation | Meaning |
|----------|---------|
| `/` | Root directory (at the start of a path) or directory separator |
| `.` | Current working directory |
| `..` | Parent directory |
| `~` | Current user's home directory |
| `~user` | Home directory of *user* |

### Tips for Success

1. Use `pwd` frequently to confirm where you are in the file system — it is easy to lose track when navigating with relative pathnames.
2. Use tab completion when typing pathnames — press Tab to auto-complete directory and file names, reducing typos.
3. Remember that `cd` with no arguments always takes you home — it is the fastest way to reset your position.
4. Use `cd -` to toggle between two directories you are working in — it saves typing long pathnames repeatedly.
5. Start with absolute pathnames when you are unsure of your current location, and use relative pathnames when you are confident about where you are.
6. Avoid spaces in filenames — use dashes or underscores instead to make command-line work easier.

### Common Pitfalls

- Forgetting the leading `/` in an absolute pathname — `cd usr/bin` fails because the shell looks for `usr/bin` relative to the current directory, not from root.
- Confusing `.` and `..` — `.` is the current directory, `..` is the parent. Using the wrong one puts you in an unexpected location.
- Not realizing that `ls` hides dotfiles by default — use `ls -a` to see all files, including configuration files like `.bashrc`.
- Assuming file extensions determine file type in Linux — unlike Windows, Linux does not rely on extensions. A file named `photo` could be an image, and a file named `readme.txt` could be a binary.
- Embedding spaces in filenames — while technically allowed, spaces require quoting or escaping on the command line and cause frequent errors.
