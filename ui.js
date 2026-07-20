/**
 * UI描画 & Chart.js 制御モジュール
 */
const UIManager = {
  chart: null,

  // 初期化（Chart.js準備）
  initChart() {
    const ctx = document.getElementById('scoreChart').getContext('2d');
    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [{
          label: '得点差 (HOME - AWAY)',
          data: [],
          borderColor: '#ef4444',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.3,
          pointRadius: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: { grid: { color: '#e2e8f0' } }
        }
      }
    });
  },

  // イベント情報に基づいてUIを一括更新
  updateDisplay(event, allEvents, currentIndex) {
    if (!event) return;

    // 1. スコア & チーム名表示
    if (event["スコア"]) {
      document.getElementById("matchScore").textContent = event["スコア"];
    }
    if (event["ピリオド"]) {
      document.getElementById("currentPeriod").textContent = event["ピリオド"];
    }

    // 2. 最新プレーテキスト
    document.getElementById("latestPlayText").textContent = event["プレイテキスト"] || '';
    document.getElementById("latestTime").textContent = `残り ${event["ピリオド残時間"] || '--:--'}`;
    
    let playerStr = "";
    if (event["背番号1"]) playerStr += `#${event["背番号1"]} `;
    if (event["選手名1"]) playerStr += `${event["選手名1"]} `;
    if (event["チーム名"]) playerStr += `(${event["チーム名"]})`;
    document.getElementById("latestPlayer").textContent = playerStr;

    // 3. 🎯 コート上のシュート位置更新 (x, y座標の反映)
    this.updateCourtMarker(event);

    // 4. 📈 グラフのリアルタイム更新
    this.updateChart(allEvents.slice(0, currentIndex + 1));

    // 5. 履歴リストのアクティブ強調
    this.highlightHistoryItem(currentIndex);
  },

  // マーカー位置の更新
  updateCourtMarker(event) {
    const marker = document.getElementById("shotMarker");
    const areaInfo = document.getElementById("shotAreaInfo");

    if (event.x !== null && event.y !== null) {
      marker.classList.remove("hidden", "paint", "mid", "three");
      
      // クラス名設定（エリア別色分け）
      const area = event["エリア"] || "";
      if (area.includes("ペイント") || area.includes("インサイド")) {
        marker.classList.add("paint");
      } else if (area.includes("3P") || area.includes("スリー")) {
        marker.classList.add("three");
      } else {
        marker.classList.add("mid");
      }

      // CSVの座標系をパーセンテージに変換（※必要に応じて調整可能）
      // 例: x(0~100), y(0~100) と想定
      const leftPercent = Math.min(Math.max(event.x, 5), 95);
      const topPercent = Math.min(Math.max(event.y, 5), 95);

      marker.style.left = `${leftPercent}%`;
      marker.style.top = `${topPercent}%`;

      areaInfo.textContent = `エリア: ${area || '不明'} (${event["サイド"] || '中央'})`;
    } else {
      // 座標情報がないプレー（フリースローやファウル等）は非表示
      marker.classList.add("hidden");
      areaInfo.textContent = `エリア: --`;
    }
  },

  // 得点推移グラフの更新
  updateChart(eventsSoFar) {
    const labels = [];
    const diffs = [];

    eventsSoFar.forEach(e => {
      if (e["スコア"] && e["スコア"].includes("-")) {
        const [home, away] = e["スコア"].split("-").map(n => parseInt(n.trim(), 10));
        if (!isNaN(home) && !isNaN(away)) {
          labels.push(e["ピリオド残時間"]);
          diffs.push(home - away);
        }
      }
    });

    if (this.chart) {
      this.chart.data.labels = labels;
      this.chart.data.datasets[0].data = diffs;
      this.chart.update('none'); // パフォーマンスのためアニメーション無効で高速更新
    }
  },

  // 全履歴の描画
  renderHistoryList(events) {
    const container = document.getElementById("historyList");
    let html = "";
    events.forEach((e, idx) => {
      html += `
        <div class="history-item" id="history-item-${idx}">
          <strong>[${e["ピリオド"] || '1Q'} ${e["ピリオド残時間"] || ''}]</strong> 
          ${e["チーム名"] || ''} ${e["プレイテキスト"] || ''} 
          ${e["スコア"] ? `<b style="color:#ef4444;">(${e["スコア"]})</b>` : ''}
        </div>
      `;
    });
    container.innerHTML = html;
  },

  highlightHistoryItem(index) {
    document.querySelectorAll('.history-item').forEach(el => el.classList.remove('active'));
    const activeEl = document.getElementById(`history-item-${index}`);
    if (activeEl) {
      activeEl.classList.add('active');
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }
};