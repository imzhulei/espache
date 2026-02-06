let token = '';

async function adminFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || '请求失败');
  }
  return data;
}

function renderTable(content) {
  const newsBody = document.getElementById('newsTableBody');
  newsBody.innerHTML = content.news
    .map(
      (item) => `
      <tr>
        <td>${item.title}</td>
        <td>${item.date}</td>
        <td><button class="secondary" onclick="deleteNews(${item.id})">删除</button></td>
      </tr>
    `
    )
    .join('');

  const msgBody = document.getElementById('msgTableBody');
  msgBody.innerHTML = content.messages
    .map(
      (item) => `
      <tr>
        <td>${item.name}</td>
        <td>${item.company}</td>
        <td>${item.phone}</td>
        <td>${item.requirement}</td>
      </tr>
    `
    )
    .join('');

  const siteForm = document.getElementById('siteForm');
  siteForm.name.value = content.site.name;
  siteForm.slogan.value = content.site.slogan;
  siteForm.about.value = content.site.about;
}

async function loadAdminContent() {
  const content = await adminFetch('/api/admin/content');
  renderTable(content);
}

async function login() {
  token = document.getElementById('tokenInput').value.trim();
  const tip = document.getElementById('loginTip');
  if (!token) {
    tip.textContent = '请输入 token';
    return;
  }

  try {
    await adminFetch('/api/admin/login', { method: 'POST' });
    tip.textContent = '登录成功';
    document.getElementById('adminPanel').style.display = 'block';
    await loadAdminContent();
  } catch (error) {
    tip.textContent = error.message;
  }
}

async function deleteNews(id) {
  try {
    await adminFetch(`/api/admin/news/${id}`, { method: 'DELETE' });
    await loadAdminContent();
  } catch (error) {
    alert(error.message);
  }
}

document.getElementById('loginBtn').addEventListener('click', login);

document.getElementById('siteForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  const tip = document.getElementById('siteTip');
  try {
    const res = await adminFetch('/api/admin/site', {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    tip.textContent = res.message;
  } catch (error) {
    tip.textContent = error.message;
  }
});

document.getElementById('newsForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = Object.fromEntries(new FormData(e.target).entries());
  const tip = document.getElementById('newsTip');
  try {
    const res = await adminFetch('/api/admin/news', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    tip.textContent = res.message;
    e.target.reset();
    await loadAdminContent();
  } catch (error) {
    tip.textContent = error.message;
  }
});

window.deleteNews = deleteNews;
