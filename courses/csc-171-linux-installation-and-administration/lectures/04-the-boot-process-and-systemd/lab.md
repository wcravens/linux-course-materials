---
title: 'Lab: Watching a Machine Boot, and Taking Control of Its Services'
subtitle: CSC 171 — Lecture 4
---

## Overview

This lab has four parts, in order. The first two are observation: you will read your own
VM's boot from the outside and measure it from the inside. The last two are control: you
will drive `systemd` against the nginx server you built in Lab 3, and then deliberately
break it so that you can practice the recovery on a machine that does not matter.

Work at your own pace. Everything here runs on the Compute Engine VM you have already
built, and nothing in it can put the machine into a state you cannot recover from.

**Before you start**, you need two things:

- Your VM running, and `gcloud` authenticated on whatever machine you run it from — the
  Cloud Shell is fine
- nginx installed and serving your `mdbook` site from Lab 3

Throughout, replace `vm-171` with your instance name and `us-central1-a` with your zone.
Save your answers in your `mdbook` learning journal as you go; several of the exercises ask
you to record output, and Part 2 asks you to publish an image to it.

---

## Part 1: Watch your own machine boot

The whole boot happens before `sshd` exists, so none of it is visible from an SSH session.
It was written to the serial console, and Google kept it.

### 1.1 Capture the log

From Cloud Shell, or anywhere `gcloud` is authenticated:

```bash
gcloud compute instances get-serial-port-output vm-171 \
  --zone=us-central1-a > boot.log

wc -l boot.log
```

If the output is short, reboot the instance and capture again — the buffer holds a limited
amount, and a long-running machine may have scrolled its own boot away.

```bash
gcloud compute instances reset vm-171 --zone=us-central1-a
```

Wait a minute, then capture again.

### 1.2 Find the four phases

Read through `boot.log` and locate one line marking the start of each phase. You are
looking for something like the following, though the exact text varies by image:

Table: What to search for in the serial log to identify each boot phase

| Phase | Look for | Suggested search |
| --- | --- | --- |
| 1 — Firmware | A BIOS or UEFI banner, and "Booting from Hard Disk" | `grep -i -n 'seabios\|booting from'` |
| 2 — Bootloader | GRUB loading a kernel and an initial ramdisk | `grep -i -n 'loading.*ramdisk\|grub'` |
| 3 — Kernel | The first bracketed timestamp, and the kernel version | `grep -n 'Linux version'` |
| 4 — PID 1 | The first `[  OK  ]` line from systemd | `grep -n -m1 'OK.*Reached target'` |

**Record in your journal:** the line number and the text of one line for each of the four
phases.

### 1.3 Find the handoffs

Three more lines are worth finding, because each is a handoff you can now name:

```bash
grep -n 'Run /init as init process' boot.log      # kernel → initramfs
grep -n 'EXT4-fs.*mounted filesystem' boot.log    # the real root filesystem appears
grep -n 'Reached target Multi-User System' boot.log   # boot is finished
```

**Question 1.** Roughly how many seconds elapsed between the first kernel message and
`Reached target Multi-User System`? The bracketed numbers are seconds since the kernel
started.

### 1.4 Confirm what you read, from inside

SSH into the VM and verify the pieces you just saw from the outside:

```bash
cat /proc/cmdline
uname -r
ls -lh /boot/
ls -l /sbin/init
ps -p 1 -o pid,comm,args
```

**Question 2.** Which parameter in `/proc/cmdline` is the reason the serial log you just
read exists at all?

**Question 3.** `ls -l /sbin/init` shows a symlink. What does it point to, and why does the
name `init` still exist?

### 1.5 Look inside the initramfs

```bash
lsinitramfs /boot/initrd.img-$(uname -r) | wc -l
lsinitramfs /boot/initrd.img-$(uname -r) | grep -c '\.ko'
lsinitramfs /boot/initrd.img-$(uname -r) | grep 'bin/' | head -20
```

