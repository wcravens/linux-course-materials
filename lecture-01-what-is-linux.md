---
theme: seriph
title: What is Linux?
info: |
  ## CSC 118 — Lecture 1
  An introduction to the Linux kernel, GNU/Linux, distributions,
  and where Linux runs today.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---

# What is Linux?

CSC 118 · Lecture 1

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---
layout: section
---

# What is Linux?

---

# Linux is an Operating System Kernel

When you power on a computer, the boot process follows a chain of handoffs:

1. **Firmware (BIOS/UEFI)** — hardware initializes and runs self-tests, then locates a bootable device
2. **Bootloader (GRUB, systemd-boot, etc.)** — loaded from the boot device; presents boot options and loads the kernel into memory
3. **Kernel** — takes control from the bootloader, initializes hardware drivers, mounts the root filesystem, then starts the first user-space process (init/systemd as PID 1)
4. **Init system** — starts system services and brings the system to a usable state

---

# The Kernel's Place in the Chain

- The kernel is the **bridge** between the low-level bootloader — which only knows how to load a file into memory — and the full operating system environment
- Once loaded, the kernel **remains resident in memory** for the entire time the system is running
- Everything that follows goes through it: it manages all hardware and software interactions

---

# Responsibilities of a Kernel <span class="text-2xl opacity-50">(1 of 2)</span>

- **Process management** — creating, scheduling, and terminating processes; context switching between running programs
- **Memory management** — allocating/deallocating RAM, virtual memory, paging, and memory protection between processes
- **Device management** — interfacing with hardware through device drivers; handling I/O operations
- **File system management** — organizing data on storage devices; managing file access, permissions, and metadata

---

# Responsibilities of a Kernel <span class="text-2xl opacity-50">(2 of 2)</span>

- **Interrupt handling** — responding to hardware and software interrupts; dispatching to appropriate handlers
- **System call interface** — providing the API that user-space programs use to request kernel services
- **Security and access control** — enforcing permissions, isolating processes, managing user privileges
- **Inter-process communication (IPC)** — enabling processes to communicate via pipes, shared memory, message queues, signals

---

# The Birth of a New Kernel

As a student, Linus Torvalds posted to USENET in 1991 announcing a pet project...

