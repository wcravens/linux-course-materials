---
title: 'Files and Directories'
subtitle: 'The Linux Command Line — Lecture 4'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Use wildcards (globbing) to select files based on name patterns
- Create directories with `mkdir` and organize file hierarchies
- Copy, move, and rename files and directories using `cp` and `mv`
- Remove files and directories safely with `rm`
- Explain the difference between hard links and symbolic links
- Create both types of links using `ln`

## Key Commands Covered

- `mkdir` — Create directories
- `cp` — Copy files and directories
- `mv` — Move and rename files and directories
- `rm` — Remove files and directories
- `ln` — Create hard and symbolic links

## Chapter Outline

### 1. Wildcards

**Wildcards** (also called *globbing*) are special characters that allow the shell to select filenames based on patterns of characters. Before a command is executed, the shell expands wildcard characters into a list of matching filenames.

Table: The wildcard characters covered in this lecture and what each one matches

| Wildcard | Meaning |
|---|---|
| `*` | Matches any characters (including none) |
| `?` | Matches any single character |
| `[characters]` | Matches any character that is a member of the set |
| `[\!characters]` | Matches any character that is not a member of the set |
| `[[:class:]]` | Matches any character that is a member of the specified class |

**Character classes** provide named sets of characters:

Table: The named character classes covered in this lecture and what each one matches

| Class | Meaning |
|---|---|
| `[:alnum:]` | Any alphanumeric character |
| `[:alpha:]` | Any alphabetic character |
| `[:digit:]` | Any numeral |
| `[:lower:]` | Any lowercase letter |
| `[:upper:]` | Any uppercase letter |

**Wildcard examples:**

Table: Sample wildcard patterns and the files each one matches

| Pattern | Matches |
|---|---|
| `*` | All files |
| `g*` | Any file beginning with `g` |
| `b*.txt` | Any file beginning with `b` followed by any characters and ending with `.txt` |
| `Data???` | Any file beginning with `Data` followed by exactly three characters |
| `[abc]*` | Any file beginning with `a`, `b`, or `c` |
| `BACKUP.[0-9][0-9][0-9]` | Any file beginning with `BACKUP.` followed by exactly three numerals |
| `[[:upper:]]*` | Any file beginning with an uppercase letter |
| `[\![:digit:]]*` | Any file not beginning with a numeral |
| `*[[:lower:]123]` | Any file ending with a lowercase letter or the numerals `1`, `2`, or `3` |

**Character Ranges:**

Traditional POSIX character ranges such as `[A-Z]` and `[a-z]` may not work as expected because their behavior depends on the locale (collation order). For portable, predictable results, use character classes like `[[:upper:]]` and `[[:lower:]]` instead.

**Wildcards and Hidden Files:**

By default, wildcard patterns do not match filenames that begin with a dot (hidden files). To list hidden files while excluding `.` and `..`, use these patterns:

```bash
ls -d .[\!.]*
# Matches hidden files/dirs, excludes . and ..
```

```bash
ls -d .??*
# Alternative: matches dot followed by at least two characters
```

**Wildcards Work in the GUI Too:**

File managers such as Nautilus (GNOME) support wildcard patterns in their search or selection dialogs (Ctrl-S in Nautilus). Dolphin and Konqueror (KDE) support wildcard entry in their location bars.

### 2. mkdir — Create Directories

The `mkdir` command creates one or more directories. The three periods in the usage notation (`mkdir directory...`) indicate that the argument can be repeated.

```bash
mkdir directory1
```

```bash
mkdir dir1 dir2 dir3
# Creates three directories in a single command
```

### 3. cp — Copy Files and Directories

The `cp` command copies files and directories. It has two primary usage forms:

```bash
cp item1 item2
# Copies single item1 to item2
```

```bash
cp item... directory
# Copies one or more items into a directory
```

**Important:** Without the `-i` option, `cp` silently overwrites existing files.

**cp options:**

Table: The `cp` options covered in this lecture, their long forms, and what each one does

