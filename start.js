// Launcher: optionally pulls the latest code on boot, then starts the bot.
// Needed on hosts like Render where the disk resets on every restart.
const config = require('./config');

(async () => {
  if (config.AUTO_UPDATE === 'on' && config.UPDATE_REPO) {
    try {
      const updater = require('./lib/updater');
      const info = await updater.checkUpdate();
      if (info.hasUpdate) {
        console.log(`⬇️ Auto-update: installing ${info.latest.sha.slice(0, 7)} ...`);
        await updater.applyUpdate(info.latest);
        console.log('✅ Auto-update done');
      }
    } catch (e) {
      console.error('Auto-update skipped:', e.message);
    }
  }
  require('./index');
})();
