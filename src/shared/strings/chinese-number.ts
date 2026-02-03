const DIGITS: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  两: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
}

const UNITS: Record<string, number> = {
  十: 10,
  百: 100,
  千: 1000,
  万: 10000,
  亿: 100000000,
}

export function parseChineseNumber(input: string): number | null {
  const text = input.trim()
  if (!text) return null

  // Pure digits
  if (/^\d+$/.test(text)) {
    const n = Number(text)
    return Number.isFinite(n) ? n : null
  }

  let total = 0
  let section = 0
  let number = 0

  for (const char of text) {
    const digit = DIGITS[char]
    if (digit !== undefined) {
      number = digit
      continue
    }
    const unit = UNITS[char]
    if (unit === undefined) {
      return null
    }

    if (unit < 10000) {
      const unitNumber = number === 0 ? 1 : number
      section += unitNumber * unit
      number = 0
      continue
    }

    section += number
    total += section * unit
    section = 0
    number = 0
  }

  return total + section + number
}

