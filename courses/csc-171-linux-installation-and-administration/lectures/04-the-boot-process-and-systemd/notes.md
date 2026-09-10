---
title: The Boot Process and systemd
subtitle: CSC 171 — Lecture 4
---

## Overview

Last week's lecture described the boot sequence in three bullets: the kernel starts a few
of its own activities, launches `init` at PID 1, and `init` starts `systemd`, which starts
all the system services. Every word of that is true, and it is nearly useless as an
administrator's model of the machine.

Each of those handoffs is a separate program, running in a separate environment, with its
own configuration and its own failure modes. A machine that will not finish booting has
stopped somewhere specific, and the difference between a five-minute fix and a rebuilt
server is usually just knowing which phase you are looking at.

These notes cover the four phases in order, then turn to the program that owns the machine
once booting is over. Roughly a third of this document is about how a Linux system starts;
the rest is about `systemd`, because that is the part you will use every working day.

## Learning objectives

After working through this material you will be able to:

- Name the four phases of a Linux boot and describe what each hands to the next
- Explain what UEFI firmware does, and how it differs from a legacy BIOS
- Read a kernel command line and identify what the bootloader passed to the kernel
- Explain why an initramfs exists, and predict what breaks when it is stale or incomplete
- Demonstrate that `systemd` is PID 1 on a running machine
- Define a systemd unit, and state which of the three unit directories takes precedence
- Map the traditional SysV runlevels onto systemd targets
- Manage a service with `systemctl`: list, start, stop, restart, and reload
- Distinguish starting a service from enabling it, and explain the mechanism behind `enable`
- Read a service's logs with `journalctl`, including logs from a boot that already failed

## Key commands covered

Table: Commands introduced in this lecture, grouped by the phase or subsystem they belong to

| Command | Purpose |
| --- | --- |
| `efibootmgr` | List and modify UEFI boot entries |
| `lsblk` | List block devices, including the EFI System Partition |
| `update-grub` | Regenerate `grub.cfg` from `/etc/default/grub` |
| `dmesg` | Read the kernel's ring buffer |
| `lsinitramfs` | List the contents of an initramfs archive |
| `update-initramfs` | Rebuild the initramfs for one or all installed kernels |
| `systemctl` | The single command for driving systemd |
| `systemd-analyze` | Measure boot time and find what is slowing it down |
| `journalctl` | Query the systemd journal |
| `gcloud compute instances get-serial-port-output` | Read a cloud VM's console output |

---

## Part 1: From Power to PID 1

Booting a computer is a sequence of increasingly capable programs, each of which exists
almost entirely to load the next one. Firmware finds a bootloader. The bootloader finds a
kernel. The kernel finds a root filesystem. And on that filesystem is the first ordinary
process, which starts everything else.

Table: The four boot phases and what each one hands to the next

| Phase | Program | Hands over |
| --- | --- | --- |
| 1 | Firmware (UEFI or BIOS) | A boot program loaded from disk |
| 2 | Bootloader (GRUB) | A kernel, an initramfs, and a command line |
| 3 | Kernel (`vmlinuz`) | A mounted root filesystem |
| 4 | PID 1 (`systemd`) | A running system at the default target |

Everything in the rest of this section is a detail of one of those four rows.

### Phase 1: Firmware

The first instructions a CPU executes after power-on do not come from your disk. They come
from flash memory on the motherboard, placed there by the hardware manufacturer.

The firmware's job is short and finite:

1. **Power-on self test (POST)** — verify that the CPU, memory, and attached devices are
   present and responding.
2. **Enumerate boot devices** — walk a configured list of places something bootable might
   live: internal disks, USB devices, the network.
3. **Load and jump** — read a boot program from the first viable candidate and transfer
   control to it.

Then it is finished. Firmware does not know what an operating system is, has no concept of
Linux, and would have loaded Windows by exactly the same procedure. On a cloud VM the
firmware is virtual — code the hypervisor runs on your behalf — but the sequence and its
output are the same.

#### Legacy BIOS and the 440-byte problem

The traditional PC firmware, the BIOS, reads the first 512-byte sector of the boot disk:
the **Master Boot Record**. Of those 512 bytes, 64 hold the partition table and 2 hold a
signature, which leaves **440 bytes for executable code**.

Four hundred and forty bytes is not enough room to understand a filesystem. It is barely
enough to load more code from a hardcoded disk location. Every awkward thing about legacy
booting descends from that single number: the multi-stage chainloading, the fragility of
bootloader installation, the four-primary-partition limit of the MBR partition scheme, and
the 2 TB ceiling that comes from addressing sectors with a 32-bit number.

#### UEFI

The Unified Extensible Firmware Interface replaces that arrangement with something far
less constrained. UEFI firmware contains a FAT32 filesystem driver. It can therefore read
a real partition, find a real file, and execute it as a real program — one that can be as
large as it needs to be.

Table: How legacy BIOS and UEFI differ in the ways that matter to an administrator

| Concern | Legacy BIOS | UEFI |
| --- | --- | --- |
| Where boot code lives | First 512 bytes of the disk | A file on a FAT32 partition |
| Space available for code | 440 bytes | Effectively unlimited |
| Partition scheme | MBR: four primary partitions, 2 TB limit | GPT: 128 partitions, exabyte scale |
| How the OS is found | Chainloading through multiple stages | Firmware reads a filesystem and runs a program |
| Boot entries | One, implied by disk order | Many, named and stored in NVRAM |
| Signature verification | None | Secure Boot, when enabled |

