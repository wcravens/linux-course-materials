---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'The Boot Process and systemd'
info: |
  ## CSC 171 — Lecture 4
  What happens between pressing the power button and a login prompt: firmware,
  bootloader, kernel, and initramfs — then systemd, the program that owns the
  machine from PID 1 onward, and the commands that drive it.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---

# The Boot Process and systemd

CSC 171 — Linux Installation and Administration

Lecture 4

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Name the four phases of a Linux boot and say what each one hands to the next
- Explain what UEFI firmware does, and how it differs from legacy BIOS
- Read a kernel command line and identify what GRUB passed to the kernel
- Explain why an **initramfs** exists, and what breaks when it is wrong
- Prove that `systemd` is PID 1 on your own machine
- Describe a systemd **unit**, and where unit files live and which one wins
- Map the old runlevels onto **targets**
- Manage services with `systemctl`: list, start, stop, restart, reload
- Distinguish **starting** a service from **enabling** it
- Read a service's logs with `journalctl`, including the boot that already failed

---

# Why This Matters for Administration

Last week I gave you the boot sequence in three bullets:

> The kernel starts a few of its own activities, launches `init` at PID 1, and `init`
> starts `systemd`, which starts all the system services.

That is true, and almost useless. Each of those handoffs is a place a machine can fail —
and a machine that does not come back after a reboot is the worst call you will get.

- You cannot fix a boot you cannot describe
- You cannot fix a service you cannot inspect
- On a cloud VM there is nobody to walk over and look at the screen

Today: what actually happens, and how you drive the part that matters most.

---
layout: section
---

# From Power to PID 1

Four programs, each of which exists only to start the next one

---

# The Four Phases

<div class="viz">
<svg viewBox="0 0 860 250" role="img" aria-label="Four boxes in a row showing the boot handoff chain. Firmware, labelled UEFI or BIOS, hands a boot program to the bootloader, GRUB. GRUB hands a kernel plus initramfs plus a command line to the kernel. The kernel hands a mounted root filesystem to PID 1, systemd. systemd then reaches the default target.">
  <defs>
    <marker id="phase-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--muted)" />
    </marker>
  </defs>
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="10"  y="60" width="170" height="64" rx="6" />
    <rect x="240" y="60" width="170" height="64" rx="6" />
    <rect x="470" y="60" width="170" height="64" rx="6" />
  </g>
  <rect x="690" y="60" width="160" height="64" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g style="stroke: var(--muted); stroke-width: 1.5; fill: none">
    <line x1="180" y1="92" x2="236" y2="92" marker-end="url(#phase-arrow)" />
    <line x1="410" y1="92" x2="466" y2="92" marker-end="url(#phase-arrow)" />
    <line x1="640" y1="92" x2="686" y2="92" marker-end="url(#phase-arrow)" />
  </g>
  <g class="val" text-anchor="middle" dominant-baseline="middle">
    <text x="95"  y="84">1 · Firmware</text>
    <text x="325" y="84">2 · Bootloader</text>
    <text x="555" y="84">3 · Kernel</text>
    <text x="770" y="84">4 · PID 1</text>
  </g>
  <g class="cat" text-anchor="middle" dominant-baseline="middle" style="font-size: 14px">
    <text x="95"  y="106">UEFI or BIOS</text>
    <text x="325" y="106">GRUB</text>
    <text x="555" y="106">vmlinuz</text>
    <text x="770" y="106">systemd</text>
    <text x="208" y="150">hands over</text>
    <text x="438" y="150">hands over</text>
    <text x="663" y="150">hands over</text>
    <text x="208" y="176">a boot</text>
    <text x="208" y="196">program</text>
    <text x="438" y="176">kernel +</text>
    <text x="438" y="196">initramfs</text>
    <text x="663" y="176">a mounted</text>
    <text x="663" y="196">root fs</text>
  </g>
</svg>

<p class="cap">Each phase does one job: find the next thing, load it, and get out of the way.</p>

</div>

---

# Phase 1: Firmware

The first code the CPU runs does not come from your disk. It comes from a chip on the
motherboard.

Its job is short:

1. **POST** — power-on self test; check the CPU, RAM, and attached devices
2. **Enumerate** what it can boot from, in a configured order
3. **Load** the first thing that looks bootable, and jump to it

Then it is done. The firmware does not know what Linux is, and never will.

<div class="notes">

On a cloud VM the firmware is virtual — it is code the hypervisor runs on your behalf —
but the sequence is the same, and it still leaves its output on the serial console.

</div>

---

# BIOS vs. UEFI

| | Legacy BIOS | UEFI |
| --- | --- | --- |
| Where boot code lives | First 512 bytes of the disk (the **MBR**) | A file on a FAT32 partition |
| How much code | **440 bytes** | A full program, as large as it likes |
| Partition scheme | MBR — four primary partitions, 2 TB limit | **GPT** — 128 partitions, exabyte scale |
| Finding the OS | Chainload: tiny code loads bigger code | Firmware reads a filesystem and runs a program |
| Signature checking | None | **Secure Boot**, if enabled |

440 bytes is not enough room to understand a filesystem. Everything awkward about legacy
booting descends from that one number.

---

# The EFI System Partition

UEFI can read exactly one kind of filesystem: FAT32. The partition it reads is the **ESP**,
and Linux mounts it so you can look at it.

```bash
lsblk
# NAME    MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
# sda       8:0    0  10G  0 disk
# ├─sda1    8:1    0 9.9G  0 part /
# └─sda15   8:15   0  99M  0 part /boot/efi

ls /boot/efi/EFI/
# debian  BOOT
```

