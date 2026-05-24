import Papa from 'papaparse'
import ExcelJS from 'exceljs'
import type { ProcessedData, DataRow, ColumnInfo } from '@/types/data.types'

function isNumeric(values: unknown[]): boolean {
  const nonNull = values.filter((v) => v !== null && v !== undefined && v !== '')
  if (nonNull.length === 0) return false
  return nonNull.every((v) => !isNaN(Number(v)))
}

function cleanValue(value: unknown): string | number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Number(value)
  if (!isNaN(n) && String(value).trim() !== '') return n
  return String(value)
}

function sampleValues(values: (string | number | null)[]): (string | number)[] {
  const nonNull = values.filter((v): v is string | number => v !== null)
  const unique = [...new Set(nonNull)]
  return unique.slice(0, 10)
}

function buildProcessedData(
  rows: Record<string, unknown>[],
  filename: string,
  totalRows: number,
): ProcessedData {
  if (rows.length === 0) throw new Error('El archivo no contiene datos')
  const columns = Object.keys(rows[0])

  const columnValues: Record<string, unknown[]> = {}
  for (const col of columns) {
    columnValues[col] = rows.map((r) => r[col])
  }

  const columnInfos: ColumnInfo[] = columns.map((col) => {
    const raw = columnValues[col]
    const type: ColumnInfo['type'] = isNumeric(raw) ? 'numeric' : 'categorical'
    const cleaned = raw.map(cleanValue)
    return { name: col, type, sample_values: sampleValues(cleaned) }
  })

  const numeric_columns = columnInfos.filter((c) => c.type === 'numeric').map((c) => c.name)
  const categorical_columns = columnInfos.filter((c) => c.type === 'categorical').map((c) => c.name)

  const data: DataRow[] = rows.map((row) => {
    const clean: DataRow = {}
    for (const col of columns) {
      clean[col] = cleanValue(row[col])
    }
    return clean
  })

  const preview = data.slice(0, 10)

  return {
    columns,
    numeric_columns,
    categorical_columns,
    data,
    dataset_info: {
      filename,
      rows: totalRows,
      columns: columnInfos,
      preview,
    },
  }
}

function extractCellValue(cell: ExcelJS.Cell): unknown {
  const v = cell.value
  if (v === null || v === undefined) return null
  if (v instanceof Date) return v.toISOString()
  if (typeof v === 'object') {
    if ('result' in v) return (v as ExcelJS.CellFormulaValue).result ?? null
    if ('richText' in v) return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join('')
    if ('text' in v) return (v as ExcelJS.CellHyperlinkValue).text
    if ('error' in v) return null
  }
  return v
}

async function parseXlsx(buffer: ArrayBuffer, filename: string): Promise<ProcessedData> {
  const wb = new ExcelJS.Workbook()
  await wb.xlsx.load(buffer as Buffer)
  const ws = wb.worksheets[0]
  if (!ws) throw new Error('El archivo no contiene hojas')

  const colCount = ws.columnCount
  const headers: string[] = []
  const headerRow = ws.getRow(1)
  for (let i = 1; i <= colCount; i++) {
    const val = headerRow.getCell(i).value
    headers.push(val !== null && val !== undefined ? String(val) : `col${i}`)
  }

  const rows: Record<string, unknown>[] = []
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return
    const obj: Record<string, unknown> = {}
    headers.forEach((header, i) => {
      obj[header] = extractCellValue(row.getCell(i + 1))
    })
    rows.push(obj)
  })

  return buildProcessedData(rows, filename, rows.length)
}

export async function processFile(file: File): Promise<ProcessedData> {
  const name = file.name.toLowerCase()

  if (name.endsWith('.csv')) {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          try {
            resolve(buildProcessedData(result.data, file.name, result.data.length))
          } catch (e) {
            reject(e)
          }
        },
        error: (err) => reject(new Error(err.message)),
      })
    })
  }

  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer = await file.arrayBuffer()
    return parseXlsx(buffer, file.name)
  }

  throw new Error('Formato no soportado. Usa CSV o XLSX.')
}
