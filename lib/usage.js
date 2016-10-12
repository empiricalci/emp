
exports.main = function () {
  const usage = `
  Usage:  emp COMMAND [args..]

  A package manager for science.

  Commands:
      login       Authenticates with the emprical server and stores credentials
      logout      Clear credentials
      run         Run an experiment
      data        Manage datasets
      configure   Configure directory for persisting data and workspaces
      version     Show the emp version information
  `
  console.log(usage)
}

exports.data = function () {
  const usage = `
  Usage: emp data SUBCOMMAND args

  Subcommands:
      get --dir url     Gets a directory from a url to a .zip or .tar.gz
                url     Gets a file from a url
      hash      path    Print the hash of a file or directory
  `
  console.log(usage)
}

exports.run = function () {
  const usage = `
  Usage: emp run [options] protocol [code_path]

  Options:
      -s, --save <owner/project>    Save the experiment's output to the server
      -v, --version <SHA>           Pass the commit SHA of the version.
                                    When using this option, code_path is not required.
  `
  console.log(usage)
}
