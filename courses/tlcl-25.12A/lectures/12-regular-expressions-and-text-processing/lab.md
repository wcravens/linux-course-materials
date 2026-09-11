---
title: 'Regular Expressions: Lab'
subtitle: 'The Linux Command Line — Lecture 12'
---

## Exercises (90-minute lab)

### Lab Setup

```bash
mkdir -p ~/text_lab
cd ~/text_lab

# Build the dirlist files used in the chapter
ls /bin           > dirlist-bin.txt
ls /usr/bin       > dirlist-usr-bin.txt
ls /sbin          > dirlist-sbin.txt 2>/dev/null
ls /usr/sbin      > dirlist-usr-sbin.txt 2>/dev/null

# Build a phone list with some malformed entries
for i in {1..10}; do
    echo "(${RANDOM:0:3}) ${RANDOM:0:3}-${RANDOM:0:4}" >> phonelist.txt
done

# Build the distros file used throughout TLCL chapter 20
cat > distros.txt <<'EOF'
SUSE	10.2	12/07/2006
Fedora	10	11/25/2008
SUSE	11.0	06/19/2008
Ubuntu	8.04	04/24/2008
Fedora	8	11/08/2007
SUSE	10.3	10/04/2007
Ubuntu	6.10	10/26/2006
Fedora	7	05/31/2007
Ubuntu	7.10	10/18/2007
Ubuntu	7.04	04/19/2007
SUSE	10.1	05/11/2006
Fedora	6	10/24/2006
Fedora	9	05/13/2008
Ubuntu	6.06	06/01/2006
Ubuntu	8.10	10/30/2008
Fedora	5	03/20/2006
EOF

# Two small files for comm/diff/patch
cat > file1.txt <<'EOF'
a
b
c
d
EOF
cat > file2.txt <<'EOF'
b
c
d
e
EOF
```

### Exercise 1: `grep` Basics — Anchors, Dots, and Brackets (10 minutes)

**Task 1.1**: Find every program name containing the substring `zip`, then narrow the search to names that *start* with `zip`, *end* with `zip`, and consist *only* of `zip`.

```bash
grep -h 'zip' dirlist*.txt
grep -h '^zip' dirlist*.txt
grep -h 'zip$' dirlist*.txt
grep -h '^zip$' dirlist*.txt
```

**Task 1.2**: Use the `.` metacharacter to find names containing `zip` preceded by exactly one character.

```bash
grep -h '.zip' dirlist*.txt
```

**Task 1.3**: Use a bracket expression to find names containing `bzip` or `gzip` (and only those):

```bash
grep -h '[bg]zip' dirlist*.txt
```

**Task 1.4**: Negate the bracket and find names containing `zip` preceded by *anything except* `b` or `g`:

```bash
grep -h '[^bg]zip' dirlist*.txt
```

**Questions to answer:**

1. Why does `grep -h '.zip' dirlist*.txt` not match the program named `zip`?
2. What is the difference between `^zip`, `zip$`, and `^zip$`?
3. What does `[^bg]zip` match, and why is `zip` itself excluded?

### Exercise 2: Character Classes and Ranges (10 minutes)

**Task 2.1**: Print only the names that start with an uppercase letter, using a POSIX character class:

```bash
grep -h '^[[:upper:]]' dirlist*.txt
```

**Task 2.2**: Compare the POSIX class above with the traditional range form. Run both and explain any difference:

```bash
grep -h '^[A-Z]' dirlist*.txt
grep -h '^[[:upper:]]' dirlist*.txt
```

**Task 2.3**: Use the dictionary trick from the chapter to find five-letter words whose third letter is `j` and whose last letter is `r` (the file may live in `/usr/share/dict/words` or `/usr/share/dict/american-english`):

```bash
ls /usr/share/dict/
grep -i '^..j.r$' /usr/share/dict/words 2>/dev/null \
  || grep -i '^..j.r$' /usr/share/dict/american-english
```

**Questions to answer:**

1. What did the `[A-Z]` and `[[:upper:]]` searches return, and why might they differ on a non-ASCII locale?
2. How many letters does `^..j.r$` require, and what does each `.` represent?
3. What did `grep -h '[-AZ]' dirlist*.txt` match, and why does the `-` need to be first?

### Exercise 3: ERE — Alternation and Quantifiers (10 minutes)

**Task 3.1**: Find filenames that start with `bz`, `gz`, or `zip` using alternation:

```bash
grep -Eh '^(bz|gz|zip)' dirlist*.txt
```

**Task 3.2**: Validate phone numbers in the `phonelist.txt` file you created in the lab setup. Print **only the malformed lines** using `grep -Ev`:

```bash
grep -Ev '^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$' phonelist.txt
```

