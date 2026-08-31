---
title: Spinning Up a Linux VM in Google Cloud
---

## Why a cloud VM

Learning Linux takes a Linux machine you are free to break. A virtual machine
rented from a cloud provider is the cheapest way to get one: it appears in
about thirty seconds, it is a genuine server rather than a simulation, and when
you have wrecked it beyond repair you delete it and make another. Nothing on
your own computer is touched, and nothing has to be installed on it either.

The trade is that the machine belongs to someone else and costs money for as
long as it exists. That single fact shapes everything below, and it is why the
section on stopping and deleting matters more than the first one.

This walkthrough uses Google Cloud. The same ideas carry over to other
providers with different command names.

## What you need before you start

Three things, and you probably already have two of them.

A **Google account** is the identity you sign in with. Any Gmail address works.
A **browser** is the other requirement, because everything here can be done
without installing a single thing locally.

The third is a **Google Cloud project with billing enabled**, which you set up
at [console.cloud.google.com](https://console.cloud.google.com). New accounts
are usually offered a free trial credit, and Google also publishes an "Always
Free" tier that has long included one very small virtual machine per month in
certain US regions. Treat both as a discount rather than a guarantee. Free tier
terms change, they apply only to specific machine types in specific regions,
and anything outside those limits is billed to the card you registered.

So the working assumption for this module is: **a running VM costs money.** It
is worth being precise about why the free tier does not change that. Always
Free covers 30 GB-months of *standard* persistent disk, but current versions of
`gcloud` give a new boot disk the balanced type instead, which is not covered;
and since 2024 an external IPv4 address attached to an instance is billed by
the hour on its own. A machine sitting on "the free tier" therefore still
accrues small charges. The one you build here is deliberately tiny, and if you
follow the section on stopping and deleting you will have it for minutes rather
than months. Check the current Compute Engine pricing page before you leave
anything running overnight.

## Projects

Everything in Google Cloud hangs off a **project**. A project is the container
that owns your virtual machines, your disks, your network, your billing
relationship, and the permissions that say who may touch any of it. There is no
such thing as a VM that merely belongs to your account; it belongs to a project,
and you have access to the project.

That means nearly every command you run has to know which project it applies
to. Get this wrong and you will create a machine in some other project, be
puzzled when it does not appear in the console, and be billed for it anyway.

The project has a human-readable **name** and a globally unique **project ID**.
The ID is what commands want. You will find it on the console dashboard, in the
project picker at the top of the page, and in the output of:

```bash
gcloud projects list
```

Throughout this tutorial, substitute your own ID wherever you see
`<your-project-id>`, angle brackets and all.

## The gcloud command line

`gcloud` is the official command line client for Google Cloud. Anything the
web console can do, `gcloud` can do, and it is the better tool to learn:
commands can be read, copied, pasted into a script, and diffed, while a
sequence of clicks cannot.

You do not have to install it. **Cloud Shell** is a small Linux environment
Google gives you in the browser, reachable from the terminal icon in the top
right of the console, and it arrives with `gcloud` already installed and
already signed in as you. For a class exercise this is the path of least
resistance, and it is what the rest of this tutorial assumes. If you would
rather install the SDK on your own machine, the CLI reference linked at the end
covers it.

### Signing in and choosing a project

In Cloud Shell you are already authenticated. On a local install, or if
`gcloud` ever complains that it has no credentials, this opens a browser and
hands the resulting token back to the tool:

```bash
gcloud auth login
```

Then tell `gcloud` which project to work in, so you do not have to name it on
every command:

```bash
gcloud config set project <your-project-id>
```

And confirm what you just did:

```bash
gcloud config list
```

That prints the active configuration: your account, the project, and any
default region and zone you have set. Read it before you create anything. Two
lines of output now is cheaper than deleting a machine from the wrong project
later.

## Creating the VM

Here is the whole command. Type it as one line, or keep the backslashes and let
the shell continue it across lines as shown:

```bash
gcloud compute instances create linux-lab \
  --zone us-central1-a \
  --machine-type e2-micro \
  --image-family debian-12 \
  --image-project debian-cloud \
  --boot-disk-size 10GB
```

It is worth understanding rather than pasting, because every part of it is a
decision you will make differently later.

Table: The flags passed to the instance creation command, and what each one decides

| Flag | Value used here | What it decides |
| --- | --- | --- |
| (positional) | `linux-lab` | The instance name. It must be unique within the zone, and it becomes the machine's hostname. |
| `--zone` | `us-central1-a` | The physical data center the machine runs in. Zones live inside regions: `us-central1-a` is one zone of the `us-central1` region in Iowa. Pick one near you for lower latency. |
| `--machine-type` | `e2-micro` | How much CPU and memory. `e2-micro` is the smallest general purpose type, with 2 shared vCPUs and 1 GB of memory, and it is the type the free tier has historically covered. It is enough for the shell work in this course. |
| `--image-family` | `debian-12` | Which operating system image to boot from. Naming a *family* rather than a specific image means you get the newest published image in that family, with current security patches, instead of a stale one. |
| `--image-project` | `debian-cloud` | Which project publishes that image. Public images live in projects of their own, so the family name alone is ambiguous without it. |
| `--boot-disk-size` | `10GB` | The size of the virtual disk. Ten gigabytes is plenty for a bare Debian install and some practice files. |

A few things happen that the command does not spell out. If the Compute Engine
API has never been used in this project, `gcloud` notices and offers to enable
it; answer yes and it retries. The instance is given an internal address and,
by default, a temporary external one, which is how you will reach it. Creation
takes a few seconds, after which:

```bash
gcloud compute instances list
```

should show `linux-lab` with a status of `RUNNING`.

## Connecting with SSH

```bash
gcloud compute ssh linux-lab --zone us-central1-a
```

This is an ordinary SSH session with the tedious parts done for you. On the
first run, `gcloud` generates an SSH key pair if you do not already have one,
stores it under your home directory, publishes the public half to the project's
metadata so Compute Engine can install it, and creates a matching user account
on the VM. Then it connects. You are never asked to copy a key by hand. On a
project where OS Login is enforced, the key is attached to your OS Login
profile rather than to project metadata, but nothing you type changes.

The first connection can take a few seconds longer than later ones while that
key propagates, and if you chose a passphrase for the key you will be asked for
it. A successful login looks roughly like this:

```text
Linux linux-lab 6.1.0-18-cloud-amd64 #1 SMP ... x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

yourname@linux-lab:~$
```

That last line is the prompt of a real Linux machine. The username in it is
derived from your Google account rather than fixed, so yours will read
differently. The interesting thing about the prompt is how unremarkable it is:
the shell you have just landed in behaves exactly like the one on any other
Debian system.

If the connection fails outright, the likely cause is that your VM has no
external address. A school or company Google Cloud organisation often sets a
policy forbidding them, and the effect is confusing, because creating the
instance still succeeds and only the connection attempt fails. The fix is to
tunnel the session through Identity-Aware Proxy by adding
`--tunnel-through-iap` to the same `gcloud compute ssh` command. On a
locked-down project that is the normal way in, not a sign that you did anything
wrong.

## Looking around

Before you do anything else, confirm what you actually landed on. Four commands
answer most of it.

```bash
hostnamectl
cat /etc/os-release
df -h
free -h
```

`hostnamectl` reports the machine's hostname along with its operating system,
kernel version, architecture, and the fact that it is a virtual machine.
`/etc/os-release` is the standard file every modern distribution ships to
identify itself; reading it is the reliable way to answer "which Linux is
this?" in a script. `df -h` lists mounted filesystems with their sizes in human
readable units, so you can see the ten gigabyte boot disk you asked for and how
much of it Debian used. `free -h` does the same for memory, and on an
`e2-micro` it is a reminder of how little you are working with.

Take a moment to notice that none of these are cloud commands. They are the
ordinary Linux tools, running on an ordinary Linux system that happens to be
somewhere in Iowa.

## Stopping and deleting the instance

This section is not optional, and it is the one people skip.

**A running instance bills for every second it exists**, charged per second
with a one minute minimum, whether or not you are logged in and whether or not
it is doing anything. Closing your browser does
not stop it. Losing interest does not stop it.

Stopping the instance halts the virtual CPU and ends the compute charge:

```bash
gcloud compute instances stop linux-lab --zone us-central1-a
```

But **a stopped instance still bills for its disk.** The whole point of
stopping rather than deleting is that the disk survives, so your files are
still there when you start it again, and storage that persists is storage
somebody pays for. Stopping is the right move between two lab sessions this
week. It is the wrong move for a machine you are finished with.

When you are done, delete it:

```bash
gcloud compute instances delete linux-lab --zone us-central1-a
```

You will be asked to confirm. This destroys the instance and, by default, its
boot disk, which means everything on the machine is gone permanently. Copy off
anything you want to keep first. Then verify, because the only evidence that
costs no money is an empty list:

```bash
gcloud compute instances list
```

Make this the last thing you do in every session. Building a VM is a five
minute exercise; forgetting one is a bill.

## Doing it from a script

`code/create-vm.sh` in this module is the whole creation sequence as one
runnable file, so you can compare your typing against a known good version. Run
it with your project ID as its only argument:

```bash
./create-vm.sh <your-project-id>
```

It sets the project, creates the same `linux-lab` instance described above, and
prints the commands to connect to it and to delete it again. Read it before you
run it. It is short, and everything in it appeared somewhere above.

## Further reading

- [The gcloud CLI reference](https://cloud.google.com/sdk/gcloud/reference):
  every command and every flag, including installing the SDK locally.
- [The Compute Engine quickstart](https://cloud.google.com/compute/docs/create-linux-vm-instance):
  Google's own walkthrough of creating a Linux VM, from both the console and
  the command line.
