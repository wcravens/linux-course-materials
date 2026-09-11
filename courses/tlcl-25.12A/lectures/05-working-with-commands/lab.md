---
title: 'Working with Commands: Lab'
subtitle: 'The Linux Command Line — Lecture 5'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir ~/commands_lab
cd ~/commands_lab
touch sample.txt notes.txt data.csv
```

### Exercise 1: Identifying Command Types (10 minutes)

**Task 1.1**: Use `type` to classify several common commands

```bash
type cd
type ls
type mkdir
type echo
type type
```

**Task 1.2**: Try `type` on some less obvious commands

```bash
type bash
type man
type alias
type if
```

**Task 1.3**: Use `type` with a name that does not exist

```bash
type nonexistent_command
```

**Questions to answer:**

1. Which of the commands from Tasks 1.1 and 1.2 are shell builtins?
2. Which commands are identified as executable programs?
3. What message does `type` display for a command name that does not exist?

### Exercise 2: Locating Executables with `which` (10 minutes)

**Task 2.1**: Use `which` to locate several programs

```bash
which ls
which cp
which man
which bash
```

**Task 2.2**: Try `which` on shell builtins and observe the result

```bash
which cd
which type
which alias
```

**Task 2.3**: Compare the output of `type` and `which` for the same command

```bash
type ls
which ls
type cp
which cp
```

**Questions to answer:**

1. Does `which` return results for shell builtins? Why or why not?
2. How does the information from `type` differ from what `which` provides?
3. If `ls` is aliased, does `which` show the alias or the executable path?

### Exercise 3: Getting Help for Builtins (10 minutes)

**Task 3.1**: Use `help` to view documentation for several builtins

```bash
help cd
help echo
help alias
```

**Task 3.2**: Use the `-m` option for a man-page-style format

```bash
help -m cd
```

**Task 3.3**: Try `help` on an executable program and observe the result

```bash
help cp
```

**Task 3.4**: Use the `--help` option on an executable

```bash
mkdir --help
cp --help
```

**Questions to answer:**

1. In the `help cd` output, what do the square brackets around `[-L|[-P [-e]]]` indicate?
2. What is the difference between `help` and `--help`?
3. What happens when you use `help` on a command that is not a builtin?

### Exercise 4: Exploring Man Pages (15 minutes)

**Task 4.1**: View the man page for `ls` and navigate it

```bash
man ls
```

Inside the man page, use these keys: Space (next page), `b` (previous page), `/search` (search for a term), `q` (quit).

**Task 4.2**: View a man page from a specific section

```bash
man 5 passwd
```

**Task 4.3**: Compare the default `passwd` page to the section 5 page

```bash
man passwd
```

Note the difference: section 1 covers the `passwd` command, section 5 covers the `/etc/passwd` file format.

**Task 4.4**: Use `whatis` to see one-line descriptions

```bash
whatis ls
whatis cp
whatis passwd
whatis mkdir
```

**Questions to answer:**

1. What section does the default `man passwd` page come from?
2. How do you access the man page for the `/etc/passwd` file format instead of the `passwd` command?
3. What information does `whatis` provide that `man` does not show immediately?

### Exercise 5: Searching for Commands with `apropos` (10 minutes)

**Task 5.1**: Search for commands related to a topic

```bash
apropos directory
```

**Task 5.2**: Narrow the search with different keywords

```bash
apropos "copy files"
apropos compress
```

**Task 5.3**: Verify that `apropos` and `man -k` produce the same output

```bash
apropos partition
man -k partition
```

**Task 5.4**: Use `whatis` to get a quick description after finding a command

```bash
whatis rmdir
whatis gzip
```

**Questions to answer:**

1. How does `apropos` differ from `whatis`?
2. When would you use `apropos` instead of `man`?
3. Are `apropos keyword` and `man -k keyword` equivalent?

### Exercise 6: Browsing Info Pages (10 minutes)

**Task 6.1**: Open the info page for `coreutils`

```bash
info coreutils
```

Inside `info`, practice navigating: press `n` for the next node, `p` for the previous node, `u` to go up a level, Enter to follow a hyperlink, and `q` to quit.

**Task 6.2**: View the info page for a specific command

```bash
info ls
```

**Task 6.3**: Explore the documentation directory

```bash
ls /usr/share/doc | head -20
```

**Questions to answer:**

1. How do info pages differ in structure from man pages?
2. What key do you press to follow a hyperlink in an info document?
3. Where does the system store additional package documentation files?

### Exercise 7: Creating and Using Aliases (15 minutes)

**Task 7.1**: View all currently defined aliases

```bash
alias
```

**Task 7.2**: Check whether some names are already in use

```bash
type ll
type la
type myfiles
```

**Task 7.3**: Create a simple alias

```bash
alias myfiles='ls -lh ~/commands_lab'
myfiles
```

**Task 7.4**: Create an alias that chains multiple commands

```bash
alias sysinfo='echo "User: $USER"; echo "Shell: $SHELL"; echo "Date: $(date)"'
sysinfo
```

**Task 7.5**: Examine your aliases with `type`

```bash
type myfiles
type sysinfo
```

**Task 7.6**: Remove the aliases

```bash
unalias myfiles
unalias sysinfo
type myfiles
```

**Questions to answer:**

1. What happened when you ran `type myfiles` after removing the alias?
2. Can you create an alias with the same name as an existing command (e.g., `ls`)?
3. Will the aliases you created in this exercise survive after you close the terminal? Why or why not?

### Exercise 8: Combining Multiple Commands (10 minutes)

**Task 8.1**: Run multiple commands on one line using semicolons

```bash
cd ~/commands_lab; ls -la; cd -
```

**Task 8.2**: Create an alias that uses a documentation command

```bash
alias quickman='whatis ls cp mv rm mkdir rmdir'
quickman
```

**Task 8.3**: Create an alias that combines `type` and `which`

```bash
alias about='type ls; which ls'
about
```

**Task 8.4**: Clean up your aliases

```bash
unalias quickman
unalias about
```

**Questions to answer:**

1. What character separates multiple commands on a single line?
2. What is the advantage of creating an alias over retyping a long command each time?

### Lab Cleanup

```bash
rm -rf ~/commands_lab
```

---

## Challenge Section

**Challenge 1: Explain the Four Command Types**

In your own words, describe the four types of commands that the shell recognizes. Give one example of each type and explain how you would verify which type a command belongs to.

**Challenge 2: Predict the Output**

What will the following commands display? Write your answers before running them.

```bash
type echo
type man
type alias
type cp
type nonexistent
```

**Challenge 3: `type` vs `which`**

Explain the difference between `type` and `which`. Under what circumstances would `which` fail to provide useful information? Give a specific example.

**Challenge 4: Navigating Man Page Sections**

A student wants to read about the format of the `/etc/passwd` file. They type `man passwd` but see documentation for the password-changing command instead. Explain what went wrong and provide the corrected command.

**Challenge 5: True or False**

Mark each statement as true or false and provide a brief justification.

1. The `which` command can locate shell builtins.
2. The `help` command provides documentation for shell builtins.
3. The `--help` option works on every Linux command.
4. The `apropos` command searches for keywords in man page descriptions.
5. Aliases created on the command line persist across shell sessions.
6. The `type` command is itself a shell builtin.

**Challenge 6: Finding the Right Documentation**

For each of the following commands, determine the best way to get help (use `help`, `--help`, `man`, or `info`) and explain why.

1. `cd`
2. `mkdir`
3. `coreutils` (the GNU core utilities collection)
4. `export`

**Challenge 7: Debugging an Alias**

A student types the following but gets an error:

```bash
alias backup=cd ~/Documents; tar -czf backup.tar.gz .
```

Identify the problem and provide a corrected version.

**Challenge 8: Predict the Output**

What will each of the following commands display?

```bash
whatis cat
apropos "list directory"
type -a echo
```

**Challenge 9: Using `apropos` to Discover Commands**

You need to find a command that can display a calendar but you do not know its name. Describe how you would use `apropos` to find it, and write the exact command you would use.

**Challenge 10: Building a Help Alias**

Write an alias called `cmdinfo` that, when given a command name as an argument, displays both the command's type (using `type`) and its one-line description (using `whatis`). Note: aliases cannot accept arguments in the same way as functions. Explain this limitation and describe how a shell function would solve the problem.

**Challenge 11: Man Page Exploration**

Using the `man` command, find the answers to these questions:

1. What option makes `ls` sort output by file size?
2. What option makes `cp` prompt before overwriting an existing file?
3. What option makes `mkdir` create parent directories as needed?

For each, list the option flag and the man page you found it in.

**Challenge 12: Putting It All Together**

Write a sequence of commands (on a single line, separated by semicolons) that does the following:

1. Checks whether a command called `tree` exists using `type`
2. If it does exist, displays its location with `which`
3. Displays its one-line description with `whatis`

Then create an alias called `investigate` that runs this entire sequence for the `tree` command.

---
