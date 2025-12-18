# [Feature] Gemini 3 Flash Previewによるリザルト画像解析APIの実装

## 概要

Issue #3の対応として、ユーザーがアップロードしたサーモンランの結果スクリーンショットから、シナリオ情報を自動抽出するAPIとフロントエンドUIを実装しました。

## 実施内容

### 1. 画像解析APIエンドポイントの実装

- **エンドポイント**: `/api/analyze`
- **メソッド**: POST
- **入力**: 画像ファイル（multipart/form-data）
- **出力**: JSON形式の解析結果

**機能**:
- Gemini 3 Flash Preview（`gemini-3-flash-preview`）を使用した画像解析
- 構造化されたJSONレスポンス（シナリオコード、ステージ、キケン度、スコア、武器、WAVE情報など）
- マスタデータへの名寄せ機能（ステージ名・武器名をマスタIDに変換）

### 2. 画像解析用システムプロンプトの実装

- `lib/ai/prompt.ts`に構造化出力指示を含むプロンプトを実装
- JSON形式での出力を強制
- ステージ名、武器名、潮位、イベントなどの正確な抽出を指示

### 3. マスタデータ名寄せユーティリティの実装

- `lib/utils/master-lookup.ts`を作成
- `lookupStageId()`: ステージ名をマスタIDに変換
- `lookupWeaponId()`: 武器名をマスタIDに変換
- `lookupWeaponIds()`: 武器名配列をマスタID配列に変換
- 完全一致・部分一致による柔軟な名寄せ機能

### 4. フロントエンドUIの実装

- `app/components/ImageAnalyzer.tsx`を作成
- 画像アップロード機能
- プレビュー表示機能
- 解析結果の視覚的な表示（基本情報、武器、WAVE情報）
- ローディング状態の表示
- エラーハンドリング
- **ダークテーマ対応**: 黒基調のカラースキームを実装

### 5. 型定義の追加

- `app/types/analyze.ts`を作成
- `AnalyzedScenario`: 解析結果の型定義
- `AnalyzeResponse`: APIレスポンスの型定義
- `WaveInfo`: WAVE情報の型定義

## 技術スタック

- **AIモデル**: Google Gemini 3 Flash Preview（`gemini-3-flash-preview`）
- **SDK**: `@google/generative-ai` (v0.21.0)
- **画像処理**: Base64エンコーディング
- **スタイリング**: Tailwind CSS（ダークテーマ対応）

**注意**: モデル名は環境変数`GEMINI_MODEL_NAME`で変更可能です。他の利用可能なモデル（`gemini-1.5-pro`、`gemini-1.5-flash-002`など）も使用できます。

## 変更ファイル

### 新規作成
- `app/api/analyze/route.ts` - 画像解析APIエンドポイント
- `app/components/ImageAnalyzer.tsx` - 画像アップロード・解析UIコンポーネント
- `app/types/analyze.ts` - 画像解析APIの型定義
- `lib/ai/prompt.ts` - Gemini API用システムプロンプト
- `lib/utils/master-lookup.ts` - マスタデータ名寄せユーティリティ

### 更新
- `app/page.tsx` - ImageAnalyzerコンポーネントの統合とダークテーマ対応
- `package.json` - `@google/generative-ai`依存関係の追加
- `README.md` - 環境変数の設定手順を追加

## 環境変数の追加

`.env.local`に以下の環境変数を追加してください：

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL_NAME=gemini-3-flash-preview  # オプション（推奨: gemini-3-flash-preview）
```

**注意**:
- `GEMINI_API_KEY`は[Google AI Studio](https://aistudio.google.com/app/apikey)で取得できます
- `GEMINI_MODEL_NAME`は利用可能なモデル名を指定します
- 利用可能なモデルを確認するには: `curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"`

## 使用方法

1. 依存関係のインストール:
   ```bash
   npm install
   ```

2. 環境変数の設定（上記参照）

3. 開発サーバーの起動:
   ```bash
   npm run dev
   ```

4. ブラウザで http://localhost:3000 にアクセス

5. サーモンランの結果画像をアップロードして「解析する」ボタンをクリック

6. 解析結果が表示されます

## UI/UXの特徴

- **ダークテーマ対応**: 黒基調のカラースキームで目に優しい
- **レスポンシブデザイン**: 様々な画面サイズに対応
- **直感的な操作**: ドラッグ&ドロップ対応のファイル選択
- **視覚的フィードバック**: ローディング状態とエラーメッセージの表示
- **構造化された情報表示**: 基本情報、武器、WAVE情報をカード形式で表示

## 解析対象項目

- シナリオコード
- ステージ名（マスタIDに自動変換）
- キケン度（0-333%）
- スコア（任意）
- 武器（4種、マスタIDに自動変換）
- WAVE情報（1-3 + EX）:
  - 潮位（干潮/通常/満潮）
  - イベント（ハコビヤ襲来、グリル発進など）
  - 納品数
  - ノルマ（解析可能な場合）
  - クリア状況（解析可能な場合）

## エラーハンドリング

- 画像ファイルの検証
- APIキーの確認
- Gemini API呼び出しエラーの適切な処理
- JSONパースエラーの処理
- 名寄せ失敗時の警告ログ出力

## 今後の拡張可能性

- 解析結果をデータベースに保存する機能
- 解析履歴の表示
- 複数画像の一括解析
- 解析精度の向上（プロンプトの最適化）

## 関連Issue

Closes #3

