---
title: Disks, Filesystems, and Mounting
subtitle: CSC 171 — Lecture 5
---

## Overview

Phase 3 of last week's boot sequence was summarized in five words: the kernel finds a root
filesystem. That sentence hides four separate things, each of which can be configured
wrong, and each of which fails in a different way.

There is a **disk** — a device the kernel can read and write in fixed-size blocks. On it is
a **partition table**, dividing that device into regions. Inside a region is a
**filesystem**, a specific arrangement of bytes that turns raw space into named files. And
finally that filesystem is **mounted**, grafted onto the single directory tree at a
directory of your choosing, which is the only reason a path like `/var/log/syslog` means
anything at all.

Those four layers are the subject of this lecture. We will build them from the bottom up on
a real machine: attach a disk, partition it, put a filesystem on it, mount it, and make the
mount survive a reboot. In between, we will open up a filesystem and look at how it
actually stores a file — which turns out to explain a startling number of otherwise
arbitrary-looking Linux behaviors, from why renaming a huge file is instant to why deleting
one sometimes frees no space at all.

## Learning objectives

After working through this material you will be able to:

- Describe the four layers between a physical device and a path, and name the tool that
  operates on each
- Read `lsblk` and `blkid` output and identify devices, partitions, filesystems, and UUIDs
- Explain why kernel device names are unstable, and use `/dev/disk/by-*` instead
- Compare MBR and GPT partition tables and state the limits of each
- Partition a new disk with `fdisk` or `parted`, and explain why partitioning is destructive
- Create a filesystem with `mkfs` and explain what `mkfs` writes
- Define an inode, list what it stores, and state the one thing it does not store
- Read `stat` output field by field
- Explain a directory as a table of names mapped to inode numbers, and use that model to
  predict the behavior of hard links, symbolic links, renames, and deletions
- Diagnose inode exhaustion and the deleted-but-open-file case where `df` and `du` disagree
- Mount and unmount filesystems, and resolve a busy unmount
- Write an `/etc/fstab` entry that survives a reboot without risking an unbootable machine
- Grow a filesystem after enlarging its disk

## Key commands covered

Table: Commands introduced in this lecture, grouped by the layer they operate on

| Command | Layer | Purpose |
| --- | --- | --- |
| `lsblk` | Device | List block devices as a tree |
| `blkid` | Filesystem | Report type, LABEL, and UUID of each filesystem |
| `fdisk` | Partition | Read and edit a partition table interactively |
| `parted` | Partition | Read and edit a partition table, scriptably |
| `sgdisk` | Partition | Script GPT operations without an interactive prompt |
| `partprobe` | Partition | Ask the kernel to re-read a partition table |
| `mkfs.ext4` | Filesystem | Create an ext4 filesystem |
| `mkswap` / `swapon` | Filesystem | Prepare and activate swap space |
| `dumpe2fs` | Filesystem | Dump ext filesystem superblock and group metadata |
| `tune2fs` | Filesystem | Change ext filesystem parameters after creation |
| `fsck` | Filesystem | Check and repair an unmounted filesystem |
| `stat` | Inode | Show every field of a file's inode |
| `ls -i` | Inode | Show inode numbers alongside names |
| `ln` | Inode | Create hard and symbolic links |
| `df` | Mount | Report free space, or with `-i` free inodes |
| `du` | Mount | Report space consumed by files |
| `lsof` | Mount | List open files, including deleted ones still held open |
| `mount` / `umount` | Mount | Attach and detach a filesystem |
| `findmnt` | Mount | Query the mount table, and verify `/etc/fstab` |
| `growpart` / `resize2fs` | All | Grow a partition and then its filesystem |
| `gcloud compute disks create` | Device | Create a disk to attach to a VM |

---

## Part 1: The storage stack

### Four layers, four tools

Every path on a Linux system resolves down through the same four layers. Confusion about
storage is almost always confusion about which layer a problem lives on, so it is worth
fixing the stack in mind before touching a command.

Table: The four storage layers, the tool that operates on each, and what each one provides

| Layer | Example | Tool | Provides |
| --- | --- | --- | --- |
| Block device | `/dev/sdb` | `lsblk` | An addressable array of fixed-size blocks |
| Partition | `/dev/sdb1` | `fdisk`, `parted` | A named region of that array |
| Filesystem | ext4 on `/dev/sdb1` | `mkfs`, `fsck` | Files and directories inside a region |
| Mount | `/srv/data` | `mount`, `/etc/fstab` | A place in the tree where those files appear |

Each layer knows nothing about the one above it. A disk does not know it has been
partitioned; a partition does not know it holds a filesystem; a filesystem does not know
where it is mounted, or whether it is mounted at all. That independence is what makes the
stack flexible, and it is also why a mistake at a lower layer destroys everything above it
without warning.

### Block devices

The kernel exposes storage hardware as **block devices**: devices read and written in
fixed-size chunks, at arbitrary offsets, with the results cached in memory. That is the
distinction from a **character device** like a serial port or `/dev/random`, which delivers
a stream of bytes with no notion of position.

Both appear as files in `/dev`, and `ls -l` tells you which is which by the first character
of the mode:

```bash
ls -l /dev/sda /dev/null
# brw-rw---- 1 root disk   8,  0 Sep 17 14:02 /dev/sda
# crw-rw-rw- 1 root root   1,  3 Sep 17 14:02 /dev/null
```

`b` is a block device and `c` is a character device. Neither has a size in the usual sense:
where an ordinary file would show a byte count, these show two numbers — `8, 0` — which are
the **major** and **minor** device numbers. The major number identifies the driver, the
minor number identifies which device that driver should act on. The file in `/dev` holds no
data at all. It is a name that carries a pair of numbers pointing into the kernel.

The tool you will actually use is `lsblk`, which renders the whole picture as a tree:

```bash
lsblk
# NAME    MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
# sda       8:0    0    10G  0 disk
# ├─sda1    8:1    0   9.9G  0 part /
# ├─sda14   8:14   0     3M  0 part
# └─sda15   8:15   0   124M  0 part /boot/efi
```

That is a default Debian image on a 10 GB Compute Engine disk. One disk, three partitions,
two of them mounted. Your sizes will differ; the shape will not.

`sda14` is worth a moment. It is 3 MB, has no filesystem, and is never mounted: it is the
**BIOS boot partition**, a scrap of space GRUB uses to store the code that will not fit in
the 440 bytes of a Master Boot Record. The image carries both it and the EFI System
Partition so that the same disk image boots on firmware of either kind. That is last
week's lecture, visible in this week's partition table.

Add `-f` and `lsblk` reports the filesystem layer as well:

```bash
lsblk -f
# NAME    FSTYPE FSVER LABEL UUID                                 FSAVAIL FSUSE% MOUNTPOINTS
# sda
# ├─sda1  ext4   1.0         6f1b2c3d-4e5a-4b6c-8d9e-0a1b2c3d4e5f    7.4G    17% /
# ├─sda14
# └─sda15 vfat   FAT32       7B77-95E7                               118M     4% /boot/efi
```

An empty `FSTYPE` column means exactly what it says: there is no filesystem in that
partition. That is the normal state of a disk you have just attached, and it is the first
thing to check when a mount fails.

### Device names are not stable

`sda` means "the first SCSI-like disk the kernel enumerated." Nothing about that name is a
property of the disk. Attach a second disk, reboot, and the two may be enumerated in the
other order; the name that was `sdb` yesterday can be `sda` today. Different virtual
hardware uses different naming schemes entirely.

Table: Kernel block device naming schemes you will encounter