**Question 4.** In one or two sentences: why does an initramfs have to exist at all? What
would go wrong if the kernel simply tried to mount the root filesystem directly?

---

## Part 2: Measure the boot

Now the same boot, from the inside, with numbers.

### 2.1 Overall timing

```bash
systemd-analyze
```

**Record in your journal:** the kernel time, the userspace time, and the total.

### 2.2 What was slow

```bash
systemd-analyze blame | head -15
```

### 2.3 What was actually blocking

```bash
systemd-analyze critical-chain
```

**Question 5.** Compare the two outputs. Name one unit that appears near the top of `blame`
but is *not* on the critical chain. Why would optimizing that unit not make the boot any
faster?

### 2.4 Publish a boot timeline

`systemd-analyze plot` produces an SVG timeline of the whole boot. You already have a web
server; use it.

```bash
systemd-analyze plot > ~/boot.svg
sudo cp ~/boot.svg /var/www/html/csc171/src/boot.svg
```

Add a page to your `mdbook` journal that embeds it, and rebuild:

```bash
cd /var/www/html/csc171
sudo mdbook build
```

Then open it in a browser. Each horizontal bar is a unit; the red portion is time spent
activating.

**Deliverable:** the URL of your published boot timeline.

---

## Part 3: Drive systemd

Everything in this part uses the nginx you installed in Lab 3.

### 3.1 Survey the machine

```bash
systemctl list-units --type=service --state=running
systemctl list-units --type=service --state=running | wc -l
systemctl --failed
systemctl get-default
```

**Question 6.** How many services are running on a machine on which you are doing nothing?
Does `systemctl --failed` report anything?

### 3.2 Read a status output completely

```bash
systemctl status nginx
```

Identify each of the following in the output, and record what each one says:

Table: The fields to identify in `systemctl status` output

| Field | What it tells you |
| --- | --- |
| The coloured dot | Summary of the `Active` state |
| `Loaded:` path | Which unit file is actually in effect |
| `Loaded:` enabled state | Whether it starts at boot |
| `Active:` state | Whether it is running, and for how long |
| `Main PID:` | The process systemd is supervising |
| `CGroup:` tree | Every process belonging to this service |
| The last lines | The most recent journal entries for this unit |

### 3.3 Stop, start, restart, reload

Open a second SSH session and leave this running in it, so you can watch what each command
actually does:

```bash
journalctl -u nginx -f
```

Back in the first session, run each of these, checking your site in a browser and watching
the journal after each one:

```bash
sudo systemctl stop nginx
systemctl is-active nginx          # what does this print, and what is the exit status?
echo $?

sudo systemctl start nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
```

**Question 7.** Compare the journal output from `restart` with the journal output from
`reload`. What is different, and why does that difference matter on a server with users
connected?

### 3.4 Read the unit file

```bash
systemctl cat nginx
```

**Question 8.** Find the `[Install]` section. What target does `WantedBy=` name? Find
`ExecReload=`. What command does `systemctl reload nginx` actually run?

### 3.5 Enabled versus started

```bash
systemctl is-enabled nginx
systemctl is-active nginx
```

Now demonstrate to yourself that these are independent:

```bash
sudo systemctl stop nginx
systemctl is-enabled nginx     # still enabled
systemctl is-active nginx      # not active

sudo systemctl start nginx
```

### 3.6 Find the symlink

```bash
ls -l /etc/systemd/system/multi-user.target.wants/ | grep nginx
```

**Question 9.** In your own words, in two sentences: what does `systemctl enable` actually
do to the filesystem, and how does that produce a service that starts at boot?

---

## Part 4: Break it, then fix it

This part is a failure you cause deliberately, on a machine you can rebuild. Do it now, at
your desk, with time to think — because the alternative is performing this sequence for the
first time on a machine that matters, under pressure.

### 4.1 First, make the journal persistent

Do this **before** breaking anything, because the whole point of the exercise is reading
logs from a boot that has already ended.

```bash
journalctl --list-boots
```

If that shows one line or none, your journal is volatile. Fix it:

