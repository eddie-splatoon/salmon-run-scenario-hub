import ImageAnalyzer from '../components/ImageAnalyzer'
import Link from 'next/link'

export default function AnalyzePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-8 sm:px-6 sm:py-12 md:px-8 md:py-16 lg:px-24 lg:py-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="mb-4 sm:mb-6">
          <Link
            href="/scenarios"
            className="text-blue-400 hover:text-blue-300 underline text-sm sm:text-base"
          >
            ← 一覧へ
          </Link>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-6 sm:mb-8 text-gray-100">
          Salmon Run Scenario Hub
        </h1>
        <ImageAnalyzer />
      </div>
    </main>
  )
}