| Pattern | Hardware | Example partition |
| --- | --- | --- |
| `sdX` | SCSI, SATA, USB, and most virtualized disks | `/dev/sdb1` |
| `nvmeXnY` | NVMe solid-state storage | `/dev/nvme0n1p1` |
| `vdX` | virtio paravirtualized disks | `/dev/vdb1` |
| `mmcblkX` | SD and eMMC cards | `/dev/mmcblk0p1` |

Note the `p` in the NVMe and eMMC partition names. When a device name already ends in a
digit, the partition number is separated by `p` so the result stays readable. Scripts that
build a partition name by pasting a `1` onto a device name break the moment they meet an
NVMe disk.

The fix is to stop using kernel names for anything that has to survive a reboot. `udev`
maintains directories of stable symbolic links:

```bash
ls /dev/disk/
# by-diskseq  by-id  by-label  by-partuuid  by-path  by-uuid
```

Table: The stable device name directories and when to use each

| Directory | Names a device by | Use for |
| --- | --- | --- |
| `by-uuid` | The UUID inside the filesystem | `/etc/fstab` entries — the default choice |
| `by-label` | A human-assigned filesystem label | Readable `fstab` entries, when labels are unique |
| `by-id` | Hardware serial or vendor-assigned name | Identifying a physical or cloud disk before formatting |
| `by-partuuid` | The partition's GPT GUID | Referring to a partition that holds no filesystem |
| `by-path` | The physical connection topology | Slot-based identification, as in a disk shelf |

A UUID lives inside the filesystem, written there by `mkfs`, so it follows the data. Move
the disk to another machine, change its cabling, add three more disks ahead of it: the UUID
is unchanged. That is what makes it the correct thing to put in `/etc/fstab`, and we will
come back to it.

Google Compute Engine adds a useful one. Every disk attached to an instance is given a
**device name** at attach time, and the guest OS sees it as a `by-id` symlink:

```bash
ls -l /dev/disk/by-id/google-*
# lrwxrwxrwx 1 root root  9 Sep 17 14:02 /dev/disk/by-id/google-csc171-boot -> ../../sda
# lrwxrwxrwx 1 root root  9 Sep 17 14:02 /dev/disk/by-id/google-data -> ../../sdb
```

That name is the one you chose in `gcloud`, so it answers the question that actually
matters when you are about to erase something: **which of these devices is the disk I just
attached?** Confirming that before you partition is not optional carefulness. It is the
difference between formatting a blank volume and formatting your root disk.

---

## Part 2: Partitions

### Why divide a disk at all

A partition table is a small structure at the start of a disk that says "bytes *this* far
in through *that* far in are region one, and here is what region one is for." That is the
whole idea. Everything else is consequence.

There are four durable reasons to use more than one region:

1. **Containment.** A filesystem that fills up affects only what is on it. A runaway log
   file on its own `/var/log` volume fills that volume; the same file on a single root
   filesystem fills the root, and a Linux system with no free space on `/` cannot write a
   PID file, a lock, or a session record, which means it will not let you log in to fix it.
2. **Different rules for different data.** A partition is the unit that mount options apply
   to. Mounting the volume that holds user uploads with `noexec` and `nosuid` is a real
   security boundary, and it is only available because that data is on its own filesystem.
3. **Different filesystems.** Firmware requires the EFI System Partition to be FAT32. Swap
   is not a filesystem at all. Neither can share a region with your root filesystem.
4. **Independent lifecycle.** Data on its own disk can be detached from one VM and attached
   to another, backed up on its own schedule, or survive a rebuild of the operating system.

The counterargument is real too, and you should know it: partitions are **rigid**. A
partition sized today at 20 GB is 20 GB, and growing it means the free space has to be
immediately after it on the disk. That rigidity is what LVM and cloud volumes exist to
soften, and it is why modern server images ship with one big root partition rather than the
elaborate six-partition layouts of twenty years ago. Split a volume off when you have a
reason. Do not split by ritual.

### MBR and GPT

There are two partition table formats in practical use, and last week's lecture already
explained where they came from.

Table: The two partition table formats and the limits that distinguish them

| Property | MBR | GPT |
| --- | --- | --- |
| Where it lives | First 512-byte sector | Header at sector 1, plus a backup at the end of the disk |
| Partitions | 4 primary, or 3 plus an extended chain | 128 by default |
| Maximum disk size | 2 TiB with 512-byte sectors | 8 ZiB; effectively no limit |
| Partition identity | A one-byte type code | A 16-byte type GUID, plus a unique GUID per partition |
| Partition names | None | A 36-character label per partition |
| Redundancy | None | Primary and backup headers, each with a CRC32 |
| Firmware | BIOS, and UEFI in compatibility mode | UEFI |

The redundancy row is the one administrators underrate. An MBR is a single sector with no
checksum: corrupt it and the disk becomes an unlabeled expanse of bytes with no record of
where anything started. GPT keeps a second copy of the table at the far end of the disk and
checksums both, so a damaged table can be repaired from its own backup. Use GPT. The only
reason to create an MBR today is compatibility with something old and specific.

Note the shape of the limits. Both are **addressing** limits, not storage technology
limits: MBR stores a partition's starting sector in 32 bits, and 2^32 sectors of 512 bytes
is 2 TiB. This is the same arithmetic that produced the 440-byte boot code limit, from the
same 1983 design.

### Reading a partition table

Three tools read a table, and they disagree about presentation rather than fact.

```bash
sudo fdisk -l /dev/sda
# Disk /dev/sda: 10 GiB, 10737418240 bytes, 20971520 sectors
# Units: sectors of 1 * 512 = 512 bytes
# Sector size (logical/physical): 512 bytes / 4096 bytes
# Disklabel type: gpt
# Disk identifier: 1F2E3D4C-5B6A-4988-9A0B-1C2D3E4F5A6B
#
# Device      Start      End  Sectors  Size Type
# /dev/sda1  262144 20971486 20709343  9.9G Linux filesystem
# /dev/sda14   2048     8191     6144    3M BIOS boot
# /dev/sda15   8192   262143   253952  124M EFI System
```

Four things in that output are worth naming.

**`Disklabel type: gpt`** is the format from the previous section. **Sector size (logical
/physical): 512 bytes / 4096 bytes** describes a drive that stores data in 4 KiB physical
sectors while presenting 512-byte logical ones — the arrangement called 512e, near
universal on modern hardware. Writing less than a full physical sector forces the drive to
read, modify, and write the whole thing, so partitions must begin on a 4 KiB boundary or
every write on that partition pays the penalty. Modern tools handle this for you by
aligning partitions to 1 MiB, which is why `sda14` starts at sector 2048 rather than
sector 34.

**The Type column** is not a filesystem. It is a GPT type GUID that declares intent, and
the only consumer that reliably cares is firmware, which looks for `EFI System`. A
partition marked `Linux filesystem` may contain ext4, XFS, or nothing whatsoever. The type
code is a label on the box, not an inventory of the contents.

**The partition numbers are not in disk order.** `sda1` starts at sector 262144, after
`sda14` and `sda15`. A GPT table is an array of slots, and the slot number has nothing to
do with position on the disk. Nothing is wrong here, and it is normal enough that you
should not spend any time on it when you meet it.

For scripting, `parted` prints the same facts in a machine-readable form:

```bash
sudo parted /dev/sda print
sudo parted -m /dev/sda unit s print   # -m for machine-parseable output
```

### Creating a partition

The workflow is always the same four steps: get a disk, confirm you have the right one,
write a table and a partition, and tell the kernel to re-read it.

On Compute Engine, step one is a `gcloud` call. Note `--device-name`, which is what gives
you the `by-id` symlink from Part 1:

```bash
gcloud compute disks create data-disk \
    --project=$PROJECT --zone=us-central1-a \
    --size=10GB --type=pd-balanced

gcloud compute instances attach-disk $INSTANCE_NAME \
    --project=$PROJECT --zone=us-central1-a \
    --disk=data-disk --device-name=data
```