```bash
sudo efibootmgr -v
# BootCurrent: 0000
# Boot0000* debian   HD(15,GPT,...)/File(\EFI\debian\shimx64.efi)
```

That last line is the whole of phase 1: a boot entry naming a program on a partition.

---

# What the Firmware Hands Over

A **boot program**, and nothing else.

- On UEFI: the `.efi` binary named in the boot entry — usually `shimx64.efi`, which
  verifies and then loads `grubx64.efi`
- On BIOS: 440 bytes of stage-1 code that knows only where stage 1.5 lives

The firmware has no idea it just started Linux. It would have loaded Windows the same way.

<div class="notes">

`shimx64.efi` is the Secure Boot shim: a small loader signed by Microsoft's key, which
firmware trusts out of the box, that in turn checks the distribution's own signature on
GRUB. If Secure Boot is off, `grubx64.efi` may be loaded directly.

</div>

---

# Phase 2: The Bootloader

GRUB — the **GR**and **U**nified **B**ootloader — is the first program that knows what an
operating system is.

Its job:

1. Read its own configuration
2. Present a menu, if there is more than one choice and anyone is watching
3. Find the **kernel** and the **initramfs** on disk, and load both into memory
4. Build a **command line** to hand the kernel
5. Jump to the kernel's entry point

GRUB is the only piece of this chain that knows both the firmware's world and Linux's.

---

# The GRUB Menu You Never See

On your VM the menu is there. It just does not wait.

```bash
grep TIMEOUT /etc/default/grub
# GRUB_TIMEOUT=0
# GRUB_RECORDFAIL_TIMEOUT=0
```

A server has no keyboard and nobody watching, so a timeout of zero is correct — it saves
seconds on every reboot.

It also means **the recovery menu is invisible unless you go looking for it**. We will
come back to that.

---

# `/etc/default/grub` and `grub.cfg`

Two files. Only one of them is yours.

<div class="grid grid-cols-2 gap-8">
<div>

### `/etc/default/grub`

- Short, commented, human-sized
- Timeout, default entry, kernel arguments
- **Edit this one**

</div>
<div>

### `/boot/grub/grub.cfg`

- Hundreds of lines of generated shell
- Says `DO NOT EDIT THIS FILE` at the top
- Rewritten by every kernel update

</div>
</div>

```bash
sudo nano /etc/default/grub
sudo update-grub          # Debian and Ubuntu
# grub-mkconfig -o /boot/grub/grub.cfg   is what it runs
```

Editing the generated file works right up until the next kernel upgrade silently discards
your change.

---

# The Kernel Command Line

Everything GRUB tells the kernel arrives as one string, and the kernel keeps it:

```bash
cat /proc/cmdline
# BOOT_IMAGE=/boot/vmlinuz-6.1.0-18-cloud-amd64 root=UUID=8d2a...  ro
# console=ttyS0,115200 net.ifnames=0 scsi_mod.use_blk_mq=Y
```

| Parameter | What it does |
| --- | --- |
| `root=UUID=...` | Which partition to mount as `/` — GRUB found the kernel, the kernel finds the rest |
| `ro` | Mount root read-only at first; remounted read-write once checked |
| `console=ttyS0,115200` | Send kernel messages to the **serial port** as well as the screen |
| `net.ifnames=0` | Use `eth0` naming instead of predictable interface names |

That `console=ttyS0` is the reason a cloud VM has a readable boot log at all.

---

# Editing the Boot Line, Once

The recovery skill worth remembering: at the GRUB menu, press <kbd>e</kbd>.

- You get an editor on **that entry only**
- Change the `linux` line — add `single` for single-user mode, or `systemd.unit=rescue.target`
- <kbd>Ctrl</kbd>-<kbd>x</kbd> boots with your change
- Nothing is written to disk — **the next boot is unaffected**

```
linux /boot/vmlinuz-6.1.0-18-cloud-amd64 root=UUID=8d2a... ro single
```

This is how you get into a machine whose root password works but whose services do not.

---

# Phase 3: The Kernel

GRUB jumps to the kernel, and the kernel takes over the hardware for good.

1. **Decompress itself** — `vmlinuz` is a compressed image with a small stub that unpacks it
2. **Initialize** the CPU, memory management, and the scheduler
3. **Mount the initramfs** as a temporary root filesystem
4. **Load drivers** it needs to reach the real disk
5. **Mount the real root** filesystem at `/`
6. **Execute** `/sbin/init` as **PID 1**

From step 6 onward, the kernel never runs a program again on its own. Everything else on
the machine descends from PID 1.

---

# Reading the Kernel's Own Log

The kernel writes every message from those steps into a fixed-size ring buffer. `dmesg`
reads it.

```bash
sudo dmesg | head -30       # the earliest messages, from before any filesystem existed
sudo dmesg -T               # human-readable timestamps instead of seconds-since-boot
sudo dmesg --level=err,warn # only what went wrong
sudo dmesg -w               # follow, like tail -f
```

```bash
sudo dmesg -T | grep -i 'sda\|nvme'
# [Mon Sep  8 09:14:02 2025] sd 0:0:1:0: [sda] 20971520 512-byte logical blocks
```

Hardware that is missing, a disk that is misbehaving, an out-of-memory kill — all of it
lands here first.

---

# The initramfs

Step 3 is the one that looks unnecessary. It is not.

**The chicken-and-egg:** to mount the root filesystem, the kernel needs a driver for the
disk controller — and the driver is a file *on the root filesystem*.

The **initramfs** breaks the loop. It is a small compressed archive, sitting next to the
kernel, that GRUB loads into memory alongside it.

