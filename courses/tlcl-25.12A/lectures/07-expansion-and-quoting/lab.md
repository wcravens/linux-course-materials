---
title: 'Expansion and Quoting: Lab'
subtitle: 'The Linux Command Line — Lecture 7'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir ~/chapter_lab
cd ~/chapter_lab
mkdir -p dir1 dir2 dir3
touch file1.txt file2.txt file3.txt .hidden_file .hidden_dir/placeholder
mkdir .hidden_dir
touch dir1/notes.txt dir2/data.csv dir3/report.txt
```

### Exercise 1: Observing Expansion (10 minutes)

**Task 1.1**: Use `echo` to see how the shell expands `*`

```bash
cd ~/chapter_lab
echo *
```

**Task 1.2**: Try several pathname expansion patterns

```bash
echo file*
echo *.txt
echo dir?
echo [fd]*
```

**Task 1.3**: Observe what happens with a pattern that matches nothing

```bash
echo *.xyz
```

**Questions to answer:**

1. When you typed `echo *`, did `echo` receive the `*` character or a list of filenames?
2. What did `echo *.xyz` display, and why?

### Exercise 2: Pathname Expansion with Hidden Files (10 minutes)

**Task 2.1**: List all visible files and directories

```bash
echo *
```

**Task 2.2**: Attempt to list hidden files

```bash
echo .*
```

**Task 2.3**: Use a better pattern to exclude `.` and `..`

```bash
ls -d .[!.]?*
```

**Task 2.4**: Combine to see everything

```bash
ls -d * .[!.]?*
```

**Questions to answer:**

1. Why is `echo .*` potentially dangerous if combined with a command like `rm`?
2. What does the `[!.]` part of the pattern `.[!.]?*` do?

### Exercise 3: Tilde and Parameter Expansion (10 minutes)

**Task 3.1**: Explore tilde expansion

```bash
echo ~
echo ~root
echo ~/chapter_lab
```

**Task 3.2**: Display common environment variables

```bash
echo $USER
echo $HOME
echo $PATH
echo $SHELL
```

**Task 3.3**: Try a misspelled variable name

```bash
echo $HOEM
```

**Task 3.4**: Use `printenv` to discover variables

```bash
printenv | head -20
```

**Questions to answer:**

1. What does `~` expand to?
2. What happens when you reference a variable that does not exist?
3. How is `echo $HOME` different from `echo $HOEM`?

### Exercise 4: Arithmetic Expansion (10 minutes)

**Task 4.1**: Perform basic calculations

```bash
echo $((100 + 50))
echo $((100 - 50))
echo $((10 * 12))
echo $((100 / 3))
echo $((100 % 3))
```

**Task 4.2**: Use exponentiation and grouping

```bash
echo $((2 ** 10))
echo $(((5 + 3) * 2))
```

**Task 4.3**: Observe integer-only behavior

```bash
echo $((7 / 2))
```

**Questions to answer:**

1. What is the result of `$((100 / 3))`? Why?
2. Does arithmetic expansion support decimal (floating-point) numbers?
3. What does the `%` (modulo) operator return?

### Exercise 5: Brace Expansion (15 minutes)

**Task 5.1**: Generate text patterns

```bash
echo {A,B,C}-file
echo file_{alpha,beta,gamma}.txt
```

**Task 5.2**: Use numeric and alphabetic ranges

```bash
echo {1..10}
echo {a..z}
echo {Z..A}
echo {01..12}
```

**Task 5.3**: Create a directory structure with brace expansion

```bash
cd ~/chapter_lab
mkdir -p project/{src,doc,test}/{v1,v2}
ls -R project/
```

**Task 5.4**: Nest brace expansions

```bash
echo {A{1,2},B{3,4}}
```

**Questions to answer:**

1. How many directories did Task 5.3 create in total?
2. Can brace expansion use both comma-separated lists and ranges in the same expression?
3. What is the output of `echo {01..05}`?

### Exercise 6: Command Substitution (15 minutes)

**Task 6.1**: Capture command output with `$()`

```bash
echo "Today is $(date)"
echo "You are logged in as $(whoami)"
```

**Task 6.2**: Use command substitution as an argument

```bash
ls -l $(which bash)
file $(which cat)
```

**Task 6.3**: Store results in a variable

```bash
current_dir=$(pwd)
echo "I am in $current_dir"
```

**Task 6.4**: Compare with backtick syntax

```bash
echo "Home contains $(ls ~)"
echo "Home contains `ls ~`"
```

**Questions to answer:**

1. What is the difference between `$()` and backtick syntax?
2. Can command substitution be nested? If so, which syntax supports it?
3. What happens to newlines in the output of an unquoted command substitution?

### Exercise 7: Quoting Mechanisms (15 minutes)

**Task 7.1**: Observe unquoted behavior

```bash
echo The total is $100.00
echo The     spaces    are    gone
```

**Task 7.2**: Apply double quotes

```bash
echo "The total is $100.00"
echo "The     spaces    are    preserved"
echo "Your username is $USER"
echo "Today is $(date)"
```

**Task 7.3**: Apply single quotes

```bash
echo 'The total is $100.00'
echo 'Your username is $USER'
echo 'No expansion: $(date) $((2+2)) ~'
```

**Task 7.4**: Use the escape character

```bash
echo "The cost is \$5.00"
echo "A backslash: \\"
echo "She said \"hello\""
```

**Questions to answer:**

1. Why did `echo The total is $100.00` produce unexpected output?
2. What is the key difference between double quotes and single quotes?
3. How do you include a literal dollar sign inside double quotes?

### Exercise 8: Combining Techniques (10 minutes)

**Task 8.1**: Create a dated backup directory

```bash
cd ~/chapter_lab
mkdir "backup_$(date +%Y-%m-%d)"
ls -d backup*
```

**Task 8.2**: Generate a report header with multiple expansions

```bash
echo "Report for $USER on $(date +%A), $(date +%B) $(date +%d)"
```

**Task 8.3**: Use brace expansion with command substitution

```bash
mkdir -p "logs/$(date +%Y)"/{jan,feb,mar,apr,may,jun}
ls -R logs/
```

**Questions to answer:**

1. Why are the double quotes important in Task 8.1?
2. What would happen if the date contained spaces and you did not use quotes?

### Lab Cleanup

```bash
rm -rf ~/chapter_lab
```

---

## Challenge Section

**Challenge 1: Explain Shell Expansion Order**

In your own words, describe the order in which the shell performs expansions. List at least four types of expansion and give an example of each.

**Challenge 2: Predict the Output**

What will the following commands display? Write your answers before running them.

```bash
echo ~
echo "~"
echo '~'
```

**Challenge 3: Predict the Output**

What will each of these commands produce?

```bash
echo $((3 + 5 * 2))
echo $(((3 + 5) * 2))
echo $((11 % 3))
echo $((2 ** 8))
```

**Challenge 4: Brace Expansion Practical Scenario**

You need to create the following directory structure for a school project in a single command. Write the `mkdir` command using brace expansion:

```
project/
  hw1/
    draft/
    final/
  hw2/
    draft/
    final/
  hw3/
    draft/
    final/
