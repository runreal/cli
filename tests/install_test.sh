#!/bin/sh

set -e

# Test that we can install the latest version at the default location.
rm -f ~/.runreal/bin/runreal
unset RUNREAL_INSTALL
sh ./install.sh
~/.runreal/bin/runreal --version

# Test that we can install a specific version at a custom location.
rm -rf ~/runreal-1.5.0
export RUNREAL_INSTALL="$HOME/runreal-1.5.0"
./install.sh v1.5.0
~/runreal-1.5.0/bin/runreal --version | grep 1.5.0

# Test that we can install at a relative custom location.
export RUNREAL_INSTALL="."
./install.sh v1.5.0
bin/runreal --version | grep 1.5.0