| Option | Long Option | Meaning |
|---|---|---|
| `-a` | `--archive` | Copy files and directories with all attributes (ownership, permissions) including entire directory trees |
| `-i` | `--interactive` | Prompt before overwriting an existing file |
| `-r` | `--recursive` | Recursively copy directories and their contents |
| `-u` | `--update` | Only copy files that are newer than the destination or do not yet exist in the destination |
| `-v` | `--verbose` | Display informative messages as the copy is performed |

**cp examples:**

```bash
cp file1 file2
# Copy file1 to file2. If file2 exists, it is overwritten.
```

```bash
cp -i file1 file2
# Same as above, but prompts before overwriting file2.
```

```bash
cp file1 file2 dir1
# Copy file1 and file2 into directory dir1 (dir1 must exist).
```

```bash
cp dir1/* dir2
# Copy all files in dir1 into dir2 (dir2 must exist).
```

```bash
cp -r dir1 dir2
# Copy dir1 and its contents into dir2. If dir2 does not exist, it is created with the same contents as dir1.
```

### 4. mv — Move and Rename Files

The `mv` command moves or renames files and directories. Like `cp`, it has two usage forms:

```bash
mv item1 item2
# Move/rename item1 to item2
```

```bash
mv item... directory
# Move one or more items into a directory
```

**Important:** Without `-i`, `mv` silently overwrites existing files.

**mv options:**

Table: The `mv` options covered in this lecture, their long forms, and what each one does

| Option | Long Option | Meaning |
|---|---|---|
| `-i` | `--interactive` | Prompt before overwriting an existing file |
| `-u` | `--update` | Only move files that are newer than the destination or do not yet exist |
| `-v` | `--verbose` | Display informative messages as the move is performed |

**mv examples:**

```bash
mv file1 file2
# Rename file1 to file2. If file2 exists, it is overwritten.
```

```bash
mv -i file1 file2
# Same as above, but prompts before overwriting.
```

```bash
mv file1 file2 dir1
# Move file1 and file2 into directory dir1 (dir1 must exist).
```

```bash
mv dir1 dir2
# If dir2 does not exist, rename dir1 to dir2. If dir2 exists, move dir1 into dir2.
```

### 5. rm — Remove Files and Directories

The `rm` command removes (deletes) files and directories.

**Important:** Linux does not have an undelete command. Once `rm` deletes a file, it is gone. Be especially careful with wildcards.

**rm options:**

Table: The `rm` options covered in this lecture, their long forms, and what each one does

| Option | Long Option | Meaning |
|---|---|---|
| `-i` | `--interactive` | Prompt before deleting each file |
| `-r` | `--recursive` | Recursively delete directories and their contents |
| `-f` | `--force` | Ignore nonexistent files and do not prompt; overrides `-i` |
| `-v` | `--verbose` | Display informative messages as deletions are performed |

**rm examples:**

```bash
rm file1
# Delete file1 silently
```

```bash
rm -i file1
# Prompt before deleting file1
```

```bash
rm -r file1 dir1
# Delete file1 and dir1 and its contents
```

```bash
rm -rf file1 dir1
# Same as above, but force deletion without prompting even if files do not exist
```

**Be Careful with rm\!**

A critical safety tip: the difference between `rm *.html` and `rm * .html` (with an accidental space) is catastrophic. The second command deletes everything in the current directory and then tries to delete a file called `.html`.

**Tip:** Always test wildcard patterns with `ls` first, then replace `ls` with `rm` once you are confident the pattern matches the intended files:

```bash
ls *.html
# Verify the pattern matches what you expect
rm *.html
# Now delete
```

### 6. ln — Create Links

The `ln` command creates links — additional directory entries that refer to the same file data. There are two types: **hard links** and **symbolic links**.

```bash
ln file link
# Create a hard link
```

```bash
ln -s item link
# Create a symbolic link
```

### 7. Hard Links

**Hard links** are the original Unix method for creating links. A hard link is an additional directory entry for a file. Every file has at least one hard link (its own directory entry).

