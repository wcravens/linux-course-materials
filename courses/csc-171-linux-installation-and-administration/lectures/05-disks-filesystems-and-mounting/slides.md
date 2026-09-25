---
theme: seriph
addons:
  - 'slidev-addon-linux-courses'
title: 'Disks, Filesystems, and Mounting'
info: |
  ## CSC 171 — Lecture 5
  The four layers between a spinning disk and a path: block devices, partitions,
  filesystems, and mounts — plus what a filesystem actually stores, which turns
  out to explain hard links, instant renames, and the disk that will not empty.
class: text-center
transition: slide-left
mdc: true
drawings:
  persist: false
---

# Disks, Filesystems, and Mounting

CSC 171 — Linux Installation and Administration

Lecture 5

<div class="abs-br m-6 text-sm opacity-60">
Press <kbd>space</kbd> to advance
</div>

---

# Learning Objectives

- Describe the **four layers** between a device and a path, and the tool for each
- Read `lsblk` and `blkid`, and identify devices, partitions, filesystems, and UUIDs
- Explain why `sda` is not a stable name, and use `/dev/disk/by-*` instead
- Compare **MBR** and **GPT**, and state the limits of each
- Partition a disk, and explain why partitioning is destructive
- Create a filesystem with `mkfs`, and say what `mkfs` wrote
- Define an **inode**, and name the one thing it does not store
- Read `stat` field by field
- Model a **directory** as a table of names, and predict links, renames, and deletions
- Diagnose inode exhaustion, and the deleted file that frees no space
- Mount, unmount, and write an `/etc/fstab` entry that does not cost you the server

---

# Where We Left Off

Last week, phase 3 of the boot was five words:

> The kernel finds a root filesystem.

Four separate things hide inside that sentence, and each one fails differently.

- A **disk** the kernel can read in blocks
- A **partition table** dividing it into regions
- A **filesystem** turning a region into files
- A **mount** grafting those files onto the tree at a path

Today: build all four from the bottom up, on a real machine — then open one up and look at
how it stores a file.

---
layout: section
---

# The Storage Stack

Four layers, four tools, and nothing in between

---

# Four Layers Between a Device and a Path

<div class="viz">
<svg viewBox="0 0 860 300" role="img" aria-label="Four stacked layers. At the bottom, the block device slash dev slash sdb, an addressable array of blocks, operated on by lsblk. Above it, the partition slash dev slash sdb1, a named region, operated on by fdisk and parted. Above that, an ext4 filesystem inside the partition, providing files and directories, operated on by mkfs and fsck. At the top, the mount at slash srv slash data, the place in the tree where those files appear, operated on by mount and etc fstab.">
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="30" y="210" width="620" height="60" rx="6" />
    <rect x="30" y="142" width="620" height="60" rx="6" />
    <rect x="30" y="74"  width="620" height="60" rx="6" />
    <rect x="30" y="6"   width="620" height="60" rx="6" />
  </g>
  <g class="val" dominant-baseline="middle" style="font-size: 15px">
    <text x="50" y="36">Mount · <tspan style="font-family: ui-monospace, monospace">/srv/data</tspan></text>
    <text x="50" y="104">Filesystem · ext4</text>
    <text x="50" y="172">Partition · <tspan style="font-family: ui-monospace, monospace">/dev/sdb1</tspan></text>
    <text x="50" y="240">Block device · <tspan style="font-family: ui-monospace, monospace">/dev/sdb</tspan></text>
  </g>
  <g class="cat" dominant-baseline="middle" style="font-size: 13.5px">
    <text x="50" y="56">where those files appear in the tree</text>
    <text x="50" y="124">names, permissions, inodes, directories</text>
    <text x="50" y="192">a named region of the array</text>
    <text x="50" y="258">an addressable array of blocks</text>
  </g>
  <g class="val" text-anchor="end" dominant-baseline="middle"
     style="font-size: 13.5px; font-family: ui-monospace, monospace">
    <text x="840" y="36">mount, /etc/fstab</text>
    <text x="840" y="104">mkfs, fsck</text>
    <text x="840" y="172">fdisk, parted</text>
    <text x="840" y="240">lsblk</text>
  </g>
</svg>

<p class="cap">Each layer knows nothing about the one above it — which is what makes a mistake below destroy everything above.</p>

</div>

---

# Block Devices

Storage appears in `/dev` as a **block device**: read and written in fixed-size chunks, at
any offset, cached in memory.

```bash
ls -l /dev/sda /dev/null
# brw-rw---- 1 root disk   8,  0 Sep 17 14:02 /dev/sda
# crw-rw-rw- 1 root root   1,  3 Sep 17 14:02 /dev/null
```

`b` is a block device. `c` is a **character** device — a stream with no notion of position.

Where a file would show a size, these show `8, 0`: the **major** and **minor** numbers. The
major identifies the driver, the minor says which device to act on.

The file in `/dev` holds no data at all. It is a name carrying a pair of numbers.

---

# `lsblk` — the Whole Picture

```bash
lsblk
# NAME    MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
# sda       8:0    0    10G  0 disk
# ├─sda1    8:1    0   9.9G  0 part /
# ├─sda14   8:14   0     3M  0 part
# └─sda15   8:15   0   124M  0 part /boot/efi
```

One disk, three partitions, two of them mounted. Your sizes will differ; the shape will not.

`sda14` is 3 MB, has no filesystem, and is never mounted. It is the **BIOS boot
partition** — where GRUB keeps the code that will not fit in 440 bytes.

Last week's lecture, sitting in this week's partition table.

---

# `lsblk -f` — the Filesystem Layer

```bash
lsblk -f
# NAME    FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
# sda
# ├─sda1  ext4   1.0         6f1b2c3d-4e5a-4b6c-8d9e-0a1b2c3d4e5f    7.4G    17% /
# ├─sda14
# └─sda15 vfat   FAT32       7B77-95E7                               118M     4% /boot/efi
```

An **empty `FSTYPE`** means exactly what it says: there is no filesystem in that partition.

That is the normal state of a disk you just attached — and the first thing to check when a
mount fails.

---

# `sda` Is Not a Name

`sda` means "the first SCSI-like disk the kernel happened to enumerate."

| Pattern | Hardware | Partition looks like |
| --- | --- | --- |
| `sdX` | SCSI, SATA, USB, most virtual disks | `/dev/sdb1` |
| `nvmeXnY` | NVMe solid-state storage | `/dev/nvme0n1p1` |
| `vdX` | virtio paravirtualized disks | `/dev/vdb1` |
| `mmcblkX` | SD and eMMC cards | `/dev/mmcblk0p1` |

Attach a disk, reboot, and yesterday's `sdb` can be today's `sda`.

Note the `p`: when a device name ends in a digit, the partition number is separated. Scripts
that paste a `1` onto a device name break on the first NVMe disk they meet.

---

# Stable Names: `/dev/disk/by-*`

```bash
ls /dev/disk/
# by-diskseq  by-id  by-label  by-partuuid  by-path  by-uuid
```

| Directory | Names a device by | Use it for |
| --- | --- | --- |
| `by-uuid` | The UUID **inside** the filesystem | `/etc/fstab` — the default choice |
| `by-label` | A human-assigned filesystem label | Readable `fstab`, when labels are unique |
| `by-id` | Hardware serial or vendor name | Identifying a disk **before** formatting |
| `by-partuuid` | The partition's GPT GUID | A partition with no filesystem |
| `by-path` | The physical connection | Slot-based identity, as in a disk shelf |

A UUID is written by `mkfs` **into the filesystem**, so it follows the data. New cabling,
new machine, three more disks ahead of it — the UUID is unchanged.

---

# On Compute Engine: `google-*`

Every attached disk gets a **device name** at attach time, and the guest sees it as a
`by-id` symlink:

```bash
ls -l /dev/disk/by-id/google-*
# google-csc171-boot -> ../../sda
# google-data        -> ../../sdb
```

That is the name **you** chose in `gcloud`. Which means it answers the only question that
matters before you write to a disk:

<div class="hint">

**Which of these devices is the one I just attached?**

</div>

Confirming that is not extra caution. It is the difference between formatting a blank
volume and formatting your root disk.

---
layout: section
---

# Partitions

Dividing a disk, and the one keystroke to think about

---

# Why Divide a Disk

A partition table is a few hundred bytes at the start of a disk saying "bytes *here*
through *there* are region one." Everything else is consequence.

1. **Containment** — a full `/var/log` fills that volume, not the root filesystem. A Linux
   box with no space on `/` cannot write a lock or a session file, so it will not let you
   log in to fix it.
2. **Different rules** — mount options apply per filesystem. `noexec,nosuid` on the volume
   holding user uploads is a real boundary.
3. **Different formats** — the ESP must be FAT32. Swap is not a filesystem at all.
4. **Independent lifecycle** — a data disk detaches from one VM and attaches to another.

---

# ...And Why Not

Partitions are **rigid**.

A partition sized at 20 GB today is 20 GB, and growing it requires free space immediately
after it on the disk.

That rigidity is why modern server images ship one big root partition instead of the
six-partition layouts of twenty years ago, and it is what LVM and cloud volumes exist to
soften.

