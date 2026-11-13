import { readableBlocks } from '../lib/readableText.js'
import './ReadableText.css'

function InlineText({ text }) {
  return text.split(/\*\*([^*]+)\*\*/gu).map((part, index) => (
    index % 2 ? <strong key={index}>{part}</strong> : part
  ))
}

export default function ReadableText({ text, className = '' }) {
  return (
    <div className={`readable-text ${className}`}>
      {readableBlocks(text).map((block, index) => {
        if (block.kind === 'ul' || block.kind === 'ol') {
          const List = block.kind
          return <List key={index} start={block.start}>{block.items.map((item, itemIndex) => <li key={itemIndex}><InlineText text={item} /></li>)}</List>
        }
        return <p key={index}>{block.kind === 'heading' ? <strong><InlineText text={block.text} /></strong> : <InlineText text={block.text} />}</p>
      })}
    </div>
  )
}