Step two happens on the VM, and you do it every time:

```bash
lsblk
# sdb       8:16   0    10G  0 disk           <- new, no partitions, no mountpoint
ls -l /dev/disk/by-id/google-data
# lrwxrwxrwx 1 root root 9 Sep 17 14:31 /dev/disk/by-id/google-data -> ../../sdb
sudo blkid /dev/sdb
# (no output, and exit status 2: there is no filesystem here)
```

Three independent confirmations that `/dev/sdb` is a blank, newly attached disk: it has no
partitions, its `by-id` name is the one you assigned, and it holds no filesystem. Then and
only then, write to it.

`fdisk` is interactive and is what most people reach for:

```bash
sudo fdisk /dev/sdb
```

Table: The `fdisk` commands that cover ordinary partitioning work

| Key | Does |
| --- | --- |
| `m` | Print the command menu |
| `p` | Print the current partition table |
| `g` | Create a new, empty **GPT** table, discarding any existing one |
| `o` | Create a new, empty MBR table |
| `n` | Add a new partition; accept the offered defaults to use the whole disk |
| `t` | Change a partition's type code |
| `d` | Delete a partition |
| `w` | **Write** the table to disk and exit |
| `q` | Quit, discarding every change made in this session |

That last pair is the important one. `fdisk` edits an in-memory copy and touches the disk
only on `w`. If you are not certain what you have done, press `q` and nothing has happened.
This makes `fdisk` safe to explore in, and it means the one keystroke to think carefully
about is `w`.

A whole-disk GPT partition is four keystrokes and three carriage returns: `g`, `n`, Enter,
Enter, Enter, `w`.

The same operation non-interactively, for a script:

```bash
sudo parted -s /dev/sdb mklabel gpt
sudo parted -s -a optimal /dev/sdb mkpart primary ext4 0% 100%
```

`-s` suppresses the confirmation prompts, which is what makes it scriptable and also what
makes a typo in the device name unrecoverable. Expressing the boundaries as `0%` and `100%`
lets `parted` handle alignment rather than doing sector arithmetic by hand.

Finally, step four. The kernel reads a partition table when it first sees a device, and
caches it. After editing, it needs to be told:

```bash
sudo partprobe /dev/sdb    # ask the kernel to re-read the table
lsblk /dev/sdb
# NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
# sdb    8:16   0  10G  0 disk
# └─sdb1 8:17   0  10G  0 part
```

`fdisk` and `parted` usually do this for you on exit, and when they cannot — because a
partition on the disk is currently mounted — they say so and tell you a reboot is required.
`partprobe` ships in the `parted` package and is not guaranteed to be installed; `partx -u`
does the same job and comes from `util-linux`, which always is.
Do not skip the `lsblk` afterwards. If `sdb1` did not appear, the next command in the
sequence will operate on the wrong thing.

### One rule about partitioning

**Partitioning is destructive, and it is destructive in a way that gives you no warning.**

Writing a partition table changes a few hundred bytes at the start of a disk. It does not
touch the data in the regions those bytes describe. So the operation is instant, the
command exits 0, and the terabyte of files that used to be there is still physically
present — but the map to it is gone, and every tool that consults the map now reports empty
space. The disk looks blank, and behaves blank, and the next write genuinely does begin
destroying data.

There is no undo. There is no confirmation beyond the one you clicked past. The only
defense is the confirmation step above, performed every single time, including the times
you are certain.

---

## Part 3: Filesystems

### What `mkfs` actually does

A partition is a range of blocks. It has no notion of a file, a name, a size, or an owner.
A **filesystem** is a data structure written into that range which supplies all of those:
an agreed-upon arrangement of bytes that both the kernel and the on-disk format understand.

Creating one is a single command:

```bash
sudo mkfs.ext4 -L data /dev/sdb1
# mke2fs 1.47.2 (1-Jan-2025)
# Creating filesystem with 2620923 4k blocks and 655360 inodes
# Filesystem UUID: 3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b
# Superblock backups stored on blocks:
#         32768, 98304, 163840, 229376, 294912, 819200, 884736, 1605632
#
# Allocating group tables: done
# Writing inode tables: done
# Creating journal (16384 blocks): done
# Writing superblocks and filesystem accounting information: done
```

Read that output closely, because it is a summary of everything the rest of this part
covers. `mkfs` decided on a block size, computed how many blocks fit, allocated a fixed
number of inodes, wrote several copies of the superblock, built group tables, created a
journal, and generated a UUID. All of that happened in about a second, and all of it is now
permanent: most of those numbers cannot be changed afterwards.

Note also what `mkfs` did **not** do. It did not mount the filesystem, and it did not ask
where the filesystem should appear in the directory tree. Those are Part 5's business, and
the separation is deliberate.

### Choosing a filesystem

Table: Filesystems you will meet on a Linux server, and what each is for

| Filesystem | Use it for | Notes |
| --- | --- | --- |
| `ext4` | The default choice for general Linux storage | Mature, predictable, shrinkable offline |
| `xfs` | Large volumes and parallel workloads | Red Hat's default; grows online, **never shrinks** |
| `btrfs` | Snapshots, checksums, built-in volume management | Copy-on-write; more moving parts |
| `zfs` | Storage servers with integrity and snapshot needs | Not in the mainline kernel; licensing friction |
| `vfat` | The EFI System Partition, and removable media | No permissions, no ownership, no symlinks |
| `exfat` | Large removable media shared with Windows and macOS | Same lack of Unix metadata as `vfat` |
| `tmpfs` | `/run`, `/dev/shm`, scratch space | Lives in RAM; contents vanish at reboot |
| `nfs` | A filesystem served over the network | Mounted from a server, not from a block device |
| swap | Paging space | Not a filesystem; `mkswap` and `swapon`, not `mkfs` and `mount` |

For this course, ext4 unless there is a reason. It is Debian's default, it is the best
documented, and its tooling (`dumpe2fs`, `tune2fs`, `resize2fs`, `e2fsck`) lets you see
what is going on inside — which is exactly what the next section does.

One row deserves emphasis because it produces a recurring class of bug: `vfat` and `exfat`
store **no ownership and no permission bits**. Copy a directory tree onto a FAT-formatted
USB stick and every mode is synthesized at mount time from the mount options. Your careful
`chmod 600` on a private key is not preserved, and a shell script copied back will have
lost its executable bit. This is not a bug in the copy command; the destination format has
nowhere to put the information.

### The shape of an ext4 filesystem

Given a range of blocks, ext4 divides it into **block groups** and gives every group the
same internal layout. The first few structures are the ones you will hear named in error
messages.

Table: The on-disk structures of an ext4 filesystem and what each one holds

| Structure | Holds | Consequence when damaged |
| --- | --- | --- |
| Superblock | Block size, block and inode counts, label, UUID, mount state | The filesystem cannot be identified at all |
| Group descriptors | Where each group's bitmaps and inode table start | Allocation metadata is unreachable |
| Block bitmap | One bit per block: in use or free | Space accounting is wrong; blocks get double-allocated |
| Inode bitmap | One bit per inode: in use or free | The same, for inodes |
| Inode table | The fixed array of inode structures | File metadata is lost, even where the data survives |
| Data blocks | File contents, and directory contents | The files themselves |
| Journal | Recently intended metadata changes | Recovery after an unclean shutdown is not possible |

The superblock is the entry point: every tool that opens a filesystem reads it first, and a
corrupt one makes the filesystem unrecognizable. Which is why `mkfs` printed a list of
**superblock backups** — copies scattered at known block numbers, so that `fsck -b 32768`
can rebuild from a spare when the primary is unreadable.

You can read the superblock directly:

```bash
sudo dumpe2fs -h /dev/sdb1
# Filesystem volume name:   data
# Filesystem UUID:          3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b
# Filesystem state:         clean
# Inode count:              655360
# Block count:              2620923
# Reserved block count:     131046
# Free blocks:              2532112
# Free inodes:              655349
# Block size:               4096
# Inode size:               256
# Mount count:              1
# Last mounted on:          /srv/data
# Journal inode:            8
```

`-h` prints the header only; without it you get every block group, which is long and
occasionally useful. Two numbers in there will come back later: `Inode count` is fixed
forever, and `Reserved block count` is 131046 blocks — 5% of the filesystem, set aside for
root. That reservation keeps a full disk from locking out the administrator and gives the
allocator room to avoid fragmentation. On a pure data volume it is 500 MB of nothing, and
you can reclaim it:

```bash
sudo tune2fs -m 1 /dev/sdb1    # reserve 1% instead of 5%
```

Leave it at 5% on the root filesystem. That reservation is the reason a full root disk is
usually recoverable.

### Blocks and inodes are both allocated at `mkfs` time

Two of the numbers `mkfs` chose are worth understanding, because one of them causes an
error message that reads like a lie.

The **block size** — 4096 bytes here — is the smallest unit of space a file can occupy.
A 10-byte file consumes a whole 4 KiB block; the remaining 4086 bytes are internal
fragmentation and are not available to anything else. This is why a directory of a million
tiny files consumes far more disk than the sum of its file sizes, and why `du` and `ls -l`
routinely disagree.

The **inode count** — 655360 here — is the maximum number of files the filesystem can ever
contain. `mkfs.ext4` computes it by dividing the size by one inode per 16 KiB of space, and
then writes that many inode structures into the inode table immediately, empty. It is not a
running total that grows on demand. It is a fixed-size array, sized once, at creation.

The consequence:

```bash
df -h /srv/data
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sdb1       9.8G  1.2G  8.1G  13% /srv/data

touch /srv/data/one-more-file
# touch: cannot touch '/srv/data/one-more-file': No space left on device
```

Eight gigabytes free, and the filesystem is full. Both statements are true, because they
are about different resources. `df -i` shows the one that ran out:

```bash
df -i /srv/data
# Filesystem      Inodes  IUsed IFree IUse% Mounted on
# /dev/sdb1       655360 655360     0  100% /srv/data
```

**Inode exhaustion.** It happens to mail spools, session directories, caches, and anything
else that accumulates enormous numbers of very small files. The fix is unwelcome: you
cannot add inodes to an existing ext4 filesystem. You delete files, or you back up, run
`mkfs` again with `-i 8192` or `-N` to request more inodes, and restore.

`df -i` costs nothing and belongs in your reflexes right next to `df -h`. "No space left on
device" on a filesystem with free space is one of the small number of Linux errors that is
genuinely unguessable if you have not seen it before.

### Journaling, and why `fsck` has a rule

A filesystem operation that looks atomic from a shell is several separate writes on the
disk. Appending to a file updates the block bitmap, the inode, and the data block. Lose
power between them and the structure is inconsistent: blocks marked in use that belong to
no file, an inode whose size disagrees with its blocks, a directory entry pointing at a
freed inode.

A **journal** closes that window. Before modifying metadata, ext4 writes a description of
what it is about to do into a dedicated area, then performs the change, then marks the
journal entry complete. After a crash, the kernel replays the journal at mount time:
entries marked complete are known good, and incomplete ones are either finished or
discarded. Recovery takes a second or two regardless of filesystem size, where a full
consistency check of a multi-terabyte volume takes hours.

What the default mode (`data=ordered`) guarantees is that **metadata** is consistent, and
that data blocks are written before the metadata that refers to them, so a file never ends
up pointing at another file's leftover contents. It does **not** guarantee that an
application's last writes reached the disk. Durability of your data is the application's
problem, solved with `fsync`, not the journal's.

When a filesystem is damaged beyond what a journal replay can fix, `fsck` checks and
repairs it:

```bash
sudo umount /srv/data
sudo fsck -f /dev/sdb1     # -f forces a check even if marked clean
```

The rule, and it is absolute: **never run `fsck` on a mounted filesystem.** `fsck` reads
structures directly from the block device and rewrites them in place. A mounted filesystem
is being modified concurrently by the kernel, whose cached copy of those same structures is
now stale. The two writers corrupt each other, and the usual result is a filesystem
considerably worse off than the one you set out to repair. Unmount first; if the filesystem
in question is the root filesystem, that means booting from rescue media.

Normally you never invoke `fsck` by hand at all. The `pass` field in `/etc/fstab` — Part 5
— tells the boot process to check filesystems automatically, while they are still unmounted.

---

## Part 4: Inodes, directories, and metadata

### The inode

An **inode** is the record that describes one file. It is a fixed-size structure — 256
bytes on a default ext4 filesystem — living in the inode table, and it is what the
filesystem actually means by "a file."

Table: What an inode stores

| Field | Holds |
| --- | --- |
| Type | Regular file, directory, symlink, socket, FIFO, block or character device |
| Permissions | The twelve mode bits: `rwx` for user, group, other, plus setuid, setgid, sticky |
| Owner | The user ID, as a **number** |
| Group | The group ID, as a **number** |
| Size | Length in bytes |
| Link count | How many directory entries refer to this inode |
| Timestamps | Access, modification, and status-change times; on ext4, creation time as well |
| Block pointers | Where on disk the file's data actually lives |

And now the field that is not in that table, and whose absence explains the rest of this
part:

**An inode does not store the file's name.**

There is nowhere in the structure that describes a file for a name to go. The name lives
somewhere else entirely, and everything below follows from where.

Inodes are numbered, and `ls -i` shows the number:

```bash
ls -li /srv/data
# total 8
# 131074 -rw-r--r-- 1 wcravens wcravens 1024 Sep 17 15:02 notes.txt
#     11 drwx------ 2 root     root     16384 Sep 17 14:45 lost+found
```

Inode numbers are unique **within one filesystem**, and nowhere else. Every mounted
filesystem has its own inode 131074. A file is therefore identified, globally, by the pair
(device, inode number) — which is exactly what the kernel uses internally, and exactly why
several operations later in this section refuse to cross a filesystem boundary.

`lost+found` at inode 11 is a fixed feature of every ext filesystem: the directory where
`fsck` puts files whose inodes it recovered but whose names it could not. A file in
`lost+found` is data that survived with its metadata intact and its name lost — which is
the shape of the whole idea, demonstrated by accident.

### `stat`, field by field

`stat` prints the inode, decoded:

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

Table: The `stat` fields and what each one is telling you

| Field | Means |
| --- | --- |
| `Size` | Length in bytes, as `ls -l` reports it |
| `Blocks` | 512-byte units actually allocated — 8 blocks is 4 KiB, one filesystem block |
| `IO Block` | The filesystem's block size |
| `Device` | Major and minor numbers of the device holding the file |
| `Inode` | The inode number, unique on that device |
| `Links` | How many names point at this inode |
| `Access: (0644/...)` | The mode, octal and symbolic; the leading `-` is the file type |
| `Uid` / `Gid` | Numeric owner and group, with names looked up for display |
| `Access` | Last time the contents were read |
| `Modify` | Last time the contents changed |
| `Change` | Last time the **inode** changed |
| `Birth` | When the inode was created |

Two rows repay attention.

`Size: 1024` with `Blocks: 8` is the block-size arithmetic from Part 3 made visible: a
1 KiB file occupies 4 KiB of disk. The relationship can also run the other way. A **sparse**
file — one written with large unwritten gaps, as database and VM image files often are —
reports a large `Size` and very few `Blocks`, because the holes were never allocated. This
is the second reason `du` and `ls -l` disagree.