<div class="hint">

Split a volume off when you have a reason. Do not split by ritual.

</div>

---

# MBR vs. GPT

| | MBR | GPT |
| --- | --- | --- |
| Where it lives | First 512-byte sector | Header at sector 1, **plus a backup at the end** |
| Partitions | 4 primary, or 3 plus a chain | 128 by default |
| Maximum disk | 2 TiB | 8 ZiB — effectively none |
| Identity | A one-byte type code | A 16-byte type GUID, plus a unique GUID each |
| Redundancy | **None** | Two copies, each with a CRC32 |
| Firmware | BIOS, and UEFI in compatibility mode | UEFI |

Corrupt an MBR and the disk becomes an unlabeled expanse of bytes. GPT keeps a second copy
at the far end of the disk and checksums both.

**Use GPT.** The only reason to make an MBR today is compatibility with something old.

---

# Where Those Limits Come From

Both MBR limits are **addressing** limits, from the same 1983 design:

```text
  512 bytes per sector  ×  2³² sectors  =  2 TiB
```

MBR stores a partition's starting sector in 32 bits. That is the entire explanation for the
2 TiB ceiling.

And the 440 bytes from last week is the same story: 512 bytes, minus 64 for the partition
table, minus 2 for a signature.

<div class="notes">

Neither limit has anything to do with the capability of the storage hardware. They are
consequences of how many bits the structure set aside for a number.

</div>

---

# Reading a Partition Table

```bash
sudo fdisk -l /dev/sda
# Disk /dev/sda: 10 GiB, 10737418240 bytes, 20971520 sectors
# Sector size (logical/physical): 512 bytes / 4096 bytes
# Disklabel type: gpt
#
# Device      Start      End  Sectors  Size Type
# /dev/sda1  262144 20971486 20709343  9.9G Linux filesystem
# /dev/sda14   2048     8191     6144    3M BIOS boot
# /dev/sda15   8192   262143   253952  124M EFI System
```

Three things in that output surprise people. None of them is a problem.

---

# Three Things in That Output

<div class="grid grid-cols-2 gap-8">
<div>

### `Type` is not a filesystem

It is a GPT type **GUID** — a declaration of intent. The only consumer that reliably cares
is firmware, looking for `EFI System`.

A partition marked `Linux filesystem` may hold ext4, XFS, or nothing at all.

</div>
<div>

### The numbers are out of order

`sda1` starts *after* `sda14` and `sda15`. A GPT table is an array of **slots**; the slot
number says nothing about position on the disk.

</div>
</div>

### `512 bytes / 4096 bytes`

A 512e drive: 4 KiB physical sectors presented as 512-byte logical ones. Write less than a
full physical sector and the drive must read, modify, and write the whole thing — so
partitions are aligned to 1 MiB. That is why `sda14` starts at sector **2048**.

---

# Step 1: Get a Disk

```bash
gcloud compute disks create data-disk \
    --project=$PROJECT --zone=us-central1-a \
    --size=10GB --type=pd-balanced

gcloud compute instances attach-disk $INSTANCE_NAME \
    --project=$PROJECT --zone=us-central1-a \
    --disk=data-disk --device-name=data
```

`--device-name=data` is what produces `/dev/disk/by-id/google-data` inside the VM.

Name it after what it holds. You will be reading that name later, under pressure.

---

# Step 2: Confirm. Every Time.

```bash
lsblk
# sdb    8:16   0   10G  0 disk          <- new, no partitions, no mountpoint

ls -l /dev/disk/by-id/google-data
# google-data -> ../../sdb

sudo blkid /dev/sdb
# (no output, exit status 2: there is no filesystem here)
```

Three independent confirmations that `/dev/sdb` is the blank disk you just attached:

- It has **no partitions**
- Its `by-id` name is the one **you** assigned
- It holds **no filesystem**

Then, and only then, write to it.

---

# Step 3: `fdisk`

```bash
sudo fdisk /dev/sdb
```

| Key | Does |
| --- | --- |
| `m` | Print the menu |
| `p` | Print the current table |
| `g` | New, empty **GPT** table |
| `n` | New partition — accept the defaults to use the whole disk |
| `t` | Change a partition's type code |
| `d` | Delete a partition |
| `w` | **Write** the table and exit |
| `q` | Quit, **discarding everything** you did |

A whole-disk GPT partition is: `g`, `n`, Enter, Enter, Enter, `w`.

---

# `q` Is Why `fdisk` Is Safe

`fdisk` edits an **in-memory copy**. The disk is untouched until `w`.

<div class="grid grid-cols-2 gap-8">
<div>

### Explore freely

Not sure what you just did? Press `q`. Nothing happened. Start again.

</div>
<div>

### One keystroke to respect

`w` is the moment the change becomes real — and permanent.

</div>
</div>

The scriptable equivalent, for automation:

```bash
sudo parted -s /dev/sdb mklabel gpt
sudo parted -s -a optimal /dev/sdb mkpart primary ext4 0% 100%
```

`-s` skips every confirmation — which is what makes it scriptable, and what makes a typo in
the device name unrecoverable.

---

# Step 4: Tell the Kernel

The kernel reads a partition table when it first sees the device, and caches it.

```bash
sudo partprobe /dev/sdb
lsblk /dev/sdb
# NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
# sdb    8:16   0  10G  0 disk
# └─sdb1 8:17   0  10G  0 part
```

`fdisk` and `parted` usually do this on exit — and when they cannot, because a partition on
the disk is mounted, they tell you a reboot is required.

**Do not skip the `lsblk`.** If `sdb1` did not appear, the next command in your sequence
operates on the wrong thing.

---
layout: center
class: text-center
---

# Partitioning Is Destructive

### And it gives you no warning whatsoever

<div class="grid grid-cols-3 gap-6 mt-8 text-left text-sm">
<div>

**It is instant**

A few hundred bytes at the start of the disk. The command exits `0`.

</div>
<div>

**The data is still there**

Untouched. But the map to it is gone, so every tool reports empty space.

</div>
<div>

**There is no undo**

No confirmation beyond the one you clicked past. The next write really does destroy data.

</div>
</div>

The only defense is the confirmation step — performed every single time, **including the
times you are certain**.

---
layout: section
---

# Filesystems

Turning a region of blocks into files

---

# What `mkfs` Actually Does

```bash
sudo mkfs.ext4 -L data /dev/sdb1
# Creating filesystem with 2620923 4k blocks and 655360 inodes
# Filesystem UUID: 3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b
# Superblock backups stored on blocks:
#         32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632
# Allocating group tables: done
# Writing inode tables: done
# Creating journal (16384 blocks): done
```

In about one second it chose a **block size**, computed how many blocks fit, allocated a
fixed number of **inodes**, wrote several copies of the **superblock**, built group tables,
created a **journal**, and generated a **UUID**.

Most of those numbers can never be changed again.

---

# And What It Did Not Do

`mkfs` did not mount anything.

It never asked where in the directory tree this filesystem should appear — because that is
not a property of the filesystem.

<div class="grid grid-cols-2 gap-8">
<div>

### The filesystem

Lives in a partition. Has a UUID, a label, a size, and files.

Knows nothing about `/srv/data`.

</div>
<div>

### The mount

A runtime relationship between a filesystem and a directory.

Changes without touching the filesystem at all.

</div>
</div>

The same filesystem can be mounted somewhere else tomorrow, or nowhere at all.

---

# Choosing a Filesystem

| Filesystem | For | Notes |
| --- | --- | --- |
| `ext4` | General Linux storage — **the default** | Mature, predictable, shrinkable offline |
| `xfs` | Large volumes, parallel workloads | Red Hat's default; grows online, **never shrinks** |
| `btrfs` | Snapshots, checksums, volume management | Copy-on-write; more moving parts |
| `vfat` | The ESP, and removable media | No permissions, no ownership, no symlinks |
| `tmpfs` | `/run`, `/dev/shm`, scratch | Lives in RAM; gone at reboot |
| `nfs` | A filesystem over the network | Mounted from a server, not a block device |
| swap | Paging space | `mkswap` and `swapon` — **not** a filesystem |

For this course: **ext4** unless there is a reason. It is Debian's default, and its tooling
lets you see inside — which is the next few slides.

---

# FAT Stores No Permissions

Copy a tree onto a FAT-formatted USB stick, and every mode is **synthesized at mount time**
from mount options.

```bash
# on ext4
-rw------- 1 wcravens wcravens 3.2K id_ed25519

# the same file, copied to a vfat stick
-rwxrwxrwx 1 root     root     3.2K id_ed25519
```

Your `chmod 600` on a private key is not preserved. A script copied back has lost its
executable bit.

This is not a bug in `cp`. The destination format has **nowhere to put the information**.

---

# Inside an ext4 Filesystem