```bash
ls -lh /boot/
# vmlinuz-6.1.0-18-cloud-amd64      8.0M
# initrd.img-6.1.0-18-cloud-amd64    32M

lsinitramfs /boot/initrd.img-$(uname -r) | head -20
```

Inside is just enough userspace — drivers, `udev`, a shell — to find the real root, mount
it, and hand off. Then it is discarded from memory.

---

# Why the initramfs Is an Admin Concern

You will never think about it until the day it ruins your afternoon.

An initramfs must contain a driver for **every** layer between the kernel and `/`:

- Encrypted root — the LUKS module, and the prompt that asks for the passphrase
- **LVM** or software **RAID** — the tools to assemble the volume before it can be mounted
- An unusual disk controller, or a NIC for a network root

```bash
sudo update-initramfs -u          # rebuild for the running kernel
sudo update-initramfs -u -k all   # rebuild for every installed kernel
```

A kernel upgrade whose initramfs was not regenerated produces a machine that loads a
kernel, cannot find its own disk, and drops to a `(initramfs)` prompt. It is not a
mystery once you know where to look — but you have to be at a console to see it.

---

# Phase 4: PID 1

The kernel executes `/sbin/init`. On every distribution in this course, that file is a
lie of long standing:

```bash
ls -l /sbin/init
# lrwxrwxrwx 1 root root 20 Mar  5 08:22 /sbin/init -> /lib/systemd/systemd

ps -p 1 -o pid,comm,args
#   PID COMMAND         COMMAND
#     1 systemd         /sbin/init
```

`systemd` **is** PID 1. The name `init` survives because forty years of documentation,
scripts, and kernel defaults expect it to be there.

This is the command I asked you to run last week. Now you know what it was proving.

---

# Watching All Four Phases on a Cloud VM

You cannot stand in front of your VM. You do not need to — everything above was written
to the serial port, and Google captured it.

```bash
gcloud compute instances get-serial-port-output vm-171 --zone=us-central1-a
```

```bash
# save it, then read it at your leisure
gcloud compute instances get-serial-port-output vm-171 \
  --zone=us-central1-a > boot.log
wc -l boot.log
```

This is the cloud equivalent of pulling up a chair and watching the screen. It is
available whether or not the machine finished booting, and whether or not `sshd` ever
started — which is exactly when you need it.

---

# An Annotated Boot Log

<div class="viz">
<svg viewBox="0 0 860 300" role="img" aria-label="An excerpt of serial console output with the four boot phases bracketed down the left margin. Firmware lines at the top, then GRUB loading the kernel and initramfs, then kernel messages including the root filesystem mount, then systemd reporting units as it starts them.">
  <g style="stroke: var(--bar); stroke-width: 2.5; fill: none">
    <line x1="14" y1="18"  x2="14" y2="56" />
    <line x1="14" y1="74"  x2="14" y2="112" />
    <line x1="14" y1="130" x2="14" y2="192" />
    <line x1="14" y1="210" x2="14" y2="272" />
  </g>
  <g class="val" style="font-size: 13px" dominant-baseline="middle">
    <text x="26" y="37">1</text>
    <text x="26" y="93">2</text>
    <text x="26" y="161">3</text>
    <text x="26" y="241">4</text>
  </g>
  <g class="cat" style="font-size: 13.5px; font-family: ui-monospace, monospace" dominant-baseline="middle">
    <text x="52" y="26">SeaBIOS / UEFI firmware, Google Compute Engine</text>
    <text x="52" y="48">Booting from Hard Disk...</text>
    <text x="52" y="82">GRUB loading linux 6.1.0-18-cloud-amd64 ...</text>
    <text x="52" y="104">Loading initial ramdisk ...</text>
    <text x="52" y="138">[    0.000000] Linux version 6.1.0-18-cloud-amd64</text>
    <text x="52" y="160">[    0.984213] Run /init as init process</text>
    <text x="52" y="182">[    2.117740] EXT4-fs (sda1): mounted filesystem</text>
    <text x="52" y="218">[  OK  ] Reached target Basic System.</text>
    <text x="52" y="240">[  OK  ] Started OpenBSD Secure Shell server.</text>
    <text x="52" y="262">[  OK  ] Reached target Multi-User System.</text>
  </g>
</svg>

<p class="cap">One capture, four phases. The bracket numbers match the diagram from the start of this section.</p>

</div>

---

# The Interactive Serial Console

Reading the log is one thing. Getting a **prompt** on a machine that will not finish
booting is another.

```bash
gcloud compute instances add-metadata vm-171 --zone=us-central1-a \
  --metadata serial-port-enable=TRUE

gcloud compute connect-to-serial-port vm-171 --zone=us-central1-a
```

Reboot the instance while connected and you are watching the console live — including the
GRUB menu, where <kbd>e</kbd> still works.

<div class="notes">

This is the closest thing a cloud VM has to physical presence, and it does not depend on
the network stack, `sshd`, or the root filesystem being mountable. It is also a real
security consideration: anyone with the right IAM permission gets console access. Some
organizations disable it at the project level for exactly that reason.

</div>

---
layout: section
---

# systemd Takes Over

The program that owns everything from PID 1 onward

---

# What systemd Actually Is

Calling systemd an "init system" undersells it, which is why arguments about it go in
circles.

It is at least four things at once:

- The **first process**, PID 1, and therefore the ancestor of everything and the reaper of
  orphans
- A **service manager** — it starts daemons, watches them, and restarts them when they die
- A **dependency resolver** — it computes what must happen before what, and runs the rest
  in parallel
- A **logging system** — `journald` captures the output of every service it starts

Plus device management, mount handling, timers, sockets, user sessions, and more. That
breadth is both the strongest argument for it and the loudest argument against it.

---

