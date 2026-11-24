// Tiny plugin registry. Plugins call cmd(), onMessage() or onGroupUpdate().
const commands = [];
const messageHooks = [];
const groupHandlers = [];

/**
 * cmd({ pattern, alias, desc, category, owner, group, admin, botAdmin }, async (ctx) => {})
 */
function cmd(info, run) {
  commands.push({ alias: [], category: 'misc', desc: '', ...info, run });
}
const onMessage = (fn) => messageHooks.push(fn);
const onGroupUpdate = (fn) => groupHandlers.push(fn);

const find = (name) => commands.find((c) => c.pattern === name || c.alias.includes(name));

module.exports = { cmd, onMessage, onGroupUpdate, commands, messageHooks, groupHandlers, find };
