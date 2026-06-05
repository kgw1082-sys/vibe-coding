declare module 'mammoth' {
  interface ConversionResult {
    value: string
    messages: unknown[]
  }
  export function extractRawText(options: { buffer: Buffer }): Promise<ConversionResult>
  export function convertToHtml(options: { buffer: Buffer }): Promise<ConversionResult>
}