**Task 3.3**: Build a regex that matches the *crude sentence* described in the chapter — starts with an uppercase letter, contains uppercase, lowercase, and spaces, and ends with a period:

```bash
echo "This works." | grep -E '^[[:upper:]][[:upper:][:lower:] ]*\.'
echo "This Works." | grep -E '^[[:upper:]][[:upper:][:lower:] ]*\.'
echo "this does not" | grep -E '^[[:upper:]][[:upper:][:lower:] ]*\.'
```

**Questions to answer:**

1. Why is `-E` (or `egrep`) needed for `(bz|gz|zip)` to mean alternation?
2. In the phone validator, what does each of `^`, `$`, and `{3}` contribute?
3. Why does `^[[:upper:]][[:upper:][:lower:] ]*\.` require the literal period to be escaped?

### Exercise 4: `cat`, `sort`, and `uniq` (10 minutes)

**Task 4.1**: Use `cat -A` to confirm that `distros.txt` is tab-delimited and has no trailing whitespace:

```bash
cat -A distros.txt | head -3
```

**Task 4.2**: Sort `distros.txt` in three ways and compare the output:

```bash
sort distros.txt
sort --key=1,1 --key=2n distros.txt
sort -k 3.7nbr -k 3.1nbr -k 3.4nbr distros.txt
```

**Task 4.3**: Build a sorted, deduplicated list of the first letters of every program in `dirlist-bin.txt`, with counts:

```bash
cut -c 1 dirlist-bin.txt | sort | uniq -c | sort -nr | head
```

**Task 4.4**: Sort `/etc/passwd` by login shell (field 7, colon-delimited):

```bash
sort -t ':' -k 7 /etc/passwd | head
```

**Questions to answer:**

1. Why does the multi-key sort `--key=1,1 --key=2n` succeed where the plain `sort` fails?
2. What does `-k 3.7nbr` mean character-by-character?
3. Why must input be **sorted** before `uniq` can collapse duplicates?

### Exercise 5: `cut`, `paste`, and `join` (10 minutes)

**Task 5.1**: Extract the third field (release date) from `distros.txt`, and the four-character year within the date:

```bash
cut -f 3 distros.txt
cut -f 3 distros.txt | cut -c 7-10
```

**Task 5.2**: Build the chronological column file from the chapter outline.

```bash
sort -k 3.7nbr -k 3.1nbr -k 3.4nbr distros.txt > distros-by-date.txt
cut -f 1,2 distros-by-date.txt > distros-versions.txt
cut -f 3   distros-by-date.txt > distros-dates.txt
paste distros-dates.txt distros-versions.txt
```

**Task 5.3**: Build a `join`-able pair of files keyed on date and combine them.

```bash
cut -f 1 distros-by-date.txt > distros-names.txt
cut -f 2 distros-by-date.txt > distros-vernums.txt
paste distros-dates.txt distros-names.txt   > distros-key-names.txt
paste distros-dates.txt distros-vernums.txt > distros-key-vernums.txt
join distros-key-names.txt distros-key-vernums.txt | head
```

**Questions to answer:**

1. Why is `paste` better than two `cut`s glued together for combining columns?
2. Why must both input files to `join` be sorted on the key field?
3. Inspect `distros-key-names.txt` with `cat -A`. What is the field separator that `paste` produced?

### Exercise 6: `tac`, `rev`, `comm`, and `diff` (10 minutes)

**Task 6.1**: Reverse the order of lines in `distros-by-date.txt`, then reverse the characters of each line.

```bash
tac distros-by-date.txt
rev distros-by-date.txt | head
```

**Task 6.2**: Use `rev` + `cut` + `rev` to delete the last character of each line of `distros.txt`:

```bash
rev distros.txt | cut -c 2- | rev | head
```

**Task 6.3**: Compare `file1.txt` and `file2.txt` with `comm`, suppressing columns to ask three different questions:

```bash
comm    file1.txt file2.txt    # all three columns
comm -12 file1.txt file2.txt   # lines common to both
comm -23 file1.txt file2.txt   # lines unique to file1
comm -13 file1.txt file2.txt   # lines unique to file2
```

**Task 6.4**: Compare the same two files with `diff` in three formats:

```bash
diff       file1.txt file2.txt
diff -c    file1.txt file2.txt
diff -u    file1.txt file2.txt
```

**Questions to answer:**

1. What is the difference between `tac` and `rev`?
2. In the `comm` output, what does each of the three columns represent?
3. Which `diff` format do source-control systems like git use, and why?

### Exercise 7: `diff` + `patch` (10 minutes)

**Task 7.1**: Build a unified-format patch that turns `file1.txt` into `file2.txt`:

```bash
diff -Naur file1.txt file2.txt > patchfile.txt
cat patchfile.txt
```

**Task 7.2**: Apply the patch to `file1.txt` and verify it now matches `file2.txt`:

```bash
patch < patchfile.txt
cat file1.txt
diff file1.txt file2.txt
```

**Task 7.3**: Reverse the patch (use `patch -R`) to restore the original `file1.txt`:

```bash
patch -R < patchfile.txt
cat file1.txt
```

**Questions to answer:**

1. Why does the `diff -Naur` command not need the filenames to be passed to `patch`?
2. What does the `@@ -1,4 +1,4 @@` line in the unified diff mean?
3. Why is `diff/patch` preferred over emailing whole files for software development?

### Exercise 8: `tr` — Transliterate, Delete, Squeeze (10 minutes)

**Task 8.1**: Convert lowercase to uppercase three different ways:

```bash
echo "lowercase letters" | tr a-z A-Z
echo "lowercase letters" | tr [:lower:] [:upper:]
echo "lowercase letters" | tr [:lower:] X
```

**Task 8.2**: Strip carriage returns from a synthetic DOS-format file:

```bash
printf 'line1\r\nline2\r\nline3\r\n' > dos.txt
cat -A dos.txt
tr -d '\r' < dos.txt > unix.txt
cat -A unix.txt
```

**Task 8.3**: Use `tr -s` to squeeze runs of repeated characters and observe what it does *not* do:

```bash
echo "aaabbbccc" | tr -s ab       # ab squeezed, c untouched
echo "abcabcabc" | tr -s ab       # nothing changes — repeats are not adjacent
```

**Task 8.4**: Encode and decode a phrase with ROT13:

```bash
echo "Hello World" | tr 'a-zA-Z' 'n-za-mN-ZA-M'
echo "Uryyb Jbeyq" | tr 'a-zA-Z' 'n-za-mN-ZA-M'
```

**Questions to answer:**

1. Why does `tr -s ab` change `aaabbbccc` but not `abcabcabc`?
2. What is the practical use of `tr -d '\r'` and when would you reach for it?
3. Why does running ROT13 twice return the original text?

### Exercise 9: `sed` — Addresses, `s`, and Backreferences (15 minutes)

**Task 9.1**: Print the first five lines of `distros.txt` with a range address and the `p` command (use `-n` to suppress automatic printing):

```bash
sed -n '1,5p' distros.txt
```

**Task 9.2**: Print only the lines that match a regex address, then negate the address:

```bash
sed -n '/SUSE/p'  distros.txt
sed -n '/SUSE/!p' distros.txt
```

**Task 9.3**: Use the `s` command to replace `bbb` and observe the effect of the `g` flag:

```bash
echo "aaabbbccc" | sed 's/b/B/'
echo "aaabbbccc" | sed 's/b/B/g'
```

**Task 9.4**: Reformat the date column in `distros.txt` from `MM/DD/YYYY` to `YYYY-MM-DD` using BRE backreferences:

```bash
sed 's/\([0-9]\{2\}\)\/\([0-9]\{2\}\)\/\([0-9]\{4\}\)$/\3-\1-\2/' distros.txt
```

**Task 9.5**: Build the multi-command `sed` script from the chapter and run it.

```bash
cat > distros.sed <<'EOF'
# sed script to produce Linux distributions report

1 i\
\
Linux Distributions Report\

s/\([0-9]\{2\}\)\/\([0-9]\{2\}\)\/\([0-9]\{4\}\)$/\3-\1-\2/
y/abcdefghijklmnopqrstuvwxyz/ABCDEFGHIJKLMNOPQRSTUVWXYZ/
EOF
sed -f distros.sed distros.txt
```

**Questions to answer:**

1. Why is `-n` required when you use the `p` command to print specific lines?
2. What does each of `\1`, `\2`, and `\3` refer to in the date-rewriting `s` command?
3. Why does the `y` command not accept ranges like `[a-z]`?

### Exercise 10: `aspell` (5 minutes)

**Task 10.1**: Create a file with a couple of misspellings and run `aspell` interactively:

```bash
cat > foo.txt <<'EOF'
The quick brown fox jimps over the laxy dog.
EOF
aspell check foo.txt
```

Pick `1) jumps`, then `1) lazy`. Verify the corrections, and look for the `.bak` backup file `aspell` left behind.

**Task 10.2**: Add HTML markup and rerun `aspell` first without `-H`, then with `-H`:

```bash
cat > foo.html <<'EOF'
<html>
  <head>
    <title>Mispelled HTML file</title>
  </head>
  <body>
    <p>The quick brown fox jimps over the laxy dog.</p>
  </body>
</html>
EOF
aspell    check foo.html       # tags get flagged
aspell -H check foo.html       # tags ignored
```

**Questions to answer:**

1. Why did `aspell` flag `html`, `head`, and `body` without `-H`?
2. Where did `aspell` save the original copy of `foo.txt`?
3. Name two other source-aware modes `aspell` supports (hint: `man aspell`).