# Why It Replaced SysV init

The old system ran numbered shell scripts in `/etc/rc*.d/`, one at a time, in
lexical order.

| Problem | Consequence |
| --- | --- |
| Strictly sequential | Boot took as long as the sum of every service, however idle the CPU |
| Ordering by filename | `S20nginx` before `S30postgres` — the dependency lived in a number |
| No dependency model | A service that needed the network had to sleep and hope |
| No supervision | A daemon that crashed at 3am stayed dead until someone noticed |
| No state to query | "Is it running?" meant grepping `ps` or trusting a PID file |

systemd answers each of these directly: declared dependencies, parallel startup, real
supervision, and one command that knows the truth.

---

# The Argument, and the Shim

The objection to systemd is genuine and worth understanding: it is a large, tightly
coupled body of code holding a position — PID 1 — where failure is not recoverable, and it
absorbed responsibilities that used to belong to separate, replaceable programs.

That debate is settled in practice. Every distribution you will administer in this course
uses it.

```bash
sudo service nginx start     # still works
sudo /etc/init.d/nginx start # still works
```

Both are compatibility shims that translate into `systemctl`. They exist because thirty
years of documentation, runbooks, and muscle memory say `service`.

**Use `systemctl`.** Recognize the other two when you meet them in a tutorial.

---

# Everything Is a Unit

systemd manages one kind of thing: a **unit**. A unit is a named object with a type, a
configuration file, and a state.

```
nginx.service       multi-user.target       /boot/efi   →   boot-efi.mount
sshd.socket         logrotate.timer         dev-sda1.device
```

The name carries the type as its extension, and the extension decides what the file may
contain and how systemd activates it.

This is the abstraction that lets one command — `systemctl` — start a daemon, reach a
runlevel, mount a filesystem, and schedule a job.

---

# Unit Types

| Extension | Manages | Example |
| --- | --- | --- |
| `.service` | A daemon or one-shot process | `nginx.service` |
| `.target` | A grouping of units — a synchronization point | `multi-user.target` |
| `.socket` | A socket that starts its service on first connection | `sshd.socket` |
| `.timer` | A scheduled activation — systemd's answer to cron | `logrotate.timer` |
| `.mount` | A filesystem mount point | `boot-efi.mount` |
| `.device` | A kernel device systemd can depend on | `dev-sda1.device` |
| `.path` | Activation when a file or directory changes | `cups.path` |

Nine more exist. These seven cover almost everything you will touch.

---

# Where Unit Files Live

Three directories, one precedence order. **This is the slide to remember.**

| Directory | Owned by | Precedence |
| --- | --- | --- |
| `/etc/systemd/system/` | **You**, the administrator | **Highest — always wins** |
| `/run/systemd/system/` | Runtime, generated; gone at reboot | Middle |
| `/lib/systemd/system/` | The **package manager** | Lowest |

```bash
systemctl cat nginx     # shows the file actually in effect, and its path
```

The package ships its unit into `/lib`. If you edit that file, the next `apt upgrade`
overwrites your change without a word. Put your version — or better, an override — in
`/etc`.

<div class="notes">

On a distribution that has completed the `/usr` merge, `/lib/systemd/system` is a symlink
to `/usr/lib/systemd/system`. Both paths name the same directory; you will see either in
documentation.

</div>

---

# Targets Replace Runlevels

SysV had seven numbered runlevels. systemd has named targets, and keeps aliases so old
commands still work.

| Runlevel | Target | Meaning |
| --- | --- | --- |
| 0 | `poweroff.target` | Halt the machine |
| 1 | `rescue.target` | Single user, minimal services |
| 2, 3, 4 | `multi-user.target` | **Full multi-user, no GUI — a server** |
| 5 | `graphical.target` | Multi-user with a desktop |
| 6 | `reboot.target` | Restart |
| — | `emergency.target` | Root shell only; root mounted read-only |

```bash
systemctl get-default
# multi-user.target

sudo systemctl set-default multi-user.target
sudo systemctl isolate rescue.target     # switch now, without rebooting
```

---

# The Target Chain

<div class="viz">
<svg viewBox="0 0 800 260" role="img" aria-label="A vertical dependency chain of systemd targets. default.target is a symlink to multi-user.target, which requires basic.target, which requires sysinit.target, which requires local-fs.target and swap.target. nginx.service and ssh.service hang off multi-user.target.">
  <defs>
    <marker id="tgt-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--muted)" />
    </marker>
  </defs>
  <rect x="255" y="8" width="230" height="36" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="255" y="78"  width="230" height="36" rx="6" />
    <rect x="255" y="148" width="230" height="36" rx="6" />
    <rect x="255" y="212" width="230" height="36" rx="6" />
    <rect x="560" y="4"   width="185" height="44" rx="6" />
  </g>
  <g style="stroke: var(--muted); stroke-width: 1.5; fill: none">
    <line x1="370" y1="44"  x2="370" y2="74"  marker-end="url(#tgt-arrow)" />
    <line x1="370" y1="114" x2="370" y2="144" marker-end="url(#tgt-arrow)" />
    <line x1="370" y1="184" x2="370" y2="208" marker-end="url(#tgt-arrow)" />
    <line x1="485" y1="26"  x2="556" y2="26"  marker-end="url(#tgt-arrow)" />
  </g>
  <g class="val" text-anchor="middle" dominant-baseline="middle">
    <text x="370" y="26">multi-user.target</text>
  </g>
  <g class="cat" text-anchor="middle" dominant-baseline="middle">
    <text x="370" y="96">basic.target</text>
    <text x="370" y="166">sysinit.target</text>
    <text x="370" y="230">local-fs.target · swap.target</text>
    <text x="652" y="17">nginx.service</text>
    <text x="652" y="35">ssh.service</text>
  </g>
  <g class="cat" style="font-size: 13px" dominant-baseline="middle">
    <text x="245" y="26" text-anchor="end">default.target →</text>
    <text x="20" y="230">mounted first</text>
  </g>
