import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../components/ui/Accordion'
import {
  Camera,
  Upload,
  Code,
  HelpCircle,
  Smartphone,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react'

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* ヘッダー */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-4">
            ユーザーガイド
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            初めてサイトを訪れた方や、AI解析がうまくいかない方向けの解説ページです。
            <br />
            このガイドを読んで、スムーズにシナリオコードを共有しましょう。
          </p>
        </div>

        {/* クイックスタート */}
        <section className="mb-16">
          <div className="bg-gray-800 rounded-lg p-8 md:p-12 border border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-100">クイックスタート</h2>
            </div>
            <p className="text-gray-300 mb-8 text-lg">
              Switchでのスクリーンショット撮影から投稿までの流れを説明します。
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* ステップ1 */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 mx-auto">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center">
                  スクリーンショットを撮る
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  Switchでサーモンランのリザルト画面を表示し、スクリーンショットを撮影します。
                </p>
                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                  <p className="text-sm text-gray-400 text-center">
                    <strong className="text-gray-300">撮影方法:</strong>
                    <br />
                    Switch本体のキャプチャボタンを長押し
                    <br />
                    （またはJoy-Conのキャプチャボタン）
                  </p>
                </div>
              </div>

              {/* ステップ2 */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 mx-auto">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center">
                  画像をアップロード
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  撮影した画像をパソコンやスマートフォンに転送し、このサイトの解析ページでアップロードします。
                </p>
                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                  <p className="text-sm text-gray-400 text-center">
                    <strong className="text-gray-300">転送方法:</strong>
                    <br />
                    SwitchからSDカードやNintendo Switch Online経由で転送
                  </p>
                </div>
              </div>

              {/* ステップ3 */}
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <div className="flex items-center justify-center w-16 h-16 bg-orange-500 rounded-full mb-4 mx-auto">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-100 mb-3 text-center">
                  AIが自動解析
                </h3>
                <p className="text-gray-400 text-center mb-4">
                  AIが画像を解析し、シナリオコードを自動生成します。生成されたコードを確認して投稿しましょう。
                </p>
                <div className="bg-gray-800 rounded p-4 border border-gray-700">
                  <p className="text-sm text-gray-400 text-center">
                    <strong className="text-gray-300">確認事項:</strong>
                    <br />
                    ステージ、危険度、金イクラ数などを確認
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/analyze"
                className="inline-flex items-center px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Upload className="mr-2 h-5 w-5" />
                AI解析を試す
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* コードの使い方 */}
        <section className="mb-16">
          <div className="bg-gray-800 rounded-lg p-8 md:p-12 border border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg">
                <Code className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-100">コードの使い方</h2>
            </div>
            <p className="text-gray-300 mb-8 text-lg">
              ゲーム内での「シナリオコード」入力方法を説明します。
            </p>

            <div className="bg-gray-900 rounded-lg p-6 md:p-8 border border-gray-700 mb-6">
              <h3 className="text-xl font-semibold text-gray-100 mb-4">
                シナリオコードとは？
              </h3>
              <p className="text-gray-300 mb-4">
                シナリオコードは、サーモンランの特定のシナリオ（ステージ、危険度、武器構成など）を表す16桁の英数字コードです。
                このコードをゲーム内で入力することで、同じシナリオを再現できます。
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full text-white font-bold mr-3">
                    1
                  </span>
                  ゲーム内でシナリオコード入力画面を開く
                </h3>
                <p className="text-gray-300 mb-4 ml-11">
                  サーモンランモードのメニューから「シナリオコード入力」を選択します。
                </p>
                <div className="bg-gray-800 rounded p-4 border border-gray-700 ml-11">
                  <p className="text-sm text-gray-400">
                    <strong className="text-gray-300">場所:</strong> サーモンランモード → メニュー →
                    シナリオコード入力
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full text-white font-bold mr-3">
                    2
                  </span>
                  16桁のコードを入力
                </h3>
                <p className="text-gray-300 mb-4 ml-11">
                  このサイトで取得した16桁のシナリオコードを、ゲーム内の入力欄に入力します。
                </p>
                <div className="bg-gray-800 rounded p-4 border border-gray-700 ml-11">
                  <p className="text-sm text-gray-400">
                    <strong className="text-gray-300">例:</strong>{' '}
                    <code className="bg-gray-900 px-2 py-1 rounded text-orange-400">
                      ABC123DEF456GHIJ
                    </code>
                  </p>
                </div>
              </div>

              <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
                <h3 className="text-xl font-semibold text-gray-100 mb-4 flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-orange-500 rounded-full text-white font-bold mr-3">
                    3
                  </span>
                  シナリオを確認して開始
                </h3>
                <p className="text-gray-300 mb-4 ml-11">
                  入力したコードに対応するシナリオの詳細（ステージ、危険度、武器など）を確認し、問題がなければ開始します。
                </p>
                <div className="bg-gray-800 rounded p-4 border border-gray-700 ml-11">
                  <p className="text-sm text-gray-400">
                    <strong className="text-gray-300">確認ポイント:</strong>
                    <br />
                    • ステージ名が正しいか
                    <br />
                    • 危険度が希望通りか
                    <br />
                    • 武器構成が適切か
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="bg-gray-800 rounded-lg p-8 md:p-12 border border-gray-700">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center w-12 h-12 bg-orange-500 rounded-lg">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-100">よくある質問（FAQ）</h2>
            </div>
            <p className="text-gray-300 mb-8 text-lg">
              よくある質問とその回答をまとめました。
            </p>

            <Accordion type="single" collapsible className="w-full">
              {/* FAQ 1 */}
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span>AI解析でエラーが出る場合はどうすればいいですか？</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      AI解析でエラーが出る場合、以下の点を確認してください：
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                      <li>
                        <strong>画像の品質:</strong>
                        スクリーンショットが鮮明で、リザルト画面全体が写っているか確認してください
                      </li>
                      <li>
                        <strong>画像の向き:</strong>
                        画像が横向き（横長）になっているか確認してください
                      </li>
                      <li>
                        <strong>ファイル形式:</strong>
                        JPG、PNG形式の画像を使用してください
                      </li>
                      <li>
                        <strong>ファイルサイズ:</strong>
                        10MB以下の画像を推奨します
                      </li>
                    </ul>
                    <p className="text-gray-300">
                      それでも解決しない場合は、
                      <a
                        href="https://github.com/eddie-splatoon/salmon-run-scenario-hub/issues"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-orange-400 hover:text-orange-300 underline"
                      >
                        フィードバックページ
                      </a>
                      からお問い合わせください。
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 2 */}
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="h-5 w-5 text-orange-500" />
                    <span>どのデバイスから利用できますか？</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      このサイトは以下のデバイスから利用できます：
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                      <li>
                        <strong>パソコン:</strong>
                        Windows、macOS、Linux対応のブラウザ（Chrome、Firefox、Safari、Edgeなど）
                      </li>
                      <li>
                        <strong>スマートフォン:</strong>
                        iOS、Android対応のブラウザ
                      </li>
                      <li>
                        <strong>タブレット:</strong>
                        iPad、Androidタブレット対応のブラウザ
                      </li>
                    </ul>
                    <p className="text-gray-300">
                      画像のアップロードは、パソコンからの利用を推奨します。
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 3 */}
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="h-5 w-5 text-orange-500" />
                    <span>どのような画像をアップロードすればいいですか？</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      以下の条件を満たす画像をアップロードしてください：
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                      <li>
                        <strong>リザルト画面全体:</strong>
                        ステージ名、危険度、金イクラ数、武器構成などが全て見える画像
                      </li>
                      <li>
                        <strong>鮮明な画像:</strong>
                        文字や数字が読み取れる程度の解像度
                      </li>
                      <li>
                        <strong>横向き:</strong>
                        横長の画像（Switchのスクリーンショットは通常横向き）
                      </li>
                      <li>
                        <strong>ファイル形式:</strong>
                        JPG、PNG形式
                      </li>
                    </ul>
                    <div className="bg-gray-900 rounded p-4 border border-gray-700 mt-4">
                      <p className="text-sm text-gray-400">
                        <strong className="text-gray-300">注意:</strong>
                        画面の一部だけが写っている画像や、ぼやけた画像では正確に解析できない場合があります。
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 4 */}
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-5 w-5 text-orange-500" />
                    <span>プライバシーについて教えてください</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      当サイトでは、ユーザーのプライバシーを尊重しています：
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                      <li>
                        <strong>画像データ:</strong>
                        アップロードされた画像は解析後に削除されます
                      </li>
                      <li>
                        <strong>個人情報:</strong>
                        投稿されたシナリオコードには個人情報は含まれません
                      </li>
                      <li>
                        <strong>認証情報:</strong>
                        Google認証を使用していますが、メールアドレス以外の情報は取得しません
                      </li>
                    </ul>
                    <p className="text-gray-300">
                      詳細については、
                      <Link
                        href="/privacy"
                        className="text-orange-400 hover:text-orange-300 underline"
                      >
                        プライバシーポリシー
                      </Link>
                      をご確認ください。
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* FAQ 5 */}
              <AccordionItem value="item-5">
                <AccordionTrigger className="text-left">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-5 w-5 text-orange-500" />
                    <span>解析結果が正しくない場合はどうすればいいですか？</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    <p className="text-gray-300">
                      解析結果が正しくない場合、以下の対処方法があります：
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
                      <li>
                        <strong>画像を再アップロード:</strong>
                        より鮮明な画像で再度解析を試してください
                      </li>
                      <li>
                        <strong>手動で修正:</strong>
                        解析結果の各項目を手動で修正してから投稿できます
                      </li>
                      <li>
                        <strong>フィードバックを送信:</strong>
                        問題が続く場合は、フィードバックページから報告してください
                      </li>
                    </ul>
                    <div className="bg-gray-900 rounded p-4 border border-gray-700 mt-4">
                      <p className="text-sm text-gray-400">
                        <strong className="text-gray-300">ヒント:</strong>
                        リザルト画面のスクリーンショットは、ゲーム内で一時停止してから撮影すると鮮明な画像が取得できます。
                      </p>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* フッターリンク */}
        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-orange-400 hover:text-orange-300 font-semibold transition-colors"
          >
            <ArrowRight className="mr-2 h-5 w-5 rotate-180" />
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}

