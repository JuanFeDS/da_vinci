import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileSpreadsheet, X, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/utils/cn'
import { processFile } from '@/utils/fileProcessor'
import type { ProcessedData } from '@/types/data.types'

interface Props {
  onDataLoaded: (data: ProcessedData) => void
}

export function DataUploader({ onDataLoaded }: Props) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [filename, setFilename] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const uploadFile = useCallback(async (file: File) => {
    setStatus('loading')
    setFilename(file.name)
    setErrorMsg('')
    try {
      const data: ProcessedData = await processFile(file)
      onDataLoaded(data)
      setStatus('success')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al procesar el archivo')
      setStatus('error')
    }
  }, [onDataLoaded])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] },
    maxFiles: 1,
    onDrop: (files) => { if (files[0]) uploadFile(files[0]) },
  })

  const reset = () => { setStatus('idle'); setFilename(''); setErrorMsg('') }

  return (
    <div className="w-full">
      {status === 'success' ? (
        <div className="flex items-center gap-3 glass rounded-xl px-4 py-3">
          <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{filename}</p>
            <p className="text-xs text-white/40">Datos cargados correctamente</p>
          </div>
          <button onClick={reset} className="text-white/30 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={cn(
            'relative flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-8 cursor-pointer transition-all duration-200',
            isDragActive ? 'border-accent bg-accent/10' : 'border-white/10 hover:border-white/30 hover:bg-white/5',
            status === 'error' && 'border-red-500/50 bg-red-500/5',
          )}
        >
          <input {...getInputProps()} />
          {status === 'loading' ? (
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          ) : (
            <div className={cn('p-3 rounded-xl', isDragActive ? 'bg-accent/20' : 'bg-white/5')}>
              {status === 'error' ? (
                <FileSpreadsheet className="w-6 h-6 text-red-400" />
              ) : (
                <Upload className="w-6 h-6 text-white/40" />
              )}
            </div>
          )}
          <div className="text-center">
            {status === 'loading' ? (
              <p className="text-sm text-white/60">Procesando {filename}...</p>
            ) : status === 'error' ? (
              <>
                <p className="text-sm font-medium text-red-400">{errorMsg}</p>
                <p className="text-xs text-white/40 mt-1">Haz clic para intentar de nuevo</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-white/80">
                  {isDragActive ? 'Suelta el archivo aquí' : 'Arrastra tu archivo o haz clic'}
                </p>
                <p className="text-xs text-white/30 mt-1">CSV · XLSX — máx. 50MB</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
