# Pull Request説明ファイル

このディレクトリには、各Issueに対応するPull Requestの説明ファイルが格納されています。

## ファイル一覧

- `PR_DESCRIPTION.md` - 汎用テンプレート
- `PR_DESCRIPTION_ICON.md` - アイコン機能のPR説明
- `PR_DESCRIPTION_ISSUE2.md` - Issue #2 のPR説明
- `PR_DESCRIPTION_ISSUE3.md` - Issue #3 のPR説明
- `PR_DESCRIPTION_ISSUE4.md` - Issue #4 のPR説明
- `PR_DESCRIPTION_ISSUE5.md` - Issue #5 のPR説明
- `PR_DESCRIPTION_ISSUE10.md` - Issue #10 のPR説明
- `PR_DESCRIPTION_ISSUE11.md` - Issue #11 のPR説明
- `PR_DESCRIPTION_ISSUE12.md` - Issue #12 のPR説明

## 使用方法

Pull Requestを作成する際は、`gh`コマンドで以下のように使用します：

```bash
gh pr create --title "タイトル" --body-file docs/pr-descriptions/PR_DESCRIPTION_ISSUE*.md --base main
```