#### The EFI System Partition

The partition UEFI reads is the **EFI System Partition**, universally abbreviated ESP. It
is a small FAT32 partition — 100 to 500 MB is typical — that Linux mounts at `/boot/efi`
so you can inspect it:

```bash
lsblk
# NAME    MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
# sda       8:0    0  10G  0 disk
# ├─sda1    8:1    0 9.9G  0 part /
# └─sda15   8:15   0  99M  0 part /boot/efi

ls /boot/efi/EFI/
# BOOT  debian
```

Each operating system installed on the machine gets a directory here. The boot entries
themselves live in the firmware's own non-volatile memory, and `efibootmgr` reads them:

```bash
sudo efibootmgr -v
# BootCurrent: 0000
# BootOrder: 0000
# Boot0000* debian  HD(15,GPT,...)/File(\EFI\debian\shimx64.efi)
```

That last line is the entirety of phase 1: an ordered list of boot entries, each naming a
program on a partition. The firmware runs the first one that works.

#### Secure Boot, briefly

You will notice the entry above names `shimx64.efi` rather than `grubx64.efi`. The shim is
a small loader signed with a key that firmware manufacturers trust out of the box. It
verifies the distribution's own signature on GRUB before loading it, which is how a Linux
distribution boots on a machine with Secure Boot enabled without every vendor having to
ship its own firmware key. If Secure Boot is disabled, `grubx64.efi` may be loaded
directly.

### Phase 2: The bootloader

GRUB — the GRand Unified Bootloader — is the first program in the chain that knows what an
operating system is. It runs in the environment the firmware provides, using firmware
services to read the disk, and its job is to assemble everything the kernel needs before
handing over.

Specifically, GRUB:

1. Reads its own configuration from `/boot/grub/grub.cfg`
2. Presents a boot menu, if there is more than one entry and the timeout is non-zero
3. Locates the kernel image and the initramfs on disk and loads both into memory
4. Constructs a **command line** — a single string of parameters for the kernel
5. Transfers control to the kernel's entry point

#### Two configuration files, only one of which is yours

This is the part of GRUB that most often bites people, and it is entirely avoidable.

Table: The two GRUB configuration files and which one an administrator edits

| File | Nature | Edit it? |
| --- | --- | --- |
| `/etc/default/grub` | Short, commented, human-written settings | **Yes** |
| `/boot/grub/grub.cfg` | Hundreds of lines of generated shell script | **No** |

`grub.cfg` opens with a comment saying `DO NOT EDIT THIS FILE`, and it means it. The file
is regenerated from scratch by `grub-mkconfig` every time a kernel is installed, removed,
or upgraded. A change made directly to `grub.cfg` will work perfectly until the next
kernel update quietly discards it — which is to say, it will work right up until the
moment you have forgotten you made it.

The correct workflow is to edit the settings file and regenerate:

```bash
sudo nano /etc/default/grub
sudo update-grub
```

On Debian and Ubuntu, `update-grub` is a thin wrapper around
`grub-mkconfig -o /boot/grub/grub.cfg`. On Red Hat derivatives you run `grub2-mkconfig`
directly.

A cloud VM ships with `GRUB_TIMEOUT=0`, and that is the right setting for a server: there
is no keyboard attached and nobody watching, so waiting five seconds at a menu nobody will
see costs five seconds on every single reboot. The consequence is that the menu — and the
recovery entries in it — are effectively invisible unless you deliberately go looking, and
we will come back to how you do that.

#### The kernel command line

Everything GRUB tells the kernel arrives as a single string. The kernel keeps it, and
exposes it for the life of the boot:

```bash
cat /proc/cmdline
# BOOT_IMAGE=/boot/vmlinuz-6.1.0-18-cloud-amd64 root=UUID=8d2a3f10-... ro
# console=ttyS0,115200 net.ifnames=0 scsi_mod.use_blk_mq=Y
```

Table: Common kernel command line parameters and what each one controls

| Parameter | Effect |
| --- | --- |
| `BOOT_IMAGE=` | Informational: which kernel file GRUB loaded |
| `root=UUID=...` | Which partition to mount as `/`. GRUB found the kernel; the kernel uses this to find everything else |
| `ro` | Mount root read-only initially, so it can be checked before being remounted read-write |
| `console=ttyS0,115200` | Direct kernel messages to the serial port in addition to the display |
| `net.ifnames=0` | Use classic `eth0` interface naming instead of predictable names |
| `single` | Boot to single-user mode |
| `systemd.unit=rescue.target` | Boot to a specific systemd target instead of the default |

The `console=ttyS0,115200` parameter deserves special attention, because it is the reason
a cloud VM has a readable boot log at all. Without it, everything the kernel prints goes
to a virtual display that nobody can see.

#### Editing a boot entry for recovery

This is the single most valuable GRUB skill, and it takes ten seconds to learn.

At the GRUB menu, highlight an entry and press <kbd>e</kbd>. You get a text editor
containing that entry's commands. Find the line beginning `linux` and append what you
need — `single` for single-user mode, or `systemd.unit=emergency.target` to get a root
shell with almost nothing started. Press <kbd>Ctrl</kbd>-<kbd>x</kbd> to boot with the
modified line.

```
linux /boot/vmlinuz-6.1.0-18-cloud-amd64 root=UUID=8d2a3f10-... ro single
```

Nothing is written to disk. The change applies to this boot only, and the next reboot is
completely unaffected. That property is what makes it safe to experiment with: you cannot
permanently break the boot configuration this way.