```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald

journalctl --list-boots
```

### 4.2 Break it

```bash
sudo systemctl disable nginx
systemctl is-enabled nginx
systemctl is-active nginx
```

Note that your site is **still up**. The service is running; it simply will not come back.
This is exactly the state described in lecture as "the change nobody documented."

Now reboot:

```bash
sudo systemctl reboot
```

Wait, then SSH back in and load your site in a browser.

### 4.3 Diagnose it

Do not fix it yet. Practice the diagnostic sequence in order, and record what each step
tells you:

```bash
systemctl --failed
systemctl status nginx
journalctl -u nginx -b
journalctl -u nginx -b -1
journalctl --list-boots
```

**Question 10.** `systemctl --failed` does not list nginx, and `systemctl status nginx`
does not report an error. Why not? What is the one word in the `status` output that
explains why the site is down?

**Question 11.** What does `journalctl -u nginx -b` show, and why is it different from
`journalctl -u nginx -b -1`? What would you have seen at step 4.3 if you had skipped
step 4.1?

### 4.4 Fix it, permanently

```bash
sudo systemctl enable --now nginx
systemctl is-enabled nginx
systemctl is-active nginx
```

Then prove the fix rather than assuming it:

```bash
sudo systemctl reboot
```

SSH back in, load your site, and confirm:

```bash
systemctl is-enabled nginx && systemctl is-active nginx && echo "verified"
```

**Question 12.** Why is `enable --now` the right command here, rather than `start`?

---

## Challenge problems

These are optional, and each goes past what the lecture covered.

### Challenge 1: A drop-in override

nginx as packaged does not restart itself if it crashes. Change that without editing the
packaged unit file:

```bash
sudo systemctl edit nginx
```

Add a `[Service]` section setting `Restart=always` and `RestartSec=5`. Then verify:

```bash
systemctl cat nginx        # your drop-in should appear below the packaged unit
```

Test it by killing the master process with `sudo kill -9` and watching
`journalctl -u nginx -f`. Confirm that systemd brings it back, and confirm which file your
change actually landed in.

### Challenge 2: `mask`

Pick a service you are certain you do not need — `apt-daily.service` is a safe choice on a
lab VM. Disable it, then verify with `systemctl status` that it is disabled. Then mask it
and try to start it by hand.

```bash
sudo systemctl start apt-daily
```

Record the exact error. Then find the symlink `mask` created and explain, using the unit
directory precedence table from the notes, why an empty unit file can override a real one.
Unmask it when you are done.

### Challenge 3: A boot you can watch

Enable the interactive serial console and use it to see the GRUB menu:

```bash
gcloud compute instances add-metadata vm-171 --zone=us-central1-a \
  --metadata serial-port-enable=TRUE

gcloud compute connect-to-serial-port vm-171 --zone=us-central1-a
```

From a second terminal, reset the instance. Watch the console, and try to catch the GRUB
menu. You will likely need to raise `GRUB_TIMEOUT` in `/etc/default/grub` first — set it to
5, run `sudo update-grub`, and reboot.

Once you can see the menu, press <kbd>e</kbd> and read the `linux` line. Compare it to what
`cat /proc/cmdline` printed in Part 1. Then boot normally without changing anything.

**Set `GRUB_TIMEOUT` back to 0 and run `update-grub` when you are finished.**

### Challenge 4: A monitoring script

Write a short shell script that checks whether nginx is both enabled and active, and prints
a one-line report. Use the exit status of `systemctl is-active --quiet` and
`systemctl is-enabled --quiet` rather than parsing text output, and explain in a comment why
that is the more robust approach.

---

## Deliverables

Submit the following in your `mdbook` learning journal:

1. The four boot-phase lines you identified in Part 1.2, with line numbers
2. Your answers to Questions 1 through 12
3. Your `systemd-analyze` timings, and the published URL of your `boot.svg`
4. A short paragraph — five sentences is plenty — describing what you would check first,
   second, and third if a server came back from a reboot with a service missing
