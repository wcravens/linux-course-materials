---
title: 'Lab: Building a Filesystem from a Blank Disk'
subtitle: CSC 171 — Lecture 5
---

## Overview

This lab has four parts, in order. The first two build the storage stack from the bottom up
on a disk you create yourself, and then make the result survive a reboot. The last two are
investigation: you will prove to yourself how a filesystem stores a file, and then cause
two classic failures deliberately, on a machine where the consequences are nothing.

Parts 1 and 2 involve partitioning, which is the one genuinely destructive operation in
this course. Part 1 spends its first section on confirming which device you are about to
write to, and that section is not padding. Do it every time, including the times you are
sure.

**Before you start**, you need:

- Your Compute Engine VM running, and `gcloud` authenticated wherever you run it — the
  Cloud Shell is fine
- An account on the VM that can `sudo`
- About ninety minutes, and a willingness to reboot the machine twice

Throughout, replace `vm-171` with your instance name, `us-central1-a` with your zone, and
`$PROJECT` with your project ID. Record answers in your `mdbook` learning journal as you
go.

> **A standing rule for this lab.** `/dev/sda` is your boot disk. Nothing in these
> instructions ever writes to it. If a command you are about to run names `sda`, stop and
> re-read the step.

---

## Part 1: Build the stack

### 1.1 Create and attach a disk

From Cloud Shell, or anywhere `gcloud` is authenticated:

```bash
gcloud compute disks create csc171-data \
  --project=$PROJECT --zone=us-central1-a \
  --size=10GB --type=pd-balanced

gcloud compute instances attach-disk vm-171 \
  --project=$PROJECT --zone=us-central1-a \
  --disk=csc171-data --device-name=data
```

`--device-name=data` is the name the guest OS will see. Remember it; the next section
depends on it.

Then SSH into the VM. Everything from here until Part 1.7 happens on the VM.

### 1.2 Confirm which device you just attached

Three independent checks. Run all three.

```bash
lsblk
```

The new disk is the one with a size you recognize, **no partitions beneath it**, and **no
mount point**.

```bash
ls -l /dev/disk/by-id/google-data
```

This resolves the name you chose in `gcloud` to a kernel device name. Whatever it points
at is your data disk.

```bash
sudo blkid /dev/sdb
```

No output means no filesystem, which is what a blank disk looks like. If this prints a
`TYPE=` for a filesystem you did not create, **stop** — you are looking at the wrong
device.

**Record in your journal:** the three commands and their output, and one sentence naming
the device you have confirmed. Every later step in Part 1 uses that name; this lab writes
it as `/dev/sdb`.

**Question 1.** Why is `/dev/disk/by-id/google-data` a safer thing to trust than `/dev/sdb`?
Give a specific scenario in which the second one would be wrong.

### 1.3 Write a partition table

```bash
sudo fdisk /dev/sdb
```

Inside `fdisk`, in order:

Table: The `fdisk` keystrokes for this exercise, in order

| Key | What it does |
| --- | --- |
| `p` | Print the current table — confirm it is empty |
| `g` | Create a new, empty GPT table |
| `n` | New partition; press Enter three times to accept number, first sector, last sector |
| `p` | Print again — read what you are about to commit |
| `w` | Write it to disk and exit |

Before you press `w`, read the output of `p` and satisfy yourself that it describes the
disk you intend. Until `w`, nothing has happened and `q` discards everything.

Then confirm the kernel noticed:

```bash
sudo partprobe /dev/sdb
lsblk /dev/sdb
```

You should now see `sdb1` beneath `sdb`. If you do not, do not continue — the next command
would operate on the whole disk instead of the partition.

`fdisk` normally re-reads the table itself on `w`, so `partprobe` is belt and braces. If it
reports `command not found`, it lives in the `parted` package (`sudo apt-get install -y
parted`); the equivalent from `util-linux`, which is always present, is `sudo partx -u
/dev/sdb`.

**Question 2.** You accepted three defaults at the `n` prompt. Read the output of
`sudo fdisk -l /dev/sdb` and say what first sector `fdisk` chose, and why it is not sector
34.

