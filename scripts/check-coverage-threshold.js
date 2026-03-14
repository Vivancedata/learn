#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

const [, , summaryPathArg, minArg = '85', suite = 'test suite', includeFilter] = process.argv

if (!summaryPathArg) {
  console.error('Usage: node scripts/check-coverage-threshold.js <coverage-summary.json> [minPercent] [suite] [includeFilter]')
  process.exit(1)
}

const summaryPath = path.resolve(process.cwd(), summaryPathArg)
const minPercent = Number(minArg)

if (!Number.isFinite(minPercent)) {
  console.error(`Invalid minimum percent: ${minArg}`)
  process.exit(1)
}

if (!fs.existsSync(summaryPath)) {
  console.error(`Coverage summary not found: ${summaryPath}`)
  process.exit(1)
}

const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
const totalFromSummary = summary?.total || {}
let total = totalFromSummary
const requiredMetrics = ['statements', 'branches', 'functions', 'lines']

if (includeFilter) {
  const fileEntries = Object.entries(summary).filter(([file]) => (
    file !== 'total' && file.includes(includeFilter)
  ))

  if (fileEntries.length === 0) {
    console.error(`[coverage:${suite}] no files matched include filter: ${includeFilter}`)
    process.exit(1)
  }

  total = requiredMetrics.reduce((acc, metric) => {
    acc[metric] = { total: 0, covered: 0, skipped: 0, pct: 0 }
    return acc
  }, {})

  for (const [, metrics] of fileEntries) {
    for (const metric of requiredMetrics) {
      total[metric].total += metrics?.[metric]?.total || 0
      total[metric].covered += metrics?.[metric]?.covered || 0
      total[metric].skipped += metrics?.[metric]?.skipped || 0
    }
  }

  for (const metric of requiredMetrics) {
    const metricTotal = total[metric].total
    total[metric].pct = metricTotal > 0
      ? (total[metric].covered / metricTotal) * 100
      : 0
  }
}
const failures = []
for (const metric of requiredMetrics) {
  const pct = total?.[metric]?.pct
  if (typeof pct !== 'number') {
    failures.push(`${metric}: missing`)
    continue
  }
  if (pct < minPercent) {
    failures.push(`${metric}: ${pct}% < ${minPercent}%`)
  }
}

const branchPct = typeof total?.branches?.pct === 'number' ? `${total.branches.pct}%` : 'n/a'
console.log(
  `[coverage:${suite}] statements=${total?.statements?.pct ?? 'n/a'}% functions=${total?.functions?.pct ?? 'n/a'}% lines=${total?.lines?.pct ?? 'n/a'}% branches=${branchPct}`
)

if (failures.length > 0) {
  console.error(`[coverage:${suite}] threshold check failed: ${failures.join(', ')}`)
  process.exit(1)
}

console.log(`[coverage:${suite}] threshold check passed (>= ${minPercent}% for statements/branches/functions/lines)`)