<div class="viz">
<svg viewBox="0 0 860 220" role="img" aria-label="A horizontal strip showing the layout of one ext4 block group, left to right: superblock, group descriptors, block bitmap, inode bitmap, inode table, and then a much wider region of data blocks. Below, a note that the superblock is copied to backup locations elsewhere on the disk.">
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="130" y="60" width="86" height="70" rx="4" />
    <rect x="216" y="60" width="76" height="70" rx="4" />
    <rect x="292" y="60" width="76" height="70" rx="4" />
    <rect x="368" y="60" width="112" height="70" rx="4" />
    <rect x="480" y="60" width="360" height="70" rx="4" />
  </g>
  <rect x="20" y="60" width="110" height="70" rx="4"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g class="val" text-anchor="middle" dominant-baseline="middle" style="font-size: 13.5px">
    <text x="75"  y="86">superblock</text>
    <text x="173" y="86">group</text>
    <text x="173" y="104">descriptors</text>
    <text x="254" y="86">block</text>
    <text x="254" y="104">bitmap</text>
    <text x="330" y="86">inode</text>
    <text x="330" y="104">bitmap</text>
    <text x="424" y="86">inode</text>
    <text x="424" y="104">table</text>
    <text x="660" y="95">data blocks</text>
  </g>
  <g class="cat" text-anchor="middle" dominant-baseline="middle" style="font-size: 13px">
    <text x="75"  y="150">the entry point</text>
    <text x="254" y="150">free or in use</text>
    <text x="424" y="150">fixed array</text>
    <text x="660" y="150">file contents, and directory contents</text>
  </g>
  <g class="cat" dominant-baseline="middle" style="font-size: 13px">
    <text x="20" y="190">Repeated for every block group — and the superblock is copied to backup locations across the disk</text>
  </g>
</svg>

<p class="cap">Every structure on the left is metadata about the region on the right.</p>

</div>

---

# The Structures, and What Breaks

| Structure | Holds | When it is damaged |
| --- | --- | --- |
| Superblock | Block size, counts, label, UUID, state | The filesystem cannot be **identified at all** |
| Group descriptors | Where each group's tables start | Allocation metadata unreachable |
| Block bitmap | One bit per block: free or used | Blocks get double-allocated |
| Inode bitmap | One bit per inode: free or used | The same, for inodes |
| Inode table | The fixed array of inodes | File **metadata** lost, even where data survives |
| Data blocks | File and directory contents | The files themselves |
| Journal | Metadata changes about to happen | No recovery after an unclean shutdown |

The superblock is the entry point — every tool reads it first. Which is why `mkfs` printed
a list of **backups**, so `fsck -b 32768` can rebuild from a spare.

---

# Reading the Superblock

```bash
sudo dumpe2fs -h /dev/sdb1
# Filesystem volume name:   data
# Filesystem UUID:          3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b
# Filesystem state:         clean
# Inode count:              655360        <- fixed forever
# Block count:              2620923
# Reserved block count:     131046        <- 5%, for root
# Block size:               4096
# Last mounted on:          /srv/data
```

The 5% reservation keeps a full disk from locking out the administrator, and gives the
allocator room to avoid fragmentation.

```bash
sudo tune2fs -m 1 /dev/sdb1    # a data volume does not need 500 MB of it
```

Leave it at 5% on **root**. That reservation is why a full root disk is usually recoverable.

---

# A 10-Byte File Costs 4096 Bytes

The **block size** is the smallest unit of space a file can occupy.

```bash
echo "hello" > tiny.txt
ls -l tiny.txt    # 6 bytes
du -h tiny.txt    # 4.0K
```

The other 4090 bytes are internal fragmentation, and nothing else can use them.

This is why a directory of a million tiny files consumes far more disk than the sum of its
sizes — and the first of two reasons `du` and `ls -l` disagree.

---

# Inodes Are Allocated Once, at `mkfs`

`mkfs.ext4` computed **655360 inodes** — one per 16 KiB of space — and wrote them all to
disk immediately, empty.

It is a **fixed-size array**, not a counter that grows.

<div class="hint">

The inode count is the maximum number of files this filesystem can ever hold.

</div>

You cannot add more later. Not with `tune2fs`, not with `resize2fs`, not at all.

---

# "No Space Left on Device"

```bash
df -h /srv/data
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sdb1       9.8G  1.2G  8.1G  13% /srv/data

touch /srv/data/one-more-file
# touch: cannot touch '...': No space left on device
```

Eight gigabytes free, and the filesystem is full. Both statements are true.

```bash
df -i /srv/data
# Filesystem      Inodes  IUsed IFree IUse% Mounted on
# /dev/sdb1       655360 655360     0  100% /srv/data
```

**Inode exhaustion.** Mail spools, session directories, caches. The fix is unwelcome: delete
files, or back up, `mkfs -i 8192`, and restore.

`df -i` belongs in your reflexes, right next to `df -h`.

---

# Journaling

One shell operation is several disk writes. Appending to a file updates the block bitmap,
the inode, **and** the data block.

Lose power between them and the structure is inconsistent.

A **journal** closes the window:

1. Write down what is about to happen
2. Do it
3. Mark the journal entry complete

After a crash, the kernel replays the journal at mount: complete entries are known good,
incomplete ones are finished or discarded. Seconds, regardless of filesystem size.

---

# What the Journal Does Not Promise

The default mode (`data=ordered`) guarantees:

- **Metadata** is consistent
- Data blocks are written **before** the metadata pointing at them — so a file never shows
  another file's leftover contents

It does **not** guarantee your application's last writes reached the disk.

<div class="hint">

Durability of data is the application's job — `fsync` — not the journal's.

</div>

---

# `fsck` Has One Absolute Rule

```bash
sudo umount /srv/data
sudo fsck -f /dev/sdb1     # -f forces a check even if marked clean
```

### Never run `fsck` on a mounted filesystem.

`fsck` reads structures straight from the block device and rewrites them in place. A mounted
filesystem is being modified by the kernel, whose cached copy is now stale.

Two writers, one set of structures. The usual result is a filesystem considerably worse off
than the one you set out to repair.

If it is the **root** filesystem, that means booting from rescue media — and normally you
never run `fsck` by hand at all, because `fstab` does it at boot while nothing is mounted.

---
layout: section
---

# Inodes, Directories, and Metadata

What a filesystem actually stores about a file

---

# The Superblock Comes First

A filesystem keeps metadata at two levels:

| Level | Record | Describes |
| --- | --- | --- |
| Filesystem | **Superblock** — one, plus backups | The whole filesystem: geometry, counts, identity, state |
| File | **Inode** — one per file | A single file: type, owner, mode, size, times, blocks |

At mount, the kernel reads the superblock — 1024 bytes into the partition — before anything
else. It says how big a block is, how many inodes each block group holds, and how large each
inode is. Without those numbers, not one inode can be found.

<div class="hint">

The superblock is how the kernel finds an inode. The inode is how it finds a file's data.

</div>

---

# Review: What the Superblock Holds

| Category | `dumpe2fs -h` fields | Why it matters |
| --- | --- | --- |
| Identity | Volume name, UUID | How `fstab` and `/dev/disk/by-uuid` name it |
| Geometry | Block size, blocks per group, inodes per group, inode size | Where every other structure sits on disk |
| Capacity | Block count, inode count, reserved block count | Fixed at `mkfs` — the inode count forever |
| Free space | Free blocks, free inodes | What `df -h` and `df -i` report |
| State | Filesystem state, errors behavior, mount count, last checked | Whether `fsck` runs at boot |
| Features | `has_journal`, `extent`, `dir_index`, ... | What the kernel must support to mount it |

The geometry row is the one the kernel needs to find anything, because the filesystem is
not one region. It is many.

---

# Block Groups

ext4 cuts the filesystem into **block groups** of equal size — here, 2620923 blocks become
**80 groups** of 32768 blocks, each with its own share of **8192 inodes**.

Why 32768? A group's block bitmap is exactly one block: 4096 bytes × 8 bits = 32768 blocks.

Each group carries its own metadata for its own region:

- A **block bitmap** and an **inode bitmap** — which of *this group's* blocks and inodes are free
- A slice of the **inode table** — 8192 inodes × 256 bytes = 512 blocks

<div class="hint">

Groups keep a file's inode near its data, and a directory's files near each other. Short
distances on disk were the original point; containing damage to one group is the bonus.

</div>

---

# Where the Superblock Backups Live