### 1.4 Create a filesystem

```bash
sudo mkfs.ext4 -L csc171-data /dev/sdb1
```

Read the output before moving on. It tells you the block size, the number of blocks, the
number of inodes, and the locations of the superblock backups.

**Record in your journal:** the block size, the block count, and the inode count that
`mkfs` reported.

Now read the same numbers back out of the filesystem itself:

```bash
sudo dumpe2fs -h /dev/sdb1
```

**Question 3.** `dumpe2fs` reports a `Reserved block count`. What fraction of the total is
it, who is it reserved for, and why does that reservation exist?

This is a data volume rather than a root filesystem, so reclaim most of it:

```bash
sudo tune2fs -m 1 /dev/sdb1
sudo dumpe2fs -h /dev/sdb1 | grep -i reserved
```

### 1.5 Mount it

```bash
sudo mkdir -p /srv/data
sudo mount /dev/sdb1 /srv/data

findmnt /srv/data
df -h /srv/data
```

A successful `mount` prints nothing at all, which is why both verification commands are
there.

Give yourself ownership so the rest of the lab does not need `sudo` for every file:

```bash
sudo chown $USER:$USER /srv/data
touch /srv/data/hello.txt
ls -l /srv/data
```

**Question 4.** `df -h` reports the filesystem as slightly smaller than the 10 GB disk you
created. Name two things occupying the difference.

### 1.6 Prove the layers are independent

Unmount it, and watch what survives:

```bash
sudo umount /srv/data
ls /srv/data          # empty — the mount point is just a directory again
sudo blkid /dev/sdb1  # the filesystem is still there, with its label and UUID
sudo mount /dev/sdb1 /srv/data
ls /srv/data          # hello.txt is back
```

**Question 5.** In one sentence each: what does the partition know about the filesystem
inside it, and what does the filesystem know about `/srv/data`?

---

## Part 2: Make it survive a reboot

### 2.1 Find the UUID

```bash
sudo blkid /dev/sdb1
sudo blkid -s UUID -o value /dev/sdb1
```

The second form prints the UUID alone, which is what you want for scripting.

### 2.2 Write the `fstab` entry

Let the shell copy the UUID so that you cannot mistype it:

```bash
UUID=$(sudo blkid -s UUID -o value /dev/sdb1)
echo "UUID=$UUID /srv/data ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab

cat /etc/fstab
```

**Question 6.** Name the six fields in the line you just added, in order, and say what
`0 2` at the end controls.

**Question 7.** What does `nofail` do, and what specifically would happen at the next boot
without it if this disk were detached?

### 2.3 Verify before rebooting, not after

This is the habit the whole part exists to build. Two commands, in this order:

```bash
sudo findmnt --verify --verbose
```

Read the output. It parses every line of `fstab` and reports unknown filesystem types,
missing mount point directories, and sources that match nothing.

```bash
sudo umount /srv/data
sudo mount -a
findmnt /srv/data
```

`mount -a` mounts everything in `fstab` that is not already mounted — which is the same
work the boot performs. If your entry is wrong, you find out here, on a running machine
with a shell, instead of at a console you may not have.

```bash
sudo systemctl daemon-reload
systemctl list-units --type=mount | grep srv
```

**Question 8.** `mount -a` succeeded before you ran `daemon-reload`. Why is
`daemon-reload` still necessary, and what reads `/etc/fstab` at boot?

### 2.4 See the failure safely, in both directions

Now cause the failure that `nofail` protects against, without ever risking the machine. Add
a second entry naming a disk that does not exist:

```bash
echo "UUID=00000000-0000-0000-0000-000000000000 /srv/missing ext4 defaults,nofail 0 2" \
  | sudo tee -a /etc/fstab

sudo mkdir -p /srv/missing
sudo mount -a
echo "exit status: $?"
```

**Nothing happens.** No error, and an exit status of 0 — because `nofail` tells `mount` not
to complain about a source that is not there. That is `nofail` doing exactly its job, and
it is also the reason `mount -a` is not sufficient on its own.

So ask the tool whose job this is:

```bash
sudo findmnt --verify --verbose
```

