import ImageAnalyzer from '../components/ImageAnalyzer'
import Link from 'next/link'

export default function AnalyzePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="mb-4">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 underline"
          >
            ← 一覧に戻る
          </Link>
        </div>
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-100">
          Salmon Run Scenario Hub
        </h1>
        <ImageAnalyzer />
      </div>
    </main>
  )
}

