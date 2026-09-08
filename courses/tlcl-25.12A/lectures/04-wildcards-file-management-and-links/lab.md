---
title: 'Files and Directories: Lab'
subtitle: 'The Linux Command Line — Lecture 4'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir ~/playground
cd ~/playground
mkdir dir1 dir2
cp /etc/passwd .
touch report.txt data.csv notes.txt backup.log
mkdir -p projects/alpha projects/beta
touch projects/alpha/file1.txt projects/alpha/file2.txt
touch projects/beta/file3.txt projects/beta/file4.txt
touch .hidden1 .hidden2 .config
```

### Exercise 1: Exploring Wildcards (10 minutes)

**Task 1.1**: Use wildcard patterns to list files

```bash
cd ~/playground
ls *
ls *.txt
ls *.???
```

**Task 1.2**: Use the `?` wildcard

```bash
ls ????.txt
ls ????.???
```

**Task 1.3**: Use character set wildcards

```bash
ls [dn]*
ls [\!rp]*
```

**Task 1.4**: Use character class wildcards

```bash
ls [[:lower:]]*
ls *[[:digit:]]*
```

**Questions to answer:**

1. How many files does `*.txt` match?
2. What is the difference between `*` and `?` as wildcards?
3. What does `[\!rp]*` match — files that start with `r` or `p`, or files that do not?

### Exercise 2: Wildcards with Hidden Files (10 minutes)

**Task 2.1**: Try to list hidden files with a plain wildcard

```bash
cd ~/playground
echo *
```

**Task 2.2**: List hidden files with the dot pattern

```bash
echo .*
```

**Task 2.3**: Exclude `.` and `..` from the listing

```bash
ls -d .[\!.]*
```

**Task 2.4**: List everything (visible and hidden) safely

```bash
ls -d * .[\!.]*
```

**Questions to answer:**

1. Did `echo *` include `.hidden1`, `.hidden2`, or `.config`?
2. Why is it important to exclude `.` and `..` when using dot patterns with commands like `rm`?

### Exercise 3: Creating Directories with mkdir (10 minutes)

**Task 3.1**: Create multiple directories in one command

```bash
cd ~/playground
mkdir test1 test2 test3
ls -d test*
```

**Task 3.2**: Create a nested directory structure

```bash
mkdir -p levels/level1/level2/level3
ls -R levels/
```

**Task 3.3**: Combine `mkdir` with wildcards to verify results

```bash
ls -d test? levels
```

**Questions to answer:**

1. What does the `-p` option do for `mkdir`?
2. What happens if you try `mkdir levels/level1/level2/level3` without `-p` when `levels` does not exist?

### Exercise 4: Copying Files and Directories (15 minutes)

**Task 4.1**: Copy a single file

```bash
cd ~/playground
cp passwd passwd.bak
ls -l passwd passwd.bak
```

**Task 4.2**: Copy with verbose output

```bash
cp -v report.txt report_copy.txt
```

**Task 4.3**: Copy with interactive prompting

```bash
cp -i passwd passwd.bak
# Respond n to keep the existing file
```

**Task 4.4**: Copy multiple files into a directory

```bash
cp report.txt data.csv notes.txt dir1/
ls dir1/
```

**Task 4.5**: Copy an entire directory recursively

```bash
cp -r projects/ dir2/projects_backup/
ls -R dir2/projects_backup/
```

**Questions to answer:**

1. What happens if you omit `-r` when trying to copy a directory?
2. Why is `cp -i` recommended for beginners?
3. When you copied files to `dir1/`, were the originals removed?

### Exercise 5: Moving and Renaming Files (10 minutes)

**Task 5.1**: Rename a file with `mv`

```bash
cd ~/playground
mv passwd.bak old_passwd
ls old_passwd
```

**Task 5.2**: Move a file into a directory

```bash
mv old_passwd dir1/
ls dir1/
```

**Task 5.3**: Move the file back and rename it in one step

```bash
mv dir1/old_passwd restored_passwd
ls restored_passwd
```

**Task 5.4**: Move multiple files into a directory

```bash
mv backup.log data.csv dir2/
ls dir2/
```

**Questions to answer:**

1. How does `mv` decide whether to rename or move a file?
2. What happens if the destination file already exists and you do not use `-i`?

### Exercise 6: Removing Files and Directories (10 minutes)

**Task 6.1**: Remove a single file with prompting

```bash
cd ~/playground
rm -i restored_passwd
# Respond y to delete
```

**Task 6.2**: Test a wildcard pattern with `ls` before removing

```bash
ls test*
rm -v test1 test2 test3
```

**Task 6.3**: Remove a directory and its contents

```bash
rm -r levels/
ls levels
# Should report an error — directory is gone
```

**Task 6.4**: Observe the danger of careless wildcards

```bash
echo rm * .txt
# Observe what this WOULD expand to — do NOT actually run rm * .txt
```

**Questions to answer:**

1. Why should you always test wildcard patterns with `ls` before using `rm`?
2. What does `rm -r` do that plain `rm` cannot?
3. What is the critical difference between `rm *.txt` and `rm * .txt`?

### Exercise 7: Creating and Exploring Hard Links (10 minutes)

**Task 7.1**: Create a hard link

```bash
cd ~/playground
ln report.txt report-hard
ls -li report.txt report-hard
```

**Task 7.2**: Create a second hard link in a subdirectory

```bash
ln report.txt dir1/report-hard
ls -li report.txt report-hard dir1/report-hard
```

**Task 7.3**: Modify the file through one link and check the others

```bash
echo "Added by hard link" >> report-hard
cat report.txt
cat dir1/report-hard
```

**Questions to answer:**

1. Do `report.txt`, `report-hard`, and `dir1/report-hard` share the same inode number?
2. What is the link count shown for each of the three entries?
3. After appending text through `report-hard`, did the contents of `report.txt` change? Why?

### Exercise 8: Creating and Exploring Symbolic Links (10 minutes)

**Task 8.1**: Create a symbolic link

```bash
cd ~/playground
ln -s report.txt report-sym
ls -l report-sym
```

**Task 8.2**: Create a symbolic link inside a subdirectory using a relative path

```bash
ln -s ../report.txt dir1/report-sym
ls -l dir1/report-sym
```

**Task 8.3**: Check inode numbers

```bash
ls -li report.txt report-sym
```

**Task 8.4**: Delete the target and observe a broken link

```bash
rm report.txt
cat report-sym
# Should report an error — the symlink is broken
ls -l report-sym
```

**Questions to answer:**

1. Does the symbolic link have the same inode number as the target file?
2. What happened when you tried to read the symlink after deleting the target?
3. How does `ls -l` indicate that an entry is a symbolic link?

### Exercise 9: Comparing Hard and Symbolic Links (5 minutes)

**Task 9.1**: Recreate the target file and observe

```bash
cd ~/playground
echo "New content" > report.txt
cat report-sym
cat report-hard
```

**Task 9.2**: Check link counts and inodes

```bash
ls -li report.txt report-hard report-sym
```

**Questions to answer:**

1. After recreating `report.txt`, does the symbolic link work again?
2. Does `report-hard` contain the new content or the old content? Why?
3. What is the fundamental difference between how hard links and symbolic links reference a file?

### Lab Cleanup

```bash
rm -rf ~/playground
```

---

## Challenge Section

**Challenge 1: Explain Wildcards vs. Regular Expressions**

In your own words, explain what wildcards (globbing) are and how the shell uses them. Why does the book recommend character classes like `[[:upper:]]` instead of character ranges like `[A-Z]`?

**Challenge 2: Predict the Output**

Given a directory containing: `file1.txt`, `file2.txt`, `file10.txt`, `File3.txt`, `data.csv`, `notes.md`

What filenames will each pattern match? Write your answers before testing.

```bash
ls *.txt
ls file?.txt
ls [[:upper:]]*
ls *.[cm]*
ls file[0-9].txt
```

**Challenge 3: True or False**

Mark each statement as true or false and provide a brief justification.

1. The `cp` command always prompts before overwriting an existing file.
2. `rm -r` can delete a directory and all of its contents.
3. A hard link and its target file have different inode numbers.
4. Symbolic links can reference directories; hard links cannot.
5. The pattern `.*` matches hidden files but also matches `.` and `..`.
6. `mv file1 file2` will delete `file1` after the move completes.

**Challenge 4: Debugging a Command**

A student wants to copy all `.txt` files from `documents/` into `backup/`, but the command fails:

```bash
cp documents/*.txt backup
```

The error says `backup: No such file or directory`. Identify the problem and provide the corrected sequence of commands.

**Challenge 5: Wildcard Safety Scenario**

You are in a directory containing important project files. Explain the step-by-step approach you should use to safely delete all `.tmp` files without accidentally deleting anything else. Include the commands you would run.

**Challenge 6: Hard Links vs. Symbolic Links**

Describe two situations where a symbolic link is the better choice and one situation where a hard link is preferable. Explain your reasoning for each.

**Challenge 7: Predict the Outcome**

A directory called `project` contains files `a.txt`, `b.txt`, and a subdirectory `sub/` with `c.txt` inside it. What is the result of each command?

```bash
cp project/a.txt project/d.txt
cp project/*.txt /tmp/
cp project/ /tmp/backup/
cp -r project/ /tmp/backup/
```

**Challenge 8: The Broken Symlink**

You create the following:

```bash
mkdir ~/demo
cd ~/demo
echo "hello" > original.txt
ln -s original.txt link.txt
mv original.txt renamed.txt
cat link.txt
```

What happens when you run `cat link.txt`? Explain why. Then provide commands to fix the broken symlink.

**Challenge 9: Creating a Directory Structure**

Using a combination of `mkdir` and `cp`, write the commands to create the following structure and populate it:

```
workspace/
  src/
    main.txt    (copy from /etc/hostname)
  docs/
    readme.txt  (copy from /etc/hostname)
  backup/
```

Use as few commands as possible.

**Challenge 10: Relative Paths in Symbolic Links**

Explain why relative paths in symbolic links are relative to the link's location, not the current working directory. Then write the correct `ln -s` command to create a symlink at `~/project/docs/data-link` that points to the file `~/project/src/data.txt`.

**Challenge 11: Interactive Safety Net**

Write a shell alias or describe a strategy that would make `rm`, `cp`, and `mv` always prompt before overwriting or deleting. What is the potential downside of always using interactive mode?

**Challenge 12: Putting It All Together**

Write a sequence of commands that:

1. Creates a directory called `archive` with subdirectories `2025` and `2026`
2. Creates empty files `jan.txt` through `mar.txt` in each year directory
3. Creates a symbolic link called `current` in `archive/` that points to the `2026` directory
4. Copies all `.txt` files from `archive/current/` to a new directory called `archive/selected/`
5. Verifies the result by listing `archive/selected/`

---