**Record in your journal:** the `findmnt --verify` output for that entry, exactly, including
the summary line that counts parse errors, errors, and warnings.

Now take `nofail` off that one line, and run the same command again:

```bash
sudo sed -i 's|/srv/missing ext4 defaults,nofail|/srv/missing ext4 defaults|' /etc/fstab
sudo mount -a
echo "exit status: $?"
```

**Record in your journal:** the error message and the exit status.

**Question 9.** You have now watched one broken entry behave two ways. Describe what the
boot would do with each version. Then name which of the two commands you ran would have
caught the problem in **both** cases, and say why that makes it the one to run before every
reboot.

> **Remove the bad line now, before you do anything else.** It currently has no `nofail`,
> and a reboot in this state is exactly the emergency-mode failure this part is about.

```bash
sudo sed -i '/srv\/missing/d' /etc/fstab
sudo rmdir /srv/missing
sudo findmnt --verify --verbose
cat /etc/fstab
```

Do not continue until `findmnt --verify` reports no errors and `cat` shows the file you
expect.

### 2.5 Reboot, and confirm

Only now, with `findmnt --verify` clean and `mount -a` succeeding:

```bash
sudo systemctl reboot
```

Wait a minute, SSH back in, and verify:

```bash
findmnt /srv/data
ls -l /srv/data
systemctl --failed
```

**Question 10.** You have now verified the mount three ways: `findmnt`, `ls`, and
`systemctl --failed`. What would each one have told you if the disk had been detached
while the machine was down?

---

## Part 3: Prove the inode model

Everything in this part happens on `/srv/data`, and none of it needs `sudo`.

### 3.1 A file, and its inode

```bash
cd /srv/data
echo "the original contents" > notes.txt

ls -li notes.txt
stat notes.txt
```

**Record in your journal:** the inode number, and the `Links` count.

**Question 11.** `stat` reports `Size` and `Blocks`. Multiply the block count by 512 and
compare it to the size. Explain the difference in one sentence.

### 3.2 A second name for the same file

```bash
ln notes.txt hard-link.txt

ls -li notes.txt hard-link.txt
stat notes.txt | grep Links
```

Both names, one inode, link count 2. Prove they are the same file rather than a copy:

```bash
echo "added through the second name" >> hard-link.txt
cat notes.txt
```

### 3.3 A file that contains a path

```bash
ln -s /srv/data/notes.txt sym-link.txt

ls -li notes.txt hard-link.txt sym-link.txt
stat sym-link.txt | head -3
readlink -f sym-link.txt
```

**Question 12.** The symlink has its own inode and a size of a few dozen bytes. What
exactly are those bytes, and why did creating it leave the link count on `notes.txt`
unchanged?

### 3.4 Rename the original, and see what breaks

```bash
mv notes.txt renamed.txt

ls -li renamed.txt hard-link.txt sym-link.txt
cat hard-link.txt      # still works
cat sym-link.txt       # ?
```

**Record in your journal:** what happened to each of the two links, and why.

Restore the name so the next section starts from a known state:

```bash
mv renamed.txt notes.txt
cat sym-link.txt
```

### 3.5 Delete the original

```bash
rm notes.txt

ls -li hard-link.txt sym-link.txt
cat hard-link.txt      # the data is still here
cat sym-link.txt       # and this now dangles
find . -xtype l        # find dangling symlinks
stat hard-link.txt | grep Links
```

**Question 13.** The file you "deleted" is still readable through `hard-link.txt`. Explain
what `rm` actually did, and state the condition under which the data blocks would have been
released.

### 3.6 The two things a hard link cannot do

```bash
ln /srv/data/hard-link.txt ~/elsewhere.txt
mkdir /srv/data/subdir
ln /srv/data/subdir /srv/data/subdir-link
```

**Record in your journal:** both error messages, exactly.

**Question 14.** Explain each failure in terms of what a directory entry actually stores.
Neither is a policy decision; both fall out of the data structure.

### 3.7 Directory link counts

```bash
mkdir -p /srv/data/project/{src,docs,tests}
ls -ld /srv/data/project
```

