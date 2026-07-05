if (process.platform === 'win32') {
	const drive = process.cwd()[0].toLowerCase();
	const wslPath = `/mnt/${drive}${process.cwd().slice(2).replace(/\\/g, '/')}`;

	console.error(`
✖ Don't run "npm run dev" from a Windows shell.

  node_modules/better-sqlite3's native binary is built for WSL/Linux. Loading
  it from Windows node fails with ERR_DLOPEN_FAILED ("not a valid Win32
  application") on every request.

  Run the dev server inside WSL instead:

    wsl -e bash -lc 'export PATH="$HOME/.nvm/versions/node/v22.16.0/bin:$PATH" && cd ${wslPath} && npm run dev'

  ...or open a WSL terminal and run "npm run dev" there directly.
`);
	process.exit(1);
}
