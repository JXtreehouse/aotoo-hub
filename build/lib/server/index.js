const chalk = require('chalk')
const appConfigs = require('./configs')()
const { TYPE, PORT, name } = appConfigs
const isXcx = (TYPE == 'mp' || TYPE == 'ali')
const app = require('./lib')(appConfigs)

if (isXcx) {
  app.state.views = true
}
app.listen(PORT, function (err, stat) {
  if (err) console.log(err);
  const destPort = chalk.green.bold(`【${PORT}】`)
  console.log(`
  ============================
  + node-server           +
  + 服务名: ${name}       +
  + 端口: ${destPort}      +
  +===========================
      `);

  if (isXcx) {
    console.log(chalk.bold.yellow('node端已启动，请打开微信开发工具并指定项目目录'))
  }
})
