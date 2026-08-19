---
title: What is Linux?
subtitle: CSC 118 — Lecture 1
---

## Overview

This first chapter answers a question that sounds simple and turns out not to
be: *what is Linux?* The short answer is that Linux is an operating system
kernel — one program, sitting between hardware and everything else. The longer
answer is that almost nobody runs "Linux" by itself. What people install, boot,
and use is a **distribution**: the Linux kernel packaged together with GNU
utilities, a package manager, an init system, and a set of defaults.

Getting that distinction straight early pays off for the rest of the course.
When something breaks, it matters whether you are looking at a kernel problem, a
GNU tool problem, or a distribution packaging choice. Those are three different
groups of people, three different sets of documentation, and three different
fixes.

By the end of this chapter you should be able to:

- Describe the boot chain from firmware to init, and name the kernel's place in it
- List the major responsibilities a kernel is expected to handle
- Explain the difference between Linux, GNU, and GNU/Linux, and why the naming argument exists
- Explain what "free software" means and why it is not about price
- Identify what actually distinguishes one distribution from another
- Trace the major distribution families back to their roots
- Explain why Linux dominates servers, embedded devices, and the cloud while remaining a niche desktop

---

## Linux is an operating system kernel

### The boot chain

A computer does not start out able to run your programs. It gets there through a
chain of handoffs, each stage loading and transferring control to the next.

**1. Firmware (BIOS/UEFI).** Code stored on the motherboard, running before any
disk is touched. It initializes hardware, runs power-on self-tests, and then
looks for a bootable device — a disk, a USB stick, a network interface. Its job
ends once it has found something to hand control to. Modern systems use UEFI,
which understands filesystems (specifically the FAT-formatted EFI System
Partition) and can load a boot program by path. The older BIOS scheme could only
read a fixed-size block from the front of a disk.

**2. Bootloader (GRUB, systemd-boot, and others).** Loaded from the boot device
by the firmware. This is the stage that usually presents a menu — which kernel,
which recovery option, which other operating system. Its real work is to locate
a kernel image on disk, load it into memory along with an initial RAM filesystem
(`initramfs`), and jump to it, passing along a command line of boot parameters.

**3. Kernel.** Takes control from the bootloader. It decompresses itself,
initializes hardware drivers, sets up memory management, mounts the root
filesystem, and then starts the first user-space process.

**4. Init system.** That first process gets process ID 1 and is the ancestor of
every other process on the system. It starts system services, mounts remaining
filesystems, brings up networking, and gets the machine to a usable state — a
login prompt or a graphical session. On most modern distributions this is
`systemd`.

### Where the kernel sits

Two points about stage 3 are worth dwelling on.

First, the kernel is the **bridge** between a very dumb stage and a very rich
one. The bootloader knows how to copy a file into memory and jump to it, and
essentially nothing else. What comes after the kernel is a full multi-user
operating system with networking, filesystems, and dozens of running services.
The kernel is what closes that gap.

Second, the kernel **stays resident in memory** for as long as the system is
running. It is not a startup program that finishes and exits. Every file you
open, every packet you send, every byte of memory you allocate goes through it.
When people say a program "runs on Linux," this is what they mean: the program
is making requests of that resident kernel.

Programs do not call kernel functions directly. User-space code runs in a
restricted CPU mode and asks the kernel for service through **system calls** —
`open`, `read`, `write`, `fork`, `execve`, and roughly three hundred others.
That boundary between user space and kernel space is the central architectural
line in the system, and much of this course is about learning to work on the
user-space side of it.

### Responsibilities of a kernel

These are the jobs any general-purpose kernel takes on. Linux does all of them.

**Process management.** Creating processes, scheduling them onto CPU cores,
terminating them, and context switching between them. On a machine with four
cores and three hundred processes, the scheduler is deciding many times per
second who runs next. It also tracks the parent/child relationships that make
`ps` output a tree.

**Memory management.** Handing out and reclaiming RAM, maintaining the virtual
memory mapping that gives every process the illusion of its own private address
space, paging inactive memory to swap, and enforcing memory protection so one
process cannot read or corrupt another's data.