<div class="viz">
<svg viewBox="0 0 860 230" role="img" aria-label="Two rows of forty small cells representing block groups 0 through 79. Nine cells are highlighted as holding a superblock copy: groups 0, 1, 3, 5, 7, 9, 25, 27, and 49.">
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1">
    <rect x="30" y="40" width="800" height="36" />
    <rect x="30" y="120" width="800" height="36" />
  </g>
  <g style="stroke: var(--baseline); stroke-width: 1">
    <path d="M50 40v36M70 40v36M90 40v36M110 40v36M130 40v36M150 40v36M170 40v36M190 40v36M210 40v36M230 40v36M250 40v36M270 40v36M290 40v36M310 40v36M330 40v36M350 40v36M370 40v36M390 40v36M410 40v36M430 40v36M450 40v36M470 40v36M490 40v36M510 40v36M530 40v36M550 40v36M570 40v36M590 40v36M610 40v36M630 40v36M650 40v36M670 40v36M690 40v36M710 40v36M730 40v36M750 40v36M770 40v36M790 40v36M810 40v36" />
    <path d="M50 120v36M70 120v36M90 120v36M110 120v36M130 120v36M150 120v36M170 120v36M190 120v36M210 120v36M230 120v36M250 120v36M270 120v36M290 120v36M310 120v36M330 120v36M350 120v36M370 120v36M390 120v36M410 120v36M430 120v36M450 120v36M470 120v36M490 120v36M510 120v36M530 120v36M550 120v36M570 120v36M590 120v36M610 120v36M630 120v36M650 120v36M670 120v36M690 120v36M710 120v36M730 120v36M750 120v36M770 120v36M790 120v36M810 120v36" />
  </g>
  <g style="fill: var(--bar); stroke: none">
    <rect x="31" y="41" width="18" height="34" />
    <rect x="51" y="41" width="18" height="34" />
    <rect x="91" y="41" width="18" height="34" />
    <rect x="131" y="41" width="18" height="34" />
    <rect x="171" y="41" width="18" height="34" />
    <rect x="211" y="41" width="18" height="34" />
    <rect x="531" y="41" width="18" height="34" />
    <rect x="571" y="41" width="18" height="34" />
    <rect x="211" y="121" width="18" height="34" />
  </g>
  <g class="cat" text-anchor="middle" style="font-size: 12px">
    <text x="40"  y="30">0</text>
    <text x="60"  y="30">1</text>
    <text x="100" y="30">3</text>
    <text x="140" y="30">5</text>
    <text x="180" y="30">7</text>
    <text x="220" y="30">9</text>
    <text x="540" y="30">25</text>
    <text x="580" y="30">27</text>
    <text x="820" y="30">39</text>
    <text x="40"  y="110">40</text>
    <text x="220" y="110">49</text>
    <text x="820" y="110">79</text>
  </g>
  <g class="cat" dominant-baseline="middle" style="font-size: 13px">
    <text x="30" y="190">Filled: a superblock copy. Group 0 holds the primary; mkfs listed the other eight</text>
    <text x="30" y="212">as block numbers — 32768 is group 1, 98304 is group 3, 1605632 is group 49.</text>
  </g>
</svg>

<p class="cap">Groups 0 and 1, then powers of 3, 5, and 7: nine copies, not eighty.</p>

</div>

---

# The Group Descriptor Table

Right after the superblock sits one **descriptor** per group — 64 bytes each on ext4.

| A descriptor records | For its group |
| --- | --- |
| Block bitmap location | Which block holds the free-block map |
| Inode bitmap location | Which block holds the free-inode map |
| Inode table location | The first block of its inode slice |
| Free counts, flags | Free blocks, free inodes, whether initialized yet |

The locations are **looked up, not computed**. ext4's `flex_bg` feature packs the bitmaps and
inode tables of 16 groups together at the front of the first one, so a group's own metadata
is often not inside the group at all.

Allocation takes the same route: descriptor → bitmap → a free bit → mark it used.

---

# Finding Inode 131074

The kernel has an inode number. The superblock and descriptors stay in memory after mount,
so only the last step usually touches the disk:

| Step | Source | Result |
| --- | --- | --- |
| 1. Which group? | Superblock: 8192 inodes per group | (131074 − 1) ÷ 8192 = group **16**, index **1** |
| 2. Where is its table? | Descriptor 16 | The inode table's first block |
| 3. Where in the table? | Superblock: inode size 256 | Index 1 × 256 = byte **256** into the table |

```bash
sudo debugfs -R "imap <131074>" /dev/sdb1
# Inode 131074 is part of block group 16
#         located at block 524320, offset 0x0100
```

Inodes count from **1**, hence the − 1. From the inode, its extents lead to the data.

---

# The Inode

One fixed-size record — 256 bytes on default ext4 — describing one file.

| Field | Holds |
| --- | --- |
| Type | Regular file, directory, symlink, socket, FIFO, device |
| Permissions | The twelve mode bits |
| Owner / Group | The UID and GID, as **numbers** |
| Size | Length in bytes |
| Link count | How many directory entries refer to this inode |
| Timestamps | Access, modify, change — and on ext4, birth |
| Data location | Block pointers or extents: where the data lives |

This is what the filesystem means by "a file."

---
layout: center
class: text-center
---

# An inode does not store the file's name

There is nowhere in the structure for one to go.

<div class="mt-8 text-left text-base max-w-2xl mx-auto">

The name lives somewhere else entirely — and nearly everything surprising about Linux files
follows from **where**.

</div>

---

# Inode Numbers

```bash
ls -li /srv/data
# 131074 -rw-r--r-- 1 wcravens wcravens  1024 Sep 17 15:02 notes.txt
#     11 drwx------ 2 root     root     16384 Sep 17 14:45 lost+found
```

Inode numbers are unique **within one filesystem**, and nowhere else. Every mounted
filesystem has its own inode 131074.

A file is identified globally by the pair **(device, inode)** — which is what the kernel
uses internally, and why several operations coming up refuse to cross a mount point.

<div class="notes">

`lost+found` at inode 11 is fixed in every ext filesystem: it is where `fsck` puts files
whose inodes it recovered but whose names it could not. Data with its metadata intact and
its name lost — the whole idea, demonstrated by accident.

</div>

---

# `stat`, Field by Field

```bash
stat /srv/data/notes.txt
#   File: /srv/data/notes.txt
#   Size: 1024        Blocks: 8          IO Block: 4096   regular file
# Device: 8,17        Inode: 131074      Links: 1
# Access: (0644/-rw-r--r--)  Uid: ( 1001/wcravens)   Gid: ( 1001/wcravens)
# Access: 2026-09-17 15:04:11.412000000 +0000
# Modify: 2026-09-17 15:02:38.180000000 +0000
# Change: 2026-09-17 15:02:38.180000000 +0000
#  Birth: 2026-09-17 15:02:38.180000000 +0000
```

| Field | Means |
| --- | --- |
| `Size` vs `Blocks` | Bytes, versus 512-byte units **actually allocated** |
| `Device` / `Inode` | The globally unique pair |
| `Links` | How many names point here |
| `Uid` / `Gid` | Numbers — the names are looked up for display |

---

# `Size` and `Blocks` Can Disagree Both Ways

<div class="grid grid-cols-2 gap-8">
<div>

### Small file, more blocks

`Size: 1024`, `Blocks: 8`

8 × 512 = 4 KiB — one filesystem block, for a 1 KiB file.

</div>
<div>

### Huge file, almost no blocks

A **sparse** file: written with large unwritten gaps, as VM images and database files are.

The holes were never allocated.

</div>
</div>

```bash
du -sh disk.img              #  12M   — what it occupies
du -sh --apparent-size disk.img   #  40G   — what it claims
```

The second reason `du` and `ls -l` disagree.

---

# `Modify` vs. `Change`

| Timestamp | Updated when |
| --- | --- |
| `mtime` | The **contents** changed |
| `ctime` | The **inode** changed — including `chmod`, `chown`, and rename |
| `atime` | The contents were read |

`touch -d` can set `mtime` to any value you like.

`ctime` updates as a side effect of that very operation — and there is **no interface** for
setting it.

<div class="hint">

A file whose `ctime` is markedly later than its `mtime` has had its metadata or its
timestamps altered.

</div>

---

# `atime` and `relatime`

Updating an access time on every read turns **every read into a write**. Ruinous on a busy
server.

So Linux mounts with `relatime` by default: `atime` is written only if it is older than
`mtime`, or older than a day.

```bash
mount | grep sdb1
# /dev/sdb1 on /srv/data type ext4 (rw,relatime)
```

`noatime` disables it entirely — reasonable on a busy data volume, as long as nothing there
expects working access times. Classically, mail readers did.

---

# From the Inode to the Data

The inode's last field is 60 bytes set aside for one job: saying where the file's data is.

What goes in those 60 bytes is the biggest difference between ext2/3 and ext4.

| Filesystem | The 60 bytes hold | Records |
| --- | --- | --- |
| ext2, ext3 | 15 **block pointers** | Every block, one at a time |
| ext4 | 4 **extents** | Runs of consecutive blocks |

<div class="hint">

ext3 is ext2 plus a journal. On disk, the way they map a file is identical.

</div>

---

# ext2/3: A Pointer for Every Block

15 pointers of 4 bytes each. With 4 KiB blocks, one pointer block holds 1024 pointers.

| Pointers | Point to | Adds (4 KiB blocks) |
| --- | --- | --- |
| 12 **direct** | Data blocks | 48 KiB |
| 1 **single indirect** | A block of 1024 pointers to data | 4 MiB |
| 1 **double indirect** | A block of pointers to pointer blocks | 4 GiB |
| 1 **triple indirect** | One more level | 4 TiB |

Small files never leave the inode. Every level past that costs an extra block read on the
way to the data.

---

# The Block Map

