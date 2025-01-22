"use strict";

$(function () {
  var REGIONS = ['北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'];
  var ENV = {
    arcade: 'アーケード',
    ps3: 'PS3/リザレク',
    xbox: 'Xbox/リザレク',
    steam: 'Steam/ファイコレ',
    ps4: 'PS4/ファイコレ',
    "switch": 'Switch/ファイコレ',
    xboxone: 'XboxOne/ファイコレ'
  };
  var CHARACTERS = [{
    id: 'anakaris',
    name: 'アナカリス',
    image: 'img_s_anakaris_50x50.jpg'
  }, {
    id: 'aulbath',
    name: 'オルバス',
    image: 'img_s_aulbath_50x50.jpg'
  }, {
    id: 'bishamon',
    name: 'ビシャモン',
    image: 'img_s_bishamon_50x50.jpg'
  }, {
    id: 'bulleta',
    name: 'バレッタ',
    image: 'img_s_bulleta_50x50.jpg'
  }, {
    id: 'demitri',
    name: 'デミトリ',
    image: 'img_s_demitri_50x50.jpg'
  }, {
    id: 'felicia',
    name: 'フェリシア',
    image: 'img_s_felicia_50x50.jpg'
  }, {
    id: 'gallon',
    name: 'ガロン',
    image: 'img_s_gallon_50x50.jpg'
  }, {
    id: 'jedah',
    name: 'ジェダ',
    image: 'img_s_jedah_50x50.jpg'
  }, {
    id: 'leilei',
    name: 'レイレイ',
    image: 'img_s_leilei_50x50.jpg'
  }, {
    id: 'lilith',
    name: 'リリス',
    image: 'img_s_lilith_50x50.jpg'
  }, {
    id: 'morrigan',
    name: 'モリガン',
    image: 'img_s_morrigan_50x50.jpg'
  }, {
    id: 'qbee',
    name: 'キュービー',
    image: 'img_s_qbee_50x50.jpg'
  }, {
    id: 'sasquatch',
    name: 'サスカッチ',
    image: 'img_s_sasquatch_50x50.jpg'
  }, {
    id: 'victor',
    name: 'ビクトル',
    image: 'img_s_victor_50x50.jpg'
  }, {
    id: 'zabel',
    name: 'ザベル',
    image: 'img_s_zabel_50x50.jpg'
  }];

  // ハッシュ作成
  var charas = {};
  for (var i = 0, len = CHARACTERS.length; i < len; i++) {
    var chara = CHARACTERS[i];
    charas[chara.id] = {
      name: chara.name,
      image: chara.image
    };
  }

  // firebase
  var database = firebase.database();
  var ref = database.ref('08/data');
  var teamsRef = ref.child('teams');
  var singlesRef = ref.child('singles');

  // 設定
  var configRef = ref.child('config');
  var config;
  configRef.child('open');
  configRef.once('value', function (snapshot) {
    config = snapshot.val();
    if (!config) {
      config = {
        open: true,
        adminPass: 'e421b0ade1927b91fa41bfa2baf72eb5'
      };
      configRef.set(config);
    }
    configUpdated(config);
    configRef.on('value', function (snapshot) {
      config = snapshot.val();
      configUpdated(config);
    });
  });
  function configUpdated(config) {
    $('.status').show();
    if (config.open) {
      $('.status').removeClass('alert-warning').addClass('alert-success');
      $('.status-text').text('只今エントリー受付中');
      $('.start').hide();
      $('.stop').show();
    } else {
      $('.status').removeClass('alert-success').addClass('alert-warning');
      $('.status-text').text('エントリー受付停止中');
      $('.start').show();
      $('.stop').hide();
    }
  }
  $('.start').on('click', function (e) {
    e.preventDefault();
    config.open = true;
    configRef.set(config);
  });
  $('.stop').on('click', function (e) {
    e.preventDefault();
    config.open = false;
    configRef.set(config);
  });

  // 追加
  var teams = [];
  teamsRef.on('child_added', function (snapshot) {
    var team = snapshot.val();
    var key = snapshot.key;
    team.key = key;
    teams.push(team);
    teamUpdated(team);
  });
  var singles = [];
  singlesRef.on('child_added', function (snapshot) {
    var single = snapshot.val();
    var key = snapshot.key;
    single.key = key;
    singles.push(single);
    singleUpdated(single);
  });

  // 削除
  teamsRef.on('child_removed', function (snapshot) {
    var key = snapshot.key;
    for (var i = 0, len = teams.length; i < len; i++) {
      if (teams[i].key === key) {
        teams.splice(i, 1);
        break;
      }
    }
    teamUpdated();
  });
  singlesRef.on('child_removed', function (snapshot) {
    var key = snapshot.key;
    for (var i = 0, len = singles.length; i < len; i++) {
      if (singles[i].key === key) {
        singles.splice(i, 1);
        break;
      }
    }
    singleUpdated();
  });

  // 変更
  teamsRef.on('child_changed', function (snapshot, old) {
    var team = snapshot.val();
    var key = snapshot.key;
    team.key = key;
    for (var i = 0, len = teams.length; i < len; i++) {
      if (teams[i].key === key) {
        teams[i] = team;
        break;
      }
    }
    teamUpdated(team);
  });
  singlesRef.on('child_changed', function (snapshot, old) {
    var single = snapshot.val();
    var key = snapshot.key;
    single.key = key;
    for (var i = 0, len = singles.length; i < len; i++) {
      if (singles[i].key === key) {
        singles[i] = single;
        break;
      }
    }
    singleUpdated(single);
  });
  function teamUpdated(team) {
    $('.team-entry-count').text(teams.length);
    if (team) {
      if (team.updatedAt) {
        $('.team-last-updated-at').text(getDateString(team.updatedAt));
      }
    } else {
      $('.team-last-updated-at').text(getDateString());
    }
    analytics();
  }
  function singleUpdated(single) {
    $('.single-entry-count').text(singles.length);
    if (single) {
      if (single.updatedAt) {
        $('.single-last-updated-at').text(getDateString(single.updatedAt));
      }
    } else {
      $('.single-last-updated-at').text(getDateString());
    }
    analytics();
  }
  function getDateString(date) {
    if (date === undefined) {
      date = new Date();
    } else if (typeof date === 'string' && date.length !== 0) {
      date = new Date(date);
    }
    if (date) {
      return date.getFullYear() + '/' + padLeft(date.getMonth() + 1) + '/' + padLeft(date.getDate()) + ' ' + padLeft(date.getHours()) + ':' + padLeft(date.getMinutes()) + ':' + padLeft(date.getSeconds());
    } else {
      return '';
    }
  }
  function padLeft(str, len, pad) {
    if (pad === undefined) {
      pad = '0';
    }
    if (len === undefined) {
      len = 2;
    }
    var buf = '';
    for (var i = 0; i < len; i++) {
      buf += pad;
    }
    str = pad + str;
    return str.slice(-len);
  }
  var task;
  function analytics() {
    if (task) {
      clearTimeout(task);
    }
    task = setTimeout(function () {
      // 総参加者カウント
      var totalCount = 0;
      var afterCount = 0;
      teams.forEach(function (team) {
        team.members.forEach(function (member) {
          if (member.name) {
            totalCount++;
            if (member.after == 1) {
              afterCount++;
            }
          }
        });
      });
      singles.forEach(function (team) {
        team.members.forEach(function (member) {
          if (member.name) {
            totalCount++;
            if (member.after == 1) {
              afterCount++;
            }
          }
        });
      });
      $('.total-count').text(totalCount);
      $('.after-count').text(afterCount);
    }, 1000);
  }
  function objectToArray(object) {
    var array = [];
    for (var key in object) {
      array.push(object[key]);
    }
    return array;
  }
  var BOM = "\uFEFF";
  $('#teams-output-utf8').on('click', function (e) {
    $(this).prop('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(BOM + createTeamsData()));
  });
  $('#teams-output-sjis').on('click', function (e) {
    $(this).prop('href', 'data:text/plain;charset=sjis,' + EscapeSJIS(createTeamsData()));
  });
  $('#singles-output-utf8').on('click', function (e) {
    $(this).prop('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(BOM + createSinglesData()));
  });
  $('#singles-output-sjis').on('click', function (e) {
    $(this).prop('href', 'data:text/plain;charset=sjis,' + EscapeSJIS(createSinglesData()));
  });
  function createTeamsData() {
    var rowHeader = ['チーム名', '斡旋希望', '1:プレイヤー名', '1:使用キャラ', '1:コメント', '1:主な活動地域', '1:主なプレイ環境', '1:セイヴァー歴', '1:打ち上げ', '2:プレイヤー名', '2:使用キャラ', '2:コメント', '2:主な活動地域', '2:主なプレイ環境', '2:セイヴァー歴', '2:打ち上げ', '3:プレイヤー名', '3:使用キャラ', '3:コメント', '3:主な活動地域', '3:主なプレイ環境', '3:セイヴァー歴', '3:打ち上げ', '更新日時'];
    var rows = [];
    rows.push(rowHeader);
    for (var i = 0, len = teams.length; i < len; i++) {
      var team = teams[i];
      var columns = [];
      columns.push(team.name || '');
      columns.push(team.matching || '');
      team.members.forEach(function (member) {
        columns.push(member.name || '');
        var chara = charas[member.character];
        if (!chara) {
          chara = {
            name: ''
          };
        }
        columns.push(chara.name);
        columns.push(member.comment || '');
        columns.push(REGIONS[parseInt(member.region, 10) - 1] || '');
        columns.push(ENV[member.env] || '');
        columns.push(filterDefaultStr(member.history) || '');
        columns.push(member.after || '');
      });
      columns.push(getDateString(team.updatedAt));
      rows.push(columns);
    }

    // parse
    var lines = [];
    for (var i = 0, len = rows.length; i < len; i++) {
      lines.push('"' + rows[i].join('","') + '"');
    }
    return lines.join('\n');
  }
  function createSinglesData() {
    var rowHeader = ['プレイヤー名', '斡旋希望', '使用キャラ', 'コメント', '主な活動地域', '主なプレイ環境', 'セイヴァー歴', '打ち上げ'];
    var rows = [];
    rows.push(rowHeader);
    for (var i = 0, len = singles.length; i < len; i++) {
      var single = singles[i];
      var columns = [];
      single.members.forEach(function (member) {
        columns.push(member.name || '');
        columns.push(single.matching || '');
        var chara = charas[member.character];
        if (!chara) {
          chara = {
            name: ''
          };
        }
        columns.push(chara.name);
        columns.push(member.comment || '');
        columns.push(REGIONS[parseInt(member.region, 10) - 1] || '');
        columns.push(ENV[member.env] || '');
        columns.push(filterDefaultStr(member.history) || '');
        columns.push(member.after || '');
      });
      columns.push(getDateString(single.updatedAt));
      rows.push(columns);
    }

    // parse
    var lines = [];
    for (var i = 0, len = rows.length; i < len; i++) {
      lines.push('"' + rows[i].join('","') + '"');
    }
    return lines.join('\n');
  }
  function filterDefaultStr(str) {
    if ('選択してください' === str) {
      return '';
    } else {
      return str;
    }
  }

  // login
  $('#login-button').on('click', function (e) {
    e.preventDefault();
    if (config.adminPass === md5($('#admin-pass').val())) {
      $('.login').hide();
      $('.page').show();
    } else {
      $('.login-message').addClass('alert-danger').text('パスワードが違います').show();
    }
  });
  analytics();
});
//# sourceMappingURL=admin.js.map