`Change` is not "when was this file changed," which is `Modify`. It is when the inode
itself last changed, which includes a `chmod`, a `chown`, or a rename — operations that
alter the file's metadata while leaving its contents alone. You cannot set `ctime` from
userspace, and that is the point: it is the field that notices tampering that `touch` can
otherwise hide.

### A directory is a table of names

If the inode has no name, where is the name?

**A directory is a file whose contents are a table mapping names to inode numbers.** That
is all a directory is. It has its own inode, its own permissions, and its own data blocks,
and those data blocks hold entries that look, conceptually, like this:

Table: The contents of a directory, conceptually

| Name | Inode |
| --- | --- |
| `.` | 2 |
| `..` | 2 |
| `notes.txt` | 131074 |
| `lost+found` | 11 |
| `archive` | 131090 |

An entry pairing a name with an inode number is called a **link**. Looking up
`/srv/data/notes.txt` means: read the root directory's data to find the inode for `srv`,
read that inode to find its data blocks, read those to find the inode for `data`, and so on
down the path, one lookup per component.

The `.` and `..` entries are ordinary links, not syntax. `.` points at the directory
itself, `..` at its parent, and both are stored in the directory's data like any other
entry. That is why a directory's link count is normally 2 plus its number of
subdirectories: one link from its parent, one from its own `.`, and one from each child's
`..`. When `ls -ld` shows `Links: 7` on a directory, you are looking at a directory with
five subdirectories, and you did not have to count them.

Three long-standing Linux behaviors are consequences of this design, and each is easier to
remember as a consequence than as a rule.

**Renaming is instant, regardless of size.** `mv bigfile.iso other.iso` rewrites one entry
in one directory's table. The inode is untouched, the data is untouched, and a 40 GB file
renames as fast as an empty one. If the destination is on a *different* filesystem, `mv`
cannot do this — the inode number would be meaningless there — so it silently degrades to
a full copy followed by a delete, which is why the same command is sometimes instant and
sometimes takes ten minutes.

**Permission to delete a file has nothing to do with the file.** Removing a file means
removing an entry from a directory's table, so it is governed by write permission on **the
directory**. You can delete a read-only file you do not own, provided you can write to the
directory that names it. This surprises everyone once, and it is the reason `/tmp` needs
the sticky bit: without it, any user could remove any other user's files from a
world-writable directory.

**A file can have more than one name.** Nothing in the structure limits a given inode to a
single directory entry, which is the next section.

### Hard links

A **hard link** is an additional directory entry pointing at an existing inode:

```bash
ln notes.txt second-name.txt

ls -li
# 131074 -rw-r--r-- 2 wcravens wcravens 1024 Sep 17 15:02 notes.txt
# 131074 -rw-r--r-- 2 wcravens wcravens 1024 Sep 17 15:02 second-name.txt
```

Same inode number, and the link count went from 1 to 2. There is one file on disk with two
names, and the two names are equal in every respect — neither is the original, because the
inode does not record which entry came first. Writing through one is writing to the other,
because there is no "other." Changing the mode on either changes the mode, singular.

Hard links have two hard limits, and both fall directly out of the model:

- **A hard link cannot cross a filesystem.** The entry stores an inode number, and inode
  numbers are only meaningful within one filesystem. `ln` across a mount point fails with
  `Invalid cross-device link`.
- **A hard link cannot point at a directory.** Permitting it would let you build a cycle in
  the directory tree, which would turn every recursive traversal into an infinite loop and
  leave orphaned subtrees no `fsck` could reason about. The kernel simply refuses.

### Symbolic links

A **symbolic link** is a different thing entirely: its own inode, of type symlink, whose
data is a **path written as text**.

```bash
ln -s /srv/data/notes.txt link-to-notes

ls -li
# 131074 -rw-r--r-- 2 wcravens wcravens 1024 Sep 17 15:02 notes.txt
# 131099 lrwxrwxrwx 1 wcravens wcravens   19 Sep 17 15:20 link-to-notes -> /srv/data/notes.txt
```

Different inode, type `l`, and a size of 19 bytes — the exact length of the string
`/srv/data/notes.txt`. The link count on `notes.txt` did not change, because nothing new
points at its inode. When something opens `link-to-notes`, the kernel reads that string and
resolves it as a path, starting over from the beginning.

Table: Hard links and symbolic links compared

| Property | Hard link | Symbolic link |
| --- | --- | --- |
| What it is | Another entry naming the same inode | A file whose contents are a path |
| Own inode | No | Yes |
| Affects link count | Yes | No |
| Can cross filesystems | No | Yes |
| Can point at a directory | No | Yes |
| Survives the target being renamed | Yes | No — it dangles |
| Survives the target being deleted | Yes, if another link remains | No — it dangles |
| Shown by `ls -l` as | An ordinary file | `l` type, with `-> target` |

The `lrwxrwxrwx` mode on a symlink is not a permissions failure. The mode bits on a symlink
are ignored; access is decided entirely by the permissions on the target the path resolves
to. Every symlink shows `777`.

A symlink to a path that does not exist is **dangling**, and creating one is allowed:
nothing is checked until the link is followed. That is a feature — `/etc/alternatives` and
systemd's `enable` mechanism both rely on links that can be created before or after their
targets — and it is also the reason a symlink can quietly break when someone reorganizes a
directory somewhere else on the system.

### Deleting is unlinking

The system call behind `rm` is named `unlink`, and by now the name should read as a
description rather than jargon. It removes an entry from a directory's table and decrements
the inode's link count. Only when the count reaches **zero** does the filesystem free the
inode and mark its data blocks available.

There is a second condition, and it is the one that produces a memorable outage:

**An inode is not freed while any process still has the file open.**

The kernel tracks open file descriptors alongside the link count. A file with zero names
and one open descriptor continues to exist, fully allocated, reachable by the process
holding it and by nothing else. When that descriptor closes, the space is released.

Which is why this happens:

```bash
sudo rm /var/log/huge-application.log
df -h /var
# Filesystem      Size  Used Avail Use% Mounted on
# /dev/sda1       9.8G  9.3G  0.1G  99% /var
```

The file is gone from every listing. `du` no longer counts it. `df` still does, because the
blocks are still allocated — the application has the file open and is, at this moment,
still writing to a file with no name.

Find the culprit with `lsof`:

```bash
sudo lsof +L1     # list open files whose link count is less than 1
# COMMAND   PID USER  FD  TYPE DEVICE SIZE/OFF NLINK NODE NAME
# java     2847 app   3w  REG    8,1 4831838208     0  524301 /var/log/huge-application.log (deleted)
```

`NLINK 0` and the `(deleted)` marker are the signature. The fix is to close the descriptor
— restart the service, or `truncate -s 0` the file *before* deleting it next time. Which is
the actual lesson: to reclaim space from a log file that is being written, truncate it
rather than removing it.

**When `df` and `du` disagree about a filesystem, `lsof +L1` is the first command to run.**

### Permissions and ownership are numbers

The inode stores owner and group as numeric IDs. The names you see are a display
convenience: `ls`, `stat`, and everything else look up `1001` in `/etc/passwd` at print
time and show `wcravens` if there is a match.

The filesystem has no idea who `wcravens` is. It stores `1001`.

This is invisible on one machine and consequential the moment storage moves between
machines. Detach the data disk from a VM where `wcravens` is UID 1001, attach it to one
where UID 1001 is `deploy` and `wcravens` is 1005, and every file on it now belongs to
`deploy`. Nothing was modified; the same number is being resolved against a different
table. The same effect turns up restoring backups onto a rebuilt host and in container
images that assume a particular UID.

If a lookup fails entirely, the tools fall back to showing the raw number:

```bash
ls -l /srv/data
# -rw-r--r-- 1 1001 1001 1024 Sep 17 15:02 notes.txt
```