</svg>

<p class="cap">Read it bottom-up: filesystems, then early boot, then a usable system, then your services.</p>

</div>

---

# Dependencies: When vs. Whether

The mistake almost everyone makes is assuming these are the same axis. They are not.

<div class="grid grid-cols-2 gap-8">
<div>

### Ordering — *when*

- `After=network.target`
- `Before=nginx.service`

Says nothing about whether the other unit is wanted. Only: if both are starting, run in
this order.

</div>
<div>

### Requirement — *whether*

- `Wants=redis.service` — start it too; carry on if it fails
- `Requires=postgresql.service` — start it too; **fail if it fails**

Says nothing about order. Both may start simultaneously.

</div>
</div>

`Requires=` without `After=` is the classic bug: systemd dutifully starts the database and
your application at the same instant, and your application cannot connect.

**You almost always want both.**

---

# Parallel Startup

Because dependencies are declared rather than implied by a filename, systemd can compute
the graph and run everything not on the critical path at once.

- Two services that need nothing from each other start simultaneously
- A service waits only for what it actually declared
- Boot takes as long as the **longest chain**, not the sum of every unit

The cost is a subtler class of bug. Under SysV a missing dependency was usually harmless,
because the filename ordering happened to be right. Under systemd it becomes a race that
fails one boot in twenty, on the busy machine, at the worst time.

---

# `systemd-analyze`

Measure the boot instead of guessing about it.

```bash
systemd-analyze
# Startup finished in 1.982s (kernel) + 4.117s (userspace) = 6.099s
# graphical.target reached after 4.102s in userspace

systemd-analyze blame | head
#  2.204s cloud-init.service
#  1.113s snapd.service
#   408ms systemd-udev-settle.service
```

```bash
systemd-analyze critical-chain     # what was actually blocking, not merely slow
systemd-analyze plot > boot.svg    # a timeline you can open in a browser
```

`blame` lists slow units. `critical-chain` tells you which slow unit was holding up the
rest — and only that one is worth fixing.

---
layout: section
---

# Driving systemd from the Command Line

The six verbs that cover most of the job

---

# `systemctl` Is the Command

One command, one shape:

```bash
systemctl VERB UNIT
```

- The `.service` extension is **optional** — `systemctl status nginx` and
  `systemctl status nginx.service` are identical
- Read-only verbs need no privilege; anything that changes state needs `sudo`
- Long output opens in a pager, exactly like `git log`. <kbd>q</kbd> quits;
  `--no-pager` suppresses it

```bash
systemctl status nginx           # no sudo needed
sudo systemctl restart nginx     # sudo needed
```

---

# Listing What Is There

```bash
systemctl list-units --type=service                  # loaded right now
systemctl list-units --type=service --state=running  # only what is running
systemctl --failed                                   # what is broken
```

```bash
systemctl list-unit-files --type=service | head
# UNIT FILE                  STATE     PRESET
# cron.service               enabled   enabled
# nginx.service              enabled   enabled
# rsync.service              disabled  disabled
```

**The distinction that matters:**

- `list-units` — units systemd has **loaded into memory** this boot
- `list-unit-files` — units **installed on disk**, whether loaded or not

A service you disabled will appear in the second list and not the first. Reach for
`--failed` first when a machine misbehaves; it is the shortest useful question you can ask.

---

# `systemctl status` — the Anatomy

```bash
systemctl status nginx
```

```
● nginx.service - A high performance web server and a reverse proxy server
     Loaded: loaded (/lib/systemd/system/nginx.service; enabled; preset: enabled)
     Active: active (running) since Mon 2025-09-08 09:14:07 UTC; 2h 3min ago
   Main PID: 1187 (nginx)
      Tasks: 3 (limit: 1116)
     Memory: 4.4M
        CPU: 91ms
     CGroup: /system.slice/nginx.service
             ├─1187 "nginx: master process /usr/sbin/nginx -g daemon on;"
             ├─1188 "nginx: worker process"
             └─1189 "nginx: worker process"

Sep 08 09:14:07 vm-171 systemd[1]: Starting A high performance web server...
Sep 08 09:14:07 vm-171 systemd[1]: Started A high performance web server.
```

Six things at a glance: **which file**, **enabled or not**, **running or not**, **for how
long**, **what processes**, and **the last ten log lines**. Nothing else in this course
packs that much into one command.

---

# Reading the Two State Lines

<div class="grid grid-cols-2 gap-8">
<div>

### `Loaded:` — on disk

`loaded (/lib/.../nginx.service; enabled; preset: enabled)`

- The path is the file **actually in effect**
- `enabled` / `disabled` — **will it start at boot?**
- `masked` — forcibly unavailable
- `preset` — what the distribution's default was

</div>
<div>

### `Active:` — right now

| State | Meaning |
| --- | --- |
| `active (running)` | Up, with processes |
| `active (exited)` | Ran once, succeeded |
| `inactive (dead)` | Stopped, no error |
| `failed` | Stopped **badly** |
| `activating` | Still starting |

</div>
</div>

The dot at the top is a summary of the second column: green for active, white for
inactive, **red for failed**.

---

# Start, Stop, Restart, Reload

