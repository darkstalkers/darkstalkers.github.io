export interface BracketMember {
  name: string;
  character: string;
}

export interface BracketTeam {
  no: number;
  name: string;
  members: BracketMember[];
}

/** 4チーム勝ち上がり式（準決勝2試合→決勝1試合でブロック優勝を決める） */
export interface TreeBlock {
  type: 'tree';
  label: string;
  teams: [BracketTeam, BracketTeam, BracketTeam, BracketTeam];
  /** teams[0] vs teams[1] の勝者（0 or 1）。未定なら null */
  semiWinner1: 0 | 1 | null;
  /** teams[2] vs teams[3] の勝者（0 or 1、teams配列上は2,3に対応） */
  semiWinner2: 0 | 1 | null;
  /** 準決勝1の勝者と準決勝2の勝者、どちらがブロック優勝したか */
  finalWinner: 'semi1' | 'semi2' | null;
}

/** 3チーム総当たり式（ブロック優勝チームのみ記録） */
export interface RoundRobinBlock {
  type: 'roundrobin';
  label: string;
  teams: [BracketTeam, BracketTeam, BracketTeam];
  /** ブロック優勝チームのインデックス（0-2）。未定なら null */
  winner: 0 | 1 | 2 | null;
}

export type BracketBlockData = TreeBlock | RoundRobinBlock;

