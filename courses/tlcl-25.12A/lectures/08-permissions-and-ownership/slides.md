---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Permissions and Ownership: Users, Groups, and Identity'
info: |
  ## The Linux Command Line — Lecture 8
  Users, Groups, and Identity. Adapted from TLCL chapter 9.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---


# Permissions and Ownership

Users, Groups, and Identity

The Linux Command Line

Lecture 8

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Explain the Unix/Linux multi-user security model and how users, groups, and others control file access
- Use `chmod` to modify file and directory permissions using both octal and symbolic notation
- Apply `umask` to control default permissions for newly created files and directories
- Distinguish between the effects of read, write, and execute permissions on files versus directories
- Use `su`, `sudo`, `chown`, and `chgrp` to change user identity and file ownership
- Demonstrate how to set up a shared directory with proper group ownership and special permissions

---
layout: section
---

# Users, Groups & Others

Linux is a **multi-user** operating system — multiple users can access the system simultaneously

The kernel protects users from each other through a permission system built around three categories of access

---

# The id Command

The `id` command displays information about your identity

```bash
id
# uid=1000(me) gid=1000(me) groups=1000(me),4(adm),24(cdrom),27(sudo)
```

- **uid** — user ID number mapped to a username
- **gid** — primary group ID
- **groups** — all groups the user belongs to

---

# Where Identity Is Stored

| File | Contents |
|------|----------|
| `/etc/passwd` | User accounts: login name, uid, gid, real name, home directory, login shell |
| `/etc/group` | Group definitions and membership |
| `/etc/shadow` | Encrypted passwords and password policies |

- The **superuser** always has uid 0
- Modern Linux creates a unique, single-member group for each user

---
layout: section
---

# File Attributes & Permissions

The first 10 characters of `ls -l` output describe a file's type and permissions

```bash
ls -l foo.txt
# -rw-rw-r-- 1 me me 0 2025-03-06 14:52 foo.txt
```

---

# File Types

The first character indicates the **file type**

| Character | Type |
|-----------|------|
| `-` | Regular file |
| `d` | Directory |
| `l` | Symbolic link |
| `c` | Character special file (e.g., `/dev/null`) |
| `b` | Block special file (e.g., hard disk) |
| `s` | Socket (inter-process network communication) |
| `p` | Named pipe (inter-process communication) |

---

# The File Mode

The remaining nine characters represent the **file mode** — three sets of `rwx` permissions

| Position | Applies To |
|----------|------------|
| Characters 2-4 | **Owner** (user) |
| Characters 5-7 | **Group** |
| Characters 8-10 | **Others** (world) |

---

# Permission Meanings: Files vs Directories

| Attribute | Files | Directories |
|-----------|-------|-------------|
| `r` | Open and read the file | List directory contents (needs `x` too for details) |
| `w` | Write to or truncate the file (does not control rename/delete) | Create, delete, and rename files within (needs `x` too) |
| `x` | Execute as a program | Enter the directory (`cd`) and access file metadata |

---

# Permission Attribute Examples

| Attributes | Meaning |
|------------|---------|
| `-rwx------` | Owner can read, write, execute; no access for anyone else |
| `-rw-r--r--` | Owner reads/writes; group and others read only |
| `-rwxr-xr-x` | Owner full access; group and others can read and execute |
| `-rw-rw----` | Owner and group can read/write; others have no access |
| `drwxr-x---` | Owner full directory access; group can enter and list; others excluded |
| `lrwxrwxrwx` | Symbolic link — permissions are dummy values |

---
layout: section
---

# chmod — Change File Mode

The `chmod` command changes file and directory permissions

Only the file's **owner** or the **superuser** can change permissions

Two notation systems: **octal** and **symbolic**

---

# Octal Notation

Each octal digit maps to three binary bits, which map to `rwx`

| Octal | Binary | Mode |
|-------|--------|------|
| 0 | 000 | `---` |
| 1 | 001 | `--x` |
| 2 | 010 | `-w-` |
| 3 | 011 | `-wx` |
| 4 | 100 | `r--` |
| 5 | 101 | `r-x` |
| 6 | 110 | `rw-` |
| 7 | 111 | `rwx` |

---

# Octal Examples

```bash
chmod 600 foo.txt
ls -l foo.txt
# -rw------- 1 me me 0 2025-03-06 14:52 foo.txt
```

Common octal modes:

| Mode | Meaning |
|------|---------|
| `755` | `rwxr-xr-x` — owner full, others read/execute |
| `700` | `rwx------` — owner full, others nothing |
| `644` | `rw-r--r--` — owner read/write, others read |
| `600` | `rw-------` — owner read/write, others nothing |

---

# Symbolic Notation

Symbolic notation uses three parts: **who**, **operation**, **permission**

| Symbol | Who |
|--------|-----|
| `u` | User (owner) |
| `g` | Group |
| `o` | Others |
| `a` | All (u + g + o) |

Operations: `+` (add), `-` (remove), `=` (set exactly)

---

# Symbolic Examples