A bare number in the owner column means "this ID does not exist in `/etc/passwd` on this
machine" — usually a disk from elsewhere, a deleted user, or a container mount.

The permission bits live in the inode too, in the same 16-bit mode field as the file type,
which is why `chmod` updates `ctime` and not `mtime`. The three special bits above the
familiar nine are worth naming in passing, because they interact with mount options in
Part 5:

Table: The three bits above the ordinary nine permission bits

| Bit | On a file | On a directory |
| --- | --- | --- |
| setuid (4000) | Runs with the owner's privileges, not the caller's | No effect on Linux |
| setgid (2000) | Runs with the group's privileges | New entries inherit the directory's group |
| sticky (1000) | No effect | Only the owner may delete an entry — this is `/tmp` |

### Timestamps

The three standard timestamps were listed above; the distinction that matters in practice
is `mtime` versus `ctime`, and it comes up in audits. `touch -d` can set `mtime` to any
value you like; `ctime` updates as a side effect of that very operation, and there is no
interface for setting it. A file whose `ctime` is markedly later than its `mtime` has had
its metadata or its timestamps altered.

`atime` has a performance problem that shaped the defaults. Updating the access time on
every read turns every read into a write, which is ruinous on a busy server. Linux
therefore mounts filesystems with **`relatime`** by default: `atime` is written only if it
is older than `mtime`, or older than one day. The result is good enough to tell you whether
a file has been read recently, and cheap. `noatime` disables the update entirely and is a
reasonable choice for a busy data volume, as long as nothing on it expects working access
times — classically, mail readers did.

---

## Part 5: Mounting

### One tree

Windows gives each filesystem its own namespace: `C:`, `D:`, `E:`. Linux does not. There is
exactly one directory tree, rooted at `/`, and a filesystem joins it by being attached at
some directory inside it. That directory is the **mount point**, and the act of attaching
is **mounting**.

This is why a path tells you nothing about which device it is on. `/home/wcravens/notes.md`
and `/srv/data/notes.md` may be on the same disk, on different disks, or on a server in
another building. The tree is an abstraction over however many devices happen to be
present, and the mapping between them is held in the kernel's mount table, not in the paths.

`findmnt` prints that table as the tree it is:

```bash
findmnt --real
# TARGET      SOURCE    FSTYPE OPTIONS
# /           /dev/sda1 ext4   rw,relatime,discard,errors=remount-ro
# ├─/boot/efi /dev/sda15 vfat  rw,relatime,fmask=0022,dmask=0022,codepage=437
# └─/srv/data /dev/sdb1 ext4   rw,relatime
```

`--real` hides the pseudo-filesystems; without it you also get the couple of dozen kernel
interfaces mounted under `/proc`, `/sys`, `/dev`, and `/run`. To ask the reverse question —
which filesystem holds this path — give `findmnt` a target:

```bash
findmnt -T /srv/data/reports/q3.csv
# TARGET    SOURCE    FSTYPE OPTIONS
# /srv/data /dev/sdb1 ext4   rw,relatime
```

That answers "which disk will fill up if I write here," which is a question worth asking
before writing 40 GB somewhere.

### Mounting by hand

```bash
sudo mkdir -p /srv/data
sudo mount /dev/sdb1 /srv/data
```

A mount point is an ordinary directory, created the ordinary way. Nothing marks it as
special beforehand and nothing marks it afterwards; a directory becomes a mount point by
being named in a `mount` command, and stops being one when the filesystem is unmounted.

Two behaviors surprise people, and both are worth demonstrating once deliberately rather
than discovering during an incident.

**Mounting over a non-empty directory hides its contents.** The existing files are not
deleted or altered — they are shadowed, unreachable at those paths for as long as something
is mounted on top, and they reappear intact on unmount. The practical hazard is the
opposite order: if a service writes to `/srv/data` while the data disk is *not* mounted,
the files land on the root filesystem, and mounting the disk later makes them vanish while
silently consuming root's free space. A mount point that is supposed to always have
something on it should be empty and, ideally, read-only when it does not.

**A successful `mount` prints nothing.** Verify explicitly:

```bash
mount | grep sdb1
findmnt /srv/data
df -h /srv/data
```

Mounting by UUID or label works exactly as it does by device name, and is what you should
prefer for the reasons given in Part 1:

```bash
sudo mount UUID=3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b /srv/data
sudo mount LABEL=data /srv/data
```

### Mount options

Options are given with `-o` and are properties of **this mount**, not of the filesystem.
The same filesystem can be mounted read-only in one place and read-write in another.

Table: Mount options worth knowing

| Option | Effect |
| --- | --- |
| `defaults` | `rw,suid,dev,exec,auto,nouser,async` — the ordinary case |
| `ro` / `rw` | Read-only, or read-write |
| `noexec` | Refuse to execute any binary on this filesystem |
| `nosuid` | Ignore setuid and setgid bits on this filesystem |
| `nodev` | Ignore device nodes on this filesystem |
| `noatime` / `relatime` | Skip access-time updates, or defer them |
| `nofail` | Do not fail the boot if this filesystem is missing |
| `discard` | Issue TRIM to the underlying storage as blocks are freed |
| `errors=remount-ro` | On an I/O error, remount read-only rather than continuing |
| `uid=` / `gid=` / `fmask=` | Synthesize ownership and modes — for `vfat`, which stores none |

`noexec,nosuid,nodev` together are the standard hardening set for any filesystem holding
data rather than programs: user uploads, `/tmp` on a hardened host, a removable disk of
unknown provenance. They close the path where an attacker who can write a file to your data
volume can then execute it, and they cost nothing.

An option can be changed without unmounting, using `remount`:

```bash
sudo mount -o remount,ro /srv/data      # make it read-only, in place
sudo mount -o remount,rw /srv/data      # and back
```

This is how you take a filesystem out of service for a consistent backup without stopping
anything that merely has it open for reading.

### Unmounting, and the busy target

```bash
sudo umount /srv/data
```

The command takes either the mount point or the device, and the mount point is the safer
habit — a device can in principle be mounted in more than one place.

The failure you will actually meet:

```bash
sudo umount /srv/data
# umount: /srv/data: target is busy.
```

"Busy" means some process has a file open on that filesystem, or has its working directory
inside it. The kernel will not detach a filesystem out from under a running process. Find
out who:

```bash
sudo lsof /srv/data
# COMMAND  PID USER   FD   TYPE DEVICE SIZE/OFF   NODE NAME
# bash    3312 wcravens cwd  DIR   8,17     4096 131073 /srv/data
sudo fuser -vm /srv/data
```

Nine times out of ten it is your own shell, sitting in the directory. `cd` out and try
again. Otherwise, stop the service that holds it.

There is a `-l` flag, and it deserves a warning:

```bash
sudo umount -l /srv/data      # lazy: detach from the tree now, clean up later
```

A lazy unmount removes the filesystem from the directory tree immediately while leaving it
mounted for the processes still using it. The mount point looks clear; the device is still
in use, still being written to, and still not safe to detach or reformat. It is a reasonable
tool for freeing a stuck mount point on a system you are about to reboot, and a bad habit
otherwise, because it makes the problem invisible rather than solving it.

### `/etc/fstab`

Everything so far lasts until the next reboot. `/etc/fstab` is the file that makes a mount
permanent — a table of filesystems the system should mount, and how.

```bash
cat /etc/fstab
# UUID=6f1b2c3d-4e5a-4b6c-8d9e-0a1b2c3d4e5f /          ext4  discard,errors=remount-ro  0 1
# UUID=7B77-95E7                            /boot/efi  vfat  umask=0077                 0 2
# UUID=3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b /srv/data  ext4  defaults,nofail            0 2
```

Six whitespace-separated fields per line.

