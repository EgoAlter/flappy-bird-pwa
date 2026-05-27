const Api = (() => {

  async function postScore(player, score) {
    const response = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ player, score }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${response.status}`);
    }

    return response.json();  // resolves to the saved score object
  }

  async function getLeaderboard(limit = 10) {
    const response = await fetch(`/api/leaderboard?limit=${limit}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();  // resolves to array of score objects
  }

  return { postScore, getLeaderboard };

})();