// Updates the bot from YOUR GitHub repo (UPDATE_REPO). No git binary needed:
// downloads the tarball via the GitHub API, extracts it with `tar`, copies it
// over the app, and rolls back if anything fails. sessions/, data/ and .env
// are never touched.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const axios = require('axios');
const config = require('../config');

const root = path.join(__dirname, '..');
const versionFile = path.join(root, 'data', 'version.json');
const PROTECTED = new Set(['sessions', 'data', 'node_modules', '.git', '.env']);

const run = (cmd, args, opts = {}) =>
  new Promise((resolve, reject) =>
    execFile(cmd, args, { timeout: 300000, maxBuffer: 10 * 1024 * 1024, ...opts }, (err, out, errOut) =>
      err ? reject(new Error(String(errOut || err.message).slice(0, 300))) : resolve(out)
    )
  );

function validate() {
  const { UPDATE_REPO: repo, UPDATE_BRANCH: branch } = config;
  if (!repo) throw new Error('UPDATE_REPO is not set (format: owner/repo)');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('UPDATE_REPO must look like owner/repo');
  if (!/^[\w./-]+$/.test(branch)) throw new Error('UPDATE_BRANCH has invalid characters');
}

const headers = () => ({
  'User-Agent': 'poundz-md-updater',
  Accept: 'application/vnd.github+json',
  ...(config.GITHUB_TOKEN ? { Authorization: `Bearer ${config.GITHUB_TOKEN}` } : {}),
});

function currentSha() {
  try { return JSON.parse(fs.readFileSync(versionFile, 'utf8')).sha; }
  catch { return process.env.RENDER_GIT_COMMIT || null; }
}

// only dependency fields count: a version bump alone must not trigger npm install
const depsOf = (text) => {
  try {
    const p = JSON.parse(text);
    return JSON.stringify([p.dependencies || {}, p.optionalDependencies || {}, p.overrides || {}]);
  } catch { return text; }
};

function localVersion() {
  try { return JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version || null; }
  catch { return null; }
}

// version in the repo's package.json at a given commit (null if it can't be read)
async function remoteVersion(sha) {
  try {
    const { data } = await axios.get(
      `https://api.github.com/repos/${config.UPDATE_REPO}/contents/package.json?ref=${sha}`,
      { headers: { ...headers(), Accept: 'application/vnd.github.raw+json' }, timeout: 20000, transformResponse: (r) => r }
    );
    return (typeof data === 'string' ? JSON.parse(data) : data).version || null;
  } catch { return null; }
}

async function latest() {
  validate();
  const { data } = await axios.get(
    `https://api.github.com/repos/${config.UPDATE_REPO}/commits/${config.UPDATE_BRANCH}`,
    { headers: headers(), timeout: 20000 }
  );
  return { sha: data.sha, message: (data.commit?.message || '').split('\n')[0] };
}

async function checkUpdate() {
  const l = await latest();
  const current = currentSha();
  const hasUpdate = l.sha !== current;
  return {
    hasUpdate, current, latest: l,
    currentVersion: localVersion(),
    latestVersion: hasUpdate ? await remoteVersion(l.sha) : null,
  };
}

// copy `from` into `to`, skipping protected folders and symlinks
function copyTree(from, to) {
  fs.cpSync(from, to, {
    recursive: true,
    force: true,
    filter: (src) => {
      const rel = path.relative(from, src);
      if (!rel) return true;
      if (PROTECTED.has(rel.split(path.sep)[0])) return false;
      return !fs.lstatSync(src).isSymbolicLink();
    },
  });
}

async function applyUpdate(target) {
  target = target || (await latest());
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'poundz-'));
  const src = path.join(tmp, 'src');
  const backup = path.join(tmp, 'backup');
  fs.mkdirSync(src);
  fs.mkdirSync(backup);

  try {
    const res = await axios.get(
      `https://api.github.com/repos/${config.UPDATE_REPO}/tarball/${target.sha}`,
      { headers: headers(), responseType: 'arraybuffer', timeout: 120000, maxContentLength: 100 * 1024 * 1024 }
    );
    const tgz = path.join(tmp, 'update.tgz');
    fs.writeFileSync(tgz, Buffer.from(res.data));
    await run('tar', ['-xzf', tgz, '-C', src, '--strip-components=1']);

    // sanity check: must look like this project
    for (const f of ['package.json', 'index.js', 'start.js']) {
      if (!fs.existsSync(path.join(src, f))) throw new Error(`downloaded repo has no ${f}, refusing to install`);
    }

    const oldVersion = localVersion();
    const oldPkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
    copyTree(root, backup); // snapshot for rollback

    try {
      copyTree(src, root);
      const newPkg = fs.readFileSync(path.join(root, 'package.json'), 'utf8');
      const depsChanged = depsOf(oldPkg) !== depsOf(newPkg);
      if (depsChanged) await run('npm', ['install', '--omit=dev', '--no-audit', '--no-fund'], { cwd: root });

      fs.mkdirSync(path.dirname(versionFile), { recursive: true });
      fs.writeFileSync(versionFile, JSON.stringify({ sha: target.sha, at: new Date().toISOString() }));
      return { sha: target.sha, message: target.message, depsInstalled: depsChanged, oldVersion, newVersion: localVersion() };
    } catch (e) {
      copyTree(backup, root); // roll back
      throw new Error(`${e.message} (rolled back)`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

module.exports = { checkUpdate, applyUpdate, currentSha, localVersion };
