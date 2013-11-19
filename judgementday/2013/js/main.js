/*jshint -W100 */
// anchor links
$(document).on('click', 'a.list-group-item', function(e){
  e.preventDefault();
  var to = $($(this).attr('href')).position().top - 25;
  $('body').animate({scrollTop: to}, 300);
});


(function(){
  var SAVIOR_URL = "https://spreadsheets.google.com/feeds/list/0ApM3hVNg5vDBdDQwS3R3RlpvWHc2bUtzRHl5N1ZaLXc/od6/public/basic?alt=json&callback=?",
      SAVIOR_IMAGES_PATH = 'img/savior/',
      SAVIOR_IMAGES_FILES = {
        'アナカリス': 'img_s_anakaris_50x50.jpg',
        'オルバス': 'img_s_aulbath_50x50.jpg',
        'ビシャモン': 'img_s_bishamon_50x50.jpg',
        'バレッタ': 'img_s_bulleta_50x50.jpg',
        'デミトリ': 'img_s_demitri_50x50.jpg',
        'フェリシア': 'img_s_felicia_50x50.jpg',
        'ガロン': 'img_s_gallon_50x50.jpg',
        'ジェダ': 'img_s_jedah_50x50.jpg',
        'レイレイ': 'img_s_leilei_50x50.jpg',
        'リリス': 'img_s_lilith_50x50.jpg',
        'モリガン': 'img_s_morrigan_50x50.jpg',
        'キュービー': 'img_s_qbee_50x50.jpg',
        'サスカッチ': 'img_s_sasquatch_50x50.jpg',
        'ビクトル': 'img_s_victor_50x50.jpg',
        'ザベル': 'img_s_zabel_50x50.jpg'
      },
      HUNTER_URL = "https://spreadsheets.google.com/feeds/list/0ApM3hVNg5vDBdDQwS3R3RlpvWHc2bUtzRHl5N1ZaLXc/od7/public/basic?alt=json&callback=?",
      HUNTER_IMAGES_PATH = 'img/hunter/',
      HUNTER_IMAGES_FILES = {
        'オルバス': 'img_h_aulbath_50x50.jpg',
        'ビシャモン': 'img_h_bishamon_50x50.jpg',
        'ドノバン': 'img_h_donovan_50x50.jpg',
        'デミトリ': 'img_h_demitri_50x50.jpg',
        'フェリシア': 'img_h_felicia_50x50.jpg',
        'ガロン': 'img_h_gallon_50x50.jpg',
        'レイレイ': 'img_h_leilei_50x50.jpg',
        'モリガン': 'img_h_morrigan_50x50.jpg',
        'パイロン': 'img_h_pyron_50x50.jpg',
        'サスカッチ': 'img_h_sasquatch_50x50.jpg',
        'ビクトル': 'img_h_victor_50x50.jpg',
        'ザベル': 'img_h_zabel_50x50.jpg'
      };

  $(document).on('shown',function(){
    console.log(1);
  });
  // セイヴァー
  $('#tab-button-savior').one('click', function (e) {
    $.getJSON(SAVIOR_URL, function(data){
      if ( data && data.feed ) {
        displayToSavior(parse(data.feed.entry));
      }
    });
  });

  // ハンター
  $('#tab-button-hunter').one('click', function (e) {
    $.getJSON(HUNTER_URL, function(data){
      if ( data && data.feed ) {
        displayToHunter(parse(data.feed.entry));
      }
    });
  });

  function parse(entries) {
    var records = [];
    for ( var i = 0, len = entries.length; i < len; i++ ) {
      var cells = entries[i].content.$t.split(',');
          record = {};
      for ( var j = 0, j_len = cells.length; j < j_len; j++ ) {
        var temp = cells[j].split(':');
        record[$.trim(temp[0])] = $.trim(temp[1]);
      }
      records.push(record);
    }
    return records;
  }

  function displayToSavior(records) {
    var data = [],
        entryNo = 0;
    for ( var i = 0, len = records.length; i < len; i++ ) {
      var record = records[i];
      if ( record['公開'] !== '1' ) {
        continue;
      }
      if ( !record['チーム名'] ) {
        record['チーム名'] = '未定'; //default
      }
      if ( !record['プレイヤーネーム_2'] ) {
        record.hidden2 = 'hidden';
      }
      if ( !record['プレイヤーネーム_3'] ) {
        record.hidden3 = 'hidden';
      }
      record.chara1_img = SAVIOR_IMAGES_PATH + SAVIOR_IMAGES_FILES[record['使用キャラ']];
      record.chara2_img = SAVIOR_IMAGES_PATH + SAVIOR_IMAGES_FILES[record['使用キャラ_2']];
      record.chara3_img = SAVIOR_IMAGES_PATH + SAVIOR_IMAGES_FILES[record['使用キャラ_3']];
      record.entry_no = 'No.' + (++entryNo);
      // console.log(record);
      data.push(record);
    }
    $('#savior .loading').hide();
    $('#savior-entry-list-item').tmpl(data).appendTo('#savior-entry-list > ul');
  }

  function displayToHunter(records) {
    var data = [],
        entryNo = 0;
    for ( var i = 0, len = records.length; i < len; i++ ) {
      var record = records[i];
      if ( record['公開'] !== '1' ) {
        continue;
      }
      record.chara_img = HUNTER_IMAGES_PATH + HUNTER_IMAGES_FILES[record['使用キャラ']];
      record.entry_no = 'No.' + (++entryNo);
      // console.log(record);
      data.push(record);
    }
    $('#hunter .loading').hide();
    $('#hunter-entry-list-item').tmpl(data).appendTo('#hunter-entry-list > ul');
  }
})();