```text {all}
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

<div class="text-sm opacity-70 mt-2">

Source: [The Linux History Archive](https://www.cs.cmu.edu/~awb/linux.history.html)

</div>

---

# What is GNU/Linux?

- GNU/Linux grew out of the emerging **FOSS** culture
- **Linux is a kernel.** GNU is a project to provide free software tools for Unix systems
  - [GNU (Wikipedia)](https://en.wikipedia.org/wiki/GNU)
  - [GNU — What is Free Software?](https://www.gnu.org/philosophy/free-sw.en.html)
- Free as in **'freedom'**, not as in **'beer'**
  - [The Cathedral and the Bazaar](https://en.wikipedia.org/wiki/The_Cathedral_and_the_Bazaar)
- The union of GNU + Linux — the correct name for Linux-based operating systems is **GNU/Linux**

---

# Market Share of Operating Systems

[Usage share of operating systems (Wikipedia)](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems)

- [Desktop and laptop computers](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems#Desktop_and_laptop_computers)
- [Smartphone OS by usage](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems#Smartphones_OS_by_usage)
- [Tablet computer OS by usage](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems#Tablet_computers_OS_by_usage)
- [Public servers on the Internet](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems#Public_servers_on_the_Internet)
- [HPC / supercomputers](https://en.wikipedia.org/wiki/Usage_share_of_operating_systems#Supercomputers)

---
layout: section
---

# Linux Distributions

---

# What is a Distribution?

- **Init system** — historically SystemV (runlevels) vs. BSD (rc); largely replaced by `systemd`
- **Package manager** — RPM (Red Hat), DEB (Debian), Portage (Gentoo), Pacman (Arch)
- **Target audience** — enterprise/server, desktop beginner, or power user
- **Support model** — community-driven vs. corporate-backed
- **Release cycle & stability** — fixed scheduled releases (stability) vs. rolling continuous updates (agility)
- **Defaults** — GUI, configuration, 'base system'

---

# Primary Lineage <span class="text-2xl opacity-50">(originals / roots)</span>

- **Slackware** — 1993
- **Debian** — 1993
- **Red Hat Linux** — 1994
- **Arch** — 2002
- **Gentoo** — 2002 *(started 1999 as Enoch)*
- **Android** — 2008; embedded system supporting mobile phones and tablets
- ... and more

---

# Successors and Progeny

- **RHEL** (Red Hat) — 2002: Red Hat Enterprise Linux; commercially supported OS & applications for enterprise
- **OpenWrt** (Debian-style tooling) — 2004: embedded system supporting many routers and WAP devices (especially MIPS-based)
- **Yellow Dog** (Red Hat) — 1999; HPC multicore. Version 5.0 (2006) supported the Cell Broadband Engine in the Sony PS3
- **FreedomBox** (Debian) — 2011: domestic web/internet services with a 'privacy first' priority
- **Raspbian** (Debian) — 2012: support for the Raspberry Pi 1
- **Rocky** (RHEL) — announced 2020, first release 2021: replacement for CentOS; open/free build of RHEL

---
layout: section
---

# Reasons for Running Linux

---
layout: two-cols
layoutClass: gap-8
---

# Advantages for Daily Users

- Efficient use of hardware resources — repurpose otherwise deficient hardware
- Extensive UI options & custom configuration
- Distribution and environment choices
- Total control of hardware, OS, and desktop resources — including at runtime

::right::

<div class="mt-14" />

- Learning opportunities & resources
- Unparalleled support for I18n (internationalization & localization)
- Cross-platform home/appliance integration and automation
- ...

---

# Linux as an Enterprise Desktop Environment

- Deploy custom desktop environments
- Sophisticated security controls and reduced attack surface
- Default tool installation
- Custom dashboard tool display
- Custom administration tools
- Manage privilege escalation

---

# Linux as an Embedded System

- **No licensing fees** — reduces per-unit cost at scale
- **Highly customizable** — strip down to a minimal footprint for resource-constrained hardware
- **Broad hardware support** — runs on diverse architectures (ARM, MIPS, RISC-V, x86)
- **Stability & longevity** — proven reliability with long-term support options
- **Active ecosystem** — large community, extensive documentation, vendor toolchains

---

# Linux for Network Services

- Advanced network/socket, routing, and firewall support
- Kernel support for *many* protocols and hardware technologies
- Advanced security infrastructure
- Efficient and standards-compliant network stacks
- Everything else under the sun, and more
- ...

---
layout: section
---

# Linux and the Cloud

---

# Linux and Containerization

- **Namespaces** — kernel feature providing process isolation (PID, network, mount, user, etc.)
- **cgroups (control groups)** — resource limiting and accounting for CPU, memory, I/O
- **Union filesystems** — layered image storage enabling efficient container images (OverlayFS)
- **Docker, Podman, LXC** — all built on these Linux kernel primitives
- **OCI standards** — Linux-originated specs now define industry container formats

---

# Linux and Cloud Computing

- **Dominant cloud OS** — powers 90%+ of public cloud workloads (AWS, Azure, GCP)
- **KVM (Kernel-based Virtual Machine)** — native hypervisor built into the Linux kernel
- **Lightweight footprint** — minimal resource overhead, ideal for virtualized environments
- **Kubernetes** — Linux-native orchestration platform; industry standard for container management
- **Open source ecosystem** — enables cloud providers to customize and contribute back

---

# Why Linux 'Won the Cloud'

- Free licensing at massive scale
- Decades of stability and security hardening
- Vibrant community driving rapid innovation
- Flexibility to run on any hardware, from embedded to mainframe

---

# Recommended Reading & Reference

- [LinuxCommand.org — William Shotts](https://linuxcommand.org)
- [The Linux Command Line — William Shotts](https://linuxcommand.org/tlcl.php)
- [Linux Fundamentals — Paul Cobbaut](https://linux-training.be/linuxfun.pdf)
- [Linux Networking — Paul Cobbaut](http://linux-training.be/linuxnet.pdf)
