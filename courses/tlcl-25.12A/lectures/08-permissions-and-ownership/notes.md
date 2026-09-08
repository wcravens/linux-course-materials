---
title: 'Permissions and Ownership'
subtitle: 'The Linux Command Line — Lecture 8'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Explain the Unix multi-user security model including users, groups, and file ownership
- Use `chmod` to modify file and directory permissions using both octal and symbolic notation
- Apply `umask` to control the default permissions assigned to newly created files and directories
- Distinguish the effects of read, write, and execute permissions on files versus directories
- Demonstrate how to change file ownership with `chown` and `chgrp`
- Control access to shared resources using group membership, setgid directories, and appropriate umask values

## Key Commands Covered

- `id` — Display user identity (uid, gid, and group memberships)
- `chmod` — Change a file's mode (permissions)
- `umask` — Set the default file permissions mask
- `su` — Run a shell as another user
- `sudo` — Execute a command as another user
- `chown` — Change a file's owner and/or group owner
- `chgrp` — Change a file's group ownership
- `passwd` — Change a user's password
- `groupadd` — Create a new group
- `usermod` — Modify a user account

## Chapter Outline

### 1. Users, Group Members, and Everybody Else

Linux is a **multi-user** operating system, meaning multiple people can use the same computer simultaneously. To protect users from each other, the system implements a security model based on user identity, group membership, and file ownership.

Every user is assigned a numeric **user ID** (uid) and a primary **group ID** (gid). Users may also belong to additional groups. The `id` command displays this information.

```bash
id
# uid=1000(me) gid=1000(me) groups=1000(me),4(adm),24(cdrom),27(sudo)
```

User accounts are defined in three key files:

| File | Contents |
|------|----------|
| `/etc/passwd` | Username, uid, gid, real name, home directory, login shell |
| `/etc/group` | Group names and their members |
| `/etc/shadow` | Encrypted password data (not readable by regular users) |

Besides regular user accounts, there are accounts for the superuser (always uid 0) and various system users. Modern Linux practice creates a unique, single-member group with the same name as the user.

### 2. Reading, Writing, and Executing

Access rights to files and directories are defined in terms of read, write, and execute access. The first 10 characters in `ls -l` output represent the **file attributes**: one character for the file type followed by nine characters for the **file mode**.

```bash
ls -l foo.txt
# -rw-rw-r-- 1 me me 0 2025-03-06 14:52 foo.txt
```

**File types:**

| Attribute | File Type |
|-----------|-----------|
| `-` | A regular file |
| `d` | A directory |
| `l` | A symbolic link (remaining attributes are dummy values `rwxrwxrwx`) |
| `c` | A character special file (handles data as a stream of bytes) |
| `b` | A block special file (handles data in blocks, e.g., hard disk) |
| `s` | A socket (used for inter-process network communication) |
| `p` | A named pipe (allows inter-process communication) |

The nine mode characters are divided into three groups of three — owner, group, and other — each containing `r`, `w`, and `x` positions.

**Permission attributes — files vs. directories:**

| Attribute | Files | Directories |
|-----------|-------|-------------|
| `r` | Allows the file to be opened and read | Allows directory contents to be listed (requires `x` for file details) |
| `w` | Allows the file to be written to or truncated; does not control renaming or deleting (that depends on directory permissions) | Allows files within the directory to be created, deleted, and renamed (requires `x`) |
| `x` | Allows the file to be executed as a program; scripts also need `r` | Allows entering the directory (`cd`) and accessing file metadata |

**Permission attribute examples:**

| File Attributes | Meaning |
|-----------------|---------|
| `-rwx------` | Regular file, readable/writable/executable by owner only |
| `-rw-------` | Regular file, readable/writable by owner only |
| `-rw-r--r--` | Regular file, owner can read/write; group and others can read |
| `-rwxr-xr-x` | Regular file, owner has full access; everyone else can read and execute |
| `-rw-rw----` | Regular file, readable/writable by owner and group only |
| `lrwxrwxrwx` | Symbolic link (dummy permissions; real permissions on the target) |
| `drwxrwx---` | Directory, owner and group can enter, list, create, rename, and delete files |
| `drwxr-x---` | Directory, owner has full access; group can enter and list but not modify |

### 3. chmod — Change File Mode

The `chmod` command changes the mode (permissions) of a file or directory. Only the file's owner or the superuser can change a file's mode. It supports two ways of specifying mode changes: **octal notation** and **symbolic notation**.

**Octal notation** maps each octal digit to three binary digits, which correspond directly to the `rwx` permission bits.

| Octal | Binary | File Mode |
|-------|--------|-----------|
| `0` | `000` | `---` |
| `1` | `001` | `--x` |
| `2` | `010` | `-w-` |
| `3` | `011` | `-wx` |
| `4` | `100` | `r--` |
| `5` | `101` | `r-x` |
| `6` | `110` | `rw-` |
| `7` | `111` | `rwx` |

