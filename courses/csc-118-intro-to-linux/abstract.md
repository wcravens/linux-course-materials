---
title: What is Linux?
subtitle: CSC 118 — Lecture 1
---

Linux is an operating system **kernel** — one program that drives the hardware
and stands between it and everything else you run. What you actually install is
a **distribution**: that kernel packaged with GNU utilities, a package manager,
an init system, and a set of defaults. Keeping those two layers straight is the
foundation for the rest of the course.

This module traces the boot chain from firmware through bootloader, kernel, and
init; surveys what a kernel is responsible for; and follows Linux from Linus
Torvalds's 1991 USENET post to the present. We cover the GNU Project and free
software — free as in freedom, not as in beer — and why the licensing decision
mattered as much as any technical one.

We then look at what actually distinguishes one distribution from another, trace
the major families back to their roots, and ask where Linux runs: roughly 5% of
desktops, but nearly all web servers, every machine on the TOP500 supercomputer
list, and the kernel inside every Android phone. The module closes on containers
and the cloud.

No prior Linux experience is assumed. Read the notes before the next session.

-----

By the end of this chapter you should be able to:

- Describe the boot chain from firmware to init, and name the kernel's place in it
- List the major responsibilities a kernel is expected to handle
- Explain the difference between Linux, GNU, and GNU/Linux, and why the naming argument exists
- Explain what "free software" means and why it is not about price
- Identify what actually distinguishes one distribution from another
- Trace the major distribution families back to their roots
- Explain why Linux dominates servers, embedded devices, and the cloud while remaining a niche desktop
