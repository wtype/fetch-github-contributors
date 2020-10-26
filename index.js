const image = document.querySelector('#background');
const form = document.querySelector('form');

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = url;
    image.onload = resolve;
    image.onerror = reject;
  });
}

function loadImage() {
  const { src } = image.dataset;
  fetchImage(src).then(() => {
    image.src = src;
    image.classList.remove('blur');
  });
}

async function useFetch(url) {
  try {
    const data = await fetch(url);
    return await data.json();
  } catch (error) {
    alert(`Error: ${error.message}`);
  }
}

async function getAllRepositories(organization) {
  const repositories = [];
  const url = `https://api.github.com/orgs/${organization}/repos`;
  const repos = await useFetch(url);

  repos.forEach((repo) => {
    repositories.push(repo.name);
  });

  return repositories;
}

const getAllUrls = (organization, repositories) =>
  repositories.map((repo) => `https://api.github.com/repos/${organization}/${repo}/contributors`);

async function getAllContributors(urls) {
  const contributors = {};
  const promises = await Promise.all(urls.map(useFetch));

  promises.forEach((list) => {
    list.forEach((contributor) => {
      const { id, login, avatar_url: avatar, url } = contributor;
      if (login.includes('dependabot')) return;
      contributors[`${id}`] = `${login}|${avatar}|${url}`;
    });
  });

  return contributors;
}

function createElements(contributors) {
  const contributorsArea = document.querySelector('[data-area="contributors"]');
  Object.values(contributors).forEach((contributor) => {
    const [user, avatar, url] = contributor.split('|');

    const a = document.createElement('a');
    a.classList.add('contributor');
    a.href = url;

    const image = new Image();
    image.src = avatar;
    image.alt = user;

    const title = document.createElement('span');
    title.innerText = user;

    a.appendChild(image);
    a.appendChild(title);

    contributorsArea.appendChild(a);
  });
}

async function gatherData(organization) {
  const repositories = await getAllRepositories(organization);
  const urls = getAllUrls(organization, repositories);
  const contributors = await getAllContributors(urls);
  console.log('contributors', contributors);

  return contributors;
}

function isValidUrl(string) {
  try {
    new URL(string);
  } catch (_) {
    return false;
  }

  return true;
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const data = new FormData(form);
  const url = data.get('url');

  if (isValidUrl(url)) {
    const typeURL = new URL(url);
    if (typeURL.origin !== 'https://github.com') {
      alert('Please enter a Github Organization URL');
      return;
    }

    let organization = typeURL.pathname.slice(1);

    if ([...organization][organization.length - 1] === '/') {
      organization = typeURL.pathname.slice(1, -1);
    }

    gatherData(organization)
      .then(createElements)
      .catch((error) => alert(`Error: ${error.message}`));
  } else {
    alert('Please enter a valid URL');
    return;
  }
});

window.onload = loadImage;
