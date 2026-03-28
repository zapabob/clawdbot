import "./paths-Chd_ukvM.js";
import "./globals-BKVgh_pY.js";
import "./theme-CWrxY1-_.js";
import "./utils-DGUUVa38.js";
import "./ansi-D3lUajt1.js";
import { t as VERSION } from "./version-yfoo3YbF.js";
import "./links-CZOLMG0R.js";
import { t as getCoreCliCommandDescriptors } from "./core-command-descriptors-DAjOR_ms.js";
import { n as getSubCliEntries } from "./subcli-descriptors-CkmfsILy.js";
import "./banner-D8_G9LpO.js";
import { t as configureProgramHelp } from "./help-DqMA6yVY.js";
import { Command } from "commander";
//#region src/cli/program/root-help.ts
function buildRootHelpProgram() {
	const program = new Command();
	configureProgramHelp(program, {
		programVersion: VERSION,
		channelOptions: [],
		messageChannelOptions: "",
		agentChannelOptions: ""
	});
	for (const command of getCoreCliCommandDescriptors()) program.command(command.name).description(command.description);
	for (const command of getSubCliEntries()) program.command(command.name).description(command.description);
	return program;
}
function outputRootHelp() {
	buildRootHelpProgram().outputHelp();
}
//#endregion
export { outputRootHelp };