<div class="viz">
<svg viewBox="0 0 860 300" role="img" aria-label="An inode containing twelve direct pointers and three indirect pointers. The direct pointers lead straight to twelve data blocks, 48 KiB. The single indirect pointer leads to one pointer block, which leads to 1024 data blocks, 4 MiB. The double indirect pointer leads to a pointer block, then to 1024 pointer blocks, then to 1024 squared data blocks, 4 GiB. The triple indirect pointer passes through three levels of pointer blocks to 1024 cubed data blocks, 4 TiB.">
  <defs>
    <marker id="map-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--bar)" />
    </marker>
  </defs>
  <rect x="20" y="20" width="220" height="244" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g style="fill: none; stroke: var(--baseline); stroke-width: 1.5">
    <rect x="36" y="56" width="180" height="34" />
    <rect x="36" y="116" width="180" height="34" />
    <rect x="36" y="164" width="180" height="34" />
    <rect x="36" y="212" width="180" height="34" />
    <rect x="320" y="116" width="150" height="34" rx="4" />
    <rect x="270" y="164" width="130" height="34" rx="4" />
    <rect x="450" y="164" width="150" height="34" rx="4" />
    <rect x="680" y="56" width="160" height="34" rx="4" />
    <rect x="680" y="116" width="160" height="34" rx="4" />
    <rect x="680" y="164" width="160" height="34" rx="4" />
    <rect x="680" y="212" width="160" height="34" rx="4" />
  </g>
  <rect x="270" y="212" width="330" height="34" rx="4"
        style="fill: none; stroke: var(--baseline); stroke-width: 1.5; stroke-dasharray: 5 4" />
  <path d="M51 56v34M66 56v34M81 56v34M96 56v34M111 56v34M126 56v34M141 56v34M156 56v34M171 56v34M186 56v34M201 56v34"
        style="stroke: var(--baseline); stroke-width: 1" />
  <g style="stroke: var(--bar); stroke-width: 1.5; fill: none" marker-end="url(#map-arrow)">
    <path d="M216 73H676" />
    <path d="M216 133H316" />
    <path d="M470 133H676" />
    <path d="M216 181H266" />
    <path d="M400 181H446" />
    <path d="M600 181H676" />
    <path d="M216 229H266" />
    <path d="M600 229H676" />
  </g>
  <text class="val" x="36" y="42" style="font-size: 15px">Inode</text>
  <g class="cat" text-anchor="middle" dominant-baseline="middle" style="font-size: 13px">
    <text x="126" y="105">12 direct</text>
    <text x="126" y="134">single indirect</text>
    <text x="126" y="182">double indirect</text>
    <text x="126" y="230">triple indirect</text>
    <text x="395" y="134">pointer block</text>
    <text x="335" y="182">pointer block</text>
    <text x="525" y="182">1024 pointer blocks</text>
    <text x="435" y="230">three levels of pointer blocks</text>
  </g>
  <g class="val" text-anchor="middle" dominant-baseline="middle" style="font-size: 13px">
    <text x="760" y="74">12 blocks · 48 KiB</text>
    <text x="760" y="134">1024 blocks · 4 MiB</text>
    <text x="760" y="182">1024² blocks · 4 GiB</text>
    <text x="760" y="230">1024³ blocks · 4 TiB</text>
  </g>
</svg>

<p class="cap">Every data block has its own pointer. Past 48 KiB, the pointers themselves need blocks.</p>

</div>

---

# Where the Block Map Breaks Down

Most files are laid out in long runs of consecutive blocks, and the map records every one
of them anyway.

- A 1 GiB file needs **262144 pointers**: about 1 MiB of pointer blocks
- Reading deep into a large file first walks **up to three** pointer blocks
- Deleting a large file means visiting every pointer to free every block, which made
  deleting big files on ext3 notoriously slow
- 32-bit block numbers cap the filesystem at **16 TiB** with 4 KiB blocks

<div class="hint">

"Blocks 557056 through 589823" is one fact. The block map writes it down 32768 times.

</div>

---

# ext4: Extents

An **extent** records a run: "these blocks of the file are *here*, this many in a row."

| Field | Size | Meaning |
| --- | --- | --- |
| Logical start | 32 bits | First block **of the file** this run covers |
| Length | 16 bits | Up to 32768 blocks: **128 MiB** |
| Physical start | 48 bits | First block **on disk** |

The same 60 bytes in the inode hold a small header and **four** extents: up to 512 MiB of
file, described without a single extra block.

48-bit block numbers also raise the filesystem ceiling from 16 TiB to **1 EiB**.

---

# Reading a File's Extents

A 300 MiB file: 76800 blocks. `debugfs` paths start at the filesystem's own root.

```bash
sudo debugfs -R "stat /big.img" /dev/sdb1
# ...
# EXTENTS:
# (0-32767):557056-589823, (32768-65535):589824-622591, (65536-76799):622592-633855
```

Three extents: 36 bytes of metadata. The block map would need 76800 pointers, 300 KiB.

```bash
lsattr /srv/data/big.img
# --------------e------- /srv/data/big.img
```

The `e` flag marks a file mapped by extents. A filesystem upgraded from ext3 keeps its old
files as block maps; the ext4 driver reads both.

---

# When Four Extents Are Not Enough

A fragmented or very large file grows an **extent tree**:

- The inode's four slots point to **index** blocks instead of data
- Each 4 KiB **leaf** block holds 340 extents
- Depth grows only as needed, and rarely passes two

Finding block *N* of a file becomes a short search of a sorted list, not a walk through
pointer blocks.

<div class="hint">

Fewer, longer extents are the goal. **Delayed allocation** picks disk blocks at writeback,
once the file's size is known, so ext4 can place it in one run.

</div>

---

# Review: Block Map vs. Extents

| Aspect | ext2/3 block map | ext4 extents |
| --- | --- | --- |
| Records | One block per pointer | A run of up to 32768 blocks |
| In the inode | 12 direct + 3 indirect pointers | A header + 4 extents |
| Outgrows the inode with | Up to 3 levels of pointer blocks | An extent tree |
| A 1 GiB contiguous file | 262144 pointers, ~1 MiB | 8 extents, one leaf block |
| Largest filesystem (4 KiB blocks) | 16 TiB | 1 EiB |
| Largest file (4 KiB blocks) | 2 TiB | 16 TiB |

A sparse file's holes are simply missing: a zero pointer in a block map, a gap between
extents in ext4.

---

# So Where Is the Name?

<div class="viz">
<svg viewBox="0 0 860 300" role="img" aria-label="On the left, a box labelled the directory slash srv slash data, containing a two column table of entries: dot maps to inode 2, dot dot maps to inode 2, notes dot txt maps to inode 131074, and archive maps to inode 131090. On the right, a box labelled the inode table, containing inode 131074 with its mode, owner, size, timestamps and block pointers, and inode 131090. An arrow runs from the notes dot txt entry to inode 131074, showing that the directory holds the name and the inode holds everything else.">
  <defs>
    <marker id="dir-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto">
      <path d="M0 0 L10 5 L0 10 Z" style="fill: var(--bar)" />
    </marker>
  </defs>
  <rect x="20" y="40" width="330" height="230" rx="6"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <rect x="520" y="40" width="320" height="230" rx="6"
        style="fill: none; stroke: var(--baseline); stroke-width: 1.5" />
  <g class="val" style="font-size: 14px">
    <text x="36" y="28">directory <tspan style="font-family: ui-monospace, monospace">/srv/data</tspan></text>
    <text x="536" y="28">inode table</text>
  </g>
  <g style="stroke: var(--baseline); stroke-width: 1">
    <line x1="20" y1="76" x2="350" y2="76" />
    <line x1="185" y1="40" x2="185" y2="270" />
    <line x1="20" y1="116" x2="350" y2="116" />
    <line x1="20" y1="156" x2="350" y2="156" />
    <line x1="20" y1="196" x2="350" y2="196" />
    <line x1="520" y1="160" x2="840" y2="160" />
  </g>
  <g class="cat" dominant-baseline="middle" style="font-size: 14px; font-family: ui-monospace, monospace">
    <text x="36" y="58">name</text>
    <text x="201" y="58">inode</text>
    <text x="36" y="96">.</text>
    <text x="201" y="96">2</text>
    <text x="36" y="136">..</text>
    <text x="201" y="136">2</text>
    <text x="36" y="216">archive</text>
    <text x="201" y="216">131090</text>
  </g>
  <g class="val" dominant-baseline="middle" style="font-size: 14px; font-family: ui-monospace, monospace">
    <text x="36" y="176">notes.txt</text>
    <text x="201" y="176">131074</text>
    <text x="536" y="62">131074</text>
    <text x="536" y="182">131090</text>
  </g>
  <g class="cat" dominant-baseline="middle" style="font-size: 13px">
    <text x="620" y="62">mode, uid, gid</text>
    <text x="620" y="84">size, links, times</text>
    <text x="620" y="106">block pointers →</text>
    <text x="620" y="182">a directory, itself</text>
    <text x="536" y="250">no names anywhere</text>
  </g>
  <line x1="350" y1="176" x2="516" y2="62" style="stroke: var(--bar); stroke-width: 2" marker-end="url(#dir-arrow)" />
</svg>

<p class="cap">A directory is a file whose contents are a table mapping names to inode numbers. That pairing is called a <strong>link</strong>.</p>

</div>

---

# Path Lookup Is Just Repeated Table Reads

Resolving `/srv/data/notes.txt`:

1. Read `/`'s data → find the inode for `srv`
2. Read that inode → find its data blocks
3. Read those → find the inode for `data`
4. Read that inode → find its data blocks
5. Read those → find inode **131074**

One lookup per path component, all the way down.

`.` and `..` are ordinary entries in that table, not syntax — which is why a directory's
link count is **2 plus its number of subdirectories**: one from its parent, one from its own
`.`, and one from each child's `..`.

```bash
ls -ld projects
# drwxr-xr-x 7 wcravens wcravens 4096 Sep 17 15:40 projects   # 7 = 2 + 5 subdirectories
```

---

# Consequence 1: Renaming Is Instant

```bash
mv ubuntu-24.04.iso installer.iso    # 40 GB, and it returns immediately
```

It rewrote **one entry** in one directory's table. The inode is untouched. The data is
untouched.

But across a mount point:

```bash
mv /srv/data/big.iso /home/wcravens/    # takes ten minutes
```

The inode number would be meaningless on the other filesystem, so `mv` silently degrades to
a full **copy, then delete**.

<div class="hint">

Same command. Instant here, ten minutes there. Now you know which is which before you run
it.

</div>

---

# Consequence 2: Deleting Is a Directory Permission

Removing a file means removing an entry from a **directory's** table.

So it is governed by write permission on the **directory** — not on the file.

```bash
ls -l secret.txt
# -r--r--r-- 1 root root 42 Sep 17 15:02 secret.txt

rm secret.txt        # works, if you can write to the directory
```

You can delete a read-only file you do not own.

This is exactly why `/tmp` needs the **sticky bit** — without it, any user could remove any
other user's files from a world-writable directory.

```bash
ls -ld /tmp
# drwxrwxrwt 12 root root 4096 Sep 17 16:10 /tmp
#          ^ t
```

---

# Consequence 3: A File Can Have Many Names

```bash
ln notes.txt second-name.txt

ls -li
# 131074 -rw-r--r-- 2 wcravens wcravens 1024 Sep 17 15:02 notes.txt
# 131074 -rw-r--r-- 2 wcravens wcravens 1024 Sep 17 15:02 second-name.txt
```

Same inode. Link count went from 1 to **2**.

One file on disk, two names — and the two are **equal**. Neither is the original, because
the inode does not record which entry came first.

Writing through one is writing to the other, because there is no "other."

---

# What a Hard Link Cannot Do

<div class="grid grid-cols-2 gap-8">
<div>

### Cross a filesystem

```bash
ln /srv/data/notes.txt ~/notes.txt
# ln: failed to create hard link:
#     Invalid cross-device link
```

The entry stores an inode **number**, and numbers mean nothing on another filesystem.

</div>
<div>

### Point at a directory

```bash
ln /srv/data/archive ~/archive
# ln: hard link not allowed for directory
```

It would let you build a **cycle** — infinite recursion, and orphaned subtrees no `fsck`
could reason about.

</div>
</div>

Both limits fall directly out of the model. Neither is a policy decision.

---

# Symbolic Links Are a Different Thing

```bash
ln -s /srv/data/notes.txt link-to-notes

ls -li
# 131074 -rw-r--r-- 2 wcravens wcravens 1024 ... notes.txt
# 131099 lrwxrwxrwx 1 wcravens wcravens   19 ... link-to-notes -> /srv/data/notes.txt
```

**Its own inode**, of type `l`, whose data is a **path written as text**. Size 19 — the
exact length of that string.

The link count on `notes.txt` did not change, because nothing new points at its inode.

Open it, and the kernel reads that string and resolves it as a path, starting over from the
beginning.

---

# Hard vs. Symbolic

| | Hard link | Symbolic link |
| --- | --- | --- |
| What it is | Another entry naming the same inode | A file containing a path |
| Own inode | No | **Yes** |
| Changes link count | Yes | No |
| Crosses filesystems | **No** | Yes |
| Points at a directory | **No** | Yes |
| Survives the target being renamed | Yes | **No** — it dangles |
| Survives the target being deleted | Yes, if a name remains | **No** |

`lrwxrwxrwx` is not a permissions failure. A symlink's own mode bits are **ignored** —
access is decided by the target. Every symlink shows `777`.

---

# Dangling Links Are Legal

```bash
ln -s /does/not/exist broken
# succeeds
ls -l broken
# lrwxrwxrwx 1 wcravens wcravens 14 Sep 17 16:22 broken -> /does/not/exist
```

Nothing is checked until the link is **followed**.

That is a feature: `/etc/alternatives` and systemd's `enable` both rely on links created
before or after their targets exist.

It is also why a symlink quietly breaks when somebody reorganizes a directory elsewhere on
the system.

```bash
readlink -f link-to-notes    # where does this chain actually end up?
find . -xtype l              # find the dangling ones
```

---

# Deleting Is Unlinking

The system call behind `rm` is `unlink`. By now the name reads as a description.

It removes an entry from a directory's table and **decrements the link count**.

Only when the count reaches **zero** does the filesystem free the inode and release its
data blocks.

<div class="hint">

And there is a second condition.

</div>

---
layout: center
class: text-center
---

# An inode is not freed while any process still has the file open

Zero names, one open descriptor — fully allocated, reachable by that process, and by
nothing else.

---

# The Disk That Will Not Empty

```bash
sudo rm /var/log/huge-application.log

df -h /var
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1       9.8G  9.3G  0.1G  99% /var
```

Gone from every listing. `du` no longer counts it. `df` still does — the application has it
open and is, right now, still writing to a file with no name.

```bash
sudo lsof +L1     # open files whose link count is below 1
# COMMAND  PID USER FD TYPE DEVICE  SIZE/OFF NLINK  NODE NAME
# java    2847 app  3w  REG    8,1 483183820     0 524301 /var/log/huge-application.log (deleted)
```

`NLINK 0` and `(deleted)` are the signature. Restart the service to close the descriptor.

**When `df` and `du` disagree, `lsof +L1` is the first command to run.**

---

# Next Time, Truncate

```bash
sudo truncate -s 0 /var/log/huge-application.log
```

The file keeps its inode, its name, and its open descriptor — and gives the blocks back
immediately.

<div class="grid grid-cols-2 gap-8">
<div>

### `rm` on an open log

Space freed: **none**, until the service restarts.

</div>
<div>

### `truncate -s 0` on an open log

Space freed: **now**, and the service never notices.

</div>
</div>

---

# Owners Are Numbers

The inode stores UID and GID as **integers**. The names are a display convenience, looked up
in `/etc/passwd` at print time.

```bash
ls -l /srv/data
# -rw-r--r-- 1 1001 1001 1024 Sep 17 15:02 notes.txt
```

A bare number means the lookup failed: no such ID on **this** machine.

Detach a data disk from a VM where `wcravens` is 1001, attach it to one where 1001 is
`deploy`, and every file now belongs to `deploy`. Nothing was modified — the same number is
being resolved against a different table.

Restored backups and container mounts produce the same effect.

---

# The Three Bits Above the Nine

| Bit | On a file | On a directory |
| --- | --- | --- |
| setuid `4000` | Runs as the **owner**, not the caller | No effect on Linux |
| setgid `2000` | Runs as the **group** | New entries inherit the directory's group |
| sticky `1000` | No effect | **Only the owner may delete an entry** — this is `/tmp` |

All twelve bits live in the same field in the inode, alongside the file type.

Which is why `chmod` updates `ctime` and not `mtime`: the contents did not change. The
inode did.

Mount options can override all of it — `nosuid` on a data volume is next.

---
layout: section
---

# Mounting

One tree, and the file that can cost you the server

---

# There Is Only One Tree

No drive letters. One tree, rooted at `/`, with every other filesystem grafted onto a
directory inside it.

<div class="viz">
<svg viewBox="0 0 860 330" role="img" aria-label="A directory tree rooted at slash, which is on dev sda1. Hanging from the root are etc, var and srv. Hanging from srv is data, drawn with a heavy outline and labelled as the mount point, which is where dev sdb1 is attached. Hanging from data are reports and archive, both of which are on dev sdb1. The point of the figure is that nothing in the path names says which device the files are on.">
  <g style="stroke: var(--baseline); stroke-width: 1.5; fill: none">
    <line x1="60" y1="44" x2="60" y2="160" />
    <line x1="60" y1="80"  x2="140" y2="80" />
    <line x1="60" y1="120" x2="140" y2="120" />
    <line x1="60" y1="160" x2="140" y2="160" />
    <line x1="175" y1="172" x2="175" y2="208" />
    <line x1="175" y1="208" x2="242" y2="208" />
    <line x1="290" y1="226" x2="290" y2="292" />
    <line x1="290" y1="252" x2="358" y2="252" />
    <line x1="290" y1="292" x2="358" y2="292" />
  </g>
  <rect x="248" y="190" width="104" height="36" rx="5"
        style="fill: none; stroke: var(--bar); stroke-width: 2.5" />
  <g class="val" dominant-baseline="middle" style="font-size: 15px; font-family: ui-monospace, monospace">
    <text x="46" y="26">/</text>
    <text x="148" y="80">etc/</text>
    <text x="148" y="120">var/</text>
    <text x="148" y="160">srv/</text>
    <text x="264" y="208">data/</text>
    <text x="366" y="252">reports/</text>
    <text x="366" y="292">archive/</text>
  </g>
  <g style="stroke: var(--muted); stroke-width: 1; stroke-dasharray: 4 3; fill: none">
    <line x1="360" y1="208" x2="548" y2="208" />
  </g>
  <g class="cat" dominant-baseline="middle" style="font-size: 13.5px">
    <text x="560" y="26">on /dev/sda1 — the root filesystem</text>
    <text x="560" y="208">mount point</text>
    <text x="560" y="252">on /dev/sdb1 — the data volume</text>
    <text x="560" y="292">on /dev/sdb1</text>
  </g>
