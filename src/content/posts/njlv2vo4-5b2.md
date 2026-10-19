---
title: "Reactのフォーム、バリデーションライブラリの比較"
description: "Reactのフォームライブラリを比較する。"
pubDate: 2021-10-19T15:03:33.084Z
updatedDate: 2021-10-23T20:38:22.019Z
category: tech
---

## Reactフォームライブラリの比較

https://www.npmtrends.com/formik-vs-react-final-form-vs-react-hook-form-vs-react-redux-form

- react-redux-form: 状態管理にreduxを利用していないため除外
- formic: 再レンダリングパフォーマンスが悪いらしいため除外
- react-final-form
- react-hook-form

https://react-hook-form.com/jp/faqs#question10

### react-final-form vs react-hook-form

react-final-form, react-hook-formを比較する。

#### react-final-form

- 3.2kb (+ final-form 5.2kb)
- ts型ビルトイン
- Blitz.jsで採用されている。
- name, value, handlerなどをコンポーネントに渡す形式

ドキュメント  
https://final-form.org/docs/react-final-form/api
https://final-form.org/docs/react-final-form/types/FieldRenderProps

chakrauiとの併用サンプル
https://codesandbox.io/s/github/final-form/react-final-form/tree/master/examples/chakra?file=/index.js:5672-5679

hooksもある
https://github.com/final-form/react-final-form-hooks

#### react-hook-form

- 8.2KB
- ts型ビルトイン
- react-final-formより人気
- ドキュメントが見やすい、日本語記事も見つかりやすい
- 最大/最小値、必須、正規表現などもビルトインでできる
- refをコンポーネントに渡す形式

ドキュメント
https://react-hook-form.com/api
https://react-hook-form.com/api/useform/register

chakrauiとの併用サンプル
https://chakra-ui.com/guides/integrations/with-hook-form

外部ライブラリのコンポーネント、自作コンポーネントはrefを渡せるようにする必要がある。
自作の場合は `React.forwardRef` で対応できる。
https://ja.reactjs.org/docs/forwarding-refs.html

### 結論

どちらも出来ることに差はなさそう

react-hook-formはrefを渡すインターフェースが特徴的で、react-final-formの方がシンプルに見える。
ドキュメントが充実していて、日本語記事も多いためreact-hook-formを選んでおくのが無難そうではある。

## バリデーションライブラリの比較

バリデーションライブラリの比較をする。
シンプルなAPIのものを利用して複雑なバリデーションは自作する方針にしたい。

**参考記事**
https://bagelee.com/programming/react/validation-library/
https://github.com/react-hook-form/resolvers
https://www.npmtrends.com/io-ts-vs-joi-browser-vs-superstruct-vs-vest-vs-yup-vs-zod
とりあえず沢山あることが分かった..

下記がメジャーで日本語記事もよく見つかる。

- yup
- zod

### yup vs zod

yupとzodを比較する。
zodのREADME.mdに比較内容が記載されている。
https://github.com/colinhacks/zod#comparison

#### yup

- 18.2kb
- デフォルト任意入力
- APIの差分
  - nubmer.round
  - object.camelCase
  - string.trim
  - cast, transform

API
https://github.com/jquense/yup

#### zod

- 11.3kb
- デフォルト必須入力
- APIの差分
  - object.partial, object.deepPartial
  - union, intersection
  - primise
  - function
- Blitz.jsで採用されている (final-form x zod)

API
https://github.com/colinhacks/zod#defining-schemas

Blitz.js
https://blitzjs.com/docs/utilities

yupは途中からzodは最初からtypescriptに対応していたという経緯があるからか、下記の記事に書かれているように型生成時の挙動が安定していない部分があるらしい。
https://bagelee.com/programming/react/validation-library/#4

react-hook-formと組み合わせる場合、zodでnumberを扱う時に `{ valueAsNumber: true }` のような記載をする必要がある。
scheme自体はyupよりzodの方がシンプルに見える。

### 結論

ユーザ数はyupが圧倒的に多いため困った時に助かりそうだが、Blitz.jsが採用している & typescriptフレンドリーなzodを利用してみたいと思った。

## 余談

Ant Designはビルトインで `Form` コンポーネントにtypescript対応のstate管理とバリデーションが付いている。

- ステート管理 `useForm`
  https://ant.design/components/form/#components-form-demo-control-hooks

- バリデーション
  https://ant.design/components/form/#Rule

async-validatorという薄い(4.5kb)ライブラリが利用されていた。
https://github.com/yiminghe/async-validator

Ant Designを利用する場合はreact-hook-form, zodを利用せず、ビルトインのシンプルなAPIで頑張れそうだと思った。