### Lab Cleanup

```bash
rm -rf ~/text_lab
```

---

## Challenge Section

**Challenge 1: Predict the Output**

Without running anything, write the expected output of each command. Then run them and confirm.

```bash
echo "abc"   | grep -E '^a.c$'
echo "ac"    | grep -E '^a.c$'
echo "abbbc" | grep -E '^ab+c$'
echo "ac"    | grep -E '^ab*c$'
echo "ac"    | grep -E '^ab+c$'
```

**Challenge 2: Validate a US ZIP+4 Code**

Write a single `grep -E` command that matches valid US ZIP+4 codes (five digits, a hyphen, then four digits) and rejects everything else. Use anchors so partial matches are not allowed. Test against `12345-6789`, `00000-0000`, `12345`, `12345-678`, `abcde-1234`.

**Challenge 3: True or False**

Mark each statement true or false and justify briefly.

1. By default, `grep` uses *extended* regular expressions.
2. `^` anchors a match at the **end** of the line.
3. Inside a bracket expression, `[^abc]` means "match an `a`, a `b`, or a `c`".
4. `cut -f 1` extracts the first field of a *space-separated* file by default.
5. `uniq` will collapse non-adjacent duplicates if its input is large enough.
6. `comm` requires both input files to be sorted.
7. The `-i` option to `sed` writes results back to the input file in place.
8. `paste` and `join` always produce the same output for the same two files.
9. `tr` can read from a file given on the command line as a regular argument.

**Challenge 4: Debug the Regex**

The following command is supposed to print every line of `phonelist.txt` that is a *valid* phone number in the form `(NNN) NNN-NNNN`. It does not work. Identify and fix the **two** bugs.

```bash
grep -E '(\d{3}) \d{3}-\d{4}' phonelist.txt
```

**Challenge 5: Practical — Top 10 Largest Files**

Write a single pipeline that prints the **ten largest regular files** in `/usr/bin`, sorted from largest to smallest, showing the size and the filename. Use `ls -l`, `grep`, `sort`, `cut`, and/or `awk`. (No `find -size` allowed — practice with what this chapter teaches.)

**Challenge 6: Practical — Word-Frequency Histogram**

Given any plain-text file `INPUT.txt`, write a single pipeline using `tr`, `sort`, `uniq`, and `head` that prints the **20 most-common words** in the file, ignoring case and punctuation, with each word's count.

**Challenge 7: Build a Patch by Hand**

Create two small versions of a configuration file (`config.v1` and `config.v2`) that differ in exactly three lines. Use `diff -u` to produce a patch, edit the patch by hand to swap one of the changes, and apply the modified patch with `patch`. Confirm with `diff` that the result is what you expected. In one or two sentences, explain why patches are line-oriented rather than character-oriented.

**Challenge 8: `sed` Substitution from Memory**

Write a single `sed` command that, given a file of US dates in the form `MM/DD/YYYY`, rewrites them to ISO-8601 form `YYYY-MM-DD`. Then write a *second* command that does the reverse. Both commands must use BRE backreferences. Test each command on a sample file.

**Challenge 9: Find the Misspelling**

You have a directory tree of HTML files. Write a single pipeline that runs `aspell -H list` over every `.html` file and prints, for each file, the *unique* misspelled words that appear in it. Use any combination of `find`, `xargs`, `sort`, `uniq`, and `xargs aspell`. (You may stub the `find` half if you don't have HTML files handy.)

**Challenge 10: Putting It All Together — `most-popular-shell`**

Write a single pipeline that determines the **most popular login shell** on the system from `/etc/passwd`. The output should be a single line of the form:

```text
/bin/bash 47
```

— the shell pathname followed by the count of users who use it. Use `cut`, `sort`, `uniq -c`, and `sort -nr`. Explain in one sentence how each of the four tools contributes.

**Challenge 11: ROT13 Round-Trip**

Write a single command that reads from standard input, ROT13-encodes the text, then ROT13-encodes the result a second time. Verify that the output is identical to the input. Why does ROT13 followed by ROT13 produce the original?

**Challenge 12: Integrative — Linux Distros Report Builder**

Starting from `distros.txt`, build a single shell pipeline (or short `sed` script) that produces a report:

1. Begins with the literal heading `Linux Distributions Report` followed by a blank line.
2. Sorts entries chronologically (oldest first).
3. Reformats dates from `MM/DD/YYYY` to `YYYY-MM-DD`.
4. Uppercases every distribution name (using `tr` *or* `sed y`).
5. Aligns the columns so they read cleanly with `column -t` (or `paste`).

Save the result to `distros-report.txt` and explain in two or three sentences how this challenge ties together regex, `sed`, `sort`, and one other tool from the chapter.

---
