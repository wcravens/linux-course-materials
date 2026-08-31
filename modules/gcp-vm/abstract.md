---
title: Spinning Up a Linux VM in Google Cloud
---

Learning Linux takes a Linux machine you are free to break, and renting one
from a cloud provider is the cheapest way to get one. This module walks through
building a virtual machine in Google Cloud from nothing: what a project is and
why every command needs to know which one is active, what the `gcloud` command
line client is and why Cloud Shell means you never have to install it, and how
to create a small Debian instance with one command whose every option is
explained rather than pasted. It then covers connecting over SSH, including
what Google Cloud does with your keys on your behalf, and a short tour of the
running machine to confirm what you landed on.

You will need a Google account and a browser; nothing is installed on your own
computer. The instance is deliberately tiny and falls within Google's free
tier allowances, but those terms change and anything beyond them is billed.

Delete your instance when you are finished. A running virtual machine costs
money for every second it runs, and even a stopped one keeps billing for its
disk. The tutorial's section on stopping and deleting shows how, and it is the
part you must not skip.
