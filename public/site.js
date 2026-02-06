async function loadContent() {
  const res = await fetch('/api/public/content');
  const data = await res.json();

  document.getElementById('brandName').textContent = data.site.name;
  document.getElementById('heroTitle').textContent = data.site.slogan;
  document.getElementById('heroDesc').textContent = data.site.about;
  document.getElementById('aboutText').textContent = data.site.about;

  const serviceList = document.getElementById('serviceList');
  serviceList.innerHTML = data.services
    .map(
      (item) => `
      <article class="card">
        <h3>${item.title}</h3>
        <p class="muted">${item.description}</p>
      </article>
    `
    )
    .join('');

  const newsList = document.getElementById('newsList');
  newsList.innerHTML = data.news
    .map(
      (item) => `
      <article class="card">
        <h3>${item.title}</h3>
        <p class="muted">${item.summary}</p>
        <small class="muted">${item.date}</small>
      </article>
    `
    )
    .join('');
}

document.getElementById('messageForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const payload = Object.fromEntries(formData.entries());
  const tip = document.getElementById('msgTip');

  const res = await fetch('/api/public/message', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const result = await res.json();
  tip.textContent = result.message;
  if (res.ok) {
    e.target.reset();
  }
});

document.getElementById('year').textContent = new Date().getFullYear();
loadContent();
