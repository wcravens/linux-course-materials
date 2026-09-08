---
title: 'Shell Scripting: Lab'
subtitle: 'The Linux Command Line — Lecture 13'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir -p ~/scripts_lab/bin
cd ~/scripts_lab
# Make sure ~/scripts_lab/bin is on PATH for this session only
export PATH="$HOME/scripts_lab/bin:$PATH"
```

### Exercise 1: Your First Script (10 minutes)

**Task 1.1**: Create a file named `hello_world` in `~/scripts_lab/bin` containing the shebang, a comment, and an `echo` command.

```bash
cat > ~/scripts_lab/bin/hello_world <<'EOF'
#!/bin/bash

# My very first shell script
echo 'Hello World!'
EOF
```

**Task 1.2**: Inspect the file's permissions.

```bash
ls -l ~/scripts_lab/bin/hello_world
```

**Task 1.3**: Try to run the script without making it executable.

```bash
~/scripts_lab/bin/hello_world
```

**Task 1.4**: Make it executable and run it by name.

```bash
chmod 755 ~/scripts_lab/bin/hello_world
hello_world
```

**Questions to answer:**

1. What error (if any) did you see in Task 1.3? Why?
2. Why does the script run in Task 1.4 without a leading `./`?
3. What does the `#!` on the first line do, and why is it called a *shebang*?

### Exercise 2: Script Location and PATH (10 minutes)

**Task 2.1**: Display the current `PATH` and confirm that `~/scripts_lab/bin` is listed first.

```bash
echo "$PATH"
```

**Task 2.2**: Copy the script into `/tmp` and try to run it by name.

```bash
cp ~/scripts_lab/bin/hello_world /tmp/
hello_world          # still runs from the bin directory
/tmp/hello_world     # runs from /tmp with an explicit path
```

**Task 2.3**: Remove the bin copy and try to run it by name alone.

```bash
rm ~/scripts_lab/bin/hello_world
hello_world        # should now fail
```

**Task 2.4**: Restore the script from `/tmp` and confirm it runs again.

```bash
mv /tmp/hello_world ~/scripts_lab/bin/
hello_world
```

**Questions to answer:**

1. Which directory does the shell search first, `/tmp` or `~/scripts_lab/bin`, when you type `hello_world`?
2. Why did Task 2.3 fail? What two options do you have to fix it?
3. What is the difference between `/usr/bin` and `/usr/local/bin` in the Filesystem Hierarchy Standard?

### Exercise 3: Multiline Output and the Minimal Document (10 minutes)

**Task 3.1**: Create a script called `sys_info_page` that outputs a minimal HTML document using a single quoted `echo`.

```bash
cat > ~/scripts_lab/bin/sys_info_page <<'EOF'
#!/bin/bash

# Program to output a system information page

echo "<html>
    <head>
         <title>Page Title</title>
    </head>
    <body>
         Page body.
    </body>
</html>"
EOF
chmod 755 ~/scripts_lab/bin/sys_info_page
```

**Task 3.2**: Run the script and observe the output.

```bash
sys_info_page
```

**Task 3.3**: Redirect the output to a file and view it with `less`.

```bash
sys_info_page > ~/scripts_lab/report.html
less ~/scripts_lab/report.html
```

**Task 3.4**: Try an unclosed multiline quote at the prompt (press `Enter` a few times, then `Ctrl-C`).

```bash
echo "unterminated
> still typing
> ^C
```

**Questions to answer:**

1. How does a single `echo` command produce nine lines of output?
2. What shell variable controls the `> ` continuation prompt you saw in Task 3.4?
3. Why is a single multi-line `echo` easier to maintain than nine separate `echo` commands?

### Exercise 4: Variables and Constants (10 minutes)

**Task 4.1**: Update `sys_info_page` to use a variable for the title.