```

**Challenge 5: Quoting Scenarios**

For each of the following strings, determine which quoting method (double quotes, single quotes, or escaping) is most appropriate and write the `echo` command:

1. Display: `The variable $HOME points to your home directory` (show the literal text, no expansion)
2. Display: `Your home is /home/username` (with `$HOME` expanded to its actual value)
3. Display: `The price is $9.99` (literal dollar sign)

**Challenge 6: True or False**

1. Single quotes suppress all types of expansion.
2. Double quotes suppress pathname expansion and brace expansion but allow parameter expansion.
3. The expression `$((10 / 3))` produces `3.33`.
4. Brace expansion occurs before pathname expansion.
5. The `~` character is expanded inside double quotes.

**Challenge 7: Debugging a Command**

A student types the following and gets unexpected output. Identify the problem and provide the corrected command.

```bash
echo "There are $(ls | wc -l) files costing $$50 each"
```

The student expected to see a literal `$50` in the output.

**Challenge 8: Command Substitution Challenge**

Write a single command that displays a message in this format (with actual values substituted):

```
User [username] is running [shell] on [hostname]
```

Use parameter expansion and/or command substitution. The values should come from environment variables or commands.

**Challenge 9: Hidden Files Pattern**

Explain why the pattern `.*` is problematic when used with commands like `rm` or `cp`. Then provide a safer glob pattern that matches hidden files in the current directory while excluding `.` and `..`.

**Challenge 10: Putting It All Together**

Write a single command line that:

1. Creates a directory named with today's date (e.g., `backup-2026-02-24`)
2. Copies all `.txt` files from the current directory into it
3. Displays a confirmation message showing the directory name and the number of files copied

You may use semicolons to separate commands on one line.

---
