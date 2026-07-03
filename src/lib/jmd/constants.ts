export const REGIONS = [
  '北海道','青森県','岩手県','宮城県','秋田県',
  '山形県','福島県','茨城県','栃木県','群馬県','埼玉県','千葉県',
  '東京都','神奈川県','新潟県','富山県','石川県','福井県','山梨県',
  '長野県','岐阜県','静岡県','愛知県','三重県','滋賀県','京都府',
  '大阪府','兵庫県','奈良県','和歌山県','鳥取県','島根県','岡山県',
  '広島県','山口県','徳島県','香川県','愛媛県','高知県','福岡県',
  '佐賀県','長崎県','熊本県','大分県','宮崎県','鹿児島県','沖縄県',
];

export const ENV_LABELS: Record<string, string> = {
  arcade: 'アーケード',
  ps3: 'PS3/リザレク',
  xbox: 'Xbox/リザレク',
  steam: 'Steam/ファイコレ',
  ps4: 'PS4/ファイコレ',
  switch: 'Switch/ファイコレ',
  xboxone: 'XboxOne/ファイコレ',
};

export const CHARACTERS = [
  { id: 'anakaris',  name: 'アナカリス', image: 'img_s_anakaris_50x50.jpg' },
  { id: 'aulbath',   name: 'オルバス',   image: 'img_s_aulbath_50x50.jpg' },
  { id: 'bishamon',  name: 'ビシャモン', image: 'img_s_bishamon_50x50.jpg' },
  { id: 'bulleta',   name: 'バレッタ',   image: 'img_s_bulleta_50x50.jpg' },
  { id: 'demitri',   name: 'デミトリ',   image: 'img_s_demitri_50x50.jpg' },
  { id: 'felicia',   name: 'フェリシア', image: 'img_s_felicia_50x50.jpg' },
  { id: 'gallon',    name: 'ガロン',     image: 'img_s_gallon_50x50.jpg' },
  { id: 'jedah',     name: 'ジェダ',     image: 'img_s_jedah_50x50.jpg' },
  { id: 'leilei',    name: 'レイレイ',   image: 'img_s_leilei_50x50.jpg' },
  { id: 'lilith',    name: 'リリス',     image: 'img_s_lilith_50x50.jpg' },
  { id: 'morrigan',  name: 'モリガン',   image: 'img_s_morrigan_50x50.jpg' },
  { id: 'qbee',      name: 'キュービー', image: 'img_s_qbee_50x50.jpg' },
  { id: 'sasquatch', name: 'サスカッチ', image: 'img_s_sasquatch_50x50.jpg' },
  { id: 'victor',    name: 'ビクトル',   image: 'img_s_victor_50x50.jpg' },
  { id: 'zabel',     name: 'ザベル',     image: 'img_s_zabel_50x50.jpg' },
] as const;

export const CHARA_MAP: Record<string, { name: string; image: string }> = Object.fromEntries(
  CHARACTERS.map(c => [c.id, { name: c.name, image: c.image }])
);