</svg>

<p class="cap">A path tells you nothing about which device it is on. That mapping lives in the kernel's mount table, not in the name.</p>

</div>
---

# `findmnt`

```bash
findmnt --real
# TARGET      SOURCE     FSTYPE OPTIONS
# /           /dev/sda1  ext4   rw,relatime,discard,errors=remount-ro
# ├─/boot/efi /dev/sda15 vfat   rw,relatime,fmask=0022,dmask=0022
# └─/srv/data /dev/sdb1  ext4   rw,relatime
```

`--real` hides the couple of dozen kernel pseudo-filesystems.

The reverse question — *which filesystem holds this path?*

```bash
findmnt -T /srv/data/reports/q3.csv
# TARGET    SOURCE    FSTYPE OPTIONS
# /srv/data /dev/sdb1 ext4   rw,relatime
```

Which is to say: **which disk fills up if I write here.** Worth asking before writing 40 GB.

---

# Mounting by Hand

```bash
sudo mkdir -p /srv/data
sudo mount /dev/sdb1 /srv/data
```

A mount point is an ordinary directory. Nothing marks it beforehand, nothing marks it
afterwards — it becomes a mount point by being named in a `mount` command.

A successful `mount` **prints nothing**. Verify:

```bash
findmnt /srv/data
df -h /srv/data
```

Better, by UUID or label:

```bash
sudo mount UUID=3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b /srv/data
sudo mount LABEL=data /srv/data
```

---

# Mounting Over a Non-Empty Directory

The existing files are **not deleted**. They are shadowed — unreachable while something is
mounted on top, and back intact on `umount`.

The hazard is the opposite order:

1. The data disk fails to mount at boot
2. A service writes to `/srv/data` anyway
3. The files land on the **root** filesystem
4. Somebody mounts the disk later, and the files vanish

They are still there, still consuming root's free space, reachable by nobody.

<div class="hint">

A mount point that should always have something on it wants to be empty — and ideally
read-only — when it does not.

</div>

---

# Mount Options

| Option | Effect |
| --- | --- |
| `defaults` | `rw,suid,dev,exec,auto,nouser,async` |
| `ro` / `rw` | Read-only, or read-write |
| `noexec` | Refuse to execute anything on this filesystem |
| `nosuid` | Ignore setuid and setgid bits |
| `nodev` | Ignore device nodes |
| `noatime` | Skip access-time updates entirely |
| `nofail` | **Do not fail the boot if this filesystem is missing** |
| `errors=remount-ro` | On an I/O error, go read-only rather than carry on |
| `uid=`, `gid=`, `fmask=` | Synthesize ownership — for `vfat`, which stores none |

Options belong to **this mount**, not to the filesystem — read-only in one place, and
read-write in another.

---

# `noexec,nosuid,nodev`

The standard hardening set for any filesystem holding **data rather than programs**:

- User uploads
- `/tmp` on a hardened host
- A removable disk of unknown provenance

```bash
sudo mount -o defaults,noexec,nosuid,nodev /dev/sdb1 /srv/uploads
```

They close the path where someone who can write a file to your data volume can then
**execute** it.

They cost nothing.

---

# `remount` — Changing Options in Place

```bash
sudo mount -o remount,ro /srv/data      # read-only, without unmounting
sudo mount -o remount,rw /srv/data      # and back
```

This is how you take a filesystem out of service for a consistent backup without stopping
everything that merely has it open for reading.

---

# `umount`, and "Target Is Busy"

```bash
sudo umount /srv/data
# umount: /srv/data: target is busy.
```

Some process has a file open there, or its **working directory** inside it. The kernel will
not pull a filesystem out from under a running process.

```bash
sudo lsof /srv/data
# COMMAND  PID USER     FD  TYPE DEVICE SIZE/OFF   NODE NAME
# bash    3312 wcravens cwd  DIR   8,17     4096 131073 /srv/data

sudo fuser -vm /srv/data
```

Nine times in ten it is your own shell, sitting in the directory. `cd` out and try again.

---

# `umount -l` Is Not the Fix

```bash
sudo umount -l /srv/data     # lazy
```

Detaches the filesystem from the **tree** immediately, while leaving it mounted for every
process still using it.

<div class="grid grid-cols-2 gap-8">
<div>

### What you see

The mount point is clear.

</div>
<div>

### What is true

The device is still in use, still being written to, and **not safe** to detach or reformat.

</div>
</div>

Reasonable on a machine you are about to reboot. A bad habit otherwise — it makes the
problem invisible rather than solving it.

---

# `/etc/fstab`

Everything so far lasts until the next reboot. This is the file that makes it permanent.

```bash
# UUID=6f1b2c3d-...  /          ext4  discard,errors=remount-ro  0 1
# UUID=7B77-95E7     /boot/efi  vfat  umask=0077                 0 2
# UUID=3a9f1e2b-...  /srv/data  ext4  defaults,nofail            0 2
```

| # | Field | Holds |
| --- | --- | --- |
| 1 | Device | `UUID=`, `LABEL=`, a path, or a network share |
| 2 | Mount point | The directory — or `none` for swap |
| 3 | Type | `ext4`, `vfat`, `xfs`, `swap`, `nfs`, `auto` |
| 4 | Options | Comma-separated, as with `mount -o` |
| 5 | Dump | Legacy backup flag; always `0` |
| 6 | Pass | `fsck` order at boot: `1` root, `2` others, `0` never |

---

# Field 6 Is the `fsck` from Earlier

This is the automatic check promised two sections ago — run at boot, while the filesystem is
still **unmounted**, which is the only time it is safe.

- `1` — the root filesystem, checked first and alone
- `2` — everything else, checked afterwards, in parallel across different disks
- `0` — never: network mounts, removable media

And field 1: **use UUIDs**. A device name in `fstab` is a bet that enumeration order never
changes.

```bash
sudo blkid
# /dev/sdb1: LABEL="data" UUID="3a9f1e2b-..." TYPE="ext4"
```

---
layout: center
class: text-center
---

# A bad line in `/etc/fstab` can make the machine unbootable

### The most common self-inflicted disaster in this subject

<div class="mt-6 text-left text-base max-w-3xl mx-auto">

At boot, systemd tries to mount everything in `fstab`. A **required** mount that fails drops
the boot into emergency mode — which asks for the root password at a console your cloud VM
may not give you.

A typo in a UUID is enough. So is an entry for a disk you detached last week.

</div>

---

# Two Defenses, and You Want Both

<div class="grid grid-cols-2 gap-8">
<div>

### `nofail`

Tells systemd to carry on booting if this filesystem is missing.

Every non-essential mount should have it.

The **root** filesystem should not — a machine that boots without its root filesystem is
not a useful outcome.

</div>
<div>

### Test before rebooting

```bash
sudo findmnt --verify --verbose
sudo umount /srv/data
sudo mount -a
findmnt /srv/data
```

`--verify` catches malformed lines, unknown types, missing directories, and UUIDs that match
nothing.

</div>
</div>

Run **both**, in that order. `mount -a` alone is not enough: an entry with `nofail` whose
device is missing is skipped silently, exit status 0. `--verify` is what reports it.

---

# `fstab` Becomes systemd Units

`systemd-fstab-generator` runs early in boot and generates a `.mount` unit for every line.
`fstab` is the interface; units are the implementation.

```bash
systemctl list-units --type=mount
# UNIT            LOAD   ACTIVE SUB     DESCRIPTION
# -.mount         loaded active mounted Root Mount
# boot-efi.mount  loaded active mounted /boot/efi
# srv-data.mount  loaded active mounted /srv/data
```

Two consequences:

- **`systemctl daemon-reload` after editing `fstab`.** `mount -a` reads the file directly,
  so it works either way — systemd's view is stale until you reload.
- **A failed mount is a failed unit.** It shows up in `systemctl --failed`, and explains
  itself in `journalctl -u srv-data.mount`.

Last week's diagnostic workflow, unchanged.

---

# Pseudo-filesystems

Several mounts are backed by no device at all. They are kernel interfaces presented as
filesystems — which is how "everything is a file" is actually implemented.

| Mount | Type | Contains |
| --- | --- | --- |
| `/proc` | `proc` | One directory per process, plus `/proc/mounts`, `/proc/cmdline` |
| `/sys` | `sysfs` | Devices and kernel objects — where `lsblk` gets its data |
| `/dev` | `devtmpfs` | Device nodes, maintained by the kernel and `udev` |
| `/run` | `tmpfs` | Runtime state: PID files, sockets, the volatile journal |
| `/dev/shm` | `tmpfs` | Shared memory between processes |

