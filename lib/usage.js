
exports.main = function () {
  const usage = `
  Usage:  emp COMMAND [ARG..]

  A package manager for science.

  Commands:
      login       Authenticates with the emprical server and stores credentials
      logout      Clear credentials
      run         Run an experiment
      push        Push experiment results to the web dashboard
      data        Manage datasets
      configure   Configure directory for persisting data and workspaces
      version     Show the emp version information
  `
  console.log(usage)
}

exports.data = function () {
  const usage = `
  Usage: emp data SUBCOMMAND ARG

  Subcommands:
      get --dir url     Gets a directory from a url to a .zip or .tar.gz
                url     Gets a file from a url
      hash      path    Print the hash of a file or directory
  `
  console.log(usage)
}

exports.run = function () {
  const usage = `
  Usage: emp run PROTOCOL (CODE_PATH | GIT_URL | EMPIRICALCI_URL)
  `
  console.log(usage)
}

exports.push = function () {
  const usage = `
  Usage: emp push [OPTIONS] EXPERIMENT_REPORT PROJECT

  Options:
      -f    Create a project if it doesn't exists
  `
  console.log(usage)
}