| Command | Effect |
| --- | --- |
| `sudo systemctl start nginx` | Start it now |
| `sudo systemctl stop nginx` | Stop it now |
| `sudo systemctl restart nginx` | Stop, then start — **connections drop** |
| `sudo systemctl reload nginx` | Reread configuration, **keep serving** |
| `sudo systemctl reload-or-restart nginx` | Reload if the unit supports it, else restart |

Remember `HUP` from last week — the signal that tells a daemon to reread its configuration
without dying? `reload` is that same idea, with a supervisor doing the work and the unit
file deciding what "reload" means.

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Test the configuration *before* reloading. A reload of a broken config on a live server is
how a quiet afternoon ends.

---

# Start vs. Enable — Two Different Questions

<div class="viz">
<svg viewBox="0 0 760 300" role="img" aria-label="A two by two grid. The horizontal axis is enabled or disabled, meaning whether the service starts at boot. The vertical axis is started or stopped, meaning whether it is running now. The four cells are: enabled and started, the normal state for a production service; enabled and stopped, which will come back after a reboot; disabled and started, which will vanish after a reboot; and disabled and stopped, which is fully off.">
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="150" y="56"  width="290" height="96" rx="6" />
    <rect x="455" y="56"  width="290" height="96" rx="6" />
    <rect x="150" y="168" width="290" height="96" rx="6" />
    <rect x="455" y="168" width="290" height="96" rx="6" />
  </g>
  <rect x="150" y="56" width="290" height="96" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g class="val" text-anchor="middle" dominant-baseline="middle" style="font-size: 15px">
    <text x="295" y="34">enabled</text>
    <text x="600" y="34">disabled</text>
  </g>
  <g class="val" dominant-baseline="middle" style="font-size: 15px">
    <text x="14" y="104">started</text>
    <text x="14" y="216">stopped</text>
  </g>
  <g class="val" text-anchor="middle" dominant-baseline="middle" style="font-size: 15px">
    <text x="295" y="92">running now, and after a reboot</text>
    <text x="600" y="92">running now, gone after a reboot</text>
    <text x="295" y="204">not running, back after a reboot</text>
    <text x="600" y="204">off, and staying off</text>
  </g>
  <g class="cat" text-anchor="middle" dominant-baseline="middle" style="font-size: 13.5px">
    <text x="295" y="120">what you want in production</text>
    <text x="600" y="120">the change nobody documented</text>
    <text x="295" y="232">maintenance window</text>
    <text x="600" y="232">decommissioned</text>
  </g>
  <g class="cat" text-anchor="middle" dominant-baseline="middle" style="font-size: 13px; font-family: ui-monospace, monospace">
    <text x="295" y="140">start + enable</text>
    <text x="600" y="140">start only</text>
    <text x="295" y="252">enable only</text>
    <text x="600" y="252">neither</text>
  </g>
</svg>

<p class="cap"><code>start</code> answers "now?". <code>enable</code> answers "at boot?". They are independent.</p>

</div>

---

# What `enable` Actually Does

No magic, no database. It creates a symlink.

```bash
sudo systemctl enable nginx
# Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service
#              → /lib/systemd/system/nginx.service
```

```bash
ls -l /etc/systemd/system/multi-user.target.wants/
# nginx.service -> /lib/systemd/system/nginx.service
# ssh.service   -> /lib/systemd/system/ssh.service
```

The unit's `[Install]` section names the target; `enable` reads it and drops a link into
that target's `.wants/` directory. When `multi-user.target` is reached at boot, everything
linked there gets started.

`disable` removes the link. That is the entire mechanism.

---

# The Convenience Forms

```bash
sudo systemctl enable --now nginx     # enable and start, in one step
sudo systemctl disable --now nginx    # disable and stop
```

```bash
systemctl is-enabled nginx    # enabled     — and exit status 0
systemctl is-active  nginx    # active      — and exit status 0
systemctl is-failed  nginx    # inactive    — and exit status 1
```

The `is-*` verbs set a **useful exit status**, which makes them the ones to reach for in a
script:

```bash
if ! systemctl is-active --quiet nginx; then
  echo "nginx is down on $(hostname)" | mail -s "alert" me@example.com
fi
```

---

# `mask` — the Nuclear Option

`disable` stops a service from starting at boot. It does **not** stop something else from
starting it on demand — a socket, a dependency, or a package upgrade that re-enables it.

`mask` does.

```bash
sudo systemctl mask nginx
# Created symlink /etc/systemd/system/nginx.service → /dev/null

sudo systemctl start nginx
# Failed to start nginx.service: Unit nginx.service is masked.
```

It is a symlink to `/dev/null` in the highest-precedence directory — an empty unit file
that outranks the real one. Nothing can start it, including systemd itself.

```bash
sudo systemctl unmask nginx
```

Reach for it when something keeps coming back. Leave a note for the next administrator,
because a masked unit is genuinely confusing to find.

---

# Changing a Unit Safely

Never edit the file in `/lib`. Two better options:

```bash
sudo systemctl edit nginx
```

Opens an empty **drop-in override** in
`/etc/systemd/system/nginx.service.d/override.conf`. Put only what you are changing:

```ini
[Service]
Restart=always
RestartSec=5
```

```bash
sudo systemctl edit --full nginx   # copy the whole unit into /etc and edit that
systemctl cat nginx                # see the unit plus every drop-in in effect
```

```bash
sudo systemctl daemon-reload       # re-read unit files from disk
sudo systemctl restart nginx       # apply them to the running service
```

**`systemctl edit` runs `daemon-reload` for you. Editing a file by hand does not.** That
is the entire explanation for "I changed it and nothing happened."

---
layout: section
---

# The Journal

Where the output went

---

# `journalctl`

systemd starts every service itself, which means it owns their standard output and
standard error. `journald` captures all of it, plus the kernel ring buffer, into one
indexed store.

