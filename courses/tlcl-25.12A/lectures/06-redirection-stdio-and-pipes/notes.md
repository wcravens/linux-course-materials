---
title: 'Redirection'
subtitle: 'The Linux Command Line — Lecture 6'
---

## Learning Objectives

After completing this chapter, you will be able to:

- Explain standard input, standard output, and standard error (the three STDIO streams)
- Use redirection operators to send command output to files and read input from files
- Redirect standard error separately from standard output
- Chain commands together using pipes to build processing pipelines
- Apply common filter commands (`grep`, `sort`, `uniq`, `cut`, `head`, `tail`, `wc`, `tee`, `tr`) to process text data
- Archive and compress files using `tar` and `gzip`

## Key Commands Covered

- `cat` — Concatenate files and print to standard output
- `sort` — Sort lines of text files
- `uniq` — Report or omit repeated lines
- `grep` — Print lines that match a pattern
- `wc` — Print newline, word, and byte counts for each file
- `head` — Output the first part of files
- `tail` — Output the last part of files
- `tee` — Read from standard input and write to standard output and files
- `cut` — Remove sections from each line of files
- `tr` — Translate or delete characters
- `paste` — Merge lines of files
- `du` — Estimate file space usage
- `gzip` / `gunzip` — Compress or expand files
- `zcat` — View compressed files without decompressing
- `tar` — Store and extract files from a tape archive

---

## Chapter Outline

### 1. Standard Input, Output, and Error

Many command-line programs produce output of some kind. This output often consists of two types: the program's results (sent to *standard output*, or stdout) and status and error messages (sent to *standard error*, or stderr). By default, both stdout and stderr are linked to the screen and not saved to a file.

In addition, many programs take input from *standard input* (stdin), which is by default attached to the keyboard.

I/O redirection allows us to change where output goes and where input comes from. These three streams are represented by **file descriptors**:

| File Descriptor | Name | Default Destination |
|-----------------|------|---------------------|
| 0 | stdin | Keyboard |
| 1 | stdout | Screen |
| 2 | stderr | Screen |

### 2. Redirecting Standard Output

The `>` redirection operator, followed by a filename, redirects stdout to that file instead of the screen. The file is created if it does not exist, or truncated (overwritten) if it does:

```bash
ls -l /usr/bin > ls-output.txt
```

If a command produces no output (or fails), the destination file is still created or truncated to zero length. This is a common trick for truncating a file:

```bash
> ls-output.txt
```

To **append** redirected output to a file instead of overwriting it, use `>>`:

```bash
ls -l /usr/bin >> ls-output.txt
```

### 3. Redirecting Standard Error

Redirecting stderr requires referring to its file descriptor. The `2>` operator redirects stderr:

```bash
ls -l /bin/usr 2> ls-error.txt
```

### 4. Redirecting Standard Output and Standard Error to One File

There are two methods for capturing both stdout and stderr in a single file.

The traditional method redirects both file descriptors explicitly:

```bash
ls -l /bin/usr > ls-output.txt 2>&1
```

The notation `2>&1` redirects file descriptor 2 (stderr) to file descriptor 1 (stdout), which has already been redirected to the file. The order matters — the redirection of stderr must always occur *after* the redirection of stdout.

The modern, streamlined method uses `&>`:

```bash
ls -l /bin/usr &> ls-output.txt
```

To append both streams to a file:

```bash
ls -l /bin/usr &>> ls-output.txt
```

### 5. Disposing of Unwanted Output

The special file `/dev/null` (sometimes called the *bit bucket*) accepts input and does nothing with it. It is used to suppress output:

```bash
ls -l /bin/usr 2> /dev/null
```

### 6. Redirecting Standard Input

The `cat` command reads one or more files and copies them to stdout. It can be used to display files, and when given no arguments it reads from stdin:

```bash
cat
# Reads from keyboard until Ctrl-d (EOF)
```

```bash
cat < lazy_dog.txt
# Reads from file via input redirection
```

### 7. Pipelines

The pipe operator (`|`) connects the stdout of one command to the stdin of the next, forming a pipeline:

```bash
command1 | command2
```

```bash
ls -l /usr/bin | less
```

Data flows left to right through the pipeline. Each command runs simultaneously, processing data in real time.

**Difference between `>` and `|`:**

The redirection operator `>` connects a command with a file, while the pipe operator `|` connects the output of one command with the input of another command. Accidentally using `>` when you mean `|` can overwrite files.

### 8. Filters

Pipelines are often used with *filters* — commands that accept stdin, transform the data, and output the result to stdout.

**`sort`** — Sort lines of text:

```bash
ls /bin /usr/bin | sort | less
```

