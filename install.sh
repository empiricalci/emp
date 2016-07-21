#!/bin/bash

# Download
DEST=/usr/local/bin/emp
VERSION=$(curl -s https://api.github.com/repos/empiricalci/emp/tags | grep -Eo '"name":.*?[^\\]",'  | head -n 1 | sed 's/[," ]//g' | cut -d ':' -f 2)
curl -sSL https://raw.githubusercontent.com/empiricalci/emp/$VERSION/bin/run.sh -o $DEST
# Make executable
if [ "$?" = "0" ] && [ -f $DEST ]; then
  chmod +x $DEST
  echo "Installed emp $VERSION to $DEST"
else
  echo "Download failed. Run with sudo."
fi