This is how you get into a machine whose root password is fine but whose services are
preventing a normal boot — a bad `/etc/fstab` entry, a service that hangs forever waiting
for a network that is not there, a filesystem that needs a manual `fsck`.

### Phase 3: The kernel

GRUB jumps to the kernel's entry point and is never heard from again. The kernel now owns
the hardware.

What happens next, in order:

1. **Self-decompression.** The file called `vmlinuz` is a compressed kernel image with a
   small uncompressed stub at the front whose only job is to unpack the rest.
2. **Hardware and subsystem initialization.** CPU features, memory management, the
   scheduler, the interrupt controllers.
3. **Mounting the initramfs** as a temporary root filesystem in memory.
4. **Loading drivers** from that initramfs — in particular, whatever is needed to reach the
   real disk.
5. **Mounting the real root filesystem** at `/`, using the `root=` parameter from the
   command line.
6. **Executing `/sbin/init`** as PID 1.

After step 6, the kernel never starts a program on its own initiative again. It services
system calls, schedules processes, and manages memory, but every process on the machine
from that point forward is a descendant of PID 1.

#### Reading the kernel's own log

The kernel records every message from those steps in a fixed-size in-memory ring buffer,
and `dmesg` reads it:

```bash
sudo dmesg | head -30          # the earliest messages, from before any filesystem existed
sudo dmesg -T                  # human-readable timestamps instead of seconds since boot
sudo dmesg --level=err,warn    # only problems
sudo dmesg -w                  # follow new messages, like tail -f
```

Because the buffer is a fixed size, a busy machine eventually overwrites its early
messages. `journalctl -k` reads the same content from the journal, which — if the journal
is persistent — keeps it across reboots.

Hardware that failed to initialize, a disk throwing I/O errors, a process killed by the
out-of-memory killer: all of it lands here before it lands anywhere else.

#### The initramfs

Step 3 above looks like unnecessary indirection. It is not, and the reason is a genuine
chicken-and-egg problem.

To mount the root filesystem, the kernel needs a driver for the disk controller and a
driver for the filesystem type. Those drivers are kernel modules, and kernel modules are
files stored in `/lib/modules/` — which is to say, on the root filesystem the kernel is
trying to mount.

The **initramfs** breaks the loop. It is a compressed archive stored next to the kernel in
`/boot`, which GRUB loads into memory alongside the kernel. The kernel unpacks it into a
RAM-based filesystem and uses it as a temporary root:

```bash
ls -lh /boot/
# -rw-r--r-- 1 root root 8.0M  vmlinuz-6.1.0-18-cloud-amd64
# -rw-r--r-- 1 root root  32M  initrd.img-6.1.0-18-cloud-amd64

lsinitramfs /boot/initrd.img-$(uname -r) | head -20
```

Inside is a minimal userspace: a shell, `udev`, the kernel modules needed to reach real
storage, and a script called `init` that loads them, assembles whatever needs assembling,
mounts the real root, and then hands off with `switch_root`. The initramfs is discarded
from memory at that point.

#### Why the initramfs is an administrator's concern

You will never think about the initramfs until the day it ruins your afternoon, so it is
worth understanding the failure in advance.

An initramfs must contain drivers and tooling for **every layer** between the kernel and
the root filesystem. That includes:

- **Encrypted root** — the LUKS modules, and the userspace that prompts for a passphrase
  before anything else can proceed
- **LVM** — the tools to scan for physical volumes and activate the logical volume that
  holds `/`
- **Software RAID** — `mdadm`, to assemble the array before it can be mounted
- **Unusual storage controllers** — a driver that is not built into the kernel itself
- **Network root** — a NIC driver and enough networking to reach an NFS or iSCSI root

If any of that is missing, the kernel loads, runs the initramfs, fails to find the root
filesystem, and drops you at a bare `(initramfs)` prompt. The machine is not damaged;
it simply cannot see its own disk.

```bash
sudo update-initramfs -u           # rebuild for the currently running kernel
sudo update-initramfs -u -k all    # rebuild for every installed kernel
sudo update-initramfs -c -k 6.1.0-18-cloud-amd64   # create for a specific kernel
```

Package managers run these automatically on kernel installation. The failures happen when
something interrupts that — a full `/boot` partition is the classic cause, since an
initramfs is tens of megabytes and `/boot` is often small. The upgrade appears to succeed,
the initramfs is truncated or missing, and the machine boots fine until the next reboot
weeks later, by which time nobody connects the two events.

The lesson: **after any change to storage layout, encryption, or the kernel, reboot
deliberately while you are still paying attention.** A reboot you chose is a diagnostic. A
reboot at 3am is an incident.

### Phase 4: PID 1

The kernel executes `/sbin/init`, which on every distribution in this course is a symlink
of long standing:

```bash
ls -l /sbin/init
# lrwxrwxrwx 1 root root 20 Mar  5 08:22 /sbin/init -> /lib/systemd/systemd

ps -p 1 -o pid,comm,args
#   PID COMMAND  COMMAND
#     1 systemd  /sbin/init
```

`systemd` **is** PID 1. The name `init` persists because four decades of documentation,
scripts, kernel defaults, and man pages expect a program by that name to exist at that
path, and there is no benefit to breaking all of it.

PID 1 has two properties that make it different from every other process. It cannot be
killed by ordinary signals — the kernel ignores `SIGTERM` and `SIGKILL` sent to PID 1
unless the process has explicitly installed a handler — and it inherits every orphaned
process on the system, which makes it responsible for reaping them. If PID 1 exits, the
kernel panics. There is nothing to fall back to.