```bash
journalctl              # everything, oldest first, in a pager
journalctl -e           # jump to the end
journalctl -n 50        # the last 50 lines
```

No more guessing whether a daemon logged to `/var/log/nginx/error.log`,
`/var/log/syslog`, `/var/log/messages`, or nowhere at all. If systemd started it, the
journal has it.

<div class="notes">

Applications that write their own log files still do — nginx keeps `access.log` and
`error.log`. What the journal guarantees is that anything the process wrote to stdout or
stderr, including the startup failure that happened before it opened its own log file, was
captured.

</div>

---

# The Flags That Matter

| Flag | Shows |
| --- | --- |
| `-u nginx` | Only that unit |
| `-b` | Only **this boot** |
| `-b -1` | The **previous boot** — the one that failed |
| `-f` | Follow, like `tail -f` |
| `--since "10 min ago"` | Time-bounded; `--until` also works |
| `-p err` | Priority `err` and worse |
| `-k` | Kernel messages only — `dmesg`, with history |

```bash
journalctl -u nginx -b --no-pager      # this unit, this boot, all at once
journalctl -u nginx -f                 # watch it live while you restart it
journalctl -b -1 -p err                # what went wrong before the reboot
journalctl --since "2025-09-08 09:00" --until "2025-09-08 09:15"
```

`-u` and `-b` together answer nearly every question you will have.

---

# Persistent vs. Volatile Journals

`journalctl -b -1` is the most valuable command on the previous slide — and on a default
install it may return nothing at all.

| Storage | Location | Survives reboot? |
| --- | --- | --- |
| `volatile` | `/run/log/journal/` | **No** — `/run` is a tmpfs |
| `persistent` | `/var/log/journal/` | Yes |

```bash
journalctl --list-boots     # empty or one line? your journal is volatile
```

```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald
```

Or set `Storage=persistent` in `/etc/systemd/journald.conf`. Cap the size while you are
there — `SystemMaxUse=500M` — so logs cannot fill the disk.

**Turn this on before you need it.** After the crash is too late.

---

# When a Service Will Not Start

<div class="viz">
<svg viewBox="0 0 820 260" role="img" aria-label="A five step diagnostic flow. Step one, systemctl status names the unit and shows the failure. Step two, journalctl dash u dash b shows why it failed. Step three, systemctl cat shows the unit file actually in effect. Step four, fix the configuration or the unit. Step five, daemon dash reload then restart.">
  <defs>
    <marker id="flow-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--muted)" />
    </marker>
  </defs>
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="10"  y="20" width="240" height="52" rx="6" />
    <rect x="10"  y="104" width="240" height="52" rx="6" />
    <rect x="10"  y="188" width="240" height="52" rx="6" />
    <rect x="420" y="62" width="240" height="52" rx="6" />
  </g>
  <rect x="420" y="146" width="240" height="52" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g style="stroke: var(--muted); stroke-width: 1.5; fill: none">
    <line x1="130" y1="72"  x2="130" y2="100" marker-end="url(#flow-arrow)" />
    <line x1="130" y1="156" x2="130" y2="184" marker-end="url(#flow-arrow)" />
    <line x1="250" y1="214" x2="330" y2="214" />
    <line x1="330" y1="214" x2="330" y2="88" />
    <line x1="330" y1="88"  x2="416" y2="88" marker-end="url(#flow-arrow)" />
    <line x1="540" y1="114" x2="540" y2="142" marker-end="url(#flow-arrow)" />
  </g>
  <g class="val" style="font-size: 14px; font-family: ui-monospace, monospace" dominant-baseline="middle">
    <text x="24" y="38">systemctl status nginx</text>
    <text x="24" y="122">journalctl -u nginx -b</text>
    <text x="24" y="206">systemctl cat nginx</text>
    <text x="434" y="80">nginx -t   (fix it)</text>
    <text x="434" y="164">daemon-reload; restart</text>
  </g>
  <g class="cat" style="font-size: 13px" dominant-baseline="middle">
    <text x="24" y="58">is it failed, and which file?</text>
    <text x="24" y="142">why did it fail?</text>
    <text x="24" y="226">what is actually in effect?</text>
    <text x="434" y="100">validate before applying</text>
    <text x="434" y="184">re-read, then apply</text>
  </g>
</svg>

<p class="cap">Three questions, in order, then one fix. Guessing at step four without steps one to three is how afternoons disappear.</p>

</div>

---

# Hands-On Lab

The full instructions are in `lab.md`. Work through it on your own machine after class.

**Part 1 — Watch your own machine boot.** Capture your VM's serial console output, save it,
and annotate it: find the firmware banner, the GRUB handoff, the first kernel message, the
root filesystem mount, and the first `[ OK ] Started` line from systemd.

**Part 2 — Measure the boot.** Run `systemd-analyze`, `blame`, and `critical-chain`.
Generate `boot.svg` with `systemd-analyze plot` and publish it to your mdbook site — you
already have a web server; use it.

---

# Hands-On Lab, continued

**Part 3 — Drive systemd.** Exercise the full verb set against the nginx you installed in
Lab 3: `status`, `stop`, `start`, `restart`, `reload`, `enable`, `disable`, `is-active`.
Read `systemctl cat nginx` and find the `[Install]` section that `enable` acts on.

**Part 4 — Break it, then fix it.** Turn on the persistent journal. Disable nginx, reboot,
and observe that your web site is gone. Diagnose it with `systemctl status` and
`journalctl -b -1`, then bring it back — and this time make it permanent.

<div class="notes">

Part 4 is deliberately a failure you cause on purpose, on a machine you can rebuild. It is
the only safe place to practice the sequence you will otherwise perform for the first time
under pressure.

