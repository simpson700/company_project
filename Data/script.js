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
    allGames = parseCSV(gamesCsv);

    console.log('取得したイベントデータ:', allGames);

    // シュート分布を描画
    renderShotMap(allGames);

    // チームA・Bのシュート統計を更新
    renderTeamShotStats(allGames);

    // 最新プレーなどを更新
    renderUI(allGames);

  } catch (error) {
    console.error('CSVの読み込みエラー:', error);

    const latestPlayText = document.getElementById('latestPlayText');
    if (latestPlayText) {
      latestPlayText.textContent = 'データの読み込みに失敗しました。';
    }
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

  // 得点が入ったプレー（3P成功・2P成功）だけに絞り込む
    const scoringPlays = allGames.filter(game => isMadeShot(game["アクション1"]));

    scoringPlays.forEach((game) => {
      const points = getShotPoints(game["アクション1"]);
      const team = game["チーム名"] || "";
      const player = game["選手名1"] || "";

      html += `
        <div class="game-list-item">
          <div class="game-list-item-header">
            <span>${team} #${game["背番号1"] || ''} ${player}</span>
            <span class="game-score-badge">${points}点</span>
          </div>
          <div>${team}の${player}が${points}点シュート</div>
          ${game["ピリオド残時間"] ? `<div style="font-size:0.65rem; color:#94a3b8; margin-top:2px;">残り時間: ${game["ピリオド残時間"]}</div>` : ''}
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
    document.querySelectorAll('.shot-filter-btn').forEach(button => {
  button.addEventListener('click', () => {
    const filter = button.dataset.filter;

    // 選択中のボタンを切り替える
    document.querySelectorAll('.shot-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn === button);
    });

    // シュートマーカーの表示を切り替える
    document.querySelectorAll('.shot-marker').forEach(marker => {
      marker.style.display =
        filter === 'all' || marker.dataset.result === filter
          ? ''
          : 'none';
    });
  });
});

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
  const court = document.getElementById("courtContainer");
  if (!court) return;

  // 既存のシュートマーカーを削除
  court.querySelectorAll(".shot-marker").forEach(el => el.remove());

  // シュートのアクションと有効な座標を持つイベントだけ抽出
  const shots = games.filter(game => {
    const x = Number(game["X座標"]);
    const y = Number(game["Y座標"]);

    return (
      isShotAction(game["アクション1"]) &&
      game["X座標"]?.trim() !== "" &&
      game["Y座標"]?.trim() !== "" &&
      Number.isFinite(x) &&
      Number.isFinite(y)
    );
  });

  const successCodes = ["1", "3", "4"];
  let made = 0;

  shots.forEach(shot => {
    const x = Number(shot["X座標"]);
    const y = Number(shot["Y座標"]);
    const side = shot["サイド"]?.trim().toLowerCase();

    const isMade = successCodes.includes(shot["アクション1"]);
    if (isMade) made++;

    // CSV上の攻めるゴール側を基準に座標を変換
    // 左側のゴールはX≈5、右側のゴールはX≈95
    const basketX = side === "right" ? 95 : 5;
    const distance = side === "right"
      ? basketX - x
      : x - basketX;

    // ハーフコートの奥行きに変換
    const depth = Math.min(
      Math.max(distance / 45 * 100, 0),
      100
    );

    // 攻めるゴールが右側なら横方向を反転
    const courtX = side === "right" ? 100 - y : y;
    const courtY = 100 - depth;

    const marker = document.createElement("div");
    marker.className = `shot-marker ${isMade ? "success" : "miss"}`;
    marker.dataset.result = isMade ? "success" : "miss";
    // 点にチームA/Bを表示
    const teamName = shot["チーム名"] || "";
    const teamLabel = teamName.includes("チームA")
      ? "A"
      : teamName.includes("チームB")
        ? "B"
        : shot["ホームアウェイ"] === "1"
          ? "A"
          : "B";

    marker.textContent = teamLabel;
    marker.style.left = `${courtX}%`;
    marker.style.top = `${courtY}%`;

    marker.title =
      `${teamName} / ${shot["プレイテキスト"] || ""} / ` +
      `${isMade ? "成功" : "失敗"}`;

    court.appendChild(marker);
  });

  const total = shots.length;
  const pct = total
    ? Math.round((made / total) * 1000) / 10
    : 0;

  const totalEl = document.getElementById("statTotal");
  const madeEl = document.getElementById("statMade");
  const pctEl = document.getElementById("statPct");

  if (totalEl) totalEl.textContent = total;
  if (madeEl) madeEl.textContent = made;
  if (pctEl) pctEl.textContent = `${pct}%`;
}

function renderTeamShotStats(games) {
  const shots = games.filter(game => {
    const x = Number(game['X座標']);
    const y = Number(game['Y座標']);

    return (
      game['X座標']?.trim() !== '' &&
      game['Y座標']?.trim() !== '' &&
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      isShotAction(game['アクション1'])
    );
  });

  // CSVに登場するチーム名を取得
  const teams = [...new Set(
    shots
      .map(game => game['チーム名']?.trim())
      .filter(Boolean)
  )];

  function updateStats(prefix, teamName) {
  const teamShots = shots.filter(
    shot => shot['チーム名']?.trim() === teamName
  );

  const made = teamShots.filter(
    shot => isMadeShot(shot['アクション1'])
  ).length;

  const total = teamShots.length;
  const percentage = total
    ? Math.round((made / total) * 1000) / 10
    : 0;

  document.getElementById(`stat${prefix}Total`).textContent = total;
  document.getElementById(`stat${prefix}Made`).textContent = made;
  document.getElementById(`stat${prefix}Pct`).textContent =
    `${percentage}%`;
}

  // 現時点ではCSVに登場した順でA・Bに割り当てる
  if (teams[0]) updateStats('A', teams[0]);
  if (teams[1]) updateStats('B', teams[1]);

  console.log('チームA・B:', teams);
}

// アクション1から得点を判定
function getShotPoints(actionCode) {
  if (actionCode === '1') return 3;              // 3P成功
  if (actionCode === '3' || actionCode === '4') return 2; // 2P成功
  return 0;
}

function isShotAction(actionCode) {
  return ['1', '2', '3', '4', '5', '6'].includes(actionCode);
}

function isMadeShot(actionCode) {
  return ['1', '3', '4'].includes(actionCode);
}