### Observing all of this on a cloud VM

Everything described above happens before the network stack exists, before `sshd` starts,
and before there is any possibility of logging in. On a physical machine you would watch
it on the attached display. On a cloud VM there is no display — but there is a serial port,
and `console=ttyS0,115200` on the kernel command line means everything was written to it.

```bash
gcloud compute instances get-serial-port-output vm-171 --zone=us-central1-a
```

```bash
gcloud compute instances get-serial-port-output vm-171 \
  --zone=us-central1-a > boot.log
```

This works whether or not the machine finished booting, and whether or not `sshd` ever
started — which is precisely when you need it. Reading a saved boot log, you can pick out
all four phases:

```
SeaBIOS / UEFI firmware, Google Compute Engine          ← phase 1
Booting from Hard Disk...
GRUB loading linux 6.1.0-18-cloud-amd64 ...             ← phase 2
Loading initial ramdisk ...
[    0.000000] Linux version 6.1.0-18-cloud-amd64       ← phase 3
[    0.984213] Run /init as init process
[    2.117740] EXT4-fs (sda1): mounted filesystem
[  OK  ] Reached target Basic System.                   ← phase 4
[  OK  ] Started OpenBSD Secure Shell server.
[  OK  ] Reached target Multi-User System.
```

For a machine that is failing to boot, reading the log is not always enough — you may need
a prompt. The interactive serial console gives you one:

```bash
gcloud compute instances add-metadata vm-171 --zone=us-central1-a \
  --metadata serial-port-enable=TRUE

gcloud compute connect-to-serial-port vm-171 --zone=us-central1-a
```

Connect, then reboot the instance from another terminal, and you are watching the console
live — including the GRUB menu, where <kbd>e</kbd> still works. This is the closest thing
a cloud VM has to physical presence, and it depends on none of the things that are
probably broken: not the network configuration, not `sshd`, not even a mountable root
filesystem.

It is also worth knowing as a security consideration. Anyone with the appropriate IAM
permission gets console-level access to the machine, which is why some organizations
disable the feature at the project level.

---

## Part 2: systemd

### What systemd actually is

Describing systemd as "an init system" undersells it, which is why arguments about it tend
to go in circles. It is several things at once:

- **PID 1** — the first process, the ancestor of everything else, and the reaper of orphans
- **A service manager** — it starts daemons, tracks them, and can restart them when they die
- **A dependency resolver** — it computes an ordering graph from declared relationships and
  runs everything not on the critical path in parallel
- **A logging system** — `journald` captures the standard output and standard error of every
  service systemd starts, along with the kernel ring buffer

It also handles device events, filesystem mounts, scheduled jobs, socket activation, user
login sessions, and more. That breadth is simultaneously the strongest argument in its
favor — one consistent interface to all of it — and the loudest argument against it.

### What it replaced, and why

The traditional System V init ran numbered shell scripts from `/etc/rc*.d/`, one at a
time, in lexical order.

Table: Structural problems with SysV init, and what each one meant in practice

| Problem | Consequence |
| --- | --- |
| Strictly sequential execution | Boot time was the sum of every service's startup time, however idle the CPU |
| Ordering encoded in filenames | `S20nginx` ran before `S30postgres` because of a number, not a stated dependency |
| No dependency model | A service needing the network had to sleep in a loop and hope |
| No supervision | A daemon that crashed at 3am stayed dead until a human noticed |
| No authoritative state | "Is it running?" meant grepping `ps` or trusting a possibly stale PID file |
| Every script hand-written | Hundreds of lines of subtly different shell across a distribution |

systemd addresses each of these directly. Dependencies are declared rather than implied,
so startup can be parallelized. Services are supervised, so a crash can be a restart rather
than an outage. And there is one command that knows the truth about every unit's state.

### The argument, and the compatibility shim

The objection to systemd is real and worth understanding rather than dismissing: it is a
large, tightly coupled body of code occupying a position — PID 1 — where a failure is not
recoverable, and it absorbed responsibilities that previously belonged to smaller,
separately replaceable programs. Reasonable engineers held that position strongly, and some
still do.

In practice the question is settled. Debian, Ubuntu, RHEL, Fedora, SUSE, and Arch all use
systemd. Every machine you administer in this course uses it.

You will nonetheless encounter the old commands constantly in documentation and tutorials,
because thirty years of runbooks and muscle memory say `service`:

```bash
sudo service nginx start        # still works
sudo /etc/init.d/nginx start    # still works
```

Both are compatibility shims that translate into `systemctl` calls. Use `systemctl`
yourself; recognize the other two when you meet them.

### Everything is a unit

systemd manages exactly one kind of thing: a **unit**. A unit is a named object with a
type, a configuration file, and a state. The type is carried in the name's extension, and
it determines both what the configuration file may contain and how systemd activates it.

This single abstraction is what allows one command to start a daemon, reach a runlevel,
mount a filesystem, and schedule a periodic job.

Table: The systemd unit types you are most likely to encounter

