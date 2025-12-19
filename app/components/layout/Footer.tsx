import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="mt-auto border-t border-gray-700 bg-gray-900 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between space-y-4 md:flex-row md:space-y-0">
          {/* 著作権表示 */}
          <div className="text-center md:text-left">
            <p className="text-sm text-gray-400">
              © {currentYear} Salmon Run Scenario Hub. All rights reserved.
            </p>
          </div>

          {/* リンク */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <Link
              href="/terms"
              className="text-gray-400 hover:text-orange-500 transition-colors"
            >
              利用規約
            </Link>
            <Link
              href="/privacy"
              className="text-gray-400 hover:text-orange-500 transition-colors"
            >
              プライバシーポリシー
            </Link>
            <a
              href="https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-orange-500 transition-colors"
            >
              フィードバック
            </a>
          </nav>
        </div>
      </div>
    </footer>
  )
}

