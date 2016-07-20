#!/bin/bash

set -e

# Download
DEST=/usr/local/bin/emp
VERSION=$(curl -s https://api.github.com/repos/empiricalci/emp/tags | grep -Eo '"name":.*?[^\\]",'  | head -n 1 | sed 's/[," ]//g' | cut -d ':' -f 2)
curl -sL https://raw.githubusercontent.com/empiricalci/emp/$VERSION/bin/run.sh -o $DEST

# Make executable
chmod +x $DEST
