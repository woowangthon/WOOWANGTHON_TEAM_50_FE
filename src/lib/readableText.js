// 원래 줄바꿈과 목록을 살리고, 긴 한 문단 답변은 두 문장씩 나눕니다.
export function readableBlocks(text) {
  const blocks = []
  for (const line of String(text ?? '').replace(/\r\n?/g, '\n').split('\n')) {
    const content = line.trim()
    if (!content) continue
    const item = content.match(/^(?:([-*•])\s+|\d+[.)]\s+)(.+)$/u)
    if (item) {
      const kind = item[1] ? 'ul' : 'ol'
      const previous = blocks.at(-1)
      if (previous?.kind === kind) previous.items.push(item[2])
      else blocks.push({ kind, items: [item[2]], start: kind === 'ol' ? Number.parseInt(content, 10) : undefined })
      continue
    }
    if (/^#{1,6}\s+/u.test(content)) {
      blocks.push({ kind: 'heading', text: content.replace(/^#{1,6}\s+/u, '') })
      continue
    }
    const sentences = content.split(/(?<=[.!?。！？])\s+/u)
    for (let index = 0; index < sentences.length; index += 2) {
      blocks.push({ kind: 'paragraph', text: sentences.slice(index, index + 2).join(' ') })
    }
  }
  return blocks
}
