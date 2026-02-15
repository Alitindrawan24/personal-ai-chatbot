/**
 * Semantic chunking by paragraphs with size limits
 * @param {string} text - Text to chunk
 * @param {number} maxChunkSize - Maximum chunk size
 * @returns {string[]} Array of text chunks
 */
export function semanticChunk(text, maxChunkSize) {
  const paragraphs = text.split(/\n\n+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const para of paragraphs) {
    if (currentChunk.length + para.length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + para;
    }
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks;
}