**Question 15.** The link count on `project` is not 1. Say what number it is, and account
for every link.

### 3.8 Who may delete a file

```bash
mkdir /srv/data/shared
echo "not yours" > /srv/data/shared/theirs.txt
chmod 444 /srv/data/shared/theirs.txt

rm /srv/data/shared/theirs.txt      # answer the prompt with y
ls /srv/data/shared
```

A read-only file, removed without complaint.

```bash
ls -ld /tmp
```

**Question 16.** Which permission, on which object, actually governed that deletion? Then
explain what the `t` on `/tmp` prevents, and why `/tmp` specifically needs it.

---

## Part 4: Two failures, on purpose

Both of these are failures you will otherwise meet for the first time on a production
machine at an inconvenient hour. Cause them here instead.

### 4.1 Build a deliberately small filesystem

You cannot exhaust the inodes on a 10 GB volume in a reasonable amount of time, so make a
tiny filesystem. A file can act as a block device, through a **loop device**:

```bash
cd ~
truncate -s 64M small.img
mkfs.ext4 -F -N 128 small.img
```

**Record in your journal:** the inode count `mkfs` reports, and the block size. You asked
for 128 inodes; note what it actually chose. The block size will not match the one you
recorded in Part 1.4 — `mke2fs` sizes it to the filesystem, so a 64 MB image gets 1 KiB
blocks where a 10 GB volume gets 4 KiB.

```bash
sudo mkdir -p /mnt/small
sudo mount -o loop ~/small.img /mnt/small
sudo chown $USER:$USER /mnt/small

df -h /mnt/small
df -i /mnt/small
sudo losetup -a
```

**Question 17.** `lsblk` now shows a `loop` device. In one sentence, what is a loop device,
and how does it fit the four-layer model from the notes?

### 4.2 Run out of inodes

```bash
for i in $(seq 1 500); do
  touch /mnt/small/file-$i 2>/tmp/touch-error && continue
  echo "stopped at $i"; cat /tmp/touch-error; break
done
```

Then look at the filesystem two ways:

```bash
df -h /mnt/small
df -i /mnt/small
```

**Record in your journal:** the error message, the number of files you managed to create,
and both `df` outputs side by side.

**Question 18.** The error says "No space left on device" and `df -h` shows the filesystem
nearly empty. Reconcile those two facts. Then explain why you could not fix this with
`resize2fs`.

**Question 19.** You created fewer files than the inode count. Where did the missing inodes
go?

Clean up:

```bash
sudo umount /mnt/small
rm ~/small.img
sudo rmdir /mnt/small
```

### 4.3 Delete a file that something has open

```bash
dd if=/dev/zero of=/srv/data/big.log bs=1M count=512
df -h /srv/data
```

Now give it a reader that holds the file open, and note the job number:

```bash
tail -f /srv/data/big.log > /dev/null &
jobs
```

Delete it:

```bash
rm /srv/data/big.log

ls -l /srv/data
du -sh /srv/data
df -h /srv/data
```

**Record in your journal:** all three outputs. The file is gone from `ls`, `du` does not
count it, and `df` has not moved.

Find it:

```bash
sudo lsof +L1
```

**Question 20.** Two columns in that output identify the situation precisely. Name them and
say what each one is telling you.

Now release it and watch the space come back:

```bash
kill %1
sleep 2
df -h /srv/data
```

### 4.4 Do it the right way instead

```bash
dd if=/dev/zero of=/srv/data/big.log bs=1M count=512
tail -f /srv/data/big.log > /dev/null &

df -h /srv/data
truncate -s 0 /srv/data/big.log
df -h /srv/data

ls -l /srv/data/big.log
kill %1
rm /srv/data/big.log
```

**Question 21.** The space came back immediately this time, and the reader never noticed.
Explain why, in terms of inodes and link counts. Then state the rule you would give a
junior administrator about reclaiming space from a log file that a running service is
writing to.

---

## Challenge problems

Optional, and each goes past what the lecture covered.

### Challenge 1: Mount options as a security boundary

Remount `/srv/data` with `noexec` and `nosuid`, then prove the options do what they claim:

