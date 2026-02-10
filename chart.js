new radarChart(ctx, {
  type: "radar",
  data,
  options: {
    responsive: true,
    maintainAspectRatio: false, // ← これ必須
    scales: {
      r: {
        min: 0,
        max: 500,
        ticks: { display: false }
      }
    },
    plugins: {
      legend: { display: false }
    }
  }
});
