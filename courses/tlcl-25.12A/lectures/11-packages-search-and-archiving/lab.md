---
title: 'Packages, Search, and Archiving: Lab'
subtitle: 'The Linux Command Line — Lecture 11'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir -p ~/chapters_lab/project/{src,doc,test}
cd ~/chapters_lab
echo "This is a sample configuration file with many lines." > config.txt
ls -l /etc > etc_listing.txt
ls -l /usr/bin > bin_listing.txt
for i in {1..5}; do echo "Log entry $i: $(date)" >> app.log; done
touch -t 202301010000 old_file.txt
touch new_file.txt
mkdir -p ~/chapters_lab/playground/dir-{001..020}
touch ~/chapters_lab/playground/dir-{001..020}/file-{A..E}
```

### Exercise 1: Exploring Package Management (10 minutes)

**Task 1.1**: Search for a package in the repository.

```bash
apt search "text editor" 2>/dev/null | head -20
```

**Task 1.2**: Display information about an installed package.

```bash
dpkg -s coreutils
```

**Task 1.3**: Find which package installed a specific file.

```bash
dpkg -S /usr/bin/ls
```

**Task 1.4**: List all installed packages and count them.

```bash
dpkg -l | tail -n +6 | wc -l
```

**Questions to answer:**

1. What information does `dpkg -s` display about a package?
2. Which package is responsible for providing `/usr/bin/ls`?
3. Approximately how many packages are installed on your system?

### Exercise 2: Using locate (10 minutes)

**Task 2.1**: Search for files containing "passwd" in their path.

```bash
locate passwd | head -15
```

**Task 2.2**: Narrow the search using `grep`.

```bash
locate passwd | grep '/etc/'
```

**Task 2.3**: Search for files related to "zip".

```bash
locate bin/zip
```

**Task 2.4**: Count how many paths match "bash".

```bash
locate bash | wc -l
```

**Questions to answer:**

1. Does `locate` search the file system directly or a database? What command updates that database?
2. Why might a recently created file not appear in `locate` results?
3. How can you combine `locate` with other commands for more specific searches?

### Exercise 3: Basic find Usage (10 minutes)

**Task 3.1**: Find all directories in the playground.

```bash
cd ~/chapters_lab
find playground -type d | head -15
find playground -type d | wc -l
```

**Task 3.2**: Find all regular files named "file-A".

```bash
find playground -type f -name 'file-A'
find playground -type f -name 'file-A' | wc -l
```

**Task 3.3**: Find files by size in `/usr/bin`.

```bash
find /usr/bin -type f -size +1M 2>/dev/null | head -10
```

**Task 3.4**: Use `stat` to examine file details.

```bash
stat new_file.txt
stat old_file.txt
```

**Questions to answer:**

1. How many directories are in the playground?
2. How many files named "file-A" did `find` locate?
3. What is the difference between the modification times shown by `stat` for `old_file.txt` and `new_file.txt`?

### Exercise 4: find with Tests and Operators (15 minutes)

**Task 4.1**: Find files modified more recently than `old_file.txt`.

```bash
cd ~/chapters_lab
find . -type f -newer old_file.txt
```

**Task 4.2**: Find empty files in the playground.

```bash
find playground -type f -empty | wc -l
```

**Task 4.3**: Combine tests with operators.

```bash
find playground \( -name 'file-A' -or -name 'file-B' \) | wc -l
```

**Task 4.4**: Use the `-not` operator.

```bash
find playground -type f -not -name 'file-A' | wc -l
```

**Questions to answer:**

1. How many files are newer than `old_file.txt`?
2. Why are the playground files empty?
3. What does the `-not` operator do to a test?

### Exercise 5: find Actions and xargs (10 minutes)

**Task 5.1**: Use the `-ls` action for detailed output.

```bash
cd ~/chapters_lab
find playground -name 'file-A' -ls | head -5
```

**Task 5.2**: Use `-exec` to run a command on each result.

```bash
find playground -name 'file-C' -exec ls -l '{}' ';' | head -5
```

**Task 5.3**: Use `+` for efficient batch execution.

```bash
find playground -name 'file-C' -exec ls -l '{}' + | head -5
```

**Task 5.4**: Use `xargs` with a pipe.

```bash
find playground -name 'file-D' -print | xargs ls -l | head -5
```

**Questions to answer:**

1. What is the difference between ending `-exec` with `';'` versus `+`?
2. How does `xargs` receive its input?
3. Why might the `+` form be more efficient than `';'`?

### Exercise 6: Compressing Files (10 minutes)

**Task 6.1**: Compress a file with `gzip` and examine the result.

```bash
cd ~/chapters_lab
cp etc_listing.txt gzip_test.txt
ls -l gzip_test.txt
gzip gzip_test.txt
ls -l gzip_test.txt.gz
```

**Task 6.2**: View and restore the compressed file.

```bash
zcat gzip_test.txt.gz | head -5
gunzip gzip_test.txt.gz
ls -l gzip_test.txt
```

**Task 6.3**: Compress with `bzip2` and compare.

```bash
cp etc_listing.txt bzip2_test.txt
gzip -k etc_listing.txt
bzip2 bzip2_test.txt
ls -l etc_listing.txt.gz bzip2_test.txt.bz2
```

**Questions to answer:**

1. What happened to the original file after running `gzip`?
2. Which produced a smaller compressed file, `gzip` or `bzip2`?
3. What does the `zcat` command do?

### Exercise 7: Creating and Extracting tar Archives (15 minutes)

**Task 7.1**: Create a tar archive of the playground.

```bash
cd ~/chapters_lab
tar cf playground.tar playground
ls -l playground.tar
```

**Task 7.2**: List the contents of the archive.

```bash
tar tf playground.tar | head -15
```

**Task 7.3**: Create a gzip-compressed tar archive.

```bash
tar czf playground.tar.gz playground
ls -l playground.tar playground.tar.gz
```

**Task 7.4**: Extract the archive to a new location.

```bash
mkdir ~/chapters_lab/extract_test
cd ~/chapters_lab/extract_test
tar xzf ../playground.tar.gz
ls
ls playground/dir-001/
```

**Task 7.5**: Use `find` with `tar` to create a selective archive.

```bash
cd ~/chapters_lab
find playground -name 'file-A' | tar czf file-A-only.tar.gz -T -
tar tzf file-A-only.tar.gz | wc -l
```

**Questions to answer:**

1. How much smaller is the `.tar.gz` file compared to the `.tar` file?
2. What does the `-T -` option tell `tar`?
3. How many files are in the selective archive?

### Exercise 8: rsync Basics (10 minutes)

**Task 8.1**: Synchronize the playground to a backup directory.

```bash
cd ~/chapters_lab
mkdir backup
rsync -av playground backup
```

**Task 8.2**: Run rsync again without changes and observe.

```bash
rsync -av playground backup
```

**Task 8.3**: Make a change and sync again.

```bash
touch playground/dir-010/file-A
rsync -av playground backup
```

**Task 8.4**: Test the trailing slash behavior.

```bash
mkdir backup2
rsync -av playground/ backup2
ls backup/
ls backup2/
```

**Questions to answer:**

1. What did `rsync` copy on the second run (Task 8.2)? Why?
2. What did `rsync` copy on the third run (Task 8.3)?
3. What is the difference in the destination between `playground` and `playground/` as the source?

### Lab Cleanup

```bash
rm -rf ~/chapters_lab
```

---

## Challenge Section

**Challenge 1: Package Management Concepts**

In your own words, explain the difference between a high-level package tool (like `apt`) and a low-level package tool (like `dpkg`). Why would you prefer one over the other for installing software?

**Challenge 2: Predict the Output**

What will each of these commands display or do? Write your answers before running them.

```bash
dpkg -S /usr/bin/whoami
locate -c passwd
find /tmp -maxdepth 1 -type f -empty
```

**Challenge 3: True or False**

Mark each statement as true or false and provide a brief justification.

1. The `locate` command searches the file system in real time.
2. The `find` command's `-and` operator is implied by default between tests.
3. `gzip` preserves the original file by default when compressing.
4. `tar czf` creates a bzip2-compressed archive.
5. `rsync` copies all files every time it runs, even if nothing has changed.

**Challenge 4: Debugging a find Command**

A student wants to find all `.log` files larger than 100 kilobytes in `/var/log`, but their command produces an error. Identify the problem and provide a corrected version.

```bash
find /var/log -name *.log -size +100k -type f
```

**Challenge 5: Practical find Challenge**

Write a single `find` command that locates all regular files in your home directory that:
- Are larger than 10 kilobytes
- Were modified in the last 7 days
- Have names ending in `.txt`

**Challenge 6: Compression Comparison**

Given a file named `data.txt`, write the commands to:

1. Create a gzip-compressed copy named `data.txt.gz` (keeping the original)
2. Create a bzip2-compressed copy named `data.txt.bz2` (keeping the original)
3. Compare the sizes of all three files using `ls -l`

**Challenge 7: tar Archive Challenge**

Write a command that uses `find` and `tar` together to create a gzip-compressed archive named `recent_docs.tar.gz` containing only `.txt` files from your home directory that were modified in the last 30 days.

**Challenge 8: rsync Scenarios**

Explain the difference between these two commands:

```bash
rsync -av /home/user/Documents /backup/
rsync -av /home/user/Documents/ /backup/
```

What would the resulting directory structure look like in `/backup/` for each?

**Challenge 9: Package Investigation**

Write the commands to answer these questions about your system (use Debian/Ubuntu tools):

1. How many packages are currently installed?
2. What package provides the `find` command?
3. What is the description of the `coreutils` package?

**Challenge 10: Putting It All Together**

You need to create a backup of all `.conf` files in `/etc` that have been modified in the last 30 days. Write a sequence of commands that:

1. Uses `find` to locate the relevant files
2. Creates a gzip-compressed tar archive named `etc-conf-backup.tar.gz` containing only those files
3. Uses `rsync` to copy the archive to a directory named `~/backups/`
4. Verifies the archive contents with `tar tzf`

---