**`uniq`** — Remove adjacent duplicate lines (input must be sorted first):

```bash
ls /bin /usr/bin | sort | uniq | less
```

```bash
ls /bin /usr/bin | sort | uniq -d | less
# Show only duplicates
```

**`wc`** — Count lines, words, and bytes:

```bash
wc ls-output.txt
# 7902 64566 503634 ls-output.txt
```

```bash
ls /bin /usr/bin | sort | uniq | wc -l
# Count of unique programs
```

**`grep`** — Print lines matching a pattern:

```bash
grep pattern [file...]
```

```bash
ls /bin /usr/bin | sort | uniq | grep zip
```

Useful options: `-i` (case-insensitive), `-v` (invert match, print non-matching lines).

**`head` / `tail`** — Print the first or last lines of a file:

```bash
head -n 5 ls-output.txt
tail -n 5 ls-output.txt
```

The `tail` command has a `-f` option that monitors a file in real time, useful for watching log files:

```bash
tail -f /var/log/syslog
```

### 9. tee — Read from Stdin and Output to Stdout and Files

The `tee` command reads stdin and copies it to both stdout and one or more files. This is useful for capturing intermediate data in a pipeline:

```bash
ls /usr/bin | tee ls.txt | grep zip
```

### 10. Archiving and Compression

**`gzip` / `gunzip`** — Compress or decompress files:

```bash
gzip file.txt           # Compresses to file.txt.gz, removes original
gunzip file.txt.gz      # Decompresses, removes .gz file
```

```bash
zcat file.txt.gz        # View compressed file without decompressing
```

**`tar`** — Create or extract archive files:

```bash
tar -czf archive.tar.gz directory/    # Create compressed archive
tar -xzf archive.tar.gz               # Extract compressed archive
tar -tzf archive.tar.gz               # List contents without extracting
```

Common `tar` options:

| Flag | Meaning |
|------|---------|
| `-c` | Create archive |
| `-x` | Extract archive |
| `-z` | Use gzip compression |
| `-j` | Use bzip2 compression |
| `-f` | Specify filename |
| `-v` | Verbose output |
| `-t` | List contents |

---

## Additional Resources

### Key Commands Summary

| Command | Purpose |
|---------|---------|
| `cat` | Concatenate files and print to stdout |
| `sort` | Sort lines of text |
| `uniq` | Report or omit repeated lines |
| `grep` | Print lines matching a pattern |
| `wc` | Count lines, words, and bytes |
| `head` | Output the first part of files |
| `tail` | Output the last part of files |
| `tee` | Copy stdin to stdout and files |
| `cut` | Extract fields from each line |
| `tr` | Translate or delete characters |
| `du` | Estimate file space usage |
| `gzip` / `gunzip` | Compress or decompress files |
| `zcat` | View compressed files |
| `tar` | Create or extract archive files |

### Redirection Operators Summary

| Operator | Description | Example |
|----------|-------------|---------|
| `>` | Redirect stdout (overwrite) | `ls > file.txt` |
| `>>` | Redirect stdout (append) | `echo "text" >> file.txt` |
| `<` | Redirect stdin | `sort < file.txt` |
| `2>` | Redirect stderr | `cmd 2> errors.txt` |
| `&>` | Redirect stdout and stderr | `cmd &> all.txt` |
| `2>&1` | Redirect stderr to stdout | `cmd > file.txt 2>&1` |
| `\|` | Pipe stdout to next command | `ls \| grep ".txt"` |

### File Descriptors Summary

| FD | Name | Default | Redirect With |
|----|------|---------|---------------|
| 0 | stdin | Keyboard | `<` |
| 1 | stdout | Screen | `>` or `1>` |
| 2 | stderr | Screen | `2>` |

### Tips for Success

1. Use `>` to overwrite and `>>` to append — mixing them up can destroy data.
2. Always place `2>&1` *after* the stdout redirection, or stderr will not follow stdout to the file.
3. Use `/dev/null` to silence error messages you do not need.
4. Remember that `uniq` only removes *adjacent* duplicates — always `sort` first.
5. Build complex pipelines incrementally — start with one command and add stages one at a time, verifying output at each step.
6. Use `tee` when you need to inspect intermediate results in a pipeline without breaking the data flow.

### Common Pitfalls

- Using `>` when you meant `>>` — this overwrites the file, losing all previous content.
- Using `>` when you meant `|` — for example, `ls > less` creates a file called `less` instead of piping output to the `less` command.
- Forgetting `2>` for stderr — plain `>` only redirects stdout, so error messages still appear on screen.
- Using `uniq` without `sort` — duplicate lines that are not adjacent will not be removed.
- Placing `2>&1` before the stdout redirection — stderr will go to the screen, not the file.
