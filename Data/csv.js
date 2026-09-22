/**
 * CSVパース & データ管理モジュール
 */
const CSVManager = {
  events: [],

  // CSVファイル読み込み関数
  async loadCSV(filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok) throw new Error('CSV読み込み失敗');
      const text = await response.text();
      this.events = this.parseCSV(text);
      return this.events;
    } catch (error) {
      console.error("CSVエラー:", error);
      return [];
    }
  },

  // ダブルクォーテーション対応CSVパース
  parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    return lines.slice(1).map((line, index) => {
      const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
      const obj = { id: index };
      
      headers.forEach((header, i) => {
        obj[header] = values[i] || '';
      });

      // 座標数値をキャスト
      obj.x = parseFloat(obj["X座標"]) || null;
      obj.y = parseFloat(obj["Y座標"]) || null;
      
      return obj;
    });
  }
};