| Notation | Meaning |
|----------|---------|
| `u+x` | Add execute for owner |
| `u-x` | Remove execute from owner |
| `+x` | Add execute for all (same as `a+x`) |
| `o-rw` | Remove read/write from others |
| `go=rw` | Set group and others to read/write only |
| `u+x,go=rx` | Add execute for owner; set group/others to read/execute |

```bash
chmod u+x script.sh
chmod go-rwx secret.txt
```

---
layout: section
---

# umask — Set Default Permissions

The `umask` command controls the **default permissions** for newly created files and directories

It works as a mask — bits set in the mask are **removed** from the default mode

---

# How umask Works

```bash
umask
# 0002
```

The mask is applied by removing bits from the default:

| | Bits |
|---|------|
| Original file mode | `--- rw- rw- rw-` |
| Mask `0002` | `000 000 000 010` |
| Result | `--- rw- rw- r--` |

---

# Common umask Values

| Mask | Effect |
|------|--------|
| `0002` | Others lose write — group-friendly (default on many systems) |
| `0022` | Group and others lose write — more restrictive |
| `0077` | Group and others lose all access — very restrictive |

```bash
umask 0000
> wide_open.txt
ls -l wide_open.txt
# -rw-rw-rw- 1 me me 0 ...
```

Remember to reset: `umask 0002`

---
layout: section
---

# Special Permissions

Beyond `rwx`, three **special permission** bits provide additional access control

---

# setuid Bit (Octal 4000)

The **setuid** bit on an executable runs the program with the **owner's** privileges instead of the caller's

```bash
chmod u+s program
# or: chmod 4755 program
```

- Appears as `s` in the owner's execute position: `-rwsr-xr-x`
- Commonly used for programs like `passwd` that need root privileges

---

# setgid Bit (Octal 2000)

The **setgid** bit changes behavior depending on the target:

- On an executable: runs with the group owner's privileges
- On a directory: new files inherit the **directory's group** rather than the creator's primary group

```bash
chmod g+s dir
# or: chmod 2775 dir
```

Appears as `s` in the group execute position: `drwxrwsr-x`

---

# Sticky Bit (Octal 1000)

The **sticky bit** on a directory prevents users from deleting or renaming files they do not own

```bash
chmod +t dir
# or: chmod 1777 dir
```

- Appears as `t` in the others' execute position: `drwxrwxrwt`
- Classic example: `/tmp` uses the sticky bit

---
layout: section
---

# Changing Identities

Sometimes we need to act as another user — typically the superuser for administrative tasks

Three approaches: log out/in, `su`, or `sudo`

---

# su — Substitute User

The `su` command starts a new shell as another user

```bash
su -
# Password: (enter root's password)
# [root@linuxbox ~]#
```

- `su -` or `su -l` starts a **login shell** with the target user's environment
- Without a username, `su` defaults to the superuser
- `exit` returns to the previous shell

---

# su -c — Run a Single Command

Execute one command as another user without starting a full shell

```bash
su -c 'ls -l /root/*'
# Password:
# -rw------- 1 root root 754 2007-08-11 03:19 /root/anaconda-ks.cfg
```

Enclose the command in quotes to prevent expansion in the current shell

---

# sudo — Execute as Another User

`sudo` allows controlled execution of commands with elevated privileges

```bash
sudo ls -l /root
# Password: (enter YOUR password, not root's)
```

- Configured via `/etc/sudoers`
- Uses the **user's own password**, not root's
- Does not start a new shell or load another user's environment
- `sudo -i` starts an interactive superuser session
- `sudo -l` lists your granted privileges

---

# chown — Change File Owner and Group

The `chown` command changes file ownership (requires superuser privileges)

```bash
chown [owner][:[group]] file...
```

| Argument | Effect |
|----------|--------|
| `bob` | Change owner to bob |
| `bob:users` | Change owner to bob, group to users |
| `:admins` | Change group to admins only |
| `bob:` | Change owner to bob, group to bob's login group |

---

# chgrp — Change Group Ownership

The `chgrp` command changes only the group owner of a file

```bash
chgrp music shared_song.mp3
```

In older Unix systems, `chown` could not change group ownership, so `chgrp` was the only option

---
layout: section
---

# Setting Up a Shared Directory

Combining permissions, ownership, and special bits to create a collaborative workspace

---

# Create the Group and Add Members

```bash
sudo groupadd music
sudo usermod -a -G music janet
sudo usermod -a -G music tony
```

- `groupadd` creates the group
- `usermod -a -G` appends the user to the group

---

# Create and Configure the Directory

```bash
sudo mkdir /usr/local/share/Music
sudo chown :music /usr/local/share/Music
sudo chmod 2775 /usr/local/share/Music
```

```bash
ls -ld /usr/local/share/Music
# drwxrwsr-x 2 root music 4096 2025-03-21 18:05 /usr/local/share/Music
```

- `2775` = setgid + rwx for owner + rwx for group + r-x for others
- setgid ensures new files inherit the `music` group

---

# Set the umask for Collaboration

The default `umask 0022` blocks group write on new files — set it to `0002`:

```bash
umask 0002
> /usr/local/share/Music/test_file
mkdir /usr/local/share/Music/test_dir
ls -l /usr/local/share/Music
# drwxrwsr-x 2 janet music 4096 ... test_dir
# -rw-rw-r-- 1 janet music    0 ... test_file
```

Both files and directories now have correct group-write permissions

---
layout: section
---

# Changing Your Password

The `passwd` command sets or changes user passwords

```bash
passwd
# (current) UNIX password:
# New UNIX password:
```

- The system enforces **strong passwords** — rejects short, dictionary-based, or easily guessed passwords
- The superuser can change any user's password: `sudo passwd username`

---

# shadow-utils Commands

| Command | Description |
|---------|-------------|
| `lastlog` | Report the most recent login of all users |
| `useradd` | Create a new user account |
| `userdel` | Delete a user account |
| `usermod` | Modify a user account |
| `groupadd` | Create a new group |
| `groupdel` | Delete a group |
| `groupmod` | Modify a group definition |

---
layout: section
---

# Hands-On Lab

---

# Lab Setup

```bash
mkdir ~/permissions_lab
cd ~/permissions_lab
touch sample.txt
echo "Hello, permissions!" > sample.txt
```

---

# Exercise 1: Exploring Identity and File Attributes

View your user identity and examine file permissions:

```bash
id
ls -l sample.txt
ls -l /etc/passwd /etc/shadow
```

---

# Exercise 2: Changing Permissions with Octal Notation

```bash
chmod 700 sample.txt
ls -l sample.txt
chmod 644 sample.txt
ls -l sample.txt
chmod 000 sample.txt
ls -l sample.txt
```

Try reading the file after removing all permissions:

```bash
cat sample.txt
```

---

# Exercise 3: Changing Permissions with Symbolic Notation

```bash
chmod u+rw sample.txt
chmod g+r sample.txt
chmod o-rwx sample.txt
ls -l sample.txt
```

Make a script executable:

```bash
echo '#!/bin/bash' > hello.sh
echo 'echo "Hello from a script!"' >> hello.sh
chmod u+x hello.sh
./hello.sh
```

---

# Exercise 4: Working with umask

```bash
umask
umask 0077
touch restricted.txt
ls -l restricted.txt
umask 0000
touch open.txt
ls -l open.txt
umask 0002
```

---

# Exercise 5: Directory Permissions

```bash
mkdir testdir
chmod 700 testdir
touch testdir/inside.txt
ls -l testdir/
chmod 000 testdir
ls testdir/
```

Restore access:

```bash
chmod 755 testdir
```

---

# Exercise 6: Using sudo

```bash
sudo ls -l /root
sudo whoami
sudo -l
```

---

# Lab Cleanup

```bash
rm -rf ~/permissions_lab
```

---
layout: section
---

# Challenge Problems

---

# Challenge 1

What permissions result from each `chmod` command?

```bash
chmod 751 myfile
chmod 640 myfile
chmod u=rwx,g=rx,o= myfile
```

**Solution:** `751` = `rwxr-x--x`, `640` = `rw-r-----`, `u=rwx,g=rx,o=` = `rwxr-x---`

---

# Challenge 2

A shared project directory needs these requirements:
- Owner has full access
- Group members can read, write, and enter
- New files automatically belong to the project group
- Others have no access

What commands would you use?

```bash
sudo chmod 2770 /project
sudo chown :projectgroup /project
```

---

# Challenge 3

Given `umask 0027`, predict the permissions on a newly created file and a newly created directory.

**Solution:**
- File: default `666` minus `027` = `640` (`rw-r-----`)
- Directory: default `777` minus `027` = `750` (`rwxr-x---`)

---

# Assessment Questions

1. What three categories of users does the Linux permission model define, and how does `ls -l` display their permissions?
2. How does the meaning of the write permission differ between files and directories?
3. What is the difference between octal notation `chmod 755 file` and symbolic notation `chmod u=rwx,go=rx file`?
4. How does `umask` control the default permissions of newly created files?
5. When would you use `sudo` instead of `su`, and what is the key difference in authentication?
6. What is the setgid bit, and why is it useful on a shared directory?

---

# Summary

Today we learned how to:

- Understand the Unix/Linux multi-user security model (users, groups, others)
- Read and interpret file type and permission attributes from `ls -l` output
- Change permissions with `chmod` using octal and symbolic notation
- Control default permissions with `umask`
- Change user identity with `su` and `sudo`, and file ownership with `chown` and `chgrp`
- Set up shared directories using group ownership, setgid, and appropriate umask values

These skills are fundamental to securing files, collaborating with other users, and performing system administration tasks on any Linux system.

---

# Additional Resources

- `man chmod`, `man chown`, `man umask`, `man sudo` — detailed command references
- `man 5 passwd`, `man 5 shadow` — file format documentation for user account files
- Use `stat filename` to see detailed file metadata including numeric permissions
- Practice with disposable files in `/tmp` — a safe place to experiment with permissions
- The `--recursive` (`-R`) option for `chmod` and `chown` applies changes to entire directory trees — use with caution