**Device management.** Talking to hardware through device drivers, and
presenting a uniform interface to programs so that reading from a disk, a
keyboard, and a network card all look broadly similar. Linux drivers are
compiled into the kernel or loaded on demand as **modules**.

**Filesystem management.** Organizing data on storage devices; managing file
access, permissions, ownership, and metadata. Linux supports many filesystem
types (ext4, XFS, Btrfs, FAT, NTFS, and more) behind a common interface called
the Virtual File System layer, which is why `cat` works the same on all of them.

**Interrupt handling.** Responding when hardware signals that something happened
— a key was pressed, a disk finished a read, a timer expired — and dispatching
to the right handler quickly enough that nothing is lost.

**System call interface.** Providing the documented API that user-space programs
use to request kernel services. This interface is deliberately stable: Linus
Torvalds's well-known rule is that the kernel does not break user space, so a
binary compiled decades ago should still run.

**Security and access control.** Enforcing file permissions, isolating processes
from one another, managing user and group privileges, and deciding what a
process is allowed to do. Additional frameworks (SELinux, AppArmor,
capabilities, seccomp) layer more precise controls on top.

**Inter-process communication (IPC).** Letting processes talk to each other
through pipes, shared memory, message queues, sockets, and signals. Every time
you type a shell pipeline like `ls | grep txt`, you are using kernel IPC.

> **A note on kernel design.** Linux is a *monolithic* kernel: drivers and
> subsystems run in kernel space as one large program, with modules loaded at
> runtime. The competing design is the *microkernel*, which keeps only the
> minimum in kernel space and pushes drivers out into user-space servers. MINIX
> and GNU Hurd are microkernels. In 1992 Andrew Tanenbaum, MINIX's author,
> publicly argued that Linux's monolithic design was obsolete; the resulting
> exchange with Torvalds is one of the more famous arguments in computing. In
> practice Linux's modular monolith has held up well.

---

## The birth of a new kernel

In 1991 Linus Torvalds was a student at the University of Helsinki using MINIX,
a small Unix-like teaching operating system written by Andrew Tanenbaum. MINIX
was deliberately limited — it was meant to be readable by students, and its
license restricted redistribution of modified versions. Torvalds started writing
his own kernel for the 386, and in August posted this to the `comp.os.minix`
newsgroup:

```text
From: torvalds@klaava.Helsinki.FI (Linus Benedict Torvalds)
Newsgroups: comp.os.minix
Subject: What would you like to see most in minix?
Summary: small poll for my new operating system
Message-ID: <1991Aug25.205708.9541@klaava.Helsinki.FI>
Date: 25 Aug 91 20:57:08 GMT
Organization: University of Helsinki

Hello everybody out there using minix -

I'm doing a (free) operating system (just a hobby, won't be big and
professional like gnu) for 386(486) AT clones.  This has been brewing
since april, and is starting to get ready.  I'd like any feedback on
things people like/dislike in minix, as my OS resembles it somewhat
...
```

Two things about this message are worth noticing. The first is how wrong the
modest framing turned out to be — "just a hobby, won't be big and professional
like gnu" describes software that now runs most of the internet. The second is
the offhand comparison to GNU, which tells you that a free Unix-like system was
already an active project in 1991. GNU had the tools and was missing a working
kernel. Torvalds had a kernel and needed tools.

The first public release, version 0.01, came in September 1991. In early 1992
Torvalds relicensed the kernel under the GNU General Public License, which
turned out to be as consequential as any technical decision in the project: it
guaranteed that companies could use and improve Linux but not close it off.

---

## What is GNU/Linux?

### Two projects that fit together

The **GNU Project** was started by Richard Stallman in 1983 with the goal of
building a complete Unix-compatible operating system made entirely of free
software. "GNU" is a recursive acronym: *GNU's Not Unix*. By 1991 the project
had produced an enormous amount of working software — the GCC compiler, the Bash
shell, the coreutils (`ls`, `cp`, `cat`, `mv`), `make`, `grep`, `sed`, the Emacs
editor, the C library. What it did not have was a finished kernel; GNU's own
kernel, Hurd, was and remains incomplete.

