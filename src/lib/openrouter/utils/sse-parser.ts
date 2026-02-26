/**
 * Server-Sent Events (SSE) Parser for OpenRouter streaming responses
 * 
 * Handles the SSE format used by OpenRouter API with proper error handling
 * and support for comment lines that OpenRouter sends to prevent timeouts.
 */

export interface SSEEvent {
  id?: string
  event?: string
  data: string
  retry?: number
}

export class SSEParser {
  private reader: ReadableStreamDefaultReader<Uint8Array>
  private decoder: TextDecoder
  private buffer: string = ''

  constructor(stream: ReadableStream<Uint8Array>) {
    this.reader = stream.getReader()
    this.decoder = new TextDecoder()
  }

  async *[Symbol.asyncIterator](): AsyncIterator<SSEEvent> {
    try {
      while (true) {
        const { done, value } = await this.reader.read()
        
        if (done) {
          // Process any remaining data in buffer
          if (this.buffer.trim()) {
            const event = this.parseEvent(this.buffer.trim())
            if (event) yield event
          }
          break
        }

        // Decode and add to buffer
        this.buffer += this.decoder.decode(value, { stream: true })

        // Process complete events
        let eventEnd: number
        while ((eventEnd = this.buffer.indexOf('\n\n')) !== -1) {
          const eventData = this.buffer.slice(0, eventEnd)
          this.buffer = this.buffer.slice(eventEnd + 2)

          const event = this.parseEvent(eventData)
          if (event) {
            yield event
          }
        }
      }
    } finally {
      this.reader.releaseLock()
    }
  }

  private parseEvent(eventData: string): SSEEvent | null {
    const lines = eventData.split('\n')
    const event: Partial<SSEEvent> = {}
    let dataLines: string[] = []

    for (const line of lines) {
      // Skip empty lines
      if (!line.trim()) continue

      // Handle comment lines (OpenRouter sends these to prevent timeouts)
      if (line.startsWith(':')) {
        // Comment lines like ": OPENROUTER PROCESSING" are ignored per SSE spec
        continue
      }

      const colonIndex = line.indexOf(':')
      if (colonIndex === -1) {
        // Line without colon is treated as field name with empty value
        continue
      }

      const field = line.slice(0, colonIndex).trim()
      let value = line.slice(colonIndex + 1).trim()

      // Remove leading space from value if present (per SSE spec)
      if (value.startsWith(' ')) {
        value = value.slice(1)
      }

      switch (field) {
        case 'id':
          event.id = value
          break
        case 'event':
          event.event = value
          break
        case 'data':
          dataLines.push(value)
          break
        case 'retry':
          const retryValue = parseInt(value, 10)
          if (!isNaN(retryValue)) {
            event.retry = retryValue
          }
          break
      }
    }

    // Join data lines with newlines
    if (dataLines.length > 0) {
      event.data = dataLines.join('\n')
      return event as SSEEvent
    }

    return null
  }

  /**
   * Cancel the SSE stream
   */
  cancel(): void {
    this.reader.cancel()
  }
}