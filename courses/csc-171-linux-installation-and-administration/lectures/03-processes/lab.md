# Lab: Set Up an nginx Web Server and `mdbook`

## Overview

## Part 1: Setting up nginx and opening the firewall for port 80

Steps 1-6 from [Google Cloud Compute Engine - set up an nginx web server](https://codelabs.developers.google.com/codelabs/cloud-compute-engine#0)
will walk you through setting up the nginx web server. You should not have to set up a project or
VM, as we did this in class, but there are instructions if you need them.

At this point you should be able to use `curl` or a web browser to prove that your server is
working.

## Part 2: Setting up `mdbook` and bootstrapping your notebook

[**`mdbook`**](https://rust-lang.github.io/mdBook/) is a command line tool to create books with Markdown. It is ideal for creating product or API documentation, tutorials, course materials, or anything that requires a clean, easily navigable and customizable presentation.

*For Markdown support, see:*
- [The Markdown Guide](https://www.markdownguide.org/)
- [The Markdown Tutorial](https://www.markdowntutorial.com/)


1. Install the `mdbook` tool.

```sh
sudo su -       # Switch to root user
apt-get update  # Update local apt database
apt-get install -y mdbook  # Install mdbook tool
```

2. Initialize the `mdbook` source material.

```sh
mkdir /var/www/html/csc171
cd /var/www/html/csc171
mdbook init --title "CSC171 Learning Journal"
# Answer Y to gitignore question
```

The `mdbook init` command has provided a minimal file structure for you to build a book.

The `src` directory holds the content for the book in `markdown` format.

- `./src/SUMMARY.md`: This is the list of left sidebar items.
- `./src/chapter_1.md`: A chapter file for the book.
- `./book.toml`: List of data that configures the book settings.
- `./book`: Directory that holds the rendered html output (the website).
- `./.gitignore`: A list of files for the git repository manager to ignore. It ignores the `book`
directory because this is where the final build of the book is kept, and it's traditional to leave
build artifacts out of a source repository.

3. Build the book.

```
mdbook build
ls book
```

With the `ls book` command you will see all of the new html/css/js content that `mdbook`
generated.

You should now be able to see your website at `http://IP-ADDRESS/csc171/book/`.

Here is a screenshot of mine after I made some small changes to the contents. You should be able
to do something similar for yourself.

![mdbook website screenshot](/mdbook-screenshot.png)
