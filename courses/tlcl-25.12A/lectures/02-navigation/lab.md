---
title: 'Navigation: Lab'
subtitle: 'The Linux Command Line — Lecture 2'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir ~/navigation_lab
cd ~/navigation_lab
mkdir -p projects/src projects/doc projects/test
mkdir -p data/2024 data/2025
touch projects/src/main.c projects/src/utils.c
touch projects/doc/readme.txt projects/doc/notes.txt
touch projects/test/test1.sh projects/test/test2.sh
touch data/2024/report.csv data/2025/report.csv
touch .hidden_config .hidden_notes
```

### Exercise 1: Exploring the Current Working Directory (10 minutes)

**Task 1.1**: Display your current working directory

```bash
pwd
```

**Task 1.2**: Change to your home directory and verify

```bash
cd
pwd
```

**Task 1.3**: Change to the lab directory and verify

```bash
cd ~/navigation_lab
pwd
```

**Task 1.4**: Change to the root directory and verify

```bash
cd /
pwd
```

**Questions to answer:**

1. What is the full path of your home directory?
2. What directory does `/` represent?
3. Does typing `cd` by itself take you to a specific directory? Which one?

### Exercise 2: Listing Directory Contents (10 minutes)

**Task 2.1**: List the contents of your lab directory

```bash
cd ~/navigation_lab
ls
```

**Task 2.2**: List a directory without changing into it

```bash
ls /usr
ls /usr/bin
```

**Task 2.3**: List multiple directories at once

```bash
ls ~ /usr
```

**Task 2.4**: List hidden files

```bash
ls -a ~/navigation_lab
```

**Questions to answer:**

1. What files did `ls` display in Task 2.1 compared to `ls -a` in Task 2.4?
2. What do the `.` and `..` entries represent in the `ls -a` output?
3. Can you list a directory's contents without first changing into it?

### Exercise 3: Navigating with Absolute Pathnames (10 minutes)

**Task 3.1**: Navigate to several directories using absolute pathnames

```bash
cd /usr/bin
pwd
```

```bash
cd /usr/local
pwd
```

```bash
cd /var/log
pwd
```

**Task 3.2**: Navigate directly to a deep directory

```bash
cd ~/navigation_lab/projects/src
pwd
```

**Task 3.3**: Return to the lab directory

```bash
cd ~/navigation_lab
pwd
```

**Questions to answer:**

1. What character does every absolute pathname begin with?
2. Does an absolute pathname depend on your current working directory?
3. What is the absolute pathname of your lab directory?

### Exercise 4: Navigating with Relative Pathnames (15 minutes)

**Task 4.1**: Change to the lab directory and navigate down

```bash
cd ~/navigation_lab
cd projects
pwd
```

**Task 4.2**: Navigate up with `..`

```bash
cd ..
pwd
```

**Task 4.3**: Navigate up and then down in one step

```bash
cd ~/navigation_lab/projects/src
cd ../../data
pwd
```

**Task 4.4**: Use `.` to reference the current directory

```bash
cd ~/navigation_lab
cd ./projects/doc
pwd
```

**Task 4.5**: Navigate multiple levels up

```bash
cd ~/navigation_lab/projects/src
cd ../..
pwd
```

**Questions to answer:**

1. What does `..` represent?
2. What is the difference between `cd projects` and `cd ./projects`?
3. If you are in `/usr/local/bin`, what directory does `cd ../..` take you to?

### Exercise 5: Navigation Shortcuts (10 minutes)

**Task 5.1**: Use `cd` with no arguments to go home

```bash
cd /usr/bin
cd
pwd
```

**Task 5.2**: Use `cd -` to return to the previous directory

```bash
cd ~/navigation_lab
cd /var/log
cd -
pwd
```

**Task 5.3**: Use `cd -` to toggle between two directories

```bash
cd ~/navigation_lab
cd /usr/bin
cd -
cd -
cd -
pwd
```

**Task 5.4**: Use tilde expansion to visit another user's home directory

```bash
cd ~root
pwd
cd ~
pwd
```

**Questions to answer:**

1. What does `cd -` do? How is it different from `cd ..`?
2. What happens if you run `cd -` multiple times in a row?
3. What does `cd ~` do? Is it different from `cd` with no arguments?

### Exercise 6: Exploring the Linux File System Tree (15 minutes)

**Task 6.1**: Explore the root directory

```bash
cd /
ls
```

**Task 6.2**: List important top-level directories

```bash
ls /bin
ls /etc
ls /home
ls /usr
ls /var
```

**Task 6.3**: Explore nested directories

```bash
ls /usr/bin
ls /usr/local
ls /var/log
```

**Task 6.4**: Compare listing styles

```bash
cd /usr
ls
ls -l
```

**Questions to answer:**

1. What kinds of files are found in `/bin`?
2. What is stored in `/etc`?
3. Where are user home directories located?

### Exercise 7: Working with Hidden Files (10 minutes)

**Task 7.1**: List only visible files in the lab directory

```bash
cd ~/navigation_lab
ls
```

**Task 7.2**: List all files including hidden ones

```bash
ls -a
```

**Task 7.3**: List hidden files in your home directory

```bash
ls -a ~
```

**Task 7.4**: Navigate to a directory and check for hidden files

```bash
cd ~/navigation_lab/projects
ls -a
```

**Questions to answer:**

1. What makes a file "hidden" in Linux?
2. What flag do you add to `ls` to see hidden files?
3. Are `.` and `..` real directories or special entries?

### Exercise 8: Combining Navigation Techniques (10 minutes)

**Task 8.1**: Starting from your home directory, navigate to the lab test directory using only relative pathnames

```bash
cd ~
cd navigation_lab/projects/test
pwd
```

**Task 8.2**: From the test directory, navigate to the data/2025 directory using a relative path

```bash
cd ../../data/2025
pwd
```

**Task 8.3**: Use an absolute pathname to jump directly to the projects/doc directory

```bash
cd ~/navigation_lab/projects/doc
pwd
```

**Task 8.4**: Return home with the shortcut, then verify

```bash
cd
pwd
ls ~/navigation_lab/projects
```

**Questions to answer:**

1. When is a relative pathname more convenient than an absolute pathname?
2. When might an absolute pathname be the better choice?

### Lab Cleanup

```bash
rm -rf ~/navigation_lab
```

---

## Challenge Section

**Challenge 1: Explain the File System Tree**

In your own words, describe how the Linux file system is organized. How does it differ from the Windows approach to managing multiple storage devices? Use the term "mount" in your explanation.

**Challenge 2: Predict the Output**

You are logged in as user `me` and your home directory is `/home/me`. What will `pwd` display after each sequence of commands? Write your answers before running them.

```bash
cd /usr/local/bin
cd ..
pwd
```

```bash
cd /var/log
cd ../..
pwd
```

```bash
cd ~/Documents
cd -
pwd
```

**Challenge 3: Absolute vs. Relative**

You are currently in `/usr/local/share`. Write both an absolute pathname and a relative pathname that will take you to `/usr/bin`.

**Challenge 4: True or False**

1. The root directory is the home directory of the root user.
2. Every absolute pathname begins with `/`.
3. The command `cd` with no arguments changes to the root directory.
4. The `.` notation refers to the parent directory.
5. Hidden files in Linux begin with a period character.
6. Linux determines a file's type by its file extension.

**Challenge 5: Navigation Shortcuts**

Match each shortcut on the left with its behavior on the right:

| Shortcut | Behavior |
|----------|----------|
| `cd` | A. Changes to the home directory of *user_name* |
| `cd -` | B. Changes to the current user's home directory |
| `cd ~user_name` | C. Changes to the previous working directory |

**Challenge 6: Debugging a Navigation Session**

A student types the following commands and gets an error. Identify the problem and provide a corrected command.

```bash
pwd
# /home/student
cd usr/bin
# bash: cd: usr/bin: No such file or directory
```

**Challenge 7: Trace the Path**

Starting from `/home/me`, trace through each command below and state the current working directory after each step:

```bash
cd /usr/local
cd bin
cd ../share
cd ../../var
cd log
cd ~
```

**Challenge 8: Hidden Files Investigation**

Explain why typing `ls` in your home directory shows fewer files than `ls -a`. What naming convention causes files to be hidden? Give an example of a commonly hidden file found in a user's home directory and explain its purpose.

**Challenge 9: File Naming Rules**

A student wants to create the following files. For each one, state whether the filename follows Linux best practices and explain why or why not:

1. `My Report.txt`
2. `my-report.txt`
3. `my_report.txt`
4. `.config`
5. `MyReport.TXT`

**Challenge 10: Practical Navigation Scenario**

You are a system administrator and need to perform the following tasks. Write the `cd` command you would use for each step. You start in `/home/admin`.

1. Check the system log files (located in `/var/log`)
2. Return to your home directory
3. Go back to the log directory (using the shortest possible command)
4. Navigate up to `/var`
5. Move into `/var/spool` using a relative pathname
6. Return home

**Challenge 11: Explain the Difference**

Explain the difference between each pair:

1. `cd /usr` vs. `cd usr`
2. `cd ..` vs. `cd -`
3. `cd ~` vs. `cd ~root`
4. `ls` vs. `ls -a`

**Challenge 12: Putting It All Together**

A project has the following directory structure:

```
/home/student/
  project/
    src/
    doc/
    test/
    .git/
```

You are currently in `/home/student/project/src`. Write the commands to:

1. List all files in the project directory (including hidden ones) without leaving `src`
2. Change to the `doc` directory using a relative pathname
3. Change to the `.git` directory using a relative pathname from `doc`
4. Return to your home directory with a single command

---
