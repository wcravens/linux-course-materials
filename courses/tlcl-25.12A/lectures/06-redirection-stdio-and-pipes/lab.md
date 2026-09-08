---
title: 'Redirection: Lab'
subtitle: 'The Linux Command Line — Lecture 6'
---

## Exercises (90-minute lab)

### Lab Setup

Create a working directory for this lab:

```bash
mkdir ~/redirection_lab
cd ~/redirection_lab
```

Download sample data:

```bash
# Create sample log file
cat << 'EOF' > server.log
2025-09-30 10:23:15 INFO Server started on port 8080
2025-09-30 10:23:16 INFO Database connection established
2025-09-30 10:25:42 ERROR Failed to load config file
2025-09-30 10:26:03 WARN High memory usage detected: 87%
2025-09-30 10:28:19 INFO User login: alice
2025-09-30 10:28:45 ERROR Database query timeout
2025-09-30 10:30:12 INFO User login: bob
2025-09-30 10:31:55 WARN High memory usage detected: 92%
2025-09-30 10:32:33 ERROR Connection refused: port 5432
2025-09-30 10:35:01 INFO Backup completed successfully
EOF

# Create sample user data
cat << 'EOF' > users.csv
username,email,login_count,last_login
alice,alice@example.com,45,2025-09-29
bob,bob@example.com,12,2025-09-30
charlie,charlie@example.com,78,2025-09-28
diana,diana@example.com,23,2025-09-30
eve,eve@example.com,156,2025-09-29
EOF

# Create sample numbers file
seq 1 100 > numbers.txt
```

### Exercise 1: Basic Redirection (10 minutes)

**Task 1.1**: Save a directory listing to a file

```bash
ls -lh > directory_listing.txt
cat directory_listing.txt
```

**Task 1.2**: Append the current date to the listing file

```bash
date >> directory_listing.txt
cat directory_listing.txt
```

**Task 1.3**: Try a command that produces an error, redirect stderr

```bash
ls /nonexistent 2> error_log.txt
cat error_log.txt
```

**Task 1.4**: Redirect both stdout and stderr

```bash
ls /etc /nonexistent &> combined_output.txt
cat combined_output.txt
```

**Questions to answer:**

1. What is the difference between `>` and `>>`?
2. Why did Task 1.3 use `2>` instead of `>`?
3. What does the `&>` operator do differently from `>`?

### Exercise 2: Working with Pipes (15 minutes)

**Task 2.1**: Find and count all ERROR lines in server.log

```bash
grep "ERROR" server.log | wc -l
```

**Task 2.2**: Display the 5 most recent log entries

```bash
tail -n 5 server.log
```

**Task 2.3**: Find all WARN messages and sort them

```bash
grep "WARN" server.log | sort
```

**Task 2.4**: Count how many unique log levels exist

```bash
cut -d' ' -f3 server.log | sort | uniq
```

**Task 2.5**: Find all user login events

```bash
grep "User login" server.log | cut -d':' -f2
```

**Questions to answer:**

1. In Task 2.1, what does each command in the pipeline contribute?
2. Why is `sort` needed before `uniq` to get accurate results?
3. What does `cut -d' ' -f3` do?

### Exercise 3: Complex Pipelines (15 minutes)

**Task 3.1**: Find the top 5 largest files in /etc (with error suppression)

```bash
du -h /etc/* 2>/dev/null | sort -rh | head -n 5
```

**Task 3.2**: Count occurrences of each log level

```bash
cut -d' ' -f3 server.log | sort | uniq -c | sort -rn
```

**Task 3.3**: Extract unique usernames from users.csv

```bash
tail -n +2 users.csv | cut -d',' -f1 | sort
```

**Task 3.4**: Find users who logged in on 2025-09-30

```bash
grep "2025-09-30" users.csv | cut -d',' -f1,4
```

**Task 3.5**: Calculate the sum of numbers 1-100

```bash
cat numbers.txt | paste -sd+ | bc
# Or using awk
cat numbers.txt | awk '{sum+=$1} END {print sum/NR}'
```

**Questions to answer:**

1. In Task 3.1, why is `2>/dev/null` used?
2. What does `tail -n +2` do in Task 3.3, and why is it necessary?
3. How many commands are chained in the pipeline in Task 3.2? What does each one do?

