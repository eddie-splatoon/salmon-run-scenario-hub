import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="bg-gray-900 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-gray-400 hover:text-gray-200 mb-6 transition-colors"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          トップに戻る
        </Link>

        <div className="max-w-4xl mx-auto bg-gray-800 rounded-lg p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-gray-100 mb-6">利用規約</h1>

          <div className="prose prose-invert max-w-none">
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">1. はじめに</h2>
              <p className="text-gray-300 leading-relaxed">
                本利用規約（以下「本規約」といいます）は、Salmon Run Scenario Hub（以下「本サービス」といいます）の利用条件を定めるものです。
                本サービスを利用する際は、本規約に同意していただく必要があります。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">2. サービスの内容</h2>
              <p className="text-gray-300 leading-relaxed">
                本サービスは、スプラトゥーン3のサーモンランのリザルト画像を解析し、シナリオコードを生成・共有するサービスです。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">3. 利用者の義務</h2>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>本サービスを適法な目的でのみ利用すること</li>
                <li>他の利用者に迷惑をかけないこと</li>
                <li>虚偽の情報を投稿しないこと</li>
                <li>本サービスの運営を妨害する行為を行わないこと</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">4. 知的財産権</h2>
              <p className="text-gray-300 leading-relaxed">
                本サービスに投稿されたコンテンツの知的財産権は、投稿者に帰属します。
                ただし、本サービスの運営に必要な範囲で、当該コンテンツを利用することができるものとします。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">5. 任天堂に関する表記</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                本サービスは、任天堂株式会社（以下「任天堂」といいます）の公式サービスではありません。
                本サービスは、任天堂のファンコンテンツガイドラインに準拠して運営されています。
              </p>
              <p className="text-gray-300 leading-relaxed mb-3">
                本サービスで使用されている「スプラトゥーン」「サーモンラン」などの名称、キャラクター、画像、音楽、その他のコンテンツは、任天堂の商標または著作物です。
                これらは任天堂の知的財産であり、本サービスは任天堂の許可を得て運営されているものではありません。
              </p>
              <p className="text-gray-300 leading-relaxed">
                本サービスに関するお問い合わせは、任天堂ではなく、本サービスの運営者（
                <a
                  href="https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  GitHubのIssues
                </a>
                ）までお願いいたします。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">6. 収益化に関する表記</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                本サービスは、広告配信等による収益化を行っている場合があります。
                広告配信については、本サービスの運営を継続するために必要な措置であり、利用者に対して追加の費用を請求するものではありません。
              </p>
              <p className="text-gray-300 leading-relaxed">
                広告配信に関する詳細については、
                <Link
                  href="/privacy"
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  プライバシーポリシー
                </Link>
                をご確認ください。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">7. 免責事項</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                本サービスは、現状有姿で提供されるものであり、その正確性、完全性、有用性等について一切保証するものではありません。
                本サービスを利用したことにより生じた損害について、運営者は一切の責任を負いません。
              </p>
              <p className="text-gray-300 leading-relaxed">
                本サービスは、任天堂の公式サービスではないため、任天堂のサポートや保証を受けることはできません。
                本サービスの利用により生じた問題や損害について、任天堂に責任を求めることはできません。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">8. 規約の変更</h2>
              <p className="text-gray-300 leading-relaxed">
                運営者は、本規約を予告なく変更することができるものとします。
                変更後の規約は、本サービス上に表示した時点から効力を生じるものとします。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">9. お問い合わせ</h2>
              <p className="text-gray-300 leading-relaxed">
                本規約に関するお問い合わせは、
                <a
                  href="https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  GitHubのIssues
                </a>
                までお願いいたします。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">6. 規約の変更</h2>
              <p className="text-gray-300 leading-relaxed">
                運営者は、本規約を予告なく変更することができるものとします。
                変更後の規約は、本サービス上に表示した時点から効力を生じるものとします。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">7. お問い合わせ</h2>
              <p className="text-gray-300 leading-relaxed">
                本規約に関するお問い合わせは、
                <a
                  href="https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-400 hover:text-orange-300 underline"
                >
                  GitHubのIssues
                </a>
                までお願いいたします。
              </p>
            </section>

            <p className="text-gray-400 text-sm mt-8">
              制定日: 2025年12月20日<br />
              最終更新日: 2025年12月23日
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