Three octal digits set the mode for owner, group, and others respectively.

```bash
chmod 600 foo.txt
ls -l foo.txt
# -rw------- 1 me me 0 2025-03-06 14:52 foo.txt
```

The most common octal values are `7` (rwx), `6` (rw-), `5` (r-x), `4` (r--), and `0` (---).

**Symbolic notation** uses three parts: who is affected, the operation, and the permission.

| Symbol | Meaning |
|--------|---------|
| `u` | The file or directory owner (user) |
| `g` | The group owner |
| `o` | Others |
| `a` | All (equivalent to `u`, `g`, and `o` combined) |

Operations: `+` adds a permission, `-` removes a permission, `=` sets exact permissions (removing all others).

| Notation | Meaning |
|----------|---------|
| `u+x` | Add execute permission for the owner |
| `u-x` | Remove execute permission from the owner |
| `+x` | Add execute for user, group, and others (equivalent to `a+x`) |
| `o-rw` | Remove read and write from others |
| `go=rw` | Set group and others to read and write exactly (removes execute if present) |
| `u+x,go=rx` | Add execute for user; set group and others to read and execute |

A caution about `chmod --recursive`: it acts on both files and directories, which is rarely desirable since files and directories typically need different permissions.

### 4. Setting File Mode with the GUI

In graphical file managers such as Files (GNOME) or Dolphin (KDE), right-clicking a file or directory and selecting Properties exposes a permissions dialog. This dialog allows setting owner, group, and other permissions without using the command line.

### 5. umask — Set Default Permissions

The `umask` command controls the default permissions given to a file when it is created. It uses octal notation to express a **mask** of bits to be *removed* from a file's default mode attributes.

```bash
umask
# 0002
```

When umask is `0000`, files are created with the maximum default permissions (`rw-rw-rw-` for files). The mask removes bits from this default.

| | Owner | Group | Other |
|---|---|---|---|
| Original file mode | `rw-` | `rw-` | `rw-` |
| Mask `0002` (binary `000 000 010`) | --- | --- | `-w-` |
| Result | `rw-` | `rw-` | `r--` |

With a mask of `0022`:

| | Owner | Group | Other |
|---|---|---|---|
| Original file mode | `rw-` | `rw-` | `rw-` |
| Mask `0022` (binary `000 010 010`) | --- | `-w-` | `-w-` |
| Result | `rw-` | `r--` | `r--` |

```bash
umask 0000
> foo.txt
ls -l foo.txt
# -rw-rw-rw- 1 me me 0 2025-03-06 14:58 foo.txt
```

The leading zero in the four-digit umask relates to special permissions (setuid, setgid, sticky bit).

**Some Special Permissions:**

- **Setuid bit** (octal `4000`, symbolic `u+s`): When set on an executable file, the program runs with the effective user ID of the file's owner rather than the user running it. Example in `ls`: `-rwsr-xr-x`.
- **Setgid bit** (octal `2000`, symbolic `g+s`): On an executable, changes the effective group ID. On a *directory*, newly created files inherit the directory's group ownership rather than the creator's primary group. Example in `ls`: `drwxrwsr-x`.
- **Sticky bit** (octal `1000`, symbolic `+t`): On a directory, prevents users from deleting or renaming files unless they are the owner of the directory, the owner of the file, or the superuser. Commonly used on `/tmp`. Example in `ls`: `drwxrwxrwt`.

```bash
chmod u+s program
chmod g+s dir
chmod +t dir
```

### 6. Changing Identities

There are three ways to take on an alternate identity: log out and log back in, use `su`, or use `sudo`.

**su — Run a Shell with Substitute User and Group IDs:**

```bash
su [-[l]] [user]
```

The `-l` option (abbreviated as `-`) starts a login shell for the specified user, loading that user's environment and changing to their home directory. If no user is specified, the superuser is assumed. The user is prompted for the *target user's* password.

```bash
su -
# Password:
# [root@linuxbox ~]#
```

To execute a single command without starting an interactive shell:

```bash
su -c 'ls -l /root/*'
# Password:
# (output of ls command)
```

**sudo — Execute a Command as Another User:**

Unlike `su`, `sudo` authenticates with the *user's own password*, not the root password. It does not start a new shell or load another user's environment by default. Configuration is stored in `/etc/sudoers`.

```bash
sudo ls /root
# Password:
# (directory listing)
```

Use `sudo -l` to list granted privileges. Use `sudo -i` to start an interactive superuser session (similar to `su -`). After successful authentication, `sudo` typically caches credentials for several minutes.

Modern distributions (starting with Ubuntu) favor `sudo` over `su`, often disabling the root password entirely.

**chown — Change File Owner and Group:**

Superuser privileges are required to use `chown`. The syntax is:

```bash
chown [owner][:[group]] file...
```

