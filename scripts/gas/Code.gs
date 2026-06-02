/**
 * Code.gs - 黒猫千鶴 LP サイト管理用 Google Apps Script
 *
 * スプレッドシートに紐付けて使用する。
 * お客様がスプレッドシートを編集後、メニューから「サイトに反映」を実行すると
 * GitHub APIを通じてサイトのデータファイルを更新する。
 *
 * === 初期設定 ===
 * 1. スプレッドシートの「拡張機能→Apps Script」でこのコードを貼り付け
 * 2. Script Properties に以下を設定:
 *    - GITHUB_TOKEN: Fine-grained PAT（Contents read/write 権限）
 *    - GITHUB_REPO: "ユーザー名/リポジトリ名"（例: "pokomichan1192/lp_kuroneko"）
 *    - DRIVE_FOLDER_ID: Gallery画像用Googleドライブフォルダの ID
 */

// ========================================
// メニュー追加
// ========================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('サイト管理')
    .addItem('サイトに反映', 'publishToSite')
    .addToUi();
}

// ========================================
// メイン処理
// ========================================

function publishToSite() {
  var ui = SpreadsheetApp.getUi();

  // データ収集
  var works = getWorksJson();
  var topics = getTopicsJson();
  var gallery = getGalleryJson();
  var novels = getNovelsJson();

  // 確認ダイアログ
  var summary = '以下の内容をサイトに反映します:\n\n' +
    '・WORKS: ' + works.length + '件\n' +
    '・TOPICS: ' + topics.length + '件\n' +
    '・GALLERY: ' + gallery.items.length + '件\n' +
    '・NOVELS: ' + novels.length + '件\n';

  if (gallery.warnings.length > 0) {
    summary += '\n⚠ 警告:\n' + gallery.warnings.join('\n');
  }
  if (topics.warnings) {
    summary += '\n' + topics.warnings.join('\n');
  }

  summary += '\n\n反映しますか？';

  var response = ui.alert('確認', summary, ui.ButtonSet.YES_NO);
  if (response !== ui.Button.YES) {
    ui.alert('キャンセルしました。');
    return;
  }

  // GitHub にプッシュ
  try {
    pushFileToGitHub('data/works.json', JSON.stringify(works, null, 2), 'update: WORKS データ更新');
    pushFileToGitHub('data/topics.json', JSON.stringify(topics.data, null, 2), 'update: TOPICS データ更新');
    pushFileToGitHub('data/gallery.json', JSON.stringify(gallery.items, null, 2), 'update: GALLERY データ更新');
    pushFileToGitHub('data/novels.json', JSON.stringify(novels, null, 2), 'update: NOVELS データ更新');

    // Gallery画像の同期
    var imageResult = syncGalleryImages(gallery.items);

    var msg = 'サイトへの反映が完了しました！\n\n' +
      '数分後にサイトに反映されます。';
    if (imageResult.uploaded > 0) {
      msg += '\n画像: ' + imageResult.uploaded + '件アップロード';
    }
    if (imageResult.errors.length > 0) {
      msg += '\n\n⚠ 画像エラー:\n' + imageResult.errors.join('\n');
    }
    ui.alert('完了', msg, ui.ButtonSet.OK);
  } catch (e) {
    ui.alert('エラー', 'サイトへの反映に失敗しました:\n' + e.message, ui.ButtonSet.OK);
    Logger.log(e);
  }
}

// ========================================
// WORKS
// ========================================

function getWorksJson() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('WORKS');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var items = [];

  // 1行目はヘッダー、2行目からデータ
  for (var i = 1; i < data.length; i++) {
    var category = String(data[i][0]).trim();
    var title = String(data[i][1]).trim();
    var date = String(data[i][2]).trim();

    // 空行スキップ
    if (!category && !title) continue;

    items.push({
      category: category,
      title: title,
      date: date
    });
  }

  return items;
}

// ========================================
// TOPICS
// ========================================

function getTopicsJson() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('TOPICS');
  if (!sheet) return { data: [], warnings: [] };

  var data = sheet.getDataRange().getValues();
  var items = [];
  var warnings = [];

  for (var i = 1; i < data.length; i++) {
    var url = String(data[i][0]).trim();
    if (!url) continue;

    // URL バリデーション
    if (url.indexOf('twitter.com') === -1 && url.indexOf('x.com') === -1) {
      warnings.push('⚠ 行' + (i + 1) + ': Twitter/X以外のURLのためスキップ → ' + url);
      continue;
    }

    items.push({ tweet_url: url });
  }

  return { data: items, warnings: warnings };
}

// ========================================
// GALLERY
// ========================================

