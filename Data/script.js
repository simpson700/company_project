/**
 * クラッチパルス メインコントロールスクリプト
 */
let currentIndex = 0;
let isPlaying = false;
let playInterval = null;

// ドム読み込み完了時の処理
window.addEventListener('DOMContentLoaded', async () => {
  UIManager.initChart();

  // CSVファイルの読み込み
  const events = await CSVManager.loadCSV('events.csv');

  if (events.length > 0) {
    // 自動でホーム・アウェイチーム名を取得して設定
    setupTeams(events);

    // 履歴リストの初期生成
    UIManager.renderHistoryList(events);

    // 初期表示（最新イベント）
    currentIndex = events.length - 1;
    UIManager.updateDisplay(events[currentIndex], events, currentIndex);

    showToast("🏀 試合データを正常にロードしました");
  } else {
    showToast("⚠️ CSVデータのロードに失敗しました");
  }

  // イベントリスナーの登録
  document.getElementById("btnPlay").addEventListener("click", togglePlayback);
  document.getElementById("btnReset").addEventListener("click", resetPlayback);
});

// チーム名の自動抽出
function setupTeams(events) {
  const teams = [...new Set(events.map(e => e["チーム名"]).filter(Boolean))];
  if (teams.length >= 2) {
    document.getElementById("homeTeam").textContent = teams[0];
    document.getElementById("awayTeam").textContent = teams[1];
  } else if (teams.length === 1) {
    document.getElementById("homeTeam").textContent = teams[0];
  }
}

// 時系列再生 / 停止の切り替え
function togglePlayback() {
  const btn = document.getElementById("btnPlay");
  
  if (isPlaying) {
    // 停止処理
    clearInterval(playInterval);
    isPlaying = false;
    btn.textContent = "▶ 再生を再開";
    btn.style.backgroundColor = "#ef4444";
  } else {
    // 最後まで行っていたら最初に戻す
    if (currentIndex >= CSVManager.events.length - 1) {
      currentIndex = 0;
    }
    
    isPlaying = true;
    btn.textContent = "⏸ 一時停止";
    btn.style.backgroundColor = "#475569";

    const speed = parseInt(document.getElementById("playSpeed").value, 10);
    
    playInterval = setInterval(() => {
      if (currentIndex < CSVManager.events.length) {
        UIManager.updateDisplay(CSVManager.events[currentIndex], CSVManager.events, currentIndex);
        currentIndex++;
      } else {
        clearInterval(playInterval);
        isPlaying = false;
        btn.textContent = "▶ 最初から再生";
        btn.style.backgroundColor = "#ef4444";
      }
    }, speed);
  }
}

// リセット処理
function resetPlayback() {
  if (isPlaying) togglePlayback();
  currentIndex = 0;
  UIManager.updateDisplay(CSVManager.events[0], CSVManager.events, 0);
}

// 履歴の開閉
function toggleHistory() {
  const container = document.getElementById("historyContainer");
  const btn = document.getElementById("toggleBtn");
  const isOpen = container.classList.toggle("open");
  
  btn.textContent = isOpen ? "▲ 隠す" : "📜 全イベント・時系列を見る ▼";
}

// トースト通知の表示
function showToast(msg) {
  const toast = document.getElementById("toastNotification");
  document.getElementById("toastContent").innerHTML = `<strong>${msg}</strong>`;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 3000);
}

function closeToast() {
  document.getElementById("toastNotification").classList.remove("show");
}