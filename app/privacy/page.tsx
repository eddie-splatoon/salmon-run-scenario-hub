import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
          <h1 className="text-3xl font-bold text-gray-100 mb-6">プライバシーポリシー</h1>

          <div className="prose prose-invert max-w-none">
            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">1. はじめに</h2>
              <p className="text-gray-300 leading-relaxed">
                Salmon Run Scenario Hub（以下「本サービス」といいます）は、利用者の個人情報を適切に保護することを重要視しています。
                本プライバシーポリシーは、本サービスがどのように個人情報を収集、使用、保護するかを説明するものです。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">2. 収集する情報</h2>
              <p className="text-gray-300 leading-relaxed mb-2">本サービスは、以下の情報を収集する場合があります：</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>Googleアカウントによる認証情報（メールアドレス、表示名）</li>
                <li>投稿したシナリオ情報（シナリオコード、ステージ、武器、キケン度など）</li>
                <li>アップロードした画像（リザルト画像、プロフィール画像）</li>
                <li>サービス利用に関するログ情報</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">3. 情報の利用目的</h2>
              <p className="text-gray-300 leading-relaxed mb-2">収集した情報は、以下の目的で利用します：</p>
              <ul className="list-disc list-inside text-gray-300 space-y-2">
                <li>本サービスの提供・運営</li>
                <li>ユーザー認証・アカウント管理</li>
                <li>サービス改善のための分析</li>
                <li>不正利用の防止</li>
              </ul>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">4. 情報の管理</h2>
              <p className="text-gray-300 leading-relaxed">
                本サービスは、Supabaseを使用してデータを管理しています。
                個人情報は適切に暗号化され、安全に保管されます。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">5. 第三者への提供</h2>
              <p className="text-gray-300 leading-relaxed">
                本サービスは、法令に基づく場合を除き、利用者の同意なく個人情報を第三者に提供することはありません。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">6. 広告配信について</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                本サービスは、サービス運営を継続するために、第三者広告配信事業者（以下「広告配信事業者」といいます）による広告を配信する場合があります。
                広告配信事業者は、利用者の興味に応じた広告を表示するため、本サービスや他のウェブサイトにおける過去のアクセス情報に基づいて、広告を配信する場合があります。
              </p>
              <p className="text-gray-300 leading-relaxed mb-3">
                広告配信事業者は、利用者の個人を特定できる情報（氏名、住所、メールアドレス、電話番号など）を取得することはありません。
                ただし、広告配信事業者は、利用者のブラウザにCookieを設定したり、既存のCookieを読み取ったりする場合があります。
              </p>
              <p className="text-gray-300 leading-relaxed">
                広告配信を停止したい場合は、各広告配信事業者のオプトアウトページから設定を行うか、ブラウザの設定によりCookieの使用を制限することができます。
                ただし、Cookieの使用を制限した場合、本サービスの一部の機能が利用できなくなる可能性があります。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">7. Cookieの使用</h2>
              <p className="text-gray-300 leading-relaxed mb-3">
                本サービスは、以下の目的でCookieを使用します：
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-3">
                <li>認証状態の維持（ログイン状態の保持）</li>
                <li>サービス利用状況の分析・改善</li>
                <li>広告配信（広告配信事業者によるCookieの使用を含む）</li>
              </ul>
              <p className="text-gray-300 leading-relaxed mb-3">
                Cookieとは、ウェブサイトが利用者のコンピュータに送信する小さなテキストファイルです。
                Cookieを使用することで、本サービスは利用者のブラウザを識別し、利用者の設定や利用履歴を保存することができます。
              </p>
              <p className="text-gray-300 leading-relaxed mb-3">
                本サービスで使用されるCookieには、以下の種類があります：
              </p>
              <ul className="list-disc list-inside text-gray-300 space-y-2 mb-3">
                <li><strong>必須Cookie</strong>: 本サービスの基本的な機能を提供するために必要なCookie（認証状態の維持など）</li>
                <li><strong>分析Cookie</strong>: サービス利用状況を分析し、サービス改善のために使用されるCookie</li>
                <li><strong>広告Cookie</strong>: 広告配信事業者による、利用者の興味に応じた広告を表示するために使用されるCookie</li>
              </ul>
              <p className="text-gray-300 leading-relaxed">
                ブラウザの設定により、Cookieの使用を制限することができますが、その場合、本サービスの一部の機能が利用できなくなる可能性があります。
                また、Cookieの使用を制限した場合でも、広告は表示されますが、利用者の興味に応じた広告ではなく、一般的な広告が表示される場合があります。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">8. プライバシーポリシーの変更</h2>
              <p className="text-gray-300 leading-relaxed">
                本プライバシーポリシーは、予告なく変更することがあります。
                変更後のプライバシーポリシーは、本サービス上に表示した時点から効力を生じるものとします。
              </p>
            </section>

            <section className="mb-6">
              <h2 className="text-xl font-semibold text-gray-100 mb-3">9. お問い合わせ</h2>
              <p className="text-gray-300 leading-relaxed">
                個人情報に関するお問い合わせは、
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

