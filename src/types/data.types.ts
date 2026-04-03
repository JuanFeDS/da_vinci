export interface DataRow {
  [key: string]: string | number | null
}

export interface ColumnInfo {
  name: string
  type: 'numeric' | 'categorical' | 'datetime'
  sample_values: (string | number)[]
}

export interface DatasetInfo {
  filename: string
  rows: number
  columns: ColumnInfo[]
  preview: DataRow[]
}

export interface ProcessedData {
  columns: string[]
  numeric_columns: string[]
  categorical_columns: string[]
  data: DataRow[]
  dataset_info: DatasetInfo
}