`tmpfs` is a real filesystem — inodes, permissions, a size limit — that lives in RAM.

Which is last week's volatile journal, explained: `/run/log/journal` cannot survive the
reboot you most want to investigate.

---

# Growing a Volume: Three Layers, Three Steps

```bash
# 1. the device — from outside the VM
gcloud compute disks resize data-disk --size=20GB --zone=us-central1-a

# 2. the partition — inside the VM
lsblk                          # disk is 20G; partition is still 10G
sudo growpart /dev/sdb 1       # note the space: device, then partition number

# 3. the filesystem
sudo resize2fs /dev/sdb1       # xfs: sudo xfs_growfs /srv/data
df -h /srv/data
```

Enlarging the disk does not enlarge the partition. Enlarging the partition does not enlarge
the filesystem.

Both steps work on a **mounted, in-use** filesystem. Nothing needs to stop.

---

# Shrinking Is Not Symmetric

<div class="grid grid-cols-2 gap-8">
<div>

### ext4

Can shrink — but only **unmounted**.

`umount`, `resize2fs` smaller, then shrink the partition.

</div>
<div>

### XFS

**Cannot shrink. Ever.**

Not unmounted, not with a tool, not at all.

</div>
</div>

If there is any chance a volume will need to get smaller, that one fact may decide which
filesystem you create.

---

# Swap Is the Exception to All of This

It appears in `fstab` and often has its own partition — and it is **not a filesystem**. No
files, no inodes, no mount point.

```bash
sudo mkswap /dev/sdb2       # not mkfs
sudo swapon /dev/sdb2       # not mount
swapon --show
```

```bash
# UUID=4c5d6e7f-...  none  swap  sw  0 0
```

`none` and `sw` are how `fstab` says those two fields do not apply.

Cloud images ship with no swap. A **swap file** adds some without repartitioning:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile      # it holds process memory — root only
sudo mkswap /swapfile && sudo swapon /swapfile
```

---
layout: section
---

# The Whole Stack

Four layers, one sequence

---

# Build It

```bash
# --- 1. the device ------------------------------------------------------
gcloud compute disks create data-disk --size=10GB --type=pd-balanced \
    --project=$PROJECT --zone=us-central1-a
gcloud compute instances attach-disk $INSTANCE_NAME --disk=data-disk \
    --device-name=data --project=$PROJECT --zone=us-central1-a

lsblk                                 # confirm, three ways,
ls -l /dev/disk/by-id/google-data     # before writing
sudo blkid /dev/sdb                   # anything at all

# --- 2. the partition ---------------------------------------------------
sudo parted -s /dev/sdb mklabel gpt
sudo parted -s -a optimal /dev/sdb mkpart primary ext4 0% 100%
sudo partprobe /dev/sdb && lsblk /dev/sdb

# --- 3. the filesystem --------------------------------------------------
sudo mkfs.ext4 -L data /dev/sdb1
sudo tune2fs -m 1 /dev/sdb1

# --- 4. the mount -------------------------------------------------------
sudo mkdir -p /srv/data
sudo mount /dev/sdb1 /srv/data && df -h /srv/data
```

---

# Make It Permanent

```bash
UUID=$(sudo blkid -s UUID -o value /dev/sdb1)
echo "UUID=$UUID /srv/data ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab

sudo findmnt --verify --verbose
sudo umount /srv/data
sudo mount -a
findmnt /srv/data
sudo systemctl daemon-reload
```

Reading the UUID with `blkid -s UUID -o value` rather than copying it by hand is not
laziness.

A mistyped UUID in `fstab` is the failure from four slides ago, and typing 36 hexadecimal
characters correctly is not a skill worth relying on.

---

# Tear It Down — In Reverse

```bash
sudo umount /srv/data
sudo sed -i '/srv\/data/d' /etc/fstab     # remove the entry BEFORE the disk goes
sudo systemctl daemon-reload

gcloud compute instances detach-disk $INSTANCE_NAME --disk=data-disk \
    --project=$PROJECT --zone=us-central1-a
gcloud compute disks delete data-disk --project=$PROJECT --zone=us-central1-a
```

Detaching a disk that is still mounted is how filesystems get corrupted.

An `fstab` entry naming a disk that no longer exists is precisely the entry that stops the
next boot — and `nofail` is the only thing between that oversight and an emergency console.

**Delete the disk when you are done.** A detached disk is still a disk, and still billed.

---

# Hands-On Lab

The full instructions are in `lab.md`. Work through it on your own VM after class.

**Part 1 — Build the stack.** Create and attach a 10 GB disk. Confirm its identity three
ways before writing to it. Partition it GPT, put a labelled ext4 filesystem on it, mount it
at `/srv/data`, and record what `dumpe2fs -h` says about block size, inode count, and
reserved blocks.

**Part 2 — Make it survive a reboot.** Write the `fstab` entry by UUID, with `nofail`.
Verify with `findmnt --verify` and `mount -a` **before** rebooting. Then reboot and confirm.

---

# Hands-On Lab, continued

**Part 3 — Prove the inode model.** Create a file; record its inode number. Hard link it,
symlink it, and watch the link count. Rename the original and see which link survives.
Delete the original and see which one still resolves. Explain each result in one sentence.

**Part 4 — Reproduce two classic failures.** Fill a small filesystem's inodes and watch
`touch` fail with gigabytes free. Then delete a log file a running process holds open, show
that `df` and `du` disagree, find it with `lsof +L1`, and fix it with `truncate`.

<div class="notes">

Both failures in Part 4 are ones you will otherwise meet for the first time on a production
machine at an inconvenient hour. Cause them deliberately, once, on a VM you can rebuild.

</div>

---

# Assessment Questions

1. Name the four storage layers, bottom to top, and the tool that operates on each.
2. Why is `/dev/sdb` an unsafe thing to write in `/etc/fstab`? What do you write instead?
3. What does a GPT partition's `Type` field actually tell you about its contents?
4. `df -h` shows 8 GB free and `touch` fails with "No space left on device." What happened?
5. What is the one thing an inode does not store, and where does it live instead?
6. Why can a hard link not cross a filesystem boundary?
7. `mv` is instant on a 40 GB file one time and takes ten minutes the next. Explain.
8. You deleted a 5 GB log file and `df` did not change. Diagnose it, then fix it.
9. Which permission governs deleting a file, and on what?
10. What are the two things you run before rebooting a machine whose `fstab` you just edited?

---

# Summary

Today we learned:

- The four layers — **device, partition, filesystem, mount** — and that each is blind to the
  one above
- `lsblk`, `blkid`, and why **UUIDs** belong in `fstab` and `sda` does not
- **GPT** over MBR, and that partitioning is instant, silent, and irreversible
- What `mkfs` writes: superblock, bitmaps, a **fixed** inode table, and a journal
- That `df -i` explains "no space" on a filesystem with space
- The **inode** — everything about a file except its name
- That a **directory is a table of names**, which explains hard links, instant renames, and
  who may delete a file
- That deleting is **unlinking**, and an open descriptor keeps the blocks
- To mount, unmount, and write an `fstab` line that does not cost you the machine

---

# Additional Resources

- `man 5 fstab`, `man 8 mount`, `man 8 findmnt`, `man 8 lsblk`, `man 8 blkid`
- `man 1 stat`, `man 2 stat`, `man 7 inode` — the inode structure, from the source
- `man 8 mkfs.ext4`, `man 8 tune2fs`, `man 8 dumpe2fs`, `man 8 resize2fs`, `man 8 e2fsck`
- `man 8 parted`, `man 8 fdisk`, `man 8 sgdisk`
- [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html) — what belongs in which directory, and why
- [ext4 Data Structures and Algorithms](https://www.kernel.org/doc/html/latest/filesystems/ext4/) — the kernel's own on-disk format documentation
- [Compute Engine — adding and formatting a persistent disk](https://cloud.google.com/compute/docs/disks/add-persistent-disk)
- [Compute Engine — resizing a persistent disk](https://cloud.google.com/compute/docs/disks/resize-persistent-disk)
- `sudo dumpe2fs /dev/sdb1 | less` on your own VM — then read the first screen

---
layout: center
class: text-center
---

<div class="kicker">CSC 171 · Linux Installation and Administration · Lecture 5</div>

# The Name Is Not the File

<div class="term">
<div class="term-bar"><i></i><i></i><i></i><span>student@parkland: ~</span></div>
<pre class="term-body"><span class="ps1">student@vm-171:~$</span> ls -li notes.txt backup.txt
<span class="dim">131074 -rw-r--r-- 2 student student 1024 Sep 17 15:02 notes.txt</span>
<span class="dim">131074 -rw-r--r-- 2 student student 1024 Sep 17 15:02 backup.txt</span>
<span class="ps1">student@vm-171:~$</span> rm notes.txt
<span class="ps1">student@vm-171:~$</span> <span class="cursor"></span></pre>
</div>

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

.slidev-layout .hint {
  margin-top: 0.9rem;
  font-size: 0.95rem;
  opacity: 0.75;
}
</style>