When a hard link is created, an additional directory entry is created that points to the same **inode** (the data structure on disk that stores the file's contents and attributes). The file data is shared — there is no distinction between the "original" file and the hard link.

Hard links have two important limitations:

1. A hard link cannot reference a file outside its own file system (cannot span physical devices/partitions)
2. A hard link cannot reference a directory

A file is not deleted until all hard links to it are removed. The link count (shown by `ls -l`) indicates how many hard links point to a file.

```bash
ls -li
# The -i option shows inode numbers; hard links share the same inode
```

### 8. Symbolic Links

**Symbolic links** (also called *symlinks* or *soft links*) were created to overcome the limitations of hard links. A symbolic link is a special file that contains a text pointer to the target file or directory.

Symbolic links can:

- Reference files on other physical devices/partitions
- Reference directories

If the target file is deleted before the symbolic link, the link points to nothing and is called a *broken link*. The `ls -l` command shows symbolic links with an arrow notation (`->`) pointing to the target.

```bash
ls -l fun-sym
# lrwxrwxrwx 1 user user 3 ... fun-sym -> fun
```

When creating symbolic links, relative pathnames are relative to the link's location, not the current working directory:

```bash
ln -s ../fun dir1/fun-sym
# The symlink in dir1 points to ../fun (relative to dir1)
```

### 9. Building a Playground

The chapter provides a complete hands-on walkthrough that demonstrates all commands together:

- Creating a `playground` directory with subdirectories `dir1` and `dir2`
- Copying `/etc/passwd` into the playground
- Using `cp -v` and `cp -i` to observe verbose and interactive behavior
- Renaming files with `mv` and moving them between directories
- Creating hard links and verifying they share the same inode with `ls -li`
- Creating symbolic links and observing the `->` notation
- Removing files and observing link count changes
- Removing the entire playground with `rm -r`

---

## Additional Resources

### Key Commands Summary

Table: The commands covered in this lecture and what each one does

| Command | Purpose |
|---|---|
| `mkdir` | Create one or more directories |
| `cp` | Copy files and directories |
| `mv` | Move or rename files and directories |
| `rm` | Remove files and directories |
| `ln` | Create hard or symbolic links |

### Wildcard Summary

Table: The wildcard characters covered in this lecture and what each one matches

| Pattern | Matches |
|---|---|
| `*` | Any characters (zero or more) |
| `?` | Exactly one character |
| `[chars]` | Any one character in the set |
| `[\!chars]` | Any one character not in the set |
| `[[:class:]]` | Any character in the named class |

### Link Types Summary

Table: Hard links and symbolic links compared feature by feature

| Feature | Hard Link | Symbolic Link |
|---|---|---|
| Created with | `ln file link` | `ln -s item link` |
| Shares inode | Yes | No |
| Spans devices | No | Yes |
| Can link directories | No | Yes |
| Breaks if target deleted | No (data persists until last link removed) | Yes (becomes broken link) |
| Shown by `ls -l` | Indistinguishable from original | Shows `->` to target |

### Tips for Success

1. Always test wildcard patterns with `ls` before using them with destructive commands like `rm`.
2. Use `cp -i`, `mv -i`, and `rm -i` until you are comfortable — interactive mode prevents accidental overwrites and deletions.
3. Use `ls -li` to verify hard links share the same inode number.
4. Remember that symbolic links use paths relative to the link location, not your current directory.
5. Use `cp -r` when copying directories — without it, `cp` refuses to copy directory contents.
6. Prefer character classes (`[[:upper:]]`) over character ranges (`[A-Z]`) for portable wildcard patterns.

### Common Pitfalls

- Accidentally typing `rm * .html` (with a space) instead of `rm *.html` — this deletes everything in the current directory.
- Forgetting `-r` when copying or removing directories — `cp` and `rm` skip directories by default.
- Using `cp` without `-i` and silently overwriting important files.
- Creating symbolic links with absolute paths when relative paths would be more portable, or vice versa.
- Expecting `.*` to match only hidden files — it also matches `.` and `..`, which can cause serious damage with `rm -r`.