| Extension | Manages | Example |
| --- | --- | --- |
| `.service` | A daemon or a one-shot process | `nginx.service` |
| `.target` | A grouping of units; a synchronization point | `multi-user.target` |
| `.socket` | A socket that activates its service on first connection | `sshd.socket` |
| `.timer` | A scheduled activation; systemd's answer to cron | `logrotate.timer` |
| `.mount` | A filesystem mount point | `boot-efi.mount` |
| `.automount` | An on-demand mount point | `proc-sys-fs-binfmt_misc.automount` |
| `.device` | A kernel device other units can depend on | `dev-sda1.device` |
| `.path` | Activation when a file or directory changes | `cups.path` |
| `.swap` | A swap device or file | `dev-sda2.swap` |
| `.slice` | A resource-control group of units | `system.slice` |

Note the naming convention for units derived from paths: `/boot/efi` becomes
`boot-efi.mount`, with slashes turned into dashes. `systemd-escape` performs that
translation if you need it.

### Where unit files live

Three directories, one precedence order. This is the single most useful fact in this
section.

Table: The systemd unit directories and their precedence

| Directory | Owned by | Precedence |
| --- | --- | --- |
| `/etc/systemd/system/` | The administrator — you | **Highest; always wins** |
| `/run/systemd/system/` | Runtime-generated; discarded at reboot | Middle |
| `/lib/systemd/system/` | The package manager | Lowest |

A package ships its unit file into `/lib/systemd/system/`. If you edit that file directly,
the next `apt upgrade` of that package will overwrite your change without warning you. Put
your version, or better an override, in `/etc/systemd/system/`.

To see which file is actually in effect, along with any overrides applied on top of it:

```bash
systemctl cat nginx
```

On a distribution that has completed the `/usr` merge, `/lib/systemd/system` is a symlink
to `/usr/lib/systemd/system`. Both paths name the same directory, and you will see either
one in documentation.

### Reading a unit file

You do not need to write unit files to administer a system, but you should be able to read
one, because `systemctl cat` is a diagnostic step. Here is a trimmed `nginx.service`:

```ini
[Unit]
Description=A high performance web server and a reverse proxy server
After=network.target
Wants=network-online.target

[Service]
Type=forking
PIDFile=/run/nginx.pid
ExecStartPre=/usr/sbin/nginx -t -q -g 'daemon on; master_process on;'
ExecStart=/usr/sbin/nginx -g 'daemon on; master_process on;'
ExecReload=/usr/sbin/nginx -g 'daemon on; master_process on;' -s reload
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Three sections, each with a distinct job:

- **`[Unit]`** — metadata and relationships to other units. The description you see in
  `systemctl status` comes from here, as do the dependency directives.
- **`[Service]`** — how to run the thing. `ExecStart` is the command. `ExecReload` is what
  `systemctl reload` actually runs, and a unit that omits it cannot be reloaded at all.
  `Restart=on-failure` is the supervision policy.
- **`[Install]`** — what `systemctl enable` should do. `WantedBy=multi-user.target` is the
  line that tells `enable` where to place its symlink. **A unit with no `[Install]` section
  cannot be enabled**, which is occasionally a surprising error message.

### Targets replace runlevels

SysV had seven numbered runlevels. systemd has named targets, and provides aliases so that
old commands and documentation continue to work.

Table: SysV runlevels mapped onto their systemd target equivalents

| Runlevel | Target | Meaning |
| --- | --- | --- |
| 0 | `poweroff.target` | Halt the machine |
| 1 | `rescue.target` | Single user; minimal services, root filesystem mounted |
| 2, 3, 4 | `multi-user.target` | Full multi-user, networking, no GUI — a server |
| 5 | `graphical.target` | Multi-user with a graphical desktop |
| 6 | `reboot.target` | Restart |
| — | `emergency.target` | Root shell only; root mounted read-only, almost nothing started |

```bash
systemctl get-default
# multi-user.target

sudo systemctl set-default multi-user.target   # change the default for future boots
sudo systemctl isolate rescue.target           # switch to a target right now
```

`default.target` is itself a symlink, which you can inspect:

```bash
ls -l /etc/systemd/system/default.target
# default.target -> /lib/systemd/system/multi-user.target
```

Targets form a chain. `multi-user.target` requires `basic.target`, which requires
`sysinit.target`, which requires local filesystems and swap. Your services hang off
`multi-user.target`, which is why they start last: everything they depend on is
already there.

### Dependencies: when versus whether

This is the concept most people get wrong, and getting it wrong produces bugs that are
difficult to reproduce. **Ordering and requirement are independent axes.**

Table: The four dependency directives you will meet most often

| Directive | Axis | Meaning |
| --- | --- | --- |
| `After=foo.service` | Ordering | If both are starting, start this one after `foo` |
| `Before=foo.service` | Ordering | If both are starting, start this one before `foo` |
| `Wants=foo.service` | Requirement | Also start `foo`; carry on regardless if it fails |
| `Requires=foo.service` | Requirement | Also start `foo`; **fail this unit if `foo` fails** |

`After=` says nothing about whether the other unit will be started at all. `Requires=`
says nothing about ordering. Writing `Requires=postgresql.service` without a matching
`After=postgresql.service` tells systemd to start the database and your application
simultaneously — which it will dutifully do, and your application will fail to connect.

In practice you almost always want both directives naming the same unit. `Wants=` is the
better default of the two requirement directives, because `Requires=` propagates failure
in both directions and can take down more than you intended.

### Parallel startup and measuring it

Because dependencies are declared rather than inferred from filenames, systemd can build
the dependency graph up front and start everything not on the critical path at the same
time. Boot takes as long as the longest chain, not the sum of every unit.

The cost is a subtler class of bug. Under SysV a missing dependency was usually harmless,
because the numeric filename ordering happened to be correct. Under systemd, an
undeclared dependency becomes a genuine race — one that fails one boot in twenty, on the
machine under load, at the worst possible time.

`systemd-analyze` lets you measure rather than guess:

```bash
systemd-analyze
# Startup finished in 1.982s (kernel) + 4.117s (userspace) = 6.099s
# multi-user.target reached after 4.102s in userspace

