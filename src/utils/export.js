// ============================================================
// Export Utilities - TXT and DOCX export
// ============================================================
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel } from 'docx';

/**
 * Export content as plain text
 * @param {string} content - HTML content from Quill
 * @param {string} title
 */
export function exportTxt(content, title = 'cyber-zen-note') {
  // Strip HTML tags and decode entities
  const temp = document.createElement('div');
  temp.innerHTML = content;
  const text = temp.textContent || temp.innerText || '';

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const filename = sanitizeFilename(title) + '.txt';
  saveAs(blob, filename);
  return filename;
}

/**
 * Export content as Word document (.docx)
 * Preserves basic formatting
 * @param {string} htmlContent
 * @param {string} title
 */
export async function exportDocx(htmlContent, title = 'cyber-zen-note') {
  const temp = document.createElement('div');
  temp.innerHTML = htmlContent;

  const paragraphs = [];

  // Walk child nodes and create appropriate paragraphs
  for (const node of temp.childNodes) {
    const para = htmlNodeToParagraph(node);
    if (para) paragraphs.push(para);
  }

  // If no paragraphs parsed, create one with the text content
  if (paragraphs.length === 0) {
    const text = temp.textContent || '';
    paragraphs.push(
      new Paragraph({
        children: [new TextRun({ text, size: 24, font: 'Inter' })]
      })
    );
  }

  const doc = new Document({
    title: title,
    description: 'Created with Cyber Zen Notes',
    styles: {
      default: {
        document: {
          run: {
            font: 'Inter',
            size: 24,
            color: '1a1a2e'
          }
        }
      }
    },
    sections: [{
      properties: {},
      children: paragraphs
    }]
  });

  const blob = await Packer.toBlob(doc);
  const filename = sanitizeFilename(title) + '.docx';
  saveAs(blob, filename);
  return filename;
}

/**
 * Convert an HTML node to a docx Paragraph
 */
function htmlNodeToParagraph(node) {
  const tagName = node.tagName ? node.tagName.toLowerCase() : '';
  const children = [];

  function processInline(nodes) {
    const runs = [];
    for (const child of nodes) {
      if (child.nodeType === 3) { // Text node
        runs.push(new TextRun({
          text: child.textContent,
          size: 24,
          font: 'Inter'
        }));
      } else if (child.nodeType === 1) {
        const tag = child.tagName.toLowerCase();
        const text = child.textContent;
        const runOptions = { text, size: 24, font: 'Inter' };
        if (tag === 'strong' || tag === 'b') runOptions.bold = true;
        if (tag === 'em' || tag === 'i') runOptions.italics = true;
        if (tag === 'u') runOptions.underline = { type: 'single' };
        if (tag === 'span') {
          const style = child.getAttribute('style') || '';
          if (style.includes('font-family')) {
            const match = style.match(/font-family:\s*([^;]+)/);
            if (match) runOptions.font = match[1].trim();
          }
        }
        if (tag === 'br') {
          runs.push(new TextRun({ break: 1, text: '', size: 24 }));
        } else {
          runs.push(new TextRun(runOptions));
        }
      }
    }
    return runs;
  }

  // Determine alignment
  let alignment = AlignmentType.LEFT;
  const alignAttr = node.getAttribute ? node.getAttribute('class') || '' : '';
  if (alignAttr.includes('align-center')) alignment = AlignmentType.CENTER;
  else if (alignAttr.includes('align-right')) alignment = AlignmentType.RIGHT;

  if (tagName === 'h1' || tagName === 'h2' || tagName === 'h3') {
    const headingMap = { h1: HeadingLevel.HEADING_1, h2: HeadingLevel.HEADING_2, h3: HeadingLevel.HEADING_3 };
    const sizeMap = { h1: 32, h2: 28, h3: 24 };
    return new Paragraph({
      heading: headingMap[tagName],
      alignment,
      children: [new TextRun({
        text: node.textContent,
        size: sizeMap[tagName],
        font: 'Inter',
        bold: true
      })]
    });
  }

  if (tagName === 'p' || tagName === 'div' || node.nodeType === 3) {
    const inlineRuns = processInline(node.childNodes || [node]);
    if (inlineRuns.length === 0) {
      inlineRuns.push(new TextRun({ text: node.textContent || '', size: 24 }));
    }
    return new Paragraph({
      alignment,
      spacing: { after: 200 },
      children: inlineRuns
    });
  }

  if (tagName === 'ol' || tagName === 'ul') {
    const items = [];
    for (const li of node.children || []) {
      const prefix = tagName === 'ol' ? '1. ' : '• ';
      items.push(new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ text: prefix, size: 24, font: 'Inter' }),
          ...processInline(li.childNodes || [])
        ]
      }));
    }
    // Return only first item (multiple paragraphs need to be handled separately)
    return items.length > 0 ? items[0] : null;
  }

  return null;
}

/**
 * Sanitize string for use as filename
 */
function sanitizeFilename(name) {
  return name
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 100) || 'cyber-zen-note';
}