Table: The six fields of an `/etc/fstab` entry

| # | Field | Holds |
| --- | --- | --- |
| 1 | Device | `UUID=`, `LABEL=`, a path, or a network share |
| 2 | Mount point | The directory it attaches to, or `none` for swap |
| 3 | Type | `ext4`, `vfat`, `xfs`, `swap`, `nfs`, or `auto` |
| 4 | Options | Comma-separated, as with `mount -o` |
| 5 | Dump | Legacy backup flag; always `0` |
| 6 | Pass | `fsck` order at boot: `1` for root, `2` for others, `0` to skip |

Field 6 is the automatic `fsck` promised in Part 3. The root filesystem is checked first,
alone, as pass 1; everything marked pass 2 is checked afterwards, in parallel where the
filesystems are on different disks. Filesystems that should never be checked at boot —
network mounts, and anything on removable media — take `0`.

Use UUIDs in field 1. A device name in `fstab` is a bet that enumeration order never
changes, and the day it does, the machine mounts the wrong filesystem on your data
directory or fails to mount anything at all. `blkid` gives you the UUID of every filesystem
on the machine:

```bash
sudo blkid
# /dev/sdb1: LABEL="data" UUID="3a9f1e2b-7c4d-4a8e-9b1f-2d3c4e5f6a7b" TYPE="ext4" ...
```

### The `fstab` mistake that costs you a server

**A bad line in `/etc/fstab` can prevent the machine from booting.** This is the single most
common self-inflicted unbootable system in this course's subject matter, and it is entirely
preventable.

The mechanism: at boot, `systemd` tries to mount everything in `fstab`. A required mount
that fails puts the boot into emergency mode, which asks for the root password at a console
you may not have on a cloud VM. A typo in a UUID, or an entry for a disk that has been
detached, is enough.

Two defenses, and you want both.

**`nofail`.** It tells systemd that the machine should carry on booting if this filesystem
is missing. Every non-essential mount in `fstab` should have it. The root filesystem
should not: a machine that boots without its root filesystem is not a useful outcome.

**Test before rebooting.** Always, in this order:

```bash
sudo findmnt --verify --verbose    # parse fstab and check it for errors
sudo umount /srv/data              # undo the manual mount
sudo mount -a                      # mount everything in fstab that is not mounted
findmnt /srv/data                  # confirm it actually came back
```

`findmnt --verify` catches malformed lines, unknown filesystem types, missing mount point
directories, and UUIDs that match nothing. `mount -a` then performs the same work the boot
will perform. If both are clean, the reboot will be too.

Run both, in that order, and do not substitute the second for the first. An entry carrying
`nofail` whose device is absent is *silently skipped* by `mount -a`, which prints nothing
and exits 0; `findmnt --verify` reports it as an error. Take `nofail` off the same entry and
`mount -a` fails loudly with exit status 32 — which is the same asymmetry seen from the
other side, and the reason the quiet command is the one that has to run first.

Rebooting to "see if it worked" without running those two commands is how afternoons become
evenings.

### `fstab` is translated into systemd units

Last week's lecture said systemd manages everything on the machine, and mounts are no
exception. `systemd-fstab-generator` runs early in boot, reads `/etc/fstab`, and generates
a `.mount` unit for every entry. `fstab` is the traditional interface; systemd units are
the implementation.

You can see the result:

```bash
systemctl list-units --type=mount
# UNIT              LOAD   ACTIVE SUB     DESCRIPTION
# -.mount           loaded active mounted Root Mount
# boot-efi.mount    loaded active mounted /boot/efi
# srv-data.mount    loaded active mounted /srv/data

systemctl status srv-data.mount
```

The unit name is the mount point with slashes turned into dashes. Two consequences follow
from this arrangement:

- **`systemctl daemon-reload` after editing `/etc/fstab`.** The generator ran at boot; the
  units systemd is holding reflect the file as it was then. `mount -a` works either way,
  because it reads the file directly, but systemd's view is stale until you reload it.
- **A failed mount is a failed unit,** and it appears in `systemctl --failed` alongside
  everything else, with its explanation in `journalctl -u srv-data.mount`. The diagnostic
  workflow you learned for services is the same workflow here.

Mount units can also be written by hand, which buys you dependency ordering and the
`automount` behavior that mounts a filesystem on first access. Neither is needed for this
course; `fstab` is the right interface for ordinary mounts, and it is what other
administrators will look for.

### Pseudo-filesystems

Several entries in `findmnt` are backed by no device at all. They are kernel interfaces
presented as filesystems, which is how "everything is a file" is actually implemented.

Table: The pseudo-filesystems on every Linux system

| Mount | Type | Contains |
| --- | --- | --- |
| `/proc` | `proc` | One directory per process, plus kernel state such as `/proc/mounts` |
| `/sys` | `sysfs` | Devices, drivers, and kernel objects — the source of `lsblk`'s data |
| `/dev` | `devtmpfs` | Device nodes, maintained by the kernel and `udev` |
| `/run` | `tmpfs` | Runtime state: PID files, sockets, the volatile journal |
| `/dev/shm` | `tmpfs` | Shared memory between processes |

`tmpfs` is worth understanding as a filesystem rather than a curiosity: it is a real
filesystem living in RAM and swap, with inodes, permissions, and a size limit, and its
contents are gone at reboot. That is why last week's note about a volatile journal matters
— `/run/log/journal` is on a `tmpfs`, so it cannot survive the reboot you most want to
investigate. It is also a fine place to put genuinely temporary scratch data that must be
fast and must not persist.

### Growing a filesystem

Cloud disks can be enlarged, and the operation has three layers, because the stack has three
layers. Enlarging the disk does not enlarge the partition, and enlarging the partition does
not enlarge the filesystem.

```bash
# 1. The device, from outside the VM
gcloud compute disks resize data-disk --size=20GB --zone=us-central1-a

# 2. The partition, inside the VM
lsblk                                  # the disk is 20G, the partition is still 10G
sudo growpart /dev/sdb 1               # note the space: device, then partition number

# 3. The filesystem
sudo resize2fs /dev/sdb1               # ext4; for xfs: sudo xfs_growfs /srv/data
df -h /srv/data
```

`growpart` comes from the `cloud-guest-utils` package and rewrites the partition entry in
place. Both it and `resize2fs` work on a **mounted, in-use filesystem** — online growth is
supported by ext4 and XFS, and nothing needs to be stopped.

Shrinking is the asymmetric case, and the asymmetry is worth remembering: ext4 can shrink,
but only while unmounted (`resize2fs` after `umount`, then shrink the partition). **XFS
cannot shrink at all, ever.** If there is a chance a volume will need to get smaller, that
fact alone may decide which filesystem you create.

### Swap is the exception to all of this

Swap space appears in `fstab` and is often given its own partition, so it looks like a
filesystem — and it is not one. Swap is a region the kernel uses as an overflow for
physical memory: it has no files, no inodes, no directories, and no mount point. It is
prepared with `mkswap` rather than `mkfs`, and activated with `swapon` rather than `mount`.

```bash
sudo mkswap /dev/sdb2
sudo swapon /dev/sdb2
swapon --show
free -h
```

The `fstab` entry uses `none` for the mount point and `sw` for the options, which is the
conventional way of saying the two fields do not apply:

```bash
# UUID=4c5d6e7f-8a9b-4c0d-9e1f-2a3b4c5d6e7f none swap sw 0 0
```

Cloud images generally ship with no swap at all, on the theory that you should size the
instance correctly instead. A **swap file** is the easy way to add some without
repartitioning, and it is mounted the same way:

