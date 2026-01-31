# 架空の犯罪者ブログ（ARG用）

超シンプルで暗めの“記録ブログ”です。Cloudflare Pages（GitHub連携）でそのまま公開できます。  
PDF/画像/動画はR2に置く前提で、ローカル整理用の `r2_upload/` も同梱しています。

## フォルダ構成

- `public/` : Cloudflare Pages の公開ディレクトリ（静的ファイル）
- `functions/` : Pages Functions（隠しページの解放 API と保護ミドルウェア）
- `r2_upload/` : R2へアップする素材の整理用（※デプロイ対象外）

## Cloudflare Pages へのデプロイ

1. このZIPを解凍して GitHub に push
2. Cloudflare Pages → Create project → GitHub を選択
3. Build settings
   - **Framework preset**: None
   - **Build command**: （空欄）
   - **Output directory**: `public`
4. 環境変数（Settings → Environment variables）
   - `UNLOCK_SECRET` : 32文字以上のランダム文字列（例: パスワード生成で作ったもの）

※ `sitemap.xml` 内の `https://example.com/` は、公開後にあなたのドメインへ差し替えてください。

## 隠しページのギミック（6箇所クリック）

- トップページに **見えないクリック箇所**が6つあります。
- 6つ全てをクリックすると、`/api/unlock` が **署名済み Cookie** を発行し、`/hidden/` に遷移します。
- `/hidden/` は `_middleware.js` で Cookie を検証し、未解放だと **404** を返します（存在がバレにくい）。

### 「デバッグモードで見えない」についての現実的なライン
ブラウザ上で動く以上、**開発者ツールでJSやHTMLを“徹底的に調べれば”突破できる可能性**はゼロにできません。  
ただし、この実装は次を満たします：

- 隠しURLをDOMやリンクとして出さない（クリック→サーバー解放→遷移）
- 解放条件はサーバー側で検証（cookieはHttpOnlyでJSから読めない）
- 未解放アクセスは404（「ある」こと自体を隠す）
- `robots.txt` で `/hidden/` をクロール対象外に

さらに強固にしたい場合は、
- 解放後に **追加パスワード**（サーバー側照合）を要求
- 解放条件を「時刻」「IP」「User-Agent」等と組み合わせる
なども可能です。

## 記事
アップロードいただいた文章を `public/posts/` に収録しています。
