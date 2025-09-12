export class LogoSystem {
	private headerLogo: HTMLImageElement | null = null
	private winLogo: HTMLImageElement | null = null

	constructor() {
		this.headerLogo = document.getElementById('game-logo') as HTMLImageElement
		this.winLogo = document.getElementById('win-logo') as HTMLImageElement
	}

	setLogo(src: string) {
		if (this.headerLogo) this.headerLogo.src = src
		if (this.winLogo) this.winLogo.src = src
	}

	showHeader(show: boolean) {
		if (this.headerLogo) this.headerLogo.style.display = show ? 'inline-block' : 'none'
	}

	showWin(show: boolean) {
		if (this.winLogo) this.winLogo.style.display = show ? 'block' : 'none'
	}
}