```bash
sudo fallocate -l 1G /swapfile
sudo chmod 600 /swapfile          # readable by root only; it holds process memory
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Part 6: The whole stack, end to end

Every layer in one sequence, on a real VM. This is the shape of the work, and it is worth
running once from a blank disk so that the boundaries between the layers are concrete.

```bash
# --- Layer 1: the device -----------------------------------------------
gcloud compute disks create data-disk \
    --project=$PROJECT --zone=us-central1-a --size=10GB --type=pd-balanced
gcloud compute instances attach-disk $INSTANCE_NAME \
    --project=$PROJECT --zone=us-central1-a --disk=data-disk --device-name=data

# On the VM: confirm which device this is, three ways, before writing anything
lsblk
ls -l /dev/disk/by-id/google-data
sudo blkid /dev/sdb

# --- Layer 2: the partition --------------------------------------------
sudo parted -s /dev/sdb mklabel gpt
sudo parted -s -a optimal /dev/sdb mkpart primary ext4 0% 100%
sudo partprobe /dev/sdb
lsblk /dev/sdb

# --- Layer 3: the filesystem -------------------------------------------
sudo mkfs.ext4 -L data /dev/sdb1
sudo tune2fs -m 1 /dev/sdb1
sudo blkid /dev/sdb1

# --- Layer 4: the mount ------------------------------------------------
sudo mkdir -p /srv/data
sudo mount /dev/sdb1 /srv/data
df -h /srv/data

# --- Make it permanent -------------------------------------------------
UUID=$(sudo blkid -s UUID -o value /dev/sdb1)
echo "UUID=$UUID /srv/data ext4 defaults,nofail 0 2" | sudo tee -a /etc/fstab

sudo findmnt --verify --verbose
sudo umount /srv/data
sudo mount -a
findmnt /srv/data
sudo systemctl daemon-reload
```

Reading the UUID with `blkid -s UUID -o value` instead of copying it by hand is not
laziness. A mistyped UUID in `fstab` is the exact failure described in Part 5, and typing
36 hexadecimal characters correctly is not a skill worth relying on.

Tearing it down runs the same layers in reverse, and the order matters: detaching a disk
that is still mounted is how filesystems get corrupted.

```bash
sudo umount /srv/data
sudo sed -i '/srv\/data/d' /etc/fstab      # remove the entry before the disk is gone
sudo systemctl daemon-reload

gcloud compute instances detach-disk $INSTANCE_NAME \
    --project=$PROJECT --zone=us-central1-a --disk=data-disk
gcloud compute disks delete data-disk --project=$PROJECT --zone=us-central1-a
```

Removing the `fstab` line before detaching is the step that is easy to forget and expensive
to forget: an entry naming a disk that no longer exists is precisely the entry that stops
the next boot, and `nofail` is the only thing standing between that oversight and an
emergency console.

Delete the disk when you are finished with it. A detached disk is still a disk, and it is
still billed.

---

## Quick reference

Table: Commands by layer, for the disk work you will actually do

| Task | Command |
| --- | --- |
| List devices, partitions, mounts | `lsblk`, `lsblk -f` |
| Identify filesystems, types, UUIDs | `sudo blkid` |
| Confirm a cloud disk's identity | `ls -l /dev/disk/by-id/google-*` |
| Read a partition table | `sudo fdisk -l /dev/sdb`, `sudo parted /dev/sdb print` |
| Create a GPT partition | `sudo fdisk /dev/sdb` → `g n w`, or `parted -s` |
| Re-read a partition table | `sudo partprobe /dev/sdb` |
| Create a filesystem | `sudo mkfs.ext4 -L data /dev/sdb1` |
| Inspect a filesystem | `sudo dumpe2fs -h /dev/sdb1` |
| Change filesystem parameters | `sudo tune2fs -m 1 /dev/sdb1`, `sudo e2label /dev/sdb1 data` |
| Check a filesystem | `sudo umount ...` then `sudo fsck -f /dev/sdb1` |
| Mount, unmount | `sudo mount /dev/sdb1 /srv/data`, `sudo umount /srv/data` |
| Change options in place | `sudo mount -o remount,ro /srv/data` |
| Show mounts | `findmnt --real`, `findmnt -T /some/path` |
| Validate `fstab` | `sudo findmnt --verify --verbose`, then `sudo mount -a` |
| Free space and free inodes | `df -h`, `df -i` |
| Space used by files | `du -sh /srv/data/*` |
| Find what holds a mount busy | `sudo lsof /srv/data`, `sudo fuser -vm /srv/data` |
| Find deleted-but-open files | `sudo lsof +L1` |
| Grow a volume | `growpart /dev/sdb 1` then `resize2fs /dev/sdb1` |

Table: Inode and link commands, and the question each one answers

| Command | Answers |
| --- | --- |
| `ls -li` | What inode is behind each name, and how many names share it? |
| `stat FILE` | Everything in the inode, decoded |
| `ln a b` | Give this inode a second name on the same filesystem |
| `ln -s target b` | Create a file whose contents are a path |
| `readlink -f FILE` | What does this link chain finally resolve to? |
| `find . -inum N` | What other names point at this inode? |
| `find . -xdev` | Search without crossing into another filesystem |
| `df -i` | Are we out of inodes rather than out of space? |

## Common pitfalls

- **Partitioning the wrong disk.** It is instant, it is silent, and there is no undo.
  Confirm with `lsblk`, `by-id`, and `blkid` every time, including the times you are sure.
- **Trusting `sda` to stay `sda`.** Kernel names reflect enumeration order. Use UUIDs in
  `fstab` and `by-id` names when identifying hardware.
- **An `fstab` entry without `nofail`.** A missing or mistyped non-root filesystem drops the
  boot into emergency mode, at a console a cloud VM may not give you.
- **Rebooting to test `fstab`.** Run `findmnt --verify` and `mount -a` first. They test the
  same thing, and they leave you with a running machine when they fail.
- **Editing `fstab` and skipping `systemctl daemon-reload`.** `mount -a` reads the file
  directly, so it works; systemd's generated mount units do not, until you reload.
- **Writing to a mount point while nothing is mounted on it.** The data lands on the root
  filesystem and disappears under the next mount, still consuming root's free space.
- **Running `fsck` on a mounted filesystem.** Two writers, one set of structures. Unmount
  first, without exception.
- **Reading "No space left on device" as a space problem.** Check `df -i`. Inode exhaustion
  reports the same error with gigabytes free.
- **Deleting a large log file that a service still has open.** `df` will not budge. Truncate
  it instead: `sudo truncate -s 0 /var/log/big.log`.
- **`umount -l` as a first resort.** It hides a busy filesystem rather than releasing it,
  and the device stays in use.
- **Expecting permissions on `vfat`.** FAT stores no ownership or mode bits; they are
  synthesized from mount options.
- **Choosing XFS for a volume that might need to shrink.** It never can.
- **Growing a disk and stopping there.** Three layers, three steps: `disks resize`,
  `growpart`, `resize2fs`.

## Further reading

- `man 5 fstab`, `man 8 mount`, `man 8 findmnt`, `man 8 lsblk`, `man 8 blkid`
- `man 1 stat`, `man 2 stat`, `man 7 inode` — the inode structure, from the source
- `man 8 mkfs.ext4`, `man 8 tune2fs`, `man 8 dumpe2fs`, `man 8 resize2fs`, `man 8 e2fsck`
- `man 8 parted`, `man 8 fdisk`, `man 8 sgdisk`
- [The Linux Documentation Project: Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
  — what belongs in which directory, and why
- [ext4 Data Structures and Algorithms](https://www.kernel.org/doc/html/latest/filesystems/ext4/)
  — the kernel's own on-disk format documentation
- [Compute Engine: adding and formatting a persistent disk](https://cloud.google.com/compute/docs/disks/add-persistent-disk)
- [Compute Engine: resizing a persistent disk](https://cloud.google.com/compute/docs/disks/resize-persistent-disk)