</div>

---

# Assessment Questions

1. Name the four boot phases in order, and say what each hands to the next.
2. Why can UEFI read a filesystem when legacy BIOS cannot?
3. What problem does the initramfs solve, and what happens when it is missing a driver?
4. You edit `/boot/grub/grub.cfg` and your change disappears after a kernel update. Why?
5. `ls -l /sbin/init` shows a symlink. To what, and why does the name `init` persist?
6. A unit file exists in both `/lib/systemd/system/` and `/etc/systemd/system/`. Which wins?
7. A service is running but `is-enabled` reports `disabled`. What happens after a reboot?
8. What is the difference between `disable` and `mask`, and when would you need the second?
9. You edited a unit file by hand and restarted the service, but the change had no effect.
   What did you forget?
10. A machine rebooted overnight and a service did not come back. What are your first three
    commands?

---

# Summary

Today we learned:

- The four boot phases — **firmware, bootloader, kernel, PID 1** — and the handoff each makes
- How UEFI differs from BIOS, and why the ESP and GPT exist
- To read `/proc/cmdline`, edit a boot entry at the GRUB menu, and never edit `grub.cfg`
- Why an **initramfs** exists, and how a stale one produces an unbootable machine
- To watch all of it on a cloud VM with the **serial console**
- That a systemd **unit** is the one abstraction, and `/etc` beats `/lib`
- Targets in place of runlevels, and that `After=` and `Requires=` are different questions
- To drive services with `systemctl` — and that **`start` is now, `enable` is at boot**
- To read the journal with `journalctl -u` and `-b -1`, once it is persistent

---

# Additional Resources

- `man systemctl`, `man journalctl`, `man systemd.unit`, `man systemd.service`
- `man 7 boot` — the boot process, from the kernel's point of view
- `man systemd-analyze`, `man 8 update-initramfs`, `man 8 efibootmgr`
- [systemd for Administrators](https://0pointer.de/blog/projects/systemd-for-admins-1.html) — Lennart Poettering's series; opinionated, and by the author
- [freedesktop.org systemd documentation](https://systemd.io/) — the reference
- [GNU GRUB manual](https://www.gnu.org/software/grub/manual/grub/grub.html)
- [Compute Engine — viewing serial port output](https://cloud.google.com/compute/docs/troubleshooting/viewing-serial-port-output)
- [Compute Engine — interacting with the serial console](https://cloud.google.com/compute/docs/troubleshooting/troubleshooting-using-serial-console)
- `systemd-analyze plot > boot.svg` on your own VM — then look at it

---
layout: center
class: text-center
---

<div class="kicker">CSC 171 · Linux Installation and Administration · Lecture 4</div>

# Nothing Starts By Accident

<div class="term">
<div class="term-bar"><i></i><i></i><i></i><span>student@parkland: ~</span></div>
<pre class="term-body"><span class="ps1">student@vm-171:~$</span> ps -p 1 -o pid,comm
<span class="dim">  PID COMMAND</span>
<span class="dim">    1 systemd</span>
<span class="ps1">student@vm-171:~$</span> sudo systemctl enable --now nginx
<span class="dim">Created symlink /etc/systemd/system/multi-user.target.wants/nginx.service</span>
<span class="ps1">student@vm-171:~$</span> <span class="cursor"></span></pre>
</div>

<div class="next">Next up — users, groups, and permissions: who is allowed to do any of this</div>

<div class="hint">Questions? Bring them to the prompt.</div>

<style>
.slidev-layout .kicker {
  font-size: 0.78rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  opacity: 0.55;
  margin-bottom: 0.6rem;
}

.slidev-layout .term {
  width: 44rem;
  margin: 2rem auto 1.6rem;
  border-radius: 0.6rem;
  overflow: hidden;
  text-align: left;
  background: #1c1c1f;
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow: 0 18px 40px -18px rgba(0, 0, 0, 0.55);
}

.slidev-layout .term .term-bar {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 0.8rem;
  background: #2a2a2e;
}

.slidev-layout .term .term-bar i {
  width: 0.62rem;
  height: 0.62rem;
  border-radius: 50%;
}

.slidev-layout .term .term-bar i:nth-child(1) { background: #ff5f57; }
.slidev-layout .term .term-bar i:nth-child(2) { background: #febc2e; }
.slidev-layout .term .term-bar i:nth-child(3) { background: #28c840; }

.slidev-layout .term .term-bar span {
  margin: 0 auto;
  padding-right: 2.4rem;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.5);
}

.slidev-layout .term .term-body {
  margin: 0;
  padding: 1rem 1.1rem 1.2rem;
  background: transparent;
  color: #e6e6e6;
  font-size: 0.88rem;
  line-height: 1.7;
}

.slidev-layout .term .ps1 { color: #7fd88f; }
.slidev-layout .term .dim { color: rgba(230, 230, 230, 0.55); }

.slidev-layout .term .cursor {
  display: inline-block;
  width: 0.55em;
  height: 1.05em;
  vertical-align: -0.18em;
  background: #e6e6e6;
  animation: end-blink 1.1s steps(1, end) infinite;
}

@keyframes end-blink {
  0%, 60%   { opacity: 1; }
  61%, 100% { opacity: 0.25; }
}

.slidev-layout .next { font-size: 1.05rem; }

.slidev-layout .next code {
  padding: 0.1em 0.35em;
  border-radius: 0.25rem;
  background: rgba(128, 128, 128, 0.16);
}

.slidev-layout .hint {
  margin-top: 0.9rem;
  font-size: 0.85rem;
  opacity: 0.55;
}
</style>
