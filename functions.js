const fs = require('fs-extra')

function getDirectories(source) {
    return (fs.readdirSync(source, { withFileTypes: true })).filter(dirent => dirent.isDirectory()).map(dirent => dirent.name)
}
module.exports = { getDirectories }