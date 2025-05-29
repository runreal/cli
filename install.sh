#!/bin/sh
# Copyright 2019-2025 the Deno authors. All rights reserved. MIT license.
# Copyright 2025 runreal. All rights reserved. MIT license.
# Adopted from https://github.com/denoland/deno_install

set -e

if [ "$OS" = "Windows_NT" ]; then
	target="win-x64.exe"
else
	case $(uname -sm) in
	"Darwin arm64") target="macos-arm" ;;
	"Linux x86_64") target="linux-x64" ;;
	*) target="unknown" ;;
	esac
fi

if [ "$target" = "unknown" ]; then
	echo "Note: runreal is not supported on this platform"
	exit 0
fi

print_help_and_exit() {
	echo "Setup script for installing runreal

Options:
  -y, --yes
    Skip interactive prompts and accept defaults
  --no-modify-path
    Don't add runreal to the PATH environment variable
  -h, --help
    Print help
"
	echo "Note: runreal was not installed"
	exit 0
}

get_latest_version() {
    curl --ssl-revoke-best-effort -s https://api.github.com/repos/runreal/cli/releases/latest | awk -F'"' '/"tag_name":/{print substr($4,1)}'
}

# Initialize variables
should_run_shell_setup=false
no_modify_path=false

# Simple arg parsing - look for help flag, otherwise
# ignore args starting with '-' and take the first
# positional arg as the deno version to install
for arg in "$@"; do
	case "$arg" in
	"-h")
		print_help_and_exit
		;;
	"--help")
		print_help_and_exit
		;;
	"-y")
		should_run_shell_setup=true
		;;
	"--yes")
		should_run_shell_setup=true
		;;
	"--no-modify-path")
		no_modify_path=true
		;;
	"-"*) ;;
	*)
		if [ -z "$runreal_version" ]; then
			runreal_version="$arg"
		fi
		;;
	esac
done

if [ -z "$runreal_version" ]; then
	runreal_version=$(get_latest_version)
fi

echo "Installing runreal-${runreal_version} for ${target}"

runreal_uri="https://github.com/runreal/cli/releases/download/${runreal_version}/runreal-${target}"
runreal_install="${RUNREAL_INSTALL:-$HOME/.runreal}"
bin_dir="$runreal_install/bin"
exe="$bin_dir/runreal"

if [ ! -d "$bin_dir" ]; then
	mkdir -p "$bin_dir"
fi

curl --fail --location --progress-bar --output "$exe" "$runreal_uri"
chmod +x "$exe"

echo "runreal was installed successfully to $exe"

run_shell_setup() {
	local rc_files=""
	local current_shell=""
	
	# Try to detect the current shell more reliably
	if [ -n "$SHELL" ]; then
		current_shell=$(basename "$SHELL")
	elif [ -n "$ZSH_VERSION" ]; then
		current_shell="zsh"
	elif [ -n "$BASH_VERSION" ]; then
		current_shell="bash"
	elif [ -n "$KSH_VERSION" ]; then
		current_shell="ksh"
	elif [ -n "$FISH_VERSION" ]; then
		current_shell="fish"
	else
		current_shell="sh"
	fi
	
	# Determine which rc files to modify based on shell
	case "$current_shell" in
		zsh)
			rc_files="$HOME/.zshrc"
			;;
		bash)
			rc_files="$HOME/.bashrc"
			# Add .bash_profile for login shells on macOS
			if [ "$(uname -s)" = "Darwin" ]; then
				rc_files="$rc_files $HOME/.bash_profile"
			fi
			;;
		fish)
			# Fish has a different way of setting PATH
			mkdir -p "$HOME/.config/fish/conf.d"
			echo "set -gx RUNREAL_INSTALL \"$runreal_install\"" > "$HOME/.config/fish/conf.d/runreal.fish"
			echo "set -gx PATH \$RUNREAL_INSTALL/bin \$PATH" >> "$HOME/.config/fish/conf.d/runreal.fish"
			echo "Added runreal to PATH in fish configuration"
			return
			;;
		*)
			# Default to .profile for other shells
			rc_files="$HOME/.profile"
			;;
	esac
	
	# Add setup line to each rc file
	for rc_file in $rc_files; do
		if [ ! -f "$rc_file" ]; then
			touch "$rc_file"
		fi
		
		if ! grep -q "$runreal_install/bin" "$rc_file"; then
			echo "" >> "$rc_file"
			echo "# runreal setup" >> "$rc_file"
			echo "export RUNREAL_INSTALL=\"$runreal_install\"" >> "$rc_file"
			echo "export PATH=\"\$RUNREAL_INSTALL/bin:\$PATH\"" >> "$rc_file"
			echo "Added runreal to PATH in $rc_file"
		else
			echo "runreal already in PATH in $rc_file"
		fi
	done

	echo "Restart your shell or run 'source $rc_file' to use runreal"
}

# Add runreal to PATH for non-Windows if needed
if [ "$OS" != "Windows_NT" ] && [ "$no_modify_path" = false ]; then
    # If not automatic setup, but interactive is possible, ask user
    if [ "$should_run_shell_setup" = false ] && [ -t 0 ]; then
        echo ""
        echo "Do you want to add runreal to your PATH? [y/N]"
        read -r answer
        if [ "$answer" = "y" ] || [ "$answer" = "Y" ]; then
            should_run_shell_setup=true
        fi
    fi
    
    if [ "$should_run_shell_setup" = true ]; then
        run_shell_setup
    else
        echo ""
        echo "To manually add runreal to your path:"
        echo "  export RUNREAL_INSTALL=\"$runreal_install\""
        echo "  export PATH=\"\$RUNREAL_INSTALL/bin:\$PATH\""
        echo ""
        echo "To do this automatically in the future, run with -y or --yes"
    fi
fi

if command -v runreal >/dev/null; then
	echo "Run 'runreal --help' to get started"
else
	echo "Run '$exe --help' to get started"
fi
echo