```bash
cat > ~/scripts_lab/bin/sys_info_page <<'EOF'
#!/bin/bash

# Program to output a system information page

TITLE="System Information Report For $HOSTNAME"

echo "<html>
    <head>
         <title>$TITLE</title>
    </head>
    <body>
         <h1>$TITLE</h1>
    </body>
</html>"
EOF
sys_info_page
```

**Task 4.2**: Add a timestamp built from command substitution.

```bash
sed -i '5a CURRENT_TIME="$(date +"%x %r %Z")"' ~/scripts_lab/bin/sys_info_page
sed -i '6a TIMESTAMP="Generated $CURRENT_TIME, by $USER"' ~/scripts_lab/bin/sys_info_page
sed -i 's|<h1>$TITLE</h1>|<h1>$TITLE</h1>\n         <p>$TIMESTAMP</p>|' ~/scripts_lab/bin/sys_info_page
sys_info_page
```

**Task 4.3**: Demonstrate the silent-misspelling problem at the prompt.

```bash
foo="yes"
echo $foo
echo $fool
```

**Task 4.4**: Use `declare -r` to make a constant and attempt to change it.

```bash
declare -r VERSION="1.0"
echo "$VERSION"
VERSION="2.0"          # should fail with a read-only error
```

**Questions to answer:**

1. What advantage does using `$TITLE` twice give over hard-coding the title string twice?
2. Why does `echo $fool` produce a blank line instead of an error?
3. What did the shell report when you tried to reassign `VERSION` in Task 4.4?

### Exercise 5: Here Documents (15 minutes)

**Task 5.1**: Rewrite `sys_info_page` to use a here document fed to `cat`.

```bash
cat > ~/scripts_lab/bin/sys_info_page <<'OUTER'
#!/bin/bash

# Program to output a system information page

TITLE="System Information Report For $HOSTNAME"
CURRENT_TIME="$(date +"%x %r %Z")"
TIMESTAMP="Generated $CURRENT_TIME, by $USER"

cat << _EOF_
<html>
    <head>
         <title>$TITLE</title>
    </head>
    <body>
         <h1>$TITLE</h1>
         <p>$TIMESTAMP</p>
    </body>
</html>
_EOF_
OUTER
sys_info_page
```

**Task 5.2**: Compare expansion behavior between an unquoted and a quoted here-document token.

```bash
foo="some text"

cat << _EOF_
$foo
"$foo"
'$foo'
\$foo
_EOF_

cat << '_EOF_'
$foo
"$foo"
'$foo'
\$foo
_EOF_
```

**Task 5.3**: Test tab stripping with `<<-`.

```bash
cat <<- _EOF_
	This line was indented with a tab.
	So was this one.
_EOF_
```

**Task 5.4**: Try the same thing with spaces instead of tabs and see what changes.

```bash
cat <<- _EOF_
    This line was indented with spaces.
    So was this one.
_EOF_
```

**Questions to answer:**

1. Which expansions are performed inside an unquoted here document? Which are suppressed when the token is quoted?
2. What does `<<-` do differently from `<<`?
3. Why can the tab-stripping feature be "problematic" in practice?

### Exercise 6: Shell Functions and Top-Down Design (15 minutes)

**Task 6.1**: Add three **stub** functions to `sys_info_page` and call them from the here document via command substitution.

```bash
cat > ~/scripts_lab/bin/sys_info_page <<'OUTER'
#!/bin/bash

# Program to output a system information page

TITLE="System Information Report For $HOSTNAME"
CURRENT_TIME="$(date +"%x %r %Z")"
TIMESTAMP="Generated $CURRENT_TIME, by $USER"

report_uptime () {
    echo "Function report_uptime executed."
    return
}

report_disk_space () {
    echo "Function report_disk_space executed."
    return
}

report_home_space () {
    echo "Function report_home_space executed."
    return
}

cat << _EOF_
<html>
    <head>
         <title>$TITLE</title>
    </head>
    <body>
         <h1>$TITLE</h1>
         <p>$TIMESTAMP</p>
         $(report_uptime)
         $(report_disk_space)
         $(report_home_space)
    </body>
</html>
_EOF_
OUTER
sys_info_page
```