systemd-analyze blame | head
#  2.204s cloud-init.service
#  1.113s snapd.service
#   408ms systemd-udev-settle.service

systemd-analyze critical-chain
systemd-analyze plot > boot.svg
```

The distinction between `blame` and `critical-chain` matters. `blame` lists every unit by
how long it took, sorted descending. `critical-chain` shows which of those units were
actually blocking others. A unit that took four seconds while nothing waited on it is not
worth optimizing; a unit that took four hundred milliseconds while everything waited on it
is.

---

## Part 3: Managing services with `systemctl`

### The shape of the command

```bash
systemctl VERB UNIT
```

- The `.service` extension is optional. `systemctl status nginx` and
  `systemctl status nginx.service` are identical.
- Read-only verbs require no privilege. Anything that changes state requires `sudo`.
- Long output opens in a pager, exactly like `git log`. Press <kbd>q</kbd> to quit, or pass
  `--no-pager` to suppress it — which you will want in scripts and when capturing output.

### Listing units

```bash
systemctl list-units --type=service                   # loaded right now
systemctl list-units --type=service --state=running   # only what is running
systemctl list-unit-files --type=service              # installed on disk
systemctl --failed                                    # what is broken
```

The distinction between the first and third commands is worth internalizing:

- **`list-units`** shows units systemd has loaded into memory during this boot.
- **`list-unit-files`** shows unit files present on disk, whether loaded or not, along with
  their enabled state.

A service you have disabled appears in the second list and not the first.

`systemctl --failed` deserves a place in your reflexes. It is the shortest useful question
you can ask a misbehaving machine, and on a healthy system it returns nothing at all.

### `systemctl status`, field by field

This is the most information-dense command in the lecture.

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

The **coloured dot** summarizes the `Active` line: green for active, white for inactive,
red for failed.

The **`Loaded:`** line answers questions about the unit file on disk. It gives the path of
the file actually in effect — which is how you discover that the unit you have been editing
is not the one being used — followed by the enabled state and the distribution's default
preset.

The **`Active:`** line answers questions about right now.

Table: The `Active` states reported by `systemctl status` and what each indicates

| State | Meaning |
| --- | --- |
| `active (running)` | Running, with one or more processes |
| `active (exited)` | Ran to completion successfully; normal for one-shot units |
| `active (waiting)` | Running but waiting on an event, such as a socket connection |
| `inactive (dead)` | Stopped, with no error |
| `failed` | Stopped because something went wrong; check the journal |
| `activating` | Still starting |
| `deactivating` | Still stopping |

The **`CGroup:`** tree is systemd's answer to the PID file. Because systemd places each
service in its own control group, it knows with certainty which processes belong to the
service — including children that forked away from the original process. Stopping the unit
stops all of them.

The last few lines are the most recent journal entries for the unit, included so that a
failure usually explains itself without a second command.

### Start, stop, restart, reload

Table: The four state-changing verbs and their effect on running connections

| Command | Effect |
| --- | --- |
| `sudo systemctl start nginx` | Start the service now |
| `sudo systemctl stop nginx` | Stop the service now |
| `sudo systemctl restart nginx` | Stop, then start. **Existing connections are dropped** |
| `sudo systemctl reload nginx` | Reread configuration without stopping; connections survive |
| `sudo systemctl reload-or-restart nginx` | Reload if the unit defines `ExecReload`, otherwise restart |

`reload` is the same idea as the `HUP` signal from last week's lecture — tell a running
daemon to reread its configuration without dying — except that the unit file's
`ExecReload` line decides exactly what "reload" means for that program, and systemd runs
it for you.

Get in the habit of validating before applying:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

`nginx -t` parses the configuration and reports errors without touching the running
server. The `&&` means the reload only happens if the test passed. Reloading a broken
configuration onto a live server is an avoidable way to turn a quiet afternoon into an
incident.

### Start versus enable

These answer two entirely different questions, and confusing them is the most common
mistake in this material.

- **`start`** answers: *is it running now?*
- **`enable`** answers: *will it start at boot?*

They are independent, which produces four states:

Table: The four combinations of started and enabled, and what each one means operationally

| Enabled | Started | Situation |
| --- | --- | --- |
| Yes | Yes | Running now and after a reboot. What you want in production |
| Yes | No | Not running now, but back after a reboot. A maintenance window |
| No | Yes | Running now, gone after a reboot. The change nobody documented |
| No | No | Off, and staying off. Decommissioned |

The third row is the dangerous one. Someone starts a service by hand to fix a problem, it
works, everyone moves on — and the machine reboots eleven weeks later and the service does
not come back. Nothing in `systemctl status` looks wrong in the meantime, because the
service really is running. The only clue is the word `disabled` on the `Loaded:` line.

### What `enable` actually does

There is no database and no magic. `enable` reads the unit's `[Install]` section and
creates a symlink:

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

The `WantedBy=multi-user.target` line in `[Install]` names the target. `enable` drops a
symlink into that target's `.wants/` directory. When `multi-user.target` is reached during
boot, systemd starts everything linked there.

`disable` removes the symlink. That is the entire mechanism, and knowing it means you can
always answer "why did this start?" by looking in a directory.

### The convenience and query forms

```bash
sudo systemctl enable --now nginx     # enable and start in one step
sudo systemctl disable --now nginx    # disable and stop
```

```bash
systemctl is-enabled nginx    # prints "enabled";  exit status 0
systemctl is-active  nginx    # prints "active";   exit status 0
systemctl is-failed  nginx    # prints "inactive"; exit status 1
```

The `is-*` verbs set a meaningful exit status, which makes them the right tools for
scripting:

```bash
if ! systemctl is-active --quiet nginx; then
  echo "nginx is down on $(hostname)" | mail -s "service alert" me@example.com
