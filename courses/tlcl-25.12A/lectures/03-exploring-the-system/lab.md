---
title: 'Exploring the System: Lab'
subtitle: 'The Linux Command Line — Lecture 3'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir ~/exploring_lab
cd ~/exploring_lab
mkdir -p project/{src,docs,tests}
touch project/src/main.c project/src/utils.c
touch project/docs/readme.txt project/docs/license.txt
touch project/tests/test1.sh project/tests/test2.sh
echo "This is a sample text file." > sample.txt
echo "#\!/bin/bash" > script.sh
echo "echo Hello" >> script.sh
chmod +x script.sh
cp /etc/passwd passwd_copy.txt
```

### Exercise 1: Exploring ls Basics (10 minutes)

**Task 1.1**: List the contents of your lab directory

```bash
cd ~/exploring_lab
ls
```

**Task 1.2**: List multiple directories at once

```bash
ls ~ /usr
```

**Task 1.3**: List just the `/etc` directory

```bash
ls /etc
```

**Task 1.4**: List the lab directory with the classify option

```bash
ls -F ~/exploring_lab
```

**Questions to answer:**

1. When you listed multiple directories, how did `ls` separate the output from each directory?
2. What indicator character did `-F` append to directories? What about executable files?

### Exercise 2: Options and Arguments (10 minutes)

**Task 2.1**: Compare short and long options

```bash
ls -a ~/exploring_lab
ls --all ~/exploring_lab
```

**Task 2.2**: Combine multiple short options

```bash
ls -la ~/exploring_lab
ls -lah ~/exploring_lab
```

**Task 2.3**: Sort by time with reversed order

```bash
ls -lt ~/exploring_lab
ls -lt --reverse ~/exploring_lab
```

**Task 2.4**: Sort by file size

```bash
ls -lS /usr/bin | head -10
```

**Questions to answer:**

1. Did `-a` and `--all` produce the same output?
2. When you combined `-l`, `-a`, and `-h`, what changed compared to using `-la` alone?
3. What is the difference between `-lt` and `-lt --reverse`?

### Exercise 3: Understanding Long Format (15 minutes)

**Task 3.1**: Examine long-format output

```bash
ls -l ~/exploring_lab
```

**Task 3.2**: Identify each field in the output

Pick one line from the output and identify: file type indicator, permissions, hard link count, owner, group, size, date, and name.

**Task 3.3**: Compare sizes with human-readable format

```bash
ls -l /usr/bin | head -10
ls -lh /usr/bin | head -10
```

**Task 3.4**: List only a directory itself (not its contents)

```bash
ls -ld ~/exploring_lab/project
```

**Questions to answer:**

1. What does the first character of the permissions field tell you?
2. What is the difference between `ls -l project` and `ls -ld project`?
3. How does the `-h` option change the size column?

### Exercise 4: Determining File Types (10 minutes)

**Task 4.1**: Use `file` on different types of files

```bash
cd ~/exploring_lab
file sample.txt
file script.sh
file project
```

**Task 4.2**: Check system files of various types

```bash
file /etc/passwd
file /bin/ls
file /dev/null
```

**Task 4.3**: Check multiple files at once

```bash
file project/src/*
file project/docs/*
```

**Questions to answer:**

1. How did the output differ between the text file, the script, the directory, and the binary?
2. Does `file` rely on the file extension to determine type? How can you tell?

### Exercise 5: Viewing Files with less (15 minutes)

**Task 5.1**: View a text file with `less`

```bash
less passwd_copy.txt
```

While in `less`, practice the following:
- Press Space to move forward one page
- Press `b` to move back one page
- Press `G` to go to the end of the file
- Press `g` to go to the beginning

**Task 5.2**: Search within `less`

```bash
less /etc/services
```

While viewing:
- Type `/http` to search for "http"
- Press `n` to find the next match
- Press `q` to quit

**Task 5.3**: Try viewing a non-text file

```bash
file /bin/ls
less /bin/ls
```

If the terminal becomes scrambled, press `q` to quit `less`, then type `reset` and press Enter.

**Questions to answer:**

1. What key do you press to quit `less`?
2. How do you search for text within `less`?
3. What happens when you try to view a binary file with `less`?

### Exercise 6: Exploring the Filesystem Hierarchy (15 minutes)

**Task 6.1**: Explore the root directory

```bash
ls -l /
```

**Task 6.2**: Examine `/etc` for configuration files

```bash
ls /etc | head -20
file /etc/fstab
file /etc/passwd
```

**Task 6.3**: Explore `/var/log` for log files

```bash
ls -l /var/log
```

**Task 6.4**: Examine `/usr` and its subdirectories

```bash
ls /usr
ls /usr/bin | wc -l
ls /usr/share | head -20
```

**Task 6.5**: Compare `/bin` and `/usr/bin`

```bash
ls -ld /bin
file /bin
```

**Questions to answer:**

1. What type of files are stored in `/etc`?
2. Approximately how many programs are in `/usr/bin`?
3. On your system, is `/bin` a regular directory or a symbolic link? What does it point to?

### Exercise 7: Symbolic Links (10 minutes)

**Task 7.1**: Find symbolic links on the system

```bash
ls -l /usr/bin | head -30
```

Look for entries that begin with `l` in the permissions field and show `->` pointing to a target.

**Task 7.2**: Create a symbolic link

```bash
cd ~/exploring_lab
ln -s sample.txt sample_link.txt
ls -l sample_link.txt
```

**Task 7.3**: Verify the link works

```bash
cat sample_link.txt
file sample_link.txt
```

**Task 7.4**: Examine system symbolic links

```bash
ls -la /bin
ls -la /lib
```

**Questions to answer:**

1. How can you tell from `ls -l` output that a file is a symbolic link?
2. When you used `cat` on the symbolic link, what content was displayed?
3. What did `file` report about the symbolic link?

### Exercise 8: Putting It All Together (10 minutes)

**Task 8.1**: Use the guided tour method to explore `/etc`

```bash
cd /etc
ls -l | head -20
file hostname
less hostname
```

**Task 8.2**: Find the largest files in `/usr/bin`

```bash
ls -lhS /usr/bin | head -10
```

**Task 8.3**: Identify hidden files in your home directory

```bash
ls -la ~ | head -20
ls -a ~ | head -20
```

**Task 8.4**: Combine `file` with output from `ls`

```bash
ls /etc/*.conf 2>/dev/null | head -5
file /etc/*.conf 2>/dev/null | head -5
```

**Questions to answer:**

1. What type of file is `/etc/hostname`?
2. Were there any hidden files in your home directory? How can you identify them?

### Lab Cleanup

```bash
rm -rf ~/exploring_lab
```

---

## Challenge Section

**Challenge 1: Explain the Command Structure**

In your own words, describe the general pattern that Linux commands follow. Give three examples of commands using different combinations of options and arguments.

**Challenge 2: Predict the Output**

What will each of these commands display? Write your answers before running them.

```bash
ls -ld /etc
ls -l /etc | head -5
ls -lh /usr/bin/python3
```

**Challenge 3: Interpret Long Format**

Given the following `ls -l` output, answer the questions below:

```
drwxr-xr-x 2 alice staff 4096 2025-11-15 09:30 reports
-rw-r--r-- 1 alice staff 8234 2025-11-14 14:22 data.csv
lrwxrwxrwx 1 alice staff    8 2025-11-15 09:31 latest -> data.csv
```

1. Which entry is a directory? How can you tell?
2. Which entry is a symbolic link? What file does it point to?
3. Who is the owner of these files?
4. How many hard links does the directory have?

**Challenge 4: True or False**

1. The `-a` option to `ls` shows hidden files.
2. The `file` command determines file type by looking at the file extension.
3. The `less` command allows you to edit files.
4. The `/etc` directory contains user home directories.
5. A symbolic link is identified by the letter `l` in the first position of the permissions field.
6. Short options to commands can be combined (e.g., `-la`).

**Challenge 5: File Type Investigation**

Use the `file` command to identify the type of each of the following. Write down what you expect before running the commands:

```bash
file /etc/hosts
file /dev/null
file /usr/bin/env
file /etc
```

**Challenge 6: less Navigation Challenge**

Open `/etc/services` with `less` and answer these questions:

1. How do you jump to the very end of the file?
2. How do you search for the word "ssh"?
3. How do you find the next occurrence of the same search term?
4. What key returns you to the beginning of the file?

**Challenge 7: Filesystem Hierarchy**

Match each directory to its purpose:

Table: Standard directories from this lecture next to a scrambled list of purposes to match them to

| Directory | Purpose |
|-----------|---------|
| `/var/log` | a. Home directory for the root user |
| `/etc` | b. Removable media mount points |
| `/tmp` | c. Log files |
| `/root` | d. System-wide configuration files |
| `/media` | e. Temporary files |

**Challenge 8: Debugging a Command**

A student runs the following command and is confused by the output. Explain what went wrong and provide the corrected command.

The student wants to see the long listing of the `/etc` directory itself (not its contents):

```bash
ls -l /etc
```

**Challenge 9: Symbolic Link Scenario**

A program requires a library file named `libapp.so`. The actual file on disk is `libapp.so.2.1`. Explain how you would use a symbolic link to satisfy the program's requirement. Write the exact command you would use.

**Challenge 10: Guided Exploration**

Pick a directory from the filesystem hierarchy table that you have not explored before. Use the guided tour method (cd, ls -l, file, less) to explore it. Write a brief paragraph describing:

1. What directory you chose
2. What types of files it contains
3. The most interesting file you found and what `file` reported about it

**Challenge 11: Combining Options**

Write a single `ls` command that:

1. Shows hidden files
2. Uses long format
3. Displays human-readable sizes
4. Sorts by modification time with the newest file last

**Challenge 12: Compare and Contrast**

Explain the difference between each pair:

1. `ls /etc` vs. `ls -d /etc`
2. `file document.txt` vs. `less document.txt`
3. A symbolic link vs. a hard link (based on what this chapter describes)

---
