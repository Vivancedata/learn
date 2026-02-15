function escapePdfText(text: string) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

export function createSimpleCertificatePdf(input: {
  recipientName: string
  courseTitle: string
  issuedDate: string
  verificationCode: string
  skills: string[]
}) {
  const title = 'Certificate of Completion'
  const subtitle = 'VivanceData Learning Platform'
  const lines = [
    'This certifies that',
    input.recipientName,
    'has successfully completed',
    input.courseTitle,
    `Issued on ${input.issuedDate}`,
    `Verification Code: ${input.verificationCode}`,
  ]

  const skillsLine = input.skills.length > 0 ? `Skills: ${input.skills.join(', ')}` : ''

  const textObjects: string[] = []
  textObjects.push(`BT /F1 28 Tf 150 720 Td (${escapePdfText(title)}) Tj ET`)
  textObjects.push(`BT /F1 14 Tf 200 695 Td (${escapePdfText(subtitle)}) Tj ET`)
  textObjects.push(`BT /F1 14 Tf 72 630 Td (${escapePdfText(lines[0])}) Tj ET`)
  textObjects.push(`BT /F1 22 Tf 72 600 Td (${escapePdfText(lines[1])}) Tj ET`)
  textObjects.push(`BT /F1 14 Tf 72 570 Td (${escapePdfText(lines[2])}) Tj ET`)
  textObjects.push(`BT /F1 20 Tf 72 540 Td (${escapePdfText(lines[3])}) Tj ET`)
  textObjects.push(`BT /F1 12 Tf 72 490 Td (${escapePdfText(lines[4])}) Tj ET`)
  textObjects.push(`BT /F1 12 Tf 72 470 Td (${escapePdfText(lines[5])}) Tj ET`)

  if (skillsLine) {
    textObjects.push(`BT /F1 12 Tf 72 440 Td (${escapePdfText(skillsLine)}) Tj ET`)
  }

  const border = [
    '0.5 w',
    '0 0 0 RG',
    '36 36 540 720 re',
    'S',
    '2 w',
    '30 30 552 732 re',
    'S',
  ].join('\n')

  const contentStream = `${border}\n${textObjects.join('\n')}\n`

  const objects: string[] = []
  objects.push('1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj')
  objects.push('2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj')
  objects.push('3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj')
  objects.push(`4 0 obj << /Length ${contentStream.length} >> stream\n${contentStream}\nendstream endobj`)
  objects.push('5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj')

  let offset = 0
  const xref: number[] = []
  const body = objects
    .map((obj) => {
      xref.push(offset)
      offset += Buffer.byteLength(obj + '\n')
      return obj
    })
    .join('\n')

  const xrefStart = offset
  const xrefTable = ['xref', `0 ${objects.length + 1}`, '0000000000 65535 f ']
  xref.forEach((off) => {
    xrefTable.push(`${off.toString().padStart(10, '0')} 00000 n `)
  })

  const trailer = [
    'trailer',
    `<< /Size ${objects.length + 1} /Root 1 0 R >>`,
    'startxref',
    `${xrefStart}`,
    '%%EOF',
  ].join('\n')

  const pdf = `%PDF-1.4\n${body}\n${xrefTable.join('\n')}\n${trailer}`
  return Buffer.from(pdf)
}