fi
```

### `mask` — the stronger form of `disable`

`disable` prevents a service from being started at boot. It does not prevent anything else
from starting it: another unit's `Wants=`, a socket activation, or a package upgrade that
re-runs `enable` will all bring it back.

`mask` prevents everything:

```bash
sudo systemctl mask nginx
# Created symlink /etc/systemd/system/nginx.service → /dev/null

sudo systemctl start nginx
# Failed to start nginx.service: Unit nginx.service is masked.

sudo systemctl unmask nginx
```

The mechanism follows directly from the precedence table: it places a symlink to
`/dev/null` in the highest-precedence unit directory. systemd loads that empty unit
instead of the real one, and an empty unit cannot be started — not by you, not by another
unit, not by systemd itself.

Reach for `mask` when something keeps coming back despite being disabled. Then leave a
note, because a masked unit is genuinely hard for the next administrator to discover.

### Changing a unit safely

Never edit a file in `/lib/systemd/system/`. There are two supported ways to change a
unit's behavior, and both put your change in `/etc`.

**Drop-in override** — the preferred approach:

```bash
sudo systemctl edit nginx
```

This opens an empty file at `/etc/systemd/system/nginx.service.d/override.conf`. You write
only the settings you are changing:

```ini
[Service]
Restart=always
RestartSec=5
```

systemd merges the drop-in on top of the packaged unit. The package can continue to update
its own file, and your two lines survive.

**Full replacement** — when you need to change something a drop-in cannot express:

```bash
sudo systemctl edit --full nginx
```

This copies the entire unit into `/etc/systemd/system/` for editing. Your copy now shadows
the package's version permanently, including any improvements a future update would have
brought.

Either way, verify what is actually in effect:

```bash
systemctl cat nginx
```

Finally, the step that explains most "I changed it and nothing happened" reports:

```bash
sudo systemctl daemon-reload    # re-read unit files from disk
sudo systemctl restart nginx    # apply them to the running service
```

`daemon-reload` makes systemd re-read unit files. `restart` applies the new definition to
the running service. Both are needed, and they do different things. **`systemctl edit` runs
`daemon-reload` for you automatically; editing a file by hand does not.**

---

## Part 4: The journal

### What `journald` captures

Because systemd starts every service itself, it owns their standard output and standard
error streams. `systemd-journald` captures all of that, plus the kernel ring buffer, plus
structured metadata about which unit each message came from, into one indexed store.

```bash
journalctl          # everything, oldest first, in a pager
journalctl -e       # jump to the end
journalctl -n 50    # the last 50 lines
```

This eliminates a genuinely tedious part of the job: guessing whether a daemon logged to
`/var/log/nginx/error.log`, `/var/log/syslog`, `/var/log/messages`, its own directory, or
nowhere at all. If systemd started it, the journal has it.

Applications that maintain their own log files still do — nginx keeps `access.log` and
`error.log`, and you will still read those. What the journal guarantees is that anything
the process wrote to stdout or stderr was captured, including the startup failure that
happened before the program got far enough to open its own log file. That last case is
exactly the one you care about when a service will not start.

### The flags that matter

Table: The `journalctl` options you will use most often

| Flag | Shows |
| --- | --- |
| `-u nginx` | Only messages from that unit |
| `-b` | Only this boot |
| `-b -1` | The previous boot — the one that failed |
| `-f` | Follow new messages, like `tail -f` |
| `-n 50` | The last 50 entries |
| `-e` | Jump to the end of the pager |
| `--since "10 min ago"` | Time-bounded; `--until` works the same way |
| `-p err` | Priority `err` and worse |
| `-k` | Kernel messages only — `dmesg`, but with history |
| `--no-pager` | Print directly, for scripts and captured output |
| `--list-boots` | Every boot the journal still holds |

```bash
journalctl -u nginx -b --no-pager        # this unit, this boot, all at once
journalctl -u nginx -f                   # watch live while you restart it in another shell
journalctl -b -1 -p err                  # errors from before the last reboot
journalctl --since "2025-09-08 09:00" --until "2025-09-08 09:15"
```

`-u` and `-b` together answer nearly every question you will have about a service.

### Persistent versus volatile journals

`journalctl -b -1` is the most valuable command on that list, and on a default installation
it may return nothing at all — because the journal is not being kept across reboots.

Table: The two journal storage modes and their consequences

| Storage | Location | Survives a reboot? |
| --- | --- | --- |
| `volatile` | `/run/log/journal/` | **No** — `/run` is a tmpfs, cleared at boot |
| `persistent` | `/var/log/journal/` | Yes |

Check which you have:

```bash
journalctl --list-boots
```

If that returns a single line, or nothing, your journal is volatile. To make it
persistent:

```bash
sudo mkdir -p /var/log/journal
sudo systemd-tmpfiles --create --prefix /var/log/journal
sudo systemctl restart systemd-journald
```

Or set it explicitly in `/etc/systemd/journald.conf`:

```ini
[Journal]
Storage=persistent
SystemMaxUse=500M
```

Set a size cap while you are in there. An uncapped journal on a chatty system can fill the
disk, which turns a logging problem into an outage. `journalctl --disk-usage` reports the
current size, and `sudo journalctl --vacuum-time=30d` trims it by age.

**Turn persistence on before you need it.** After the crash, the evidence is already gone.

### A diagnostic workflow

When a service will not start, ask three questions in order before changing anything:

1. **`systemctl status nginx`** — is it actually failed, and which unit file is in effect?
2. **`journalctl -u nginx -b`** — why did it fail? The error is almost always here, in
   plain language, in the last twenty lines.
3. **`systemctl cat nginx`** — what is the unit actually configured to do, including
   overrides you may have forgotten?

Then fix the problem, validate the fix if the program offers a way to (`nginx -t`), and
apply it:

```bash
sudo systemctl daemon-reload
sudo systemctl restart nginx
systemctl status nginx
```

Guessing at step four without doing steps one through three is how afternoons disappear.

---

## Quick reference

Table: The `systemctl` verbs covered in this lecture

| Command | Purpose |
| --- | --- |
| `systemctl status UNIT` | Full state: file, enabled, active, PIDs, recent logs |
| `systemctl start UNIT` | Start now |
| `systemctl stop UNIT` | Stop now |
| `systemctl restart UNIT` | Stop and start; drops connections |
| `systemctl reload UNIT` | Reread configuration without stopping |
| `systemctl enable UNIT` | Start automatically at boot |
| `systemctl disable UNIT` | Do not start at boot |
| `systemctl enable --now UNIT` | Enable and start together |
| `systemctl mask UNIT` | Make the unit unstartable by anything |
| `systemctl unmask UNIT` | Undo a mask |
| `systemctl is-active UNIT` | Query running state; useful exit status |
| `systemctl is-enabled UNIT` | Query boot state; useful exit status |
| `systemctl cat UNIT` | Show the unit file in effect, plus drop-ins |
| `systemctl edit UNIT` | Create or edit a drop-in override |
| `systemctl daemon-reload` | Re-read unit files from disk |
| `systemctl list-units --type=service` | Units loaded now |
| `systemctl list-unit-files --type=service` | Unit files on disk |
| `systemctl --failed` | Everything currently in a failed state |
| `systemctl get-default` | The target booted into by default |
| `systemctl isolate TARGET` | Switch to a target immediately |

Table: Boot-phase commands and the phase each one investigates

| Command | Phase | Answers |
| --- | --- | --- |
| `efibootmgr -v` | 1 — Firmware | What boot entries does the firmware have? |
| `lsblk` | 1 — Firmware | Where is the EFI System Partition mounted? |
| `cat /etc/default/grub` | 2 — Bootloader | What is GRUB configured to do? |
| `cat /proc/cmdline` | 2 — Bootloader | What did GRUB pass to the kernel? |
| `dmesg -T` | 3 — Kernel | What did the kernel find, and what failed? |
| `lsinitramfs /boot/initrd.img-$(uname -r)` | 3 — Kernel | What is in the initramfs? |
| `ps -p 1 -o pid,comm` | 4 — PID 1 | What is actually running as PID 1? |
| `systemd-analyze critical-chain` | 4 — PID 1 | What is making the boot slow? |
| `get-serial-port-output` | All four | What did the console show? |

## Common pitfalls

- **Editing `/boot/grub/grub.cfg`.** It is regenerated on every kernel update. Edit
  `/etc/default/grub` and run `update-grub`.
- **Editing a unit file in `/lib/systemd/system/`.** The next package upgrade overwrites
  it. Use `systemctl edit` instead.
- **Starting without enabling.** The service runs perfectly until the next reboot, and then
  it does not. Check `is-enabled` after every fix that involved a `start`.
- **Editing a unit by hand and forgetting `daemon-reload`.** systemd is still running the
  old definition. `systemctl edit` does the reload for you; a text editor does not.
- **`daemon-reload` without `restart`.** systemd has re-read the file, but the running
  process is still the old one. Both steps are required.
- **`Requires=` without `After=`.** Both units start simultaneously and the dependent one
  fails to connect. Name the same unit in both directives.
- **Reloading an untested configuration.** Validate first: `nginx -t && systemctl reload nginx`.
- **Assuming `-b -1` will work.** It returns nothing unless the journal is persistent.
  Enable persistence before you need it.
- **Rebooting after a storage or kernel change without watching.** If the initramfs is
  wrong, you want to find out while you are at the console, not weeks later.

## Further reading

- `man systemctl`, `man journalctl`, `man systemd.unit`, `man systemd.service`
- `man 7 boot` — the boot process from the kernel's point of view
- `man systemd-analyze`, `man 8 update-initramfs`, `man 8 efibootmgr`, `man 5 systemd.exec`
- [systemd for Administrators](https://0pointer.de/blog/projects/systemd-for-admins-1.html)
  — Lennart Poettering's series. Opinionated, and written by the author
- [systemd documentation](https://systemd.io/) — the freedesktop.org reference
- [GNU GRUB manual](https://www.gnu.org/software/grub/manual/grub/grub.html)
- [Compute Engine: viewing serial port output](https://cloud.google.com/compute/docs/troubleshooting/viewing-serial-port-output)
- [Compute Engine: interacting with the serial console](https://cloud.google.com/compute/docs/troubleshooting/troubleshooting-using-serial-console)