So the pieces fit: **Linux is a kernel**, and GNU supplied nearly everything else
a user actually touches. Combining them produced a complete, freely licensed
Unix-like operating system, which is why the
[Free Software Foundation](https://www.fsf.org/) asks that
these systems be called **GNU/Linux** rather than just Linux. Many people say
"Linux" for the whole system out of habit. Both usages are common; the important
thing is knowing which layer you are talking about.

### Free as in freedom, not as in beer

"Free software" is about liberty, not price. The Free Software Foundation
defines it by four freedoms:

| Freedom | What it means |
| --- | --- |
| 0 | Run the program for any purpose |
| 1 | Study how it works and change it (requires source code) |
| 2 | Redistribute copies |
| 3 | Distribute your modified versions |

The GPL enforces these through **copyleft**: you may modify and redistribute GPL
software, but the result must carry the same license. Freedom propagates instead
of being stripped out downstream. Other free licenses (MIT, BSD, Apache) are
*permissive* — they allow redistribution in closed-source products. Both styles
are free software; they differ on whether freedom must be passed along.

You will also see the term **open source**, popularized in 1998 and largely
overlapping in practice. The difference is emphasis: "free software" foregrounds
the ethical claim, "open source" foregrounds the practical benefits of a public
development model. **FOSS** (Free and Open Source Software) is the common
umbrella term.

Eric S. Raymond's essay *[The Cathedral and the
Bazaar](https://en.wikipedia.org/wiki/The_Cathedral_and_the_Bazaar)* (1997) is the classic
description of why this development model works. The "cathedral" is software built quietly by a
small group and released when finished; the "bazaar" is Linux — public, noisy, release early and
often, with contributions from anyone.  Raymond's argument was that the bazaar produces better
software, and Linux was his evidence.

---

## Where Linux actually runs

Market share for operating systems depends entirely on which market you ask
about. Here is the picture by segment:

| Segment | Linux-based | Windows | Apple | Other |
| --- | ---: | ---: | ---: | ---: |
| Desktop & laptop | 5.1% <sup>a</sup> | 66.5% | 12.5% | 16.0% <sup>b</sup> |
| Smartphones | 72% <sup>c</sup> | — | 24% | 3% <sup>d</sup> |
| Tablets | 48.9% <sup>c</sup> | <0.1% | 51.0% | 0.2% |
| Public/Web servers | 92% <sup>e</sup> | 8.2% | — | — |
| Supercomputers | 100% | 0% | 0% | 0% |

- <sup>a</sup> Linux 3.9% + ChromeOS 1.2%
- <sup>b</sup> StatCounter reports 16.0% "Unknown" — larger than the entire Mac share
- <sup>c</sup> Android
- <sup>d</sup> HarmonyOS NEXT, which replaced the Linux kernel with Huawei's own
- <sup>e</sup> "Unix-like"; W3Techs percentages overlap, so this row does not total 100%

Sources: [StatCounter](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems)
desktop Dec 2025 and tablet Oct 2025 · Counterpoint Q4 2025 ·
[W3Techs](https://w3techs.com/technologies/overview/operating_system) Aug 2026 ·
[TOP500](https://www.top500.org/lists/top500/2026/06/) June 2026.

Read the column top to bottom and the story is clear. On the desktop Linux is a
rounding error. Everywhere else it ranges from dominant to total: it is the
kernel inside every Android phone, most tablets, the overwhelming majority of
web servers, and — since 2017 — every single machine on the TOP500
supercomputer list.

The common summary is that "Linux lost the desktop." A more useful framing is
that the desktop is the one segment Linux lost, and also the only segment most
people ever look at directly. If you judge an operating system by what is running
on the laptop in front of you, you are sampling the single least representative
part of the market.

That is also the practical argument for this course. Almost every network
service you use today is answered by a Linux machine. Knowing how to operate one
is a general-purpose skill, not a hobbyist one.

---

## Linux distributions

### What a distribution is

Nobody ships you a bare kernel. A **distribution** (or "distro") is the kernel
plus the enormous collection of decisions and software needed to make a usable
system. Distributions differ along a handful of axes:

**Init system.** The program that runs as PID 1 and manages services.
Historically this was System V init, which organized the system into numbered
*runlevels* and ran shell scripts in a fixed order, or the BSD `rc` style, which
used a smaller set of scripts. Both have been largely replaced by **systemd**,
which starts services in parallel based on declared dependencies, supervises
them, and absorbs a range of other system-management jobs. systemd's scope has
made it controversial; a few distributions still avoid it deliberately.

**Package manager.** How software is installed, updated, and removed, and how
dependency relationships are tracked. The major families:

| Format / tool | Origin | Typical front end |
| --- | --- | --- |
| RPM | Red Hat | `dnf`, `yum`, `zypper` |
| DEB | Debian | `apt` |
| Portage | Gentoo | `emerge` (builds from source) |
| Pacman | Arch | `pacman` |

The package manager is the single most visible difference between distributions
in day-to-day use, which is why "which package manager does it use?" is usually
the first question asked about an unfamiliar distro.

**Target audience.** Enterprise servers, desktop newcomers, and power users want
very different defaults. A distribution aimed at beginners hides complexity; one
aimed at power users exposes it.

**Support model.** Community-driven (Debian, Arch) or corporate-backed (RHEL,
SUSE, Ubuntu). Corporate backing buys you paid support contracts, certified
hardware, and long guaranteed lifetimes — the things enterprise procurement
requires.

**Release cycle and stability.** *Fixed* releases ship on a schedule and then
freeze, receiving only security and bug fixes; you get predictability at the cost
of running older software. *Rolling* releases update continuously; you get
current software at the cost of a system that changes under you. Debian stable
and RHEL sit at one end, Arch and Gentoo at the other.

**Defaults.** Which desktop environment, which filesystem layout, which services
are on out of the box, what counts as the "base system," and how much
configuration is done for you.

> **A note on doing it yourself.** If you want to see exactly how much a distribution does for
> you, build a system without one.  [Linux From Scratch](https://www.linuxfromscratch.org/) is not
> a distribution but a book: step-by-step instructions for compiling a working Linux system from
> upstream source, starting with a cross-compiler toolchain and ending at a bootable machine.
> There is no installer, no package manager, and nothing chosen on your behalf — every one of the
> axes above becomes a decision you make by hand. The companion volume, *Beyond Linux From
> Scratch*, continues into networking, desktops, and server software. Almost nobody runs an LFS
> system in production; the payoff is the knowledge and experience gained and that afterward you
> know what is in the box > and who put it there.

### Primary lineage

A small number of distributions were built from scratch. Nearly everything else
descends from one of them.

| Distribution | Year | Note |
| --- | --- | --- |
| Slackware | 1993 | The oldest distribution still maintained; minimal, deliberately conservative |
| Debian | 1993 | Community project with a formal social contract; ancestor of Ubuntu and many others |
| Red Hat Linux | 1994 | Introduced RPM; ancestor of RHEL, Fedora, CentOS, Rocky |
| Arch | 2002 | Rolling release, minimal defaults, build-it-yourself philosophy |
| Gentoo | 2002 | Source-based; started in 1999 as Enoch |
| Android | 2008 | Linux kernel with an entirely non-GNU user space, for phones and tablets |

Android deserves special attention because it breaks the pattern. It uses the
Linux kernel but replaces the GNU user space wholesale — different C library
(Bionic), different init, different application model built on a Java runtime.
It is a Linux system that is emphatically not a GNU/Linux system, which is a
good illustration of why the distinction between kernel and user space matters.

### Successors and progeny

Once a base exists, specialization follows. A few representative descendants:

- **RHEL** (from Red Hat, 2002) — Red Hat Enterprise Linux: long support
  lifetimes, certified hardware and applications, paid support. The reference
  platform for enterprise Linux.
- **Yellow Dog** (Red Hat lineage, 1999) — PowerPC and HPC focus. Version 5.0
  (2006) supported the Cell Broadband Engine, which made it the way to run Linux
  on a Sony PlayStation 3.
- **OpenWrt** (Debian-style tooling, 2004) — embedded firmware for routers and
  wireless access points, especially MIPS-based hardware. Replaces vendor
  firmware with a fully configurable Linux system.
- **FreedomBox** (Debian, 2011) — a self-hosted home server for web and internet
  services, built around a privacy-first design.
- **Raspbian** (Debian, 2012) — Debian rebuilt for the Raspberry Pi 1's ARM
  processor; now continued as Raspberry Pi OS.
- **Rocky** (RHEL, announced 2020, first release 2021) — a free, bug-for-bug
  compatible rebuild of RHEL, created after Red Hat redirected CentOS away from
  that role.

The pattern to take away: a distribution family shares a package format, a
release philosophy, and usually a great deal of documentation. Learning one
member of a family gets you most of the way to any other member. Learning Ubuntu
teaches you most of Debian; learning Rocky teaches you most of RHEL.

The six roots and six descendants above are a deliberately small sample. To see
how far the branching actually goes, look at DistroWatch's
[Linux family tree](https://distrowatch.com/images/other/distro-family-tree.png),
which charts hundreds of distributions back to their ancestors, and Wikipedia's
[Linux distribution](https://en.wikipedia.org/wiki/Linux_distribution) article,
which surveys the major families in prose. Do not try to memorize either one.
Use them the way you would use a map: to place an unfamiliar distribution in a
family whose conventions you already know.

---

## Reasons for running Linux

### For daily users

- **Efficient use of hardware.** Linux runs well on machines that current
  Windows or macOS releases have abandoned. A lightweight desktop environment on
  a decade-old laptop is a genuinely usable computer.
- **Extensive UI options.** GNOME, KDE Plasma, Xfce, Cinnamon, and tiling window
  managers like i3 and Sway are all real choices, not themes. The interface is a
  replaceable component.
- **Distribution and environment choice.** You are not stuck with one vendor's
  idea of how a computer should work.
- **Total control.** Configuration is text files you can read, edit, diff, and
  put in version control. Most of it can be changed while the system is running.
- **Learning opportunities.** The entire system is inspectable. When you want to
  know how something works, the source and the documentation are both available.
- **Internationalization.** Unmatched support for locales, input methods, and
  writing systems, largely because contributors worldwide needed it and could
  add it.
- **Home integration and automation.** Cross-platform tooling for home
  automation, media serving, backups, and network services, most of it free.

The honest counterweight: commercial software support is uneven. Adobe's
products, Microsoft Office, and many games either do not run or run through
compatibility layers. Hardware with vendor-only drivers can be a problem. These
are real costs and worth naming.

### As an enterprise desktop

Organizations choose Linux desktops for reasons individuals rarely think about:

- **Custom desktop environments** deployed identically to thousands of machines
  from a single image or configuration management system
- **Sophisticated security controls and a reduced attack surface** — install only
  what the role requires, and enforce mandatory access control with SELinux or
  AppArmor
- **Default tool installation** so every machine in a role has exactly the same
  software
- **Custom dashboards and administration tools** built from the same scriptable
  components administrators already use
- **Managed privilege escalation** through `sudo` policy, with fine-grained,
  auditable rules about who may run what

The theme is that everything is configurable through files and scriptable
through the command line — which means everything is automatable at scale. That
is the actual enterprise argument.

### As an embedded system

Your router, your television, your car's infotainment system, and most of the
industrial equipment you will never see are likely running Linux. The reasons:

- **No licensing fees.** At a million units, per-unit OS licensing is a line
  item that Linux eliminates.
- **Highly customizable.** Strip the system down to a kernel and a handful of
  binaries to fit constrained flash and RAM.
- **Broad hardware support.** ARM, MIPS, RISC-V, x86, and more, all from one
  kernel source tree.
- **Stability and longevity.** Long-term support kernels get security fixes for
  years, which matters for a product with a ten-year field life.
- **Active ecosystem.** Vendor toolchains, build systems like Yocto and
  Buildroot, extensive documentation, and a large pool of engineers who already
  know it.

Note the GPL consequence here: a vendor shipping a modified Linux kernel in a
device must make that kernel source available. This is exactly what makes
projects like OpenWrt possible.

### For network services

- Advanced networking: sockets, routing, traffic shaping, and firewalling
  (`netfilter`/`nftables`) built into the kernel
- Kernel support for a very large number of protocols and hardware technologies
- Mature security infrastructure — mandatory access control, capabilities,
  namespaces, auditing
- Efficient, standards-compliant network stacks that are used and tested at
  extreme scale
- The reference implementations of most internet services (web, DNS, mail,
  databases, proxies) run here first

---

## Linux and the cloud

### Containerization

A container looks like a lightweight virtual machine, but there is no second
kernel involved. A container is just a normal Linux process that the kernel has
restricted and isolated using features it already had. Three kernel facilities
do the work:

**Namespaces.** Isolation of what a process can *see*. Each namespace type
virtualizes one global resource: PID namespaces give a process its own process
tree (its `init` thinks it is PID 1), network namespaces give it its own
interfaces and routing table, mount namespaces its own filesystem view, and so
on for users, hostnames, and IPC.

**Control groups (cgroups).** Limiting and accounting for what a process can
*use* — CPU shares, memory ceilings, I/O bandwidth, process counts. Namespaces
say what you can see; cgroups say how much you can have.

**Union filesystems.** Layered storage, usually OverlayFS, which stacks
read-only image layers under a thin writable layer. This is why container images
share common layers instead of duplicating them, and why a container starts in
milliseconds rather than booting.

**Docker, Podman, and LXC** are tools built on these primitives. They handle
image formats, registries, and lifecycle management, but the isolation itself is
the kernel's. The **OCI** (Open Container Initiative) specifications standardized
the image and runtime formats that grew out of this work, and they are now the
industry-wide definition of what a container is.

The consequence: containers are a Linux technology. Docker on Windows or macOS
runs a Linux virtual machine to host them.

### Cloud computing

- **Dominant cloud OS.** Linux runs 90%+ of public cloud workloads across AWS,
  Azure, and Google Cloud. Microsoft's own cloud runs more Linux than Windows.
- **KVM.** The Kernel-based Virtual Machine turns the Linux kernel itself into a
  type-1 hypervisor. A cloud provider can run guest VMs natively, with hardware
  virtualization support, on a stock kernel.
- **Lightweight footprint.** A minimal Linux server image can boot in seconds
  with tens of megabytes of RAM, which matters when you are billing by the
  instance-second.
- **Kubernetes.** The industry-standard container orchestrator, designed around
  Linux container primitives and overwhelmingly run on Linux nodes.
- **Open source ecosystem.** Providers can modify the kernel for their own
  hardware and contribute the work back, so improvements compound across the
  industry instead of staying proprietary.

### Why Linux won the cloud

Four factors, and none of them is a single killer feature:

1. **Free licensing at massive scale.** When you operate hundreds of thousands
   of servers, per-instance licensing changes the economics of the whole
   business.
2. **Decades of stability and security hardening.** By the time cloud computing
   arrived, Linux had already been running serious production workloads for
   years.
3. **A vibrant community driving rapid innovation.** Containers, cgroups, and
   eBPF were all built by people who needed them and could modify the kernel to
   get them.
4. **Flexibility across hardware.** The same kernel runs on a $5 board and a
   mainframe, so the software you write for one has a path to the other.

Notice how much of this traces back to the licensing decision Torvalds made in
1992. The GPL is why cloud providers could build on Linux without permission,
and copyleft is why their kernel improvements came back to everyone.

---

## Try it yourself

If you have access to a Linux system (a VM, a Raspberry Pi, WSL, or a lab
machine), these commands make the chapter concrete. Do not worry about the
syntax yet — we will cover all of it. Just look at the output.

```sh
uname -a                  # kernel name, version, and architecture
cat /etc/os-release       # which distribution and release this is
ps -p 1 -o pid,comm       # what is running as PID 1 (your init system)
uptime                    # how long the kernel has been resident
```

Notice that `uname` and `/etc/os-release` answer two genuinely different
questions. The first tells you about the kernel; the second tells you about the
distribution wrapped around it. Two machines can report the same kernel version
and be completely different systems to work on.

---

## Key terms

| Term | Meaning |
| --- | --- |
| Kernel | The resident program that manages hardware and mediates all access to it |
| Firmware (BIOS/UEFI) | Motherboard code that initializes hardware and finds a bootable device |
| Bootloader | Program that loads the kernel into memory and starts it (GRUB, systemd-boot) |
| initramfs | Temporary in-memory root filesystem used to reach the real root filesystem |
| Init system | The first user-space process (PID 1); starts and supervises services |
| systemd | The dominant modern init system, replacing System V init and BSD `rc` |
| System call | The API through which user-space programs request kernel services |
| User space / kernel space | The privilege boundary separating ordinary programs from the kernel |
| Monolithic kernel | Design where drivers and subsystems run inside the kernel (Linux) |
| Kernel module | Driver or subsystem loadable into a running kernel |
| GNU | Project supplying the free Unix-compatible tools that surround the kernel |
| GNU/Linux | The complete operating system: Linux kernel plus GNU user space |
| FOSS | Free and Open Source Software |
| Four freedoms | Run, study/modify, redistribute, distribute modified versions |
| GPL / copyleft | License requiring derivative works to carry the same freedoms |
| Permissive license | Free license allowing closed-source redistribution (MIT, BSD, Apache) |
| Distribution | Kernel + user space + package manager + init + defaults, shipped together |
| Package manager | Tool that installs, updates, and resolves dependencies (`apt`, `dnf`, `pacman`) |
| Fixed vs. rolling release | Scheduled frozen releases vs. continuous updates |
| Namespace | Kernel feature isolating what a process can see |
| cgroup | Kernel feature limiting what resources a process can use |
| Union filesystem | Layered filesystem (OverlayFS) enabling shared container image layers |
| Container | An isolated process using namespaces, cgroups, and layered storage |
| KVM | Hypervisor built into the Linux kernel |
| OCI | Open Container Initiative; the standards defining container images and runtimes |

---

## Check your understanding

1. Put the four boot stages in order and state what each one hands to the next.
2. A program calls `open()` to read a file. Which kernel responsibilities are
   involved before the data reaches the program?
3. Why does the Free Software Foundation prefer the name "GNU/Linux"? Give the
   strongest argument for and against.
4. Android uses the Linux kernel. Explain why it is nevertheless not a
   GNU/Linux system.
5. Linux holds about 5% of desktops and 100% of supercomputers. Give two
   reasons that are not contradictory.
6. You need a server that will run unattended for five years with security
   patches. Would you choose a fixed or rolling release distribution, and why?
7. A container is described as "lighter than a virtual machine." In terms of
   kernels, what exactly is lighter about it?
8. Which single decision from 1992 most shaped Linux's role in the cloud, and
   through what mechanism?

---

## Further reading

- [LinuxCommand.org — William Shotts](https://linuxcommand.org)
- [The Linux Command Line — William Shotts](https://linuxcommand.org/tlcl.php)
- [Linux Fundamentals — Paul Cobbaut](https://linux-training.be/linuxfun.pdf)
- [Linux Networking — Paul Cobbaut](http://linux-training.be/linuxnet.pdf)
- [The Linux History Archive — Torvalds's original announcement](https://www.cs.cmu.edu/~awb/linux.history.html)
- [GNU — What is Free Software?](https://www.gnu.org/philosophy/free-sw.en.html)
- [GNU (Wikipedia)](https://en.wikipedia.org/wiki/GNU)
- [Free Software Foundation](https://www.fsf.org/)
- [The Cathedral and the Bazaar](https://en.wikipedia.org/wiki/The_Cathedral_and_the_Bazaar)
- [The Linux Family Tree — DistroWatch](https://distrowatch.com/images/other/distro-family-tree.png)
- [Linux distribution (Wikipedia)](https://en.wikipedia.org/wiki/Linux_distribution)
- [Linux From Scratch](https://www.linuxfromscratch.org/)
- [TOP500 supercomputer list](https://www.top500.org/lists/top500/)
