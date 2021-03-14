const { Plugin } = require('powercord/entities');
const { inject, uninject } = require('powercord/injector');
const { FluxDispatcher, getModule, React } = require('powercord/webpack');
const settings = require('./settings');
function cloneState(channel) {
	return channel ? Object.assign({}, getModule(['getVoiceStates'], false).getVoiceStatesForChannel(channel)) : {};
}

module.exports = class VoiceEvents extends Plugin {
	constructor() {
		super();
		this.callback = this.onChange.bind(this);
		this.defaults = {
			voice: null,
			volume: 100,
			join: '$user joined $channel',
			leave: '$user left $channel',
			selfJoin: 'You joined $channel',
			selfMove: 'You were moved to $channel',
			selfLeave: 'You left $channel',
			privateCall: 'The call',
		};
	}
	startPlugin() {
		const voices = speechSynthesis.getVoices();
		if (voices.length === 0) return this.error('Unable to find any speech synthesis voices.');
		else this.defaults.voice = speechSynthesis.getVoices().filter(voice => voice.default)[0].name;
		powercord.api.settings.registerSettings(this.entityID, {
			category: this.entityID,
			label: 'Voice Events',
			render: settings,
		});
		this.settings.get('volume', this.settings.set('volume', this.defaults.volume));
		this.settings.get('join', this.settings.set('join', this.defaults.join));
		this.settings.get('leave', this.settings.set('leave', this.defaults.leave));
		this.settings.get('selfJoin', this.settings.set('selfJoin', this.defaults.selfJoin));
		this.settings.get('selfMove', this.settings.set('selfMove', this.defaults.selfMove));
		this.settings.get('selfLeave', this.settings.set('selfLeave', this.defaults.selfLeave));
		this.settings.get('privateCall', this.settings.set('privateCall', this.defaults.privateCall));
		this.settings.get('voice', this.settings.set('voice', this.defaults.voice));

		const { getVoiceChannelId } = getModule(['getLastSelectedChannelId'], false),
			{ getChannel } = getModule(['getChannel'], false);
		this.state = cloneState(getChannel(getVoiceChannelId()));
		FluxDispatcher.subscribe('VOICE_STATE_UPDATE', this.callback);
	}
	onChange(event) {
		const { getVoiceChannelId } = getModule(['getLastSelectedChannelId'], false);
		const { getChannel } = getModule(['getChannel'], false);
		const { getUser, getCurrentUser } = getModule(['getCurrentUser'], false);
		const { getMember } = getModule(['getMember'], false);
		const setting = powercord.api.settings._fluxProps('voice-events').settings;
		const { userId, channelId } = event;

		if (userId === getCurrentUser().id) {
			if (!channelId) {
				const channel = getChannel(this.state[userId].channelId);
				const message = setting.selfLeave
					.replace('$user', (channel.type !== 1 && channel.type !== 3 && getMember(channel.guild_id, userId).nick) || getCurrentUser().username)
					.replace('$username', getCurrentUser().username)
					.replace('$channel', channel.type === 1 || channel.type === 3 ? this.defaults.privateCall : channel.name);
				speak(message, setting);
				this.state = {};
			} else {
				const channel = getChannel(channelId);
				if (!this.state[userId]) {
					const message = setting.selfJoin
						.replace('$user', (channel.type !== 1 && channel.type !== 3 && getMember(channel.guild_id, userId).nick) || getCurrentUser().username)
						.replace('$username', getCurrentUser().username)
						.replace('$channel', channel.type === 1 || channel.type === 3 ? this.defaults.privateCall : channel.name);
					speak(message, setting);
					this.state = cloneState(channelId);
				} else if (channel.type !== 1 && channel.type !== 3 && this.state[userId] && this.state[userId].channelId !== channelId) {
					const message = setting.selfMove
						.replace('$user', (channel.type !== 1 && channel.type !== 3 && getMember(channel.guild_id, userId).nick) || getCurrentUser().username)
						.replace('$username', getCurrentUser().username)
						.replace('$channel', channel.type === 1 || channel.type === 3 ? this.defaults.privateCall : channel.name);
					speak(message, setting);
					this.state = cloneState(channelId);
				}
			}
		} else {
			const channel = getChannel(getVoiceChannelId());
			if (channel) {
				const prev = this.state[userId];
				if (channelId === channel.id && !prev) {
					const message = setting.join
						.replace('$user', (channel.type !== 1 && channel.type !== 3 && getMember(channel.guild_id, userId).nick) || getUser(userId).username)
						.replace('$username', getCurrentUser().username)
						.replace('$channel', channel.type === 1 || channel.type === 3 ? this.defaults.privateCall : channel.name);
					speak(message, setting);
					this.state = cloneState(channelId);
				} else if (channelId !== channel.id && prev) {
					const message = setting.leave
						.replace('$user', (channel.type !== 1 && channel.type !== 3 && getMember(channel.guild_id, userId).nick) || getUser(userId).username)
						.replace('$username', getCurrentUser().username)
						.replace('$channel', channel.type === 1 || channel.type === 3 ? this.defaults.privateCall : channel.name);
					speak(message, setting);
					this.state = cloneState(channelId);
				}
			}
		}
	}
	pluginWillUnload() {
		powercord.api.settings.unregisterSettings(this.entityID);
		FluxDispatcher.unsubscribe('VOICE_STATE_UPDATE', this.callback);
	}
};

function speak(msg, setting) {
	const voices = speechSynthesis.getVoices();
	if (voices === 0) {
		return this.error('There is no speechSynthesis voices found!');
	}
	const utterance = new SpeechSynthesisUtterance(msg);
	utterance.voice = voices.find(e => e.name === setting.voice);
	utterance.volume = setting.volume / 100;
	speechSynthesis.speak(utterance);
}