export const BRACKET_BLOCKS: BracketBlockData[] = [
  {
    type: 'tree', label: 'A',
    teams: [
      { no: 54, name: '斡旋3', members: [{ name: 'Miki', character: 'リリス' }, { name: 'お砂', character: 'ガロン' }, { name: '油揚げ', character: 'デミトリ' }] },
      { no: 11, name: 'ザベル3枚', members: [{ name: 'もんづ', character: 'ザベル' }, { name: 'あすうら', character: 'ザベル' }, { name: 'たかみー', character: 'ザベル' }] },
      { no: 46, name: 'Chainsmoke Cat', members: [{ name: 'にしけん', character: 'モリガン' }, { name: '外道', character: 'オルバス' }, { name: 'くりお', character: 'アナカリス' }] },
      { no: 3, name: 'フカリセイヴァー部', members: [{ name: 'ひろ', character: 'ビシャモン' }, { name: 'ハム', character: 'サスカッチ' }, { name: 'ユーリエン', character: 'アナカリス' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'B',
    teams: [
      { no: 1, name: 'Paradise Road', members: [{ name: 'デカメロン', character: 'ザベル' }, { name: 'ナカニシ', character: 'ビシャモン' }, { name: 'コショー', character: 'バレッタ' }] },
      { no: 31, name: '冥海狼', members: [{ name: 'マグモグ', character: 'オルバス' }, { name: '酸化銀', character: 'ガロン' }, { name: '始末屋', character: 'ジェダ' }] },
      { no: 19, name: 'ぬまつだ/ずきんとチワワとHなおねぇさん', members: [{ name: 'ぶち', character: 'モリガン' }, { name: 'バル', character: 'ガロン' }, { name: 'ドスコイモリ子花子', character: 'バレッタ' }] },
      { no: 36, name: '防衛結界', members: [{ name: 'まにら', character: 'アナカリス' }, { name: '34', character: 'オルバス' }, { name: 'ジェフ', character: 'リリス' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'C',
    teams: [
      { no: 30, name: 'ココロガシズマルシャドブレーヨー', members: [{ name: 'かみしろ', character: 'モリガン' }, { name: 'わたるーん', character: 'サスカッチ' }, { name: 'もろ', character: 'フェリシア' }] },
      { no: 25, name: '真・ミラージュボディ', members: [{ name: 'animus', character: 'ガロン' }, { name: 'アオ', character: 'ガロン' }, { name: '背骨', character: 'ガロン' }] },
      { no: 34, name: 'とんかつMEN', members: [{ name: 'えご', character: 'レイレイ' }, { name: 'やじまT.T', character: 'モリガン' }, { name: 'KEN', character: 'ガロン' }] },
      { no: 20, name: 'ぬまつだ寿司！', members: [{ name: 'ワン', character: 'ガロン' }, { name: 'オメガ', character: 'モリガン' }, { name: 'こおん', character: 'モリガン' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'D',
    teams: [
      { no: 42, name: '3rd strike reborn', members: [{ name: 'マッチ', character: 'ザベル' }, { name: 'クルベガ', character: 'ザベル' }, { name: 'こわはら', character: 'サスカッチ' }] },
      { no: 43, name: '35937', members: [{ name: 'HQ', character: 'ガロン' }, { name: '九十九', character: 'レイレイ' }, { name: '佐伯', character: 'キュービー' }] },
      { no: 24, name: 'MorriganTrafficLight', members: [{ name: 'Gorrigan', character: 'モリガン' }, { name: 'モリカミ', character: 'モリガン' }, { name: 'たけぽん', character: 'モリガン' }] },
      { no: 5, name: 'おにまるッチ', members: [{ name: 'おにちゃん', character: 'ビシャモン' }, { name: 'まる', character: 'オルバス' }, { name: 'けつぁーるッチ', character: 'サスカッチ' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'E',
    teams: [
      { no: 9, name: 'わくわく★だーくすとーかーず', members: [{ name: 'しゅか', character: 'オルバス' }, { name: 'カムクラ', character: 'モリガン' }, { name: 'うぇん', character: 'リリス' }] },
      { no: 2, name: 'Happy Half Centuries', members: [{ name: 'みずしま', character: 'アナカリス' }, { name: 'ちゃんすけ', character: 'ビクトル' }, { name: 'サス兄', character: 'サスカッチ' }] },
      { no: 13, name: '帰ってきた三大天', members: [{ name: 'DD', character: 'サスカッチ' }, { name: '海の子', character: 'オルバス' }, { name: 'こめまる', character: 'ザベル' }] },
      { no: 22, name: 'ぬまつだニュージーランド支部', members: [{ name: 'ほえ', character: 'ジェダ' }, { name: 'カラン', character: 'ビシャモン' }, { name: 'へっきー', character: 'フェリシア' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'F',
    teams: [
      { no: 40, name: 'DANCE TIME!', members: [{ name: 'Buzz', character: 'ガロン' }, { name: '産廃', character: 'キュービー' }, { name: 'リリィ', character: 'リリス' }] },
      { no: 45, name: 'ルミナスしに来ました！', members: [{ name: 'まの', character: 'リリス' }, { name: '結城オグレ', character: 'リリス' }, { name: 'はちおうじ', character: 'リリス' }] },
      { no: 16, name: 'bowと弟子', members: [{ name: 'bow', character: 'オルバス' }, { name: 'くろえ', character: 'サスカッチ' }, { name: 'あんど', character: 'フェリシア' }] },
      { no: 55, name: '斡旋4', members: [{ name: '御茶割', character: 'バレッタ' }, { name: '西京BOY', character: 'フェリシア' }, { name: 'マジレス', character: 'レイレイ' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'G',
    teams: [
      { no: 44, name: 'NGC', members: [{ name: '若孫', character: 'リリス' }, { name: 'いせあも', character: 'サスカッチ' }, { name: 'にのうで', character: 'キュービー' }] },
      { no: 48, name: '終活', members: [{ name: '玉露', character: 'レイレイ' }, { name: 'すずむら', character: 'リリス' }, { name: 'J・B', character: 'ジェダ' }] },
      { no: 23, name: 'ぬまつだ光GENJI', members: [{ name: '玄', character: 'デミトリ' }, { name: 'しょーゆ', character: 'リリス' }, { name: 'ヤーマン', character: 'サスカッチ' }] },
      { no: 29, name: 'YO来来', members: [{ name: '紫色のジェダ', character: 'ジェダ' }, { name: 'はぐれ', character: 'デミトリ' }, { name: 'STO', character: 'レイレイ' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'H',
    teams: [
      { no: 21, name: 'ぬまつだ ささかま', members: [{ name: 'さーかす', character: 'アナカリス' }, { name: 'さとうユーキ', character: 'ガロン' }, { name: 'kamasho', character: 'キュービー' }] },
      { no: 4, name: '三度目の三人文殊', members: [{ name: 'サガ', character: 'ザベル' }, { name: 'アズワン', character: 'デミトリ' }, { name: 'ホソカワ', character: 'サスカッチ' }] },
      { no: 37, name: 'アテナ日本橋早練部', members: [{ name: 'うすしお', character: 'ガロン' }, { name: 'ぱんどらの箱守', character: 'アナカリス' }, { name: 'スーパーモチモチ', character: 'バレッタ' }] },
      { no: 15, name: 'パパ〜ママ〜おんぶして〜', members: [{ name: '蛙水', character: 'ジェダ' }, { name: 'さくま', character: 'デミトリ' }, { name: 'ヲナ', character: 'モリガン' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'I',
    teams: [
      { no: 7, name: 'お母さん、いい加減あなたの顔は忘れてしまいました', members: [{ name: 'セキグチ', character: 'ザベル' }, { name: 'ぎゅんこ', character: 'ガロン' }, { name: '麦', character: 'ザベル' }] },
      { no: 32, name: 'のんべれケ', members: [{ name: 'ないきん', character: 'ビシャモン' }, { name: 'おけけび', character: 'サスカッチ' }, { name: 'ナツ', character: 'ビシャモン' }] },
      { no: 12, name: 'ジャイアントキリング', members: [{ name: 'はねこ', character: 'ガロン' }, { name: 'エステス', character: 'レイレイ' }, { name: '雫-sizuku-', character: 'キュービー' }] },
      { no: 27, name: 'アンデッド メメント・モリ', members: [{ name: 'ごぶ', character: 'ザベル' }, { name: '松岡', character: 'レイレイ' }, { name: 'さい', character: 'デミトリ' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'J',
    teams: [
      { no: 52, name: '斡旋1', members: [{ name: 'ふー', character: 'ガロン' }, { name: 'なにぬ', character: 'レイレイ' }, { name: 'レイラ', character: 'デミトリ' }] },
      { no: 28, name: 'ヴァンパイアランナーズ', members: [{ name: 'てきちぇん', character: 'キュービー' }, { name: 'おだぶつ', character: 'ビクトル' }, { name: 'ちょうごうきん', character: 'オルバス' }] },
      { no: 51, name: '3 Old Men', members: [{ name: 'Dusty', character: 'フェリシア' }, { name: 'RobertX', character: 'キュービー' }, { name: 'Zinac', character: 'レイレイ' }] },
      { no: 39, name: 'ホーカイザー', members: [{ name: '土猫', character: 'キュービー' }, { name: 'ヒサシ', character: 'レイレイ' }, { name: 'グラタン', character: 'ガロン' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'K',
    teams: [
      { no: 35, name: 'シン・SNK', members: [{ name: 'さかもと', character: 'キュービー' }, { name: 'ナス', character: 'サスカッチ' }, { name: 'Kaji', character: 'リリス' }] },
      { no: 8, name: 'ヴァンパイア・プラモデラーズ', members: [{ name: '終わりなき幻夢零', character: 'リリス' }, { name: '月海ケル', character: 'ガロン' }, { name: 'ぽっきーてぃー', character: 'ジェダ' }] },
      { no: 47, name: 'おでん・すき焼き・金平牛蒡', members: [{ name: 'Mayo', character: 'オルバス' }, { name: 'Terragort', character: 'バレッタ' }, { name: 'TROJAN', character: 'デミトリ' }] },
      { no: 10, name: 'G-Stage七隈製麺部', members: [{ name: 'モリオ', character: 'ジェダ' }, { name: 'うどんこ', character: 'ビシャモン' }, { name: 'りとう', character: 'ビシャモン' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'L',
    teams: [
      { no: 41, name: 'アッセンブル！', members: [{ name: 'キャプテンYL', character: 'レイレイ' }, { name: '野菜homecoming', character: 'サスカッチ' }, { name: 'グリーンチョッキ(東映版)', character: 'レイレイ' }] },
      { no: 18, name: 'ぬまつだすーえー', members: [{ name: 'きむ', character: 'リリス' }, { name: 'OWL', character: 'サスカッチ' }, { name: 'MAB', character: 'ガロン' }] },
      { no: 49, name: 'UTFGC', members: [{ name: 'ドス', character: 'サスカッチ' }, { name: '徒歩', character: 'バレッタ' }, { name: 'ちゃつぼ', character: 'ザベル' }] },
      { no: 50, name: 'ハンター勢', members: [{ name: 'らあ', character: 'モリガン' }, { name: 'TKO', character: 'サスカッチ' }, { name: 'たなか', character: 'ジェダ' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'tree', label: 'M',
    teams: [
      { no: 14, name: 'Windy City Vampire', members: [{ name: 'Typhas', character: 'フェリシア' }, { name: 'MightyMar', character: 'アナカリス' }, { name: 'TheBesteban', character: 'ガロン' }] },
      { no: 33, name: '藤沢ダイヤモンズ', members: [{ name: 'Tom', character: 'デミトリ' }, { name: '球道', character: 'モリガン' }, { name: 'k西', character: 'バレッタ' }] },
      { no: 17, name: '円町キング', members: [{ name: 'ねこや', character: 'フェリシア' }, { name: 'フタナリリス', character: 'ジェダ' }, { name: 'おしゃぶ', character: 'オルバス' }] },
      { no: 53, name: '斡旋2', members: [{ name: 'のヴぇ', character: 'モリガン' }, { name: 'ヤスケン', character: 'フェリシア' }, { name: 'ごんぺ', character: 'フェリシア' }] },
    ],
    semiWinner1: null, semiWinner2: null, finalWinner: null,
  },
  {
    type: 'roundrobin', label: 'N',
    teams: [
      { no: 6, name: 'サスカッチ・3セット', members: [{ name: 'わたらない', character: 'サスカッチ' }, { name: 'どうでもいい', character: 'サスカッチ' }, { name: 'えぬかわ', character: 'サスカッチ' }] },
      { no: 38, name: '新規勢', members: [{ name: 'ツボプラス', character: 'ガロン' }, { name: 'クミロ', character: 'ザベル' }, { name: 'サカイ', character: 'デミトリ' }] },
      { no: 26, name: "TINKer's HELL", members: [{ name: '芋虫', character: 'パレッタ' }, { name: 'せり', character: 'ザベル' }, { name: 'こーへぃ', character: 'デミトリ' }] },
    ],
    winner: null,
  },
];
