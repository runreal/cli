import * as path from 'node:path'
import * as fs from 'node:fs'
import { execSync } from './utils.ts'
import type { RunrealConfig } from '../lib/types.ts'

interface CloneOpts {
	source: string
	destination: string
	branch?: string
	dryRun?: boolean
}

abstract class Base {
	constructor(cwd: string) {
		this.cwd = cwd
	}
	cwd: string
	abstract executable: string
	abstract ref(): string
	abstract clone(opts: CloneOpts): string
	abstract postClone(): void
	abstract sync(): void
	abstract clean(): void

	safeRef(): string {
		return this.ref().replace(/\/\//g, '/').replace(/\//g, '-').toLowerCase()
	}

	/**
	 * Check if the current directory is a valid repository
	 * @returns true if the repository is valid, false otherwise
	 */
	abstract isValidRepo(): boolean

	/**
	 * Execute a command safely, returning empty string on failure
	 * @param args Command arguments
	 * @param options Execution options
	 * @returns Command output or empty string on failure
	 */
	protected safeExec(args: string[], options: { quiet?: boolean } = {}): string {
		try {
			return execSync(this.executable, args, {
				cwd: this.cwd,
				quiet: options.quiet ?? true,
			}).output.trim()
		} catch {
			return ''
		}
	}
}

export class Perforce extends Base {
	executable = 'p4'
	clientName: string

	constructor(cwd: string) {
		super(cwd)
		this.clientName = this.getClientName()
	}

	isValidRepo(): boolean {
		try {
			const stat = fs.statSync(this.cwd)
			if (!stat.isDirectory()) {
				return false
			}
			const result = execSync(this.executable, ['info'], { cwd: this.cwd, quiet: true })
			if (result.code !== 0) {
				return false
			}
			return true
		} catch {
			return false
		}
	}

	getClientName(): string {
		return this.safeExec(['-F', '%client%', 'info'])
	}

	stream(): string {
		if (!this.isValidRepo()) return ''
		return this.safeExec(['-F', '%Stream%', '-ztag', 'client', '-o'])
	}

	changelist(): string {
		if (!this.isValidRepo()) return ''
		const result = this.safeExec([
			'-F',
			'%change%',
			'changes',
			'-m1',
			// This is required to get the latest CL on the current client and not the remote server
			`@${this.clientName}`,
		])
		return result.replace('Change ', '')
	}

	ref(): string {
		if (!this.isValidRepo()) return ''
		const parts: string[] = []
		const stream = this.stream()
		const change = this.changelist()
		if (stream) {
			parts.push(stream)
		}
		if (change) {
			parts.push(change)
		}
		return parts.join('/')
	}

	override safeRef(): string {
		if (!this.isValidRepo()) return ''
		return this.changelist()
	}

	data(): RunrealConfig['metadata']['perforce'] {
		if (!this.isValidRepo()) {
			return {
				ref: '',
				changelist: '',
				stream: '',
			}
		}
		return {
			ref: this.ref(),
			changelist: this.changelist(),
			stream: this.stream(),
		}
	}

	safeFullRef(): string {
		if (!this.isValidRepo()) return ''
		return this.ref().split('//').filter(Boolean).join('-').replace(/\//g, '-').toLowerCase()
	}

	clone({
		source,
		destination,
		dryRun = false,
	}: {
		source: string
		destination: string
		branch?: string
		dryRun?: boolean
	}): string {
		execSync(this.executable, ['clone', '-f', source, '-d', destination], { cwd: this.cwd, quiet: false, dryRun })
			.output.trim()
		return destination
	}

	postClone(): void {
		this.sync()
		return
	}

	sync(): void {
		execSync(this.executable, ['sync'], { cwd: this.cwd, quiet: false })
	}

	clean(): void {
		execSync(this.executable, ['clean'], { cwd: this.cwd, quiet: false })
	}
}

export class Git extends Base {
	executable = 'git'

	isValidRepo(): boolean {
		try {
			const stat = fs.statSync(this.cwd)
			if (!stat.isDirectory()) {
				return false
			}
			const result = execSync(this.executable, ['rev-parse', '--git-dir'], { cwd: this.cwd, quiet: true })
			if (result.code !== 0) {
				return false
			}
			return true
		} catch {
			return false
		}
	}

	branch(): string {
		if (!this.isValidRepo()) return ''
		// On Buildkite, use the BUILDKITE_BRANCH env var as we may be in a detached HEAD state
		if (process.env['BUILDKITE_BRANCH']) {
			return process.env['BUILDKITE_BRANCH'] || ''
		}
		return this.safeExec(['branch', '--show-current'])
	}

	branchSafe(): string {
		const branch = this.branch()
		return branch.replace(/[^a-z0-9]/gi, '-')
	}

	commit(): string {
		if (!this.isValidRepo()) return ''
		return this.safeExec(['rev-parse', 'HEAD'])
	}

	commitShort(): string {
		if (!this.isValidRepo()) return ''
		return this.safeExec(['rev-parse', '--short', 'HEAD'])
	}

	ref(): string {
		if (!this.isValidRepo()) return ''
		const branch = this.branchSafe()
		const commit = this.commitShort()
		const parts: string[] = []
		if (branch) {
			parts.push(branch)
		}
		if (commit) {
			parts.push(commit)
		}
		return parts.join('/')
	}

	data(): RunrealConfig['metadata']['git'] {
		if (!this.isValidRepo()) {
			return {
				ref: '',
				branch: '',
				branchSafe: '',
				commit: '',
				commitShort: '',
			}
		}
		return {
			ref: this.ref(),
			branch: this.branch(),
			branchSafe: this.branchSafe(),
			commit: this.commit(),
			commitShort: this.commitShort(),
		}
	}

	clone(opts: CloneOpts): string {
		const { source, destination, branch, dryRun } = opts
		const cmd = branch ? ['clone', '-b', branch, source, destination] : ['clone', source, destination]
		execSync(this.executable, cmd, { cwd: this.cwd, quiet: false, dryRun }).output.trim()
		return destination
	}

	postClone(): void {
	}

	sync(): void {
		execSync(this.executable, ['checkout', this.branch()], { cwd: this.cwd, quiet: false })
		execSync(this.executable, ['fetch'], { cwd: this.cwd, quiet: false })
	}

	clean(): void {
		execSync(this.executable, ['clean', '-fd'], { cwd: this.cwd, quiet: false })
	}
}

export function Source(cwd: string, repoType: string): Base {
	if (repoType === 'perforce') {
		return new Perforce(cwd)
	}
	if (repoType === 'git') {
		return new Git(cwd)
	}
	throw new Error(`Unknown repoType: ${repoType}`)
}

/**
 * Detect the repository type based on directory structure
 * @param projectPath The path to the project
 * @returns The detected repository type or undefined if none detected
 */
export function detectRepoType(projectPath: string): 'git' | 'perforce' | undefined {
	try {
		const gitDir = path.join(projectPath, '.git')
		if (fs.statSync(gitDir).isDirectory()) {
			return 'git'
		}
	} catch { /* pass */ }
	try {
		// Simple check for Perforce - look for .p4config or P4CONFIG markers
		const p4configPath = path.join(projectPath, '.p4config')
		if (fs.statSync(p4configPath).isFile()) {
			return 'perforce'
		}
	} catch { /* pass */ }
	return undefined
}
