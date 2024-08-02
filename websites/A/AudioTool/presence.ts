const presence = new Presence({
		clientId: "1268936138777952379",
	}),
	getStrings = async () => {
		return presence.getStrings(
			{
				play: "general.playing",
				pause: "general.paused",
				browse: "general.browsing",
				search: "general.searchSomething",
				listen: "general.buttonListenAlong",
			},
			await presence.getSetting<string>("lang").catch(() => "en")
		);
	},
	getElement = (query: string): string | undefined => {
		let text = "";

		const element = document.querySelector(query);
		if (element) {
			if (element.childNodes[0].textContent);
		else text = element.textContent;
		}
		return text.trimStart().trimEnd();
	},
	capitalize = (text: string): string => {
		return text.charAt(0).toUpperCase() + text.slice(1);
	};

let elapsed = Math.floor(Date.now() / 1000),
prevUrl = document.location.href,
strings: Awaited<ReturnType<typeof getStrings>>,
oldLang: string = null;

const statics = {
 "/browse/": {
	details: "Browsing...",
	state: "Awesome tunes",
 },
 "/terms/": {
	details: "Viewing...",
	state: "Terms & Conditions",
 },
 "/privacy/": {
	details: "Viewing...",
	state: "Privacy policy",
 },
 "/board/faq": {
	details: "Viewing...",
	state: "FAQs",
 }

 //todo(); //i know that isn't a thing 
};

presence.on("UpdateData", async () => {
	const path = location.pathname.replace (/\/?$/, "/"),
		[
			showBrowsing,
			showSong,
			hidePaused,
			showTimestamps,
			showCover,
			showButtons,
			newLang,
		] = await Promise.all([
			presence.getSetting<boolean>("browse"),
			presence.getSetting<boolean>("song"),
			presence.getSetting<boolean>("hidePaused"),
			presence.getSetting<boolean>("timestamp"),
			presence.getSetting<boolean>("cover"),
			presence.getSetting<boolean>("buttons"),
			presence.getSetting<boolean>("lang").catch(() => "en"),
		]),

		playing = Boolean(JSON.stringify(document.querySelector("div.playbutton span")).includes("playing"))

//	const isPlayingElement = document.querySelector("div.playbutton span");
//	if(JSON.stringify(isPlayingElement).split(" ", 4)[4] == "playing") {
//		let playing = true 
//	};
	if (oldLang !== newLang || !strings) {
		oldLang = newLang;
		strings = await getStrings();
	}

	if (showSong && hidePaused && !playing && !showBrowsing)
		return presence.clearActivity();

	let presenceData: PresenceData = {
		type: ActivityType.Listening,
		largeImageKey:
			"https://files.catbox.moe/tv1wj4.jpg",
		startTimestamp: elapsed,
	};

	if (document.location.href !== prevUrl) {
		prevUrl = document.location.href;
		elapsed = Math.floor(Date.now() / 1000);
	}

	if ((playing || (!playing && !showBrowsing)) && showSong) {
		presenceData.details = document.querySelector("label .track").textContent;

		presenceData.state = document.querySelector("label .artists").textContent;

		const timePassed = document.querySelector(
			"div.progress label:nth-child(1)"
		).textContent,
		durationString = document.querySelector(
			"div.progress label:nth-child(3)"
		).textContent,
		[currentTime, duration] = [
			presence.timestampFromFormat(timePassed),
			(() => {
				if (!durationString.startsWith("-"))
					return presence.timestampFromFormat(durationString);
				else {
					return (
						presence.timestampFromFormat(durationString.slice(1)) +
						presence.timestampFromFormat(timePassed)
					);
				}
			})()
		],
		[startTimestamp, endTimestamp] = presence.getTimestamps (
			currentTime,
			duration
		),
		pathLinkSong = document.querySelector("label .track").getAttribute("href");

	presenceData.startTimestamp = startTimestamp;
	presenceData.endTimestamp = endTimestamp;

	if (showCover) {
		presenceData.largeImageKey = document.querySelector("div.cover > img").getAttribute("src")
	}
	presenceData.smallImageKey = playing ? Assets.Play : Assets.Pause;
	presenceData.smallImageText = strings[playing ? "play" : "pause"];

	if (showButtons) {
		presenceData.buttons = [
			{
				label: strings.listen,
				url: `htps://audiotool.com${pathLinkSong}`,
			},
		];
	 }
	} else if ((!playing || !showSong) && showBrowsing) {
		for (const [k, v] of Object.entries(statics))
			if (path.match(k)) presenceData = { ...presenceData, ...v};

	if (path === "/") {
		presenceData.details = "Browsing...";
		presenceData.state = "Home";
	} else if (path.includes("/browse/tracks/popular/")) {
		presenceData.details = "Browsing Top Songs...";

		const [heading] = "Popular Songs";
	}

	const username = document.querySelector("nav ul:nth-child(1) li a").textContent;
	}

	if (presenceData.details && typeof presenceData.details === "string") {
		if (presenceData.details.match("(Browsing|Viewing|Discovering)")) {
			presence.smallImageKey = Assets.Reading;
			presence.smallImageText = strings.browse;
		} else if (presenceData.details.match("(Searching)")) {
			presenceData.smallImageKey = Assets.Search;
			presenceData.smallImageText = strings.search;
		}

		presence.setActivity(presenceData);
	} else presence.setActivity();
});