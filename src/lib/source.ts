import { execSync } from './utils.ts'

interface CloneOpts {
	source: string
	destination: string
	branch?: string
	dryRun?: boolean
}

abstract class Base {
	constructor(cwd: string) {
		this.cwd = cwd || Deno.cwd()
	}
	cwd: string
	abstract executable: string
	abstract ref(): string
	abstract clone(opts: CloneOpts): string
	abstract postClone(): void
	abstract sync(): void
	abstract clean(): void

	safeRef(): string {
		return this.ref().replace(/\/\//g, '/').replace(/\//g, '-')
	}
}

export class Perforce extends Base {
	executable: string = 'p4'
	ref(): string {
		const stream = execSync(this.executable, ['p4', '-F', '"%Stream%"', '-ztag', 'client', '-o'], {
			cwd: this.cwd,
			quiet: false,
		}).output.trim()
		const change = execSync(this.executable, ['-F', '%change%', 'changes', '-m1'], { cwd: this.cwd, quiet: false })
			.output.trim().replace('Change ', '')
		const parts: string[] = []
		if (stream) {
			parts.push(stream)
		}
		if (change) {
			parts.push(change)
		}
		return parts.join('/')
	}

	safeRef(): string {
		return this.ref().split('//').filter(Boolean).join('-').replace(/\//g, '-')
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
		return this.sync()
	}
	sync(): void {
		execSync(this.executable, ['sync'], { cwd: this.cwd, quiet: false })
	}
	clean(): void {
		execSync(this.executable, ['clean'], { cwd: this.cwd, quiet: false })
	}
}

export class Git extends Base {
	executable: string = 'git'
	private branch(): string {
		return execSync(this.executable, ['branch', '--show-current'], { cwd: this.cwd, quiet: false }).output.trim()
	}
	ref(): string {
		const branch = this.branch()
		const commit = execSync(this.executable, ['rev-parse', 'HEAD'], { cwd: this.cwd, quiet: false }).output.trim()
		const parts: string[] = []
		if (branch) {
			parts.push(branch)
		}
		if (commit) {
			parts.push(commit)
		}
		return parts.join('/')
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
