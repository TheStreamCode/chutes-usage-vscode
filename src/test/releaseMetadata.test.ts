import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type PackageMetadata = {
  version: string
}

type LockfileMetadata = PackageMetadata & {
  packages: Record<string, PackageMetadata>
}

const root = process.cwd()

test('keeps release metadata versions synchronized', () => {
  const packageJson = readJson<PackageMetadata>('package.json')
  const packageLock = readJson<LockfileMetadata>('package-lock.json')
  const citation = readFileSync(join(root, 'CITATION.cff'), 'utf8')
  const citationVersion = citation.match(/^version:\s*["']?([^"'\r\n]+)["']?\s*$/m)?.[1]?.trim()

  assert.equal(packageLock.version, packageJson.version)
  assert.equal(packageLock.packages['']?.version, packageJson.version)
  assert.equal(citationVersion, packageJson.version)
})

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(join(root, path), 'utf8')) as T
}
