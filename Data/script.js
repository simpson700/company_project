   let allGames = [];
    let isHistoryOpen = false;

    // ページロード時に実行
    window.addEventListener('DOMContentLoaded', () => {
      // 1.5秒後に通知表示
      setTimeout(() => {
        const toast = document.getElementById('toastNotification');
        if (toast) toast.classList.add('show');
      }, 1500);

      // CSVデータの読み込み開始
      loadAllData();
    });

    // CSV取得＆パース処理
    async function loadAllData() {
      try {
        const gamesResponse = await fetch('events.csv');
        if (!gamesResponse.ok) {
          throw new Error('CSVファイルの取得に失敗しました');
        }
        const gamesCsv = await gamesResponse.text();
        
        // CSVテキストを配列表現に変換
        allGames = parseCSV(gamesCsv);
        console.log('取得したイベントデータ:', allGames);

        // 画面の更新（トップには最新1件のみ）
        renderUI(allGames);

      } catch (error) {
        console.error('CSVの読み込みエラー:', error);
        document.getElementById("latestPlayText").textContent = "データの読み込みに失敗しました。";
      }
    }

    // カンマ区切りCSVのパース処理
    function parseCSV(text) {
      const lines = text.trim().split(/\r?\n/);
      if (lines.length < 2) return [];

      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      return lines.slice(1).map(line => {
        // ダブルクォーテーションを考慮した簡易分割
        const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = values[i] || '';
        });
        return obj;
      });
    }

    // 画面初期描画（最新データ表示）
    function renderUI(games) {
      if (!games || games.length === 0) return;
      showLatestPlay();
    }

    // 🔥 トップ画面：最新のプレイ・得点を表示
    function showLatestPlay() {
      // スコアが存在する最後のイベントを探す
      const lastScoreEvent = [...allGames].reverse().find(g => g["スコア"] && g["スコア"].trim() !== "");
      // 最新の全イベント
      const latestEvent = allGames[allGames.length - 1];

      // チーム名と対戦名を設定（CSVに両チーム名があれば適宜変更可能）
      if (latestEvent) {
        document.getElementById("homeTeam").textContent = latestEvent["チーム名"] || "チームA";
        document.getElementById("awayTeam").textContent = "チームB";
      }

      // スコアの更新
      if (lastScoreEvent) {
        document.getElementById("matchScore").textContent = lastScoreEvent["スコア"];
      }

      // 最新プレイテキストの更新
      if (latestEvent) {
        document.getElementById("latestPlayText").textContent = latestEvent["プレイテキスト"] || "プレイデータなし";
        
        let playerInfo = "";
        if (latestEvent["背番号1"]) playerInfo += `#${latestEvent["背番号1"]} `;
        if (latestEvent["チーム名"]) playerInfo += `(${latestEvent["チーム名"]})`;
        document.getElementById("latestPlayer").textContent = playerInfo;

        if (latestEvent["残り時間"]) {
          document.getElementById("latestTime").textContent = `残り時間 ${latestEvent["残り時間"]}`;
        }
      }

      // 履歴用HTMLも裏で作っておく
      buildHistoryHTML();
    }

    // 🔘 「詳細を見る」ボタンの開閉制御
    function toggleHistory() {
      const container = document.getElementById("historyContainer");
      const btn = document.getElementById("toggleBtn");
      
      isHistoryOpen = !isHistoryOpen;
      
      if (isHistoryOpen) {
        container.classList.add("open");
        btn.textContent = "▲ 試合の流れをたたむ";
      } else {
        container.classList.remove("open");
        btn.textContent = "🏀 試合の流れ・全イベントを見る ▼";
      }
    }

    // 📜 試合の流れ（全532件等）のHTML生成
    function buildHistoryHTML() {
      let html = "";

      allGames.forEach((game, index) => {
        const hasScore = game["スコア"] && game["スコア"].trim() !== "";
        
        html += `
          <div class="game-list-item">
            <div class="game-list-item-header">
              <span>${game["チーム名"] || "イベント"} ${game["背番号1"] ? '#' + game["背番号1"] : ''}</span>
              ${hasScore ? `<span class="game-score-badge">${game["スコア"]}</span>` : ''}
            </div>
            <div>${game["プレイテキスト"] || ''}</div>
            ${game["残り時間"] ? `<div style="font-size:0.65rem; color:#94a3b8; margin-top:2px;">残り時間: ${game["残り時間"]}</div>` : ''}
          </div>
        `;
      });

      document.getElementById("historyList").innerHTML = html;
    }

    // タブ切り替え機能
    function switchTab(tabId, btnElement) {
      document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

      document.getElementById(tabId).classList.add('active');
      btnElement.classList.add('active');
    }

    // 通知を閉じる
    function closeToast() {
      const toast = document.getElementById('toastNotification');
      if (toast) toast.style.display = 'none';
    }

    // Web Share API
    function shareApp() {
      if (navigator.share) {
        navigator.share({
          title: 'Clutch Pulse | B.LEAGUE速報',
          text: '最新の試合経過・決定打ハイライトをチェック！',
          url: window.location.href,
        });
      } else {
        alert('URLをコピーしました！友達に共有しよう！');
      }
    }

    // 🎯 シュート分布をCSVから描画
function renderShotMap(games) {
  const court = document.getElementById('courtContainer');
  if (!court) return;

  // 既存マーカーをクリア
  court.querySelectorAll('.shot-marker').forEach(el => el.remove());

  // 座標があるプレー＝シュートのみ抽出
  const shots = games.filter(g => g['X座標'] && g['X座標'].trim() !== '');
  const successCodes = ['1', '3', '4']; // 成功系のアクション番号

  let made = 0;
  const sideStats = {
    left:  { total: 0, made: 0 },
    right: { total: 0, made: 0 }
  };

  shots.forEach(shot => {
    const isMade = successCodes.includes(shot['アクション1']);
    const side = shot['サイド'] === 'right' ? 'right' : 'left';
    if (isMade) made++;
    sideStats[side].total++;
    if (isMade) sideStats[side].made++;
  });

  shots.forEach(shot => {
    const x = parseFloat(shot['X座標']);
    const y = parseFloat(shot['Y座標']);
    if (isNaN(x) || isNaN(y)) return;

    const isMade = successCodes.includes(shot['アクション1']);
    const side = shot['サイド'] === 'right' ? 'right' : 'left';
    const s = sideStats[side];
    const pct = s.total ? Math.round((s.made / s.total) * 1000) / 10 : 0;

    const marker = document.createElement('div');
    marker.className = `shot-marker ${isMade ? 'success' : 'miss'}`;
    marker.style.left = `${Math.min(Math.max(x, 2), 98)}%`;
    marker.style.top = `${Math.min(Math.max(y, 2), 98)}%`;
    marker.title = `${side === 'right' ? '右サイド' : '左サイド'}：${s.total}本中${s.made}本成功（${pct}%）`;

    court.appendChild(marker);
  });

  // 統計カードを更新
  const total = shots.length;
  const pct = total ? Math.round((made / total) * 1000) / 10 : 0;
  const totalEl = document.getElementById('statTotal');
  const madeEl = document.getElementById('statMade');
  const pctEl = document.getElementById('statPct');
  if (totalEl) totalEl.textContent = total;
  if (madeEl) madeEl.textContent = made;
  if (pctEl) pctEl.textContent = `${pct}%`;
}