**Task 6.2**: Flesh out `report_uptime` with a here document that wraps `uptime` output in `<pre>` tags.

```bash
# Open the script in your editor and replace the stub body with:
# cat << _EOF_
#     <h2>System Uptime</h2>
#     <pre>$(uptime)</pre>
# _EOF_
vim ~/scripts_lab/bin/sys_info_page
sys_info_page
```

**Task 6.3**: Flesh out `report_disk_space` with a `df -h` call.

```bash
vim ~/scripts_lab/bin/sys_info_page
# Replace report_disk_space stub body with:
# cat << _EOF_
#     <h2>Disk Space Utilization</h2>
#     <pre>$(df -h)</pre>
# _EOF_
sys_info_page
```

**Task 6.4**: Call the function definitions **before** any call. Move `report_uptime` below its call site and observe what happens.

```bash
sys_info_page
```

**Questions to answer:**

1. Why is it a good practice to start with stubs rather than writing the full functions first?
2. What error or behavior did you see when the function was defined *after* its call in Task 6.4?
3. What is the advantage of using a here document inside a function instead of multiple `echo` commands?

### Exercise 7: Local Variables (10 minutes)

**Task 7.1**: Create a small script that shows how local and global variables of the same name coexist.

```bash
cat > ~/scripts_lab/bin/local-vars <<'EOF'
#!/bin/bash
# local-vars: script to demonstrate local variables

foo=0      # global variable foo

funct_1 () {
    local foo
    foo=1
    echo "funct_1: foo = $foo"
}

funct_2 () {
    local foo
    foo=2
    echo "funct_2: foo = $foo"
}

echo "global:  foo = $foo"
funct_1
echo "global:  foo = $foo"
funct_2
echo "global:  foo = $foo"
EOF
chmod 755 ~/scripts_lab/bin/local-vars
local-vars
```

**Task 7.2**: Edit `local-vars` and remove the `local` keyword from `funct_1`. Rerun.

```bash
vim ~/scripts_lab/bin/local-vars
local-vars
```

**Task 7.3**: Put the `local` keyword back and confirm the independent behavior is restored.

```bash
vim ~/scripts_lab/bin/local-vars
local-vars
```

**Questions to answer:**

1. What value does `foo` have in the final `echo "global: foo = $foo"` line, and why?
2. What changed about the output when `local` was removed in Task 7.2?
3. How does `local` help make a shell function portable between scripts?

### Exercise 8: Function Redirection (10 minutes)

**Task 8.1**: Create a `my_funct` function that lists a few directories.

```bash
cat > ~/scripts_lab/bin/dirs <<'EOF'
#!/bin/bash

my_funct () {
    echo "Home directory:"
    ls -d ~
    echo "Config files in home:"
    ls -a ~ | head -5
    return
}

my_funct
EOF
chmod 755 ~/scripts_lab/bin/dirs
dirs
```

**Task 8.2**: Redirect the function's combined output to a file.

```bash
# Edit ~/scripts_lab/bin/dirs so the last line is:
#   my_funct > ~/scripts_lab/dirs.out
vim ~/scripts_lab/bin/dirs
dirs
cat ~/scripts_lab/dirs.out
```

**Task 8.3**: Pipe the combined output through `sort`.

```bash
# Change the last line to:
#   my_funct | sort
vim ~/scripts_lab/bin/dirs
dirs
```

**Task 8.4**: Capture the output into a variable with command substitution.

```bash
# Change the last line to:
#   out="$(my_funct)"; echo "Captured ${#out} characters"
vim ~/scripts_lab/bin/dirs
dirs
```

**Questions to answer:**

1. Why can you redirect the output of an entire function with a single `>`?
2. What does it mean to say that a function body is a *group command*?
3. What problem would `my_funct > file.txt` solve that `echo "..." > file.txt` commands inside the function would not?