### Exercise 4: Using tee and tail -f (10 minutes)

**Task 4.1**: Monitor a file while saving output

```bash
# In one terminal, append to server.log
echo "2025-09-30 10:40:00 INFO New entry" >> server.log

# In another terminal (or same with tee)
tail -f server.log | tee live_monitor.txt
```

**Task 4.2**: Process data and save intermediate results

```bash
cat server.log | grep "ERROR" | tee error_messages.txt | wc -l
```

**Questions to answer:**

1. What does `tee` do that simple redirection cannot?
2. In Task 4.2, what ends up in `error_messages.txt` versus what is displayed on screen?
3. How do you stop `tail -f`?

### Exercise 5: Archive and Compression (15 minutes)

**Task 5.1**: Create a compressed archive of your lab directory

```bash
cd ~
tar -czf redirection_lab.tar.gz redirection_lab/
ls -lh redirection_lab.tar.gz
```

**Task 5.2**: List contents without extracting

```bash
tar -tzf redirection_lab.tar.gz | head -n 10
```

**Task 5.3**: Compress a large file and compare sizes

```bash
cd ~/redirection_lab
cp numbers.txt numbers_copy.txt
gzip numbers_copy.txt
ls -lh numbers.txt numbers_copy.txt.gz
```

**Task 5.4**: View compressed file without decompressing

```bash
zcat numbers_copy.txt.gz | head -n 10
```

**Task 5.5**: Create a pipeline that compresses output

```bash
cat server.log | grep "ERROR" | gzip > errors_only.gz
zcat errors_only.gz
```

**Questions to answer:**

1. What does the `-z` flag do in the `tar` command?
2. What happened to the original `numbers_copy.txt` after running `gzip`?
3. How does `zcat` differ from `cat`?

### Lab Cleanup

```bash
rm -rf ~/redirection_lab ~/redirection_lab.tar.gz
```

---

## Challenge Section

**Challenge 1: Build a Multi-Stage Pipeline**

Create a command pipeline that:

- Reads server.log
- Extracts only ERROR and WARN messages
- Sorts by timestamp
- Saves to a file called issues.txt
- Also displays the count of total issues

**Challenge 2: Find Recently Modified Files**

Find all files in your home directory modified in the last 7 days, sorted by size.

**Challenge 3: Monitor CPU Usage**

Create a one-liner to monitor system CPU usage every 2 seconds.

**Challenge 4: Explain Redirection Order**

What is the difference between these two commands? Which one correctly captures both stdout and stderr to the file?

```bash
ls -l /bin/usr > output.txt 2>&1
ls -l /bin/usr 2>&1 > output.txt
```

**Challenge 5: Predict the Output**

What will each of these commands produce? Write your answers before running them.

```bash
echo "hello" > file1.txt
echo "world" > file1.txt
cat file1.txt
```

```bash
echo "hello" > file2.txt
echo "world" >> file2.txt
cat file2.txt
```

**Challenge 6: True or False**

1. The `>` operator appends output to a file.
2. `2>` redirects standard error.
3. `uniq` requires sorted input to remove all duplicates.
4. The pipe operator `|` sends stdout to a file.
5. `/dev/null` is used to discard unwanted output.

**Challenge 7: Debugging a Pipeline**

A student wants to count the number of unique error types in server.log but gets incorrect results. Identify the problem and provide a corrected command.

```bash
cut -d' ' -f3 server.log | uniq -c
```

**Challenge 8: Data Extraction Challenge**

Using only command-line tools and pipes, write a single pipeline that reads `users.csv` and produces a report showing each username and their login count, sorted by login count in descending order (exclude the header row).

**Challenge 9: Explain the Difference**

Explain the difference between each pair:

1. `>` vs. `>>`
2. `>` vs. `|`
3. `2>` vs. `&>`
4. `cat file.txt` vs. `cat < file.txt`

**Challenge 10: Putting It All Together**

Write a single command line that:

1. Lists all files in `/etc` (suppressing errors)
2. Filters for filenames containing "conf"
3. Counts the number of matches
4. Saves the filtered list to `conf_files.txt` while also displaying the count on screen

---