| Argument | Result |
|----------|--------|
| `bob` | Changes the file owner to `bob` |
| `bob:users` | Changes owner to `bob` and group to `users` |
| `:admins` | Changes only the group to `admins` |
| `bob:` | Changes owner to `bob` and group to `bob`'s login group |

```bash
sudo chown tony: ~tony/myfile.txt
```

**chgrp — Change Group Ownership:**

The `chgrp` command changes only the group owner. It works like `chown` but is more limited. In older Unix, `chown` could not change group ownership, hence the separate `chgrp` command.

### 7. Exercising Our Privileges — Shared Directory Example

Setting up a shared directory demonstrates how permissions concepts work together. The steps involve creating a group, adding users to it, creating a shared directory, setting group ownership and the setgid bit, and adjusting `umask`.

```bash
sudo groupadd music
sudo usermod -a -G music janet
sudo usermod -a -G music tony
sudo mkdir /usr/local/share/Music
sudo chown :music /usr/local/share/Music
sudo chmod 2775 /usr/local/share/Music
```

The mode `2775` sets the setgid bit (`2`), and grants `rwx` to the owner, `rwx` to the group, and `r-x` to others. With setgid on the directory, all new files and subdirectories inherit the `music` group. Members must also use `umask 0002` so that group write permission is preserved on new files.

### 8. Changing Your Password

The `passwd` command sets or changes passwords. Without arguments, it changes the current user's password. With superuser privileges, a username can be specified.

```bash
passwd
# (current) UNIX password:
# New UNIX password:
```

The `passwd` command enforces strong passwords, rejecting passwords that are too short, too similar to the previous password, based on dictionary words, or too easily guessed.

### 9. shadow-utils Commands

The `passwd`, `groupadd`, and `usermod` commands are part of the **shadow-utils** package. Additional commands include:

| Command | Description |
|---------|-------------|
| `lastlog` | Reports the most recent login of all users or a given user |
| `useradd` | Create a new user or update default new user information |
| `userdel` | Delete a user account and related files |
| `usermod` | Modify a user account |
| `groupadd` | Create a new group |
| `groupdel` | Delete a group |
| `groupmod` | Modify a group definition on the system |

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---------|---------|
| `id` | Display user and group identity information |
| `chmod` | Change file or directory permissions |
| `umask` | Set default file creation permission mask |
| `su` | Start a shell as another user |
| `sudo` | Execute a command as another user (typically root) |
| `chown` | Change file owner and/or group owner |
| `chgrp` | Change file group ownership |
| `passwd` | Change user password |
| `groupadd` | Create a new group |
| `usermod` | Modify user account (e.g., add to groups) |

### Permissions Concepts Summary

| Concept | Syntax | Example |
|---------|--------|---------|
| Octal mode | Three digits (owner/group/other) | `chmod 755 file` |
| Symbolic mode | `[ugoa][+-=][rwx]` | `chmod u+x file` |
| umask | Four-digit mask | `umask 0022` |
| Setuid | Octal `4000` or `u+s` | `chmod 4755 program` |
| Setgid | Octal `2000` or `g+s` | `chmod 2775 dir` |
| Sticky bit | Octal `1000` or `+t` | `chmod 1777 dir` |
| Change owner | `chown user[:group] file` | `chown bob:staff file` |

### Permission Effects Summary

| Permission | On Files | On Directories |
|------------|----------|----------------|
| `r` (read) | View file contents | List directory contents |
| `w` (write) | Modify file contents | Create/delete/rename files in directory |
| `x` (execute) | Run as a program | Enter directory (`cd`) and access metadata |
| `s` (setuid/setgid) | Run with owner's/group's effective ID | New files inherit directory's group |
| `t` (sticky) | Ignored on Linux | Only owner can delete their own files |

### Tips for Success

1. Use `ls -l` frequently to verify permissions after making changes — always confirm the result matches your intent.
2. Think in terms of "who needs what access" before choosing a permission mode: owner, group, or others.
3. Practice converting between octal and symbolic notation until it becomes second nature — both appear regularly in documentation and scripts.
4. Remember that directory permissions control *what you can do with the files inside*, while file permissions control *what you can do with the file itself*.
5. Use `sudo` judiciously — run commands with the least privilege necessary and avoid interactive root shells when a single `sudo` command will suffice.
6. When setting up shared directories, consider all three elements: group ownership, setgid bit, and umask.

### Common Pitfalls

- Forgetting that deleting a file requires write and execute permission on the *directory*, not on the file itself — even a file with mode `000` can be deleted if the directory allows it.
- Using `chmod -R 755` on a directory tree — this makes all files executable, which is rarely appropriate. Files and directories typically need different permissions.
- Confusing `su` and `sudo` password requirements — `su` asks for the *target user's* password, while `sudo` asks for *your own* password.
- Setting umask in a terminal session and expecting it to persist — umask changes last only for the current session unless added to a shell startup file like `~/.bashrc`.
- Forgetting the setgid bit on shared directories — without it, new files get the creator's primary group, not the shared group, causing access problems for other group members.