```bash
cp /bin/echo /srv/data/echo-copy
/srv/data/echo-copy "this works now"

sudo mount -o remount,noexec,nosuid /srv/data
/srv/data/echo-copy "and now?"
```

Record the error. Then explain why `bash /srv/data/some-script.sh` would still run even
with `noexec` in effect, and what that implies about `noexec` as a defense.

Put the entry in `/etc/fstab` so the options survive a reboot, verify with
`findmnt /srv/data`, and confirm the options are what you intended.

### Challenge 2: The data that vanishes

Unmount `/srv/data`, write a file into the now-empty mount point, and mount the disk back
on top of it:

```bash
sudo umount /srv/data
echo "where does this live?" | sudo tee /srv/data/orphan.txt
sudo mount /dev/sdb1 /srv/data
ls /srv/data
```

The file is gone. Find where it actually is, and prove it, without unmounting `/srv/data`
again. A bind mount of `/` somewhere else will let you see the root filesystem underneath
the mount point.

Explain in your journal why this is a genuine operational hazard rather than a curiosity,
and name the condition under which a service would produce exactly this situation by
itself. Then clean up the orphaned file.

### Challenge 3: Grow the whole stack

Resize the disk to 20 GB, and carry the new space all the way up to the filesystem:

```bash
gcloud compute disks resize csc171-data --size=20GB --zone=us-central1-a
```

Then, on the VM, observe what `lsblk` reports at each of the three layers before you touch
anything. Grow the partition with `growpart`, then the filesystem with `resize2fs`, running
`lsblk` and `df -h` between every step.

Record, for each of the three layers, what its size was before and after. Do the whole
thing without unmounting the filesystem, and explain in your journal why that is possible
for ext4 growing but not for ext4 shrinking.

### Challenge 4: A second filesystem type

Add a second partition to the data disk and put XFS on it. Mount it, run `xfs_info`, and
compare what it reports to the `dumpe2fs -h` output from Part 1.4. Then try to shrink it,
record what happens, and write two sentences on when that limitation would decide your
choice of filesystem.

### Challenge 5: A swap file

Add 1 GB of swap as a file rather than a partition, verify with `swapon --show` and
`free -h`, and make it persist across a reboot. Explain why `chmod 600` on the swap file is
not optional, and why the `fstab` entry for it uses `none` where every other line names a
directory.

---

## Cleanup

**Do this when you are finished, or the disk keeps billing.**

On the VM, remove the `fstab` entry *before* the disk goes away:

```bash
sudo umount /srv/data
sudo sed -i '/srv\/data/d' /etc/fstab
sudo findmnt --verify --verbose
sudo systemctl daemon-reload
```

Then, from Cloud Shell:

```bash
gcloud compute instances detach-disk vm-171 \
  --project=$PROJECT --zone=us-central1-a --disk=csc171-data

gcloud compute disks delete csc171-data --project=$PROJECT --zone=us-central1-a
```

Detaching a disk that is still mounted is how filesystems get corrupted, and an `fstab`
entry naming a disk that no longer exists is exactly the entry that stops a boot. The order
above is the point of the exercise.

If you want to keep the disk for later labs, skip the two `gcloud` commands and leave the
`fstab` entry in place — but then verify with `sudo findmnt --verify` and one more reboot
that the machine still comes back cleanly.

---

## Deliverables

Submit the following in your `mdbook` learning journal:

1. The three confirmation commands and outputs from Part 1.2, with your one-sentence
   identification of the device
2. The block size, block count, and inode count from Part 1.4
3. Your `/etc/fstab` line, and the output of `findmnt --verify` and `mount -a` from both
   Part 2.3 and Part 2.4
4. The `ls -li` output from Part 3 at three moments: after creating both links, after
   renaming the original, and after deleting it
5. Both error messages from Part 3.6
6. The inode exhaustion evidence from Part 4.2: the error, and `df -h` beside `df -i`
7. The `lsof +L1` line from Part 4.3
8. Your answers to Questions 1 through 21
9. A short paragraph — five sentences is plenty — on what you would check, in order, if a
   colleague reported that a server had "no disk space" and `df -h` disagreed with them
