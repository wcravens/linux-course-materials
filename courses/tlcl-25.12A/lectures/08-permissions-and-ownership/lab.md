---
title: 'Permissions and Ownership: Lab'
subtitle: 'The Linux Command Line — Lecture 8'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir ~/permissions_lab
cd ~/permissions_lab
touch report.txt data.csv script.sh
echo '#!/bin/bash' > script.sh
echo 'echo "Hello from script"' >> script.sh
mkdir shared_docs private_docs
touch shared_docs/notes.txt private_docs/secrets.txt
```

### Exercise 1: Exploring User Identity (10 minutes)

**Task 1.1**: Display your user identity information.

```bash
id
```

**Task 1.2**: Examine the user database files.

```bash
wc -l /etc/passwd
head -5 /etc/passwd
tail -3 /etc/passwd
```

**Task 1.3**: Examine the group database.

```bash
wc -l /etc/group
grep $(whoami) /etc/group
```

**Task 1.4**: Attempt to read the shadow file.

```bash
cat /etc/shadow
```

**Questions to answer:**

1. What are your uid, gid, and group memberships?
2. Why were you unable to read `/etc/shadow`?
3. How many user accounts exist on your system (lines in `/etc/passwd`)?

### Exercise 2: Reading File Attributes (10 minutes)

**Task 2.1**: Examine the permissions on the lab files.

```bash
cd ~/permissions_lab
ls -l
```

**Task 2.2**: Compare file and directory attributes.

```bash
ls -ld shared_docs
ls -l shared_docs/notes.txt
```

**Task 2.3**: Identify file types using the first attribute character.

```bash
ls -l /dev/null
ls -l /dev/sda 2>/dev/null || echo "Block device not found (try /dev/disk0 on macOS)"
ls -ld /tmp
ls -l /etc/alternatives 2>/dev/null || ls -ld /tmp
```

**Task 2.4**: Examine a symbolic link.

```bash
ls -l /usr/bin/vi 2>/dev/null || ls -l /usr/bin/python3 2>/dev/null
```

**Questions to answer:**

1. What is the file type character for a directory? For a regular file?
2. What do the nine mode characters represent, and how are they grouped?
3. What permissions does your `report.txt` file have?

### Exercise 3: Changing Permissions with Octal Notation (10 minutes)

**Task 3.1**: Set `report.txt` to owner read/write only.

```bash
cd ~/permissions_lab
chmod 600 report.txt
ls -l report.txt
```

**Task 3.2**: Set `data.csv` to be readable by everyone but writable only by the owner.

```bash
chmod 644 data.csv
ls -l data.csv
```

**Task 3.3**: Make `script.sh` executable by the owner and readable by everyone.

```bash
chmod 755 script.sh
ls -l script.sh
./script.sh
```

**Task 3.4**: Remove all permissions from a file and observe the result.

```bash
chmod 000 report.txt
ls -l report.txt
cat report.txt
```

**Task 3.5**: Restore reasonable permissions.

```bash
chmod 644 report.txt
```

**Questions to answer:**

1. What octal value gives the owner full access and everyone else read-only access?
2. What happened when you tried to read a file with mode `000`?
3. Why does `755` make sense for executable scripts?

### Exercise 4: Changing Permissions with Symbolic Notation (10 minutes)

**Task 4.1**: Add execute permission for the owner only.

```bash
cd ~/permissions_lab
chmod 644 data.csv
chmod u+x data.csv
ls -l data.csv
```

**Task 4.2**: Remove read permission from others.

```bash
chmod o-r data.csv
ls -l data.csv
```

**Task 4.3**: Set group permissions to read-only exactly.

```bash
chmod g=r data.csv
ls -l data.csv
```

**Task 4.4**: Combine multiple symbolic changes.

```bash
chmod u=rw,g=r,o= data.csv
ls -l data.csv
```

**Task 4.5**: Reset to a known state using octal.

```bash
chmod 644 data.csv
```

**Questions to answer:**

1. What is the advantage of symbolic notation over octal notation?
2. What does `chmod o=` do (with no permission letters after `=`)?
3. How would you add execute permission for everyone using symbolic notation?

### Exercise 5: Understanding Directory Permissions (10 minutes)

**Task 5.1**: Observe the effect of removing read permission from a directory.

```bash
cd ~/permissions_lab
chmod 300 private_docs
ls private_docs
```

**Task 5.2**: Observe the effect of removing execute permission from a directory.

```bash
chmod 600 private_docs
cd private_docs
```

**Task 5.3**: Restore permissions and verify access.

```bash
cd ~/permissions_lab
chmod 755 private_docs
ls private_docs
cd private_docs && cd ~/permissions_lab
```

**Task 5.4**: Test write permission on a directory.

```bash
chmod 555 shared_docs
touch shared_docs/newfile.txt
chmod 755 shared_docs
```

**Questions to answer:**

1. What happens when you try to list a directory without read permission?
2. What happens when you try to `cd` into a directory without execute permission?
3. Why does removing write permission from a directory prevent creating files in it?

### Exercise 6: Working with umask (10 minutes)

**Task 6.1**: Check your current umask and create a file.

```bash
cd ~/permissions_lab
umask
touch default_file.txt
ls -l default_file.txt
```

**Task 6.2**: Set umask to `0000` and create a file.

```bash
umask 0000
touch open_file.txt
ls -l open_file.txt
```

**Task 6.3**: Set umask to `0077` and create a file.

```bash
umask 0077
touch private_file.txt
ls -l private_file.txt
```

**Task 6.4**: Create a directory with each umask to compare.

```bash
umask 0022
mkdir dir_022
umask 0077
mkdir dir_077
ls -ld dir_022 dir_077
```

**Task 6.5**: Restore your original umask.

```bash
umask 0022
```

**Questions to answer:**

1. What permissions did `open_file.txt` receive with umask `0000`? Why not `rwx` for all?
2. How does the umask differ between files and directories in terms of the default starting mode?
3. What umask would you use to ensure that only the owner can access new files?

### Exercise 7: Examining sudo and chown (10 minutes)

**Task 7.1**: Check your sudo privileges.

```bash
sudo -l
```

**Task 7.2**: Use `sudo` to view a restricted file.

```bash
sudo cat /etc/shadow | head -3
```

**Task 7.3**: Create a file as root and observe ownership.

```bash
cd ~/permissions_lab
sudo touch root_owned.txt
ls -l root_owned.txt
```

**Task 7.4**: Change ownership of the file back to yourself.

```bash
sudo chown $(whoami) root_owned.txt
ls -l root_owned.txt
```

**Task 7.5**: Change both owner and group in one command.

```bash
sudo chown $(whoami): root_owned.txt
ls -l root_owned.txt
```

**Questions to answer:**

1. What is the difference between `sudo` and `su` in terms of which password is required?
2. What does the trailing colon in `chown user:` do?
3. Why is `sudo` required to change file ownership?

### Exercise 8: Special Permissions and Shared Directories (15 minutes)

**Task 8.1**: Find files with setuid on your system.

```bash
find /usr/bin -perm -4000 -ls 2>/dev/null | head -5
```

**Task 8.2**: Examine the sticky bit on `/tmp`.

```bash
ls -ld /tmp
```

**Task 8.3**: Create a simulated shared directory with setgid.

```bash
cd ~/permissions_lab
mkdir team_project
chmod 2775 team_project
ls -ld team_project
```

**Task 8.4**: Create files inside and observe group inheritance.

```bash
touch team_project/plan.txt
ls -l team_project/plan.txt
```

**Task 8.5**: Apply the sticky bit to a directory.

```bash
chmod +t team_project
ls -ld team_project
```

**Questions to answer:**

1. What does the `s` in position 4 of the mode string indicate (e.g., `-rwsr-xr-x`)?
2. How does the setgid bit on a directory differ from setgid on a file?
3. What does the `t` at the end of the mode string on `/tmp` mean?

### Exercise 9: Combining Permissions Concepts (10 minutes)

**Task 9.1**: Create a project directory with specific access requirements.

```bash
cd ~/permissions_lab
mkdir project
chmod 750 project
ls -ld project
```

**Task 9.2**: Create files with different permission levels inside the project.

```bash
touch project/readme.txt
chmod 644 project/readme.txt
touch project/config.dat
chmod 600 project/config.dat
ls -l project/
```

**Task 9.3**: Use umask to create files with restricted defaults.

```bash
umask 0077
touch project/sensitive.log
ls -l project/sensitive.log
umask 0022
```

**Task 9.4**: Verify your identity and file ownership.

```bash
id
ls -l project/
stat project/readme.txt 2>/dev/null || ls -l project/readme.txt
```

**Questions to answer:**

1. With mode `750` on a directory, who can enter and list it?
2. Why might you use `umask 0077` before creating sensitive files rather than using `chmod` after creation?
3. What command would you use to check the numeric permissions of a file?

### Lab Cleanup

```bash
rm -rf ~/permissions_lab
umask 0022
```

---

## Challenge Section

**Challenge 1: Decode File Attributes**

Given the following `ls -l` output, describe the file type, owner permissions, group permissions, and other permissions for each entry:

```
-rwxr-x--- 1 alice developers 8192 Mar 15 09:00 build.sh
drwxrwsr-x 2 root  staff      4096 Mar 15 09:00 shared/
lrwxrwxrwx 1 bob   bob          11 Mar 15 09:00 config -> config.real
crw-rw---- 1 root  audio        0 Mar 15 09:00 audio_device
```

For the `shared/` directory, explain the significance of the `s` in the group execute position.

**Challenge 2: Octal to Symbolic Conversion**

Convert each of the following octal permission modes to their symbolic (`rwx`) representation and describe who has what access:

1. `754`
2. `700`
3. `664`
4. `4755`
5. `2770`

**Challenge 3: Predict the Permissions**

A system has a default umask of `0027`. Without running the commands, predict the resulting permissions for each:

```bash
touch newfile.txt
mkdir newdir
```

Show your work by demonstrating how the mask is applied to the default modes.

**Challenge 4: True or False**

For each statement, indicate True or False and provide a one-sentence justification:

1. The `chmod` command can only be used by the superuser.
2. A file with permissions `-r--r--r--` can be deleted by its owner if the parent directory has write and execute permissions.
3. Setting umask to `0777` would create files with no permissions at all.
4. The setuid bit on a directory causes new files to inherit the directory owner.
5. A user needs execute permission on a directory to `cd` into it.
6. The `chown` command can be used by any user to change file ownership.

**Challenge 5: Debugging a Permission Problem**

A user reports that the following script will not run, even though they are the file owner:

```bash
ls -l myscript.sh
# -rw-r--r-- 1 student student 45 Mar 20 10:00 myscript.sh
```

```bash
./myscript.sh
# bash: ./myscript.sh: Permission denied
```

Identify the problem and provide two different commands that would fix it — one using octal notation and one using symbolic notation.

**Challenge 6: Predict the Output**

What permissions will the file `testfile.txt` have after each command sequence? Write the full mode string (e.g., `-rw-r--r--`) for each step.

```bash
touch testfile.txt    # (assume umask is 0022)
chmod 777 testfile.txt
chmod u-x testfile.txt
chmod go-wx testfile.txt
chmod a+x testfile.txt
```

**Challenge 7: The umask Challenge**

A system administrator wants new files created by developers to have the permissions `-rw-rw----` and new directories to have `drwxrwx---`. What umask value should be set? Explain your reasoning.

**Challenge 8: chown Argument Analysis**

For each `chown` argument below, describe exactly what changes and what remains the same regarding the file's owner and group:

1. `chown alice report.txt`
2. `chown alice:developers report.txt`
3. `chown :developers report.txt`
4. `chown alice: report.txt`

**Challenge 9: Shared Directory Scenario**

You are a system administrator. The marketing team (users `maria` and `dave`) needs a shared directory `/opt/marketing` where both users can create, edit, and delete each other's files. Write the complete sequence of commands to:

1. Create a group called `marketing`
2. Add both users to the group
3. Create the directory
4. Set appropriate ownership and permissions so that:
   - Both users can create and modify files
   - New files automatically inherit the `marketing` group
   - Users outside the group can list but not modify files

Also specify what umask the users should set, and explain why the setgid bit is necessary.

**Challenge 10: Special Permissions Investigation**

Explain the difference in behavior between these three directory permission modes. For each, describe who can do what:

```
drwxrwxrwx  (mode 777)
drwxrwxrwt  (mode 1777)
drwxrwsr-x  (mode 2755)
```

Give a real-world use case for each mode.

**Challenge 11: Permission Troubleshooting Scenario**

A user runs the following commands and encounters errors at each step. For each error, explain the cause and provide the fix:

```bash
cp /etc/shadow ~/shadow_backup
# cp: cannot open '/etc/shadow' for reading: Permission denied

chmod 777 /usr/bin/passwd
# chmod: changing permissions of '/usr/bin/passwd': Operation not permitted

cd ~/documents
ls ~/documents/projects/
# ls: cannot open directory '~/documents/projects/': Permission denied
# (~/documents/projects has mode d--x--x--x)
```

**Challenge 12: Integrative Scenario**

A small development team needs a workspace with the following requirements:

- A directory `/opt/devteam` accessible only to team members
- A `src/` subdirectory where all members can create and edit files, with new files automatically belonging to the group
- A `releases/` subdirectory where all members can add files but only the file owner or directory owner can delete them
- All team members should have umask `0007` when working in the project

Write the complete set of commands (including user/group management, directory creation, permission settings, and an explanation of each step) that would configure this workspace. Use `sudo` where necessary.

---