function getGalleryJson() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('GALLERY');
  if (!sheet) return { items: [], warnings: [] };

  var data = sheet.getDataRange().getValues();
  var items = [];
  var warnings = [];
  var validCategories = ['illust', 'game', 'text'];

  for (var i = 1; i < data.length; i++) {
    var filename = String(data[i][0]).trim();
    var label = String(data[i][1]).trim();
    var category = String(data[i][2]).trim();
    var link = String(data[i][3]).trim();

    // 空行スキップ
    if (!filename && !label) continue;

    // カテゴリバリデーション
    if (validCategories.indexOf(category) === -1) {
      warnings.push('⚠ 行' + (i + 1) + ': カテゴリが不正("' + category + '")のためスキップ。illust/game/text のいずれかにしてください。');
      continue;
    }

    var item = {
      image: 'img/gallery/' + filename,
      label: label,
      category: category
    };

    // linkは空でなければ追加
    if (link) {
      item.link = link;
    }

    items.push(item);
  }

  return { items: items, warnings: warnings };
}

// ========================================
// NOVELS
// ========================================

function getNovelsJson() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('NOVELS');
  if (!sheet) return [];

  var data = sheet.getDataRange().getValues();
  var items = [];

  for (var i = 1; i < data.length; i++) {
    var title = String(data[i][0]).trim();
    var link = String(data[i][1]).trim();

    // 空行スキップ
    if (!title && !link) continue;

    // URLバリデーション
    if (link && link.indexOf('https://') !== 0) {
      Logger.log('NOVELS 行' + (i + 1) + ': httpsでないURLをスキップ → ' + link);
      continue;
    }

    items.push({
      title: title,
      link: link
    });
  }

  return items;
}

// ========================================
// Gallery画像同期（Googleドライブ→GitHub）
// ========================================

function syncGalleryImages(galleryItems) {
  var result = { uploaded: 0, errors: [] };

  var folderId = PropertiesService.getScriptProperties().getProperty('DRIVE_FOLDER_ID');
  if (!folderId) {
    Logger.log('DRIVE_FOLDER_ID が未設定のため画像同期をスキップ');
    return result;
  }

  var folder;
  try {
    folder = DriveApp.getFolderById(folderId);
  } catch (e) {
    result.errors.push('Googleドライブフォルダにアクセスできません: ' + e.message);
    return result;
  }

  for (var i = 0; i < galleryItems.length; i++) {
    var item = galleryItems[i];
    var filename = item.image.replace('img/gallery/', '');

    // coming-soonはスキップ
    if (filename === 'coming-soon.png') continue;

    // ドライブ内のファイルを検索
    var files = folder.getFilesByName(filename);
    if (!files.hasNext()) continue; // ドライブにない場合はスキップ（既にGitHubにある想定）

    var file = files.next();
    var blob = file.getBlob();
    var base64Content = Utilities.base64Encode(blob.getBytes());

    try {
      pushFileToGitHub(
        'img/gallery/' + filename,
        base64Content,
        'update: Gallery画像更新 - ' + filename,
        true // isBase64
      );
      result.uploaded++;
    } catch (e) {
      result.errors.push(filename + ': ' + e.message);
    }
  }

  return result;
}

// ========================================
// GitHub API
// ========================================

function pushFileToGitHub(path, content, message, isBase64) {
  var token = PropertiesService.getScriptProperties().getProperty('GITHUB_TOKEN');
  var repo = PropertiesService.getScriptProperties().getProperty('GITHUB_REPO');

  if (!token || !repo) {
    throw new Error('GITHUB_TOKEN または GITHUB_REPO が Script Properties に設定されていません');
  }

  var apiUrl = 'https://api.github.com/repos/' + repo + '/contents/' + path;
  var headers = {
    'Authorization': 'token ' + token,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'kuroneko-cms-gas'
  };

  // 既存ファイルのSHAを取得（更新時に必要）
  var sha = null;
  try {
    var existing = UrlFetchApp.fetch(apiUrl, {
      method: 'get',
      headers: headers,
      muteHttpExceptions: true
    });
    if (existing.getResponseCode() === 200) {
      var existingData = JSON.parse(existing.getContentText());
      sha = existingData.sha;

      // 画像でない場合、内容が同じならスキップ
      if (!isBase64) {
        var existingContent = Utilities.newBlob(Utilities.base64Decode(existingData.content.replace(/\n/g, ''))).getDataAsString();
        if (existingContent.trim() === content.trim()) {
          Logger.log('変更なし、スキップ: ' + path);
          return;
        }
      }
    }
  } catch (e) {
    // ファイルが存在しない場合は新規作成
    Logger.log('新規ファイル: ' + path);
  }

  // ファイルの内容をBase64エンコード（画像は既にBase64）
  var encodedContent = isBase64 ? content : Utilities.base64Encode(Utilities.newBlob(content).getBytes());

  var payload = {
    message: message,
    content: encodedContent
  };
  if (sha) {
    payload.sha = sha;
  }

  var response = UrlFetchApp.fetch(apiUrl, {
    method: 'put',
    headers: headers,
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  var code = response.getResponseCode();
  if (code !== 200 && code !== 201) {
    throw new Error('GitHub API エラー (' + code + '): ' + response.getContentText());
  }

  Logger.log('更新完了: ' + path);
}