### Lab Cleanup

```bash
rm -rf ~/scripts_lab
# Restore PATH for this session (open a new terminal or unset the export)
```

---

## Challenge Section

**Challenge 1: Explain the Shebang**

In your own words, describe what the `#!/bin/bash` line does. Why is the `#!` sequence called a *shebang*, and why is it not treated as a comment even though it begins with `#`?

**Challenge 2: Predict the Output**

Assume you have just run `foo="apple"`. Write the output you expect from each of these commands before running them to check.

```bash
echo $foo
echo "$foo $fool"
echo '${foo}s'
echo "${foo}s"
cat << _EOF_
price = $((5 * 3))
_EOF_
```

**Challenge 3: True or False**

Mark each statement true or false and justify briefly.

1. The shell reports an error when you reference an unset variable.
2. A function call must appear *after* the function's definition in the script.
3. `<<-` strips leading spaces and tabs from a here document.
4. A variable declared with `local` still exists in the caller after the function returns.
5. Scripts in `~/bin` can always be run by name on any Linux system without further configuration.
6. `declare -r VAR="value"` creates a read-only constant.

**Challenge 4: Debug the Script**

The following script is meant to print the current date inside an HTML `<p>` tag. It contains **three independent bugs**. Identify each one and write a corrected version.

```bash
#!/bin/bash
TITLE = "Daily Report"

echo "<p>Generated on $(date) by ${user}</p>"
```

**Challenge 5: Practical — Use a Here Document**

Write a 10-line shell script `welcome` that uses a single here document to send a multi-line greeting to standard output. The greeting must include:

- The user's login name
- The machine hostname
- The current date and time
- The number of seconds since the system booted (hint: the `uptime -p` command, or parse `/proc/uptime`)

**Challenge 6: Predict — Quoted vs. Unquoted Here Doc**

Given `name="Alice"`, predict the exact output of each block.

```bash
cat << END
Hello, $name!
The cost is $((5+5)).
END
```

```bash
cat << 'END'
Hello, $name!
The cost is $((5+5)).
END
```

**Challenge 7: Design — Top-Down Decomposition**

Without writing code, list the top-level steps a script would need to take to produce a daily "user activity" report containing:

- The machine hostname and current date
- Who is logged in (`who`)
- The last five logins (`last -n 5`)
- A count of processes belonging to the current user (`ps -u "$USER" | wc -l`)

Then refine each top-level step into one or two sub-steps, as if you were going to implement each one as a shell function.

**Challenge 8: Write the Functions**

Using your design from Challenge 7, write the **stubs** for each function. Each stub should simply `echo` its own name so you can verify the script's flow. Do not flesh out the real implementation.

**Challenge 9: Local Variables**

Write a short script containing a global variable `count=10` and a function `increment` that takes `count` as a **local variable**, increments it, and prints it. Verify that the global `count` is unchanged after the function returns.

**Challenge 10: Scenario — Installing a Personal Script**

You have written a script called `backup_home` you want to use as a command from any directory. Describe, in order, the exact steps required to:

1. Place the script in an appropriate personal location
2. Ensure its permissions allow you (and only you) to execute it
3. Guarantee that it is found on `PATH` in every future terminal session

**Challenge 11: Function vs. Alias**

Give one concrete example of something a shell function can do that an alias cannot, and write the function. Explain in one sentence why the alias form would fail.

**Challenge 12: Putting It All Together**

Write a complete shell script `~/bin/report_login` that:

1. Uses a `TITLE` constant built from `$HOSTNAME` and `$USER`
2. Defines three stub functions: `report_who`, `report_last`, `report_procs`
3. Uses a single here document fed to `cat` to emit a minimal HTML report that includes `$TITLE`, a `<p>` timestamp, and the three `$(function_name)` substitutions
4. Is made executable with `chmod 700`
5. Can be invoked by its bare name from any directory

Describe how you would then flesh out each stub, one at a time, re-running the script between changes to verify the logic.

---
